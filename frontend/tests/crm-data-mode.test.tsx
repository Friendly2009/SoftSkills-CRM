import { afterEach, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { CrmProvider, useCrm } from '../src/crm/mocks/store/CrmProvider';
import { createApiSource } from '../src/crm/data/api';
import { createSeed } from '../src/crm/mocks/data/seed';
import { configureDataMode, legacyFetch } from '../src/data/runtime';
function Probe() {
  const { db, mutate, toast } = useCrm();
  return <><output>{db.profile.name}</output><p>{toast}</p><button onClick={() => void mutate({type:'profile.save',profile:{...db.profile,name:'Changed'}})}>Save</button></>;
}
function tree(mock: boolean) { return <MemoryRouter><CrmProvider isMock={mock}><Probe /></CrmProvider></MemoryRouter>; }
afterEach(() => { cleanup(); vi.unstubAllGlobals(); localStorage.clear(); configureDataMode(true); });
it('mock mode loads and saves locally without any HTTP request', async () => {
  const fetcher = vi.fn(); vi.stubGlobal('fetch', fetcher);
  render(tree(true)); fireEvent.click(screen.getByText('Save'));
  await screen.findByText('Changed');
  expect(localStorage.getItem('softskills.crm.demo.v1')).toContain('Changed');
  expect(fetcher).not.toHaveBeenCalled();
});
it('real mode uses server snapshots and never reads or overwrites mock persistence', async () => {
  const data = createSeed(); data.profile.name = 'Server';
  localStorage.setItem('softskills.crm.demo.v1', 'untouched');
  const fetcher = vi.fn().mockResolvedValueOnce(Response.json({data,revision:'7'}))
    .mockResolvedValueOnce(Response.json({data:{...data,profile:{...data.profile,name:'Server normalized'}},revision:'8'}));
  vi.stubGlobal('fetch',fetcher); render(tree(false));
  await screen.findByText('Server'); fireEvent.click(screen.getByText('Save'));
  await screen.findByText('Server normalized');
  const [url, options] = fetcher.mock.calls[1];
  expect(url).toBe('/api/crm/commands');
  expect(options.credentials).toBe('include');
  expect(JSON.parse(options.body)).toMatchObject({expectedRevision:'7',command:{type:'profile.save',profile:{name:'Changed'}}});
  expect(JSON.parse(options.body).requestId).toBeTruthy();
  expect(localStorage.getItem('softskills.crm.demo.v1')).toBe('untouched');
});
it('failed writes retain server state and report the error', async () => {
  const data=createSeed(); data.profile.name='Unchanged';
  vi.stubGlobal('fetch', vi.fn().mockResolvedValueOnce(Response.json({data,revision:'1'}))
    .mockResolvedValueOnce(Response.json({message:'Save rejected'}, {status:500})));
  render(tree(false)); await screen.findByText('Unchanged');
  fireEvent.click(screen.getByText('Save')); await screen.findByText('Save rejected');
  expect(screen.getByText('Unchanged')).toBeTruthy(); expect(localStorage.length).toBe(0);
});
it('missing API shows an error without substituting demo records', async () => {
  vi.stubGlobal('fetch',vi.fn().mockResolvedValue(Response.json({}, {status:404})));
  render(tree(false)); await screen.findByRole('alert');
  expect(screen.queryByText('Save')).toBeNull(); expect(localStorage.length).toBe(0);
});
it('switching modes aborts pending bootstrap and ignores its late result', async () => {
  let resolve!: (value: Response) => void;
  const fetcher=vi.fn(() => new Promise<Response>(r => { resolve=r; })); vi.stubGlobal('fetch',fetcher);
  const view=render(tree(false)); await waitFor(() => expect(fetcher).toHaveBeenCalledTimes(1));
  const signal=(fetcher.mock.calls as unknown as [string, RequestInit][])[0][1].signal!;
  view.rerender(tree(true)); expect(signal.aborted).toBe(true);
  const data=createSeed(); data.profile.name='Obsolete server'; resolve(Response.json({data,revision:'1'}));
  await waitFor(() => expect(screen.getByText('Save')).toBeTruthy());
  expect(screen.queryByText('Obsolete server')).toBeNull();
});
it('rejects malformed snapshots and preserves HTTP authentication errors', async () => {
  const fetcher=vi.fn().mockResolvedValueOnce(Response.json({data:{},revision:'1'}))
    .mockResolvedValueOnce(Response.json({}, {status:401})); vi.stubGlobal('fetch',fetcher);
  const api=createApiSource('/api'), signal=new AbortController().signal;
  await expect(api.load(signal)).rejects.toThrow();
  await expect(api.load(signal)).rejects.toMatchObject({status:401});
});
it('public-page requests follow the same mode and configured API prefix', async () => {
  const fetcher=vi.fn().mockResolvedValue(Response.json({success:true})); vi.stubGlobal('fetch',fetcher);
  configureDataMode(true); await legacyFetch('https://old.example/api/signin'); expect(fetcher).not.toHaveBeenCalled();
  configureDataMode(false); await legacyFetch('https://old.example/api/signin',{method:'POST'});
  expect(fetcher).toHaveBeenCalledWith('/api/signin',expect.objectContaining({method:'POST',credentials:'include'}));
});
