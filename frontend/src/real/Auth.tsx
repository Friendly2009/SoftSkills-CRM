import {useState} from 'react';
import {Link,useNavigate} from 'react-router-dom';
import {api,errorText} from './client';
import './real.css';
export function Auth({mode}:{mode:'login'|'register'|'invitations/accept'}){
 const nav=useNavigate();const [form,setForm]=useState<Record<string,string>>({companySlug:localStorage.getItem('crm.companySlug')||''});const [busy,setBusy]=useState(false),[error,setError]=useState(''),[slug,setSlug]=useState('');
 const fields=mode==='login'?[['companySlug','Код организации'],['login','Логин или email'],['password','Пароль']]:mode==='register'?[['companyName','Название организации'],['fullName','ФИО'],['login','Логин'],['email','Электронная почта'],['password','Пароль'],['phone','Телефон (необязательно)']]:[['token','Код приглашения'],['login','Логин'],['password','Пароль']];
 async function submit(e:React.FormEvent){e.preventDefault();if(busy)return;setBusy(true);setError('');try{
  const body=Object.fromEntries(fields.filter(([k])=>k!=='phone'||form.phone?.trim()).map(([k])=>[k,form[k]||'']));
  const result=await api.authenticate(mode,body);localStorage.setItem('crm.companySlug',result.companySlug);
  if(mode==='register')setSlug(result.companySlug);else nav('/dashboard',{replace:true});
 }catch(e){setError(errorText(e))}finally{setBusy(false)}}
 return <main className="v1-auth v1-root"><section><Link to="/">SoftSkills CRM</Link><h1>{mode==='login'?'Вход в CRM':mode==='register'?'Создать организацию':'Принять приглашение'}</h1>
  {slug?<><p>Организация создана. Сохраните её код — он понадобится для входа с другого устройства.</p><p className="v1-code" data-testid="company-slug">{slug}</p><button className="v1-primary" onClick={()=>nav('/dashboard',{replace:true})}>Перейти в CRM</button></>:<form onSubmit={submit}><fieldset disabled={busy}>{fields.map(([k,label])=><label className="v1-field" key={k}><span>{label}</span><input name={k} required={k!=='phone'} type={k==='password'?'password':k==='email'?'email':'text'} autoComplete={k==='password'?(mode==='login'?'current-password':'new-password'):k==='login'?'username':'off'} minLength={k==='password'&&mode!=='login'?12:undefined} maxLength={k==='password'?128:255} value={form[k]||''} onChange={e=>setForm({...form,[k]:e.target.value})}/></label>)}
   {mode!=='login'&&<p className="v1-hint">Пароль — от 12 символов.</p>}
   <button className="v1-primary" type="submit">{busy?'Подождите…':mode==='login'?'Войти':mode==='register'?'Создать организацию':'Принять приглашение'}</button></fieldset></form>}
  {error&&<p role="alert" className="v1-error">{error}</p>}<nav><Link to="/authorization">Вход</Link><Link to="/registration">Регистрация</Link><Link to="/invitation">Приглашение</Link></nav>
 </section></main>;
}
