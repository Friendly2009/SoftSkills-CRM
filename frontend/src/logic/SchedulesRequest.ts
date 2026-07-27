import { Lesson, LessonModalData, User, Client, AttendanceRecord, LessonClosePayload } from '@/interfaces/scheduleInterfaces.ts';

const formatDateToISOString = (date: Date): string => {
  return date.toISOString().split('T')[0];
};

export const getLessons = async (start: Date, end: Date): Promise<Lesson[]> => {
  const startStr = formatDateToISOString(start);
  const endStr = formatDateToISOString(end);

  const response = await fetch(`/lessons?start=${startStr}&end=${endStr}`);
  if (!response.ok) throw new Error('Failed to fetch lessons');
  
  const rawLessons: any[] = await response.json();
  
  return rawLessons.map((lesson) => ({
    ...lesson,
    lesson_date: lesson.lesson_date ? new Date(lesson.lesson_date) : null
  }));
};

export const getLessonMainInfo = async (lessonId: number): Promise<Pick<LessonModalData, 'lesson' | 'group' | 'teacher'>> => {
  const response = await fetch(`/lessons/${lessonId}/main-info`);
  if (!response.ok) throw new Error('Failed to fetch lesson main info');
  
  const data = await response.json();

  if (data.lesson && data.lesson.lesson_date) {
    data.lesson.lesson_date = new Date(data.lesson.lesson_date);
  }

  return data;
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
