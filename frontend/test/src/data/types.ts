export interface CompanyForAuth {
  id: number;
  name: string;
  email: string;
  company: string;
  group: string;
  grades: number[];
}

export interface User {
    id: number;
    company_id: number;
    full_name: string;
    email: string;
    role: string;
    rank: number;
    contact: string;
    birthday: string;
    gender: string;
    password: string;
}

export interface Lesson {
  id: number;
  subject: string;
  teacher: string;
  time: string;
  room: string;
}

export interface Group {
  id: number;
  name: string;          // Название группы (например: Frontend Senior-1)
  teacher: string;       // Фио преподавателя
  schedule: string;      // Компактная строка расписания (Вт 15:00, Пт 18:00)
  studentsCount: number; // Текущее количество учеников в группе
  maxStudents: number;   // Максимальная вместимость группы
  nextMeeting: string;   // Дата и время следующего урока для вывода на экран
  status: 'active' | 'forming' | 'archived'; // Статусы для цветных бейджей
}