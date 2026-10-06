"use client";

import Image from "next/image";
import Link from "next/link";
import {
  ArrowRight,
  Gauge,
  MapPin,
  RotateCcw,
  Search,
  SlidersHorizontal,
  Sparkles,
  X,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";

import Navbar from "@/components/layout/navbar";
import Footer from "@/components/layout/footer";
import { useCart } from "@/context/cart-context";
import {
  MEDIA_BASE_URL,
  fetchVehicles,
  isAbortError,
  resolveMediaUrl,
  type ApiError,
  type Vehicle,
} from "@/lib/api";

const DEFAULT_LOAD_ERROR =
  "We couldn’t load the showroom inventory right now. Please refresh the page or contact our team for assistance.";

export default function ShowroomPage() {
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [search, setSearch] = useState("");
  const [selectedModel, setSelectedModel] = useState("all");
  const [sortOrder, setSortOrder] = useState("newest");
  const [priceRange, setPriceRange] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [recentlyAdded, setRecentlyAdded] = useState<number[]>([]);

  const { addToCart } = useCart();

  const carsPerPage = 8;

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

  const handleRetry = () => {
    load();
  };

  const modelOptions = useMemo(
    () => ["all", ...Array.from(new Set(vehicles.map((v) => v.name)))],
    [vehicles],
  );

  const availableCount = useMemo(
    () =>
      vehicles.filter((v) => v.status === "available" && v.stock > 0).length,
    [vehicles],
  );

  const filteredCars = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase();

    const filtered = vehicles.filter((car) => {
      const matchesSearch =
        normalizedSearch.length === 0 ||
        [car.name, car.type, car.location].some((value) =>
          (value ?? "").toLowerCase().includes(normalizedSearch),
        );

      const matchesModel =
        selectedModel === "all" || car.name === selectedModel;

      const priceValue = car.price_value;
      const matchesPrice =
        priceRange === "all" ||
        (priceRange === "under-50k" && priceValue < 50000) ||
        (priceRange === "50k-70k" &&
          priceValue >= 50000 &&
          priceValue <= 70000) ||
        (priceRange === "70k-plus" && priceValue > 70000);

      return matchesSearch && matchesModel && matchesPrice;
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
  }, [vehicles, search, selectedModel, sortOrder, priceRange]);

  const totalPages = Math.max(1, Math.ceil(filteredCars.length / carsPerPage));

  useEffect(() => {
    setCurrentPage((page) => Math.min(page, totalPages));
  }, [filteredCars.length, totalPages]);

  useEffect(() => {
    setCurrentPage(1);
  }, [search, selectedModel, sortOrder, priceRange]);

  const paginatedCars = useMemo(() => {
    const start = (currentPage - 1) * carsPerPage;
    return filteredCars.slice(start, start + carsPerPage);
  }, [filteredCars, currentPage]);

  const clearFilters = () => {
    setSearch("");
    setSelectedModel("all");
    setSortOrder("newest");
    setPriceRange("all");
  };

  const handleAddToCart = (event: React.MouseEvent, car: Vehicle) => {
    event.preventDefault();
    event.stopPropagation();

    addToCart({
      id: car.id,
      name: car.name,
      price: car.price,
      image: resolveMediaUrl(car.image, MEDIA_BASE_URL),
      year: car.year,
      type: car.type,
      stock: car.stock,
    });

    setRecentlyAdded((current) => [...current, car.id]);
    window.setTimeout(() => {
      setRecentlyAdded((current) => current.filter((id) => id !== car.id));
    }, 1500);
  };

  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-[#191610] text-white">
        <section className="relative overflow-hidden border-b border-[#D41F2D]/20 bg-[#0d0b09]">
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(191,152,13,0.18),transparent_50%)]" />
          <div className="relative mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8 lg:py-24">
            <div className="max-w-3xl">
              <div className="mb-5 flex items-center gap-3">
                <span className="h-px w-10 bg-[#D41F2D]" />
                <span className="text-[10px] font-semibold uppercase tracking-[0.3em] text-[#D41F2D]">
                  Featured Collection
                </span>
              </div>

              <h1 className="text-4xl font-black tracking-tight text-white sm:text-5xl lg:text-6xl">
                Discover the
                <span className="block text-[#D41F2D]">
                  showroom collection
                </span>
              </h1>

              <p className="mt-5 max-w-2xl text-base leading-7 text-zinc-300 sm:text-lg">
                Handpicked models that balance confidence, comfort, and design.
                Explore high-performance sedans and luxury SUVs tailored for
                modern life.
              </p>
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
          <div className="mb-8 rounded-[28px] border border-white/10 bg-[#120f0d] p-4 shadow-[0_20px_60px_rgba(0,0,0,0.2)] sm:p-5">
            <div className="mb-4 flex items-center justify-between gap-3 text-[#D41F2D]">
              <div className="flex gap-2 items-center">
                <SlidersHorizontal size={18} />
                <p className="text-xs font-semibold uppercase tracking-[0.25em]">
                  Search & filter
                </p>
              </div>

              {!isLoading && !loadError && (
                <div className="hidden rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm text-zinc-300 sm:block">
                  {availableCount} vehicle{availableCount !== 1 ? "s" : ""}{" "}
                  ready to drive
                </div>
              )}
            </div>

            <div className="grid gap-3 lg:grid-cols-[1.4fr_1fr_1fr_1fr_auto]">
              <label className="flex items-center gap-3 rounded-2xl border border-white/10 bg-[#061B3D]/20 px-4 py-3 text-sm text-zinc-300">
                <Search size={16} className="text-[#D41F2D]" />

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
                className="rounded-2xl border border-white/10 bg-[#061B3D]/20 px-4 py-3 text-sm text-white outline-none focus:border-[#D41F2D]"
              >
                {modelOptions.map((model) => (
                  <option key={model} value={model} className="bg-[#120f0d]">
                    {model === "all" ? "All models" : model}
                  </option>
                ))}
              </select>

              <select
                value={sortOrder}
                onChange={(event) => setSortOrder(event.target.value)}
                className="rounded-2xl border border-white/10 bg-[#061B3D]/20 px-4 py-3 text-sm text-white outline-none focus:border-[#D41F2D]"
              >
                <option value="newest" className="bg-[#120f0d]">
                  Newest first
                </option>
                <option value="oldest" className="bg-[#120f0d]">
                  Oldest first
                </option>
                <option value="price-low" className="bg-[#120f0d]">
                  Price: low to high
                </option>
                <option value="price-high" className="bg-[#120f0d]">
                  Price: high to low
                </option>
              </select>

              <select
                value={priceRange}
                onChange={(event) => setPriceRange(event.target.value)}
                className="rounded-2xl border border-white/10 bg-[#061B3D]/20 px-4 py-3 text-sm text-white outline-none focus:border-[#D41F2D]"
              >
                <option value="all" className="bg-[#120f0d]">
                  All price ranges
                </option>
                <option value="under-50k" className="bg-[#120f0d]">
                  Under ₱50k
                </option>
                <option value="50k-70k" className="bg-[#120f0d]">
                  ₱50k - ₱70k
                </option>
                <option value="70k-plus" className="bg-[#120f0d]">
                  ₱70k+
                </option>
              </select>

              {/* Only show when a filter is active */}
              {(search.trim() !== "" ||
                selectedModel !== "all" ||
                priceRange !== "all" ||
                sortOrder !== "newest") && (
                <button
                  type="button"
                  onClick={clearFilters}
                  className="inline-flex items-center justify-center gap-2 rounded-2xl border border-white/10 bg-transparent px-4 py-3 text-sm font-semibold text-zinc-200 transition-colors hover:border-[#D41F2D] hover:text-[#D41F2D]"
                >
                  <X size={15} />
                  Clear
                </button>
              )}
            </div>
          </div>

          {isLoading ? (
            <div className="rounded-[28px] border border-white/10 bg-[#120f0d] px-6 py-16 text-center shadow-[0_20px_60px_rgba(0,0,0,0.2)]">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full border border-[#D41F2D]/30 bg-[#D41F2D]/10">
                <div className="h-8 w-8 animate-spin rounded-full border-2 border-[#D41F2D]/40 border-t-[#D41F2D]" />
              </div>
              <p className="mt-6 text-2xl font-bold text-white">
                Loading inventory...
              </p>
              <p className="mt-2 text-sm text-zinc-400">
                Preparing the latest vehicles for you.
              </p>
            </div>
          ) : loadError ? (
            <div className="rounded-[28px] border border-red-500/30 bg-[#160f0f] px-6 py-16 text-center shadow-[0_20px_60px_rgba(0,0,0,0.2)]">
              <p className="text-2xl font-bold text-white">
                Something went wrong
              </p>
              <p className="mt-3 max-w-xl mx-auto text-sm leading-6 text-zinc-300">
                {loadError}
              </p>
              <button
                type="button"
                onClick={handleRetry}
                className="mt-6 inline-flex items-center gap-2 rounded-full bg-[#D41F2D] px-5 py-3 text-sm font-semibold text-black transition-all duration-300 hover:bg-[#E8404B]"
              >
                <RotateCcw size={16} />
                Retry
              </button>
            </div>
          ) : filteredCars.length === 0 ? (
            <div className="rounded-[28px] border border-dashed border-white/15 bg-[#120f0d] px-6 py-16 text-center">
              <p className="text-xl font-semibold text-white">
                {vehicles.length === 0
                  ? "No vehicles in the showroom yet"
                  : "No matching vehicles found"}
              </p>
              <p className="mt-2 text-sm text-zinc-400">
                {vehicles.length === 0
                  ? "Please check back soon for new arrivals."
                  : "Try adjusting your filters or searching for a different model."}
              </p>
              {vehicles.length > 0 && (
                <button
                  type="button"
                  onClick={clearFilters}
                  className="mt-6 inline-flex items-center gap-2 rounded-full border border-[#D41F2D]/50 bg-[#D41F2D]/10 px-5 py-3 text-sm font-semibold text-[#F3D77A] transition-all duration-300 hover:border-[#D41F2D] hover:bg-[#D41F2D]/20"
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
                  const imageSrc = resolveMediaUrl(car.image, MEDIA_BASE_URL);
                  const buttonLabel = unavailable
                    ? car.status === "sold"
                      ? "Sold"
                      : car.status === "reserved"
                        ? "Reserved"
                        : "Out of stock"
                    : recentlyAdded.includes(car.id)
                      ? "Added ✓"
                      : "Add to Cart";

                  return (
                    <Link
                      key={car.id}
                      href={`/showroom/car/${car.id}`}
                      className="group flex h-full flex-col overflow-hidden rounded-[26px] border border-white/10 bg-[#12110f] transition-all duration-300 hover:-translate-y-1 hover:border-[#D41F2D]/50 hover:shadow-[0_25px_60px_rgba(191,152,13,0.12)]"
                    >
                      <div className="relative overflow-hidden bg-[#0d0d0d] p-3">
                        {(car.badge || unavailable) && (
                          <div className="absolute right-4 top-4 z-10 rounded-full border border-[#D41F2D]/40 bg-[#D41F2D]/10 px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.18em] text-[#F3D77A]">
                            {unavailable && car.status !== "available"
                              ? car.status
                              : car.badge}
                          </div>
                        )}

                        {imageSrc ? (
                          <Image
                            src={imageSrc}
                            alt={car.name}
                            width={800}
                            height={500}
                            unoptimized
                            className={`h-52 w-full object-contain transition-transform duration-500 group-hover:scale-105 ${
                              unavailable ? "opacity-60" : ""
                            }`}
                          />
                        ) : (
                          <div className="flex h-52 w-full items-center justify-center text-sm text-zinc-600">
                            No image available
                          </div>
                        )}
                      </div>

                      <div className="flex flex-1 flex-col p-5">
                        <div className="flex items-center justify-between gap-3">
                          <div>
                            <p className="text-xs uppercase tracking-[0.18em] text-zinc-400">
                              {car.year} • {car.type}
                            </p>
                            <h3 className="mt-1 text-2xl font-semibold text-white">
                              {car.name}
                            </h3>
                          </div>
                        </div>
                        <span className="mt-2 text-base font-black text-[#D41F2D]">
                          {car.price}
                        </span>

                        <div className="grid grid-cols-2 gap-3 text-sm text-zinc-300 my-5">
                          <div className="rounded-xl border border-white/10 bg-white/3 p-3">
                            <span className="block text-[10px] uppercase tracking-[0.18em] text-zinc-400">
                              Mileage
                            </span>
                            <span className="mt-2 block font-semibold text-white">
                              {car.mileage}
                            </span>
                          </div>
                          <div className="rounded-xl border border-white/10 bg-white/3 p-3">
                            <span className="block text-[10px] uppercase tracking-[0.18em] text-zinc-400">
                              Engine
                            </span>
                            <span className="mt-2 block font-semibold text-white">
                              {car.engine}
                            </span>
                          </div>
                        </div>

                        {/* Spacer pushes the button + footer to the bottom of every card,
                            regardless of how many lines the title/specs above take up. */}
                        <div className="mt-auto">
                          <button
                            type="button"
                            disabled={unavailable}
                            onClick={(event) => handleAddToCart(event, car)}
                            className="mb-1 flex w-full items-center justify-center gap-2 rounded-xl bg-[#D41F2D] px-4 py-2.5 text-sm font-bold text-white transition-all duration-300 hover:bg-[#E8404B] disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:bg-[#D41F2D]"
                          >
                            {buttonLabel}
                          </button>

                          <div className="flex items-center justify-between border-t border-white/10 pt-4 text-sm text-zinc-300">
                            <span className="inline-flex items-center gap-2">
                              <MapPin size={14} className="text-[#D41F2D]" />
                              {car.location}
                            </span>
                            <span className="inline-flex items-center gap-2 font-semibold text-[#D41F2D]">
                              Details
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

              {filteredCars.length > carsPerPage && (
                <div className="mt-8 flex items-center justify-center gap-3">
                  <button
                    type="button"
                    onClick={() =>
                      setCurrentPage((page) => Math.max(1, page - 1))
                    }
                    disabled={currentPage === 1}
                    className="inline-flex items-center justify-center rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm font-medium text-white transition-colors hover:border-[#D41F2D] hover:text-[#F3D77A] disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    Previous
                  </button>

                  <div className="flex items-center gap-2">
                    {Array.from(
                      { length: totalPages },
                      (_, index) => index + 1,
                    ).map((page) => (
                      <button
                        key={page}
                        type="button"
                        onClick={() => setCurrentPage(page)}
                        className={`flex h-10 w-10 items-center justify-center rounded-full text-sm font-semibold transition-all ${
                          currentPage === page
                            ? "bg-[#D41F2D] text-black"
                            : "border border-white/10 bg-white/5 text-white hover:border-[#D41F2D] hover:text-[#F3D77A]"
                        }`}
                      >
                        {page}
                      </button>
                    ))}
                  </div>

                  <button
                    type="button"
                    onClick={() =>
                      setCurrentPage((page) => Math.min(totalPages, page + 1))
                    }
                    disabled={currentPage === totalPages}
                    className="inline-flex items-center justify-center rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm font-medium text-white transition-colors hover:border-[#D41F2D] hover:text-[#F3D77A] disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    Next
                  </button>
                </div>
              )}
            </>
          )}
        </section>

        <section className="mx-auto max-w-7xl px-4 pb-20 sm:px-6 lg:px-8">
          <div className="rounded-[28px] border border-[#D41F2D]/20 bg-[#120f0d] p-6 sm:p-8">
            <div className="flex items-center gap-3">
              <h3 className="text-2xl font-bold text-white">
                Why drivers choose AutoTrade?
              </h3>
            </div>

            <div className="mt-6 grid gap-4 md:grid-cols-3">
              <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
                <div className="flex gap-2 items-center">
                  <Gauge className="text-[#D41F2D]" size={22} />
                  <h4 className="text-xl font-bold text-white">
                    Inspected quality
                  </h4>
                </div>
                <p className="mt-2 text-md leading-6 text-zinc-300">
                  Every vehicle is reviewed for condition, safety, and
                  performance before it reaches the showroom floor.
                </p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
                <div className="flex gap-2 items-center">
                  <Sparkles className="text-[#D41F2D]" size={22} />
                  <h4 className="text-xl font-bold text-white">
                    Transparent pricing
                  </h4>
                </div>
                <p className="mt-2 text-md leading-6 text-zinc-300">
                  No hidden surprises—just clear value, competitive pricing, and
                  straightforward buying guidance.
                </p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
                <div className="flex gap-2 items-center">
                  <MapPin className="text-[#D41F2D]" size={22} />
                  <h4 className="text-xl font-bold text-white">
                    Local experts
                  </h4>
                </div>
                <p className="mt-2 text-md leading-6 text-zinc-300">
                  Our team helps you compare the right fit for your lifestyle,
                  goals, and long-term value.
                </p>
              </div>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
