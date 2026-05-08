import React, { useMemo, useState } from 'react';
import {
  PlusIcon,
  SearchIcon,
  EyeIcon,
  EditIcon,
  TrashIcon,
  CheckIcon,
  ExclamationIcon,
  XCircleIcon,
} from './Icons';
import { students as initialStudents, groups } from '../data/mockData';
import { Student } from '../types';

type StudentFormState = Omit<Student, 'id' | 'avatar'>;

const getDefaultGroup = () => groups.find((group) => group.status === 'active')?.name ?? groups[0]?.name ?? '';

const createEmptyStudentForm = (): StudentFormState => ({
  firstName: '',
  lastName: '',
  email: '',
  phone: '',
  group: getDefaultGroup(),
  status: 'active',
  enrollmentDate: new Date().toISOString().slice(0, 10),
  paymentStatus: 'pending',
  balance: 0,
});

const StatusBadge: React.FC<{ status: Student['status'] }> = ({ status }) => {
  const config = {
    active: { label: 'Активен', className: 'bg-green-100 text-green-700' },
    inactive: { label: 'Неактивен', className: 'bg-gray-100 text-gray-700' },
    graduated: { label: 'Выпустился', className: 'bg-blue-100 text-blue-700' },
  };
  const { label, className } = config[status];

  return <span className={`px-2 py-1 rounded-full text-xs font-medium ${className}`}>{label}</span>;
};

