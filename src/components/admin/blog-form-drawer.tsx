"use client";

import { useState, type FormEvent, type ReactNode } from "react";
import { Loader2, Trash2, UploadCloud, X } from "lucide-react";
import {
  createBlogPost,
  resolveMediaUrl,
  updateBlogPost,
  uploadFileInChunks,
  type ApiError,
  type BlogPayload,
  type BlogPost,
} from "@/lib/api";

const inputClass =
  "w-full rounded-xl border border-white/10 bg-[#040E21]/60 px-3.5 py-2.5 text-sm text-white placeholder-zinc-500 outline-none focus:border-[#D41F2D]/60";

const fileClass =
  "block w-full text-xs text-zinc-400 file:mr-3 file:rounded-full file:border-0 file:bg-[#D41F2D]/15 file:px-3 file:py-1.5 file:text-xs file:font-semibold file:text-[#FF5C68]";

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div>
      <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-zinc-400">
        {label}
      </label>
      {children}
    </div>
  );
}

function ProgressBar({ percent }: { percent: number }) {
  return (
    <div className="mt-2">
      <div className="mb-1 flex justify-between text-[11px] text-zinc-400">
        <span>Uploading...</span>
        <span>{percent}%</span>
      </div>
      <div className="h-1.5 w-full overflow-hidden rounded-full bg-white/10">
        <div
          className="h-full bg-[#D41F2D] transition-all"
          style={{ width: `${percent}%` }}
        />
      </div>
    </div>
  );
}

