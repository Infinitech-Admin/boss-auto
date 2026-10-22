"use client";

import { useState, type FormEvent, type ReactNode } from "react";
import {
  AlertTriangle,
  Check,
  Loader2,
  Play,
  Trash2,
  UploadCloud,
  X,
} from "lucide-react";
import {
  addVehicleMedia,
  createVehicle,
  deleteVehicleMedia,
  resolveMediaUrl,
  updateVehicle,
  uploadFileInChunks,
  type ApiError,
  type GalleryMediaItem,
  type Vehicle,
  type VehiclePayload,
} from "@/lib/api";

const VEHICLE_TYPES = [
  "Sedan",
  "SUV",
  "MPV",
  "Pickup",
  "Hatchback",
  "Van",
  "Coupe",
];
const STATUS_OPTIONS: VehiclePayload["status"][] = [
  "available",
  "reserved",
  "sold",
];

const STEPS = [
  { id: 1, label: "Basic info" },
  { id: 2, label: "Specs" },
  { id: 3, label: "Media" },
] as const;

const inputClass =
  "w-full rounded-xl border border-white/10 bg-[#040E21]/60 px-3.5 py-2.5 text-sm text-white placeholder-zinc-500 outline-none focus:border-[#D41F2D]/60";

function Field({
  label,
  className = "",
  children,
}: {
  label: string;
  className?: string;
  children: ReactNode;
}) {
  return (
    <div className={className}>
      <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-zinc-400">
        {label}
      </label>
      {children}
    </div>
  );
}

/**
 * Thumbnail for one gallery item in the admin drawer.
 * - image            -> <img>
 * - video + poster   -> <img> of the poster, with a play badge
 * - video, no poster -> <video> (shows the first frame), with a play badge
 *   (an .mp4 can't be used as an <img src>, which is why videos looked empty)
 */
function GalleryTile({
  media,
  baseUrl,
  onDelete,
}: {
  media: GalleryMediaItem;
  baseUrl: string;
  onDelete: () => void;
}) {
  const isVideo = media.type === "video";
  const src = resolveMediaUrl(media.src, baseUrl);
  const poster = media.poster ? resolveMediaUrl(media.poster, baseUrl) : "";

  return (
    <div className="group relative aspect-video overflow-hidden rounded-lg border border-white/10 bg-[#040E21]">
      {!isVideo || poster ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={isVideo ? poster : src}
          alt={media.alt ?? ""}
          className="h-full w-full object-cover"
        />
      ) : (
        <video
          // #t=0.1 makes the browser paint a frame instead of a black box
          src={`${src}#t=0.1`}
          muted
          playsInline
          preload="metadata"
          className="h-full w-full object-cover"
        />
      )}

      {isVideo && (
        <>
          <span className="pointer-events-none absolute inset-0 flex items-center justify-center bg-[#040E21]/30">
            <Play size={18} className="fill-white text-white" />
          </span>
          <span className="pointer-events-none absolute bottom-1 left-1 rounded bg-[#040E21]/70 px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wide text-white">
            Video
          </span>
        </>
      )}

      <button
        type="button"
        onClick={onDelete}
        className="absolute right-1 top-1 hidden rounded-full bg-[#040E21]/70 p-1 text-white group-hover:block"
        aria-label="Remove"
      >
        <Trash2 size={12} />
      </button>
    </div>
  );
}

/**
 * Themed confirmation dialog — replaces the browser's native confirm().
 * Sits above the drawer (z-[60]) and blocks interaction with it while open.
 * Clicking the backdrop or Cancel closes it (disabled while a delete is
 * in flight so it can't be dismissed mid-request).
 */
