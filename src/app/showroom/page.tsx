// Path: app/showroom/page.tsx

"use client";

import Image from "next/image";
import Link from "next/link";
import {
  ArrowRight,
  CarFront,
  ChevronDown,
  Gauge,
  MapPin,
  RotateCcw,
  Search,
  ShieldCheck,
  Tag,
  X,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";

import Navbar from "@/components/layout/navbar";
import Footer from "@/components/layout/footer";
import { useCart } from "@/context/cart-context";
import {
  MEDIA_BASE_URL,
  PRICE_FALLBACK,
  fetchVehicles,
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
  "We couldn’t load the showroom inventory right now. Please refresh the page or contact our team for assistance.";
const CARS_PER_PAGE = 8;

const ring =
  "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#FF4D5A]";
const fieldClass = `h-12 w-full appearance-none rounded-xl border border-[#1A2A52] bg-[#020A18] px-4 pr-10 text-sm text-white outline-none transition-colors focus:border-[#FF4D5A]`;
const panel = "rounded-2xl border border-[#1A2A52] bg-[#08193B]";
const stateBox = `${panel} px-6 py-16 text-center`;
const coralBtn = `mt-6 inline-flex items-center gap-2 rounded-xl bg-[#FF4D5A] px-6 py-3.5 text-sm font-bold text-white transition-colors hover:bg-[#FF6B75] ${ring}`;
const pageBtn = `inline-flex h-10 items-center justify-center rounded-lg border border-[#1A2A52] px-4 text-sm font-semibold text-white transition-colors hover:border-[#FF4D5A] hover:text-[#FF4D5A] disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:border-[#1A2A52] disabled:hover:text-white ${ring}`;

const PRICE_RANGES = [
  { value: "all", label: "All prices" },
  { value: "under-50k", label: "Under ₱50k" },
  { value: "50k-70k", label: "₱50k - ₱70k" },
  { value: "70k-plus", label: "₱70k+" },
];

function Select({
  value,
  onChange,
  children,
  label,
}: {
  value: string;
  onChange: (v: string) => void;
  children: React.ReactNode;
  label: string;
}) {
  return (
    <div className="relative">
      <select
        aria-label={label}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={fieldClass}
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

export default function ShowroomPage() {
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [sortOrder, setSortOrder] = useState("newest");
  const [priceRange, setPriceRange] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [recentlyAdded, setRecentlyAdded] = useState<number[]>([]);

  const { addToCart } = useCart();

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

  const typeOptions = useMemo(
    () => [
      "all",
      ...Array.from(new Set(vehicles.map((v) => v.type).filter(Boolean))),
    ],
    [vehicles],
  );

  const availableCount = useMemo(
    () =>
      vehicles.filter((v) => v.status === "available" && v.stock > 0).length,
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
      const matchesType = typeFilter === "all" || car.type === typeFilter;
      const p = car.price_value;
      // Cars without a price only show under "All prices".
      const matchesPrice =
        priceRange === "all" ||
        (hasPrice(car) &&
          ((priceRange === "under-50k" && p < 50000) ||
            (priceRange === "50k-70k" && p >= 50000 && p <= 70000) ||
            (priceRange === "70k-plus" && p > 70000)));
      return matchesSearch && matchesType && matchesPrice;
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
  }, [vehicles, search, typeFilter, sortOrder, priceRange]);

  const totalPages = Math.max(
    1,
    Math.ceil(filteredCars.length / CARS_PER_PAGE),
  );

  useEffect(() => {
    setCurrentPage((p) => Math.min(p, totalPages));
  }, [totalPages]);

  useEffect(() => {
    setCurrentPage(1);
  }, [search, typeFilter, sortOrder, priceRange]);

  const paginatedCars = useMemo(() => {
    const start = (currentPage - 1) * CARS_PER_PAGE;
    return filteredCars.slice(start, start + CARS_PER_PAGE);
  }, [filteredCars, currentPage]);

  const clearFilters = () => {
    setSearch("");
    setTypeFilter("all");
    setSortOrder("newest");
    setPriceRange("all");
  };

  const hasActiveFilters =
    search.trim() !== "" ||
    typeFilter !== "all" ||
    priceRange !== "all" ||
    sortOrder !== "newest";

  const handleAddToCart = (event: React.MouseEvent, car: Vehicle) => {
    event.preventDefault();
    event.stopPropagation();
    // Safety net: never add a car without a real price.
    if (!hasPrice(car)) return;
    addToCart({
      id: car.id,
      name: car.name,
      price: car.price,
      image: resolveMediaUrl(car.image, MEDIA_BASE_URL),
      year: car.year,
      type: car.type,
      stock: car.stock,
    });
    setRecentlyAdded((c) => [...c, car.id]);
    window.setTimeout(
      () => setRecentlyAdded((c) => c.filter((id) => id !== car.id)),
      1500,
    );
  };

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
                Find your
                <span className="block text-[#FF4D5A]">next car.</span>
              </h1>
              <p className="mt-6 max-w-xl text-base leading-7 text-white/75 sm:text-lg">
                Pick a body type, set your budget and reserve with a 20%
                downpayment. Every car is on the lot and ready to see.
              </p>
            </div>

            <div
              className={`${panel} flex w-full items-center gap-5 p-6 lg:w-80 lg:shrink-0`}
            >
              <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl border border-[#FF4D5A]/30 bg-[#FF4D5A]/10 text-[#FF4D5A]">
                <CarFront size={26} />
              </span>
              <div>
                <p className="text-5xl font-black leading-none text-white">
                  {isLoading || loadError ? "--" : availableCount}
                </p>
                <p className="mt-1 text-sm font-medium text-white/65">
                  car{availableCount !== 1 ? "s" : ""} ready to drive
                </p>
              </div>
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
                  className={`${fieldClass} pl-11 placeholder:text-white/35`}
                />
              </label>
              <Select
                label="Price range"
                value={priceRange}
                onChange={setPriceRange}
              >
                {PRICE_RANGES.map((r) => (
                  <option
                    key={r.value}
                    value={r.value}
                    className="bg-[#08193B]"
                  >
                    {r.label}
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
                <option value="price-low" className="bg-[#08193B]">
                  Price: low to high
                </option>
                <option value="price-high" className="bg-[#08193B]">
                  Price: high to low
                </option>
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
                className="mb-6 mt-4 text-sm font-medium text-white/60"
                aria-live="polite"
              >
                Showing {filteredCars.length} of {vehicles.length} car
                {vehicles.length !== 1 ? "s" : ""}
              </p>
            )}

            <div className="mt-6">
              {isLoading ? (
                <div className={stateBox}>
                  <div className="mx-auto h-10 w-10 animate-spin rounded-full border-2 border-white/15 border-t-[#FF4D5A]" />
                  <p className="mt-6 text-xl font-bold">Loading cars...</p>
                </div>
              ) : loadError ? (
                <div className={stateBox}>
                  <p className="text-xl font-bold">
                    Couldn&apos;t load the showroom
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
                      ? "No cars in the showroom yet"
                      : "No matching cars found"}
                  </p>
                  <p className="mt-2 text-sm text-white/60">
                    {vehicles.length === 0
                      ? "Check back soon for new arrivals."
                      : "Try a different body type or price range."}
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
                  <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
                    {paginatedCars.map((car) => {
                      const unavailable =
                        car.status !== "available" || car.stock <= 0;
                      const priced = hasPrice(car);
                      const cartDisabled = unavailable || !priced;
                      const imageSrc = resolveMediaUrl(
                        car.image,
                        MEDIA_BASE_URL,
                      );
                      const label = unavailable
                        ? car.status === "sold"
                          ? "Sold"
                          : car.status === "reserved"
                            ? "Reserved"
                            : "Out of stock"
                        : !priced
                          ? "Inquire first"
                          : recentlyAdded.includes(car.id)
                            ? "Added ✓"
                            : "Add to cart";
                      const badgeText =
                        unavailable && car.status !== "available"
                          ? car.status
                          : car.badge;

                      return (
                        <Link
                          key={car.id}
                          href={`/showroom/car/${car.id}`}
                          className={`group flex h-full flex-col overflow-hidden rounded-2xl border border-[#1A2A52] bg-[#08193B] transition-colors hover:border-[#FF4D5A]/70 ${ring}`}
                        >
                          <div className="relative overflow-hidden bg-[#E6ECF7] p-3 pb-12">
                            {(car.badge || unavailable) && (
                              <div
                                title={badgeText ?? undefined}
                                className={`absolute right-3 top-3 z-10 max-w-[70%] truncate rounded-full px-3 py-1 text-xs font-bold capitalize ${
                                  unavailable
                                    ? "bg-[#030B1C] text-white"
                                    : "bg-[#FF4D5A] text-white"
                                }`}
                              >
                                {badgeText}
                              </div>
                            )}
                            {imageSrc ? (
                              <Image
                                src={imageSrc}
                                alt={car.name}
                                width={800}
                                height={500}
                                unoptimized
                                className={`h-48 w-full object-contain transition-transform duration-500 group-hover:scale-105 ${unavailable ? "opacity-60" : ""}`}
                              />
                            ) : (
                              <div className="flex h-48 items-center justify-center text-sm text-[#030B1C]/40">
                                No image available
                              </div>
                            )}
                            <span
                              className={`absolute bottom-0 left-0 rounded-tr-2xl bg-[#FF4D5A] px-4 py-2 font-black text-white ${
                                priced ? "text-xl" : "text-sm"
                              }`}
                            >
                              {priced ? car.price : PRICE_FALLBACK}
                            </span>
                          </div>

                          <div className="flex flex-1 flex-col p-5">
                            <p className="text-sm font-semibold text-[#FF4D5A]">
                              {car.year} | {car.type}
                            </p>
                            <h3 className="mt-1 text-xl font-extrabold leading-tight">
                              {car.name}
                            </h3>

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

                            <p className="mt-3 flex min-w-0 items-center gap-2 text-sm text-white/65">
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

                            <div className="mt-auto flex items-center gap-3 pt-5">
                              <button
                                type="button"
                                disabled={cartDisabled}
                                onClick={(e) => handleAddToCart(e, car)}
                                className="flex-1 rounded-xl bg-[#FF4D5A] px-4 py-3 text-sm font-bold text-white transition-colors hover:bg-[#FF6B75] disabled:cursor-not-allowed disabled:bg-white/10 disabled:text-white/40 disabled:hover:bg-white/10"
                              >
                                {label}
                              </button>
                              <span className="inline-flex shrink-0 items-center gap-1.5 text-sm font-semibold transition-colors group-hover:text-[#FF4D5A]">
                                Details
                                <ArrowRight
                                  size={16}
                                  className="transition-transform group-hover:translate-x-1"
                                />
                              </span>
                            </div>
                          </div>
                        </Link>
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

        {/* WHY US */}
        <section className="border-t border-[#FF4D5A]/15 bg-[#030B1C]">
          <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8 lg:py-20">
            <h2 className="max-w-3xl text-3xl font-black leading-tight sm:text-4xl lg:text-5xl">
              Why drivers choose{" "}
              <span className="text-[#FF4D5A]">Boss Auto Exchange</span>
            </h2>
            <div className="mt-10 grid gap-6 md:grid-cols-3">
              {[
                {
                  icon: Gauge,
                  title: "Inspected quality",
                  copy: "Every car is checked for condition, safety and performance before it reaches the showroom.",
                },
                {
                  icon: Tag,
                  title: "Clear pricing",
                  copy: "The price you see is the price we discuss. No hidden surprises.",
                },
                {
                  icon: ShieldCheck,
                  title: "Local experts",
                  copy: "Our team helps you compare cars and find the right fit for your budget.",
                },
              ].map(({ icon: Icon, title, copy }) => (
                <div key={title} className={`${panel} p-6`}>
                  <span className="flex h-12 w-12 items-center justify-center rounded-xl border border-[#FF4D5A]/30 bg-[#FF4D5A]/10 text-[#FF4D5A]">
                    <Icon size={22} />
                  </span>
                  <h3 className="mt-5 text-xl font-bold leading-tight">
                    {title}
                  </h3>
                  <p className="mt-3 text-sm leading-7 text-white/70">{copy}</p>
                </div>
              ))}
            </div>
            <div className="mt-10 flex flex-col gap-3 sm:flex-row">
              <Link
                href="/sell-trade"
                className={`inline-flex items-center justify-center rounded-xl bg-[#FF4D5A] px-7 py-3.5 text-sm font-bold text-white transition-colors hover:bg-[#FF6B75] ${ring}`}
              >
                Sell or trade your car
              </Link>
              <Link
                href="/contact"
                className={`inline-flex items-center justify-center rounded-xl border border-[#1A2A52] px-7 py-3.5 text-sm font-bold text-white transition-colors hover:border-[#FF4D5A] hover:text-[#FF4D5A] ${ring}`}
              >
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
