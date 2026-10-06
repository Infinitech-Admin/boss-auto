"use client";

import type React from "react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import {
  AlertTriangle,
  Car,
  Loader2,
  Pencil,
  Plus,
  Search,
  SlidersHorizontal,
  Trash2,
} from "lucide-react";
import {
  deleteVehicle,
  fetchAdminVehicles,
  resolveMediaUrl,
  type ApiError,
  type Vehicle,
} from "@/lib/api";
import VehicleFormDrawer from "@/components/admin/vehicle-formDrawer";

const STATUS_FILTERS: Array<"All" | Vehicle["status"]> = [
  "All",
  "available",
  "reserved",
  "sold",
];

const STATUS_STYLES: Record<Vehicle["status"], string> = {
  available: "bg-red-500/10 text-red-400",
  reserved: "bg-zinc-500/15 text-zinc-300",
  sold: "bg-zinc-500/15 text-zinc-400",
};

const STATUS_LABELS: Record<Vehicle["status"], string> = {
  available: "Available",
  reserved: "Reserved",
  sold: "Sold",
};

/* -------------------------------------------------------------------------- */
/*  Reusable dialog                                                           */
/* -------------------------------------------------------------------------- */

function Dialog({
  open,
  onClose,
  children,
  busy = false,
}: {
  open: boolean;
  onClose: () => void;
  children: React.ReactNode;
  /** Kapag true, hindi ma-close ang dialog (hal. habang nagdedelete). */
  busy?: boolean;
}) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !busy) onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, busy, onClose]);

  if (!open) return null;

  return createPortal(
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-[#061B3D]/70 backdrop-blur-sm"
        onClick={() => {
          if (!busy) onClose();
        }}
      />
      {/* Panel */}
      <div className="relative w-full max-w-md rounded-2xl border border-white/10 bg-[#0d0d0d] p-6 shadow-2xl">
        {children}
      </div>
    </div>,
    document.body,
  );
}

/* -------------------------------------------------------------------------- */
/*  Row action icons (always visible)                                         */
/* -------------------------------------------------------------------------- */