function ConfirmDeleteDialog({
  media,
  baseUrl,
  deleting,
  onCancel,
  onConfirm,
}: {
  media: GalleryMediaItem;
  baseUrl: string;
  deleting: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  const isVideo = media.type === "video";
  const src = resolveMediaUrl(media.src, baseUrl);
  const poster = media.poster ? resolveMediaUrl(media.poster, baseUrl) : "";

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center bg-[#040E21]/70 p-4 backdrop-blur-sm"
      onClick={() => {
        if (!deleting) onCancel();
      }}
      role="presentation"
    >
      <div
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="confirm-delete-title"
        aria-describedby="confirm-delete-desc"
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-sm overflow-hidden rounded-2xl border border-white/10 bg-[#040E21] shadow-2xl"
      >
        <div className="px-6 pt-6">
          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#D41F2D]/15">
              <AlertTriangle size={20} className="text-[#FF5C68]" />
            </div>
            <div>
              <h3
                id="confirm-delete-title"
                className="text-base font-bold text-white"
              >
                Remove {isVideo ? "video" : "photo"}?
              </h3>
              <p
                id="confirm-delete-desc"
                className="mt-1 text-sm text-zinc-400"
              >
                This will permanently remove it from the gallery. This can’t be
                undone.
              </p>
            </div>
          </div>

          {/* Preview of what's being deleted */}
          <div className="mt-4 aspect-video w-full overflow-hidden rounded-lg border border-white/10 bg-[#040E21]">
            {!isVideo || poster ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={isVideo ? poster : src}
                alt={media.alt ?? ""}
                className="h-full w-full object-cover"
              />
            ) : (
              <video
                src={`${src}#t=0.1`}
                muted
                playsInline
                preload="metadata"
                className="h-full w-full object-cover"
              />
            )}
          </div>
        </div>

        <div className="mt-6 flex items-center justify-end gap-2 border-t border-white/10 px-6 py-4">
          <button
            type="button"
            onClick={onCancel}
            disabled={deleting}
            className="rounded-full px-4 py-2 text-sm font-medium text-zinc-400 hover:text-white disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={deleting}
            className="flex items-center gap-2 rounded-full bg-[#D41F2D] px-5 py-2 text-sm font-bold text-white hover:bg-[#A8161F] disabled:opacity-60"
          >
            {deleting && <Loader2 size={15} className="animate-spin" />}
            {deleting ? "Removing..." : "Yes, remove"}
          </button>
        </div>
      </div>
    </div>
  );
}

interface FormState {
  name: string;
  year: string;
  type: string;
  mileage_km: string;
  engine: string;
  horsepower: string;
  transmission: string;
  price: string;
  location: string;
  fuel: string;
  badge: string;
  description: string;
  stock: string;
  status: VehiclePayload["status"];
}

function toFormState(v?: Vehicle): FormState {
  return {
    name: v?.name ?? "",
    year: v?.year ?? String(new Date().getFullYear()),
    type: v?.type ?? "Sedan",
    mileage_km: v ? String(v.mileage_km) : "0",
    engine: v?.engine ?? "",
    horsepower: v?.horsepower ?? "",
    transmission: v?.transmission ?? "Automatic",
    price: v ? String(v.price_value) : "",
    location: v?.location ?? "",
    fuel: v?.fuel ?? "Petrol",
    badge: v?.badge ?? "",
    description: v?.description ?? "",
    stock: v ? String(v.stock) : "1",
    status: v?.status ?? "available",
  };
}

export default function VehicleFormDrawer({
  vehicle,
  imageBaseUrl,
  onClose,
  onSaved,
}: {
  vehicle?: Vehicle;
  imageBaseUrl: string;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [step, setStep] = useState(1);
  const [form, setForm] = useState<FormState>(() => toFormState(vehicle));
  const [savedVehicle, setSavedVehicle] = useState<Vehicle | undefined>(
    vehicle,
  );
  const [imagePath, setImagePath] = useState<string | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(
    vehicle?.image ? resolveMediaUrl(vehicle.image, imageBaseUrl) : null,
  );
  const [imageUploadPercent, setImageUploadPercent] = useState<number | null>(
    null,
  );
  const [gallery, setGallery] = useState<GalleryMediaItem[]>(
    vehicle?.galleryMedia ?? [],
  );
  const [galleryUploading, setGalleryUploading] = useState<{
    name: string;
    percent: number;
  } | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  // Delete-confirmation dialog state: which media is pending removal (null =
  // dialog closed) and whether the delete request is currently in flight.
  const [mediaToDelete, setMediaToDelete] = useState<GalleryMediaItem | null>(
    null,
  );
  const [deletingMedia, setDeletingMedia] = useState(false);

  const isEditing = Boolean(savedVehicle);
  const isLastStep = step === STEPS.length;

  function update<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  function validateStep(current: number): string {
    if (current === 1) {
      if (!form.name.trim()) return "Vehicle name is required.";
      if (!form.year.trim()) return "Year is required.";
      if (!form.price.trim()) return "Price is required.";
    }
    if (current === 2) {
      if (!form.fuel.trim()) return "Fuel type is required.";
      if (!form.engine.trim()) return "Engine is required.";
      if (!form.horsepower.trim()) return "Horsepower is required.";
      if (!form.transmission.trim()) return "Transmission is required.";
    }
    return "";
  }

  function goNext() {
    const msg = validateStep(step);
    if (msg) {
      setError(msg);
      return;
    }
    setError("");
    setStep((s) => Math.min(s + 1, STEPS.length));
  }

  function goBack() {
    setError("");
    setStep((s) => Math.max(s - 1, 1));
  }

  async function handleImageSelect(file: File) {
    setImagePreview(URL.createObjectURL(file));
    setImageUploadPercent(0);
    try {
      const { path } = await uploadFileInChunks(
        file,
        "vehicles/images",
        setImageUploadPercent,
      );
      setImagePath(path);
    } catch (err) {
      setError((err as ApiError).message || "Cover image upload failed.");
    } finally {
      setImageUploadPercent(null);
    }
  }

  async function handleGalleryFiles(files: FileList) {
    for (const file of Array.from(files)) {
      const isVideo = file.type.startsWith("video/");
      setGalleryUploading({ name: file.name, percent: 0 });

      try {
        const { path } = await uploadFileInChunks(
          file,
          isVideo ? "vehicles/videos" : "vehicles/images",
          (percent) => setGalleryUploading({ name: file.name, percent }),
        );

        if (savedVehicle) {
          const { media } = await addVehicleMedia(savedVehicle.id, {
            type: isVideo ? "video" : "image",
            path,
            alt: file.name,
            length: isVideo ? "short" : undefined,
          });
          setGallery((prev) => [...prev, media]);
        }
      } catch (err) {
        setError((err as ApiError).message || `Failed to upload ${file.name}.`);
      } finally {
        setGalleryUploading(null);
      }
    }
  }

  // Step 1 of deleting: just open the confirmation dialog.
  function requestDeleteMedia(media: GalleryMediaItem) {
    if (!savedVehicle || !media.id) return;
    setMediaToDelete(media);
  }

  // Step 2: user confirmed in the dialog — actually delete.
  async function confirmDeleteMedia() {
    if (!savedVehicle || !mediaToDelete?.id) return;

    const target = mediaToDelete;
    setDeletingMedia(true);
    try {
      await deleteVehicleMedia(savedVehicle.id, target.id!);
      setGallery((prev) => prev.filter((m) => m.id !== target.id));
      setMediaToDelete(null);
    } catch (err) {
      setError((err as ApiError).message || "Failed to remove media.");
      setMediaToDelete(null);
    } finally {
      setDeletingMedia(false);
    }
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();

    if (!isLastStep) {
      goNext();
      return;
    }

    setError("");
    setSaving(true);

    const payload: VehiclePayload = {
      name: form.name,
      year: form.year,
      type: form.type,
      mileage_km: Number(form.mileage_km) || 0,
      engine: form.engine,
      horsepower: form.horsepower,
      transmission: form.transmission,
      price: Number(form.price) || 0,
      location: form.location,
      fuel: form.fuel,
      badge: form.badge || undefined,
      description: form.description || undefined,
      stock: Number(form.stock) || 0,
      status: form.status,
      image_path: imagePath ?? undefined,
    };

    try {
      if (savedVehicle) {
        const { data } = await updateVehicle(savedVehicle.id, payload);
        setSavedVehicle(data);
      } else {
        const { data } = await createVehicle(payload);
        setSavedVehicle(data);
      }
      onSaved();
      onClose();
    } catch (err) {
      setError((err as ApiError).message || "Failed to save vehicle.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#040E21]/60 p-4 backdrop-blur-sm">
      <div className="flex max-h-[90vh] w-full max-w-3xl flex-col overflow-hidden rounded-2xl bg-[#040E21] shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-white/10 px-6 py-4">
          <h2 className="text-lg font-bold text-white">
            {isEditing ? "Edit vehicle" : "Add vehicle"}
          </h2>
          <button
            onClick={onClose}
            className="text-zinc-400 hover:text-white"
            aria-label="Close"
          >
            <X size={20} />
          </button>
        </div>

        {/* Step indicator */}
        <div className="flex items-center gap-2 border-b border-white/10 px-6 py-4">
          {STEPS.map((s, i) => (
            <div key={s.id} className="flex flex-1 items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  if (s.id < step) {
                    setError("");
                    setStep(s.id);
                  }
                }}
                disabled={s.id > step}
                className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-bold transition-colors ${
                  s.id === step
                    ? "bg-[#D41F2D] text-white"
                    : s.id < step
                      ? "bg-[#D41F2D]/20 text-[#FF5C68] cursor-pointer"
                      : "bg-white/5 text-zinc-500"
                }`}
              >
                {s.id < step ? <Check size={14} /> : s.id}
              </button>
              <span
                className={`hidden text-xs font-medium sm:block ${
                  s.id === step ? "text-white" : "text-zinc-500"
                }`}
              >
                {s.label}
              </span>
              {i < STEPS.length - 1 && (
                <div
                  className={`h-px flex-1 ${
                    s.id < step ? "bg-[#D41F2D]/40" : "bg-white/10"
                  }`}
                />
              )}
            </div>
          ))}
        </div>

        <form
          onSubmit={handleSubmit}
          className="flex flex-1 flex-col overflow-hidden"
        >
          <div className="flex-1 space-y-5 overflow-y-auto px-6 py-6">
            {error && (
              <div className="rounded-xl border border-[#D41F2D]/30 bg-[#D41F2D]/10 px-4 py-3 text-sm text-[#FF5C68]">
                {error}
              </div>
            )}

            {/* Step 1: Basic info */}
            {step === 1 && (
              <div className="grid grid-cols-2 gap-4">
                <Field label="Name" className="col-span-2">
                  <input
                    required
                    value={form.name}
                    onChange={(e) => update("name", e.target.value)}
                    className={inputClass}
                    placeholder="e.g. Toyota Fortuner GR-S"
                  />
                </Field>

                <Field label="Year">
                  <input
                    required
                    value={form.year}
                    onChange={(e) => update("year", e.target.value)}
                    className={inputClass}
                  />
                </Field>

                <Field label="Type">
                  <select
                    value={form.type}
                    onChange={(e) => update("type", e.target.value)}
                    className={inputClass}
                  >
                    {VEHICLE_TYPES.map((t) => (
                      <option key={t} value={t} className="bg-[#040E21]">
                        {t}
                      </option>
                    ))}
                  </select>
                </Field>

                <Field label="Price (₱)">
                  <input
                    type="number"
                    min={0}
                    required
                    value={form.price}
                    onChange={(e) => update("price", e.target.value)}
                    className={inputClass}
                  />
                </Field>

                <Field label="Stock">
                  <input
                    type="number"
                    min={0}
                    required
                    value={form.stock}
                    onChange={(e) => update("stock", e.target.value)}
                    className={inputClass}
                  />
                </Field>

                <Field label="Status">
                  <select
                    value={form.status}
                    onChange={(e) =>
                      update(
                        "status",
                        e.target.value as VehiclePayload["status"],
                      )
                    }
                    className={inputClass}
                  >
                    {STATUS_OPTIONS.map((s) => (
                      <option
                        key={s}
                        value={s}
                        className="bg-[#040E21] capitalize"
                      >
                        {s}
                      </option>
                    ))}
                  </select>
                </Field>

                <Field label="Location">
                  <input
                    required
                    value={form.location}
                    onChange={(e) => update("location", e.target.value)}
                    className={inputClass}
                  />
                </Field>

                <Field label="Badge" className="col-span-2">
                  <input
                    value={form.badge}
                    onChange={(e) => update("badge", e.target.value)}
                    className={inputClass}
                    placeholder="e.g. Certified"
                  />
                </Field>
              </div>
            )}

            {/* Step 2: Specs */}
            {step === 2 && (
              <div className="grid grid-cols-2 gap-4">
                <Field label="Mileage (km)">
                  <input
                    type="number"
                    min={0}
                    required
                    value={form.mileage_km}
                    onChange={(e) => update("mileage_km", e.target.value)}
                    className={inputClass}
                  />
                </Field>

                <Field label="Fuel">
                  <input
                    required
                    value={form.fuel}
                    onChange={(e) => update("fuel", e.target.value)}
                    className={inputClass}
                  />
                </Field>

                <Field label="Engine">
                  <input
                    required
                    value={form.engine}
                    onChange={(e) => update("engine", e.target.value)}
                    className={inputClass}
                  />
                </Field>

                <Field label="Horsepower">
                  <input
                    required
                    value={form.horsepower}
                    onChange={(e) => update("horsepower", e.target.value)}
                    className={inputClass}
                  />
                </Field>

                <Field label="Transmission" className="col-span-2">
                  <input
                    required
                    value={form.transmission}
                    onChange={(e) => update("transmission", e.target.value)}
                    className={inputClass}
                  />
                </Field>

                <Field label="Description" className="col-span-2">
                  <textarea
                    rows={4}
                    value={form.description}
                    onChange={(e) => update("description", e.target.value)}
                    className={inputClass}
                  />
                </Field>
              </div>
            )}

            {/* Step 3: Media */}
            {step === 3 && (
              <div className="space-y-6">
                <div>
                  <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-zinc-400">
                    Cover image
                  </label>
                  <div className="flex items-center gap-3">
                    <div className="flex h-20 w-28 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-white/10 bg-[#040E21]">
                      {imagePreview ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={imagePreview}
                          alt="Cover preview"
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <UploadCloud size={20} className="text-zinc-600" />
                      )}
                    </div>
                    <div className="flex-1">
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) handleImageSelect(file);
                        }}
                        className="block w-full text-xs text-zinc-400 file:mr-3 file:rounded-full file:border-0 file:bg-[#D41F2D]/15 file:px-3 file:py-1.5 file:text-xs file:font-semibold file:text-[#FF5C68]"
                      />
                      {imageUploadPercent !== null && (
                        <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-white/10">
                          <div
                            className="h-full bg-[#D41F2D] transition-all"
                            style={{ width: `${imageUploadPercent}%` }}
                          />
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                <div>
                  <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-zinc-400">
                    Gallery photos &amp; videos
                  </label>

                  {!isEditing && (
                    <p className="mb-2 text-xs text-zinc-500">
                      Save the vehicle first to unlock gallery uploads.
                    </p>
                  )}

                  {isEditing && (
                    <input
                      type="file"
                      accept="image/*,video/*"
                      multiple
                      onChange={(e) => {
                        if (e.target.files) handleGalleryFiles(e.target.files);
                        e.target.value = "";
                      }}
                      className="mb-3 block w-full text-xs text-zinc-400 file:mr-3 file:rounded-full file:border-0 file:bg-[#D41F2D]/15 file:px-3 file:py-1.5 file:text-xs file:font-semibold file:text-[#FF5C68]"
                    />
                  )}

                  {galleryUploading && (
                    <div className="mb-3 rounded-lg border border-white/10 bg-[#040E21] px-3 py-2 text-xs text-zinc-400">
                      <div className="mb-1 flex items-center justify-between">
                        <span className="truncate">
                          {galleryUploading.name}
                        </span>
                        <span>{galleryUploading.percent}%</span>
                      </div>
                      <div className="h-1.5 w-full overflow-hidden rounded-full bg-white/10">
                        <div
                          className="h-full bg-[#D41F2D] transition-all"
                          style={{ width: `${galleryUploading.percent}%` }}
                        />
                      </div>
                    </div>
                  )}

                  <div className="grid grid-cols-4 gap-2">
                    {gallery.map((m) => (
                      <GalleryTile
                        key={m.id ?? m.src}
                        media={m}
                        baseUrl={imageBaseUrl}
                        onDelete={() => requestDeleteMedia(m)}
                      />
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Footer controls */}
          <div className="flex items-center justify-between border-t border-white/10 px-6 py-4">
            <button
              type="button"
              onClick={step === 1 ? onClose : goBack}
              className="rounded-full px-4 py-2 text-sm font-medium text-zinc-400 hover:text-white"
            >
              {step === 1 ? "Cancel" : "Back"}
            </button>

            <button
              type="submit"
              disabled={saving}
              className="flex items-center gap-2 rounded-full bg-gradient-to-r from-[#D41F2D] to-[#E8404B] px-5 py-2.5 text-sm font-bold text-white disabled:opacity-60"
            >
              {saving && <Loader2 size={15} className="animate-spin" />}
              {isLastStep
                ? isEditing
                  ? "Save changes"
                  : "Save vehicle"
                : "Next"}
            </button>
          </div>
        </form>
      </div>

      {/* Delete confirmation dialog (replaces native confirm()) */}
      {mediaToDelete && (
        <ConfirmDeleteDialog
          media={mediaToDelete}
          baseUrl={imageBaseUrl}
          deleting={deletingMedia}
          onCancel={() => setMediaToDelete(null)}
          onConfirm={confirmDeleteMedia}
        />
      )}
    </div>
  );
}
