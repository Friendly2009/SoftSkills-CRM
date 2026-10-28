import {useEffect,useState} from 'react';
import {Link,NavLink,Navigate,Route,Routes,useNavigate,useParams} from 'react-router-dom';
import {api,errorText,type Row,type Session} from './client';
import {sections,allowed} from './catalog';
import {operation,labels,values} from './schema';
import {Relation} from './Fields';
import {ActionForm,DataView,Grid,Modal,allPages,type Action} from './Views';
import {ImportPage} from './ImportPage';
import './real.css';
const admin=['director','manager'];
function period(){const a=new Date();a.setHours(0,0,0,0);a.setDate(1);const b=new Date(a);b.setMonth(b.getMonth()+1);const day=(d:Date)=>new Date(d.getTime()-d.getTimezoneOffset()*60000).toISOString().slice(0,10);return {from:day(a),to:day(b)}}
export function Workspace(){
 const nav=useNavigate();const [session,setSession]=useState<Session|null>(null),[error,setError]=useState(''),[attempt,setAttempt]=useState(0),[busy,setBusy]=useState(false);
 useEffect(()=>{const c=new AbortController();api.me(c.signal).then(setSession).catch(e=>{if(!c.signal.aborted)setError(errorText(e))});return()=>c.abort()},[attempt]);
 useEffect(()=>{const f=()=>{setSession(null);api.clear();nav('/authorization',{replace:true})};window.addEventListener('crm:unauthorized',f);return()=>window.removeEventListener('crm:unauthorized',f)},[nav]);
 async function logout(){if(busy)return;setBusy(true);try{await api.logout();setSession(null);nav('/authorization',{replace:true})}catch(e){setError(errorText(e))}finally{setBusy(false)}}
 if(!session)return <main className="v1-root v1-loading">{error?<><p role="alert">{error}</p><button onClick={()=>{setError('');setAttempt(x=>x+1)}}>Повторить</button><Link to="/authorization">Войти</Link></>:<p role="status">Загрузка сессии…</p>}</main>;
 const home=allowed(session.roles,admin)?'analytics':'lessons';
 return <div className="v1-root"><header className="v1-header"><Link className="v1-brand" to="/dashboard">SoftSkills <b>CRM</b></Link><span>{session.roles.map(r=>values[r]||r).join(', ')}</span><Link to="/dashboard/profile">Мой профиль</Link><button disabled={busy} onClick={logout}>Выйти</button></header>
  <div className="v1-shell"><aside><nav aria-label="Разделы CRM">{Object.entries(sections).filter(([,s])=>allowed(session.roles,s.roles)).map(([key,s])=><NavLink key={key} to={'/dashboard/'+key}>{s.name}</NavLink>)}</nav></aside>
  <main className="v1-main">{error&&<p role="alert" className="v1-error">{error}</p>}<Routes><Route index element={<Navigate to={home} replace/>}/><Route path=":resource" element={<Page session={session}/>}/><Route path=":resource/:id" element={<Page session={session}/>}/><Route path="*" element={<Navigate to={home} replace/>}/></Routes></main></div>
 </div>;
}
function Page({session}:{session:Session}){const {resource='profile',id}=useParams();return <ResourcePage key={resource+':'+(id||'')} resource={resource} id={id} session={session}/>}
function ResourcePage({resource,id,session}:{resource:string;id?:string;session:Session}){
 const config=sections[resource];const nav=useNavigate();const [data,setData]=useState<Row|null>(null),[error,setError]=useState(''),[loading,setLoading]=useState(true),[reload,setReload]=useState(0);
 const [page,setPage]=useState(1),[search,setSearch]=useState(''),[q,setQ]=useState(''),[branch,setBranch]=useState(''),[archive,setArchive]=useState('exclude'),[sort,setSort]=useState('id'),[order,setOrder]=useState('asc'),[status,setStatus]=useState('');
 const [filters,setFilters]=useState<Record<string,string>>({});
 const filterResources:Record<string,string[]>={personId:['payers','students','staff','leads','tasks'],payerId:['students','payer-students','tasks','leads'],studentId:['enrollments','payer-students','tasks','leads','lessons','subscriptions'],roomId:['lessons'],groupId:['enrollments','lessons'],responsibleId:['tasks','leads'],teacherId:['groups','lessons']};
 const filterKeys=Object.keys(filterResources).filter(k=>filterResources[k].includes(resource));
 const [dates,setDates]=useState(period),[action,setAction]=useState<Action|null>(null),[result,setResult]=useState<Row|null>(null),[tab,setTab]=useState(''),[note,setNote]=useState(''),[preparing,setPreparing]=useState(false),[widgets,setWidgets]=useState<string[]>([]);
 const manage=allowed(session.roles,admin),director=session.roles.includes('director'),internal=manage||session.roles.includes('teacher');
 const isSingle=['organization','profile','license','analytics','reports'].includes(resource);
 const prefix='/'+resource+(id?'/'+id:'');
 const canWrite=!!config?.write&&allowed(session.roles,config.write);
 useEffect(()=>{const t=setTimeout(()=>{setQ(search);setPage(1)},250);return()=>clearTimeout(t)},[search]);
 const permitted=!!config&&allowed(session.roles,config.roles);
 useEffect(()=>{
  if(!permitted||resource==='imports'){setLoading(false);return}
  const c=new AbortController();setLoading(true);setError('');setData(null);
  const params=new URLSearchParams();let path=prefix;
  if(resource==='analytics'||resource==='reports'){
   path=resource==='analytics'?'/analytics/overview':'/reports/finance';
   params.set('from',new Date(dates.from+'T00:00:00').toISOString());params.set('to',new Date(dates.to+'T00:00:00').toISOString());if(branch)params.set('branchId',branch);
  }else if(!isSingle&&!id){
   params.set('page',String(page));params.set('pageSize','25');
   if(resource!=='notifications'){
    params.set('sortBy',sort);params.set('sortOrder',order);if(q&&config.search)params.set('q',q);if(branch&&config.branch)params.set('branchId',branch);if(config.archive&&archive!=='exclude')params.set('archived',archive);if(status)params.set('status',status);
    if(resource==='lessons'||resource==='ledger'){params.set('from',new Date(dates.from+'T00:00:00').toISOString());params.set('to',new Date(dates.to+'T00:00:00').toISOString())}
   }
  }
  if(!id&&manage)for(const [key,value]of Object.entries(filters))if(value)params.set(key,value);
  if(tab){path=prefix+'/'+tab;params.set('page',String(page));params.set('pageSize','25');if(['balance','availability'].includes(tab)){params.delete('page');params.delete('pageSize')}}
  const request=api.request(path+(params.size?'?'+params.toString():''),{signal:c.signal});
  request.then(r=>{if(!c.signal.aborted)setData(r)}).catch(e=>{if(!c.signal.aborted)setError(errorText(e))}).finally(()=>{if(!c.signal.aborted)setLoading(false)});
  if(resource==='analytics')api.request('/widgets',{signal:c.signal}).then(r=>setWidgets(r.ids)).catch(()=>{});
  return()=>c.abort();
 },[prefix,resource,permitted,id,isSingle,page,q,branch,archive,sort,order,status,dates,tab,reload,config,filters,manage]);
 function refresh(){setReload(n=>n+1)}
 function changeTab(next:string){setTab(next);setPage(1)}
 async function edit(){if(!data)return;setPreparing(true);setError('');try{
  const row={...data};if(resource==='people')row.contacts=await api.request(prefix+'/contacts');
  if(resource==='profile'){Object.assign(row,{...row.person,email:row.contacts.find((x:Row)=>x.kind==='email')?.value||'',phone:row.contacts.find((x:Row)=>x.kind==='phone')?.value||null});}
  if(resource==='lessons')row.attendees=await allPages(prefix+'/attendance');
  setAction({title:'Изменить: '+config.name,path:prefix,method:'PATCH',row});
 }catch(e){setError(errorText(e))}finally{setPreparing(false)}}
 async function complete(){if(!data)return;setPreparing(true);setError('');try{
  const attendees=await allPages(prefix+'/attendance');
  setAction({title:data.status==='completed'?'Исправить проведение':'Провести занятие',path:prefix+'/complete',method:'POST',row:data,preset:{attendance:attendees.map(a=>({...a,studentId:a.student_id,status:a.attendance||''}))}});
 }catch(e){setError(errorText(e))}finally{setPreparing(false)}}
 function saved(r:Row){setAction(null);setNote('Изменения сохранены.');
  if(r.signInRequired){api.clear();nav('/authorization',{replace:true});return}
  if(r.token)setResult(r);else refresh();
 }
 if(!permitted)return <section><h1>Раздел недоступен</h1><p>Для этой учётной записи нет доступа.</p><Link to="/dashboard">На главную</Link></section>;
 if(resource==='imports')return <ImportPage session={session}/>;
 const table=Array.isArray(data?.items);const columns=tab?({history:resource==='accounts'?['created_at','kind','amount','reason','operation_id']:['created_at','action','author_id','before_data','after_data'],comments:['text','author_id','created_at'],attendance:['student_id','attendance','price','discount'],members:['student_id','starts_at','ends_at'],usage:['lesson_id','delta','revision'],versions:['revision','lesson','attendees']} as Record<string,string[]>)[tab]||Object.keys(data?.items?.[0]||{}).filter(k=>k!=='org_id'):config.columns;
 const visibleColumns=columns.filter(k=>(k!=='rate'||director)&&(internal||!['payer_id','teacher_id','branch_id','price','discount'].includes(k)));
 const card=!!id||isSingle;
 function start(title:string,path:string,method='POST',preset?:Row){setAction({title,path,method,row:card?data||undefined:undefined,preset})}
 return <section>
  <div className="v1-heading"><div>{id&&<Link to={'/dashboard/'+resource}>← {config.name}</Link>}<h1>{id?data?.name||config.name:config.name}</h1></div><button disabled={loading} onClick={refresh}>Обновить</button></div>
  {resource==='ledger'&&<p className="v1-hint">Здесь проводки по кассам, авансам и зарплате. Оплата имеет две проводки; их нельзя суммировать как выручку. Движение денег и начисления показаны отдельно в финансовом отчёте.</p>}
  {resource==='people'&&<p className="v1-hint">Один человек может быть плательщиком, учеником и сотрудником. Создайте человека один раз, затем назначьте нужные роли в соответствующих разделах.</p>}
  {resource==='profile'&&<p className="v1-code">Код организации: {session.companySlug}</p>}
  {(!card||['analytics','reports'].includes(resource))&&<div className="v1-filters">
   {config.search&&<label>Поиск<input aria-label="Поиск записей" value={search} onChange={e=>setSearch(e.target.value)}/></label>}
   {(config.branch||['analytics','reports'].includes(resource))&&internal&&<div><span>Филиал</span><Relation field="branchId" value={branch} onChange={v=>{setBranch(v);setPage(1)}}/></div>}
   {manage&&filterKeys.map(key=><div key={key}><span>{labels[key]}</span><Relation field={key} value={filters[key]||''} onChange={v=>{setFilters({...filters,[key]:v});setPage(1)}}/></div>)}
   {config.archive&&manage&&<label>Архив<select value={archive} onChange={e=>{setArchive(e.target.value);setPage(1)}}><option value="exclude">Без архивных</option><option value="only">Архивные</option><option value="all">Все</option></select></label>}
   {['lessons','ledger','analytics','reports'].includes(resource)&&<><label>С<input type="date" required value={dates.from} onChange={e=>{if(e.target.value)setDates({...dates,from:e.target.value})}}/></label><label>До (не включая)<input type="date" required value={dates.to} onChange={e=>{if(e.target.value)setDates({...dates,to:e.target.value})}}/></label></>}
   {['leads','groups','tasks','staff','lessons'].includes(resource)&&<label>Статус{resource==='lessons'?<select value={status} onChange={e=>{setStatus(e.target.value);setPage(1)}}><option value="">Любой</option>{['scheduled','completed','cancelled'].map(v=><option key={v} value={v}>{values[v]}</option>)}</select>:<input value={status} onChange={e=>{setStatus(e.target.value);setPage(1)}} placeholder="Любой"/>}</label>}
   {config.sort&&<><label>Сортировка<select value={sort} onChange={e=>{setSort(e.target.value);setPage(1)}}><option value="id">По идентификатору</option>{config.sort.map(s=><option key={s} value={s}>{labels[s]||s}</option>)}</select></label><label>Порядок<select value={order} onChange={e=>setOrder(e.target.value)}><option value="asc">По возрастанию</option><option value="desc">По убыванию</option></select></label></>}
  </div>}
  <div className="v1-actions">
   {!card&&canWrite&&operation('POST',prefix)&&<button className="v1-primary" onClick={()=>start('Добавить: '+config.name,prefix)}>Добавить</button>}
   {card&&!tab&&data&&canWrite&&operation('PATCH',prefix)&&!data.archived_at&&<button disabled={preparing} onClick={edit}>Редактировать</button>}
   {card&&!tab&&data&&config.archive&&canWrite&&operation('POST',prefix+'/archive')&&!data.archived_at&&<button onClick={()=>start('Архивировать запись',prefix+'/archive')}>Архивировать</button>}
   {resource==='profile'&&data&&<><button disabled={preparing} onClick={edit}>Редактировать профиль</button><button onClick={()=>start('Сменить пароль','/profile/password')}>Сменить пароль</button><button onClick={()=>start('Отозвать остальные сессии','/auth/sessions/revoke-others')}>Отозвать остальные сессии</button></>}
   {resource==='users'&&!id&&director&&<button onClick={()=>start('Пригласить пользователя','/invitations')}>Пригласить</button>}
   {['ledger','accounts'].includes(resource)&&manage&&<><button onClick={()=>start('Зарегистрировать оплату','/transactions','POST',{kind:'payment'})}>Оплата</button><button onClick={()=>start('Возврат оплаты','/transactions','POST',{kind:'refund'})}>Возврат</button><button onClick={()=>start('Перевести деньги','/transfers')}>Перевод</button>{director&&<><button onClick={()=>start('Ручной расход','/transactions','POST',{kind:'expense'})}>Расход</button><button onClick={()=>start('Выплата зарплаты','/transactions','POST',{kind:'salary_payment'})}>Выплата зарплаты</button><button onClick={()=>start('Прочий доход','/transactions','POST',{kind:'income'})}>Прочий доход</button></>}</>}
   {resource==='ledger'&&id&&data?.operation_id&&manage&&!data.reversal_of&&!data.lesson_id&&<button onClick={()=>start('Компенсировать операцию','/transactions/'+data.operation_id+'/reverse')}>Компенсировать операцию</button>}
   {resource==='leads'&&id&&data&&!tab&&manage&&<button onClick={()=>start('Конвертировать лида',prefix+'/convert')}>Конвертировать</button>}
   {resource==='groups'&&id&&manage&&<button onClick={()=>start('Зачислить ученика','/enrollments','POST',{groupId:id})}>Зачислить ученика</button>}
   {resource==='lessons'&&id&&data&&!tab&&internal&&<><button disabled={preparing||(!manage&&data.status!=='scheduled')} onClick={complete}>{data.status==='completed'?'Исправить проведение':'Провести занятие'}</button>{manage&&<button onClick={()=>start('Отменить занятие',prefix+'/cancel')}>Отменить занятие</button>}</>}
   {resource==='subscriptions'&&id&&manage&&<><button onClick={()=>start('Заморозить абонемент',prefix+'/freeze')}>Заморозить</button><button onClick={()=>start('Возобновить абонемент',prefix+'/unfreeze')}>Возобновить</button></>}
   {resource==='notifications'&&data&&<button disabled={!data.items.some((x:Row)=>!x.read_at)} onClick={()=>start('Отметить уведомления прочитанными','/notifications/read','POST',{ids:data.items.filter((x:Row)=>!x.read_at).map((x:Row)=>x.id)})}>Прочитать эту страницу</button>}
   {resource==='analytics'&&manage&&<button onClick={()=>start('Настроить виджеты','/widgets','PATCH',{ids:widgets})}>Настроить виджеты</button>}
  </div>
  {card&&!['analytics','reports','license','profile'].includes(resource)&&<nav className="v1-tabs"><button onClick={()=>changeTab('')}>Карточка</button>{['history','comments','members','attendance','balance','usage','availability','versions'].filter(t=>operation('GET',prefix+'/'+t)&&(manage||!['history','comments','versions'].includes(t)||resource==='accounts'&&t==='history')).map(t=><button className={tab===t?'selected':''} key={t} onClick={()=>changeTab(t)}>{{history:'История',comments:'Комментарии',members:'Участники',attendance:'Посещаемость',balance:'Баланс',usage:'Использование',availability:'Остаток абонемента',versions:'Версии'}[t]}</button>)}</nav>}
  {tab==='comments'&&manage&&<button onClick={()=>start('Добавить комментарий',prefix+'/comments')}>Добавить комментарий</button>}
  {note&&<p role="status" className="v1-success">{note}</p>}{error&&<p role="alert" className="v1-error">{error}</p>}
  {loading?<p role="status">Загрузка…</p>:data&&(table?<><Grid rows={data.items} columns={visibleColumns.length?visibleColumns:Object.keys(data.items[0]||{}).filter(k=>k!=='org_id')} session={session} onOpen={!card&&resource!=='notifications'?r=>nav('/dashboard/'+resource+'/'+r.id):undefined}/>
   {data.balance!==undefined&&<p>Баланс: <DataView data={{balance:data.balance}} session={session}/></p>}
   <div className="v1-pagination"><button disabled={page===1} onClick={()=>setPage(p=>p-1)}>Назад</button><span>Страница {page}{data.total!==undefined?' · Всего '+data.total:''}</span><button disabled={data.total!==undefined?page*25>=data.total:data.items.length<25} onClick={()=>setPage(p=>p+1)}>Далее</button></div></>:<div className="v1-card"><DataView data={resource==='analytics'?Object.fromEntries(Object.entries(data).filter(([k])=>!['lessons','sales','finance','attendance'].includes(k)||widgets.includes(k))):data} session={session}/></div>)}
  {action&&<ActionForm key={action.path+action.method} action={action} session={session} onClose={()=>{setAction(null);refresh()}} onSaved={saved}/>}
  {result&&<Modal title="Приглашение создано" onClose={()=>{setResult(null);refresh()}}><p>Передайте этот код пользователю лично. Он вводится на странице «Приглашение» и используется один раз.</p><p className="v1-code">{result.token}</p><Link to="/invitation">Страница принятия приглашения</Link></Modal>}
 </section>;
}
