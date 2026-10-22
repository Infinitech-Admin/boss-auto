// Path: app/sold-cars/page.tsx
// Responsive fixes are marked with "FIX:" comments.

"use client";

import Image from "next/image";
import Link from "next/link";
import {
  ArrowRight,
  BadgeCheck,
  ChevronDown,
  MapPin,
  Phone,
  RotateCcw,
  Search,
  X,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import Navbar from "@/components/layout/navbar";
import Footer from "@/components/layout/footer";
import {
  MEDIA_BASE_URL,
  fetchSoldVehicles,
  hasPrice,
  isAbortError,
  resolveMediaUrl,
  type ApiError,
  type Vehicle,
} from "@/lib/api";

/*
  Boss Auto Exchange palette (matches the contact page)
  page #030B1C | section #061532 | card #08193B | input #020A18
  border #1A2A52 | coral #FF4D5A | coral hover #FF6B75 | text white
  image backdrop #E6ECF7
*/

const DEFAULT_LOAD_ERROR =
  "We couldn’t load our sold vehicles right now. Please refresh the page or contact our team for assistance.";

// Set to false if you don't want to show prices on sold cars.
const SHOW_PRICE = true;
const CARS_PER_PAGE = 12;

const ring =
  "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#FF4D5A]";

// FIX: text-base on phones. Inputs under 16px make iOS Safari zoom the page
// when you tap them, which looks like the layout is broken.
const fieldClass =
  "h-12 w-full min-w-0 rounded-xl border border-[#1A2A52] bg-[#020A18] px-4 text-base text-white placeholder:text-white/35 outline-none transition-colors focus:border-[#FF4D5A] sm:text-sm";

const panel = "rounded-2xl border border-[#1A2A52] bg-[#08193B]";
const stateBox = `${panel} px-5 py-12 text-center sm:px-6 sm:py-16`;
const coralBtn = `mt-6 inline-flex items-center gap-2 rounded-xl bg-[#FF4D5A] px-6 py-3.5 text-sm font-bold text-white transition-colors hover:bg-[#FF6B75] ${ring}`;
// FIX: 44px tall touch targets on phones
const pageBtn = `inline-flex h-11 items-center justify-center rounded-lg border border-[#1A2A52] px-4 text-sm font-semibold text-white transition-colors hover:border-[#FF4D5A] hover:text-[#FF4D5A] disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:border-[#1A2A52] disabled:hover:text-white sm:h-10 ${ring}`;

// FIX: show 1 … 4 5 6 … 20 instead of every page number, so many pages
// can't overflow or wrap into a wall of buttons.
function getPageList(current: number, total: number): (number | "…")[] {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);
  const wanted = Array.from(
    new Set([1, total, current - 1, current, current + 1]),
  )
    .filter((p) => p >= 1 && p <= total)
    .sort((a, b) => a - b);
  const out: (number | "…")[] = [];
  wanted.forEach((p, idx) => {
    if (idx > 0 && p - wanted[idx - 1] > 1) out.push("…");
    out.push(p);
  });
  return out;
}

