// app/admin/page.tsx

"use client";

import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  Car,
  DollarSign,
  RotateCcw,
  ShoppingCart,
  TrendingDown,
  TrendingUp,
  Users,
  Warehouse,
} from "lucide-react";
import { useEffect, useState, type ReactNode } from "react";

import { fetchAdminDashboard, type DashboardData } from "@/lib/api";

/* -------------------------------------------------------------------------- */
/*  Helpers                                                                   */
/* -------------------------------------------------------------------------- */

const CATEGORY_COLORS = [
  "#D41F2D",
  "#FFFFFF",
  "#9CA3AF",
  "#E8404B",
  "#6B7280",
  "#7F1D1D",
];

const TOOLTIP_STYLE = {
  background: "#111111",
  border: "1px solid rgba(255,255,255,0.1)",
  borderRadius: 12,
  color: "#fff",
  fontSize: 13,
};

const STATUS_STYLES: Record<string, string> = {
  confirmed: "bg-red-500/10 text-red-400",
  completed: "bg-red-500/10 text-red-400",
  ready_for_pick_up: "bg-zinc-500/15 text-zinc-300",
  pending_verification: "bg-red-500/10 text-red-400",
  reserved: "bg-zinc-500/15 text-zinc-300",
  cancelled: "bg-red-500/10 text-red-400",
  rejected: "bg-red-500/10 text-red-400",
};

function statusLabel(status: string): string {
  const text = status.replace(/_/g, " ");
  return text.charAt(0).toUpperCase() + text.slice(1);
}

function formatPeso(value: number): string {
  if (value >= 1_000_000) return `₱${(value / 1_000_000).toFixed(1)}M`;
  if (value >= 1_000) return `₱${Math.round(value / 1_000)}K`;
  return `₱${value}`;
}

function formatPesoFull(value: number): string {
  return `₱${value.toLocaleString("en-PH")}`;
}

function formatDate(iso: string | null): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("en-PH", {
    month: "short",
    day: "numeric",
  });
}

/* -------------------------------------------------------------------------- */
/*  Page                                                                      */
/* -------------------------------------------------------------------------- */

const RANGES = [3, 6, 12] as const;

