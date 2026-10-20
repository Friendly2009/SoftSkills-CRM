import { jsonBody, request } from "@/shared/api/client";
import type { ClientTemplate } from "@/shared/types/clientsInterfaces";
export async function getClient(
  signal?: AbortSignal,
): Promise<ClientTemplate[]> {
  const result = await request<{ data: ClientTemplate[] }>("/getclient", {
    signal,
  });
  return (result.data || []).map((client) => ({
    ...client,
    balance: Number(client.balance),
    group_ids: client.group_ids || [],
    group_names: client.group_names || [],
    next_visit: client.next_visit ? new Date(client.next_visit) : null,
  }));
}
export const deleteClient = (client: ClientTemplate) =>
  request(`/delclients/${client.id}`, { method: "DELETE" });
export const addClient = (client: ClientTemplate) =>
  request("/addclients", { method: "POST", ...jsonBody(client) });
export const updateClient = (client: ClientTemplate, expectedBalance: number) =>
  request(`/updateclient/${client.id}`, {
    method: "PATCH",
    ...jsonBody({ ...client, expected_balance: expectedBalance }),
  });
export const topUpClient = (id: number, amount: number) =>
  request(`/clients/${id}/top-up`, { method: "POST", ...jsonBody({ amount }) });
