import { test } from 'node:test';
import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { spawn } from 'node:child_process';
import { once } from 'node:events';
import { createServer } from 'node:net';
import ExcelJS from 'exceljs';
if (!process.env.DB_NAME?.endsWith('_test')) throw new Error('Dedicated _test database required');
process.env.SESSION_SECRET = 'readiness-test-only-secret-32-characters';
process.env.NODE_ENV = 'test';
const { createApp } = await import('../../src/app.js');
const { pool } = await import('../../src/core/db.js');
const { checkResponse } = await import('../contracts.js');
createApp(); // register contracts; requests below use the production JS process
const pass = 'Readiness-test-password-123!';
type Session = { cookie: string; csrf: string };
test('production build: full 16-step lifecycle, concurrency, preview and tenant isolation', {timeout:120000}, async t => {
  await pool.execute('DELETE FROM crm_auth_limits');
  const portServer = createServer().listen(0,'127.0.0.1');
  await once(portServer,'listening');
  const port = (portServer.address() as {port:number}).port;
  await new Promise<void>(r=>portServer.close(()=>r()));
  const child = spawn(process.execPath,['dist/server.js'],{env:{...process.env,NODE_ENV:'production',HOST:'127.0.0.1',PORT:String(port),APP_ORIGIN:'https://crm.example',COOKIE_SECURE:'true'},stdio:['ignore','pipe','pipe']});
  let log=''; child.stdout.on('data',b=>log+=b);child.stderr.on('data',b=>log+=b);
  const exited = once(child,'exit');
  const base=`http://127.0.0.1:${port}`;
  let director:Session; let slug:string;
  async function req(method:string,path:string,body?:any,session?:Session,key?:string,version?:number) {
    if (['/auth/register','/auth/login'].includes(path)) {
      const r=await fetch(base+'/api/v1/auth/csrf');
      assert.match(r.headers.get('set-cookie')!,/Secure/);
      session={cookie:r.headers.get('set-cookie')!.split(';')[0]!,csrf:(await r.json()).data.csrfToken};
    }
    const r=await fetch(base+'/api/v1'+path,{method,headers:{'Content-Type':'application/json',Origin:'https://crm.example',...(session?{Cookie:session.cookie,'X-CSRF-Token':session.csrf}:{}),...(key?{'Idempotency-Key':key}:{}),...(version?{'If-Match':`"${version}"`}:{})},...(body===undefined?{}:{body:JSON.stringify(body)})});
    const payload=await r.json();
    if(r.status===200)checkResponse(method,path,payload);
    return {status:r.status,...payload,cookie:r.headers.get('set-cookie')?.split(';')[0]};
  }
  async function ok(method:string,path:string,body?:any,s=director,key?:string,version?:number) {
    const r=await req(method,path,body,s,key,version);assert.equal(r.status,200,JSON.stringify(r));return r.data;
  }
  async function person(name:string,branchId:string){return (await ok('POST','/people',{name,branchId,contacts:[]})).id;}
  async function login(login:string){const r=await req('POST','/auth/login',{companySlug:slug,login,password:pass});assert.equal(r.status,200,JSON.stringify(r));return {cookie:r.cookie,csrf:r.data.csrfToken};}
  try {
    let ready=false;
    for(let i=0;i<100;i++){try{if((await fetch(base+'/health/ready')).status===200){ready=true;break;}}catch{}await new Promise(r=>setTimeout(r,100));}
    assert.ok(ready,log);
    const suffix=randomUUID().slice(0,8);
    const r=await req('POST','/auth/register',{companyName:'E2E '+suffix,fullName:'Director',login:'owner',email:`owner-${suffix}@example.com`,password:pass});
    assert.equal(r.status,200,JSON.stringify(r));director={cookie:r.cookie,csrf:r.data.csrfToken};slug=r.data.companySlug;
    const branchId=(await ok('POST','/branches',{name:'Second branch'})).id;
    const roomId=(await ok('POST','/rooms',{branchId,name:'Room',capacity:3})).id;
    const tp=await person('Teacher',branchId);
    const teacherId=(await ok('POST','/staff',{personId:tp,subject:'Math',rate:'2000'})).id;
    const mp=await person('Manager',branchId);
    await ok('POST','/staff',{personId:mp,subject:'Administration',rate:'0'});
    for(const [personId,role] of [[tp,'teacher'],[mp,'manager']])await ok('POST','/users',{personId,login:role,password:pass,roles:[role],branchIds:[branchId]});
    const manager=await login('manager'); const teacher=await login('teacher');
    const lead=await ok('POST','/leads',{person:{branchId,name:'Parent',contacts:[]},source:'E2E'},manager);
    const cp=await person('Child',branchId);
    const converted=await ok('POST',`/leads/${lead.id}/convert`,{studentPersonId:cp},manager,randomUUID(),lead.version);
    const {payerId,studentId}=converted;
    const groupId=(await ok('POST','/groups',{branchId,teacherId,name:'Math',subject:'Math',capacity:1})).id;
    const otherPerson=await person('Another child',branchId);
    const otherStudent=(await ok('POST','/students',{personId:otherPerson,payerId})).id;
    await ok('POST',`/groups/${groupId}/members`,{studentId,startsAt:'2026-01-01T00:00:00Z'},manager,randomUUID());
    const raceGroup=(await ok('POST','/groups',{branchId,teacherId,name:'Capacity race',subject:'Math',capacity:1})).id;
    const enrollment=await Promise.all([studentId,otherStudent].map(studentId=>req('POST',`/groups/${raceGroup}/members`,{studentId,startsAt:'2026-01-01T00:00:00Z'},manager,randomUUID())));
    assert.deepEqual(enrollment.map(r=>r.status).sort(),[200,409]);
    const template=(await ok('POST','/subscription-templates',{branchId,name:'10 classes',subject:'Math',lessons:10,days:3650,price:'100000'})).id;
    const subId=(await ok('POST','/subscriptions',{studentId,templateId:template,startsAt:'2026-01-01T00:00:00Z'},manager,randomUUID())).id;
    const lessonBody={branchId,groupId,teacherId,roomId,name:'Math',subject:'Math',startsAt:'2026-10-01T10:00:00Z',endsAt:'2026-10-01T11:00:00Z',basePrice:'10000',attendees:[{studentId,payerId,discount:'1000',subscriptionId:subId}]};
    const lesson=(await ok('POST','/lessons',lessonBody,manager,randomUUID()));
    const teacher2=(await ok('POST','/staff',{personId:await person('Other teacher',branchId),subject:'Math',rate:'2000'})).id;
    const room2=(await ok('POST','/rooms',{branchId,name:'Other room',capacity:3})).id;
    const collisionBody={...lessonBody,groupId:null,startsAt:'2026-10-02T10:00:00Z',endsAt:'2026-10-02T11:00:00Z'};
    const roomRace=await Promise.all([teacherId,teacher2].map(teacherId=>req('POST','/lessons',{...collisionBody,teacherId},manager,randomUUID())));
    assert.deepEqual(roomRace.map(r=>r.status).sort(),[200,409]);
    const teacherRace=await Promise.all([roomId,room2].map(roomId=>req('POST','/lessons',{...collisionBody,roomId,startsAt:'2026-10-03T10:00:00Z',endsAt:'2026-10-03T11:00:00Z'},manager,randomUUID())));
    assert.deepEqual(teacherRace.map(r=>r.status).sort(),[200,409]);
    const accountId=(await ok('POST','/accounts',{branchId,name:'Cash'})).id;
    const payment={kind:'payment',accountId,payerId,amount:'50000',reason:'Advance'}; const paymentKey=randomUUID();
    const payments=await Promise.all([1,2].map(()=>ok('POST','/transactions',payment,manager,paymentKey)));
    assert.deepEqual(payments[0],payments[1]);
    const attendance={expectedRevision:0,reason:'Conducted',attendance:[{studentId,status:'present'}]};
    const completions=await Promise.all([1,2].map(()=>req('POST',`/lessons/${lesson.id}/complete`,attendance,teacher,randomUUID())));
    assert.deepEqual(completions.map(r=>r.status).sort(),[200,409]);
    assert.equal((await ok('GET',`/accounts/${payerId}/balance`)).balance,'41000');
    assert.equal((await ok('GET',`/accounts/${teacherId}/balance`)).balance,'2000');
    assert.equal((await ok('GET',`/accounts/${accountId}/balance`)).balance,'50000');
    assert.equal((await ok('GET',`/subscriptions/${subId}/availability`)).remaining,9);
    assert.equal((await ok('GET',`/lessons/${lesson.id}/attendance`)).items[0].attendance,'present');
    await ok('POST',`/lessons/${lesson.id}/complete`,{expectedRevision:1,reason:'Medical absence',attendance:[{studentId,status:'excused'}]},manager,randomUUID());
    assert.equal((await ok('GET',`/accounts/${payerId}/balance`)).balance,'50000');
    assert.equal((await ok('GET',`/subscriptions/${subId}/availability`)).remaining,10);
    const history=await ok('GET',`/accounts/${payerId}/history`);assert.ok(history.items.some((x:any)=>x.reversal_of));
    await ok('POST','/transactions',{kind:'refund',originalPaymentId:payments[0].operationId,accountId,payerId,amount:'5000',reason:'Partial refund'},manager,randomUUID());
    assert.equal((await ok('GET',`/accounts/${payerId}/balance`)).balance,'45000');
    for(const [personId,role] of [[lead.personId,'payer'],[cp,'student']])await ok('POST','/users',{personId,login:role,password:pass,roles:[role],branchIds:[branchId]});
    const payer=await login('payer');const student=await login('student');
    for(const session of [payer,student]){
      await ok('GET','/profile',undefined,session);
      assert.ok((await ok('GET','/students',undefined,session)).items.some((s:any)=>s.id===studentId));
      await ok('GET','/lessons?from=2026-10-01T00:00:00Z&to=2026-10-04T00:00:00Z',undefined,session);
      await ok('GET','/groups',undefined,session); await ok('GET','/subscriptions',undefined,session);
      assert.ok([403,404].includes((await req('GET',`/accounts/${teacherId}/history`,undefined,session)).status));
      assert.equal((await req('GET','/comments?resource=students&resourceId='+studentId,undefined,session)).status,403);
    }
    await ok('GET',`/accounts/${payerId}/history`,undefined,payer);
    assert.ok([403,404].includes((await req('GET',`/accounts/${payerId}/history`,undefined,student)).status));
    const wb=new ExcelJS.Workbook();const sheet=wb.addWorksheet('People');sheet.addRow(['name','email']);sheet.addRow(['Imported '+suffix,`import-${suffix}@example.com`]);
    const preview=await ok('POST','/imports/people/preview',{branchId,kind:'people',fileBase64:Buffer.from(await wb.xlsx.writeBuffer()).toString('base64')},manager,randomUUID());
    assert.equal((await ok('GET','/people?q='+encodeURIComponent('Imported '+suffix))).total,0);
    const confirmed=await Promise.all([1,2].map(()=>ok('POST',`/imports/${preview.id}/confirm`,{},manager,randomUUID())));
    assert.deepEqual(confirmed[0],confirmed[1]);assert.equal(confirmed[0].rows.length,1);
    assert.equal((await ok('GET','/people?q='+encodeURIComponent('Imported '+suffix))).total,1);
    assert.equal((await req('POST',`/imports/${preview.id}/confirm`,{},director,randomUUID())).status,404);
    // Preview does not reserve contacts: a later conflict must roll the entire confirm back.
    sheet.spliceRows(2,1);
    sheet.addRow(['Rollback unique '+suffix,`unique-${suffix}@example.com`]);
    sheet.addRow(['Later conflict',`conflict-${suffix}@example.com`]);
    const pending=await ok('POST','/imports/people/preview',{branchId,kind:'people',fileBase64:Buffer.from(await wb.xlsx.writeBuffer()).toString('base64')},manager,randomUUID());
    await ok('POST','/people',{branchId,name:'Conflict inserted later',contacts:[{kind:'email',value:`conflict-${suffix}@example.com`}]});
    assert.equal((await req('POST',`/imports/${pending.id}/confirm`,{},manager,randomUUID())).status,409);
    assert.equal((await ok('GET','/people?q='+encodeURIComponent('Rollback unique '+suffix))).total,0);
    await pool.execute('UPDATE crm_import_previews SET expires_at=DATE_SUB(UTC_TIMESTAMP(3),INTERVAL 1 HOUR) WHERE id=?',[pending.id]);
    const expired=await req('POST',`/imports/${pending.id}/confirm`,{},manager,randomUUID());
    assert.equal(expired.status,409);assert.equal(expired.error.code,'IMPORT_EXPIRED');
    const otherReg=await req('POST','/auth/register',{companyName:'Other '+suffix,fullName:'Other',login:'owner',email:`other-${suffix}@example.com`,password:pass});assert.equal(otherReg.status,200);
    const other={cookie:otherReg.cookie,csrf:otherReg.data.csrfToken};
    for(const path of [`/students/${studentId}`,`/lessons/${lesson.id}`,`/accounts/${payerId}/history`])assert.equal((await req('GET',path,undefined,other)).status,404);
    assert.equal((await req('POST',`/imports/${preview.id}/confirm`,{},other,randomUUID())).status,404);
    assert.equal((await ok('GET','/students',undefined,other)).total,0);
    t.diagnostic('All 16 steps and five concurrency cases passed against dist/server.js with NODE_ENV=production');
  } finally {
    child.kill('SIGTERM');const [code]=await exited;await pool.end();assert.equal(code,0,log);
  }
});
