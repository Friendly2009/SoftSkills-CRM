import React, { useEffect, useState } from 'react';
import styles from "@/components/cssmoduls/dashboardcomponentscssmoduls/lessonModal.module.css";
import { LessonModalData } from "@/interfaces/scheduleInterfaces";
import { getLessonModal, formatDateToString } from "@/logic/SchedulesRequest.ts";

interface LessonModalWindowProps {
    lessonId: string;
    groupId: number;
    onClose: () => void;
    onSuccess: () => void;
}

export const LessonModalWindow: React.FC<LessonModalWindowProps> = ({ lessonId, onClose, onSuccess }) => {
    const [lesson, setLesson] = useState<LessonModalData>();
    const [teacherId, setTeacherId] = useState<string>('');
    const [teacherPay, setTeacherPay] = useState<number>(0);
    const [attendance, setAttendance] = useState<Record<number, 'present' | 'absent' | 'excused'>>({});
    const [studentsPrice, setStudentsPrice] = useState<number>(800);
    const [isReadOnly, setIsReadOnly] = useState<boolean>(false);

    useEffect(() => {
        getLessonModal(lessonId)
            .then((result) => {
                if (result && result.success && result.data) {
                    const modalData = result.data;
                    setLesson(modalData);

                    setTeacherId(modalData.lesson.teacher_id?.toString() || '1');
                    setTeacherPay(Number(modalData.lesson.teacher_pay) || 0);
                    setIsReadOnly(!!modalData.isReadOnly);

                    const initialAttendance: Record<number, 'present' | 'absent' | 'excused'> = {};
                    const backendAttendance = modalData.attendance || [];

                    const reverseStatusMapping: Record<number, 'present' | 'absent' | 'excused'> = {
                        1: 'present',
                        2: 'absent',
                        3: 'excused'
                    };

                    if (backendAttendance.length > 0 && backendAttendance[0].amount_charged) {
                        setStudentsPrice(Number(backendAttendance[0].amount_charged));
                    } else {
                        setStudentsPrice(800); 
                    }

                    modalData.students.forEach((student: { id: number;[key: string]: any }) => {
                        const savedRecord = backendAttendance.find((a: any) => Number(a.client_id) === Number(student.id));

                        if (savedRecord) {
                            initialAttendance[student.id] = reverseStatusMapping[savedRecord.attendance_status] || 'present';
                        } else {
                            initialAttendance[student.id] = 'present';
                        }
                    });

                    setAttendance(initialAttendance);
                }
            })
            .catch((error) => console.error("Ошибка загрузки модалки:", error));
    }, [lessonId]);


    const handleStatusChange = (studentId: number, status: 'present' | 'absent' | 'excused') => {
        if (isReadOnly) return;
        setAttendance(prev => ({ ...prev, [studentId]: status }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (isReadOnly) return;

        const convertToISO = (dateVal?: string | Date | null, timeStr?: string) => {
            if (!dateVal) return "";

            let pureDate = "";
            if (dateVal instanceof Date) {
                pureDate = dateVal.toLocaleDateString('en-CA');
            } else {
                pureDate = String(dateVal).split('T')[0];
            }

            let cleanTime = timeStr ? timeStr.trim() : "00:00";
            if (cleanTime.includes(':') && cleanTime.split(':').length === 3) {
                const parts = cleanTime.split(':');
                cleanTime = `${parts[0]}:${parts[1]}`;
            }

            return `${pureDate}T${cleanTime}:00.000Z`;
        };

        const statusMapping: Record<'present' | 'absent' | 'excused', number> = {
            present: 1,
            absent: 2,
            excused: 3
        };

        const payload = {
            lessonId: lessonId,
            groupId: lesson?.group.id,
            startDateTime: convertToISO(lesson?.lesson.lesson_date, lesson?.lesson.start_time),
            endDateTime: convertToISO(lesson?.lesson.lesson_date, lesson?.lesson.end_time),
            teacherId: Number(teacherId) || 1,
            teacherPay: Number(teacherPay),
            students: lesson?.students.map(student => ({
                clientId: student.id,
                attendanceStatus: statusMapping[attendance[student.id] || 'present'],
                amountCharged: Number(studentsPrice)
            })) || []
        };

        try {
            const response = await fetch(`${import.meta.env.VITE_HOST}:${import.meta.env.VITE_PORT}/lessons/close`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                credentials: 'include',
                body: JSON.stringify(payload),
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.error || `Ошибка сервера: ${response.status}`);
            }

            const data = await response.json();
            console.log('Урок успешно закрыт:', data);

            onSuccess();
            onClose();
        } catch (error: any) {
            console.error('Ошибка при отправке формы:', error);
            alert(error.message || 'Не удалось сохранить данные. Попробуйте еще раз.');
        }
    };

    return (
        <div className={styles['modal-overlay']} onClick={onClose}>
            <div className={styles.drawer} onClick={(e) => e.stopPropagation()}>

                <div className={styles.header}>
                    <div className={styles['header-left']}>
                        <span className={styles['status-badge-planned']}></span>
                        <h3 className={styles['group-name']}>{lesson?.group.name}</h3>
                    </div>
                    <button type="button" onClick={onClose} className={styles['btn-close']}>&times;</button>
                </div>

                <div className={styles['meta-grid']}>
                    <div className={styles['meta-card']}>
                        <span className={styles['meta-label']}>Дата проведения урока</span>
                        <div className={styles['meta-value']}>{formatDateToString(lesson?.lesson.lesson_date)}</div>
                    </div>
                    <div className={styles['meta-card']}>
                        <span className={styles['meta-label']}>Временной интервал занятия</span>
                        <div className={styles['meta-value']}>{lesson?.lesson.start_time} — {lesson?.lesson.end_time}</div>
                    </div>
                </div>

                <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', flex: 1, overflow: 'hidden' }}>
                    <div className={styles['scroll-content']}>
                        <div>
                            <h4 className={styles['section-title']}>Ответственный преподаватель</h4>
                            <div className={styles['teacher-card']} style={isReadOnly ? { opacity: 0.7, backgroundColor: '#f8fafc' } : {}}>
                                <div className={styles['teacher-select-wrapper']}>
                                    <select
                                        value={teacherId}
                                        onChange={(e) => setTeacherId(e.target.value)}
                                        className={styles['teacher-select']}
                                        name='teacherId'
                                        disabled={isReadOnly} 
                                    >
                                        {lesson?.allTeachers.map((teach) => (
                                            <option key={teach.id} value={teach.id}>{teach.full_name}</option>
                                        ))}
                                    </select>
                                </div>
                                <div className={styles['teacher-pay-wrapper']}>
                                    <div className={styles['teacher-pay-input-group']}>
                                        <input
                                            type="number"
                                            value={teacherPay}
                                            onChange={(e) => setTeacherPay(Number(e.target.value))}
                                            className={styles['teacher-pay-input']}
                                            name='teacherPay'
                                            disabled={isReadOnly}
                                        />
                                        <span className={styles['price-symbol']}>₽</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div>
                            <h4 className={styles['section-title']}>Студенты и фиксация посещаемости</h4>
                            <div className={styles['students-list']}>
                                {lesson?.students.map((student) => (
                                    <div key={student.id} className={styles['student-card']}>
                                        <div>
                                            <div className={styles['student-name']}>{student.name}</div>
                                            <div className={styles['student-balance']}>
                                                Баланс:{' '}
                                                <span
                                                    className={student.balance < 0 ? styles['balance-negative'] : styles['balance-positive']}
                                                    style={{ color: student.balance < 0 ? '#ef4444' : '#10b981', fontWeight: '600' }}
                                                >
                                                    {student.balance}₽
                                                </span>
                                            </div>
                                        </div>

                                        <div className={styles['enum-group']}>
                                            <button
                                                type="button"
                                                className={`${styles['enum-btn']} ${attendance[student.id] === 'present' ? styles['enum-btn-present'] : ''}`}
                                                onClick={() => handleStatusChange(student.id, 'present')}
                                                style={isReadOnly ? { cursor: 'not-allowed', opacity: 0.6 } : {}}
                                            >
                                                Был
                                            </button>
                                            <button
                                                type="button"
                                                className={`${styles['enum-btn']} ${attendance[student.id] === 'absent' ? styles['enum-btn-absent'] : ''}`}
                                                onClick={() => handleStatusChange(student.id, 'absent')}
                                                style={isReadOnly ? { cursor: 'not-allowed', opacity: 0.6 } : {}}
                                            >
                                                Прогул
                                            </button>
                                            <button
                                                type="button"
                                                className={`${styles['enum-btn']} ${attendance[student.id] === 'excused' ? styles['enum-btn-excused'] : ''}`}
                                                onClick={() => handleStatusChange(student.id, 'excused')}
                                                style={isReadOnly ? { cursor: 'not-allowed', opacity: 0.6 } : {}}
                                            >
                                                Уважительная
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            <div style={{ marginTop: 24 }}>
                                <h4 className={styles['section-title']}>Финансовый расчет занятия</h4>
                                <div style={{ display: 'flex', gap: '16px', alignItems: 'flex-end' }}>
                                    <div style={{ flex: 1 }}>
                                        <span className={styles['meta-label']} style={{ display: 'block', marginBottom: '8px' }}>
                                            Цена за одно посещение
                                        </span>

                                        <div style={{
                                            position: 'relative',
                                            display: 'flex',
                                            alignItems: 'center',
                                            backgroundColor: isReadOnly ? '#f8fafc' : '#ffffff',
                                            border: '1px solid #dcdfe6',
                                            borderRadius: '12px',
                                            padding: '0 16px',
                                            height: '52px',
                                            transition: 'border-color 0.2s',
                                            opacity: isReadOnly ? 0.7 : 1
                                        }}>
                                            <input
                                                type="number"
                                                value={studentsPrice}
                                                onChange={(e) => setStudentsPrice(Number(e.target.value))}
                                                placeholder="0"
                                                min="0"
                                                disabled={isReadOnly}
                                                style={{
                                                    border: 'none',
                                                    outline: 'none',
                                                    width: '100%',
                                                    height: '100%',
                                                    fontSize: '16px',
                                                    color: '#303133',
                                                    fontWeight: '500',
                                                    backgroundColor: 'transparent',
                                                    paddingRight: '60px',
                                                    cursor: isReadOnly ? 'not-allowed' : 'text'
                                                }}
                                            />
                                            <div style={{
                                                position: 'absolute',
                                                right: '16px',
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: '4px',
                                                color: '#909399',
                                                fontSize: '14px',
                                                pointerEvents: 'none',
                                                userSelect: 'none'
                                            }}>
                                                <span style={{ fontWeight: '600', color: '#303133' }}>₽</span>
                                                <span>/ чел</span>
                                            </div>
                                        </div>
                                    </div>

                                    <div style={{
                                        flex: 1,
                                        backgroundColor: '#f8f9fa',
                                        borderRadius: '12px',
                                        padding: '0 16px',
                                        height: '52px',
                                        display: 'flex',
                                        flexDirection: 'column',
                                        justifyContent: 'center',
                                        border: '1px solid #e9ecef'
                                    }}>
                                        <span className={styles['meta-label']} style={{ fontSize: '11px', marginBottom: '2px' }}>
                                            Итог за занятие
                                        </span>
                                        <div style={{
                                            fontSize: '18px',
                                            fontWeight: '600',
                                            color: '#212529'
                                        }}>
                                            {(((lesson?.students.length || 0) * studentsPrice) - teacherPay).toLocaleString('ru-RU')} ₽
                                        </div>
                                    </div>

                                </div>
                            </div>
                        </div>
                    </div>

                    <div className={styles.footer}>
                        <button type="button" onClick={onClose} className={styles['btn-cancel']}>
                            Отмена
                        </button>
                        <button
                            type="submit"
                            className={styles['btn-submit']}
                            disabled={isReadOnly}
                            style={isReadOnly ? { backgroundColor: '#cbd5e1', color: '#94a3b8', cursor: 'not-allowed', boxShadow: 'none' } : {}}
                        >
                            {isReadOnly ? 'Просмотр ограничен' : 'Провести урок и зафиксировать данные'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};
