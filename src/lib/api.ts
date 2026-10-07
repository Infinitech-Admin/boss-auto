// lib/api.ts

// All requests go to our own Next.js origin, through the Route Handler at
// app/api/proxy/[...path]/route.ts. That handler forwards them to Laravel
// (using the server-only LARAVEL_API_URL env var), so the browser only ever
// talks to one origin and CORS never comes into play.
//
//   /api/proxy/login                -> {LARAVEL_API_URL}/api/login
//   /api/proxy/sanctum/csrf-cookie  -> {LARAVEL_API_URL}/sanctum/csrf-cookie
const API_BASE = "/api/proxy";

/**
 * Origin that vehicle media paths (e.g. "/storage/vehicles/images/x.jpg")
 * are resolved against. <img>/<video> tags aren't subject to CORS, so media
 * still loads straight from Laravel. Safe to use in client components
 * because it comes from a NEXT_PUBLIC_ variable.
 */
export const MEDIA_BASE_URL =
  process.env.NEXT_PUBLIC_MEDIA_URL ||
  process.env.NEXT_PUBLIC_API_URL ||
  (process.env.NODE_ENV === "production" ? "" : "http://localhost:8000");
export interface ApiError extends Error {
  status?: number;
  errors?: Record<string, string[]> | null;
}

/** True when a request was cancelled via AbortController. */
export function isAbortError(err: unknown): boolean {
  return (
    typeof err === "object" &&
    err !== null &&
    (err as { name?: string }).name === "AbortError"
  );
}

/**
 * Reads a cookie by name. The only cookie we ever read here is
 * XSRF-TOKEN, which Laravel deliberately leaves non-httpOnly so the SPA
 * can echo it back as an anti-CSRF header. The actual auth session cookie
 * is httpOnly and is never touched by this code — the browser attaches it
 * automatically on every request because we pass credentials: "include".
 */
function getCookie(name: string): string | null {
  if (typeof document === "undefined") return null;
  const match = document.cookie.match(new RegExp(`(?:^|; )${name}=([^;]*)`));
  return match ? decodeURIComponent(match[1]) : null;
}

/**
 * Vehicle images/videos come back from the API as paths relative to the
 * API's own origin (e.g. "/storage/vehicles/images/xyz.jpg", from Laravel's
 * Storage::url()). Since the frontend and API run on different
 * hosts/ports, those relative paths resolve against the wrong origin if
 * rendered as-is.
 *
 * This takes `base` as an argument rather than reading an env var itself,
 * on purpose: it lets a Server Component read a plain (non-NEXT_PUBLIC_)
 * env var like LARAVEL_API_URL on the server and pass the resolved string
 * down as a prop, instead of requiring the value to be exposed to the
 * client bundle.
 */
export function resolveMediaUrl(
  path: string | null | undefined,
  base: string,
): string {
  if (!path) return "";
  if (/^(https?:)?\/\//i.test(path) || path.startsWith("data:")) return path;
  return `${base}${path.startsWith("/") ? "" : "/"}${path}`;
}

async function ensureCsrfCookie(): Promise<void> {
  await fetch(`${API_BASE}/sanctum/csrf-cookie`, {
    credentials: "include",
  });
}

type HttpMethod = "GET" | "POST" | "PUT" | "PATCH" | "DELETE";

interface ApiRequestOptions {
  method?: HttpMethod;
  body?: unknown;
  headers?: HeadersInit;
  signal?: AbortSignal;
}

/**
 * Central fetch wrapper. Never reads or writes localStorage/sessionStorage
 * — auth state lives entirely in the httpOnly session cookie set by the
 * API, and CSRF protection lives in the (non-httpOnly, by design) XSRF
 * cookie mirrored back as a header below.
 */
export async function apiRequest<T = unknown>(
  path: string,
  { method = "GET", body, headers, signal }: ApiRequestOptions = {},
): Promise<T> {
  const isUnsafeMethod = ["POST", "PUT", "PATCH", "DELETE"].includes(method);

  if (isUnsafeMethod) {
    await ensureCsrfCookie();
  }

  const xsrfToken = getCookie("XSRF-TOKEN");

  const response = await fetch(`${API_BASE}${path}`, {
    method,
    credentials: "include",
    signal,
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
      ...(xsrfToken ? { "X-XSRF-TOKEN": xsrfToken } : {}),
      ...headers,
    },
    body: body ? JSON.stringify(body) : undefined,
  });

  let data: any = null;
  try {
    data = await response.json();
  } catch {
    data = null;
  }

  if (!response.ok) {
    const error = new Error(
      data?.message || "Something went wrong. Please try again.",
    ) as ApiError;
    error.status = response.status;
    error.errors = data?.errors || null;
    throw error;
  }

  return data as T;
}

