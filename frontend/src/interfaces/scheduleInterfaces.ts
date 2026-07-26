export enum LessonStatus {
  Planned = 1,
  Completed = 2
}

export enum AttendanceStatus {
  Present = 1,
  Excused = 2,
  Absent = 3
}

export interface User {
  id: number;
  company_id: number;
  full_name: string;
  role: string;
}

export interface Client {
  id: number;
  name: string;
  balance: number;
}

export interface Group {
  id: number;
  name: string;
}

export interface Lesson {
  id: number;
  lesson_date: string;
  start_time: string;
  end_time: string;
  status: LessonStatus;
  group_id: number;
  user_id: number;
  teacher_pay: number;
}

export interface AttendanceRecord {
  client_id: number;
  attendance_status: AttendanceStatus;
  amount_charged: number;
}

export interface LessonModalData {
  lesson: Lesson;
  group: Group;
  teacher: User;
  students: Client[];
  allTeachers: User[];
  attendance?: AttendanceRecord[];
}

export interface LessonClosePayload {
  lesson_id: number;
  user_id: number;
  teacher_pay: number;
  attendance: AttendanceRecord[];
}
