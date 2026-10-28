export type Row = Record<string, any>;
export interface Session {id:string;org:string;personId:string;roles:string[];branches:string[];companySlug:string;csrfToken:string}
export class HttpError extends Error {
  constructor(message:string,public status:number,public code:string,public requestId?:string,public details?:unknown){super(message)}
}
const messages:Record<string,string>={
 FUTURE_LESSON:'Нельзя провести занятие до его начала.',
 UNAUTHENTICATED:'Войдите в систему.', INVALID_CREDENTIALS:'Неверный код организации, логин или пароль.',
 CSRF:'Сессия обновилась. Перезагрузите страницу.', FORBIDDEN:'Недостаточно прав.', BRANCH_FORBIDDEN:'Нет доступа к этому филиалу.',
 VERSION_CONFLICT:'Запись изменена другим пользователем. Закройте форму, обновите карточку и внесите изменения повторно.',
 IDEMPOTENCY_CONFLICT:'Повтор запроса не совпадает с исходным. Обновите данные и проверьте историю операции.',
 DUPLICATE:'Такое значение уже используется.', CONTACT_EXISTS:'Этот контакт уже принадлежит другому человеку. Выберите существующего человека.',
 RATE_LIMIT:'Слишком много попыток. Повторите через 15 минут.', INSUFFICIENT_CASH:'Недостаточно денег в выбранной кассе.',
 REFUND_EXCEEDED:'Возврат превышает оставшуюся сумму исходной оплаты.', SALARY_EXCEEDED:'Выплата превышает начисленную зарплату.',
 GROUP_FULL:'В группе нет свободных мест.', NOT_FOUND:'Запись не найдена или недоступна.', VALIDATION:'Проверьте заполнение полей.',
 ORGANIZATION_ARCHIVED:'Организация архивирована. Изменения запрещены.', INVALID_INVITATION:'Приглашение недействительно или истекло.',
};
export function errorText(e:unknown){
 if(!(e instanceof HttpError))return e instanceof Error?e.message:'Не удалось выполнить запрос.';
 const details=Array.isArray(e.details)?e.details.map(d=>`${d.path?.join('.')}: ${d.message}`).join('; '):'';
 return `${messages[e.code]||e.message}${details?' '+details:''}${e.requestId?' · Код обращения: '+e.requestId:''}`;
}
export class ApiClient {
 private csrf=''; private identity='anonymous';
 constructor(public base=(import.meta.env.VITE_API_BASE_URL||'/api/v1').replace(/\/$/,'')){}
 clear(){this.csrf='';this.identity='anonymous'}
 async request<T=Row>(path:string,options:{method?:string;body?:unknown;signal?:AbortSignal;version?:number|string;key?:string;public?:boolean}={}):Promise<T>{
  const method=options.method||'GET';const controller=new AbortController();
  const abort=()=>controller.abort();options.signal?.addEventListener('abort',abort,{once:true});if(options.signal?.aborted)abort();
  const timeout=setTimeout(abort,30000);
  try{
   const response=await fetch(this.base+path,{method,credentials:'include',signal:controller.signal,headers:{Accept:'application/json',
    ...(options.body!==undefined?{'Content-Type':'application/json'}:{}),
    ...(method!=='GET'&&this.csrf?{'X-CSRF-Token':this.csrf}:{}),
    ...(options.version!==undefined?{'If-Match':JSON.stringify(String(options.version))}:{}),
    ...(options.key?{'Idempotency-Key':options.key}:{})},body:options.body===undefined?undefined:JSON.stringify(options.body)});
   const envelope=await response.json().catch(()=>null);
   if(!response.ok){
    if(response.status===401&&!options.public){this.clear();window.dispatchEvent(new Event('crm:unauthorized'))}
    throw new HttpError(envelope?.error?.message||`Ошибка сервера (${response.status})`,response.status,envelope?.error?.code||'HTTP_ERROR',envelope?.requestId,envelope?.error?.details);
   }
   if(!envelope||!('data' in envelope))throw new HttpError('Сервер вернул неожиданный ответ.',502,'INVALID_RESPONSE');
   return envelope.data as T;
  }catch(e){
   if(e instanceof HttpError)throw e;
   if(options.signal?.aborted)throw e;
   throw new HttpError(method==='GET'?'Нет ответа сервера. Повторите загрузку.':'Ответ не получен. Операция могла выполниться. Проверьте историю; повтор финансовой операции будет отправлен с тем же ключом.',0,'NETWORK');
  }finally{clearTimeout(timeout);options.signal?.removeEventListener('abort',abort)}
 }
 async me(signal?:AbortSignal){const s=await this.request<Session>('/auth/me',{signal});this.csrf=s.csrfToken;this.identity=s.id;return s}
 async authenticate(kind:'login'|'register'|'invitations/accept',body:unknown,signal?:AbortSignal){
  this.clear();const pre=await this.request<{csrfToken:string}>('/auth/csrf',{signal,public:true});this.csrf=pre.csrfToken;
  const s=await this.request<Session>('/auth/'+kind,{method:'POST',body,signal,public:true});this.csrf=s.csrfToken;this.identity=s.id;return s;
 }
 async write(path:string,method:string,body:unknown,options:{version?:number|string;idempotent?:boolean;signal?:AbortSignal}={}){
  // Store only a digest and a random key, never form contents or credentials.
  let storageKey:string|undefined;let key:string|undefined;
  if(options.idempotent){
   const hash=await crypto.subtle.digest('SHA-256',new TextEncoder().encode(JSON.stringify([this.identity,method,path,body,options.version])));
   storageKey='crm.pending.'+Array.from(new Uint8Array(hash),v=>v.toString(16).padStart(2,'0')).join('');
   key=sessionStorage.getItem(storageKey)||crypto.randomUUID();sessionStorage.setItem(storageKey,key);
  }
  const result=await this.request(path,{method,body,...options,key});
  if(storageKey)sessionStorage.removeItem(storageKey);
  return result;
 }
 async logout(){await this.request('/auth/logout',{method:'POST',body:{}});this.clear()}
}
export const api=new ApiClient();