export default function BlogFormDrawer({
  post,
  imageBaseUrl,
  onClose,
  onSaved,
}: {
  post?: BlogPost;
  imageBaseUrl: string;
  onClose: () => void;
  onSaved: () => void;
}) {
  const isEditing = Boolean(post);

  const existingImage = post?.image
    ? resolveMediaUrl(post.image, imageBaseUrl)
    : null;
  const existingVideo = post?.video
    ? resolveMediaUrl(post.video, imageBaseUrl)
    : null;

  const [title, setTitle] = useState(post?.title ?? "");
  const [description, setDescription] = useState(post?.description ?? "");

  // Image: `imagePath` = newly uploaded file (not saved yet)
  const [imagePath, setImagePath] = useState<string | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(
    existingImage,
  );
  const [removeImage, setRemoveImage] = useState(false);
  const [imageProgress, setImageProgress] = useState<number | null>(null);

  // Video
  const [videoPath, setVideoPath] = useState<string | null>(null);
  const [videoPreview, setVideoPreview] = useState<string | null>(
    existingVideo,
  );
  const [removeVideo, setRemoveVideo] = useState(false);
  const [videoProgress, setVideoProgress] = useState<number | null>(null);

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const uploading = imageProgress !== null || videoProgress !== null;

  async function handleImageSelect(file: File) {
    setError("");
    setImagePreview(URL.createObjectURL(file));
    setImageProgress(0);
    try {
      // Sent in 4MB chunks through /api/proxy: no CORS, no body-size limit.
      const { path } = await uploadFileInChunks(
        file,
        "blog/images",
        setImageProgress,
      );
      setImagePath(path);
      setRemoveImage(false);
    } catch (err) {
      setImagePreview(removeImage ? null : existingImage);
      setError((err as ApiError).message || "Image upload failed.");
    } finally {
      setImageProgress(null);
    }
  }

  async function handleVideoSelect(file: File) {
    setError("");
    setVideoPreview(URL.createObjectURL(file));
    setVideoProgress(0);
    try {
      const { path } = await uploadFileInChunks(
        file,
        "blog/videos",
        setVideoProgress,
      );
      setVideoPath(path);
      setRemoveVideo(false);
    } catch (err) {
      setVideoPreview(removeVideo ? null : existingVideo);
      setError((err as ApiError).message || "Video upload failed.");
    } finally {
      setVideoProgress(null);
    }
  }

  function clearImage() {
    setImagePath(null);
    setImagePreview(null);
    setRemoveImage(Boolean(post?.image));
  }

  function clearVideo() {
    setVideoPath(null);
    setVideoPreview(null);
    setRemoveVideo(Boolean(post?.video));
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");

    if (!title.trim()) return setError("Title is required.");
    if (!description.trim()) return setError("Description is required.");
    if (uploading) return setError("Please wait for the upload to finish.");

    const payload: BlogPayload = {
      title: title.trim(),
      description: description.trim(),
      image_path: imagePath ?? undefined,
      video_path: videoPath ?? undefined,
      remove_image: removeImage || undefined,
      remove_video: removeVideo || undefined,
    };

    setSaving(true);
    try {
      if (post) {
        await updateBlogPost(post.id, payload);
      } else {
        await createBlogPost(payload);
      }
      onSaved();
      onClose();
    } catch (err) {
      setError((err as ApiError).message || "Failed to save post.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#040E21]/60 p-4 backdrop-blur-sm">
      <div className="flex max-h-[90vh] w-full max-w-2xl flex-col overflow-hidden rounded-2xl bg-[#040E21] shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-white/10 px-6 py-4">
          <h2 className="text-lg font-bold text-white">
            {isEditing ? "Edit post" : "New post"}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="text-zinc-400 hover:text-white"
            aria-label="Close"
          >
            <X size={20} />
          </button>
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

            <Field label="Title">
              <input
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className={inputClass}
                placeholder="e.g. New arrivals this week"
              />
            </Field>

            <Field label="Description">
              <textarea
                required
                rows={6}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className={inputClass}
                placeholder="Write the post..."
              />
            </Field>

            {/* Image */}
            <Field label="Image (optional)">
              <div className="flex items-center gap-3">
                <div className="flex h-20 w-32 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-white/10 bg-[#040E21]">
                  {imagePreview ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={imagePreview}
                      alt="Image preview"
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
                      e.target.value = "";
                    }}
                    className={fileClass}
                  />
                  {imagePreview && imageProgress === null && (
                    <button
                      type="button"
                      onClick={clearImage}
                      className="mt-2 inline-flex items-center gap-1.5 text-xs text-zinc-400 hover:text-[#FF5C68]"
                    >
                      <Trash2 size={12} /> Remove image
                    </button>
                  )}
                  {imageProgress !== null && (
                    <ProgressBar percent={imageProgress} />
                  )}
                </div>
              </div>
            </Field>

            {/* Video */}
            <Field label="Video (optional)">
              <div className="space-y-3">
                {videoPreview && (
                  <video
                    key={videoPreview}
                    src={videoPreview}
                    controls
                    muted
                    playsInline
                    preload="metadata"
                    className="aspect-video w-full rounded-xl border border-white/10 bg-black"
                  />
                )}
                <input
                  type="file"
                  accept="video/*"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) handleVideoSelect(file);
                    e.target.value = "";
                  }}
                  className={fileClass}
                />
                <p className="text-xs text-zinc-500">
                  Large files are uploaded in small chunks, so big videos are
                  fine. Keep this window open until it reaches 100%.
                </p>
                {videoPreview && videoProgress === null && (
                  <button
                    type="button"
                    onClick={clearVideo}
                    className="inline-flex items-center gap-1.5 text-xs text-zinc-400 hover:text-[#FF5C68]"
                  >
                    <Trash2 size={12} /> Remove video
                  </button>
                )}
                {videoProgress !== null && (
                  <ProgressBar percent={videoProgress} />
                )}
              </div>
            </Field>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between border-t border-white/10 px-6 py-4">
            <button
              type="button"
              onClick={onClose}
              className="rounded-full px-4 py-2 text-sm font-medium text-zinc-400 hover:text-white"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={saving || uploading}
              className="flex items-center gap-2 rounded-full bg-gradient-to-r from-[#D41F2D] to-[#E8404B] px-5 py-2.5 text-sm font-bold text-white disabled:opacity-60"
            >
              {(saving || uploading) && (
                <Loader2 size={15} className="animate-spin" />
              )}
              {uploading
                ? "Uploading..."
                : isEditing
                  ? "Save changes"
                  : "Publish post"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
