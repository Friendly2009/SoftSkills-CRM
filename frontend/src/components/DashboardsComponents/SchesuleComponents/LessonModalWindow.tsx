import React, { useState, useEffect } from 'react';
import { LessonModalData, AttendanceStatus, LessonStatus, AttendanceRecord } from '@/interfaces/scheduleInterfaces.ts';
import { scheduleQuery } from '@/logic/SchedulesRequest.ts';

interface LessonModalWindowProps {
  lessonId: number;
  onClose: () => void;
  onSuccess: () => void;
}

export const LessonModalWindow: React.FC<LessonModalWindowProps> = ({ lessonId, onClose, onSuccess }) => {
  const [data, setData] = useState<LessonModalData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [selectedTeacherId, setSelectedTeacherId] = useState<number>(0);
  const [teacherPay, setTeacherPay] = useState<number>(0);
  const [attendanceState, setAttendanceState] = useState<Record<number, { status: AttendanceStatus; price: number }>>({});
  const [submitting, setSubmitting] = useState<boolean>(false);

  useEffect(() => {
    scheduleQuery.getLessonDetails(lessonId)
      .then((res) => {
        setData(res);
        setSelectedTeacherId(res.lesson.user_id);
        setTeacherPay(res.lesson.teacher_pay);
        
        const initialAttendance: Record<number, { status: AttendanceStatus; price: number }> = {};
        res.students.forEach((student) => {
          const existing = res.attendance?.find(a => a.client_id === student.id);
          initialAttendance[student.id] = {
            status: existing ? existing.attendance_status : AttendanceStatus.Present,
            price: existing ? existing.amount_charged : 500
          };
        });
        setAttendanceState(initialAttendance);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [lessonId]);

  const handleStatusChange = (studentId: number, status: AttendanceStatus) => {
    setAttendanceState(prev => ({
      ...prev,
      [studentId]: {
        ...prev[studentId],
        status,
        price: status === AttendanceStatus.Excused ? 0 : prev[studentId].price
      }
    }));
  };

  const handlePriceChange = (studentId: number, price: number) => {
    setAttendanceState(prev => ({
      ...prev,
      [studentId]: { ...prev[studentId], price }
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!data || data.lesson.status === LessonStatus.Completed) return;
    setSubmitting(true);

    const attendancePayload: AttendanceRecord[] = data.students.map(student => ({
      client_id: student.id,
      attendance_status: attendanceState[student.id].status,
      amount_charged: attendanceState[student.id].price
    }));

    try {
      await scheduleQuery.closeLesson({
        lesson_id: data.lesson.id,
        user_id: selectedTeacherId,
        teacher_pay: teacherPay,
        attendance: attendancePayload
      });
      onSuccess();
    } catch {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', backgroundColor: 'rgba(0,0,0,0.2)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1100 }}>
        <div style={{ backgroundColor: '#ffffff', padding: '20px 40px', borderRadius: '8px', boxShadow: '0 2px 10px rgba(0,0,0,0.1)', fontFamily: 'system-ui, sans-serif' }}>Загрузка данных...</div>
      </div>
    );
  }

  if (!data) return null;

  const isReadOnly = data.lesson.status === LessonStatus.Completed;

  return (
    <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', backgroundColor: 'rgba(0,0,0,0.4)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1100, fontFamily: 'system-ui, sans-serif' }}>
      <div style={{ backgroundColor: '#ffffff', width: '650px', maxHeight: '90vh', borderRadius: '10px', boxShadow: '0 10px 25px rgba(0,0,0,0.15)', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        
        <div style={{ padding: '16px 24px', borderBottom: '1px solid #eef2f6', display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#fafbfc' }}>
          <div>
            <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 600, color: '#1e293b' }}>{data.group.name}</h3>
            <p style={{ margin: '4px 0 0 0', fontSize: '13px', color: '#64748b' }}>Дата: {data.lesson.lesson_date} | Время: {data.lesson.start_time.substring(0,5)} - {data.lesson.end_time.substring(0,5)}</p>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', fontSize: '22px', cursor: 'pointer', color: '#94a3b8' }}>&times;</button>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', flex: 1, overflow: 'hidden' }}>
          <div style={{ padding: '24px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '20px' }}>
            
            <div style={{ display: 'flex', gap: '16px' }}>
              <div style={{ flex: 1 }}>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, color: '#475569', marginBottom: '6px' }}>Преподаватель</label>
                <select value={selectedTeacherId} onChange={(e) => setSelectedTeacherId(Number(e.target.value))} disabled={isReadOnly} style={{ width: '100%', padding: '8px 12px', border: '1px solid #cbd5e1', borderRadius: '6px', fontSize: '14px', backgroundColor: isReadOnly ? '#f1f5f9' : '#ffffff', color: '#1e293b' }}>
                  {data.allTeachers.map((t) => (
                    <option key={t.id} value={t.id}>{t.full_name}</option>
                  ))}
                </select>
              </div>
              <div style={{ flex: 1 }}>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, color: '#475569', marginBottom: '6px' }}>Оплата преподавателю (руб.)</label>
                <input type="number" value={teacherPay} onChange={(e) => setTeacherPay(Number(e.target.value))} disabled={isReadOnly} style={{ width: '100%', padding: '8px 12px', border: '1px solid #cbd5e1', borderRadius: '6px', fontSize: '14px', backgroundColor: isReadOnly ? '#f1f5f9' : '#ffffff', color: '#1e293b' }} min="0" required />
              </div>
            </div>

            <div>
              <h4 style={{ margin: '0 0 12px 0', fontSize: '14px', fontWeight: 600, color: '#334155', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Студенты группы</h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {data.students.map((student) => {
                  const state = attendanceState[student.id] || { status: AttendanceStatus.Present, price: 0 };
                  return (
                    <div key={student.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px', backgroundColor: '#f8fafc', borderRadius: '8px', border: '1px solid #f1f5f9' }}>
                      <div style={{ flex: 1, paddingRight: '16px' }}>
                        <div style={{ fontSize: '14px', fontWeight: 500, color: '#1e293b' }}>{student.name}</div>
                        <div style={{ fontSize: '12px', color: '#64748b', marginTop: '2px' }}>Баланс: <span style={{ color: student.balance < 0 ? '#ef4444' : '#10b981', fontWeight: 500 }}>{student.balance} руб.</span></div>
                      </div>
                      
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <select value={state.status} onChange={(e) => handleStatusChange(student.id, Number(e.target.value) as AttendanceStatus)} disabled={isReadOnly} style={{ padding: '6px 10px', border: '1px solid #cbd5e1', borderRadius: '6px', fontSize: '13px', backgroundColor: isReadOnly ? '#f1f5f9' : '#ffffff' }}>
                          <option value={AttendanceStatus.Present}>Был</option>
                          <option value={AttendanceStatus.Excused}>Уважительная</option>
                          <option value={AttendanceStatus.Absent}>Прогул</option>
                        </select>
                        
                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                          <input type="number" value={state.price} onChange={(e) => handlePriceChange(student.id, Number(e.target.value))} disabled={isReadOnly || state.status === AttendanceStatus.Excused} style={{ width: '80px', padding: '6px 10px', border: '1px solid #cbd5e1', borderRadius: '6px', fontSize: '13px', textAlign: 'right', backgroundColor: (isReadOnly || state.status === AttendanceStatus.Excused) ? '#f1f5f9' : '#ffffff' }} min="0" required />
                          <span style={{ fontSize: '13px', color: '#64748b' }}>руб.</span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

          </div>

          <div style={{ padding: '16px 24px', borderTop: '1px solid #eef2f6', backgroundColor: '#fafbfc', display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
            <button type="button" onClick={onClose} style={{ padding: '8px 16px', border: '1px solid #cbd5e1', borderRadius: '6px', backgroundColor: '#ffffff', fontSize: '14px', fontWeight: 500, color: '#334155', cursor: 'pointer' }}>
              {isReadOnly ? 'Закрыть' : 'Отмена'}
            </button>
            {!isReadOnly && (
              <button type="submit" disabled={submitting} style={{ padding: '8px 16px', border: 'none', borderRadius: '6px', backgroundColor: '#2563eb', fontSize: '14px', fontWeight: 500, color: '#ffffff', cursor: 'pointer', opacity: submitting ? 0.7 : 1 }}>
                {submitting ? 'Сохранение...' : 'Провести урок и списать средства'}
              </button>
            )}
          </div>
        </form>

      </div>
    </div>
  );
};
