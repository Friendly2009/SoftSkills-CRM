import { Group } from "./types";
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