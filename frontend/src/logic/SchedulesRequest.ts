import { Lesson, LessonModalData, LessonClosePayload } from '@/interfaces/scheduleInterfaces.ts';

export const scheduleQuery = {
  getLessons: async (start: string, end: string): Promise<Lesson[]> => {
    const response = await fetch(`/lessons?start=${start}&end=${end}`);
    if (!response.ok) throw new Error('Failed to fetch lessons');
    return response.json();
  },

  getLessonDetails: async (lessonId: number): Promise<LessonModalData> => {
    const response = await fetch(`/lessons/${lessonId}/details`);
    if (!response.ok) throw new Error('Failed to fetch lesson details');
    return response.json();
  },

  closeLesson: async (payload: LessonClosePayload): Promise<void> => {
    const response = await fetch(`/lessons/close`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (!response.ok) throw new Error('Failed to close lesson');
  }
};
