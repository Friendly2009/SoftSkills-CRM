import React, { useEffect, useState } from 'react';
import styles from "@/components/cssmoduls/DashboardComponentsCssModuls/lessonModal.module.css";
import { LessonModalData } from "@/interfaces/scheduleInterfaces.ts";
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

    useEffect(() => {
        getLessonModal(lessonId)
            .then((result) => {
                if (result && result.success && result.data) {
                    setLesson(result.data);
                    setTeacherId(result.data.lesson.teacher_id?.toString() || '1');
                    setTeacherPay(result.data.lesson.teacher_pay || 0);

                    const initialAttendance: Record<number, 'present' | 'absent' | 'excused'> = {};
                    result.data.students.forEach((student: { id: number;[key: string]: any }) => {
                        initialAttendance[student.id] = 'present';
                    });
                    setAttendance(initialAttendance);
                }
            })
            .catch((error) => console.error("Ошибка загрузки модалки:", error));
    }, [lessonId]);

    const handleStatusChange = (studentId: number, status: 'present' | 'absent' | 'excused') => {
        setAttendance(prev => ({ ...prev, [studentId]: status }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        const convertToISO = (dateVal?: string | Date | null, timeStr?: string) => {
            const clearTime = timeStr ? timeStr.trim() : "00:00";

            try {
                let pureDate = "";

                if (!dateVal) {
                    const today = new Date();
                    pureDate = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
                } else if (dateVal instanceof Date) {
                    pureDate = `${dateVal.getFullYear()}-${String(dateVal.getMonth() + 1).padStart(2, '0')}-${String(dateVal.getDate()).padStart(2, '0')}`;
                } else {
                    pureDate = String(dateVal).split('T')[0];
                }

                const localDateTimeStr = `${pureDate}T${clearTime}:00`;
                const finalDate = new Date(localDateTimeStr);

                if (isNaN(finalDate.getTime())) {
                    const fallback = new Date();
                    return new Date(`${fallback.getFullYear()}-${String(fallback.getMonth() + 1).padStart(2, '0')}-${String(fallback.getDate()).padStart(2, '0')}T${clearTime}:00`).toISOString();
                }

                const tzOffsetMs = finalDate.getTimezoneOffset() * 60000;
                const correctedDate = new Date(finalDate.getTime() - tzOffsetMs);

                return correctedDate.toISOString();
            } catch (err) {
                console.error("Ошибка парсинга даты/времени:", err);
                return new Date().toISOString();
            }
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

        console.log("=== ОБНОВЛЕННЫЙ PAYLOAD ===");
        console.log(JSON.stringify(payload, null, 2));
        console.log("============================");

        try {
            const response = await fetch('http://localhost:3000/lessons/close', {
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
                            <div className={styles['teacher-card']}>
                                <div className={styles['teacher-select-wrapper']}>
                                    <select
                                        value={teacherId}
                                        onChange={(e) => setTeacherId(e.target.value)}
                                        className={styles['teacher-select']}
                                        name='teacherId'
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
                                                Баланс: <span className={styles['balance-positive']}>{student.balance}₽</span>
                                            </div>
                                        </div>
                                        <div className={styles['enum-group']}>
                                            <button
                                                type="button"
                                                className={`${styles['enum-btn']} ${attendance[student.id] === 'present' ? styles['enum-btn-present'] : ''}`}
                                                onClick={() => handleStatusChange(student.id, 'present')}
                                            >
                                                Был
                                            </button>
                                            <button
                                                type="button"
                                                className={`${styles['enum-btn']} ${attendance[student.id] === 'absent' ? styles['enum-btn-absent'] : ''}`}
                                                onClick={() => handleStatusChange(student.id, 'absent')}
                                            >
                                                Прогул
                                            </button>
                                            <button
                                                type="button"
                                                className={`${styles['enum-btn']} ${attendance[student.id] === 'excused' ? styles['enum-btn-excused'] : ''}`}
                                                onClick={() => handleStatusChange(student.id, 'excused')}
                                            >
                                                Уважительная
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            <div style={{ marginTop: 20 }}>
                                <h4 className={styles['section-title']}>Фиксированная цена за одно посещение</h4>
                                <div className={styles['price-input-container']}>
                                    <input
                                        type="number"
                                        value={studentsPrice}
                                        onChange={(e) => setStudentsPrice(Number(e.target.value))}
                                        className={styles['price-field']}
                                        placeholder="0"
                                        min="0"
                                    />
                                    <div className={styles['price-addons']}>
                                        <span className={styles['currency-symbol']}>₽</span>
                                        <span className={styles['price-unit']}>/ чел</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className={styles.footer}>
                        <button type="button" onClick={onClose} className={styles['btn-cancel']}>
                            Отмена
                        </button>
                        <button type="submit" className={styles['btn-submit']}>
                            Провести урок и зафиксировать данные
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};