export interface LoginPayload {
  email: string;
  password: string;
  remember?: boolean;
}

export interface RegisterPayload {
  name: string;
  phone?: string;
  email: string;
  password: string;
  password_confirmation: string;
}

export interface RegisterResponse {
  verification_email: string;
  [key: string]: unknown;
}

export interface VerifyEmailPayload {
  email: string;
  code: string;
}

export interface ResendVerificationPayload {
  email: string;
}

export interface ResendVerificationResponse {
  message?: string;
  [key: string]: unknown;
}

export interface AuthUser {
  id: number;
  name: string;
  email: string;
  phone: string | null;
  role: string;
}

export interface LoginResponse {
  user?: AuthUser;
  [key: string]: unknown;
}

export const login = (payload: LoginPayload) =>
  apiRequest<LoginResponse>("/login", { method: "POST", body: payload });

export const register = (payload: RegisterPayload) =>
  apiRequest<RegisterResponse>("/register", { method: "POST", body: payload });

export const verifyEmail = (payload: VerifyEmailPayload) =>
  apiRequest("/verify-email", { method: "POST", body: payload });

export const resendVerification = (payload: ResendVerificationPayload) =>
  apiRequest<ResendVerificationResponse>("/resend-verification", {
    method: "POST",
    body: payload,
  });

export const logout = () => apiRequest("/logout", { method: "POST" });

export interface MeResponse {
  user: AuthUser;
}

export const fetchMe = (options?: { signal?: AbortSignal }) =>
  apiRequest<MeResponse>("/me", { method: "GET", signal: options?.signal });

// ---- Vehicles ----

export interface GalleryMediaItem {
  id?: number;
  type: "image" | "video";
  src: string;
  alt?: string | null;
  poster?: string | null;
  length?: "short" | "long" | null;
  duration?: string | null;
}

export interface Vehicle {
  id: number;
  name: string;
  year: string;
  type: string;
  mileage: string;
  mileage_km: number;
  engine: string;
  horsepower: string;
  transmission: string;
  price: string;
  price_value: number;
  location: string;
  fuel: string;
  badge: string | null;
  description: string | null;
  stock: number;
  status: "available" | "reserved" | "sold";
  image: string | null;
  galleryMedia: GalleryMediaItem[];
  created_at: string;
  updated_at: string;
}

export interface VehiclePayload {
  name: string;
  year: string;
  type: string;
  mileage_km: number;
  engine: string;
  horsepower: string;
  transmission: string;
  price: number;
  location: string;
  fuel: string;
  badge?: string;
  description?: string;
  stock: number;
  status: "available" | "reserved" | "sold";
  image_path?: string | null;
}

// ---- Vehicles (public, used by the storefront) ----
// Adjust these two paths if your routes/api.php uses different ones.

export const fetchVehicles = (options?: { signal?: AbortSignal }) =>
  apiRequest<{ data: Vehicle[] }>("/vehicles", { signal: options?.signal });
export const fetchSoldVehicles = (options?: { signal?: AbortSignal }) =>
  apiRequest<{ data: Vehicle[] }>("/vehicles/sold", {
    signal: options?.signal,
  });
export const fetchVehicle = (
  id: string | number,
  options?: { signal?: AbortSignal },
) =>
  apiRequest<{ data: Vehicle }>(`/vehicles/${id}`, {
    signal: options?.signal,
  });

// ---- Vehicles (admin CRUD) ----

export const fetchAdminVehicles = (params?: {
  search?: string;
  status?: string;
}) => {
  const query = new URLSearchParams();
  if (params?.search) query.set("search", params.search);
  if (params?.status) query.set("status", params.status);
  const qs = query.toString();
  return apiRequest<{ data: Vehicle[] }>(
    `/admin/vehicles${qs ? `?${qs}` : ""}`,
  );
};

export const createVehicle = (payload: VehiclePayload) =>
  apiRequest<{ data: Vehicle }>("/admin/vehicles", {
    method: "POST",
    body: payload,
  });

