import {useEffect,useState,type ReactNode} from 'react';
import {api,errorText,HttpError,type Row,type Session} from './client';
import {labels,values,moneyFields,kopecksToRubles,operation,initialValues,payload,type Schema} from './schema';
import {Fields,recordName} from './Fields';
import {relations,sections,allowed} from './catalog';
export function Reference({field,value,session}:{field:string;value:string;session:Session}){
 const resource=relations[field];const [label,setLabel]=useState(value);
 useEffect(()=>{setLabel(value);if(!resource||!value||!allowed(session.roles,sections[resource]?.roles))return;const c=new AbortController();api.request('/'+resource+'/'+value,{signal:c.signal}).then(async r=>{
  if(r.person_id&&!r.name){const p=await api.request('/people/'+r.person_id,{signal:c.signal});return p.name}
  return recordName(r);
 }).then(v=>{if(!c.signal.aborted)setLabel(v)}).catch(()=>{});return()=>c.abort()},[resource,value,session]);
 return <span title={value}>{label===value?value.slice(0,8):label}</span>;
}
export function Value({name,value,session}:{name:string;value:unknown;session:Session}){
 if(value===null||value===undefined||value==='')return <span className="v1-muted">—</span>;
 if(typeof value!=='object'&&(moneyFields.has(name)||moneyFields.has(name.replace(/_([a-z])/g,(_,c:string)=>c.toUpperCase()))))return <>{kopecksToRubles(value)} ₽</>;
 if(typeof value==='boolean'||name==='active')return <>{value?'Да':'Нет'}</>;
 if(Array.isArray(value))return value.length?<div>{value.map((v,i)=><span key={i}>{i?', ':''}{typeof v==='object'?<DataView data={v} session={session}/>:values[String(v)]||String(v)}</span>)}</div>:<>—</>;
 if(typeof value==='object')return <DataView data={value as Row} session={session}/>;
 if(relations[name])return <Reference field={name} value={String(value)} session={session}/>;
 if(typeof value==='string'&&/^\d{4}-\d\d-\d\d[ T]\d\d:/.test(value)){const date=new Date(value.includes('T')?value:value.replace(' ','T')+'Z');return <>{isNaN(date.getTime())?value:date.toLocaleString('ru-RU')}</>}
 return <>{values[String(value)]||String(value)}</>;
}
export function DataView({data,session}:{data:Row;session:Session}){
 return <dl className="v1-data">{Object.entries(data).filter(([k])=>!['org_id','password_hash','csrfToken','requestId','token_hash'].includes(k)).map(([k,v])=><div key={k}><dt>{labels[k]||k}</dt><dd><Value name={k} value={v} session={session}/></dd></div>)}</dl>;
}
export function Grid({rows,columns,session,onOpen}:{rows:Row[];columns:string[];session:Session;onOpen?:(r:Row)=>void}){
 if(!rows.length)return <p className="v1-empty">Записей пока нет.</p>;
 return <div className="v1-table-wrap"><table><thead><tr>{columns.map(k=><th key={k}>{labels[k]||k}</th>)}{onOpen&&<th>Карточка</th>}</tr></thead><tbody>{rows.map((r,i)=><tr key={r.id||i}>{columns.map(k=><td key={k}><Value name={k} value={r[k]} session={session}/></td>)}{onOpen&&<td><button onClick={()=>onOpen(r)}>Открыть</button></td>}</tr>)}</tbody></table></div>;
}
export function Modal({title,children,onClose,busy=false}:{title:string;children:ReactNode;onClose:()=>void;busy?:boolean}){
 useEffect(()=>{const f=(e:KeyboardEvent)=>{if(e.key==='Escape'&&!busy)onClose()};document.addEventListener('keydown',f);const old=document.body.style.overflow;document.body.style.overflow='hidden';return()=>{document.removeEventListener('keydown',f);document.body.style.overflow=old}},[onClose,busy]);
 return <div className="v1-overlay"><section className="v1-modal" role="dialog" aria-modal="true" aria-label={title}><header><h2>{title}</h2><button type="button" aria-label="Закрыть" disabled={busy} onClick={onClose}>×</button></header>{children}</section></div>;
}
export interface Action {title:string;path:string;method:string;template?:string;row?:Row;preset?:Row;version?:string|number;schema?:Schema}
export function ActionForm({action,session,onClose,onSaved}:{action:Action;session:Session;onClose:()=>void;onSaved:(result:Row)=>void}){
 const op=operation(action.method,action.template||action.path);const schema=action.schema||op?.body||{type:'object',properties:{}};
 const [model,setModel]=useState(()=>initialValues(schema,{...action.row,...action.preset}));const [busy,setBusy]=useState(false),[error,setError]=useState(''),[uncertain,setUncertain]=useState(false);
 async function submit(e:React.FormEvent){e.preventDefault();if(busy||uncertain)return;setBusy(true);setError('');
  try{
   const body=payload(schema,model);
   if(!session.roles.includes('director')){delete body.salary;delete body.rate}
   if(['payment','refund','expense','income','salary_payment'].includes(body.kind)){
    if(body.kind!=='refund')delete body.originalPaymentId;if(!['payment','refund'].includes(body.kind))delete body.payerId;if(body.kind!=='salary_payment')delete body.staffId;
   }
   const version=action.version??action.row?.version??action.row?.person?.version;
   if(op?.version&&version===undefined)throw new Error('Не удалось определить версию записи. Обновите карточку.');
   const result=await api.write(action.path,action.method,body,{version:op?.version?version:undefined,idempotent:op?.idempotent});
   onSaved(result);
  }catch(e){setError(errorText(e));if(e instanceof HttpError&&(e.status===0||e.status>=500)&&!op?.idempotent)setUncertain(true)}finally{setBusy(false)}
 }
 return <Modal title={action.title} onClose={onClose} busy={busy}><form onSubmit={submit}><fieldset disabled={busy||uncertain}>
  {action.path==='/notifications/read'?<p>Отметить прочитанными: {model.ids.length} уведомлений.</p>:<Fields schema={schema} model={model} onChange={setModel} roles={session.roles}/>}
  {!Object.keys(schema.properties||{}).length&&<p>Подтвердите действие «{action.title}».</p>}
  {action.path.endsWith('/complete')&&<p className="v1-hint">Отметьте каждого ученика. Проведение одновременно сохранит посещаемость, списания, абонементы и начисления. Исправление проведённого занятия требует причины.</p>}
  {action.path.endsWith('/convert')&&<p className="v1-hint">Если ученик и плательщик — разные люди, заранее создайте карточку второго человека в разделе «Люди» и выберите её здесь.</p>}
  {action.path.endsWith('/lessons')&&<p className="v1-hint">Для группового занятия выберите группу и всех участников. Для индивидуального оставьте группу пустой. Дата и время вводятся в часовом поясе вашего устройства.</p>}
  <button className="v1-primary" type="submit">{busy?'Сохранение…':'Сохранить'}</button>
 </fieldset>{error&&<p role="alert" className="v1-error">{error}</p>}{uncertain&&<p>Закройте форму и обновите список перед новой попыткой.</p>}</form></Modal>;
}
export async function allPages(path:string,signal?:AbortSignal){const out:Row[]=[];for(let page=1;page<=1000;page++){
 const r=await api.request(path+(path.includes('?')?'&':'?')+`page=${page}&pageSize=100`,{signal});out.push(...r.items);if(r.items.length<100||(r.total!==undefined&&out.length>=r.total))return out;
 }throw new Error('Слишком много записей. Уточните выбор.')}
