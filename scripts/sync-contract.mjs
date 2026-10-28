import {readFileSync,writeFileSync} from 'node:fs';
const spec=JSON.parse(readFileSync(new URL('../docs/openapi.json',import.meta.url),'utf8'));
const result={};
for(const [path,methods] of Object.entries(spec.paths)) for(const [method,operation] of Object.entries(methods)) {
 if(!path.startsWith('/api/v1/'))continue;
 result[method.toUpperCase()+' '+path.slice(7)]={
  body:operation.requestBody?.content?.['application/json']?.schema,
  query:(operation.parameters??[]).filter(p=>p.in==='query'),
  version:(operation.parameters??[]).some(p=>p.in==='header'&&p.name==='If-Match'),
  idempotent:(operation.parameters??[]).some(p=>p.in==='header'&&p.name==='Idempotency-Key'),
 };
}
const text=JSON.stringify(result,null,2)+'\n';
const target=new URL('../frontend/src/real/contract.json',import.meta.url);
if(process.argv.includes('--check')) {if(readFileSync(target,'utf8')!==text)throw new Error('Frontend contract out of date: node scripts/sync-contract.mjs');}
else writeFileSync(target,text);
