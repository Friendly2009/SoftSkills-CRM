import { Lesson, LessonModalData, User, Client, AttendanceRecord, LessonClosePayload } from '@/interfaces/scheduleInterfaces.ts';

export const getLessons = async (start: string, end: string): Promise<Lesson[]> => {
  const response = await fetch(`/lessons?start=${start}&end=${end}`);
  if (!response.ok) throw new Error('Failed to fetch lessons');
  return response.json();
};

export const getLessonMainInfo = async (lessonId: number): Promise<Pick<LessonModalData, 'lesson' | 'group' | 'teacher'>> => {
  const response = await fetch(`/lessons/${lessonId}/main-info`);
  if (!response.ok) throw new Error('Failed to fetch lesson main info');
  return response.json();
};

export const getLessonStudentsAndAttendance = async (lessonId: number): Promise<{ students: Client[]; attendance: AttendanceRecord[] }> => {
  const response = await fetch(`/lessons/${lessonId}/students-attendance`);
  if (!response.ok) throw new Error('Failed to fetch students and attendance');
  return response.json();
};

export const getAllAvailableTeachers = async (): Promise<User[]> => {
  const response = await fetch(`/teachers/available`);
  if (!response.ok) throw new Error('Failed to fetch available teachers');
  return response.json();
};

export const closeLesson = async (payload: LessonClosePayload): Promise<void> => {
  const response = await fetch(`/lessons/close`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!response.ok) throw new Error('Failed to close lesson');
};