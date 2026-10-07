"use client";

import Image from "next/image";
import Link from "next/link";
import {
  ArrowRight,
  BadgeCheck,
  MapPin,
  RotateCcw,
  Search,
  SlidersHorizontal,
  X,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";

import Navbar from "@/components/layout/navbar";
import Footer from "@/components/layout/footer";
import {
  MEDIA_BASE_URL,
  fetchSoldVehicles,
  isAbortError,
  resolveMediaUrl,
  type ApiError,
  type Vehicle,
} from "@/lib/api";

const DEFAULT_LOAD_ERROR =
  "We couldn’t load our sold vehicles right now. Please refresh the page or contact our team for assistance.";

// Set to false if you don't want to show prices on sold cars.
const SHOW_PRICE = true;

const CARS_PER_PAGE = 12;

export default function SoldCarsPage() {
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [search, setSearch] = useState("");
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

  const modelOptions = useMemo(
    () => ["all", ...Array.from(new Set(vehicles.map((v) => v.name)))],
    [vehicles],
  );

  const filteredCars = useMemo(() => {
    const q = search.trim().toLowerCase();

    const filtered = vehicles.filter((car) => {
      const matchesSearch =
        q.length === 0 ||
        [car.name, car.type, car.location].some((value) =>
          (value ?? "").toLowerCase().includes(q),
        );
      const matchesModel =
        selectedModel === "all" || car.name === selectedModel;

      return matchesSearch && matchesModel;
    });

    return [...filtered].sort((a, b) => {
      switch (sortOrder) {
        case "newest":
          return Number(b.year) - Number(a.year);
        case "oldest":
          return Number(a.year) - Number(b.year);
        case "price-low":
          return a.price_value - b.price_value;
        case "price-high":
          return b.price_value - a.price_value;
        default:
          return 0;
      }
    });
  }, [vehicles, search, selectedModel, sortOrder]);

  const totalPages = Math.max(
    1,
    Math.ceil(filteredCars.length / CARS_PER_PAGE),
  );

  useEffect(() => {
    setCurrentPage((page) => Math.min(page, totalPages));
  }, [totalPages]);

  useEffect(() => {
    setCurrentPage(1);
  }, [search, selectedModel, sortOrder]);

  const paginatedCars = useMemo(() => {
    const start = (currentPage - 1) * CARS_PER_PAGE;
    return filteredCars.slice(start, start + CARS_PER_PAGE);
  }, [filteredCars, currentPage]);

  const clearFilters = () => {
    setSearch("");
    setSelectedModel("all");
    setSortOrder("newest");
  };

  const hasActiveFilters =
    search.trim() !== "" || selectedModel !== "all" || sortOrder !== "newest";

  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-[#071A38] text-white">
        {/* HERO */}
        <section className="relative overflow-hidden border-b border-[#D41F2D]/20 bg-[#040E21]">
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(212,31,45,0.18),transparent_50%)]" />
          <div className="relative mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8 lg:py-24">
            <div className="max-w-3xl">
              <div className="mb-5 flex items-center gap-3">
                <span className="h-px w-10 bg-[#D41F2D]" />
                <span className="text-[10px] font-semibold uppercase tracking-[0.3em] text-[#FF5C68]">
                  Our Portfolio
                </span>
              </div>

              <h1 className="text-4xl font-black tracking-tight text-white sm:text-5xl lg:text-6xl">
                Cars we’ve
                <span className="block text-[#FF5C68]">found new homes</span>
              </h1>

              <p className="mt-5 max-w-2xl text-base leading-7 text-zinc-300 sm:text-lg">
                A look at the vehicles we’ve successfully sold. Every one of
                them went to a happy driver, and yours could be next.
              </p>

              {!isLoading && !loadError && (
                <div className="mt-8 inline-flex items-center gap-3 rounded-full border border-[#D41F2D]/40 bg-[#D41F2D]/10 px-5 py-2.5 shadow-[0_0_22px_rgba(212,31,45,0.35)]">
                  <BadgeCheck size={18} className="text-[#FF5C68]" />
                  <span className="text-sm font-semibold text-white">
                    {vehicles.length} vehicle{vehicles.length !== 1 ? "s" : ""}{" "}
                    sold
                  </span>
                </div>
              )}
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
          {/* FILTERS */}
          <div className="mb-8 rounded-[28px] border border-white/10 bg-[#071A38] p-4 shadow-[0_20px_60px_rgba(0,0,0,0.2)] sm:p-5">
            <div className="mb-4 flex items-center gap-2 text-[#FF5C68]">
              <SlidersHorizontal size={18} />
              <p className="text-xs font-semibold uppercase tracking-[0.25em]">
                Search & filter
              </p>
            </div>

            <div className="grid gap-3 lg:grid-cols-[1.4fr_1fr_1fr_auto]">
              <label className="flex items-center gap-3 rounded-2xl border border-white/10 bg-[#040E21]/20 px-4 py-3 text-sm text-zinc-300">
                <Search size={16} className="text-[#FF5C68]" />
                <input
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="Search model, type, or city"
                  className="w-full border-none bg-transparent text-white placeholder:text-zinc-500 focus:outline-none"
                />
              </label>

              <select
                value={selectedModel}
                onChange={(event) => setSelectedModel(event.target.value)}
                className="rounded-2xl border border-white/10 bg-[#040E21]/20 px-4 py-3 text-sm text-white outline-none focus:border-[#D41F2D]"
              >
                {modelOptions.map((model) => (
                  <option key={model} value={model} className="bg-[#071A38]">
                    {model === "all" ? "All models" : model}
                  </option>
                ))}
              </select>

              <select
                value={sortOrder}
                onChange={(event) => setSortOrder(event.target.value)}
                className="rounded-2xl border border-white/10 bg-[#040E21]/20 px-4 py-3 text-sm text-white outline-none focus:border-[#D41F2D]"
              >
                <option value="newest" className="bg-[#071A38]">
                  Newest first
                </option>
                <option value="oldest" className="bg-[#071A38]">
                  Oldest first
                </option>
                {SHOW_PRICE && (
                  <>
                    <option value="price-low" className="bg-[#071A38]">
                      Price: low to high
                    </option>
                    <option value="price-high" className="bg-[#071A38]">
                      Price: high to low
                    </option>
                  </>
                )}
              </select>

              {hasActiveFilters && (
                <button
                  type="button"
                  onClick={clearFilters}
                  className="inline-flex items-center justify-center gap-2 rounded-2xl border border-white/10 bg-transparent px-4 py-3 text-sm font-semibold text-zinc-200 transition-colors hover:border-[#D41F2D] hover:text-[#FF5C68]"
                >
                  <X size={15} />
                  Clear
                </button>
              )}
            </div>
          </div>

          {/* CONTENT */}
          {isLoading ? (
            <div className="rounded-[28px] border border-white/10 bg-[#071A38] px-6 py-16 text-center shadow-[0_20px_60px_rgba(0,0,0,0.2)]">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full border border-[#D41F2D]/30 bg-[#D41F2D]/10">
                <div className="h-8 w-8 animate-spin rounded-full border-2 border-[#D41F2D]/40 border-t-[#D41F2D]" />
              </div>
              <p className="mt-6 text-2xl font-bold text-white">
                Loading portfolio...
              </p>
              <p className="mt-2 text-sm text-zinc-400">
                Gathering our sold vehicles.
              </p>
            </div>
          ) : loadError ? (
            <div className="rounded-[28px] border border-[#D41F2D]/30 bg-[#071A38] px-6 py-16 text-center shadow-[0_20px_60px_rgba(0,0,0,0.2)]">
              <p className="text-2xl font-bold text-white">
                Something went wrong
              </p>
              <p className="mx-auto mt-3 max-w-xl text-sm leading-6 text-zinc-300">
                {loadError}
              </p>
              <button
                type="button"
                onClick={() => load()}
                className="mt-6 inline-flex items-center gap-2 rounded-full bg-[#D41F2D] px-5 py-3 text-sm font-semibold text-white transition-all duration-300 hover:bg-[#E8404B]"
              >
                <RotateCcw size={16} />
                Retry
              </button>
            </div>
          ) : filteredCars.length === 0 ? (
            <div className="rounded-[28px] border border-dashed border-white/15 bg-[#071A38] px-6 py-16 text-center">
              <p className="text-xl font-semibold text-white">
                {vehicles.length === 0
                  ? "No sold vehicles yet"
                  : "No matching vehicles found"}
              </p>
              <p className="mt-2 text-sm text-zinc-400">
                {vehicles.length === 0
                  ? "Our sold vehicles will show up here."
                  : "Try adjusting your filters or searching for a different model."}
              </p>
              {vehicles.length > 0 && (
                <button
                  type="button"
                  onClick={clearFilters}
                  className="mt-6 inline-flex items-center gap-2 rounded-full border border-[#D41F2D]/50 bg-[#D41F2D]/10 px-5 py-3 text-sm font-semibold text-[#FF5C68] transition-all duration-300 hover:border-[#D41F2D] hover:bg-[#D41F2D]/20"
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
                  const imageSrc = resolveMediaUrl(car.image, MEDIA_BASE_URL);

                  return (
                    <Link
                      key={car.id}
                      href={`/showroom/car/${car.id}`}
                      className="group flex h-full flex-col overflow-hidden rounded-[26px] border border-white/10 bg-[#071A38] transition-all duration-300 hover:-translate-y-1 hover:border-[#D41F2D]/50 hover:shadow-[0_25px_60px_rgba(212,31,45,0.15)]"
                    >
                      <div className="relative overflow-hidden bg-[#040E21] p-3">
                        {/* SOLD badge */}
                        <div className="absolute right-4 top-4 z-10 inline-flex items-center gap-1.5 rounded-full bg-[#D41F2D] px-3 py-1 text-[10px] font-black uppercase tracking-[0.18em] text-white shadow-[0_0_16px_rgba(212,31,45,0.7)]">
                          <BadgeCheck size={12} />
                          Sold
                        </div>

                        {imageSrc ? (
                          <Image
                            src={imageSrc}
                            alt={car.name}
                            width={800}
                            height={500}
                            unoptimized
                            className="h-52 w-full object-contain opacity-80 transition-all duration-500 group-hover:scale-105 group-hover:opacity-100"
                          />
                        ) : (
                          <div className="flex h-52 w-full items-center justify-center text-sm text-zinc-600">
                            No image available
                          </div>
                        )}
                      </div>

                      <div className="flex flex-1 flex-col p-5">
                        <div>
                          <p className="text-xs uppercase tracking-[0.18em] text-zinc-400">
                            {car.year} • {car.type}
                          </p>
                          <h3 className="mt-1 text-2xl font-semibold text-white">
                            {car.name}
                          </h3>
                          {SHOW_PRICE && (
                            <span className="mt-2 block text-base font-black text-zinc-400">
                              <span className="mr-1.5 text-[10px] font-semibold uppercase tracking-[0.18em] text-zinc-500">
                                Sold at
                              </span>
                              {car.price}
                            </span>
                          )}
                        </div>

                        <div className="mt-auto pt-5">
                          <div className="mb-5 grid grid-cols-2 gap-3 text-sm text-zinc-300">
                            <div className="min-w-0 rounded-xl border border-white/10 bg-white/3 p-3">
                              <span className="block text-[10px] uppercase tracking-[0.18em] text-zinc-400">
                                Mileage
                              </span>
                              <span className="mt-2 block min-h-10 line-clamp-2 font-semibold leading-5 text-white">
                                {car.mileage}
                              </span>
                            </div>
                            <div className="min-w-0 rounded-xl border border-white/10 bg-white/3 p-3">
                              <span className="block text-[10px] uppercase tracking-[0.18em] text-zinc-400">
                                Engine
                              </span>
                              <span className="mt-2 block min-h-10 line-clamp-2 font-semibold leading-5 text-white">
                                {car.engine}
                              </span>
                            </div>
                          </div>

                          <div className="flex min-h-14 items-center justify-between gap-3 border-t border-white/10 pt-3 text-sm text-zinc-300">
                            <span className="flex min-w-0 items-center gap-2">
                              <MapPin
                                size={14}
                                className="shrink-0 text-[#FF5C68]"
                              />
                              <span
                                title={car.location}
                                className="line-clamp-2 leading-5"
                              >
                                {car.location}
                              </span>
                            </span>
                            <span className="inline-flex shrink-0 items-center gap-2 font-semibold text-[#FF5C68]">
                              View
                              <ArrowRight
                                size={16}
                                className="transition-transform duration-300 group-hover:translate-x-1"
                              />
                            </span>
                          </div>
                        </div>
                      </div>
                    </Link>
                  );
                })}
              </div>

              {filteredCars.length > CARS_PER_PAGE && (
                <div className="mt-8 flex items-center justify-center gap-3">
                  <button
                    type="button"
                    onClick={() =>
                      setCurrentPage((page) => Math.max(1, page - 1))
                    }
                    disabled={currentPage === 1}
                    className="inline-flex items-center justify-center rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm font-medium text-white transition-colors hover:border-[#D41F2D] hover:text-[#FF5C68] disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    Previous
                  </button>

                  <div className="flex items-center gap-2">
                    {Array.from({ length: totalPages }, (_, i) => i + 1).map(
                      (page) => (
                        <button
                          key={page}
                          type="button"
                          onClick={() => setCurrentPage(page)}
                          className={`flex h-10 w-10 items-center justify-center rounded-full text-sm font-semibold transition-all ${
                            currentPage === page
                              ? "bg-[#D41F2D] text-white"
                              : "border border-white/10 bg-white/5 text-white hover:border-[#D41F2D] hover:text-[#FF5C68]"
                          }`}
                        >
                          {page}
                        </button>
                      ),
                    )}
                  </div>

                  <button
                    type="button"
                    onClick={() =>
                      setCurrentPage((page) => Math.min(totalPages, page + 1))
                    }
                    disabled={currentPage === totalPages}
                    className="inline-flex items-center justify-center rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm font-medium text-white transition-colors hover:border-[#D41F2D] hover:text-[#FF5C68] disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    Next
                  </button>
                </div>
              )}
            </>
          )}
        </section>

        {/* CTA */}
        <section className="mx-auto max-w-7xl px-4 pb-20 sm:px-6 lg:px-8">
          <div className="flex flex-col items-start justify-between gap-5 rounded-[28px] border border-[#D41F2D]/20 bg-[#040E21] p-6 sm:flex-row sm:items-center sm:p-8">
            <div>
              <h3 className="text-2xl font-bold text-white">
                Looking for your next ride?
              </h3>
              <p className="mt-2 text-sm text-zinc-300">
                Browse what’s available now, or sell or trade in your current
                car.
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              <Link
                href="/showroom"
                className="inline-flex items-center gap-2 rounded-full bg-[#D41F2D] px-5 py-3 text-sm font-bold text-white shadow-[0_0_22px_rgba(212,31,45,0.6)] transition-all duration-300 hover:bg-[#E8404B]"
              >
                View Showroom
                <ArrowRight size={16} />
              </Link>
              <Link
                href="/sell-trade"
                className="inline-flex items-center gap-2 rounded-full border border-white/20 px-5 py-3 text-sm font-semibold text-white transition-colors hover:border-[#D41F2D] hover:text-[#FF5C68]"
              >
                Sell / Trade
              </Link>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