const PaymentBadge: React.FC<{ status: Student['paymentStatus'] }> = ({ status }) => {
  const config = {
    paid: { label: 'Оплачен', icon: CheckIcon, className: 'bg-green-100 text-green-700' },
    pending: { label: 'Ожидает', icon: ExclamationIcon, className: 'bg-amber-100 text-amber-700' },
    overdue: { label: 'Просрочен', icon: XCircleIcon, className: 'bg-red-100 text-red-700' },
  };
  const { label, icon: Icon, className } = config[status];

  return (
    <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${className}`}>
      <Icon className="w-3 h-3" />
      {label}
    </span>
  );
};

export const Students: React.FC = () => {
  const [studentList, setStudentList] = useState<Student[]>(initialStudents);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [editingStudent, setEditingStudent] = useState<Student | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [formData, setFormData] = useState<StudentFormState>(() => createEmptyStudentForm());
  const [toast, setToast] = useState<string | null>(null);

  const showToast = (message: string) => {
    setToast(message);
    window.setTimeout(() => setToast(null), 2200);
  };

  const filteredStudents = useMemo(
    () =>
      studentList.filter((student) => {
        const fullName = `${student.lastName} ${student.firstName}`.toLowerCase();
        const query = searchTerm.toLowerCase();
        const matchesSearch = fullName.includes(query) || student.email.toLowerCase().includes(query) || student.phone.includes(query);
        const matchesStatus = selectedStatus === 'all' || student.status === selectedStatus;

        return matchesSearch && matchesStatus;
      }),
    [studentList, searchTerm, selectedStatus],
  );

  const updateField = <K extends keyof StudentFormState>(key: K, value: StudentFormState[K]) => {
    setFormData((current) => ({ ...current, [key]: value }));
  };

  const openAddForm = () => {
    setEditingStudent(null);
    setFormData(createEmptyStudentForm());
    setIsFormOpen(true);
  };

  const openEditForm = (student: Student) => {
    setEditingStudent(student);
    setFormData({
      firstName: student.firstName,
      lastName: student.lastName,
      email: student.email,
      phone: student.phone,
      group: student.group,
      status: student.status,
      enrollmentDate: student.enrollmentDate,
      paymentStatus: student.paymentStatus,
      balance: student.balance,
    });
    setIsFormOpen(true);
  };

  const closeForm = () => {
    setIsFormOpen(false);
    setEditingStudent(null);
  };

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (editingStudent) {
      const updatedStudent: Student = { ...editingStudent, ...formData };
      setStudentList((current) => current.map((student) => (student.id === editingStudent.id ? updatedStudent : student)));
      setSelectedStudent((current) => (current?.id === editingStudent.id ? updatedStudent : current));
      showToast('Данные студента обновлены');
    } else {
      const newStudent: Student = {
        id: crypto.randomUUID(),
        ...formData,
      };
      setStudentList((current) => [newStudent, ...current]);
      showToast('Студент добавлен');
    }

    closeForm();
  };

  const handleDelete = (student: Student) => {
    const isConfirmed = window.confirm(`Удалить студента ${student.lastName} ${student.firstName}?`);
    if (!isConfirmed) return;

    setStudentList((current) => current.filter((item) => item.id !== student.id));
    setSelectedStudent((current) => (current?.id === student.id ? null : current));
    showToast('Студент удален');
  };

  const handleMarkPaid = (student: Student) => {
    const updatedStudent: Student = { ...student, paymentStatus: 'paid', balance: 0 };
    setStudentList((current) => current.map((item) => (item.id === student.id ? updatedStudent : item)));
    setSelectedStudent((current) => (current?.id === student.id ? updatedStudent : current));
    showToast('Оплата отмечена');
  };

  return (
    <div className="space-y-6">
      {toast && (
        <div className="fixed right-4 top-20 z-[60] rounded-lg bg-slate-900 px-4 py-3 text-sm font-medium text-white shadow-lg">
          {toast}
        </div>
      )}

      <div className="rounded-2xl bg-gradient-to-br from-indigo-600 to-slate-900 p-6 text-white shadow-sm">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-sm font-medium text-indigo-100">Страница студентов</p>
            <h2 className="mt-2 text-2xl font-bold">Управление студентами и оплатами</h2>
            <p className="mt-2 max-w-2xl text-sm text-indigo-100">
              Добавляйте студентов, редактируйте карточки, отслеживайте группы, статусы и задолженности.
            </p>
          </div>
          <div className="grid grid-cols-3 gap-3 text-center">
            <div>
              <p className="text-2xl font-bold">{studentList.length}</p>
              <p className="text-xs text-indigo-100">всего</p>
            </div>
            <div>
              <p className="text-2xl font-bold">{studentList.filter((student) => student.status === 'active').length}</p>
              <p className="text-xs text-indigo-100">активных</p>
            </div>
            <div>
              <p className="text-2xl font-bold">{studentList.filter((student) => student.balance > 0).length}</p>
              <p className="text-xs text-indigo-100">с долгом</p>
            </div>
          </div>
        </div>
      </div>

      <div className="flex flex-col justify-between gap-4 sm:flex-row">
        <div className="flex flex-col gap-3 sm:flex-row">
          <div className="relative">
            <SearchIcon className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Поиск студентов..."
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
              className="w-full rounded-lg border border-gray-300 py-2 pl-10 pr-4 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500 sm:w-64"
            />
          </div>
          <select
            value={selectedStatus}
            onChange={(event) => setSelectedStatus(event.target.value)}
            className="rounded-lg border border-gray-300 px-4 py-2 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500"
          >
            <option value="all">Все статусы</option>
            <option value="active">Активные</option>
            <option value="inactive">Неактивные</option>
            <option value="graduated">Выпустились</option>
          </select>
        </div>
        <button
          onClick={openAddForm}
          className="inline-flex items-center justify-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-white transition-colors hover:bg-indigo-700"
        >
          <PlusIcon className="h-5 w-5" />
          <span>Добавить студента</span>
        </button>
      </div>

      <div className="overflow-hidden rounded-xl border border-gray-100 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="border-b border-gray-200 bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-600">Студент</th>
                <th className="hidden px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-600 md:table-cell">Группа</th>
                <th className="hidden px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-600 lg:table-cell">Контакты</th>
                <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-600">Статус</th>
                <th className="hidden px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-600 sm:table-cell">Оплата</th>
                <th className="px-6 py-3 text-right text-xs font-semibold uppercase tracking-wider text-gray-600">Действия</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filteredStudents.map((student) => (
                <tr key={student.id} className="transition-colors hover:bg-gray-50">
                  <td className="whitespace-nowrap px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-indigo-400 to-purple-500 font-medium text-white">
                        {student.firstName[0]}
                        {student.lastName[0]}
                      </div>
                      <div>
                        <p className="font-medium text-gray-800">
                          {student.lastName} {student.firstName}
                        </p>
                        <p className="text-sm text-gray-500 md:hidden">{student.group}</p>
                      </div>
                    </div>
                  </td>
                  <td className="hidden whitespace-nowrap px-6 py-4 md:table-cell">
                    <span className="rounded bg-slate-100 px-2 py-1 text-sm font-medium text-slate-700">{student.group}</span>
                  </td>
                  <td className="hidden whitespace-nowrap px-6 py-4 lg:table-cell">
                    <p className="text-sm text-gray-800">{student.email}</p>
                    <p className="text-sm text-gray-500">{student.phone}</p>
                  </td>
                  <td className="whitespace-nowrap px-6 py-4">
                    <StatusBadge status={student.status} />
                  </td>
                  <td className="hidden whitespace-nowrap px-6 py-4 sm:table-cell">
                    <PaymentBadge status={student.paymentStatus} />
                  </td>
                  <td className="whitespace-nowrap px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => setSelectedStudent(student)}
                        className="rounded-lg p-2 text-gray-400 transition-colors hover:bg-indigo-50 hover:text-indigo-600"
                        aria-label="Открыть карточку студента"
                      >
                        <EyeIcon className="h-5 w-5" />
                      </button>
                      <button
                        onClick={() => openEditForm(student)}
                        className="rounded-lg p-2 text-gray-400 transition-colors hover:bg-indigo-50 hover:text-indigo-600"
                        aria-label="Редактировать студента"
                      >
                        <EditIcon className="h-5 w-5" />
                      </button>
                      <button
                        onClick={() => handleDelete(student)}
                        className="rounded-lg p-2 text-gray-400 transition-colors hover:bg-red-50 hover:text-red-600"
                        aria-label="Удалить студента"
                      >
                        <TrashIcon className="h-5 w-5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {filteredStudents.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-6 py-10 text-center text-gray-500">
                    Студенты не найдены. Измените фильтр или добавьте нового студента.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {selectedStudent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
          <div className="max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-xl bg-white shadow-xl">
            <div className="border-b border-gray-200 bg-slate-50 p-6">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-4">
                  <div className="flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-indigo-400 to-purple-500 text-xl font-medium text-white">
                    {selectedStudent.firstName[0]}
                    {selectedStudent.lastName[0]}
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold text-gray-800">
                      {selectedStudent.lastName} {selectedStudent.firstName}
                    </h3>
                    <div className="mt-2 flex flex-wrap gap-2">
                      <StatusBadge status={selectedStudent.status} />
                      <PaymentBadge status={selectedStudent.paymentStatus} />
                    </div>
                  </div>
                </div>
                <div className="text-left sm:text-right">
                  <p className="text-sm text-gray-500">Баланс</p>
                  <p className={`text-2xl font-bold ${selectedStudent.balance > 0 ? 'text-red-600' : 'text-green-600'}`}>
                    {selectedStudent.balance.toLocaleString()} ₽
                  </p>
                </div>
              </div>
            </div>
            <div className="p-6">
              <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                <div className="rounded-lg bg-gray-50 p-4">
                  <p className="text-sm text-gray-500">Email</p>
                  <p className="mt-1 font-medium text-gray-800">{selectedStudent.email}</p>
                </div>
                <div className="rounded-lg bg-gray-50 p-4">
                  <p className="text-sm text-gray-500">Телефон</p>
                  <p className="mt-1 font-medium text-gray-800">{selectedStudent.phone}</p>
                </div>
                <div className="rounded-lg bg-gray-50 p-4">
                  <p className="text-sm text-gray-500">Группа</p>
                  <p className="mt-1 font-medium text-gray-800">{selectedStudent.group}</p>
                </div>
                <div className="rounded-lg bg-gray-50 p-4">
                  <p className="text-sm text-gray-500">Дата зачисления</p>
                  <p className="mt-1 font-medium text-gray-800">{selectedStudent.enrollmentDate}</p>
                </div>
                <div className="rounded-lg bg-gray-50 p-4">
                  <p className="text-sm text-gray-500">Статус</p>
                  <div className="mt-2">
                    <StatusBadge status={selectedStudent.status} />
                  </div>
                </div>
                <div className="rounded-lg bg-gray-50 p-4">
                  <p className="text-sm text-gray-500">Оплата</p>
                  <div className="mt-2">
                    <PaymentBadge status={selectedStudent.paymentStatus} />
                  </div>
                </div>
              </div>
            </div>
            <div className="flex flex-col justify-end gap-3 border-t border-gray-200 p-6 sm:flex-row">
              {selectedStudent.balance > 0 && (
                <button
                  onClick={() => handleMarkPaid(selectedStudent)}
                  className="rounded-lg bg-green-600 px-4 py-2 text-white transition-colors hover:bg-green-700"
                >
                  Отметить оплату
                </button>
              )}
              <button
                onClick={() => openEditForm(selectedStudent)}
                className="rounded-lg bg-indigo-600 px-4 py-2 text-white transition-colors hover:bg-indigo-700"
              >
                Редактировать
              </button>
              <button
                onClick={() => setSelectedStudent(null)}
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
              <h3 className="text-xl font-semibold text-gray-800">
                {editingStudent ? 'Редактировать студента' : 'Добавить студента'}
              </h3>
              <p className="mt-1 text-sm text-gray-500">Заполните основные данные карточки студента.</p>
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
              <label className="block text-sm font-medium text-gray-700">
                Группа
                <select
                  value={formData.group}
                  onChange={(event) => updateField('group', event.target.value)}
                  className="mt-2 w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500"
                >
                  {groups.map((group) => (
                    <option key={group.id} value={group.name}>
                      {group.name} - {group.course}
                    </option>
                  ))}
                </select>
              </label>
              <label className="block text-sm font-medium text-gray-700">
                Дата зачисления
                <input
                  required
                  type="date"
                  value={formData.enrollmentDate}
                  onChange={(event) => updateField('enrollmentDate', event.target.value)}
                  className="mt-2 w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500"
                />
              </label>
              <label className="block text-sm font-medium text-gray-700">
                Статус
                <select
                  value={formData.status}
                  onChange={(event) => updateField('status', event.target.value as Student['status'])}
                  className="mt-2 w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="active">Активен</option>
                  <option value="inactive">Неактивен</option>
                  <option value="graduated">Выпустился</option>
                </select>
              </label>
              <label className="block text-sm font-medium text-gray-700">
                Статус оплаты
                <select
                  value={formData.paymentStatus}
                  onChange={(event) => updateField('paymentStatus', event.target.value as Student['paymentStatus'])}
                  className="mt-2 w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="paid">Оплачен</option>
                  <option value="pending">Ожидает</option>
                  <option value="overdue">Просрочен</option>
                </select>
              </label>
              <label className="block text-sm font-medium text-gray-700 md:col-span-2">
                Баланс, ₽
                <input
                  min="0"
                  type="number"
                  value={formData.balance}
                  onChange={(event) => updateField('balance', Number(event.target.value))}
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
                {editingStudent ? 'Сохранить' : 'Добавить'}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};