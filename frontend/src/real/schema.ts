import contract from './contract.json';
import type {Row} from './client';
export interface Schema {type?:string|string[];properties?:Record<string,Schema>;required?:string[];items?:Schema;enum?:string[];const?:string;anyOf?:Schema[];oneOf?:Schema[];default?:unknown;format?:string;pattern?:string;minimum?:number;maximum?:number;minLength?:number;maxLength?:number;minItems?:number;maxItems?:number}
export interface Operation {body?:Schema;query:{name:string;required?:boolean;schema:Schema}[];version:boolean;idempotent:boolean}
export const operations=contract as unknown as Record<string,Operation>;
export const operation=(method:string,path:string)=>operations[method+' '+path.replace(/[0-9a-f]{8}-[0-9a-f-]{27}/gi,'{id}')];
export function unwrap(s:Schema):Schema {if(s.oneOf?.every(x=>x.type==='object')){const first=s.oneOf[0];return {...first,properties:{...first.properties,kind:{type:'string',enum:s.oneOf.map(x=>x.properties!.kind.const!),default:s.oneOf[0].properties!.kind.const}}}}const alt=s.anyOf?.find(v=>v.type!=='null');return alt?{...s,...alt,anyOf:undefined}:s}
export const moneyFields=new Set(['rate','price','salary','basePrice','discount','amount','balance','debt','payments','refunds','expenses','otherIncome','tuitionAccrued','salaryAccrued','salaryPaid','cashFlow','financialResult','transfersNet','accrued','paid','income','expense','net']);
export function rublesToKopecks(value:string){const s=value.trim().replace(',','.');if(!/^\d+(\.\d{1,2})?$/.test(s))throw new Error('Укажите сумму в рублях, не более двух знаков после запятой.');const [a,b='']=s.split('.');return (BigInt(a)*100n+BigInt(b.padEnd(2,'0'))).toString()}
export function kopecksToRubles(value:unknown){const n=BigInt(String(value??0));return `${n<0n?'-':''}${(n<0n?-n:n)/100n}.${((n<0n?-n:n)%100n).toString().padStart(2,'0')}`}
export function localDate(value:string){if(!value)return '';const d=new Date(value.includes('T')?value:value.replace(' ','T')+'Z');if(isNaN(d.getTime()))return value;return new Date(d.getTime()-d.getTimezoneOffset()*60000).toISOString().slice(0,16)}
export const snake=(s:string)=>s.replace(/[A-Z]/g,c=>'_'+c.toLowerCase());
export function initialValues(schema:Schema,row:Row={}):Row{
 schema=unwrap(schema);const result:Row={};for(const [key,raw] of Object.entries(schema.properties||{})){
  const s=unwrap(raw);let value=row[key]??row[snake(key)]??raw.default;
  if(key==='branchIds')value=row.branches??value;
  if(key==='expectedRevision')value=row.revision??value;
  if(value===undefined){if(s.const!==undefined)value=s.const;else if(s.type==='object')value=initialValues(s);else if(s.type==='array')value=[];else if(s.type==='boolean')value=false;else value=''}
  if(s.type==='object')value=initialValues(s,value||{});
  else if(s.type==='array'&&Array.isArray(value)&&s.items&&unwrap(s.items).type==='object')value=value.map(v=>initialValues(s.items!,v));
  else if(value!==null&&value!==''&&moneyFields.has(key))value=kopecksToRubles(value);
  else if(value&&s.format==='date-time')value=localDate(value);
  else if(s.type==='boolean')value=Boolean(value);
  result[key]=value??'';
 }if(schema.properties?.discountPercent&&(row.discountPercent??row.discount_percent)!=null)result.discount='';return result;
}
export function payload(schema:Schema,values:Row):Row{
 schema=unwrap(schema);const result:Row={};for(const [key,raw] of Object.entries(schema.properties||{})){
  if(key==='person'&&!values.person?.name)continue;
  const s=unwrap(raw);let v=values[key];const required=schema.required?.includes(key);
  if(s.const!==undefined){result[key]=s.const;continue}
  if(v===''||v===undefined||v===null){
   if(raw.anyOf?.some(x=>x.type==='null'))result[key]=null;
   else if(required&&s.type!=='object')throw new Error(`Заполните поле «${labels[key]||key}».`);
   continue;
  }
  if(s.type==='object')v=payload(s,v);
  else if(s.type==='array')v=v.map((x:unknown)=>unwrap(s.items||{}).type==='object'?payload(s.items!,x as Row):x);
  else if(moneyFields.has(key))v=rublesToKopecks(String(v));
  else if(s.type==='integer'||s.type==='number'){v=Number(v);if(!Number.isFinite(v))throw new Error('Некорректное число')}
  else if(s.format==='date-time')v=new Date(v).toISOString();
  result[key]=v;
 }return result;
}
export const labels:Record<string,string>={
 income:'Поступления',expense:'Расходы',net:'Разница поступлений и расходов',from:'С',to:'До',count:'Количество',activeStudents:'Активные ученики',sales:'Продажи',finance:'Финансы',delta:'Изменение остатка',before_data:'До изменения',after_data:'После изменения',name:'Название / ФИО',fullName:'ФИО',companyName:'Название организации',companySlug:'Код организации',login:'Логин',email:'Электронная почта',phone:'Телефон',password:'Пароль',currentPassword:'Текущий пароль',token:'Код приглашения',
 branchId:'Филиал',branchIds:'Доступные филиалы',personId:'Человек',payerId:'Плательщик',studentId:'Ученик',teacherId:'Преподаватель',staffId:'Сотрудник',groupId:'Группа',roomId:'Аудитория',templateId:'Шаблон абонемента',subscriptionId:'Абонемент',responsibleId:'Ответственный сотрудник',
 source:'Источник',comment:'Примечание',contacts:'Контакты',kind:'Вид',value:'Значение',birthday:'Дата рождения',address:'Адрес',active:'Активен',capacity:'Вместимость',subject:'Предмет',rate:'Ставка за занятие',roles:'Роли',status:'Статус',startDate:'Дата начала',endDate:'Дата окончания',
 startsAt:'Начало',endsAt:'Окончание',salary:'Начисление преподавателю',basePrice:'Базовая стоимость',price:'Стоимость',timezone:'Часовой пояс',attendees:'Участники занятия',attendance:'Посещаемость',discount:'Фиксированная скидка',discountPercent:'Скидка, сотые доли процента (1250 = 12,5%)',reason:'Причина / назначение',
 accountId:'Касса / счёт',fromAccountId:'Со счёта',toAccountId:'На счёт',originalPaymentId:'Исходная оплата',amount:'Сумма',mode:'Результат конвертации',studentPersonId:'Человек — ученик',payerPersonId:'Человек — плательщик',lessons:'Количество занятий',days:'Срок, дней',date:'Срок',priority:'Приоритет',relationship:'Связь с учеником',
 inn:'ИНН',kpp:'КПП',contact:'Контактное лицо',account:'Расчётный счёт',bank:'Банк',category:'Категория',description:'Описание',text:'Текст',settings:'Настройки',calendarStart:'Начало рабочего дня',calendarEnd:'Конец рабочего дня',weekends:'Показывать выходные',currency:'Валюта',expiresInHours:'Срок приглашения, часов',ids:'Выбранные элементы',
 balance:'Остаток',debt:'Задолженность',payments:'Полученные оплаты',refunds:'Возвраты',expenses:'Расходы',otherIncome:'Прочие поступления',tuitionAccrued:'Начислено за обучение',salaryAccrued:'Начислено преподавателям',salaryPaid:'Выплачено преподавателям',cashFlow:'Движение денег',financialResult:'Финансовый результат',transfersNet:'Переводы',accrued:'Начислено',paid:'Выплачено',
 created_at:'Создано',updated_at:'Изменено',archived_at:'Архивировано',revision:'Редакция занятия',version:'Версия',message:'Сообщение',read_at:'Прочитано',remaining:'Осталось занятий',used:'Использовано',frozen_at:'Заморожено',expires_at:'Действует до',action:'Действие',author_id:'Автор',actor_id:'Автор',resource:'Раздел',resource_id:'Запись',operation_id:'Номер операции',reason_text:'Причина',company_slug:'Код организации',person:'Человек',profile:'Профиль',
};
for(const [k,v]of Object.entries({...labels}))labels[snake(k)]=v;
export const values:Record<string,string>={director:'Директор',manager:'Менеджер',teacher:'Преподаватель',payer:'Плательщик',student:'Ученик',present:'Присутствовал',absent:'Прогул',excused:'Уважительный пропуск',scheduled:'Запланировано',completed:'Проведено',cancelled:'Отменено',payment:'Оплата',refund:'Возврат',expense:'Расход',income:'Прочий доход',salary_payment:'Выплата зарплаты',cash:'Касса',payroll:'Зарплатный счёт',lesson_charge:'Списание за занятие',salary_accrual:'Начисление зарплаты',reversal:'Компенсация',transfer:'Перевод',email:'Email',phone:'Телефон','payer-student':'Плательщик и ученик',people:'Люди',payers:'Плательщики',students:'Ученики',free_beta:'Бесплатная бета',lessons:'Занятия',sales:'Продажи',finance:'Финансы',attendance:'Посещаемость'};
