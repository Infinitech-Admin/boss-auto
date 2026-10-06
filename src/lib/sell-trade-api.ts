import { apiRequest } from "@/lib/api";

export type SellTradeStatus = "new" | "contacted" | "closed";

export type SellTradeRequest = {
  id: number;
  full_name: string;
  phone: string | null;
  email: string | null;
  brand: string;
  model: string;
  year: number;
  mileage: number;
  type: string;
  condition: string;
  estimate: number;
  status: SellTradeStatus;
  notes: string | null;
  created_at: string;
};

export type SellTradePage = {
  data: SellTradeRequest[];
  current_page: number;
  last_page: number;
  total: number;
};

export function fetchAdminSellTrades(params: {
  page?: number;
  perPage?: number;
  search?: string;
  status?: string;
}): Promise<SellTradePage> {
  const qs = new URLSearchParams({
    page: String(params.page ?? 1),
    per_page: String(params.perPage ?? 15),
  });
  if (params.search) qs.set("search", params.search);
  if (params.status) qs.set("status", params.status);

  // -> /api/proxy/sell-trade -> {LARAVEL_API_URL}/api/sell-trade
  return apiRequest<SellTradePage>(`/sell-trade?${qs.toString()}`);
}

export async function updateSellTrade(
  id: number,
  payload: Partial<Pick<SellTradeRequest, "status" | "notes">>,
): Promise<SellTradeRequest> {
  const res = await apiRequest<{ data: SellTradeRequest }>(
    `/sell-trade/${id}`,
    {
      method: "PATCH",
      body: payload,
    },
  );
  return res.data;
}

export function deleteSellTrade(id: number): Promise<{ message: string }> {
  return apiRequest<{ message: string }>(`/sell-trade/${id}`, {
    method: "DELETE",
  });
}
