export interface Section {name:string;columns:string[];roles?:string[];write?:string[];search?:boolean;branch?:boolean;archive?:boolean;sort?:string[]}
const staff=['director','manager','teacher'],admin=['director','manager'],director=['director'];
export const sections:Record<string,Section>={
 analytics:{name:'Обзор',columns:[],roles:admin},
 people:{name:'Люди',columns:['name','birthday','active'],roles:staff,write:admin,search:true,branch:true,archive:true,sort:['name']},
 payers:{name:'Плательщики',columns:['person_id','comment'],roles:[...admin,'payer'],write:admin,search:true,branch:true,archive:true,sort:['name']},
 students:{name:'Ученики',columns:['person_id','active','payer_id'],write:admin,search:true,branch:true,archive:true,sort:['name']},
 leads:{name:'Лиды',columns:['name','status','source','responsible_id'],roles:admin,write:admin,search:true,branch:true,archive:true,sort:['name','status']},
 groups:{name:'Группы',columns:['name','subject','teacher_id','capacity','status'],write:admin,search:true,branch:true,archive:true,sort:['name','status']},
 enrollments:{name:'Зачисления',columns:['student_id','group_id','starts_at','ends_at'],write:admin,search:true,branch:true,archive:true,sort:['starts_at']},
 'payer-students':{name:'Связи плательщиков и учеников',columns:['payer_id','student_id','relationship'],write:admin,search:true,branch:true,archive:true},
 lessons:{name:'Расписание',columns:['name','starts_at','ends_at','status','group_id','teacher_id','room_id'],write:admin,search:true,branch:true,sort:['starts_at','name','status']},
 subscriptions:{name:'Абонементы учеников',columns:['student_id','starts_at','ends_at','allowance','frozen_at'],write:admin,branch:true},
 'subscription-templates':{name:'Шаблоны абонементов',columns:['name','lessons','days','price','active'],roles:admin,write:admin,search:true,branch:true,sort:['name']},
 accounts:{name:'Счета и остатки',columns:['name','kind','branch_id'],roles:[...admin,'payer'],write:director,search:true,branch:true,sort:['name']},
 ledger:{name:'Финансовые операции',columns:['created_at','account_id','kind','amount','reason','operation_id'],roles:admin},
 reports:{name:'Финансовый отчёт',columns:[],roles:director},
 staff:{name:'Сотрудники',columns:['name','subject','status','rate'],roles:staff,write:director,search:true,branch:true,archive:true,sort:['name','status']},
 users:{name:'Доступы',columns:['login','roles','branches','active'],roles:director,write:director,search:true},
 tasks:{name:'Задачи',columns:['name','date','priority','status','responsible_id'],roles:staff,write:admin,search:true,branch:true,archive:true,sort:['name','date','status']},
 companies:{name:'Юридические лица',columns:['name','inn','phone','status'],roles:admin,write:admin,search:true,branch:true,archive:true,sort:['name']},
 branches:{name:'Филиалы',columns:['name','address','active'],roles:staff,write:director,search:true,branch:true,archive:true,sort:['name']},
 rooms:{name:'Аудитории',columns:['name','branch_id','capacity'],roles:staff,write:director,search:true,branch:true,archive:true,sort:['name']},
 dictionaries:{name:'Справочники',columns:['name','category','value','active'],roles:admin,write:admin,search:true,branch:true,sort:['name']},
 organization:{name:'Организация',columns:[],roles:admin,write:director},
 announcements:{name:'Объявления',columns:['name','description','active'],roles:staff,write:admin,search:true,branch:true,sort:['name']},
 notifications:{name:'Уведомления',columns:['message','created_at','read_at']},
 imports:{name:'Импорт из Excel',columns:[],roles:admin},
 profile:{name:'Мой профиль',columns:[]},
 license:{name:'Лицензия',columns:[]},
};
export const allowed=(roles:string[],required?:string[])=>!required||required.some(r=>roles.includes(r));
export const relations:Record<string,string>={branchId:'branches',branchIds:'branches',personId:'people',studentPersonId:'people',payerPersonId:'people',payerId:'payers',studentId:'students',teacherId:'staff',staffId:'staff',groupId:'groups',roomId:'rooms',templateId:'subscription-templates',subscriptionId:'subscriptions',responsibleId:'staff',accountId:'accounts',fromAccountId:'accounts',toAccountId:'accounts'};
for(const [k,v]of Object.entries({...relations}))relations[k.replace(/[A-Z]/g,c=>'_'+c.toLowerCase())]=v;
