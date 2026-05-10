import React, { useMemo, useState } from 'react';
import { PlusIcon, SearchIcon, EyeIcon, EditIcon, TrashIcon } from './Icons';
import { teachers as initialTeachers } from '../data/mockData';
import { Teacher } from '../types';

type TeacherFormState = {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  subjects: string;
  groups: string;
  status: Teacher['status'];
  salary: number;
};

const createEmptyTeacherForm = (): TeacherFormState => ({
  firstName: '',
  lastName: '',
  email: '',
  phone: '',
  subjects: '',
  groups: '',
  status: 'active',
  salary: 0,
});

const teacherToForm = (teacher: Teacher): TeacherFormState => ({
  firstName: teacher.firstName,
  lastName: teacher.lastName,
  email: teacher.email,
  phone: teacher.phone,
  subjects: teacher.subjects.join(', '),
  groups: teacher.groups.join(', '),
  status: teacher.status,
  salary: teacher.salary,
});

const splitList = (value: string) => value.split(',').map((item) => item.trim()).filter(Boolean);

export const Teachers: React.FC = () => {
  const [teacherList, setTeacherList] = useState<Teacher[]>(initialTeachers);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTeacher, setSelectedTeacher] = useState<Teacher | null>(null);
  const [editingTeacher, setEditingTeacher] = useState<Teacher | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [formData, setFormData] = useState<TeacherFormState>(() => createEmptyTeacherForm());
  const [toast, setToast] = useState<string | null>(null);

  const showToast = (message: string) => {
    setToast(message);
    window.setTimeout(() => setToast(null), 2200);
  };

  const filteredTeachers = useMemo(
    () =>
      teacherList.filter((teacher) => {
        const query = searchTerm.toLowerCase();
        const fullName = `${teacher.lastName} ${teacher.firstName}`.toLowerCase();

        return (
          fullName.includes(query) ||
          teacher.email.toLowerCase().includes(query) ||
          teacher.subjects.some((subject) => subject.toLowerCase().includes(query))
        );
      }),
    [teacherList, searchTerm],
  );

  const updateField = <K extends keyof TeacherFormState>(key: K, value: TeacherFormState[K]) => {
    setFormData((current) => ({ ...current, [key]: value }));
  };

  const openAddForm = () => {
    setEditingTeacher(null);
    setFormData(createEmptyTeacherForm());
    setIsFormOpen(true);
  };

  const openEditForm = (teacher: Teacher) => {
    setEditingTeacher(teacher);
    setFormData(teacherToForm(teacher));
    setIsFormOpen(true);
  };

  const closeForm = () => {
    setIsFormOpen(false);
    setEditingTeacher(null);
  };

  const createTeacherPayload = (id: string): Teacher => ({
    id,
    firstName: formData.firstName,
    lastName: formData.lastName,
    email: formData.email,
    phone: formData.phone,
    subjects: splitList(formData.subjects),
    groups: splitList(formData.groups),
    status: formData.status,
    salary: formData.salary,
  });

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (editingTeacher) {
      const updatedTeacher = createTeacherPayload(editingTeacher.id);
      setTeacherList((current) => current.map((teacher) => (teacher.id === editingTeacher.id ? updatedTeacher : teacher)));
      setSelectedTeacher((current) => (current?.id === editingTeacher.id ? updatedTeacher : current));
      showToast('Преподаватель обновлен');
    } else {
      const newTeacher = createTeacherPayload(crypto.randomUUID());
      setTeacherList((current) => [newTeacher, ...current]);
      showToast('Преподаватель добавлен');
    }

    closeForm();
  };

  const handleDelete = (teacher: Teacher) => {
    const isConfirmed = window.confirm(`Удалить преподавателя ${teacher.lastName} ${teacher.firstName}?`);
    if (!isConfirmed) return;

    setTeacherList((current) => current.filter((item) => item.id !== teacher.id));
    setSelectedTeacher((current) => (current?.id === teacher.id ? null : current));
    showToast('Преподаватель удален');
  };

  return (
    <div className="space-y-6">
      {toast && (
        <div className="fixed right-4 top-20 z-[60] rounded-lg bg-slate-900 px-4 py-3 text-sm font-medium text-white shadow-lg">
          {toast}
        </div>
      )}

      <div className="flex flex-col justify-between gap-4 sm:flex-row">
        <div className="relative">
          <SearchIcon className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Поиск преподавателей..."
            value={searchTerm}
            onChange={(event) => setSearchTerm(event.target.value)}
            className="w-full rounded-lg border border-gray-300 py-2 pl-10 pr-4 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500 sm:w-64"
          />
        </div>
        <button
          onClick={openAddForm}
          className="inline-flex items-center justify-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-white transition-colors hover:bg-indigo-700"
        >
          <PlusIcon className="h-5 w-5" />
          <span>Добавить преподавателя</span>
        </button>
      </div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
        {filteredTeachers.map((teacher) => (
          <div key={teacher.id} className="overflow-hidden rounded-xl border border-gray-100 bg-white shadow-sm transition-shadow hover:shadow-md">
            <div className="p-6">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-4">
                  <div className="flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-purple-400 to-pink-500 text-lg font-medium text-white">
                    {teacher.firstName[0]}
                    {teacher.lastName[0]}
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-800">
                      {teacher.lastName} {teacher.firstName}
                    </h3>
                    <span
                      className={`mt-1 inline-block rounded-full px-2 py-0.5 text-xs font-medium ${
                        teacher.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'
                      }`}
                    >
                      {teacher.status === 'active' ? 'Активен' : 'Неактивен'}
                    </span>
                  </div>
                </div>
                <div className="flex gap-1">
                  <button
                    onClick={() => setSelectedTeacher(teacher)}
                    className="rounded-lg p-2 text-gray-400 transition-colors hover:bg-indigo-50 hover:text-indigo-600"
                    aria-label="Открыть преподавателя"
                  >
                    <EyeIcon className="h-5 w-5" />
                  </button>
                  <button
                    onClick={() => openEditForm(teacher)}
                    className="rounded-lg p-2 text-gray-400 transition-colors hover:bg-indigo-50 hover:text-indigo-600"
                    aria-label="Редактировать преподавателя"
                  >
                    <EditIcon className="h-5 w-5" />
                  </button>
                  <button
                    onClick={() => handleDelete(teacher)}
                    className="rounded-lg p-2 text-gray-400 transition-colors hover:bg-red-50 hover:text-red-600"
                    aria-label="Удалить преподавателя"
                  >
                    <TrashIcon className="h-5 w-5" />
                  </button>
                </div>
              </div>

              <div className="mt-4 space-y-3">
                <div>
                  <p className="mb-1 text-xs uppercase tracking-wider text-gray-500">Предметы</p>
                  <div className="flex flex-wrap gap-1">
                    {teacher.subjects.map((subject) => (
                      <span key={subject} className="rounded bg-indigo-50 px-2 py-1 text-xs font-medium text-indigo-700">
                        {subject}
                      </span>
                    ))}
                  </div>
                </div>
                <div>
                  <p className="mb-1 text-xs uppercase tracking-wider text-gray-500">Группы</p>
                  <div className="flex flex-wrap gap-1">
                    {teacher.groups.map((group) => (
                      <span key={group} className="rounded bg-slate-100 px-2 py-1 text-xs font-medium text-slate-700">
                        {group}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              <div className="mt-4 flex items-center justify-between border-t border-gray-100 pt-4 text-sm">
                <span className="text-gray-500">{teacher.email}</span>
                <span className="font-semibold text-gray-800">{teacher.salary.toLocaleString()} ₽</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {selectedTeacher && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
          <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-xl bg-white shadow-xl">
            <div className="border-b border-gray-200 p-6">
              <div className="flex items-center gap-4">
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-purple-400 to-pink-500 text-xl font-medium text-white">
                  {selectedTeacher.firstName[0]}
                  {selectedTeacher.lastName[0]}
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-gray-800">
                    {selectedTeacher.lastName} {selectedTeacher.firstName}
                  </h3>
                  <span
                    className={`mt-1 inline-block rounded-full px-2 py-0.5 text-xs font-medium ${
                      selectedTeacher.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'
                    }`}
                  >
                    {selectedTeacher.status === 'active' ? 'Активен' : 'Неактивен'}
                  </span>
                </div>
              </div>
            </div>
            <div className="space-y-4 p-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-500">Email</p>
                  <p className="font-medium text-gray-800">{selectedTeacher.email}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Телефон</p>
                  <p className="font-medium text-gray-800">{selectedTeacher.phone}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Зарплата</p>
                  <p className="font-medium text-gray-800">{selectedTeacher.salary.toLocaleString()} ₽</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Групп</p>
                  <p className="font-medium text-gray-800">{selectedTeacher.groups.length}</p>
                </div>
              </div>
              <div>
                <p className="mb-2 text-sm text-gray-500">Предметы</p>
                <div className="flex flex-wrap gap-2">
                  {selectedTeacher.subjects.map((subject) => (
                    <span key={subject} className="rounded-full bg-indigo-50 px-3 py-1 text-sm font-medium text-indigo-700">
                      {subject}
                    </span>
                  ))}
                </div>
              </div>
              <div>
                <p className="mb-2 text-sm text-gray-500">Группы</p>
                <div className="flex flex-wrap gap-2">
                  {selectedTeacher.groups.map((group) => (
                    <span key={group} className="rounded-full bg-slate-100 px-3 py-1 text-sm font-medium text-slate-700">
                      {group}
                    </span>
                  ))}
                </div>
              </div>
            </div>
            <div className="flex justify-end gap-3 border-t border-gray-200 p-6">
              <button
                onClick={() => setSelectedTeacher(null)}
                className="rounded-lg border border-gray-300 px-4 py-2 transition-colors hover:bg-gray-50"
              >
                Закрыть
              </button>
              <button
                onClick={() => openEditForm(selectedTeacher)}
                className="rounded-lg bg-indigo-600 px-4 py-2 text-white transition-colors hover:bg-indigo-700"
              >
                Редактировать
              </button>
            </div>
          </div>
        </div>
      )}

      {isFormOpen && (
        <div className="fixed inset-0 z-[55] flex items-center justify-center bg-black bg-opacity-50 p-4">
          <form onSubmit={handleSubmit} className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-xl bg-white shadow-xl">
            <div className="border-b border-gray-200 p-6">
              <h3 className="text-xl font-semibold text-gray-800">
                {editingTeacher ? 'Редактировать преподавателя' : 'Добавить преподавателя'}
              </h3>
            </div>
            <div className="grid grid-cols-1 gap-4 p-6 md:grid-cols-2">
              <label className="block text-sm font-medium text-gray-700">
                Имя
                <input
                  required
                  type="text"
                  value={formData.firstName}
                  onChange={(event) => updateField('firstName', event.target.value)}
                  className="mt-2 w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500"
                />
              </label>
              <label className="block text-sm font-medium text-gray-700">
                Фамилия
                <input
                  required
                  type="text"
                  value={formData.lastName}
                  onChange={(event) => updateField('lastName', event.target.value)}
                  className="mt-2 w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500"
                />
              </label>
              <label className="block text-sm font-medium text-gray-700">
                Email
                <input
                  required
                  type="email"
                  value={formData.email}
                  onChange={(event) => updateField('email', event.target.value)}
                  className="mt-2 w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500"
                />
              </label>
              <label className="block text-sm font-medium text-gray-700">
                Телефон
                <input
                  required
                  type="tel"
                  value={formData.phone}
                  onChange={(event) => updateField('phone', event.target.value)}
                  className="mt-2 w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500"
                />
              </label>
              <label className="block text-sm font-medium text-gray-700 md:col-span-2">
                Предметы через запятую
                <input
                  required
                  type="text"
                  value={formData.subjects}
                  onChange={(event) => updateField('subjects', event.target.value)}
                  className="mt-2 w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500"
                />
              </label>
              <label className="block text-sm font-medium text-gray-700 md:col-span-2">
                Группы через запятую
                <input
                  type="text"
                  value={formData.groups}
                  onChange={(event) => updateField('groups', event.target.value)}
                  className="mt-2 w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500"
                />
              </label>
              <label className="block text-sm font-medium text-gray-700">
                Статус
                <select
                  value={formData.status}
                  onChange={(event) => updateField('status', event.target.value as Teacher['status'])}
                  className="mt-2 w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="active">Активен</option>
                  <option value="inactive">Неактивен</option>
                </select>
              </label>
              <label className="block text-sm font-medium text-gray-700">
                Зарплата, ₽
                <input
                  min="0"
                  type="number"
                  value={formData.salary}
                  onChange={(event) => updateField('salary', Number(event.target.value))}
                  className="mt-2 w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500"
                />
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
                {editingTeacher ? 'Сохранить' : 'Добавить'}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};