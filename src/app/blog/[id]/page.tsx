"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import {
  ArrowLeft,
  CalendarDays,
  MapPin,
  Navigation,
  Phone,
  RotateCcw,
} from "lucide-react";
import { useCallback, useEffect, useState } from "react";

import Navbar from "@/components/layout/navbar";
import Footer from "@/components/layout/footer";
import {
  MEDIA_BASE_URL,
  fetchBlogPost,
  isAbortError,
  resolveMediaUrl,
  type ApiError,
  type BlogPost,
} from "@/lib/api";

const PHONES = [
  { label: "0906 021 8568", href: "tel:+639060218568" },
  { label: "0955 588 8186", href: "tel:+639555888186" },
];

const ADDRESS =
  "L7 B132 Arellano St. corner Diokno, Katarungan Village, Poblacion, Muntinlupa City";

const WAZE_URL =
  "https://waze.com/ul?q=Boss%20Auto%20Exchange%20Muntinlupa&navigate=yes";

export default function BlogPostPage() {
  const params = useParams<{ id: string }>();
  const id = params?.id;

  const [post, setPost] = useState<BlogPost | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const load = useCallback(
    async (signal?: AbortSignal) => {
      if (!id) return;
      setIsLoading(true);
      setLoadError(null);

      try {
        const { data } = await fetchBlogPost(id, { signal });
        setPost(data);
        setIsLoading(false);
      } catch (err) {
        if (isAbortError(err)) return;
        const e = err as ApiError;
        setLoadError(
          e.status === 404
            ? "This post doesn’t exist or was removed."
            : e.message || "We couldn’t load this post.",
        );
        setIsLoading(false);
      }
    },
    [id],
  );

  useEffect(() => {
    const controller = new AbortController();
    load(controller.signal);
    return () => controller.abort();
  }, [load]);

  const imageSrc = post ? resolveMediaUrl(post.image, MEDIA_BASE_URL) : "";
  const videoSrc = post ? resolveMediaUrl(post.video, MEDIA_BASE_URL) : "";

  // const postedOn = post?.created_at
  //   ? new Date(post.created_at).toLocaleDateString("en-PH", {
  //       year: "numeric",
  //       month: "long",
  //       day: "numeric",
  //     })
  //   : "";

  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-[#071A38] text-white">
        <div className="mx-auto max-w-6xl px-4 pb-16 pt-24 sm:px-6 sm:pt-28 lg:px-8">
          <Link
            href="/blog"
            className="inline-flex items-center gap-2 text-sm font-semibold text-[#FF5C68] hover:text-[#E8404B]"
          >
            <ArrowLeft size={16} />
            Back to blog
          </Link>

          {isLoading ? (
            <div className="mt-6 rounded-[28px] border border-white/10 bg-[#071A38] px-6 py-16 text-center">
              <div className="mx-auto h-8 w-8 animate-spin rounded-full border-2 border-[#D41F2D]/40 border-t-[#D41F2D]" />
              <p className="mt-4 text-sm text-zinc-400">Loading post...</p>
            </div>
          ) : loadError || !post ? (
            <div className="mt-6 rounded-[28px] border border-[#D41F2D]/30 bg-[#071A38] px-6 py-16 text-center">
              <p className="text-2xl font-bold text-white">
                Something went wrong
              </p>
              <p className="mx-auto mt-3 max-w-xl text-sm text-zinc-300">
                {loadError}
              </p>
              <button
                type="button"
                onClick={() => load()}
                className="mt-6 inline-flex items-center gap-2 rounded-full bg-[#D41F2D] px-5 py-3 text-sm font-semibold text-white hover:bg-[#E8404B]"
              >
                <RotateCcw size={16} />
                Retry
              </button>
            </div>
          ) : (
            <article className="mt-6 grid gap-x-10 gap-y-6 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)] lg:grid-rows-[auto_1fr]">
              {/* Title */}
              <header className="order-1 lg:col-start-2 lg:row-start-1">
                {/* {postedOn && (
                  <p className="flex items-center gap-2 text-xs uppercase tracking-[0.18em] text-zinc-400">
                    <CalendarDays size={14} />
                    {postedOn}
                  </p>
                )} */}
                <h1 className="mt-2 text-3xl font-black leading-tight tracking-tight sm:text-4xl">
                  {post.title}
                </h1>
              </header>

              {/* Media (sticky on desktop) */}
              {(videoSrc || imageSrc) && (
                <div className="order-2 lg:col-start-1 lg:row-span-2 lg:row-start-1">
                  <div className="lg:sticky lg:top-24">
                    {videoSrc ? (
                      <div className="overflow-hidden rounded-[26px] border border-white/10 bg-black">
                        <video
                          src={videoSrc}
                          poster={imageSrc || undefined}
                          controls
                          playsInline
                          preload="metadata"
                          className="aspect-video w-full"
                        />
                      </div>
                    ) : (
                      <div className="overflow-hidden rounded-[26px] border border-white/10 bg-[#040E21]">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={imageSrc}
                          alt={post.title}
                          className="h-auto w-full"
                        />
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Details */}
              <div className="order-3 space-y-6 lg:col-start-2 lg:row-start-2">
                <p className="whitespace-pre-line text-base leading-7 text-zinc-300">
                  {post.description}
                </p>

                {/* CTA */}
                <div className="rounded-[22px] border border-[#D41F2D]/30 bg-[#040E21] p-5">
                  <p className="text-sm font-bold uppercase tracking-[0.14em] text-[#FF5C68]">
                    Inquire now
                  </p>
                  <div className="mt-4 grid gap-3 sm:grid-cols-2">
                    {PHONES.map((p) => (
                      <a
                        key={p.href}
                        href={p.href}
                        className="inline-flex items-center justify-center gap-2 rounded-full bg-[#D41F2D] px-5 py-3 text-sm font-bold text-white transition-colors hover:bg-[#E8404B]"
                      >
                        <Phone size={16} />
                        {p.label}
                      </a>
                    ))}
                  </div>
                </div>

                {/* Location */}
                <div className="rounded-[22px] border border-white/10 bg-[#040E21] p-5">
                  <div className="flex items-start gap-3">
                    <MapPin
                      size={20}
                      className="mt-0.5 flex-shrink-0 text-[#FF5C68]"
                    />
                    <div>
                      <p className="font-bold text-white">Boss Auto Exchange</p>
                      <p className="mt-1 text-sm leading-6 text-zinc-300">
                        {ADDRESS}
                      </p>
                      <p className="text-sm text-zinc-400">
                        Near Daang Hari Road
                      </p>
                    </div>
                  </div>
                  <a
                    href={WAZE_URL}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-4 inline-flex items-center gap-2 rounded-full border border-white/20 px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:border-[#FF5C68] hover:text-[#FF5C68]"
                  >
                    <Navigation size={16} />
                    Open in Waze
                  </a>
                </div>
              </div>
            </article>
          )}
        </div>
      </main>
      <Footer />
    </>
  );
}