function RowActions({
  vehicle,
  onEdit,
  onDelete,
}: {
  vehicle: Vehicle;
  onEdit: (v: Vehicle) => void;
  onDelete: (v: Vehicle) => void;
}) {
  return (
    <div className="flex items-center justify-end gap-1.5">
      <button
        type="button"
        onClick={() => onEdit(vehicle)}
        title="Edit"
        aria-label={`Edit ${vehicle.name}`}
        className="flex h-8 w-8 items-center justify-center rounded-lg border border-white/10 bg-white/5 text-zinc-300 transition-colors hover:border-[#D41F2D]/50 hover:bg-[#D41F2D]/10 hover:text-[#D41F2D]"
      >
        <Pencil size={14} />
      </button>
      <button
        type="button"
        onClick={() => onDelete(vehicle)}
        title="Delete"
        aria-label={`Delete ${vehicle.name}`}
        className="flex h-8 w-8 items-center justify-center rounded-lg border border-white/10 bg-white/5 text-zinc-300 transition-colors hover:border-red-500/50 hover:bg-red-500/10 hover:text-red-400"
      >
        <Trash2 size={14} />
      </button>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*  Page                                                                      */
/* -------------------------------------------------------------------------- */

export default function ShowroomClient({
  imageBaseUrl,
}: {
  imageBaseUrl: string;
}) {
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"All" | Vehicle["status"]>(
    "All",
  );
  const [drawerVehicle, setDrawerVehicle] = useState<
    Vehicle | null | undefined
  >(undefined);

  // Delete dialog state
  const [deleteTarget, setDeleteTarget] = useState<Vehicle | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState("");

  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
  }, []);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const { data } = await fetchAdminVehicles();
      setVehicles(data);
    } catch (err) {
      setError((err as ApiError).message || "Failed to load vehicles.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const filtered = useMemo(() => {
    return vehicles.filter((v) => {
      const matchesSearch =
        v.name.toLowerCase().includes(search.toLowerCase()) ||
        v.type.toLowerCase().includes(search.toLowerCase());
      const matchesStatus = statusFilter === "All" || v.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [vehicles, search, statusFilter]);

  const openDeleteDialog = (vehicle: Vehicle) => {
    setDeleteError("");
    setDeleteTarget(vehicle);
  };

  const closeDeleteDialog = useCallback(() => {
    setDeleteTarget(null);
    setDeleteError("");
  }, []);

  async function confirmDelete() {
    if (!deleteTarget) return;
    setDeleting(true);
    setDeleteError("");
    try {
      await deleteVehicle(deleteTarget.id);
      setVehicles((prev) => prev.filter((v) => v.id !== deleteTarget.id));
      setDeleteTarget(null);
    } catch (err) {
      setDeleteError((err as ApiError).message || "Failed to delete vehicle.");
    } finally {
      setDeleting(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-bold text-white sm:text-2xl">Showroom</h1>
          <p className="mt-1 text-sm text-zinc-400">
            Manage vehicle listings and stock.
          </p>
        </div>
        <button
          onClick={() => setDrawerVehicle(null)}
          className="flex items-center justify-center gap-2 rounded-full bg-gradient-to-r from-[#D41F2D] to-[#E8404B] px-5 py-2.5 text-sm font-bold text-white transition-all hover:brightness-105"
        >
          <Plus size={16} />
          Add vehicle
        </button>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search
            size={16}
            className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-500"
          />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by model or type..."
            className="w-full rounded-xl border border-white/10 bg-[#111111]/70 py-2.5 pl-10 pr-4 text-sm text-white placeholder-zinc-500 outline-none focus:border-[#D41F2D]/60"
          />
        </div>

        <div className="flex items-center gap-2 overflow-x-auto">
          <SlidersHorizontal
            size={15}
            className="hidden shrink-0 text-zinc-500 sm:block"
          />
          {STATUS_FILTERS.map((status) => (
            <button
              key={status}
              onClick={() => setStatusFilter(status)}
              className={`shrink-0 rounded-full px-3.5 py-1.5 text-xs font-medium capitalize transition-colors ${
                statusFilter === status
                  ? "bg-[#D41F2D]/15 text-[#D41F2D]"
                  : "bg-white/5 text-zinc-400 hover:bg-white/10 hover:text-white"
              }`}
            >
              {status}
            </button>
          ))}
        </div>
      </div>

      {error && (
        <div className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">
          {error}
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center rounded-2xl border border-white/10 bg-[#111111]/70 py-16 text-sm text-zinc-400">
          <Loader2 size={18} className="mr-2 animate-spin text-[#D41F2D]" />
          Loading vehicles...
        </div>
      ) : (
        <>
          <p className="text-xs text-zinc-500">
            {filtered.length} vehicle{filtered.length !== 1 ? "s" : ""} found
          </p>

          {/* Desktop table */}
          <div className="hidden overflow-hidden rounded-2xl border border-white/10 bg-[#111111]/70 lg:block">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-white/10 text-xs uppercase tracking-wide text-zinc-500">
                  <th className="px-5 py-3 font-medium">Vehicle</th>
                  <th className="px-5 py-3 font-medium">Type</th>
                  <th className="px-5 py-3 font-medium">Price</th>
                  <th className="px-5 py-3 font-medium">Mileage</th>
                  <th className="px-5 py-3 font-medium">Stock</th>
                  <th className="px-5 py-3 font-medium">Status</th>
                  <th className="px-5 py-3 text-right font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((v) => (
                  <tr
                    key={v.id}
                    className="border-b border-white/5 last:border-0 hover:bg-white/[0.02]"
                  >
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-3">
                        <span className="flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-[#D41F2D]/15 text-[#D41F2D]">
                          {v.image ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                              src={resolveMediaUrl(v.image, imageBaseUrl)}
                              alt=""
                              className="h-full w-full object-cover"
                            />
                          ) : (
                            <Car size={16} />
                          )}
                        </span>
                        <div>
                          <p className="font-medium text-white">{v.name}</p>
                          <p className="text-xs text-zinc-500">{v.year}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-3 text-zinc-400">{v.type}</td>
                    <td className="px-5 py-3 text-white">{v.price}</td>
                    <td className="px-5 py-3 text-zinc-400">{v.mileage}</td>
                    <td className="px-5 py-3 text-zinc-400">{v.stock}</td>
                    <td className="px-5 py-3">
                      <span
                        className={`rounded-full px-2.5 py-1 text-xs font-medium ${STATUS_STYLES[v.status]}`}
                      >
                        {STATUS_LABELS[v.status]}
                      </span>
                    </td>
                    <td className="px-5 py-3">
                      <RowActions
                        vehicle={v}
                        onEdit={setDrawerVehicle}
                        onDelete={openDeleteDialog}
                      />
                    </td>
                  </tr>
                ))}
                {filtered.length === 0 && (
                  <tr>
                    <td
                      colSpan={7}
                      className="px-5 py-10 text-center text-sm text-zinc-500"
                    >
                      No vehicles match your search.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Mobile / tablet cards */}
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:hidden">
            {filtered.map((v) => (
              <div
                key={v.id}
                className="rounded-2xl border border-white/10 bg-[#111111]/70 p-4"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-[#D41F2D]/15 text-[#D41F2D]">
                      {v.image ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={resolveMediaUrl(v.image, imageBaseUrl)}
                          alt=""
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <Car size={18} />
                      )}
                    </span>
                    <div>
                      <p className="text-sm font-semibold text-white">
                        {v.name}
                      </p>
                      <p className="text-xs text-zinc-500">
                        {v.type} · {v.year}
                      </p>
                    </div>
                  </div>
                  <RowActions
                    vehicle={v}
                    onEdit={setDrawerVehicle}
                    onDelete={openDeleteDialog}
                  />
                </div>

                <div className="mt-4 flex items-center justify-between text-sm">
                  <span className="font-semibold text-white">{v.price}</span>
                  <span
                    className={`rounded-full px-2.5 py-1 text-xs font-medium ${STATUS_STYLES[v.status]}`}
                  >
                    {STATUS_LABELS[v.status]}
                  </span>
                </div>

                <div className="mt-2 flex items-center justify-between text-xs text-zinc-500">
                  <span>{v.mileage}</span>
                  <span>{v.stock} in stock</span>
                </div>
              </div>
            ))}
            {filtered.length === 0 && (
              <div className="col-span-full rounded-2xl border border-white/10 bg-[#111111]/70 py-10 text-center text-sm text-zinc-500">
                No vehicles match your search.
              </div>
            )}
          </div>
        </>
      )}

      {/* Delete confirmation dialog */}
      {mounted && (
        <Dialog
          open={!!deleteTarget}
          onClose={closeDeleteDialog}
          busy={deleting}
        >
          <div className="flex items-start gap-4">
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-red-500/10 text-red-400">
              <AlertTriangle size={20} />
            </span>
            <div className="min-w-0">
              <h2 className="text-lg font-bold text-white">Delete vehicle?</h2>
              <p className="mt-1.5 text-sm leading-6 text-zinc-400">
                You’re about to delete{" "}
                <span className="font-semibold text-white">
                  {deleteTarget?.name}
                </span>
                . This action can’t be undone.
              </p>
            </div>
          </div>

          {deleteError && (
            <div className="mt-4 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">
              {deleteError}
            </div>
          )}

          <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <button
              type="button"
              onClick={closeDeleteDialog}
              disabled={deleting}
              className="rounded-full border border-white/10 bg-white/5 px-5 py-2.5 text-sm font-medium text-zinc-300 transition-colors hover:bg-white/10 hover:text-white disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={confirmDelete}
              disabled={deleting}
              className="flex items-center justify-center gap-2 rounded-full bg-red-500 px-5 py-2.5 text-sm font-bold text-white transition-colors hover:bg-red-600 disabled:opacity-60"
            >
              {deleting ? (
                <>
                  <Loader2 size={15} className="animate-spin" />
                  Deleting...
                </>
              ) : (
                <>
                  <Trash2 size={15} />
                  Delete
                </>
              )}
            </button>
          </div>
        </Dialog>
      )}

      {drawerVehicle !== undefined && (
        <VehicleFormDrawer
          vehicle={drawerVehicle ?? undefined}
          imageBaseUrl={imageBaseUrl}
          onClose={() => {
            setDrawerVehicle(undefined);
            load();
          }}
          onSaved={load}
        />
      )}
    </div>
  );
}