export const updateVehicle = (id: number, payload: VehiclePayload) =>
  apiRequest<{ data: Vehicle }>(`/admin/vehicles/${id}`, {
    method: "PUT",
    body: payload,
  });

export const deleteVehicle = (id: number) =>
  apiRequest(`/admin/vehicles/${id}`, { method: "DELETE" });

export const addVehicleMedia = (
  vehicleId: number,
  payload: {
    type: "image" | "video";
    path: string;
    poster_path?: string;
    alt?: string;
    length?: "short" | "long";
    duration?: string;
  },
) =>
  apiRequest<{ media: GalleryMediaItem }>(
    `/admin/vehicles/${vehicleId}/media`,
    { method: "POST", body: payload },
  );

export const deleteVehicleMedia = (vehicleId: number, mediaId: number) =>
  apiRequest(`/admin/vehicles/${vehicleId}/media/${mediaId}`, {
    method: "DELETE",
  });

// ---- Chunked uploads (safe for 500MB+ video files) ----

// 4MB per chunk: uploads now pass through a Next.js Route Handler, and hosts
// like Vercel reject request bodies over ~4.5MB.
const CHUNK_SIZE = 4 * 1024 * 1024;

async function apiUpload<T = unknown>(
  path: string,
  formData: FormData,
): Promise<T> {
  await ensureCsrfCookie();
  const xsrfToken = getCookie("XSRF-TOKEN");

  const response = await fetch(`${API_BASE}${path}`, {
    method: "POST",
    credentials: "include",
    headers: {
      Accept: "application/json",
      ...(xsrfToken ? { "X-XSRF-TOKEN": xsrfToken } : {}),
      // No Content-Type here — the browser sets the multipart boundary.
    },
    body: formData,
  });

  let data: any = null;
  try {
    data = await response.json();
  } catch {
    data = null;
  }

  if (!response.ok) {
    const error = new Error(data?.message || "Upload failed.") as ApiError;
    error.status = response.status;
    error.errors = data?.errors || null;
    throw error;
  }

  return data as T;
}

export type UploadFolder =
  | "vehicles/images"
  | "vehicles/videos"
  | "vehicles/posters"
  | "blog/images"
  | "blog/videos";

/**
 * Uploads a file in fixed-size chunks so large videos never hit PHP's
 * per-request upload_max_filesize/post_max_size limits, and so a flaky
 * connection only has to retry one small chunk instead of the whole
 * file. Reports 0–100 progress via onProgress.
 *
 * Field names below are dictated by UploadController@chunk /
 * UploadController@complete on the Laravel side — keep them in sync:
 *   chunk:    identifier, index, total, chunk
 *   complete: identifier, filename, folder, total
 */
export async function uploadFileInChunks(
  file: File,
  folder: UploadFolder,
  onProgress?: (percent: number) => void,
): Promise<{ path: string; url: string }> {
  const identifier = crypto.randomUUID();
  const totalChunks = Math.max(1, Math.ceil(file.size / CHUNK_SIZE));

  for (let i = 0; i < totalChunks; i++) {
    const start = i * CHUNK_SIZE;
    const end = Math.min(file.size, start + CHUNK_SIZE);
    const chunk = file.slice(start, end);

    const formData = new FormData();
    formData.append("identifier", identifier);
    formData.append("index", String(i));
    formData.append("total", String(totalChunks));
    formData.append("chunk", chunk, file.name);

    await apiUpload("/admin/uploads/chunk", formData);
    onProgress?.(Math.round(((i + 1) / totalChunks) * 100));
  }

  const completeForm = new FormData();
  completeForm.append("identifier", identifier);
  completeForm.append("total", String(totalChunks));
  completeForm.append("filename", file.name);
  completeForm.append("folder", folder);

  return apiUpload<{ path: string; url: string }>(
    "/admin/uploads/complete",
    completeForm,
  );
}

// ---- Orders ----

export interface PlaceOrderResponse {
  data: {
    order_number: string;
    subtotal: number;
    downpayment: number;
    balance: number;
    status: string;
  };
}

/**
 * Places an order with the payment screenshot (multipart). Works for guests
 * and logged-in users — the session cookie is sent either way.
 * Field names are dictated by OrderController@store on the Laravel side.
 */
export const placeOrder = (formData: FormData) =>
  apiUpload<PlaceOrderResponse>("/orders", formData);

// ---- Orders (admin) ----

export interface OrderItem {
  id?: number;
  vehicle_id: number;
  name?: string | null;
  quantity: number;
  price?: number | null;
}

