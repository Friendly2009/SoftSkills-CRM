import { afterEach, describe, expect, it, vi } from "vitest";
import { addClient, deleteClient, topUpClient, updateClient } from "./api";
import { emptyClient } from "./components/ClientForm";
afterEach(() => vi.unstubAllGlobals());
describe("client mutations", () => {
  it.each([400, 403, 500])(
    "rejects failed updates (%s), rather than reporting success",
    async (status) => {
      vi.stubGlobal(
        "fetch",
        vi
          .fn()
          .mockResolvedValue(
            new Response(
              JSON.stringify({ success: false, message: "Denied" }),
              { status },
            ),
          ),
      );
      await expect(
        updateClient({ ...emptyClient(), id: 1 }, 0),
      ).rejects.toMatchObject({ status });
    },
  );
  it("rejects a failed creation", async () => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new TypeError("offline")));
    await expect(addClient(emptyClient())).rejects.toThrow();
  });
  it("sends cookies on delete", async () => {
    const fetch = vi.fn().mockResolvedValue(new Response("{}"));
    vi.stubGlobal("fetch", fetch);
    await deleteClient({ ...emptyClient(), id: 1 });
    expect(fetch).toHaveBeenCalledWith(
      "/api/delclients/1",
      expect.objectContaining({ credentials: "include", method: "DELETE" }),
    );
  });
  it("sends an amount, not a stale total balance", async () => {
    const fetch = vi.fn().mockResolvedValue(new Response('{"success":true}'));
    vi.stubGlobal("fetch", fetch);
    await topUpClient(1, 500);
    expect(fetch).toHaveBeenCalledWith(
      "/api/clients/1/top-up",
      expect.objectContaining({ body: JSON.stringify({ amount: 500 }) }),
    );
  });
});
