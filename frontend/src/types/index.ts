// Типы данных для CRM образовательного учреждения

export interface Student {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  avatar?: string;
  group: string;
  status: "active" | "inactive" | "graduated";
  enrollmentDate: string;
  paymentStatus: "paid" | "pending" | "overdue";
  balance: number;
}

export interface Teacher {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  avatar?: string;
  subjects: string[];
  groups: string[];
  status: "active" | "inactive";
  salary: number;
}

export interface Group {
  id: string;
  name: string;
  course: string;
  teacher: string;
  studentsCount: number;
  maxStudents: number;
  startDate: string;
  endDate: string;
  schedule: string;
  status: "active" | "completed" | "upcoming";
  room: string;
}

export interface Lesson {
  id: string;
  subject: string;
  teacher: string;
  group: string;
  room: string;
  dayOfWeek: number;
  startTime: string;
  endTime: string;
}

export interface Grade {
  id: string;
  studentId: string;
  studentName: string;
  subject: string;
  value: number;
  date: string;
  teacher: string;
  comment?: string;
}

export interface Payment {
  id: string;
  studentId: string;
  studentName: string;
  amount: number;
  date: string;
  status: "completed" | "pending" | "failed";
  method: "cash" | "card" | "transfer";
  description: string;
}

export interface DashboardStats {
  totalStudents: number;
  totalTeachers: number;
  totalGroups: number;
  monthlyRevenue: number;
  activeCourses: number;
  pendingPayments: number;
}

export type Page =
  | "index"
  | "dashboard"
  | "students"
  | "teachers"
  | "groups"
  | "schedule"
  | "grades"
  | "finance"
  | "settings"
  | "registration"
  | "authorization";
