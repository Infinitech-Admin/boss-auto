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
  Sparkles,
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
  Prime Auto Display palette
  dark #1C0606 | page #150404 | panel #2A0A0A | input #2E0C0C | maroon #9B1111
  gold #F9A602 | cream #FDF5DC | image backdrop #F5E9C8
*/

const DEFAULT_LOAD_ERROR =
  "We couldn’t load the showroom inventory right now. Please refresh the page or contact our team for assistance.";
const CARS_PER_PAGE = 8;

const ring =
  "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#F9A602]";
const fieldClass = `h-12 w-full appearance-none border-2 border-[#FDF5DC]/15 bg-[#2E0C0C] px-4 pr-10 text-sm text-[#FDF5DC] outline-none transition-colors focus:border-[#F9A602] focus:bg-[#3A1212]`;
const stateBox =
  "border-t-4 border-[#F9A602] bg-[#2A0A0A] px-6 py-16 text-center";
const goldBtn = `chamfer mt-6 inline-flex items-center gap-2 bg-[#F9A602] px-7 py-4 text-sm font-bold uppercase tracking-wider text-[#1C0606] transition-colors hover:bg-[#FDF5DC] ${ring}`;
const pageBtn = `inline-flex h-10 items-center justify-center border-2 border-[#FDF5DC]/25 px-4 text-sm font-bold uppercase tracking-wider transition-colors hover:border-[#F9A602] hover:text-[#F9A602] disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:border-[#FDF5DC]/25 disabled:hover:text-[#FDF5DC] ${ring}`;

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
        className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-[#F9A602]"
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
      <main className="min-h-screen bg-[#1C0606] text-[#FDF5DC]">
        {/* HEADER */}
        <section className="relative overflow-hidden bg-[#1C0606]">
          <div
            aria-hidden="true"
            className="pointer-events-none absolute -right-24 top-0 hidden h-full w-72 -skew-x-12 bg-[#9B1111] lg:block"
          />
          <div
            aria-hidden="true"
            className="pointer-events-none absolute -right-4 top-0 hidden h-full w-6 -skew-x-12 bg-[#F9A602] lg:block"
          />
          <div className="relative mx-auto flex max-w-7xl flex-col gap-10 px-4 py-14 sm:px-6 lg:flex-row lg:items-end lg:justify-between lg:px-8 lg:py-20 xl:pr-40 2xl:pr-8">
            <div className="max-w-4xl border-l-8 border-[#F9A602] pl-5 sm:pl-8">
              <h1 className="text-5xl font-black uppercase leading-[0.92] tracking-tight sm:text-6xl lg:text-8xl">
                Find your next car.
              </h1>
              <p className="mt-6 max-w-2xl text-base leading-7 text-[#FDF5DC]/70 sm:text-lg">
                Pick a body type, set your budget and reserve with a 20%
                downpayment. Every car is on the lot and ready to see.
              </p>
            </div>

            <div className="flex w-full items-center gap-5 border-t-4 border-[#F9A602] bg-[#2A0A0A] p-6 lg:w-80 lg:shrink-0">
              <span className="chamfer flex h-14 w-14 shrink-0 items-center justify-center bg-[#9B1111] text-[#F9A602]">
                <CarFront size={26} />
              </span>
              <div>
                <p className="text-5xl font-black leading-none text-[#F9A602]">
                  {isLoading || loadError ? "--" : availableCount}
                </p>
                <p className="mt-1 text-sm font-semibold text-[#FDF5DC]/65">
                  car{availableCount !== 1 ? "s" : ""} ready to drive
                </p>
              </div>
            </div>
          </div>
          <div aria-hidden="true" className="tread" />
        </section>

        {/* LIST */}
        <section className="bg-[#150404]">
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
                    className={`shrink-0 border-2 px-5 py-2.5 text-sm font-bold uppercase tracking-wider transition-colors ${ring} ${
                      typeFilter === t
                        ? "border-[#F9A602] bg-[#F9A602] text-[#1C0606]"
                        : "border-[#FDF5DC]/20 hover:border-[#F9A602] hover:text-[#F9A602]"
                    }`}
                  >
                    {t === "all" ? "All cars" : t}
                  </button>
                ))}
              </div>
            )}

            {/* FILTER BAR */}
            <div className="grid gap-3 border-t-4 border-[#F9A602] bg-[#2A0A0A] p-4 sm:p-5 lg:grid-cols-[1.5fr_1fr_1fr_auto]">
              <label className="relative block">
                <span className="sr-only">Search</span>
                <Search
                  size={16}
                  className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-[#F9A602]"
                />
                <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search model, type, or city"
                  className={`${fieldClass} pl-11 placeholder:text-[#FDF5DC]/40`}
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
                    className="bg-[#2E0C0C]"
                  >
                    {r.label}
                  </option>
                ))}
              </Select>
              <Select label="Sort" value={sortOrder} onChange={setSortOrder}>
                <option value="newest" className="bg-[#2E0C0C]">
                  Newest first
                </option>
                <option value="oldest" className="bg-[#2E0C0C]">
                  Oldest first
                </option>
                <option value="price-low" className="bg-[#2E0C0C]">
                  Price: low to high
                </option>
                <option value="price-high" className="bg-[#2E0C0C]">
                  Price: high to low
                </option>
              </Select>
              {hasActiveFilters && (
                <button
                  type="button"
                  onClick={clearFilters}
                  className={`inline-flex h-12 items-center justify-center gap-2 border-2 border-[#FDF5DC]/25 px-5 text-sm font-bold uppercase tracking-wider transition-colors hover:border-[#F9A602] hover:bg-[#9B1111] ${ring}`}
                >
                  <X size={15} />
                  Clear
                </button>
              )}
            </div>

            {!isLoading && !loadError && vehicles.length > 0 && (
              <p
                className="mb-6 mt-4 text-sm font-semibold text-[#FDF5DC]/60"
                aria-live="polite"
              >
                Showing {filteredCars.length} of {vehicles.length} car
                {vehicles.length !== 1 ? "s" : ""}
              </p>
            )}

            <div className="mt-6">
              {isLoading ? (
                <div className={stateBox}>
                  <div className="mx-auto h-10 w-10 animate-spin rounded-full border-2 border-[#FDF5DC]/15 border-t-[#F9A602]" />
                  <p className="mt-6 text-2xl font-black uppercase">
                    Loading cars...
                  </p>
                </div>
              ) : loadError ? (
                <div className={stateBox}>
                  <p className="text-2xl font-black uppercase">
                    Couldn&apos;t load the showroom
                  </p>
                  <p className="mx-auto mt-3 max-w-xl text-sm leading-6 text-[#FDF5DC]/70">
                    {loadError}
                  </p>
                  <button
                    type="button"
                    onClick={() => load()}
                    className={goldBtn}
                  >
                    <RotateCcw size={16} />
                    Try again
                  </button>
                </div>
              ) : filteredCars.length === 0 ? (
                <div className={stateBox}>
                  <p className="text-2xl font-black uppercase">
                    {vehicles.length === 0
                      ? "No cars in the showroom yet"
                      : "No matching cars found"}
                  </p>
                  <p className="mt-2 text-sm text-[#FDF5DC]/60">
                    {vehicles.length === 0
                      ? "Check back soon for new arrivals."
                      : "Try a different body type or price range."}
                  </p>
                  {vehicles.length > 0 && (
                    <button
                      type="button"
                      onClick={clearFilters}
                      className={goldBtn}
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
                          className={`group flex h-full flex-col overflow-hidden border-t-4 border-transparent bg-[#2A0A0A] transition-colors hover:border-[#F9A602] ${ring}`}
                        >
                          <div className="relative overflow-hidden bg-[#F5E9C8] p-3 pb-12">
                            {(car.badge || unavailable) && (
                              <div
                                title={badgeText ?? undefined}
                                className={`absolute right-0 top-0 z-10 max-w-full truncate px-3 py-1.5 text-xs font-bold uppercase tracking-wider ${
                                  unavailable
                                    ? "bg-[#1C0606] text-[#FDF5DC]"
                                    : "bg-[#9B1111] text-white"
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
                              <div className="flex h-48 items-center justify-center text-sm text-[#1C0606]/40">
                                No image available
                              </div>
                            )}
                            <span
                              className={`absolute bottom-0 left-0 bg-[#F9A602] px-4 py-2 font-black text-[#1C0606] ${
                                priced
                                  ? "text-xl"
                                  : "text-sm uppercase tracking-wide"
                              }`}
                            >
                              {priced ? car.price : PRICE_FALLBACK}
                            </span>
                          </div>

                          <div className="flex flex-1 flex-col p-5">
                            <p className="text-sm font-semibold text-[#F9A602]">
                              {car.year} | {car.type}
                            </p>
                            <h3 className="mt-1 text-2xl font-black uppercase leading-tight">
                              {car.name}
                            </h3>

                            <dl className="mt-4 grid grid-cols-2 divide-x divide-[#FDF5DC]/10 border-y border-[#FDF5DC]/10 text-sm">
                              <div className="min-w-0 py-3 pr-3">
                                <dt className="text-xs font-semibold text-[#FDF5DC]/50">
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
                                <dt className="text-xs font-semibold text-[#FDF5DC]/50">
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

                            <p className="mt-3 flex min-w-0 items-center gap-2 text-sm text-[#FDF5DC]/65">
                              <MapPin
                                size={14}
                                className="shrink-0 text-[#F9A602]"
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
                                className="flex-1 bg-[#9B1111] px-4 py-3 text-sm font-bold uppercase tracking-wider text-white transition-colors hover:bg-[#F9A602] hover:text-[#1C0606] disabled:cursor-not-allowed disabled:bg-[#FDF5DC]/10 disabled:text-[#FDF5DC]/40 disabled:hover:bg-[#FDF5DC]/10 disabled:hover:text-[#FDF5DC]/40"
                              >
                                {label}
                              </button>
                              <span className="inline-flex shrink-0 items-center gap-1.5 text-sm font-bold uppercase transition-colors group-hover:text-[#F9A602]">
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
                            className={`flex h-10 w-10 items-center justify-center text-sm font-bold transition-colors ${ring} ${
                              currentPage === page
                                ? "bg-[#F9A602] text-[#1C0606]"
                                : "border-2 border-[#FDF5DC]/25 hover:border-[#F9A602] hover:text-[#F9A602]"
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
        <section className="bg-[#FDF5DC] text-[#1C0606]">
          <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8 lg:py-20">
            <h2 className="max-w-3xl border-l-8 border-[#9B1111] pl-5 text-3xl font-black uppercase leading-none sm:text-4xl lg:text-5xl">
              Why drivers choose Prime Auto Display
            </h2>
            <div className="mt-10 grid gap-6 md:grid-cols-3">
              {[
                {
                  icon: Gauge,
                  title: "Inspected quality",
                  copy: "Every car is checked for condition, safety and performance before it reaches the showroom.",
                },
                {
                  icon: Sparkles,
                  title: "Clear pricing",
                  copy: "The price you see is the price we discuss. No hidden surprises.",
                },
                {
                  icon: MapPin,
                  title: "Local experts",
                  copy: "Our team helps you compare cars and find the right fit for your budget.",
                },
              ].map(({ icon: Icon, title, copy }) => (
                <div
                  key={title}
                  className="border-t-4 border-[#9B1111] bg-[#FFFBEF] p-6"
                >
                  <span className="chamfer flex h-12 w-12 items-center justify-center bg-[#1C0606] text-[#F9A602]">
                    <Icon size={22} />
                  </span>
                  <h3 className="mt-5 text-xl font-black uppercase leading-tight">
                    {title}
                  </h3>
                  <p className="mt-3 text-sm leading-7 text-[#1C0606]/75">
                    {copy}
                  </p>
                </div>
              ))}
            </div>
            <div className="mt-10 flex flex-col gap-3 sm:flex-row">
              <Link
                href="/sell-trade"
                className="chamfer inline-flex items-center justify-center bg-[#9B1111] px-7 py-4 text-sm font-bold uppercase tracking-wider text-white transition-colors hover:bg-[#1C0606]"
              >
                Sell / Trade Car
              </Link>
              <Link
                href="/contact"
                className="chamfer inline-flex items-center justify-center bg-[#1C0606] px-7 py-4 text-sm font-bold uppercase tracking-wider text-[#FDF5DC] transition-colors hover:bg-[#9B1111]"
              >
                Contact Us
              </Link>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
