import {afterEach,describe,it,expect,vi} from 'vitest';
import {ApiClient,HttpError} from '../src/real/client';
import {initialValues,payload,operation,rublesToKopecks,kopecksToRubles} from '../src/real/schema';
const uuid='11111111-1111-4111-8111-111111111111';
afterEach(()=>{vi.unstubAllGlobals();sessionStorage.clear()});
describe('API v1 form contracts',()=>{
 it('converts money exactly without floating point rounding',()=>{
  expect(rublesToKopecks('9999999999.99')).toBe('999999999999');expect(rublesToKopecks('0,01')).toBe('1');expect(kopecksToRubles('-101')).toBe('-1.01');
  expect(()=>rublesToKopecks('1.005')).toThrow();expect(()=>rublesToKopecks('-1')).toThrow();
 });
 it('loads SQL fields, version and contacts into editable values',()=>{
  const schema=operation('PATCH','/lessons/'+uuid)!.body!;
  const initial=initialValues(schema,{branch_id:uuid,base_price:'101',revision:3,attendees:[{student_id:uuid,discount:'1'}]});
  expect(initial.branchId).toBe(uuid);expect(initial.basePrice).toBe('1.01');expect(initial.expectedRevision).toBe(3);expect(initial.attendees[0].discount).toBe('0.01');
 });
 it('omits unused inline lead person and preserves selected existing person',()=>{
  const schema=operation('POST','/leads')!.body!;const initial=initialValues(schema,{personId:uuid});
  expect(payload(schema,initial).person).toBeUndefined();expect(payload(schema,initial).personId).toBe(uuid);
 });
 it('supports contact discriminator and nullable values',()=>{
  const schema=operation('POST','/people')!.body!;
  const initial=initialValues(schema,{branchId:uuid,name:'Person',contacts:[{kind:'phone',value:'+79990000000'}]});
  expect(payload(schema,initial)).toMatchObject({birthday:null,contacts:[{kind:'phone',value:'+79990000000'}]});
 });
 it('uses If-Match and idempotency exactly where required',()=>{
  expect(operation('POST','/transactions')!.idempotent).toBe(true);
  expect(operation('POST','/leads/'+uuid+'/convert')!.version).toBe(true);
  expect(operation('PATCH','/people/'+uuid)!.version).toBe(true);
 });
});
describe('HTTP transport',()=>{
 it('uses bootstrap token then authenticated CSRF, cookies and version header',async()=>{
  const fetcher=vi.fn().mockResolvedValueOnce(Response.json({data:{csrfToken:'pre'}})).mockResolvedValueOnce(Response.json({data:{id:uuid,csrfToken:'session'}})).mockResolvedValueOnce(Response.json({data:{id:uuid}}));vi.stubGlobal('fetch',fetcher);
  const api=new ApiClient('/api/v1');await api.authenticate('login',{login:'user',password:'test'});await api.write('/people/'+uuid,'PATCH',{name:'New'},{version:2});
  expect(fetcher.mock.calls[1][1].headers['X-CSRF-Token']).toBe('pre');expect(fetcher.mock.calls[2][1].headers['X-CSRF-Token']).toBe('session');expect(fetcher.mock.calls[2][1].headers['If-Match']).toBe('"2"');expect(fetcher.mock.calls[2][1].credentials).toBe('include');
 });
 it('does not turn failures into mock success or retry writes automatically',async()=>{
  const fetcher=vi.fn().mockResolvedValue(Response.json({error:{code:'VERSION_CONFLICT',message:'Conflict'},requestId:uuid},{status:409}));vi.stubGlobal('fetch',fetcher);
  await expect(new ApiClient('/api/v1').write('/people/'+uuid,'PATCH',{})).rejects.toBeInstanceOf(HttpError);expect(fetcher).toHaveBeenCalledTimes(1);
 });
 it('clears identity and notifies UI when the session expires',async()=>{
  const listener=vi.fn();window.addEventListener('crm:unauthorized',listener);vi.stubGlobal('fetch',vi.fn().mockResolvedValue(Response.json({error:{code:'UNAUTHENTICATED',message:'Sign in'}},{status:401})));
  await expect(new ApiClient().me()).rejects.toMatchObject({status:401});expect(listener).toHaveBeenCalledOnce();window.removeEventListener('crm:unauthorized',listener);
 });
 it('survives non-JSON reverse proxy failures',async()=>{
  vi.stubGlobal('fetch',vi.fn().mockResolvedValue(new Response('Gateway timeout',{status:504})));
  await expect(new ApiClient().request('/profile')).rejects.toMatchObject({status:504,code:'HTTP_ERROR'});
 });
});

it('reuses an idempotency key after a lost response, then clears it on success',async()=>{
 const {webcrypto}=await import('node:crypto');vi.stubGlobal('crypto',webcrypto);
 const fetcher=vi.fn().mockRejectedValueOnce(new TypeError('network lost')).mockResolvedValue(Response.json({data:{operationId:uuid}}));vi.stubGlobal('fetch',fetcher);
 const client=new ApiClient('/api/v1');const body={amount:'100',reason:'Private payment data'};
 await expect(client.write('/transactions','POST',body,{idempotent:true})).rejects.toMatchObject({status:0});
 expect(sessionStorage.length).toBe(1);expect(JSON.stringify(sessionStorage)).not.toContain('Private payment data');
 await client.write('/transactions','POST',body,{idempotent:true});
 expect(fetcher.mock.calls[0][1].headers['Idempotency-Key']).toBe(fetcher.mock.calls[1][1].headers['Idempotency-Key']);expect(sessionStorage.length).toBe(0);
});
