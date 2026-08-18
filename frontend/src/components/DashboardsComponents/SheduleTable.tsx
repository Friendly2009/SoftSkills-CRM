import React, { useEffect, useState } from 'react';
import { PhantomLesson } from '@/interfaces/ScheduleInterfaces';
import { getSchedule } from '../../logic/SchedulesRequest';
import { LessonModalWindow } from '@/components/DashboardsComponents/SchesuleComponents/LessonModalWindow.tsx';

export const ScheduleTable: React.FC = () => {
  const [lessons, setLessons] = useState<PhantomLesson[]>([]);
  const [selectedLessonId, setSelectedLessonId] = useState<string | null>(null);
  const [selectedGroupId, setSelectedGroupId] = useState<number | null>(null);
  const [currentDate, setCurrentDate] = useState<Date>(new Date());

  const getWeekDays = (start: Date): Date[] => {
    const days: Date[] = [];
    const temp = new Date(start);
    const day = temp.getDay();
    const diff = temp.getDate() - day + (day === 0 ? -6 : 1);
    temp.setDate(diff);

    for (let i = 0; i < 7; i++) {
      days.push(new Date(temp));
      temp.setDate(temp.getDate() + 1);
    }
    return days;
  };

  const weekDays = getWeekDays(currentDate);

  const dayOfWeekMapping: Record<string, number> = {
    'воскресенье': 0, 'понедельник': 1, 'вторник': 2, 'среда': 3, 'четверг': 4, 'пятница': 5, 'суббота': 6
  };

  const loadLessons = async () => {
    try {
      const formatToLocalDateStr = (d: Date) => {
        return d.toLocaleDateString('en-CA');
      };

      const weekStartDateStr = formatToLocalDateStr(weekDays[0]);
      const weekEndDateStr = formatToLocalDateStr(weekDays[6]);

      const result = await getSchedule(weekStartDateStr, weekEndDateStr);

      if (result && result.success && result.data) {
        const { templates, realLessons } = result.data;
        const generatedLessonsList: PhantomLesson[] = [];

        weekDays.forEach((dayDate) => {
          const currentDayIndex = dayDate.getDay();
          const dateStr = formatToLocalDateStr(dayDate);

          templates.forEach((template: any) => {
            const targetDayIndex = dayOfWeekMapping[template.day_of_week.toLowerCase()];

            if (targetDayIndex === currentDayIndex) {
              const realLesson = Array.isArray(realLessons) && realLessons.find((rl: any) => {
                const rlDateStr = String(rl.lesson_date).split('T')[0];
                return Number(rl.group_id) === Number(template.group_id) && rlDateStr === dateStr;
              });

              if (realLesson) {
                generatedLessonsList.push({
                  id: String(realLesson.id),
                  schedule_id: template.schedule_id,
                  lesson_date: new Date(dayDate),
                  start_time: String(realLesson.start_time).substring(0, 5),
                  end_time: String(realLesson.end_time).substring(0, 5),
                  group_name: template.group_name,
                  group_id: template.group_id,
                  user_name: template.user_name,
                  status: Number(realLesson.status)
                });
              } else {
                generatedLessonsList.push({
                  id: `temp-${template.schedule_id}-${dateStr}`,
                  schedule_id: template.schedule_id,
                  lesson_date: new Date(dayDate),
                  start_time: String(template.start_time).substring(0, 5),
                  end_time: String(template.end_time).substring(0, 5),
                  group_name: template.group_name,
                  group_id: template.group_id,
                  user_name: template.user_name,
                  status: 1
                });
              }
            }
          });
        });

        setLessons(generatedLessonsList);
      }
    } catch (error) {
      console.error("Ошибка при генерации умной сетки расписания:", error);
    }
  };

  useEffect(() => {
    loadLessons();
  }, [currentDate]);

  const changeWeek = (direction: number) => {
    const next = new Date(currentDate);
    next.setDate(next.getDate() + direction * 7);
    setCurrentDate(next);
  };

  const getLessonStyles = (lesson: PhantomLesson) => {
    if (Number(lesson.status) === 2) {
      return { backgroundColor: '#f0fdf4', borderLeft: '4px solid #10b981', color: '#166534' };
    }

    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const lessonDate = new Date(lesson.lesson_date);
    const lessonDayStart = new Date(lessonDate.getFullYear(), lessonDate.getMonth(), lessonDate.getDate());

    if (lessonDayStart <= todayStart) {
      return { backgroundColor: '#fff7ed', borderLeft: '4px solid #f97316', color: '#9a3412' };
    }

    return { backgroundColor: '#f0f9ff', borderLeft: '4px solid #3b82f6', color: '#075985' };
  };

  const timeSlots = Array.from({ length: 14 }, (_, i) => `${String(i + 8).padStart(2, '0')}:00`);

  return (
    <div style={{ padding: '24px', fontFamily: 'system-ui, sans-serif', backgroundColor: '#f8fafc', minHeight: '100vh' }}>
      <div style={{ backgroundColor: '#ffffff', padding: '24px', borderRadius: '12px', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
          <div>
            <h2 style={{ margin: 0, fontSize: '20px', fontWeight: 600, color: '#1e293b' }}>Расписание занятий</h2>
            <p style={{ margin: '4px 0 0 0', fontSize: '13px', color: '#64748b' }}>
              Неделя: {weekDays[0].toLocaleDateString('ru-RU')} — {weekDays[6].toLocaleDateString('ru-RU')}
            </p>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            {/* Кнопка Назад */}
            <button
              onClick={() => changeWeek(-1)}
              style={{
                padding: '7px 14px',
                border: '1px solid #e2e8f0',
                borderRadius: '8px',
                backgroundColor: '#ffffff',
                color: '#475569',
                fontWeight: 600,
                cursor: 'pointer',
                fontSize: '13px',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                boxShadow: '0 1px 2px rgba(0,0,0,0.02)',
                transition: 'all 0.2s ease'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = '#f1f5f9';
                e.currentTarget.style.color = '#0f172a';
                e.currentTarget.style.borderColor = '#cbd5e1';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = '#ffffff';
                e.currentTarget.style.color = '#475569';
                e.currentTarget.style.borderColor = '#e2e8f0';
              }}
            >
              <span style={{ color: '#3b82f6', fontWeight: 'bold' }}>←</span> Назад
            </button>
            <button
              onClick={() => setCurrentDate(new Date())}
              style={{
                padding: '8px 16px',
                border: 'none',
                borderRadius: '8px',
                backgroundColor: '#3b82f6',
                color: '#ffffff',
                fontWeight: 600,
                boxShadow: '0 2px 4px rgba(59, 130, 246, 0.25)',
                cursor: 'pointer',
                fontSize: '13px',
                transition: 'all 0.2s ease'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = '#2563eb';
                e.currentTarget.style.boxShadow = '0 4px 8px rgba(37, 99, 235, 0.35)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = '#3b82f6';
                e.currentTarget.style.boxShadow = '0 2px 4px rgba(59, 130, 246, 0.25)';
              }}
            >
              Текущая неделя
            </button>

            <button
              onClick={() => changeWeek(1)}
              style={{
                padding: '7px 14px',
                border: '1px solid #e2e8f0',
                borderRadius: '8px',
                backgroundColor: '#ffffff',
                color: '#475569',
                fontWeight: 600,
                cursor: 'pointer',
                fontSize: '13px',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                boxShadow: '0 1px 2px rgba(0,0,0,0.02)',
                transition: 'all 0.2s ease'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = '#f1f5f9';
                e.currentTarget.style.color = '#0f172a';
                e.currentTarget.style.borderColor = '#cbd5e1';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = '#ffffff';
                e.currentTarget.style.color = '#475569';
                e.currentTarget.style.borderColor = '#e2e8f0';
              }}
            >
              Вперед <span style={{ color: '#3b82f6', fontWeight: 'bold' }}>→</span>
            </button>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '16px', marginBottom: '20px', fontSize: '12px', fontWeight: 500 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><span style={{ width: '12px', height: '12px', backgroundColor: '#f0f9ff', borderLeft: '3px solid #3b82f6', borderRadius: '2px' }}></span><span style={{ color: '#475569' }}>Будущий (Запланирован)</span></div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><span style={{ width: '12px', height: '12px', backgroundColor: '#fff7ed', borderLeft: '3px solid #f97316', borderRadius: '2px' }}></span><span style={{ color: '#475569' }}>Требует закрытия (Прошел)</span></div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><span style={{ width: '12px', height: '12px', backgroundColor: '#f0fdf4', borderLeft: '3px solid #10b981', borderRadius: '2px' }}></span><span style={{ color: '#475569' }}>Проведен и списан</span></div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '80px repeat(7, 1fr)', border: '1px solid #e2e8f0', borderRadius: '8px', overflow: 'hidden' }}>
          <div style={{ backgroundColor: '#f8fafc', padding: '12px', textAlign: 'center', fontWeight: 600, fontSize: '13px', color: '#64748b', borderBottom: '1px solid #e2e8f0', borderRight: '1px solid #e2e8f0' }}>Время</div>
          {weekDays.map((dayDate) => {
            const formattedDay = dayDate.toLocaleDateString('ru-RU', { weekday: 'short', day: 'numeric' });
            return (
              <div key={dayDate.getTime()} style={{ backgroundColor: '#f8fafc', padding: '12px', textAlign: 'center', fontWeight: 600, fontSize: '13px', color: '#1e293b', borderBottom: '1px solid #e2e8f0', borderRight: '1px solid #e2e8f0' }}>
                {formattedDay}
              </div>
            );
          })}

          {timeSlots.map((time) => (
            <React.Fragment key={time}>
              <div style={{ padding: '10px', borderBottom: '1px solid #f1f5f9', borderRight: '1px solid #e2e8f0', fontSize: '12px', color: '#64748b', textAlign: 'center', backgroundColor: '#fafbfc' }}>
                {time}
              </div>
              {weekDays.map((dayDate) => {
                const targetHour = parseInt(time.split(':')[0], 10);

                const dayLessons = lessons.filter(l => {
                  if (!l.lesson_date) return false;

                  const isSameDay = new Date(l.lesson_date).toDateString() === dayDate.toDateString();
                  const lessonHour = parseInt(String(l.start_time).split(':')[0], 10);

                  return isSameDay && lessonHour === targetHour;
                });

                return (
                  <div key={`${dayDate.getTime()}-${time}`} style={{ padding: '4px', borderBottom: '1px solid #f1f5f9', borderRight: '1px solid #e2e8f0', minHeight: '50px', backgroundColor: '#ffffff', position: 'relative' }}>
                    {dayLessons.map((lesson) => {
                      const currentStyles = getLessonStyles(lesson);
                      return (
                        <div
                          key={lesson.id}
                          onClick={() => { setSelectedLessonId(lesson.id); setSelectedGroupId(lesson.group_id) }}
                          style={{ padding: '6px 8px', borderRadius: '4px', fontSize: '12px', cursor: 'pointer', transition: 'box-shadow 0.2s', ...currentStyles }}
                          onMouseEnter={(e) => e.currentTarget.style.boxShadow = '0 2px 6px rgba(0,0,0,0.08)'}
                          onMouseLeave={(e) => e.currentTarget.style.boxShadow = 'none'}
                        >
                          <div style={{ fontWeight: 600 }}>{lesson.group_name}</div>
                          <div style={{ marginTop: '2px', opacity: 0.9 }}>
                            {String(lesson.start_time).substring(0, 5)} - {String(lesson.end_time).substring(0, 5)}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                );
              })}
            </React.Fragment>
          ))}
        </div>
      </div>
      {selectedLessonId !== null && selectedGroupId !== null && (
        <LessonModalWindow
          lessonId={selectedLessonId}
          groupId={selectedGroupId}
          onClose={() => setSelectedLessonId(null)}
          onSuccess={() => {
            setSelectedLessonId(null);
            loadLessons();
          }}
        />
      )}
    </div>
  );
};
