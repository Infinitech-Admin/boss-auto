"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  ArrowLeft,
  ArrowRight,
  CarFront,
  Gauge,
  RotateCcw,
  Settings2,
} from "lucide-react";

import {
  MEDIA_BASE_URL,
  fetchVehicles,
  isAbortError,
  resolveMediaUrl,
  type ApiError,
  type Vehicle,
} from "@/lib/api";

const MAX_FEATURED = 6;

const DEFAULT_LOAD_ERROR =
  "We couldn’t load the featured vehicles right now. Please try again.";

// FIX: the stage is shorter on phones. The car is about 1.6x wider than it is
// tall, so the old 360px height left a lot of empty space above and below it.
const STAGE_HEIGHT =
  "h-[240px] min-[420px]:h-[300px] sm:h-[480px] lg:h-[620px]";

export default function ShowcaseSection() {
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [activeIndex, setActiveIndex] = useState(0);
  const [direction, setDirection] = useState<"next" | "prev">("next");
  const [isPaused, setIsPaused] = useState(false);
  const touchStartX = useRef<number | null>(null);

  const load = useCallback(async (signal?: AbortSignal) => {
    setIsLoading(true);
    setLoadError(null);

    try {
      const { data } = await fetchVehicles({ signal });
      setVehicles(data ?? []);
      setIsLoading(false);
    } catch (err) {
      if (isAbortError(err)) return;
      setLoadError((err as ApiError).message || DEFAULT_LOAD_ERROR);
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    load(controller.signal);
    return () => controller.abort();
  }, [load]);

  // Available vehicles first (with an image), capped to MAX_FEATURED.
  const cars = useMemo(() => {
    const withImage = vehicles.filter((v) => !!v.image);
    const available = withImage.filter(
      (v) => v.status === "available" && v.stock > 0,
    );
    const pool = available.length > 0 ? available : withImage;

    return pool.slice(0, MAX_FEATURED).map((v) => ({
      id: v.id,
      name: v.name,
      year: v.year,
      type: v.type,
      mileage: v.mileage,
      engine: v.engine,
      horsepower: v.horsepower,
      transmission: v.transmission,
      image: resolveMediaUrl(v.image, MEDIA_BASE_URL),
    }));
  }, [vehicles]);

  const total = cars.length;
  const safeIndex = total > 0 ? Math.min(activeIndex, total - 1) : 0;
  const activeCar = cars[safeIndex];

  const goNext = () => {
    if (total < 2) return;
    setDirection("next");
    setActiveIndex((current) => (current >= total - 1 ? 0 : current + 1));
  };

  const goPrevious = () => {
    if (total < 2) return;
    setDirection("prev");
    setActiveIndex((current) => (current <= 0 ? total - 1 : current - 1));
  };

  useEffect(() => {
    if (isPaused || total < 2) return;

    const interval = window.setInterval(() => {
      setDirection("next");
      setActiveIndex((current) => (current >= total - 1 ? 0 : current + 1));
    }, 5000);

    return () => {
      window.clearInterval(interval);
    };
  }, [isPaused, total]);

  // FIX: swipe left / right on the car to change vehicle (phones)
  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
    setIsPaused(true);
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    const start = touchStartX.current;
    touchStartX.current = null;
    setIsPaused(false);
    if (start === null) return;
    const delta = e.changedTouches[0].clientX - start;
    if (Math.abs(delta) >= 50) (delta < 0 ? goNext : goPrevious)();
  };

  const handleTouchCancel = () => {
    touchStartX.current = null;
    setIsPaused(false);
  };

  const getPosition = (index: number) => {
    let difference = index - safeIndex;

    if (difference > total / 2) {
      difference -= total;
    }

    if (difference < -total / 2) {
      difference += total;
    }

    return difference;
  };

  return (
    <section
      className="relative overflow-hidden bg-[var(--page-bg)] py-8 text-[var(--foreground)] sm:py-10"
      // FIX: only a real mouse pauses autoplay. On phones a tap used to fire
      // mouseenter and leave the carousel paused forever.
      onPointerEnter={(e) => {
        if (e.pointerType === "mouse") setIsPaused(true);
      }}
      onPointerLeave={(e) => {
        if (e.pointerType === "mouse") setIsPaused(false);
      }}
    >
      {/* Cinematic background glow */}
      <div className="pointer-events-none absolute left-1/2 top-1/2 h-[500px] w-[800px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#D41F2D]/5 blur-[140px]" />

      <div className="relative mx-auto max-w-[1600px] px-4 sm:px-6 lg:px-8">
        {/* FIX: heading and "Visit Showroom" stack on phones. Side by side,
            the link squeezed the paragraph into a narrow column. */}
        <div className="mx-auto flex max-w-7xl flex-col gap-2 sm:flex-row sm:items-center sm:justify-between sm:gap-10 lg:gap-20">
          <div className="mx-0 max-w-3xl py-4 sm:py-10">
            <div className="mb-5 flex items-center gap-3">
              <span className="h-px w-10 bg-[#D41F2D]" />
              <span className="text-xs font-semibold uppercase tracking-[0.3em] text-[#FF5C68]">
                Featured Vehicles
              </span>
              <span className="h-px w-10 bg-[#D41F2D]" />
            </div>

            <h2 className="text-4xl font-black tracking-tight text-[var(--foreground)] sm:text-5xl lg:text-6xl">
              Drive <span className="text-[#FF5C68]">Excellence.</span>
            </h2>

            <p className="mt-5 text-sm leading-7 text-[var(--muted)] sm:text-base">
              Discover a refined collection of premium vehicles selected for
              exceptional performance, sophisticated design, and lasting value.
            </p>
          </div>
          <div className="group inline-block shrink-0 sm:mt-6">
            <Link
              href="/showroom"
              className="flex items-center gap-2 text-base font-semibold text-[#FF5C68] underline decoration-transparent decoration-2 underline-offset-4 transition-all duration-300 hover:decoration-[#D41F2D] sm:text-lg"
            >
              Visit Showroom
              <ArrowRight
                size={16}
                className="transition-transform duration-300 group-hover:translate-x-1"
              />
            </Link>
          </div>
        </div>

        {/* Loading */}
        {isLoading && (
          <div
            className={`mx-auto mt-8 flex max-w-4xl flex-col items-center justify-center text-center sm:mt-16 ${STAGE_HEIGHT}`}
          >
            <div className="flex h-16 w-16 items-center justify-center rounded-full border border-[#D41F2D]/30 bg-[#D41F2D]/10">
              <div className="h-8 w-8 animate-spin rounded-full border-2 border-[#D41F2D]/40 border-t-[#D41F2D]" />
            </div>
            <p className="mt-6 text-lg font-semibold text-[var(--foreground)]">
              Loading featured vehicles...
            </p>
          </div>
        )}

        {/* Error */}
        {!isLoading && loadError && (
          <div className="mx-auto mt-8 flex max-w-xl flex-col items-center rounded-[28px] border border-[#D41F2D]/30 bg-[#071A38] px-6 py-12 text-center sm:mt-16">
            <p className="text-xl font-bold text-white">Something went wrong</p>
            <p className="mt-3 text-sm leading-6 text-zinc-300">{loadError}</p>
            <button
              type="button"
              onClick={() => load()}
              className="mt-6 inline-flex items-center gap-2 rounded-full bg-[#D41F2D] px-5 py-3 text-sm font-semibold text-black transition-all duration-300 hover:bg-[#E8404B]"
            >
              <RotateCcw size={16} />
              Retry
            </button>
          </div>
        )}

        {/* Empty */}
        {!isLoading && !loadError && total === 0 && (
          <div className="mx-auto mt-8 max-w-xl rounded-[28px] border border-dashed border-white/15 px-6 py-12 text-center sm:mt-16">
            <p className="text-lg font-semibold text-[var(--foreground)]">
              No vehicles to feature yet
            </p>
            <p className="mt-2 text-sm text-[var(--muted)]">
              Please check back soon for new arrivals.
            </p>
          </div>
        )}

        {/* Car Showcase */}
        {!isLoading && !loadError && total > 0 && activeCar && (
          <div className="relative mt-6 sm:mt-16">
            {/* Side arrows: tablet and up only. On phones they sat on top of
                the car, so they now live in the controls row below it. */}
            {total > 1 && (
              <>
                <button
                  type="button"
                  onClick={goPrevious}
                  aria-label="Previous vehicle"
                  className="absolute left-1 top-1/2 z-50 hidden h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full border border-white/15 bg-[#040E21]/60 text-white backdrop-blur-xl transition-all duration-300 hover:scale-110 hover:border-[#D41F2D] hover:bg-[#D41F2D] hover:text-black sm:left-5 sm:flex sm:h-12 sm:w-12 lg:left-10"
                >
                  <ArrowLeft size={19} />
                </button>

                <button
                  type="button"
                  onClick={goNext}
                  aria-label="Next vehicle"
                  className="absolute right-1 top-1/2 z-50 hidden h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full border border-white/15 bg-[#040E21]/60 text-white backdrop-blur-xl transition-all duration-300 hover:scale-110 hover:border-[#D41F2D] hover:bg-[#D41F2D] hover:text-black sm:right-5 sm:flex sm:h-12 sm:w-12 lg:right-10"
                >
                  <ArrowRight size={19} />
                </button>
              </>
            )}

            <div
              onTouchStart={handleTouchStart}
              onTouchEnd={handleTouchEnd}
              onTouchCancel={handleTouchCancel}
              className={`relative mx-auto max-w-[1500px] touch-pan-y ${STAGE_HEIGHT}`}
            >
              {cars.map((car, index) => {
                const position = getPosition(index);

                const isCenter = position === 0;
                const isLeft = position === -1;
                const isRight = position === 1;

                let positionClass = "";

                if (isCenter) {
                  positionClass =
                    "left-1/2 w-[96%] translate-x-[-50%] scale-100 opacity-100 blur-0 z-30 sm:w-[80%] lg:w-[72%]";
                } else if (isLeft) {
                  positionClass =
                    "left-[-18%] w-[58%] translate-x-0 scale-[0.72] opacity-25 blur-[2px] z-10 sm:left-[-12%] sm:w-[55%] sm:scale-[0.78] lg:left-[-8%] lg:w-[48%]";
                } else if (isRight) {
                  positionClass =
                    "left-[118%] w-[58%] translate-x-[-100%] scale-[0.72] opacity-25 blur-[2px] z-10 sm:left-[112%] sm:w-[55%] sm:scale-[0.78] lg:left-[108%] lg:w-[48%]";
                } else {
                  positionClass =
                    "left-1/2 w-[50%] translate-x-[-50%] scale-[0.5] opacity-0 blur-[15px] z-0 pointer-events-none";
                }

                return (
                  <div
                    key={car.id}
                    className={`absolute top-1/2 h-full -translate-y-1/2 transition-all duration-700 ease-[cubic-bezier(0.22,1,0.36,1)] ${positionClass}`}
                  >
                    <div className="relative h-full w-full">
                      {/* Floor reflection/glow */}
                      {isCenter && (
                        <div className="absolute bottom-[4%] left-1/2 h-16 w-[65%] -translate-x-1/2 rounded-full bg-[#D41F2D]/20 blur-3xl transition-opacity duration-700" />
                      )}

                      {/* FIX: the center car was scaled to 125% on every
                          screen. On a phone that made it wider than the
                          section, so the front and back were cut off. It now
                          stays at 100% on phones and grows from sm: up. */}
                      <Image
                        src={car.image}
                        alt={car.name}
                        fill
                        priority={isCenter}
                        unoptimized
                        sizes="(min-width: 1024px) 72vw, 96vw"
                        draggable={false}
                        className={`relative z-10 select-none object-contain transition-all duration-700 ease-[cubic-bezier(0.22,1,0.36,1)] ${
                          isCenter
                            ? "scale-100 drop-shadow-[0_30px_30px_rgba(0,0,0,0.85)] sm:scale-125 sm:drop-shadow-[0_40px_40px_rgba(0,0,0,0.85)]"
                            : "drop-shadow-[0_20px_25px_rgba(0,0,0,0.5)]"
                        }`}
                      />
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Car Details */}
            <div
              key={`${activeCar.id}-${direction}`}
              className={`relative z-40 mx-auto mt-4 max-w-4xl text-center sm:mt-8 ${
                direction === "next"
                  ? "animate-[showcaseDetailsNext_500ms_ease-out]"
                  : "animate-[showcaseDetailsPrev_500ms_ease-out]"
              }`}
            >
              {/* FIX: "text-md" is not a Tailwind class, so it did nothing */}
              <div className="flex flex-wrap items-center justify-center gap-x-2 text-sm text-[var(--muted-soft)] sm:text-base">
                <span>{activeCar.year}</span>
                <span>•</span>
                <span>{activeCar.type}</span>
                <span>•</span>
                <span>{activeCar.mileage}</span>
              </div>

              <h3 className="mt-2 break-words text-2xl font-bold text-[var(--foreground)] sm:text-3xl">
                {activeCar.name}
              </h3>

              {/* Specs */}
              <div className="mt-5 flex items-center justify-center divide-x divide-[var(--border)] sm:mt-6">
                <div className="flex min-w-0 items-center gap-2 px-4 sm:px-7">
                  <Gauge size={17} className="shrink-0 text-[#FF5C68]" />
                  <div className="min-w-0 text-left">
                    <p className="text-sm font-semibold text-[var(--foreground)]">
                      {activeCar.engine}
                    </p>
                    <p className="text-[10px] uppercase tracking-wider text-[var(--muted-soft)]">
                      Engine
                    </p>
                  </div>
                </div>

                <div className="flex min-w-0 items-center gap-2 px-4 sm:px-7">
                  <CarFront size={17} className="shrink-0 text-[#FF5C68]" />
                  <div className="min-w-0 text-left">
                    <p className="text-sm font-semibold text-[var(--foreground)]">
                      {activeCar.horsepower}
                    </p>
                    <p className="text-[10px] uppercase tracking-wider text-[var(--muted-soft)]">
                      Power
                    </p>
                  </div>
                </div>

                <div className="hidden items-center gap-2 px-4 sm:flex sm:px-7">
                  <Settings2 size={17} className="text-[#FF5C68]" />
                  <div className="text-left">
                    <p className="text-sm font-semibold text-[var(--foreground)]">
                      {activeCar.transmission}
                    </p>
                    <p className="text-[10px] uppercase tracking-wider text-[var(--muted-soft)]">
                      Transmission
                    </p>
                  </div>
                </div>
              </div>

              {/* CTA */}
              <div className="mt-6 sm:mt-7">
                <Link
                  href={`/showroom/car/${activeCar.id}`}
                  className="group inline-flex items-center gap-3 rounded-full border border-[#D41F2D] px-6 py-3 text-sm font-semibold text-[#FF5C68] transition-all duration-300 hover:scale-105 hover:bg-[#D41F2D] hover:text-black"
                >
                  View Details
                  <ArrowRight
                    size={16}
                    className="transition-transform duration-300 group-hover:translate-x-1"
                  />
                </Link>
              </div>

              {/* Controls: phone arrows + dots */}
              {total > 1 && (
                <div className="mt-6 flex items-center justify-center gap-3 sm:mt-7">
                  <button
                    type="button"
                    onClick={goPrevious}
                    aria-label="Previous vehicle"
                    className="flex h-10 w-10 items-center justify-center rounded-full border border-white/15 bg-[#040E21]/60 text-white transition-colors hover:border-[#D41F2D] hover:bg-[#D41F2D] hover:text-black sm:hidden"
                  >
                    <ArrowLeft size={18} />
                  </button>

                  <div className="flex items-center justify-center">
                    {cars.map((car, index) => (
                      // FIX: bigger tap area around each dot (was 6px wide)
                      <button
                        key={car.id}
                        type="button"
                        onClick={() => {
                          setDirection(index > safeIndex ? "next" : "prev");
                          setActiveIndex(index);
                        }}
                        aria-label={`View ${car.name}`}
                        aria-current={index === safeIndex ? "true" : undefined}
                        className="flex h-8 items-center px-1"
                      >
                        <span
                          className={`block h-1.5 rounded-full transition-all duration-500 ${
                            index === safeIndex
                              ? "w-7 bg-[#D41F2D]"
                              : "w-1.5 bg-zinc-700 hover:bg-zinc-500"
                          }`}
                        />
                      </button>
                    ))}
                  </div>

                  <button
                    type="button"
                    onClick={goNext}
                    aria-label="Next vehicle"
                    className="flex h-10 w-10 items-center justify-center rounded-full border border-white/15 bg-[#040E21]/60 text-white transition-colors hover:border-[#D41F2D] hover:bg-[#D41F2D] hover:text-black sm:hidden"
                  >
                    <ArrowRight size={18} />
                  </button>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      <style jsx>{`
        @keyframes showcaseDetailsNext {
          0% {
            opacity: 0;
            transform: translateX(30px);
          }

          100% {
            opacity: 1;
            transform: translateX(0);
          }
        }

        @keyframes showcaseDetailsPrev {
          0% {
            opacity: 0;
            transform: translateX(-30px);
          }

          100% {
            opacity: 1;
            transform: translateX(0);
          }
        }
      `}</style>
    </section>
  );
}
