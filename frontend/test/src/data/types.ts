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
