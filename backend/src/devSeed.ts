import { randomBytes } from 'node:crypto';
if (process.env.NODE_ENV !== 'development' || process.env.ALLOW_DEV_SEED !== 'true')
  throw new Error('Explicit NODE_ENV=development ALLOW_DEV_SEED=true required');
const base=process.env.SEED_BASE_URL??'http://127.0.0.1:3000';
const boot=await fetch(base+'/api/v1/auth/csrf');
const csrf=(await boot.json()).data.csrfToken;
const password=randomBytes(24).toString('base64url');
const suffix=randomBytes(6).toString('hex');
const r=await fetch(base+'/api/v1/auth/register',{method:'POST',headers:{'Content-Type':'application/json',Cookie:boot.headers.get('set-cookie')!.split(';')[0]!,'X-CSRF-Token':csrf},body:JSON.stringify({companyName:'DEV demo '+suffix,fullName:'Demo Director',login:'director',email:`dev-${suffix}@example.invalid`,password})});
if(!r.ok)throw new Error(`Seed failed: ${r.status}`);
const data=(await r.json()).data;
console.log(JSON.stringify({companySlug:data.companySlug,login:'director',password}));
