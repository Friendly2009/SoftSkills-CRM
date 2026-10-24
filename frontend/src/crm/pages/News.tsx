import { useState } from 'react';
import { Button, Modal, Empty } from '../components/ui';
import { useCrm } from '../mocks/store/CrmProvider';
export function News() {
  const { db, isMock } = useCrm();
  const [open, setOpen] = useState('');
  const items = db.dictionaries.news || (isMock ? [{ id: 'demo', name: 'Новый учебный сезон', description: 'Проверьте состав групп и расписание занятий перед началом нового периода. Это демонстрационное объявление.' }] : []);
  const item = items.find(i => i.id === open);
  return <>
    <div className="crm-page-heading"><h1>Информер</h1></div>
    {!items.length && <Empty text="Объявлений пока нет" />}
    {items.map(n => <section key={n.id} className="crm-panel p-6 max-w-4xl">
      <h2 className="text-lg my-3">{n.name}</h2>
      <p className="text-slate-500 leading-6 mb-4">{n.description}</p>
      <Button onClick={() => setOpen(n.id)}>Подробнее</Button>
    </section>)}
    {item && <Modal title={item.name} onClose={() => setOpen('')}><p>{item.description}</p></Modal>}
  </>;
}
