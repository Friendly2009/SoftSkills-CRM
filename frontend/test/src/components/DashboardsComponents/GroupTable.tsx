import React, { useEffect, useState } from "react";
import style from '../cssmoduls/DashboardComponentsCssModuls/groups.module.css'
interface GroupTableProps {
    setPlusAction: React.Dispatch<React.SetStateAction<(() => void) | null>>;
    setDelAction: React.Dispatch<React.SetStateAction<{ isActive: boolean; handler: () => void } | null>>;
}
export interface Group {
  id: number;
  name: string;
  teacher: string;
  schedule: string;
  studentsCount: number;
  maxStudents: number;
  nextMeeting: string;
  status: 'active' | 'forming' | 'archived';
}

// Объявление mockGroups строго ОДИН раз на весь файл
export const mockGroups: Group[] = [
  {
    id: 1,
    name: 'Frontend Senior-1',
    teacher: 'Кирилл Цыганов Евгеньевич',
    schedule: 'Вт 15:00, Пт 18:00',
    studentsCount: 8,
    maxStudents: 12,
    nextMeeting: 'Сегодня, 15:00',
    status: 'active'
  },
  {
    id: 2,
    name: 'Node.js Backend',
    teacher: 'Кирилл Цыганов Евгеньевич',
    schedule: 'Чт 19:00',
    studentsCount: 5,
    maxStudents: 10,
    nextMeeting: 'Четверг, 19:00',
    status: 'active'
  },
  {
    id: 3,
    name: 'UX/UI Design Basics',
    teacher: 'Иван Иванов Иванович',
    schedule: 'Сб 11:00',
    studentsCount: 0,
    maxStudents: 15,
    nextMeeting: 'Набор открыт',
    status: 'forming'
  },
  {
    id: 4,
    name: 'Python Web Dev',
    teacher: 'Кирилл Цыганов Евгеньевич',
    schedule: 'Пн 18:00, Ср 18:00',
    studentsCount: 12,
    maxStudents: 12,
    nextMeeting: 'Архив',
    status: 'archived'
  }
];
export const GroupsTable: React.FC<GroupTableProps> = ({ setPlusAction, setDelAction }) => {
  const getAvatarLetters = (name: string) => {
    return name.split(' ').map(word => word).join('').substring(0, 2).toUpperCase();
  };

  const getStatusLabel = (status: Group['status']) => {
    if (status === 'active') return 'Активна';
    if (status === 'forming') return 'Набор';
    return 'Архив';
  };

  return (
    <div className={style['table-container']}>
      <table className={style['crm-table']}>
        <thead>
          <tr>
            <th>Группа</th>
            <th>Расписание</th>
            <th>Ученики</th>
            <th>Следующий урок</th>
            <th>Статус</th>
            <th className={style['actions-cell']}>Действия</th>
          </tr>
        </thead>
        <tbody>
          {mockGroups.map((group) => (
            <tr key={group.id}>
              <td>
                <div className={style['group-info']}>
                  <div className={style['avatar-placeholder']}>
                    {getAvatarLetters(group.name)}
                  </div>
                  <div>
                    <div className={style['group_name']}>{group.name}</div>
                    <div style={{ color: '#64748b', fontSize: '11px', marginTop: '2px' }}>
                      {group.teacher}
                    </div>
                  </div>
                </div>
              </td>
              <td>{group.schedule}</td>
              <td style={{ fontWeight: 500 }}>
                {group.studentsCount} / {group.maxStudents}
              </td>
              <td>
                <span className={style['date']}>{group.nextMeeting}</span>
              </td>
              <td>
                <span className={`
                  ${style['badge']} 
                  ${group.status === 'active' ? style['is_active'] : style['is_not_active']}
                `}>
                  {getStatusLabel(group.status)}
                </span>
              </td>
              <td className={style['actions-cell']}>
                <button className={style['btn-action']}>•••</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};