export interface Order {
  id: number;
  order_number: string;
  full_name: string;
  email: string;
  phone: string;
  address: string;
  notes: string | null;
  payment_method: string;
  payment_reference: string | null;
  payment_proof: string | null; // path relative to the API origin
  subtotal: number;
  downpayment: number;
  balance: number;
  status: string;
  items?: OrderItem[];
  created_at: string;
  updated_at?: string;
}

/** Adjust the path if your routes/api.php uses a different one. */
export const fetchAdminOrders = (options?: { signal?: AbortSignal }) =>
  apiRequest<{ data: Order[] }>("/admin/orders", { signal: options?.signal });

export const ORDER_STATUSES = [
  "pending_verification",
  "confirmed",
  "ready_for_pick_up",
  "completed",
  "cancelled",
] as const;

export const updateAdminOrderStatus = (id: number, status: string) =>
  apiRequest<{ data: Order }>(`/admin/orders/${id}/status`, {
    method: "PATCH",
    body: { status },
  });
// ---------------------------------------------------------------------------
// ADD THIS TO THE BOTTOM OF  lib/api.ts
// ---------------------------------------------------------------------------

export interface DashboardStat {
  value: number;
  change: number | null;
}

export interface DashboardData {
  stats: {
    revenue: DashboardStat;
    vehiclesSold: DashboardStat;
    activeListings: DashboardStat;
    newInquiries: DashboardStat;
  };
  revenue: { month: string; revenue: number; unitsSold: number }[];
  categories: { name: string; value: number }[];
  topModels: { model: string; unitsSold: number }[];
  recent: {
    id: string;
    customer: string;
    vehicle: string;
    amount: number;
    status: string;
    date: string | null;
  }[];
  cart: {
    added: number;
    removed: number;
    purchased: number;
    removalRate: number;
    inCartNow: number;
    daily: { day: string; added: number; removed: number }[];
    mostRemoved: { vehicle: string; added: number; removed: number }[];
  };
}

/**
 * GET /api/admin/dashboard?months=6
 * Goes through apiRequest, so it uses the /api/proxy route, the httpOnly
 * session cookie, and the ApiError shape like every other call.
 */
export const fetchAdminDashboard = (
  months = 6,
  options?: { signal?: AbortSignal },
) =>
  apiRequest<{ data: DashboardData }>(`/admin/dashboard?months=${months}`, {
    signal: options?.signal,
  }).then((res) => res.data);

// ---------------------------------------------------------------------------
// ADD THIS TO THE BOTTOM OF  lib/api.ts
// ---------------------------------------------------------------------------

// ---- Test drives ----

export const TEST_DRIVE_STATUSES = [
  "pending",
  "confirmed",
  "completed",
  "cancelled",
] as const;

export type TestDriveStatus = (typeof TEST_DRIVE_STATUSES)[number];

export interface TestDriveSlot {
  time: string; // "HH:MM" (24h)
  available: boolean;
}

export interface TestDrivePayload {
  vehicle_id: number;
  full_name: string;
  email: string;
  phone: string;
  preferred_date: string; // YYYY-MM-DD
  preferred_time: string; // one of the slot times
  notes?: string;
}

