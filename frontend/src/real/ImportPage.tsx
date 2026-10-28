import {useState} from 'react';
import {api,errorText,type Row,type Session} from './client';
import {Relation} from './Fields';
import {Grid} from './Views';
export function ImportPage({session}:{session:Session}){
 const [branch,setBranch]=useState(''),[kind,setKind]=useState('people'),[payer,setPayer]=useState(''),[file,setFile]=useState<File|null>(null),[preview,setPreview]=useState<Row|null>(null),[error,setError]=useState(''),[busy,setBusy]=useState(false),[complete,setComplete]=useState(false);
 async function inspect(e:React.FormEvent){e.preventDefault();if(!file||busy)return;setBusy(true);setError('');setPreview(null);setComplete(false);try{
  if(file.size>512*1024)throw new Error('Размер файла не должен превышать 512 КБ.');
  const bytes=new Uint8Array(await file.arrayBuffer());let binary='';for(const n of bytes)binary+=String.fromCharCode(n);
  const data=await api.write('/imports/people/preview','POST',{branchId:branch,kind,...(kind==='students'?{payerId:payer}:{}),fileBase64:btoa(binary)},{idempotent:true});setPreview(data);
 }catch(e){setError(errorText(e))}finally{setBusy(false)}}
 async function confirm(){if(!preview||busy||complete)return;setBusy(true);setError('');try{await api.write('/imports/'+preview.id+'/confirm','POST',{}, {idempotent:true});setComplete(true)}catch(e){setError(errorText(e))}finally{setBusy(false)}}
 return <section><h1>Импорт из Excel</h1><p>Один лист, до 200 строк. Заголовки колонок: name, email, phone, birthday, comment. Формулы и гиперссылки запрещены. Сначала проверьте предпросмотр, затем подтвердите импорт.</p>
 <form onSubmit={inspect}><fieldset disabled={busy||!!preview}><label>Филиал<Relation field="branchId" value={branch} onChange={setBranch} required/></label><label className="v1-field">Создать<select value={kind} onChange={e=>setKind(e.target.value)}><option value="people">Людей</option><option value="payers">Плательщиков</option><option value="students">Учеников</option></select></label>{kind==='students'&&<label>Плательщик<Relation field="payerId" value={payer} onChange={setPayer} required/></label>}<label className="v1-field">Файл XLSX<input type="file" required accept=".xlsx" onChange={e=>setFile(e.target.files?.[0]||null)}/></label><button className="v1-primary" type="submit">Проверить файл</button></fieldset></form>
 {error&&<p role="alert" className="v1-error">{error}</p>}{preview&&<><h2>Предпросмотр · {preview.rowCount} строк</h2><Grid rows={preview.rows} columns={['name','email','phone','birthday','comment']} session={session}/>{complete?<p role="status" className="v1-success">Импорт выполнен. Записи доступны в выбранном разделе.</p>:<button className="v1-primary" disabled={busy} onClick={confirm}>Подтвердить импорт</button>}<button disabled={busy} onClick={()=>{setPreview(null);setComplete(false)}}>Другой файл</button></>}
 </section>;
}
