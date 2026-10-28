// Real browser + built frontend + production JS backend. Never run against a production database.
import assert from 'node:assert/strict';
import {spawn,execFileSync} from 'node:child_process';
import {createServer as httpsServer} from 'node:https';
import {request as httpRequest,createServer as httpServer} from 'node:http';
import {mkdtemp,readFile,writeFile,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {createRequire} from 'node:module';
import {once} from 'node:events';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'../..');
if(!process.env.DB_NAME?.endsWith('_test'))throw new Error('Dedicated _test MySQL database required');
const {chromium}=await import(process.env.PLAYWRIGHT_MODULE||'playwright');
const require=createRequire(path.join(root,'backend/package.json'));const ExcelJS=require('exceljs');
const temp=await mkdtemp(path.join(tmpdir(),'crm-browser-'));
execFileSync('openssl',['req','-x509','-newkey','rsa:2048','-nodes','-days','1','-keyout',temp+'/key.pem','-out',temp+'/cert.pem','-subj','/CN=localhost','-addext','subjectAltName=DNS:localhost,IP:127.0.0.1'],{stdio:'ignore'});
const probe=httpServer().listen(0,'127.0.0.1');await once(probe,'listening');const port=probe.address().port;await new Promise(r=>probe.close(r));
const web=httpsServer({key:await readFile(temp+'/key.pem'),cert:await readFile(temp+'/cert.pem')},async(req,res)=>{
 if(req.url.startsWith('/api/')||req.url.startsWith('/health/')){
  const proxy=httpRequest({hostname:'127.0.0.1',port,path:req.url,method:req.method,headers:{...req.headers,'x-forwarded-for':req.socket.remoteAddress,'x-forwarded-proto':'https'}},up=>{res.writeHead(up.statusCode,up.headers);up.pipe(res)});proxy.on('error',()=>{res.writeHead(502);res.end()});req.pipe(proxy);return;
 }
 try{const pathname=decodeURIComponent(new URL(req.url,'https://localhost').pathname);const candidate=path.resolve(root,'frontend/dist','.'+pathname);if(!candidate.startsWith(root+'/frontend/dist/'))throw Error('fallback');
  const bytes=await readFile(candidate);res.setHeader('Content-Type',candidate.endsWith('.js')?'application/javascript':candidate.endsWith('.css')?'text/css':candidate.endsWith('.png')?'image/png':'text/html');res.end(bytes);
 }catch{res.setHeader('Content-Type','text/html');res.end(await readFile(root+'/frontend/dist/index.html'))}
}).listen(0,'127.0.0.1');await once(web,'listening');const webPort=web.address().port;const origin=`https://127.0.0.1:${webPort}`;
let nginx,nginxExit;
if(process.env.NGINX_BINARY){
 await new Promise(r=>web.close(r));
 const upstream=(await readFile(root+'/deploy/frontend-upstream.conf','utf8')).replace('backend:3000','127.0.0.1:'+port);await writeFile(temp+'/upstream.conf',upstream);
 const site=(await readFile(root+'/deploy/frontend-production.conf','utf8')).replace(/server \{\s*listen 80;[\s\S]*?\n\}/,'').replace('listen 443 ssl;','listen '+webPort+' ssl;').replaceAll('/etc/crm-tls/fullchain.pem',temp+'/cert.pem').replaceAll('/etc/crm-tls/privkey.pem',temp+'/key.pem').replaceAll('/usr/share/nginx/html',root+'/frontend/dist').replaceAll('/etc/nginx/crm-upstream.conf',temp+'/upstream.conf');
 const mime=process.env.NGINX_MIME_TYPES||'/etc/nginx/mime.types';
 await writeFile(temp+'/nginx.conf',`user ${process.env.USER||'root'}; pid ${temp}/nginx.pid; error_log ${temp}/nginx-error.log; events { worker_connections 1024; } http { include ${mime}; access_log off; client_body_temp_path ${temp}/body; proxy_temp_path ${temp}/proxy; fastcgi_temp_path ${temp}/fastcgi; uwsgi_temp_path ${temp}/uwsgi; scgi_temp_path ${temp}/scgi; ${site} }`);
 execFileSync(process.env.NGINX_BINARY,['-t','-p',temp,'-c',temp+'/nginx.conf'],{stdio:'pipe'});
 nginx=spawn(process.env.NGINX_BINARY,['-p',temp,'-c',temp+'/nginx.conf','-g','daemon off;'],{stdio:'ignore'});nginxExit=once(nginx,'exit');
 console.log('NGINX production TLS/proxy configuration enabled');
}
const backend=spawn(process.execPath,['dist/server.js'],{cwd:root+'/backend',env:{...process.env,NODE_ENV:'production',HOST:'127.0.0.1',PORT:String(port),APP_ORIGIN:origin,COOKIE_SECURE:'true',TRUST_PROXY:'1',SESSION_SECRET:'browser-test-only-secret-32-characters'},stdio:['ignore','pipe','pipe']});
let serverOutput='';backend.stdout.on('data',x=>serverOutput+=x);backend.stderr.on('data',x=>serverOutput+=x);const exited=once(backend,'exit');
let browser;let page;
const unique=Date.now().toString(36),password='Browser-test-password-123!';
try{
 for(let i=0;i<100;i++){try{if((await fetch(`http://127.0.0.1:${port}/health/ready`)).ok)break}catch{}if(i===99)throw Error(serverOutput);await new Promise(r=>setTimeout(r,100))}
 browser=await chromium.launch({headless:true,args:['--no-sandbox'],...(process.env.CHROMIUM_EXECUTABLE?{executablePath:process.env.CHROMIUM_EXECUTABLE}:{})});
 const context=await browser.newContext({ignoreHTTPSErrors:true,viewport:{width:1440,height:1000}});page=await context.newPage();page.setDefaultTimeout(15000);
 const pageErrors=[];page.on('pageerror',e=>pageErrors.push(e.message));
 const publicApiCalls=[];const onPublicRequest=r=>{if(r.url().includes('/api/'))publicApiCalls.push(r.url())};page.on('request',onPublicRequest);
 for(const route of ['/','/price','/tarid-details/basic','/Feedback','/faq']){await page.goto(origin+route);await page.getByRole('heading',{level:1}).first().waitFor()}page.off('request',onPublicRequest);assert.deepEqual(publicApiCalls,[]);console.log('PASS public pages without obsolete API calls');
 async function go(section,id){await page.goto(origin+'/dashboard/'+section+(id?'/'+id:''));await page.getByRole('heading',{level:1}).waitFor();if(section!=='imports')await page.getByRole('button',{name:'Обновить',exact:true}).waitFor();await page.waitForFunction(()=>!document.querySelector('.v1-main [role="status"]')?.textContent?.includes('Загрузка'));}
 async function relation(dialog,name,value){await dialog.getByLabel(name,{exact:true}).selectOption(value)}
 async function save(dialog,route,method='POST'){
  const invalid=await dialog.locator('input,select,textarea').evaluateAll(xs=>xs.filter(x=>!x.checkValidity()).map(x=>({field:x.id||x.getAttribute('aria-label'),message:x.validationMessage})));assert.deepEqual(invalid,[],'Invalid form: '+JSON.stringify(invalid));
  const wait=page.waitForResponse(r=>new URL(r.url()).pathname==='/api/v1'+route&&r.request().method()===method);
  await dialog.getByRole('button',{name:'Сохранить',exact:true}).click();const response=await wait;const body=await response.json();assert.equal(response.status(),200,JSON.stringify(body));await dialog.waitFor({state:'hidden'});return body.data;
 }
 async function create(section,fill){await go(section);await page.getByRole('button',{name:'Добавить',exact:true}).click();const d=page.getByRole('dialog');await fill(d);return save(d,'/'+section)}
 async function person(name){return create('people',async d=>{await relation(d,'Филиал',branch.id);await d.getByLabel('Название / ФИО *',{exact:true}).fill(name)})}
 async function request(route){return page.evaluate(async p=>{const r=await fetch('/api/v1'+p,{credentials:'include'});return {status:r.status,...await r.json()}},route)}
 await page.goto(origin+'/registration');
 for(const [field,value]of Object.entries({companyName:'Browser School '+unique,fullName:'Director',login:'owner-'+unique,email:'owner-'+unique+'@example.com',password}))await page.locator(`[name="${field}"]`).fill(value);
 await page.getByRole('button',{name:'Создать организацию',exact:true}).click();const slug=await page.getByTestId('company-slug').textContent();assert.match(slug,/^company-/);await page.getByRole('button',{name:'Перейти в CRM'}).click();await page.getByRole('heading',{name:'Обзор',exact:true}).waitFor();
 const cookies=await context.cookies();assert.ok(cookies.some(c=>c.name==='crm_session'&&c.secure&&c.httpOnly));console.log('PASS registration, session, HTTPS Secure/HttpOnly cookies');
 const branch=await create('branches',async d=>{await d.getByLabel('Название / ФИО *',{exact:true}).fill('Second branch');await d.getByLabel('Адрес').fill('Test street')});
 const room=await create('rooms',async d=>{await relation(d,'Филиал',branch.id);await d.getByLabel('Название / ФИО *',{exact:true}).fill('Room A');await d.getByLabel('Вместимость').fill('10')});
 const teacherPerson=await person('Teacher '+unique);const managerPerson=await person('Manager '+unique);
 const teacher=await create('staff',async d=>{await relation(d,'Человек',teacherPerson.id);await d.getByLabel('Предмет').fill('English');await d.getByLabel('Ставка за занятие, ₽').fill('20')});
 async function user(personId,role,login){return create('users',async d=>{await relation(d,'Человек',personId);await d.getByLabel('Логин *',{exact:true}).fill(login);await d.getByLabel('Пароль *',{exact:true}).fill(password);await d.getByLabel(({teacher:'Преподаватель',manager:'Менеджер',payer:'Плательщик',student:'Ученик'})[role],{exact:true}).check();await d.getByRole('button',{name:'Добавить: доступные филиалы'}).click();await relation(d,'Доступные филиалы',branch.id)})}
 await user(managerPerson.id,'manager','manager-'+unique);await user(teacherPerson.id,'teacher','teacher-'+unique);
 const parent=await person('Parent '+unique),child=await person('Student '+unique);
 const lead=await create('leads',async d=>{await relation(d,'Человек',parent.id);await d.getByLabel('Источник').fill('Website')});await go('leads',lead.id);await page.getByRole('button',{name:'Конвертировать',exact:true}).click();let d=page.getByRole('dialog');await relation(d,'Человек — ученик',child.id);const converted=await save(d,'/leads/'+lead.id+'/convert');
 console.log('PASS branches, rooms, staff/users, people, lead conversion',JSON.stringify(converted));
 const studentId=converted.studentId,payerId=converted.payerId;assert.ok(studentId&&payerId);
 const group=await create('groups',async d=>{await relation(d,'Филиал',branch.id);await relation(d,'Преподаватель',teacher.id);await d.getByLabel('Название / ФИО *',{exact:true}).fill('English group');await d.getByLabel('Предмет').fill('English');await d.getByLabel('Вместимость *',{exact:true}).fill('10')});
 const now=new Date(Date.now()-3*86400000);now.setHours(9,0,0,0);const lessonStart=new Date(now.getTime()+86400000);const lessonEnd=new Date(lessonStart.getTime()+3600000);const local=x=>new Date(x.getTime()-x.getTimezoneOffset()*60000).toISOString().slice(0,16);
 await create('enrollments',async d=>{await relation(d,'Группа',group.id);await relation(d,'Ученик',studentId);await d.getByLabel('Начало *',{exact:true}).fill(local(now))});
 const template=await create('subscription-templates',async d=>{await relation(d,'Филиал',branch.id);await d.getByLabel('Название / ФИО *',{exact:true}).fill('Ten lessons');await d.getByLabel('Предмет *',{exact:true}).fill('English');await relation(d,'Группа',group.id);await d.getByLabel('Количество занятий *',{exact:true}).fill('10');await d.getByLabel('Срок, дней *',{exact:true}).fill('30');await d.getByLabel('Стоимость, ₽ *',{exact:true}).fill('1000')});
 const subscription=await create('subscriptions',async d=>{await relation(d,'Ученик',studentId);await relation(d,'Шаблон абонемента',template.id);await d.getByLabel('Начало *',{exact:true}).fill(local(now))});
 const lesson=await create('lessons',async d=>{await relation(d,'Филиал',branch.id);await d.getByLabel('Название / ФИО *',{exact:true}).fill('English lesson');await d.getByLabel('Предмет',{exact:true}).fill('English');await relation(d,'Преподаватель',teacher.id);await relation(d,'Аудитория',room.id);await relation(d,'Группа',group.id);await d.getByLabel('Начало *',{exact:true}).fill(local(lessonStart));await d.getByLabel('Окончание *',{exact:true}).fill(local(lessonEnd));await d.getByLabel('Базовая стоимость, ₽',{exact:true}).fill('100');await d.getByLabel('Начисление преподавателю, ₽',{exact:true}).fill('20');await d.getByRole('button',{name:'Добавить: участники занятия'}).click();await relation(d,'Ученик',studentId);await relation(d,'Плательщик',payerId);await d.getByLabel('Фиксированная скидка, ₽',{exact:true}).fill('10');await relation(d,'Абонемент',subscription.id)});
 const cash=await create('accounts',async d=>{await relation(d,'Филиал',branch.id);await d.getByLabel('Название / ФИО *',{exact:true}).fill('Cash A')});
 await page.getByRole('button',{name:'Оплата',exact:true}).click();d=page.getByRole('dialog');await relation(d,'Касса / счёт',cash.id);await relation(d,'Плательщик',payerId);await d.getByLabel('Сумма, ₽ *',{exact:true}).fill('500');await d.getByLabel('Причина / назначение *',{exact:true}).fill('Advance');const payment=await save(d,'/transactions');
 await go('lessons',lesson.id);await page.getByRole('button',{name:'Провести занятие',exact:true}).click();d=page.getByRole('dialog');await d.getByLabel('Статус *',{exact:true}).selectOption('present');await d.getByLabel('Причина / назначение *',{exact:true}).fill('Lesson delivered');await save(d,'/lessons/'+lesson.id+'/complete');
 assert.equal((await request('/accounts/'+payerId+'/balance')).data.balance,'41000');assert.equal((await request('/accounts/'+cash.id+'/balance')).data.balance,'50000');assert.equal((await request('/accounts/'+teacher.id+'/balance')).data.balance,'2000');assert.equal((await request('/subscriptions/'+subscription.id+'/usage')).data.items.reduce((n,x)=>n+Number(x.delta),0),1);
 console.log('PASS enrollment, subscription, lesson, payment, completion and exact balances');
 await go('lessons',lesson.id);await page.getByRole('button',{name:'Исправить проведение',exact:true}).click();d=page.getByRole('dialog');await d.getByLabel('Статус *',{exact:true}).selectOption('excused');await d.getByLabel('Причина / назначение *',{exact:true}).fill('Valid absence correction');await save(d,'/lessons/'+lesson.id+'/complete');assert.equal((await request('/accounts/'+payerId+'/balance')).data.balance,'50000');assert.equal((await request('/subscriptions/'+subscription.id+'/usage')).data.items.reduce((n,x)=>n+Number(x.delta),0),0);
 await go('accounts');await page.getByRole('button',{name:'Возврат',exact:true}).click();d=page.getByRole('dialog');await relation(d,'Касса / счёт',cash.id);await relation(d,'Плательщик',payerId);await relation(d,'Исходная оплата',payment.operationId);await d.getByLabel('Сумма, ₽ *',{exact:true}).fill('50');await d.getByLabel('Причина / назначение *',{exact:true}).fill('Partial refund');await save(d,'/transactions');assert.equal((await request('/accounts/'+payerId+'/balance')).data.balance,'45000');console.log('PASS correction, compensation and linked partial refund');
 // Lose a successful server response and repeat the same financial operation from the UI.
 await go('accounts');await page.getByRole('button',{name:'Прочий доход',exact:true}).click();d=page.getByRole('dialog');await relation(d,'Касса / счёт',cash.id);await d.getByLabel('Сумма, ₽ *',{exact:true}).fill('1');await d.getByLabel('Причина / назначение *',{exact:true}).fill('Lost-response regression');
 let lostKey;await page.route('**/api/v1/transactions',async route=>{lostKey=route.request().headers()['idempotency-key'];const r=await route.fetch();assert.equal(r.status(),200);await route.abort('failed')},{times:1});
 await d.getByRole('button',{name:'Сохранить',exact:true}).click();await d.getByRole('alert').waitFor();const retryRequest=page.waitForRequest(r=>r.url().endsWith('/api/v1/transactions')&&r.method()==='POST');await save(d,'/transactions');assert.equal((await retryRequest).headers()['idempotency-key'],lostKey);assert.equal((await request('/accounts/'+cash.id+'/balance')).data.balance,'45100');console.log('PASS lost payment response: same key, one posting');
 const workbook=new ExcelJS.Workbook();const sheet=workbook.addWorksheet('People');sheet.addRow(['name','email']);sheet.addRow(['Imported '+unique,'import-'+unique+'@example.com']);const filename=temp+'/people.xlsx';await workbook.xlsx.writeFile(filename);
 await go('imports');await relation(page,'Филиал',branch.id);await page.locator('input[type=file]').setInputFiles(filename);await page.getByRole('button',{name:'Проверить файл'}).click();await page.getByRole('heading',{name:/Предпросмотр/}).waitFor();await page.getByRole('button',{name:'Подтвердить импорт'}).click();await page.getByText('Импорт выполнен.',{exact:false}).waitFor();console.log('PASS XLSX preview and confirmation');
 await user(parent.id,'payer','payer-'+unique);await user(child.id,'student','student-'+unique);
 // Every navigable director screen loads without a server error or JavaScript exception.
 for(const section of ['analytics','people','payers','students','leads','groups','enrollments','payer-students','lessons','subscriptions','subscription-templates','accounts','ledger','reports','staff','users','tasks','companies','branches','rooms','dictionaries','organization','announcements','notifications','profile','license']){await go(section);assert.equal(await page.locator('.v1-main [role=alert]').count(),0,'screen '+section+': '+await page.locator('.v1-main').innerText())}
 console.log('PASS all director navigation screens');
 await go('people',parent.id);await page.getByRole('button',{name:'Редактировать',exact:true}).click();d=page.getByRole('dialog');await d.getByRole('button',{name:'Добавить: контакты'}).click();await d.getByLabel('Вид *',{exact:true}).selectOption('phone');await d.getByLabel('Значение *',{exact:true}).fill('+79990001234');await save(d,'/people/'+parent.id,'PATCH');assert.ok((await request('/people/'+parent.id+'/contacts')).data.some(x=>x.kind==='phone'&&x.value==='+79990001234'));console.log('PASS versioned person edit and contacts');

 if(process.env.QA_SCREENSHOT){await go('lessons');await page.screenshot({path:process.env.QA_SCREENSHOT,fullPage:true});await page.setViewportSize({width:390,height:844});await page.screenshot({path:process.env.QA_SCREENSHOT.replace('.png','-mobile.png'),fullPage:true});assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=window.innerWidth),'mobile page overflow');await page.setViewportSize({width:1440,height:1000});}
 await page.getByRole('button',{name:'Выйти',exact:true}).click();await page.waitForURL('**/authorization');assert.equal((await context.cookies()).some(c=>c.name==='crm_session'),false);
 for(const role of ['manager','teacher','payer','student']){
  await page.goto(origin+'/authorization');await page.locator('[name=companySlug]').fill(slug);await page.locator('[name=login]').fill(role+'-'+unique);await page.locator('[name=password]').fill(password);await page.getByRole('button',{name:'Войти',exact:true}).click();await page.waitForURL(role==='manager'?'**/dashboard/analytics':'**/dashboard/lessons');
  await go('students');assert.equal(await page.locator('.v1-main [role=alert]').count(),0);await go('groups');assert.equal(await page.locator('.v1-main [role=alert]').count(),0);await go('subscriptions');assert.equal(await page.locator('.v1-main [role=alert]').count(),0);
  assert.equal((await request('/users')).status,403);assert.equal((await request('/reports/finance?from='+now.toISOString()+'&to='+lessonEnd.toISOString())).status,403);
  await page.goto(origin+'/dashboard/users');await page.getByRole('heading',{name:'Раздел недоступен'}).waitFor();
  if(role==='payer'){await go('accounts',payerId);await page.getByRole('button',{name:'Баланс',exact:true}).click();await page.getByText('450.00 ₽',{exact:true}).waitFor()}
  if(role==='student')assert.equal((await request('/accounts/'+payerId+'/history')).status,403);
  await page.getByRole('button',{name:'Выйти',exact:true}).click();await page.waitForURL('**/authorization');
 }
 assert.deepEqual(pageErrors,[]);console.log('PASS manager/teacher/payer/student role boundaries, logout, zero browser exceptions');
 console.log('PASS browser end-to-end complete');
}catch(error){if(page)console.error('PAGE',await page.locator('body').innerText().catch(()=>''));console.error(serverOutput.slice(-5000));throw error}
finally{if(browser)await browser.close();backend.kill('SIGTERM');await exited;if(nginx){nginx.kill('SIGTERM');await nginxExit}else await new Promise(r=>web.close(r));await rm(temp,{recursive:true,force:true})}
