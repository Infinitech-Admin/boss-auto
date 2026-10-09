// Path: app/sold-cars/page.tsx

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
import { useCallback, useEffect, useMemo, useState } from "react";

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

const fieldClass =
  "h-12 w-full rounded-xl border border-[#1A2A52] bg-[#020A18] px-4 text-sm text-white placeholder:text-white/35 outline-none transition-colors focus:border-[#FF4D5A]";

const panel = "rounded-2xl border border-[#1A2A52] bg-[#08193B]";
const stateBox = `${panel} px-6 py-16 text-center`;
const coralBtn = `mt-6 inline-flex items-center gap-2 rounded-xl bg-[#FF4D5A] px-6 py-3.5 text-sm font-bold text-white transition-colors hover:bg-[#FF6B75] ${ring}`;
const pageBtn = `inline-flex h-10 items-center justify-center rounded-lg border border-[#1A2A52] px-4 text-sm font-semibold text-white transition-colors hover:border-[#FF4D5A] hover:text-[#FF4D5A] disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:border-[#1A2A52] disabled:hover:text-white ${ring}`;

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
    <div className="relative">
      <select
        aria-label={label}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={`${fieldClass} appearance-none pr-10`}
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
      <main className="min-h-screen bg-[#030B1C] text-white">
        {/* HEADER */}
        <section className="relative overflow-hidden border-b border-[#FF4D5A]/15 bg-[#030B1C]">
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 bg-[radial-gradient(55%_90%_at_65%_0%,rgba(255,77,90,0.16),transparent_70%)]"
          />

          <div className="relative mx-auto flex max-w-7xl flex-col gap-10 px-4 py-14 sm:px-6 lg:flex-row lg:items-end lg:justify-between lg:px-8 lg:py-20">
            <div className="max-w-3xl">
              <h1 className="text-5xl font-black leading-[1.02] tracking-tight sm:text-6xl lg:text-7xl">
                Cars that
                <span className="block text-[#FF4D5A]">found homes.</span>
              </h1>
              <p className="mt-6 max-w-xl text-base leading-7 text-white/75 sm:text-lg">
                Every car here went to a happy driver. Your next ride could be
                on this list.
              </p>
            </div>

            <div
              className={`${panel} flex w-full items-stretch lg:w-96 lg:shrink-0`}
            >
              <div className="flex flex-1 items-center gap-4 p-6">
                <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl border border-[#FF4D5A]/30 bg-[#FF4D5A]/10 text-[#FF4D5A]">
                  <BadgeCheck size={26} />
                </span>
                <div>
                  <p className="text-5xl font-black leading-none text-white">
                    {isLoading || loadError ? "--" : vehicles.length}
                  </p>
                  <p className="mt-1 text-sm font-medium text-white/65">
                    car{vehicles.length !== 1 ? "s" : ""} sold
                  </p>
                </div>
              </div>
              {!isLoading && !loadError && modelCount > 0 && (
                <div className="flex flex-col justify-center border-l border-[#1A2A52] px-6">
                  <p className="text-3xl font-black leading-none text-[#FF4D5A]">
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
          <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8 lg:py-16">
            {/* TYPE CHIPS */}
            {typeOptions.length > 2 && (
              <div
                role="group"
                aria-label="Body type"
                className="mb-5 flex gap-2 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
              >
                {typeOptions.map((t) => (
                  <button
                    key={t}
                    type="button"
                    aria-pressed={typeFilter === t}
                    onClick={() => setTypeFilter(t)}
                    className={`shrink-0 rounded-full border px-5 py-2 text-sm font-semibold transition-colors ${ring} ${
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

            {/* FILTER BAR */}
            <div
              className={`${panel} grid gap-3 p-4 sm:p-5 lg:grid-cols-[1.5fr_1fr_1fr_auto]`}
            >
              <label className="relative block">
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
                  className={`inline-flex h-12 items-center justify-center gap-2 rounded-xl border border-[#1A2A52] px-5 text-sm font-semibold transition-colors hover:border-[#FF4D5A] hover:text-[#FF4D5A] ${ring}`}
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
            <div className="mt-6">
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
                  <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-4">
                    {paginatedCars.map((car) => {
                      const imageSrc = resolveMediaUrl(
                        car.image,
                        MEDIA_BASE_URL,
                      );
                      const showPrice = SHOW_PRICE && hasPrice(car);

                      return (
                        <article
                          key={car.id}
                          className="group flex h-full flex-col overflow-hidden rounded-2xl border border-[#1A2A52] bg-[#08193B] transition-colors hover:border-[#FF4D5A]/70"
                        >
                          {/* Photo with SOLD stamp */}
                          <div className="relative overflow-hidden bg-[#E6ECF7] p-3">
                            {imageSrc ? (
                              <Image
                                src={imageSrc}
                                alt={car.name}
                                width={800}
                                height={500}
                                unoptimized
                                className="h-48 w-full object-contain opacity-70 grayscale-[35%] transition duration-500 group-hover:opacity-90 group-hover:grayscale-0"
                              />
                            ) : (
                              <div className="flex h-48 items-center justify-center text-sm text-[#030B1C]/40">
                                No image available
                              </div>
                            )}
                            <span
                              aria-label="Sold"
                              className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 -rotate-12 rounded-md border-4 border-[#FF4D5A] bg-[#E6ECF7]/80 px-5 py-1 text-3xl font-black uppercase tracking-widest text-[#FF4D5A]"
                            >
                              Sold
                            </span>
                          </div>

                          <div className="flex flex-1 flex-col p-5">
                            <p className="text-sm font-semibold text-[#FF4D5A]">
                              {car.year} | {car.type}
                            </p>
                            <h2 className="mt-1 text-xl font-extrabold leading-tight">
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

                            <dl className="mt-4 grid grid-cols-2 divide-x divide-[#1A2A52] border-y border-[#1A2A52] text-sm">
                              <div className="min-w-0 py-3 pr-3">
                                <dt className="text-xs font-medium text-white/50">
                                  Mileage
                                </dt>
                                <dd
                                  className="mt-1 line-clamp-1 font-semibold"
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
                                  className="mt-1 line-clamp-1 font-semibold"
                                  title={car.engine}
                                >
                                  {car.engine}
                                </dd>
                              </div>
                            </dl>

                            <p className="mt-auto flex min-w-0 items-center gap-2 pt-4 text-sm text-white/65">
                              <MapPin
                                size={14}
                                className="shrink-0 text-[#FF4D5A]"
                              />
                              <span
                                className="line-clamp-1"
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

                  {filteredCars.length > CARS_PER_PAGE && (
                    <div className="mt-10 flex flex-wrap items-center justify-center gap-3">
                      <button
                        type="button"
                        onClick={() =>
                          setCurrentPage((p) => Math.max(1, p - 1))
                        }
                        disabled={currentPage === 1}
                        className={pageBtn}
                      >
                        Previous
                      </button>
                      <div className="flex flex-wrap items-center justify-center gap-2">
                        {Array.from(
                          { length: totalPages },
                          (_, i) => i + 1,
                        ).map((page) => (
                          <button
                            key={page}
                            type="button"
                            onClick={() => setCurrentPage(page)}
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
                        ))}
                      </div>
                      <button
                        type="button"
                        onClick={() =>
                          setCurrentPage((p) => Math.min(totalPages, p + 1))
                        }
                        disabled={currentPage === totalPages}
                        className={pageBtn}
                      >
                        Next
                      </button>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </section>

        {/* BOTTOM BAND */}
        <section className="relative overflow-hidden border-t border-[#FF4D5A]/15 bg-[#030B1C]">
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 bg-[radial-gradient(50%_100%_at_30%_100%,rgba(255,77,90,0.14),transparent_70%)]"
          />
          <div className="relative mx-auto flex max-w-7xl flex-col gap-6 px-4 py-14 sm:px-6 lg:flex-row lg:items-center lg:justify-between lg:px-8">
            <div>
              <h2 className="text-3xl font-black leading-tight sm:text-4xl">
                Your car could be <span className="text-[#FF4D5A]">next.</span>
              </h2>
              <p className="mt-3 max-w-xl text-base leading-7 text-white/75">
                Find your next ride in the showroom, or sell or trade in the car
                you have now.
              </p>
            </div>
            <div className="flex flex-col gap-3 sm:flex-row">
              <Link
                href="/showroom"
                className={`inline-flex items-center justify-center gap-2 rounded-xl bg-[#FF4D5A] px-7 py-3.5 text-sm font-bold text-white transition-colors hover:bg-[#FF6B75] ${ring}`}
              >
                View showroom
                <ArrowRight size={16} />
              </Link>
              <Link
                href="/sell-trade"
                className={`inline-flex items-center justify-center rounded-xl border border-[#1A2A52] bg-[#08193B] px-7 py-3.5 text-sm font-bold text-white transition-colors hover:border-[#FF4D5A] hover:text-[#FF4D5A] ${ring}`}
              >
                Sell or trade
              </Link>
              <Link
                href="/contact"
                className={`inline-flex items-center justify-center gap-2 rounded-xl border border-[#1A2A52] px-7 py-3.5 text-sm font-bold text-white transition-colors hover:border-[#FF4D5A] hover:text-[#FF4D5A] ${ring}`}
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
