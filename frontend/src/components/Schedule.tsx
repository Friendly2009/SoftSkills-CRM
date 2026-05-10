import React, { useState } from 'react';
import { PlusIcon, EditIcon, TrashIcon } from './Icons';
import { lessons as initialLessons, groups } from '../data/mockData';
import { Lesson } from '../types';

type LessonFormState = Omit<Lesson, 'id'>;

const daysOfWeek = ['Понедельник', 'Вторник', 'Среда', 'Четверг', 'Пятница', 'Суббота', 'Воскресенье'];
const timeSlots = ['17:00', '18:00', '19:00', '20:00', '21:00'];
const endTimeOptions = ['18:00', '19:00', '20:00', '21:00', '22:00'];

const getDefaultGroup = () => groups.find((group) => group.status === 'active')?.name ?? groups[0]?.name ?? '';

const createEmptyLessonForm = (): LessonFormState => ({
  subject: '',
  teacher: '',
  group: getDefaultGroup(),
  room: '',
  dayOfWeek: 1,
  startTime: '18:00',
  endTime: '20:00',
});

const addHour = (time: string) => {
  const hour = Number(time.split(':')[0]);
  return `${Math.min(hour + 1, 22).toString().padStart(2, '0')}:00`;
};

export const Schedule: React.FC = () => {
  const [lessonList, setLessonList] = useState<Lesson[]>(initialLessons);
  const [selectedGroup, setSelectedGroup] = useState<string>('all');
  const [selectedLesson, setSelectedLesson] = useState<Lesson | null>(null);
  const [editingLesson, setEditingLesson] = useState<Lesson | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [formData, setFormData] = useState<LessonFormState>(() => createEmptyLessonForm());
  const [toast, setToast] = useState<string | null>(null);

  const filteredLessons = selectedGroup === 'all' ? lessonList : lessonList.filter((lesson) => lesson.group === selectedGroup);

  const showToast = (message: string) => {
    setToast(message);
    window.setTimeout(() => setToast(null), 2200);
  };

  const updateField = <K extends keyof LessonFormState>(key: K, value: LessonFormState[K]) => {
    setFormData((current) => ({ ...current, [key]: value }));
  };

  const openAddForm = (dayOfWeek = 1, startTime = '18:00') => {
    setEditingLesson(null);
    setFormData({
      ...createEmptyLessonForm(),
      group: selectedGroup === 'all' ? getDefaultGroup() : selectedGroup,
      dayOfWeek,
      startTime,
      endTime: addHour(startTime),
    });
    setIsFormOpen(true);
  };

  const openEditForm = (lesson: Lesson) => {
    setEditingLesson(lesson);
    setFormData({
      subject: lesson.subject,
      teacher: lesson.teacher,
      group: lesson.group,
      room: lesson.room,
      dayOfWeek: lesson.dayOfWeek,
      startTime: lesson.startTime,
      endTime: lesson.endTime,
    });
    setIsFormOpen(true);
  };

  const closeForm = () => {
    setIsFormOpen(false);
    setEditingLesson(null);
  };

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (Number(formData.endTime.split(':')[0]) <= Number(formData.startTime.split(':')[0])) {
      showToast('Время окончания должно быть позже начала');
      return;
    }

    if (editingLesson) {
      const updatedLesson: Lesson = { ...editingLesson, ...formData };
      setLessonList((current) => current.map((lesson) => (lesson.id === editingLesson.id ? updatedLesson : lesson)));
      setSelectedLesson((current) => (current?.id === editingLesson.id ? updatedLesson : current));
      showToast('Занятие обновлено');
    } else {
      const newLesson: Lesson = { id: crypto.randomUUID(), ...formData };
      setLessonList((current) => [...current, newLesson]);
      showToast('Занятие добавлено');
    }

    closeForm();
  };

  const handleDelete = (lesson: Lesson) => {
    const isConfirmed = window.confirm(`Удалить занятие "${lesson.subject}"?`);
    if (!isConfirmed) return;

    setLessonList((current) => current.filter((item) => item.id !== lesson.id));
    setSelectedLesson((current) => (current?.id === lesson.id ? null : current));
    showToast('Занятие удалено');
  };

  const getLessonForSlot = (dayIndex: number, time: string) => {
    return filteredLessons.find((lesson) => lesson.dayOfWeek === dayIndex + 1 && lesson.startTime === time);
  };

  const getLessonDuration = (lesson: Lesson) => {
    const start = Number(lesson.startTime.split(':')[0]);
    const end = Number(lesson.endTime.split(':')[0]);
    return end - start;
  };

  return (
    <div className="space-y-6">
      {toast && (
        <div className="fixed right-4 top-20 z-[60] rounded-lg bg-slate-900 px-4 py-3 text-sm font-medium text-white shadow-lg">
          {toast}
        </div>
      )}

      <div className="flex flex-col justify-between gap-4 sm:flex-row">
        <select
          value={selectedGroup}
          onChange={(event) => setSelectedGroup(event.target.value)}
          className="rounded-lg border border-gray-300 px-4 py-2 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500"
        >
          <option value="all">Все группы</option>
          {groups
            .filter((group) => group.status === 'active')
            .map((group) => (
              <option key={group.id} value={group.name}>
                {group.name} - {group.course}
              </option>
            ))}
        </select>
        <button
          onClick={() => openAddForm()}
          className="inline-flex items-center justify-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-white transition-colors hover:bg-indigo-700"
        >
          <PlusIcon className="h-5 w-5" />
          Добавить занятие
        </button>
      </div>

      <div className="overflow-hidden rounded-xl border border-gray-100 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[800px]">
            <thead>
              <tr className="border-b border-gray-200 bg-gray-50">
                <th className="w-24 px-4 py-3 text-left text-sm font-semibold text-gray-600">Время</th>
                {daysOfWeek.map((day) => (
                  <th key={day} className="px-4 py-3 text-center text-sm font-semibold text-gray-600">
                    {day}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {timeSlots.map((time) => (
                <tr key={time} className="border-b border-gray-100">
                  <td className="bg-gray-50 px-4 py-3 text-sm font-medium text-gray-600">{time}</td>
                  {daysOfWeek.map((_, dayIndex) => {
                    const lesson = getLessonForSlot(dayIndex, time);
                    if (lesson) {
                      const duration = getLessonDuration(lesson);
                      const colors = [
                        'bg-indigo-100 border-indigo-300 text-indigo-800',
                        'bg-emerald-100 border-emerald-300 text-emerald-800',
                        'bg-amber-100 border-amber-300 text-amber-800',
                        'bg-rose-100 border-rose-300 text-rose-800',
                        'bg-purple-100 border-purple-300 text-purple-800',
                      ];
                      const colorIndex = Number(lesson.id.replace(/\D/g, '').slice(0, 2) || '1') % colors.length;

                      return (
                        <td key={dayIndex} className="px-2 py-1" rowSpan={duration}>
                          <button
                            onClick={() => setSelectedLesson(lesson)}
                            className={`h-full min-h-24 w-full rounded-lg border p-3 text-left transition-transform hover:scale-[1.02] ${colors[colorIndex]}`}
                          >
                            <p className="text-sm font-semibold">{lesson.subject}</p>
                            <p className="mt-1 text-xs">{lesson.group}</p>
                            <p className="text-xs opacity-75">{lesson.room} ауд.</p>
                            <p className="text-xs opacity-75">{lesson.teacher}</p>
                          </button>
                        </td>
                      );
                    }

                    const lessonInSlot = filteredLessons.find(
                      (item) =>
                        item.dayOfWeek === dayIndex + 1 &&
                        Number(item.startTime.split(':')[0]) < Number(time.split(':')[0]) &&
                        Number(item.endTime.split(':')[0]) > Number(time.split(':')[0]),
                    );
                    if (lessonInSlot) return null;

                    return (
                      <td key={dayIndex} className="px-2 py-1">
                        <button
                          onClick={() => openAddForm(dayIndex + 1, time)}
                          className="h-24 w-full rounded-lg border border-dashed border-gray-200 transition-colors hover:border-indigo-300 hover:bg-indigo-50"
                          aria-label="Добавить занятие в пустую ячейку"
                        />
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="rounded-xl border border-gray-100 bg-white p-6 shadow-sm">
        <h3 className="mb-4 text-lg font-semibold text-gray-800">Легенда</h3>
        <div className="flex flex-wrap gap-4">
          {groups
            .filter((group) => group.status === 'active')
            .map((group) => (
              <div key={group.id} className="flex items-center gap-2">
                <div className="h-4 w-4 rounded border border-indigo-300 bg-indigo-200" />
                <span className="text-sm text-gray-600">
                  {group.name} - {group.course}
                </span>
              </div>
            ))}
        </div>
      </div>

      {selectedLesson && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
          <div className="w-full max-w-lg rounded-xl bg-white shadow-xl">
            <div className="border-b border-gray-200 p-6">
              <h3 className="text-xl font-semibold text-gray-800">{selectedLesson.subject}</h3>
              <p className="mt-1 text-sm text-gray-500">
                {daysOfWeek[selectedLesson.dayOfWeek - 1]}, {selectedLesson.startTime}-{selectedLesson.endTime}
              </p>
            </div>
            <div className="grid grid-cols-2 gap-4 p-6">
              <div>
                <p className="text-sm text-gray-500">Группа</p>
                <p className="font-medium text-gray-800">{selectedLesson.group}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Аудитория</p>
                <p className="font-medium text-gray-800">{selectedLesson.room}</p>
              </div>
              <div className="col-span-2">
                <p className="text-sm text-gray-500">Преподаватель</p>
                <p className="font-medium text-gray-800">{selectedLesson.teacher}</p>
              </div>
            </div>
            <div className="flex justify-end gap-3 border-t border-gray-200 p-6">
              <button
                onClick={() => handleDelete(selectedLesson)}
                className="inline-flex items-center gap-2 rounded-lg border border-red-200 px-4 py-2 text-red-600 transition-colors hover:bg-red-50"
              >
                <TrashIcon className="h-4 w-4" />
                Удалить
              </button>
              <button
                onClick={() => openEditForm(selectedLesson)}
                className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-white transition-colors hover:bg-indigo-700"
              >
                <EditIcon className="h-4 w-4" />
                Редактировать
              </button>
              <button
                onClick={() => setSelectedLesson(null)}
                className="rounded-lg border border-gray-300 px-4 py-2 transition-colors hover:bg-gray-50"
              >
                Закрыть
              </button>
            </div>
          </div>
        </div>
      )}

      {isFormOpen && (
        <div className="fixed inset-0 z-[55] flex items-center justify-center bg-black bg-opacity-50 p-4">
          <form onSubmit={handleSubmit} className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-xl bg-white shadow-xl">
            <div className="border-b border-gray-200 p-6">
              <h3 className="text-xl font-semibold text-gray-800">{editingLesson ? 'Редактировать занятие' : 'Добавить занятие'}</h3>
            </div>
            <div className="grid grid-cols-1 gap-4 p-6 md:grid-cols-2">
              <label className="block text-sm font-medium text-gray-700 md:col-span-2">
                Предмет
                <input
                  required
                  type="text"
                  value={formData.subject}
                  onChange={(event) => updateField('subject', event.target.value)}
                  className="mt-2 w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500"
                />
              </label>
              <label className="block text-sm font-medium text-gray-700">
                Преподаватель
                <input
                  required
                  type="text"
                  value={formData.teacher}
                  onChange={(event) => updateField('teacher', event.target.value)}
                  className="mt-2 w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500"
                />
              </label>
              <label className="block text-sm font-medium text-gray-700">
                Группа
                <select
                  value={formData.group}
                  onChange={(event) => updateField('group', event.target.value)}
                  className="mt-2 w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500"
                >
                  {groups.map((group) => (
                    <option key={group.id} value={group.name}>
                      {group.name}
                    </option>
                  ))}
                </select>
              </label>
              <label className="block text-sm font-medium text-gray-700">
                День недели
                <select
                  value={formData.dayOfWeek}
                  onChange={(event) => updateField('dayOfWeek', Number(event.target.value))}
                  className="mt-2 w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500"
                >
                  {daysOfWeek.map((day, index) => (
                    <option key={day} value={index + 1}>
                      {day}
                    </option>
                  ))}
                </select>
              </label>
              <label className="block text-sm font-medium text-gray-700">
                Аудитория
                <input
                  required
                  type="text"
                  value={formData.room}
                  onChange={(event) => updateField('room', event.target.value)}
                  className="mt-2 w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500"
                />
              </label>
              <label className="block text-sm font-medium text-gray-700">
                Начало
                <select
                  value={formData.startTime}
                  onChange={(event) => updateField('startTime', event.target.value)}
                  className="mt-2 w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500"
                >
                  {timeSlots.map((time) => (
                    <option key={time} value={time}>
                      {time}
                    </option>
                  ))}
                </select>
              </label>
              <label className="block text-sm font-medium text-gray-700">
                Окончание
                <select
                  value={formData.endTime}
                  onChange={(event) => updateField('endTime', event.target.value)}
                  className="mt-2 w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500"
                >
                  {endTimeOptions.map((time) => (
                    <option key={time} value={time}>
                      {time}
                    </option>
                  ))}
                </select>
              </label>
            </div>
            <div className="flex justify-end gap-3 border-t border-gray-200 p-6">
              <button
                type="button"
                onClick={closeForm}
                className="rounded-lg border border-gray-300 px-4 py-2 transition-colors hover:bg-gray-50"
              >
                Отмена
              </button>
              <button type="submit" className="rounded-lg bg-indigo-600 px-4 py-2 text-white transition-colors hover:bg-indigo-700">
                {editingLesson ? 'Сохранить' : 'Добавить'}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};