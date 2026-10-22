// Path: lib/contact-api.ts (use src/lib/contact-api.ts if your project has a src folder)
//
// Admin calls go through apiRequest (lib/api.ts), the same wrapper the Orders
// page uses: /api/proxy -> Laravel, session cookie + CSRF handled for us.
// The PUBLIC contact form still posts to /api/contact from app/contact/page.tsx.

import { apiRequest, type ApiError } from "@/lib/api";

export const INQUIRY_STATUSES = ["new", "read", "replied", "closed"] as const;

export type InquiryStatus = (typeof INQUIRY_STATUSES)[number];

export type InquiryReply = {
  id: number;
  contact_inquiry_id: number;
  user_id: number | null;
  subject: string;
  body: string;
  sent_at: string | null;
  created_at: string;
};

export type Inquiry = {
  id: number;
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  looking_for: string | null;
  message: string;
  status: InquiryStatus;
  created_at: string;
  updated_at: string;
  replies_count?: number;
  replies?: InquiryReply[];
};

export type Paginated<T> = {
  data: T[];
  current_page: number;
  last_page: number;
  per_page: number;
  total: number;
};

// Same shape as before, so contact-client.tsx keeps working unchanged.
export type ContactApiError = ApiError;

// ADJUST: must match the admin routes in routes/api.php
const ADMIN_BASE = "/contact";

export function fetchInquiries(params: {
  status?: InquiryStatus;
  search?: string;
  page?: number;
  perPage?: number;
}) {
  const query = new URLSearchParams();
  if (params.status) query.set("status", params.status);
  if (params.search) query.set("search", params.search);
  if (params.page) query.set("page", String(params.page));
  if (params.perPage) query.set("per_page", String(params.perPage));

  const qs = query.toString();
  return apiRequest<Paginated<Inquiry>>(`${ADMIN_BASE}${qs ? `?${qs}` : ""}`);
}

export function fetchInquiry(id: number) {
  return apiRequest<Inquiry>(`${ADMIN_BASE}/${id}`);
}

export function updateInquiryStatus(id: number, status: InquiryStatus) {
  return apiRequest<Inquiry>(`${ADMIN_BASE}/${id}`, {
    method: "PATCH",
    body: { status },
  });
}

export function sendInquiryReply(
  id: number,
  payload: { subject?: string; body: string },
) {
  return apiRequest<{ message: string; data: InquiryReply }>(
    `${ADMIN_BASE}/${id}/reply`,
    { method: "POST", body: payload },
  );
}
