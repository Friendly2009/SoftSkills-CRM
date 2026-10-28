import {Link} from 'react-router-dom';
import './real.css';
export function PublicInfo({page}:{page:'price'|'reviews'|'faq'}){
 const title=page==='price'?'Бесплатная бета':page==='reviews'?'Отзывы':'Как начать работу';
 return <main className="v1-auth v1-root"><section><Link to="/">SoftSkills CRM</Link><h1>{title}</h1>
 {page==='price'?<><p>Текущая версия CRM доступна бесплатно. Подписку оплачивать не нужно.</p><p>Оплаты и возвраты в CRM служат для учёта уже полученных денег. Приём платежей банковскими картами или по QR-коду не подключён.</p></>:page==='reviews'?<p>Публикация отзывов в этой версии пока недоступна.</p>:<><p>Создайте организацию, сохраните её код и пригласите сотрудников. Создайте людей, назначьте им роли плательщиков и учеников, затем добавьте группы и занятия.</p><p>Для переноса базы используйте «Импорт из Excel» внутри CRM. Перед загрузкой записей система покажет предпросмотр.</p></>}
 <nav><Link to="/registration">Создать организацию</Link><Link to="/authorization">Войти</Link><Link to="/support">Поддержка</Link></nav></section></main>;
}
