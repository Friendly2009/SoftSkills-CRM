import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { Request, Response } from 'express';
const connection = vi.hoisted(() => ({ beginTransaction: vi.fn(), query: vi.fn(), execute: vi.fn(), commit: vi.fn(), rollback: vi.fn(), release: vi.fn() }));
const getConnection = vi.hoisted(() => vi.fn());
vi.mock('../data_base_connect.js', () => ({ default: { getConnection } }));
import { topUpClient } from '../controllers/WalletController.js';
function response() { const res = { status: vi.fn(), json: vi.fn() }; res.status.mockReturnValue(res); res.json.mockReturnValue(res); return res; }
const req = (body = { amount: 500 }, session = { company_id: 2, rank: 500 }) => ({ params: { id: '1' }, body, session }) as unknown as Request;
beforeEach(() => { vi.resetAllMocks(); getConnection.mockResolvedValue(connection); connection.query.mockResolvedValue([[{ id: 1, name: 'Client' }]]); connection.execute.mockResolvedValue([{ affectedRows: 1 }]); });
describe('wallet transaction', () => {
  it('locks the company-owned client, increments balance and writes the ledger before commit', async () => {
    const res = response(); await topUpClient(req(), res as unknown as Response);
    expect(connection.query).toHaveBeenCalledWith(expect.stringContaining('AND company_id = ? FOR UPDATE'), [1, 2]);
    expect(connection.execute).toHaveBeenNthCalledWith(1, expect.stringContaining('balance = balance + ?'), [500, 1, 2]);
    expect(connection.execute).toHaveBeenNthCalledWith(2, expect.stringContaining('financial_transactions'), expect.arrayContaining([2, 1, 500]));
    expect(connection.commit).toHaveBeenCalledOnce(); expect(connection.release).toHaveBeenCalledOnce();
  });
  it('rolls back the balance if the ledger insert fails', async () => {
    connection.execute.mockResolvedValueOnce([{}]).mockRejectedValueOnce(new Error('db failure'));
    const res = response(); await topUpClient(req(), res as unknown as Response);
    expect(connection.rollback).toHaveBeenCalledOnce(); expect(connection.commit).not.toHaveBeenCalled(); expect(res.status).toHaveBeenCalledWith(500);
  });
  it('does not mutate a client belonging to another company', async () => {
    connection.query.mockResolvedValue([[]]); const res = response(); await topUpClient(req(), res as unknown as Response);
    expect(connection.execute).not.toHaveBeenCalled(); expect(res.status).toHaveBeenCalledWith(404);
  });
  it.each([0, -1, NaN, Infinity, 0.001])('rejects invalid amount %s', async amount => {
    const res = response(); await topUpClient(req({ amount }), res as unknown as Response);
    expect(getConnection).not.toHaveBeenCalled(); expect(res.status).toHaveBeenCalledWith(400);
  });
  it('requires a session and permissions', async () => {
    const res = response(); await topUpClient(req({ amount: 1 }, { company_id: 0, rank: 0 }), res as unknown as Response);
    expect(res.status).toHaveBeenCalledWith(401); expect(getConnection).not.toHaveBeenCalled();
  });
});