export interface TestDriveBooking {
  id: number;
  vehicle_id: number | null;
  vehicle_name: string;
  full_name: string;
  email: string;
  phone: string;
  preferred_date: string;
  preferred_time: string;
  notes: string | null;
  status: TestDriveStatus;
  admin_notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface CreateTestDriveResponse {
  message: string;
  data: {
    id: number;
    reference: string;
    vehicle: string;
    preferred_date: string;
    preferred_time: string;
    status: TestDriveStatus;
  };
}

/** Free/taken time slots for one car on one day (date = YYYY-MM-DD). */
export const fetchTestDriveSlots = (
  vehicleId: number,
  date: string,
  options?: { signal?: AbortSignal },
) =>
  apiRequest<{ data: TestDriveSlot[] }>(
    `/vehicles/${vehicleId}/test-drive-slots?date=${encodeURIComponent(date)}`,
    { signal: options?.signal },
  );

/** Works for guests and logged-in users. */
export const createTestDrive = (payload: TestDrivePayload) =>
  apiRequest<CreateTestDriveResponse>("/test-drives", {
    method: "POST",
    body: payload,
  });

// ---- Test drives (admin) ----

export const fetchAdminTestDrives = (params?: {
  status?: string;
  search?: string;
  page?: number;
}) => {
  const query = new URLSearchParams();
  if (params?.status) query.set("status", params.status);
  if (params?.search) query.set("search", params.search);
  if (params?.page) query.set("page", String(params.page));
  const qs = query.toString();
  return apiRequest<{
    data: TestDriveBooking[];
    current_page: number;
    last_page: number;
    total: number;
  }>(`/admin/test-drives${qs ? `?${qs}` : ""}`);
};

export const updateAdminTestDrive = (
  id: number,
  payload: { status?: TestDriveStatus; admin_notes?: string | null },
) =>
  apiRequest<{ data: TestDriveBooking }>(`/admin/test-drives/${id}`, {
    method: "PATCH",
    body: payload,
  });

export const deleteAdminTestDrive = (id: number) =>
  apiRequest(`/admin/test-drives/${id}`, { method: "DELETE" });
// ---- Blog ----

export interface BlogPost {
  id: number;
  title: string;
  description: string;
  image: string | null;
  video: string | null;
  created_at: string;
  updated_at: string;
}

export interface BlogPayload {
  title: string;
  description: string;
  image_path?: string | null;
  video_path?: string | null;
  remove_image?: boolean;
  remove_video?: boolean;
}

// Public
export const fetchBlogPosts = (options?: { signal?: AbortSignal }) =>
  apiRequest<{ data: BlogPost[] }>("/blog", { signal: options?.signal });

export const fetchBlogPost = (
  id: string | number,
  options?: { signal?: AbortSignal },
) => apiRequest<{ data: BlogPost }>(`/blog/${id}`, { signal: options?.signal });

// Admin
export const fetchAdminBlogPosts = (params?: { search?: string }) => {
  const qs = params?.search
    ? `?search=${encodeURIComponent(params.search)}`
    : "";
  return apiRequest<{ data: BlogPost[] }>(`/admin/blog${qs}`);
};

export const createBlogPost = (payload: BlogPayload) =>
  apiRequest<{ data: BlogPost }>("/admin/blog", {
    method: "POST",
    body: payload,
  });

export const updateBlogPost = (id: number, payload: BlogPayload) =>
  apiRequest<{ data: BlogPost }>(`/admin/blog/${id}`, {
    method: "PUT",
    body: payload,
  });

export const deleteAdminBlogPost = (id: number) =>
  apiRequest(`/admin/blog/${id}`, { method: "DELETE" });
// ---------------------------------------------------------------------------
// ADD THIS TO THE BOTTOM OF  lib/api.ts
// ---------------------------------------------------------------------------

// ---- Announcements ----

export interface Announcement {
  id: number;
  title: string;
  message: string;
  url: string | null;
  is_published: boolean;
  published_at: string | null;
  push_sent_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface AnnouncementPayload {
  title: string;
  message: string;
  url?: string | null;
  is_published: boolean;
}

// Public
export const fetchAnnouncements = (options?: { signal?: AbortSignal }) =>
  apiRequest<{ data: Announcement[] }>("/announcements", {
    signal: options?.signal,
  });

// Admin
export const fetchAdminAnnouncements = () =>
  apiRequest<{ data: Announcement[] }>("/admin/announcements");

export const createAnnouncement = (payload: AnnouncementPayload) =>
  apiRequest<{ data: Announcement }>("/admin/announcements", {
    method: "POST",
    body: payload,
  });

export const updateAnnouncement = (id: number, payload: AnnouncementPayload) =>
  apiRequest<{ data: Announcement }>(`/admin/announcements/${id}`, {
    method: "PUT",
    body: payload,
  });

export const deleteAdminAnnouncement = (id: number) =>
  apiRequest(`/admin/announcements/${id}`, { method: "DELETE" });
export interface PushSubscriptionInput {
  endpoint: string;
  keys: { p256dh: string; auth: string };
}

export const subscribePush = (subscription: PushSubscriptionInput) =>
  apiRequest("/push-subscriptions", { method: "POST", body: subscription });

export const unsubscribePush = (endpoint: string) =>
  apiRequest("/push-subscriptions/unsubscribe", {
    method: "POST",
    body: { endpoint },
  });

// Admin: how many devices will get the notification.
export const fetchPushSubscriberCount = () =>
  apiRequest<{ data: { subscribers: number } }>(
    "/admin/announcements/subscribers",
  );