function Select({
  value,
  onChange,
  label,
  children,
}: {
  value: string;
  onChange: (v: string) => void;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="relative min-w-0">
      <select
        aria-label={label}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={`${fieldClass} appearance-none truncate pr-10`}
      >
        {children}
      </select>
      <ChevronDown
        size={18}
        className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-[#FF4D5A]"
      />
    </div>
  );
}

export default function SoldCarsPage() {
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [selectedModel, setSelectedModel] = useState("all");
  const [sortOrder, setSortOrder] = useState("newest");
  const [currentPage, setCurrentPage] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const listTop = useRef<HTMLDivElement | null>(null);

  const load = useCallback(async (signal?: AbortSignal) => {
    setIsLoading(true);
    setLoadError(null);
    try {
      const { data } = await fetchSoldVehicles({ signal });
      setVehicles(data ?? []); // API already returns sold cars only
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

  const typeOptions = useMemo(
    () => [
      "all",
      ...Array.from(new Set(vehicles.map((v) => v.type).filter(Boolean))),
    ],
    [vehicles],
  );

  const modelOptions = useMemo(
    () => ["all", ...Array.from(new Set(vehicles.map((v) => v.name)))],
    [vehicles],
  );

  const filteredCars = useMemo(() => {
    const q = search.trim().toLowerCase();
    const filtered = vehicles.filter((car) => {
      const matchesSearch =
        q.length === 0 ||
        [car.name, car.type, car.location].some((v) =>
          (v ?? "").toLowerCase().includes(q),
        );
      return (
        matchesSearch &&
        (typeFilter === "all" || car.type === typeFilter) &&
        (selectedModel === "all" || car.name === selectedModel)
      );
    });

    return [...filtered].sort((a, b) => {
      switch (sortOrder) {
        case "newest":
          return Number(b.year) - Number(a.year);
        case "oldest":
          return Number(a.year) - Number(b.year);
        // Cars without a price always go to the end.
        case "price-low": {
          const pa = hasPrice(a) ? a.price_value : Infinity;
          const pb = hasPrice(b) ? b.price_value : Infinity;
          return pa === pb ? 0 : pa - pb;
        }
        case "price-high": {
          const pa = hasPrice(a) ? a.price_value : -Infinity;
          const pb = hasPrice(b) ? b.price_value : -Infinity;
          return pa === pb ? 0 : pb - pa;
        }
        default:
          return 0;
      }
    });
  }, [vehicles, search, typeFilter, selectedModel, sortOrder]);

  const totalPages = Math.max(
    1,
    Math.ceil(filteredCars.length / CARS_PER_PAGE),
  );

  useEffect(() => {
    setCurrentPage((page) => Math.min(page, totalPages));
  }, [totalPages]);

  useEffect(() => {
    setCurrentPage(1);
  }, [search, typeFilter, selectedModel, sortOrder]);

  const paginatedCars = useMemo(() => {
    const start = (currentPage - 1) * CARS_PER_PAGE;
    return filteredCars.slice(start, start + CARS_PER_PAGE);
  }, [filteredCars, currentPage]);

  // FIX: after changing page, bring the top of the list back into view.
  // On a phone the pagination is far below the cards, so without this the
  // person lands at the bottom of the next page.
  const goToPage = (page: number) => {
    setCurrentPage(Math.min(Math.max(1, page), totalPages));
    listTop.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const clearFilters = () => {
    setSearch("");
    setTypeFilter("all");
    setSelectedModel("all");
    setSortOrder("newest");
  };

  const hasActiveFilters =
    search.trim() !== "" ||
    typeFilter !== "all" ||
    selectedModel !== "all" ||
    sortOrder !== "newest";

  const modelCount = modelOptions.length - 1;

  return (
    <>
      <Navbar />
      {/* FIX: overflow-x-clip so nothing can create a sideways scroll */}
      <main className="min-h-screen overflow-x-clip bg-[#030B1C] text-white">
        {/* HEADER */}
        <section className="relative overflow-hidden border-b border-[#FF4D5A]/15 bg-[#030B1C]">
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 bg-[radial-gradient(55%_90%_at_65%_0%,rgba(255,77,90,0.16),transparent_70%)]"
          />

          <div className="relative mx-auto flex max-w-7xl flex-col gap-8 px-4 py-10 sm:gap-10 sm:px-6 sm:py-14 lg:flex-row lg:items-end lg:justify-between lg:px-8 lg:py-20">
            <div className="min-w-0 max-w-3xl">
              {/* FIX: text-4xl on phones (was text-5xl, too wide at 320px) */}
              <h1 className="break-words text-4xl font-black leading-[1.05] tracking-tight sm:text-6xl lg:text-7xl">
                Cars that
                <span className="block text-[#FF4D5A]">found homes.</span>
              </h1>
              <p className="mt-5 max-w-xl text-base leading-7 text-white/75 sm:mt-6 sm:text-lg">
                Every car here went to a happy driver. Your next ride could be
                on this list.
              </p>
            </div>

            {/* FIX: smaller padding, icon and number on phones */}
            <div
              className={`${panel} flex w-full items-stretch lg:w-96 lg:shrink-0`}
            >
              <div className="flex min-w-0 flex-1 items-center gap-3 p-4 sm:gap-4 sm:p-6">
                <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border border-[#FF4D5A]/30 bg-[#FF4D5A]/10 text-[#FF4D5A] sm:h-14 sm:w-14">
                  <BadgeCheck size={24} />
                </span>
                <div className="min-w-0">
                  <p className="text-4xl font-black leading-none text-white sm:text-5xl">
                    {isLoading || loadError ? "--" : vehicles.length}
                  </p>
                  <p className="mt-1 text-sm font-medium text-white/65">
                    car{vehicles.length !== 1 ? "s" : ""} sold
                  </p>
                </div>
              </div>
              {!isLoading && !loadError && modelCount > 0 && (
                <div className="flex shrink-0 flex-col justify-center border-l border-[#1A2A52] px-4 sm:px-6">
                  <p className="text-2xl font-black leading-none text-[#FF4D5A] sm:text-3xl">
                    {modelCount}
                  </p>
                  <p className="mt-1 text-xs font-medium text-white/55">
                    model{modelCount !== 1 ? "s" : ""}
                  </p>
                </div>
              )}
            </div>
          </div>
        </section>

        {/* LIST */}
        <section className="bg-[#061532]">
          <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 sm:py-12 lg:px-8 lg:py-16">
            {/* TYPE CHIPS */}
            {typeOptions.length > 2 && (
              <div
                role="group"
                aria-label="Body type"
                // FIX: chips scroll edge to edge on phones and never drag the page
                className="-mx-4 mb-5 flex gap-2 overflow-x-auto overscroll-x-contain px-4 pb-1 [scrollbar-width:none] sm:mx-0 sm:px-0 [&::-webkit-scrollbar]:hidden"
              >
                {typeOptions.map((t) => (
                  <button
                    key={t}
                    type="button"
                    aria-pressed={typeFilter === t}
                    onClick={() => setTypeFilter(t)}
                    className={`shrink-0 rounded-full border px-5 py-2.5 text-sm font-semibold transition-colors ${ring} ${
                      typeFilter === t
                        ? "border-[#FF4D5A] bg-[#FF4D5A] text-white"
                        : "border-[#1A2A52] bg-[#08193B] text-white/80 hover:border-[#FF4D5A] hover:text-white"
                    }`}
                  >
                    {t === "all" ? "All cars" : t}
                  </button>
                ))}
              </div>
            )}

            {/* FILTER BAR
                FIX: 1 column on phones, 2 on tablets (search spans both),
                one row on desktop. */}
            <div
              className={`${panel} grid grid-cols-1 gap-3 p-3 sm:grid-cols-2 sm:p-5 lg:grid-cols-[1.5fr_1fr_1fr_auto]`}
            >
              <label className="relative block min-w-0 sm:col-span-2 lg:col-span-1">
                <span className="sr-only">Search</span>
                <Search
                  size={16}
                  className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-[#FF4D5A]"
                />
                <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search model, type, or city"
                  className={`${fieldClass} pl-11`}
                />
              </label>

              <Select
                label="Model"
                value={selectedModel}
                onChange={setSelectedModel}
              >
                {modelOptions.map((model) => (
                  <option key={model} value={model} className="bg-[#08193B]">
                    {model === "all" ? "All models" : model}
                  </option>
                ))}
              </Select>

              <Select label="Sort" value={sortOrder} onChange={setSortOrder}>
                <option value="newest" className="bg-[#08193B]">
                  Newest first
                </option>
                <option value="oldest" className="bg-[#08193B]">
                  Oldest first
                </option>
                {SHOW_PRICE && (
                  <>
                    <option value="price-low" className="bg-[#08193B]">
                      Price: low to high
                    </option>
                    <option value="price-high" className="bg-[#08193B]">
                      Price: high to low
                    </option>
                  </>
                )}
              </Select>

              {hasActiveFilters && (
                <button
                  type="button"
                  onClick={clearFilters}
                  className={`inline-flex h-12 items-center justify-center gap-2 rounded-xl border border-[#1A2A52] px-5 text-sm font-semibold transition-colors hover:border-[#FF4D5A] hover:text-[#FF4D5A] sm:col-span-2 lg:col-span-1 ${ring}`}
                >
                  <X size={15} />
                  Clear
                </button>
              )}
            </div>

            {!isLoading && !loadError && vehicles.length > 0 && (
              <p
                className="mt-4 text-sm font-medium text-white/60"
                aria-live="polite"
              >
                Showing {filteredCars.length} of {vehicles.length} sold car
                {vehicles.length !== 1 ? "s" : ""}
              </p>
            )}

            {/* CONTENT */}
            <div ref={listTop} className="mt-6 scroll-mt-24">
              {isLoading ? (
                <div className={stateBox}>
                  <div className="mx-auto h-10 w-10 animate-spin rounded-full border-2 border-white/15 border-t-[#FF4D5A]" />
                  <p className="mt-6 text-xl font-bold">Loading sold cars...</p>
                </div>
              ) : loadError ? (
                <div className={stateBox}>
                  <p className="text-xl font-bold">
                    Couldn&apos;t load sold cars
                  </p>
                  <p className="mx-auto mt-3 max-w-xl text-sm leading-6 text-white/70">
                    {loadError}
                  </p>
                  <button
                    type="button"
                    onClick={() => load()}
                    className={coralBtn}
                  >
                    <RotateCcw size={16} />
                    Try again
                  </button>
                </div>
              ) : filteredCars.length === 0 ? (
                <div className={stateBox}>
                  <p className="text-xl font-bold">
                    {vehicles.length === 0
                      ? "No sold cars yet"
                      : "No matching cars found"}
                  </p>
                  <p className="mt-2 text-sm text-white/60">
                    {vehicles.length === 0
                      ? "Sold cars will show up here."
                      : "Try a different body type or model."}
                  </p>
                  {vehicles.length > 0 && (
                    <button
                      type="button"
                      onClick={clearFilters}
                      className={coralBtn}
                    >
                      <X size={15} />
                      Clear filters
                    </button>
                  )}
                </div>
              ) : (
                <>
                  {/* FIX: 1 / 2 / 3 / 4 columns (was 1 / 2 / 4, so tablets
                      and small laptops got oversized cards). */}
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-6 lg:grid-cols-3 xl:grid-cols-4">
                    {paginatedCars.map((car) => {
                      const imageSrc = resolveMediaUrl(
                        car.image,
                        MEDIA_BASE_URL,
                      );
                      const showPrice = SHOW_PRICE && hasPrice(car);

                      return (
                        <article
                          key={car.id}
                          className="group flex h-full min-w-0 flex-col overflow-hidden rounded-2xl border border-[#1A2A52] bg-[#08193B] transition-colors hover:border-[#FF4D5A]/70"
                        >
                          {/* Photo with SOLD stamp */}
                          <div className="relative overflow-hidden bg-[#E6ECF7] p-3">
                            {imageSrc ? (
                              // FIX: aspect ratio instead of a fixed h-48, so
                              // the photo scales with the card width.
                              <Image
                                src={imageSrc}
                                alt={car.name}
                                width={800}
                                height={500}
                                unoptimized
                                className="aspect-[16/10] h-auto w-full object-contain opacity-70 grayscale-[35%] transition duration-500 group-hover:opacity-90 group-hover:grayscale-0"
                              />
                            ) : (
                              <div className="flex aspect-[16/10] items-center justify-center text-sm text-[#030B1C]/40">
                                No image available
                              </div>
                            )}
                            {/* FIX: smaller stamp on phones */}
                            <span
                              aria-label="Sold"
                              className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 -rotate-12 rounded-md border-4 border-[#FF4D5A] bg-[#E6ECF7]/80 px-4 py-0.5 text-2xl font-black uppercase tracking-widest text-[#FF4D5A] sm:px-5 sm:py-1 sm:text-3xl"
                            >
                              Sold
                            </span>
                          </div>

                          <div className="flex min-w-0 flex-1 flex-col p-4 sm:p-5">
                            <p className="text-sm font-semibold text-[#FF4D5A]">
                              {car.year} | {car.type}
                            </p>
                            <h2 className="mt-1 break-words text-lg font-extrabold leading-tight sm:text-xl">
                              {car.name}
                            </h2>

                            {showPrice && (
                              <p className="mt-2 text-sm text-white/60">
                                Sold at{" "}
                                <span className="text-lg font-black text-white">
                                  {car.price}
                                </span>
                              </p>
                            )}

                            {/* FIX: allow 2 lines so long engine names aren't
                                cut off in the narrow two-column layout */}
                            <dl className="mt-4 grid grid-cols-2 divide-x divide-[#1A2A52] border-y border-[#1A2A52] text-sm">
                              <div className="min-w-0 py-3 pr-3">
                                <dt className="text-xs font-medium text-white/50">
                                  Mileage
                                </dt>
                                <dd
                                  className="mt-1 line-clamp-2 break-words font-semibold"
                                  title={car.mileage}
                                >
                                  {car.mileage}
                                </dd>
                              </div>
                              <div className="min-w-0 py-3 pl-3">
                                <dt className="text-xs font-medium text-white/50">
                                  Engine
                                </dt>
                                <dd
                                  className="mt-1 line-clamp-2 break-words font-semibold"
                                  title={car.engine}
                                >
                                  {car.engine}
                                </dd>
                              </div>
                            </dl>

                            <p className="mt-auto flex min-w-0 items-start gap-2 pt-4 text-sm text-white/65">
                              <MapPin
                                size={14}
                                className="mt-0.5 shrink-0 text-[#FF4D5A]"
                              />
                              <span
                                className="line-clamp-2 break-words"
                                title={car.location}
                              >
                                {car.location}
                              </span>
                            </p>
                          </div>
                        </article>
                      );
                    })}
                  </div>

                  {/* PAGINATION
                      FIX: phones get Previous / "Page 2 of 5" / Next.
                      sm and up get numbered buttons with ellipses. */}
                  {filteredCars.length > CARS_PER_PAGE && (
                    <nav
                      aria-label="Pagination"
                      className="mt-8 flex items-center justify-center gap-2 sm:mt-10 sm:gap-3"
                    >
                      <button
                        type="button"
                        onClick={() => goToPage(currentPage - 1)}
                        disabled={currentPage === 1}
                        className={pageBtn}
                      >
                        Previous
                      </button>

                      <p
                        className="min-w-[6.5rem] text-center text-sm font-semibold text-white/80 sm:hidden"
                        aria-live="polite"
                      >
                        Page {currentPage} of {totalPages}
                      </p>

                      <div className="hidden items-center justify-center gap-2 sm:flex">
                        {getPageList(currentPage, totalPages).map(
                          (page, idx) =>
                            page === "…" ? (
                              <span
                                key={`ellipsis-${idx}`}
                                aria-hidden="true"
                                className="px-1 text-white/50"
                              >
                                …
                              </span>
                            ) : (
                              <button
                                key={page}
                                type="button"
                                onClick={() => goToPage(page)}
                                aria-label={`Page ${page}`}
                                aria-current={
                                  currentPage === page ? "page" : undefined
                                }
                                className={`flex h-10 w-10 items-center justify-center rounded-lg text-sm font-bold transition-colors ${ring} ${
                                  currentPage === page
                                    ? "bg-[#FF4D5A] text-white"
                                    : "border border-[#1A2A52] hover:border-[#FF4D5A] hover:text-[#FF4D5A]"
                                }`}
                              >
                                {page}
                              </button>
                            ),
                        )}
                      </div>

                      <button
                        type="button"
                        onClick={() => goToPage(currentPage + 1)}
                        disabled={currentPage === totalPages}
                        className={pageBtn}
                      >
                        Next
                      </button>
                    </nav>
                  )}
                </>
              )}
            </div>
          </div>
        </section>

        {/* BOTTOM BAND
            FIX: switches to side-by-side at xl (was lg, where the text and
            three buttons were squeezed together), and buttons are full width
            on phones. */}
        <section className="relative overflow-hidden border-t border-[#FF4D5A]/15 bg-[#030B1C]">
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 bg-[radial-gradient(50%_100%_at_30%_100%,rgba(255,77,90,0.14),transparent_70%)]"
          />
          <div className="relative mx-auto flex max-w-7xl flex-col gap-6 px-4 py-10 sm:px-6 sm:py-14 lg:px-8 xl:flex-row xl:items-center xl:justify-between">
            <div className="min-w-0">
              <h2 className="text-2xl font-black leading-tight sm:text-4xl">
                Your car could be <span className="text-[#FF4D5A]">next.</span>
              </h2>
              <p className="mt-3 max-w-xl text-base leading-7 text-white/75">
                Find your next ride in the showroom, or sell or trade in the car
                you have now.
              </p>
            </div>
            <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap xl:shrink-0 xl:flex-nowrap">
              <Link
                href="/showroom"
                className={`inline-flex w-full items-center justify-center gap-2 rounded-xl bg-[#FF4D5A] px-7 py-3.5 text-sm font-bold text-white transition-colors hover:bg-[#FF6B75] sm:w-auto ${ring}`}
              >
                View showroom
                <ArrowRight size={16} />
              </Link>
              <Link
                href="/sell-trade"
                className={`inline-flex w-full items-center justify-center rounded-xl border border-[#1A2A52] bg-[#08193B] px-7 py-3.5 text-sm font-bold text-white transition-colors hover:border-[#FF4D5A] hover:text-[#FF4D5A] sm:w-auto ${ring}`}
              >
                Sell or trade
              </Link>
              <Link
                href="/contact"
                className={`inline-flex w-full items-center justify-center gap-2 rounded-xl border border-[#1A2A52] px-7 py-3.5 text-sm font-bold text-white transition-colors hover:border-[#FF4D5A] hover:text-[#FF4D5A] sm:w-auto ${ring}`}
              >
                <Phone size={16} />
                Contact us
              </Link>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
