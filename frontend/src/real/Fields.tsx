import {useEffect,useState} from 'react';
import {api,errorText,type Row} from './client';
import {labels,values,unwrap,moneyFields,initialValues,kopecksToRubles,type Schema} from './schema';
import {relations,sections} from './catalog';
export function recordName(row:Row){return String(row.name||row.login||row.displayName||row.message||row.id||'Запись')}
async function named(row:Row,signal:AbortSignal){
 if(!row.name&&!row.login&&row.person_id){try{const person=await api.request('/people/'+row.person_id,{signal});return {...row,displayName:person.name}}catch{return row}}
 return row;
}
export function Relation({field,value,onChange,required=false,context={}}:{field:string;value:string;onChange:(value:string)=>void;required?:boolean;context?:Row}){
 const resource=relations[field];const [items,setItems]=useState<Row[]>([]),[query,setQuery]=useState(''),[page,setPage]=useState(1),[total,setTotal]=useState(0),[error,setError]=useState(''),[busy,setBusy]=useState(false),[selected,setSelected]=useState('');
 useEffect(()=>{if(!value||!resource)return;const c=new AbortController();api.request('/'+resource+'/'+value,{signal:c.signal}).then(r=>named(r,c.signal)).then(r=>setSelected(recordName(r))).catch(()=>{});return()=>c.abort()},[resource,value]);
 useEffect(()=>{const c=new AbortController();setBusy(true);setError('');const timer=setTimeout(()=>{
  const path=field==='originalPaymentId'&&context.payerId?`/accounts/${context.payerId}/history?page=${page}&pageSize=25`:`/${resource||'ledger'}?page=${page}&pageSize=25${query?'&q='+encodeURIComponent(query):''}`;
  api.request(path,{signal:c.signal}).then(async r=>{
   let list:Row[]=r.items||[];setTotal(r.total??(list.length===25?page*25+1:page*25));
   if(field==='originalPaymentId')list=list.filter(x=>x.kind==='payment'&&BigInt(x.amount)>0n).map(x=>({...x,id:x.operation_id,name:`${kopecksToRubles(x.amount)} ₽ · ${x.created_at}`}));
   if(['accountId','fromAccountId','toAccountId'].includes(field))list=list.filter(x=>x.kind==='cash');
   const result=await Promise.all(list.map(x=>named(x,c.signal)));if(!c.signal.aborted)setItems(result);
  }).catch(e=>{if(!c.signal.aborted)setError(errorText(e))}).finally(()=>{if(!c.signal.aborted)setBusy(false)});
 },200);return()=>{clearTimeout(timer);c.abort()}},[resource,page,query,field,context.payerId]);
 return <div className="v1-relation">
  {resource&&sections[resource]?.search&&<input aria-label={`Поиск: ${labels[field]}`} placeholder="Поиск по имени или названию" value={query} onChange={e=>{setQuery(e.target.value);setPage(1)}}/>}
  <select aria-label={labels[field]||field} required={required} value={value||''} onChange={e=>onChange(e.target.value)}><option value="">Выберите…</option>
   {value&&!items.some(x=>x.id===value)&&<option value={value}>{selected||value}</option>}
   {items.map(x=><option key={x.id} value={x.id}>{recordName(x)}</option>)}
  </select>
  {busy&&<small>Загрузка вариантов…</small>}{error&&<small role="alert">{error}</small>}
  {total>25&&<div className="v1-pagination"><button type="button" disabled={page===1} onClick={()=>setPage(p=>p-1)}>←</button><small>Страница {page}</small><button type="button" disabled={page*25>=total} onClick={()=>setPage(p=>p+1)}>→</button></div>}
 </div>;
}
export function Fields({schema,model,onChange,roles=[],prefix='',context=model}:{schema:Schema;model:Row;onChange:(v:Row)=>void;roles?:string[];prefix?:string;context?:Row}){
 schema=unwrap(schema);
 function update(key:string,value:unknown){const next={...model,[key]:value};if(key==='discount'&&value!=='')next.discountPercent='';if(key==='discountPercent'&&value!=='')next.discount='';onChange(next)}
 return <div className="v1-fields">{Object.entries(schema.properties||{}).map(([key,raw])=>{
  const s=unwrap(raw);const required=(schema.required?.includes(key)||false)&&!raw.anyOf?.some(v=>v.type==='null');const value=model[key];const title=labels[key]||key;
  if(['expectedRevision','person'].includes(key)||s.const!==undefined)return null;
  if(['salary','rate'].includes(key)&&roles.length&&!roles.includes('director'))return null;
  if(context.kind&&['payment','refund','expense','income','salary_payment'].includes(context.kind)){
   if(key==='originalPaymentId'&&context.kind!=='refund')return null;
   if(key==='payerId'&&!['payment','refund'].includes(context.kind))return null;
   if(key==='staffId'&&context.kind!=='salary_payment')return null;
  }
  const id=prefix+key;
  if(s.type==='object')return <fieldset key={key}><legend>{title}</legend><Fields schema={s} model={value||{}} onChange={v=>update(key,v)} roles={roles} prefix={id+'.'} context={context}/></fieldset>;
  if(s.type==='array'){
   const list:unknown[]=Array.isArray(value)?value:[];const item=unwrap(s.items||{});
   if(item.enum)return <fieldset key={key}><legend>{title}{required?' *':''}</legend>{item.enum.map(v=><label className="v1-check" key={v}><input type="checkbox" checked={list.includes(v)} onChange={e=>update(key,e.target.checked?[...list,v]:list.filter(x=>x!==v))}/>{values[v]||v}</label>)}</fieldset>;
   return <fieldset key={key}><legend>{title}{required?' *':''}</legend>{list.map((entry,index)=><div className="v1-array-row" key={index}>
    {item.type==='object'?<Fields schema={item} model={entry as Row} onChange={v=>update(key,list.map((x,i)=>i===index?v:x))} prefix={id+index+'.'} roles={roles} context={context}/>:<Relation field={key} value={String(entry)} onChange={v=>update(key,list.map((x,i)=>i===index?v:x))} required/>}
    <button type="button" onClick={()=>update(key,list.filter((_,i)=>i!==index))}>Убрать</button>
   </div>)}<button type="button" disabled={list.length>=(s.maxItems??500)} onClick={()=>update(key,[...list,item.type==='object'?initialValues(item):''])}>Добавить: {title.toLowerCase()}</button></fieldset>;
  }
  if(s.type==='boolean')return <label className="v1-check" key={key}><input type="checkbox" checked={Boolean(value)} onChange={e=>update(key,e.target.checked)}/>{title}</label>;
  if(relations[key]||key==='originalPaymentId')return <div className="v1-field" key={key}><span>{title}{required?' *':''}</span><Relation field={key} value={String(value||'')} onChange={v=>update(key,v)} required={required} context={context}/></div>;
  let enums=s.enum;if(key==='kind'&&enums?.includes('salary_payment')&&!roles.includes('director'))enums=['payment','refund'];
  return <label className="v1-field" key={key} htmlFor={id}><span>{title}{moneyFields.has(key)?', ₽':''}{required?' *':''}</span>
   {enums?<select id={id} aria-label={title+(required?' *':'')} value={value??''} required={required} onChange={e=>update(key,e.target.value)}><option value="">Выберите…</option>{enums.map(v=><option key={v} value={v}>{values[v]||v}</option>)}</select>:
   ['comment','description','text','reason'].includes(key)?<textarea id={id} value={value??''} required={required} maxLength={s.maxLength} onChange={e=>update(key,e.target.value)}/>:
   <input id={id} type={/password/i.test(key)?'password':s.format==='date-time'?'datetime-local':s.format==='date'||['birthday','startDate','endDate'].includes(key)?'date':key==='email'?'email':moneyFields.has(key)||s.type==='integer'?'number':'text'}
    step={moneyFields.has(key)?'0.01':s.format==='date-time'?60:s.type==='integer'?1:undefined} min={moneyFields.has(key)?0:s.minimum} max={s.maximum} minLength={s.minLength} maxLength={s.maxLength} required={required} value={value??''} onChange={e=>update(key,e.target.value)} autoComplete={/password/i.test(key)?'new-password':'off'}/>}
  </label>;
 })}</div>;
}