export default function AdminDashboardPage() {
  const [months, setMonths] = useState<number>(6);
  const [data, setData] = useState<DashboardData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    const controller = new AbortController();
    setIsLoading(true);
    setError(null);

    fetchAdminDashboard(months, { signal: controller.signal })
      .then((result) => {
        setData(result);
        setIsLoading(false);
      })
      .catch((err: unknown) => {
        if (err instanceof DOMException && err.name === "AbortError") return;
        setError(
          err instanceof Error
            ? err.message
            : "We couldn’t load the dashboard right now.",
        );
        setIsLoading(false);
      });

    return () => controller.abort();
  }, [months, reloadKey]);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-white sm:text-2xl">
            Dashboard
          </h1>
          <p className="mt-1 text-sm text-zinc-400">
            Overview of sales, inventory, and activity.
          </p>
        </div>

        <div
          role="group"
          aria-label="Date range"
          className="flex rounded-full border border-white/10 bg-[#111111]/70 p-1"
        >
          {RANGES.map((range) => (
            <button
              key={range}
              type="button"
              onClick={() => setMonths(range)}
              aria-pressed={months === range}
              className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                months === range
                  ? "bg-[#D41F2D] text-white"
                  : "text-zinc-400 hover:text-white"
              }`}
            >
              {range} months
            </button>
          ))}
        </div>
      </div>

      {error && (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-red-500/30 bg-red-500/5 p-4 text-sm text-red-300">
          <span>{error}</span>
          <button
            type="button"
            onClick={() => setReloadKey((k) => k + 1)}
            className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-3 py-1.5 text-xs font-semibold text-white hover:bg-white/10"
          >
            <RotateCcw size={14} />
            Retry
          </button>
        </div>
      )}

      {!data && isLoading && <DashboardSkeleton />}

      {data && (
        <div
          className={`space-y-6 transition-opacity ${
            isLoading ? "opacity-60" : "opacity-100"
          }`}
        >
          <DashboardContent data={data} months={months} />
        </div>
      )}
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*  Content                                                                   */
/* -------------------------------------------------------------------------- */

function DashboardContent({
  data,
  months,
}: {
  data: DashboardData;
  months: number;
}) {
  const { stats, cart } = data;
  const periodLabel = `Last ${months} months`;

  return (
    <>
      {/* Stat cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Total revenue"
          value={formatPeso(stats.revenue.value)}
          change={stats.revenue.change}
          icon={<DollarSign size={18} />}
        />
        <StatCard
          label="Vehicles sold"
          value={stats.vehiclesSold.value.toLocaleString()}
          change={stats.vehiclesSold.change}
          icon={<Car size={18} />}
        />
        <StatCard
          label="Active listings"
          value={stats.activeListings.value.toLocaleString()}
          change={stats.activeListings.change}
          icon={<Warehouse size={18} />}
        />
        <StatCard
          label="New inquiries"
          value={stats.newInquiries.value.toLocaleString()}
          change={stats.newInquiries.change}
          icon={<Users size={18} />}
        />
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
        <ChartCard
          title="Revenue & units sold"
          subtitle={periodLabel}
          className="xl:col-span-2"
        >
          {data.revenue.every((p) => p.revenue === 0) ? (
            <EmptyState message="No confirmed sales in this period yet." />
          ) : (
            <ResponsiveContainer width="100%" height={280}>
              <AreaChart
                data={data.revenue}
                margin={{ top: 4, right: 8, left: -16, bottom: 0 }}
              >
                <defs>
                  <linearGradient id="revenueFill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#D41F2D" stopOpacity={0.35} />
                    <stop offset="100%" stopColor="#D41F2D" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid stroke="#ffffff14" vertical={false} />
                <XAxis
                  dataKey="month"
                  stroke="#71717a"
                  fontSize={12}
                  tickLine={false}
                  axisLine={false}
                />
                <YAxis
                  yAxisId="revenue"
                  stroke="#71717a"
                  fontSize={12}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={formatPeso}
                />
                <YAxis yAxisId="units" orientation="right" hide />
                <Tooltip
                  contentStyle={TOOLTIP_STYLE}
                  formatter={(value, name) => {
                    const n = typeof value === "number" ? value : Number(value);
                    return name === "revenue"
                      ? [formatPesoFull(n), "Revenue"]
                      : [String(n), "Units sold"];
                  }}
                />
                <Area
                  yAxisId="revenue"
                  type="monotone"
                  dataKey="revenue"
                  stroke="#D41F2D"
                  strokeWidth={2}
                  fill="url(#revenueFill)"
                />
                <Line
                  yAxisId="units"
                  type="monotone"
                  dataKey="unitsSold"
                  stroke="#FFFFFF"
                  strokeWidth={2}
                  dot={false}
                />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </ChartCard>

        <ChartCard title="Inventory by category" subtitle="Available now">
          {data.categories.length === 0 ? (
            <EmptyState message="No available vehicles listed." />
          ) : (
            <ResponsiveContainer width="100%" height={280}>
              <PieChart>
                <Pie
                  data={data.categories}
                  dataKey="value"
                  nameKey="name"
                  innerRadius={55}
                  outerRadius={90}
                  paddingAngle={3}
                >
                  {data.categories.map((entry, index) => (
                    <Cell
                      key={entry.name}
                      fill={CATEGORY_COLORS[index % CATEGORY_COLORS.length]}
                    />
                  ))}
                </Pie>
                <Tooltip contentStyle={TOOLTIP_STYLE} />
                <Legend
                  verticalAlign="bottom"
                  height={36}
                  iconType="circle"
                  wrapperStyle={{ fontSize: 12, color: "#a1a1aa" }}
                />
              </PieChart>
            </ResponsiveContainer>
          )}
        </ChartCard>
      </div>

      {/* Cart analytics */}
      <section aria-label="Cart analytics" className="space-y-4">
        <div className="flex items-center gap-3">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#D41F2D]/10 text-[#D41F2D]">
            <ShoppingCart size={16} />
          </span>
          <div>
            <h2 className="text-sm font-semibold text-white">Cart activity</h2>
            <p className="text-xs text-zinc-400">
              Last 30 days · logged-in shoppers
            </p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 xl:grid-cols-5">
          <MiniStat label="Added to cart" value={cart.added} />
          <MiniStat label="Removed from cart" value={cart.removed} />
          <MiniStat label="Purchased" value={cart.purchased} />
          <MiniStat label="Removal rate" value={`${cart.removalRate}%`} />
          <MiniStat
            label="In carts right now"
            value={cart.inCartNow}
            className="col-span-2 xl:col-span-1"
          />
        </div>

        <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
          <ChartCard
            title="Added vs removed"
            subtitle="Last 14 days"
            className="xl:col-span-2"
          >
            {cart.added === 0 && cart.removed === 0 ? (
              <EmptyState message="No cart activity recorded yet." />
            ) : (
              <ResponsiveContainer width="100%" height={240}>
                <BarChart
                  data={cart.daily}
                  margin={{ top: 4, right: 8, left: -24, bottom: 0 }}
                >
                  <CartesianGrid stroke="#ffffff14" vertical={false} />
                  <XAxis
                    dataKey="day"
                    stroke="#71717a"
                    fontSize={11}
                    tickLine={false}
                    axisLine={false}
                    interval="preserveStartEnd"
                  />
                  <YAxis
                    stroke="#71717a"
                    fontSize={12}
                    tickLine={false}
                    axisLine={false}
                    allowDecimals={false}
                  />
                  <Tooltip
                    contentStyle={TOOLTIP_STYLE}
                    cursor={{ fill: "#ffffff08" }}
                  />
                  <Legend
                    verticalAlign="bottom"
                    height={28}
                    iconType="circle"
                    wrapperStyle={{ fontSize: 12, color: "#a1a1aa" }}
                  />
                  <Bar
                    dataKey="added"
                    name="Added"
                    fill="#D41F2D"
                    radius={[4, 4, 0, 0]}
                  />
                  <Bar
                    dataKey="removed"
                    name="Removed"
                    fill="#ef4444"
                    radius={[4, 4, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            )}
          </ChartCard>

          <ChartCard title="Most removed cars" subtitle="Added, then dropped">
            {cart.mostRemoved.length === 0 ? (
              <EmptyState message="Nothing removed from carts yet." />
            ) : (
              <ul className="divide-y divide-white/5">
                {cart.mostRemoved.map((row) => (
                  <li
                    key={row.vehicle}
                    className="flex items-center justify-between gap-3 py-2.5 text-sm"
                  >
                    <span className="min-w-0 truncate text-white">
                      {row.vehicle}
                    </span>
                    <span className="shrink-0 text-xs text-zinc-400">
                      <span className="font-semibold text-red-400">
                        {row.removed}
                      </span>{" "}
                      removed / {row.added} added
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </ChartCard>
        </div>
      </section>

      {/* Second row: top models + recent activity */}
      <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
        <ChartCard
          title="Top-selling models"
          subtitle="Units sold, last 30 days"
        >
          {data.topModels.length === 0 ? (
            <EmptyState message="No sales in the last 30 days." />
          ) : (
            <ResponsiveContainer width="100%" height={260}>
              <BarChart
                data={data.topModels}
                layout="vertical"
                margin={{ top: 4, right: 12, left: 0, bottom: 0 }}
              >
                <CartesianGrid stroke="#ffffff14" horizontal={false} />
                <XAxis
                  type="number"
                  stroke="#71717a"
                  fontSize={12}
                  tickLine={false}
                  axisLine={false}
                  allowDecimals={false}
                />
                <YAxis
                  type="category"
                  dataKey="model"
                  stroke="#a1a1aa"
                  fontSize={12}
                  tickLine={false}
                  axisLine={false}
                  width={110}
                />
                <Tooltip contentStyle={TOOLTIP_STYLE} />
                <Bar
                  dataKey="unitsSold"
                  name="Units sold"
                  fill="#D41F2D"
                  radius={[0, 6, 6, 0]}
                  barSize={16}
                />
              </BarChart>
            </ResponsiveContainer>
          )}
        </ChartCard>

        <div className="rounded-2xl border border-white/10 bg-[#111111]/70 p-4 sm:p-5 xl:col-span-2">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h2 className="text-sm font-semibold text-white">
                Recent activity
              </h2>
              <p className="text-xs text-zinc-400">Latest orders</p>
            </div>
            <a
              href="/admin/orders"
              className="text-xs font-medium text-[#D41F2D] hover:text-[#E8404B]"
            >
              View all
            </a>
          </div>

          {data.recent.length === 0 ? (
            <EmptyState message="No orders yet." />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[560px] text-left text-sm">
                <thead>
                  <tr className="border-b border-white/10 text-xs uppercase tracking-wide text-zinc-500">
                    <th className="pb-2 pr-4 font-medium">Order</th>
                    <th className="pb-2 pr-4 font-medium">Customer</th>
                    <th className="pb-2 pr-4 font-medium">Vehicle</th>
                    <th className="pb-2 pr-4 font-medium">Amount</th>
                    <th className="pb-2 pr-4 font-medium">Status</th>
                    <th className="pb-2 font-medium">Date</th>
                  </tr>
                </thead>
                <tbody>
                  {data.recent.map((row) => (
                    <tr
                      key={row.id}
                      className="border-b border-white/5 last:border-0"
                    >
                      <td className="py-2.5 pr-4 text-zinc-300">{row.id}</td>
                      <td className="py-2.5 pr-4 text-white">{row.customer}</td>
                      <td className="py-2.5 pr-4 text-zinc-400">
                        {row.vehicle}
                      </td>
                      <td className="py-2.5 pr-4 text-white">
                        {formatPesoFull(row.amount)}
                      </td>
                      <td className="py-2.5 pr-4">
                        <span
                          className={`whitespace-nowrap rounded-full px-2.5 py-1 text-xs font-medium ${
                            STATUS_STYLES[row.status] ??
                            "bg-zinc-500/10 text-zinc-300"
                          }`}
                        >
                          {statusLabel(row.status)}
                        </span>
                      </td>
                      <td className="py-2.5 text-zinc-400">
                        {formatDate(row.date)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </>
  );
}

/* -------------------------------------------------------------------------- */
/*  Small components                                                          */
/* -------------------------------------------------------------------------- */

function StatCard({
  label,
  value,
  change,
  icon,
}: {
  label: string;
  value: string;
  change: number | null;
  icon: ReactNode;
}) {
  const trend = change !== null && change < 0 ? "down" : "up";

  return (
    <div className="rounded-2xl border border-white/10 bg-[#111111]/70 p-4 sm:p-5">
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium uppercase tracking-wide text-zinc-400">
          {label}
        </span>
        <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#D41F2D]/10 text-[#D41F2D]">
          {icon}
        </span>
      </div>
      <div className="mt-3 flex items-end justify-between">
        <span className="text-2xl font-bold text-white">{value}</span>
        {change !== null && (
          <span
            className={`flex items-center gap-1 text-xs font-semibold ${
              trend === "up" ? "text-red-400" : "text-red-400"
            }`}
          >
            {trend === "up" ? (
              <TrendingUp size={13} />
            ) : (
              <TrendingDown size={13} />
            )}
            {change > 0 ? "+" : ""}
            {change}%
          </span>
        )}
      </div>
    </div>
  );
}

function MiniStat({
  label,
  value,
  className = "",
}: {
  label: string;
  value: number | string;
  className?: string;
}) {
  return (
    <div
      className={`rounded-2xl border border-white/10 bg-[#111111]/70 p-4 ${className}`}
    >
      <p className="text-xs text-zinc-400">{label}</p>
      <p className="mt-1 text-2xl font-bold text-white">
        {typeof value === "number" ? value.toLocaleString() : value}
      </p>
    </div>
  );
}

function ChartCard({
  title,
  subtitle,
  className = "",
  children,
}: {
  title: string;
  subtitle: string;
  className?: string;
  children: ReactNode;
}) {
  return (
    <div
      className={`rounded-2xl border border-white/10 bg-[#111111]/70 p-4 sm:p-5 ${className}`}
    >
      <div className="mb-2">
        <h2 className="text-sm font-semibold text-white">{title}</h2>
        <p className="text-xs text-zinc-400">{subtitle}</p>
      </div>
      {children}
    </div>
  );
}

function EmptyState({ message }: { message: string }) {
  return (
    <div className="flex h-[180px] items-center justify-center text-center text-sm text-zinc-500">
      {message}
    </div>
  );
}

function DashboardSkeleton() {
  return (
    <div className="animate-pulse space-y-6" aria-busy="true">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {[0, 1, 2, 3].map((i) => (
          <div
            key={i}
            className="h-[104px] rounded-2xl border border-white/10 bg-[#111111]/50"
          />
        ))}
      </div>
      <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
        <div className="h-[350px] rounded-2xl border border-white/10 bg-[#111111]/50 xl:col-span-2" />
        <div className="h-[350px] rounded-2xl border border-white/10 bg-[#111111]/50" />
      </div>
    </div>
  );
}
