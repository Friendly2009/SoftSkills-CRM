import React, { useMemo, useState } from 'react';
import { PlusIcon, SearchIcon, EyeIcon, EditIcon, TrashIcon } from './Icons';
import { groups as initialGroups } from '../data/mockData';
import { Group } from '../types';

type GroupFormState = Omit<Group, 'id'>;

const createEmptyGroupForm = (): GroupFormState => ({
  name: '',
  course: '',
  teacher: '',
  studentsCount: 0,
  maxStudents: 15,
  startDate: new Date().toISOString().slice(0, 10),
  endDate: new Date().toISOString().slice(0, 10),
  schedule: '',
  status: 'upcoming',
  room: '',
});

const StatusBadge: React.FC<{ status: Group['status'] }> = ({ status }) => {
  const config = {
    active: { label: 'Активна', className: 'bg-green-100 text-green-700' },
    completed: { label: 'Завершена', className: 'bg-gray-100 text-gray-700' },
    upcoming: { label: 'Предстоит', className: 'bg-blue-100 text-blue-700' },
  };
  const { label, className } = config[status];

  return <span className={`px-2 py-1 rounded-full text-xs font-medium ${className}`}>{label}</span>;
};

export const Groups: React.FC = () => {
  const [groupList, setGroupList] = useState<Group[]>(initialGroups);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [selectedGroup, setSelectedGroup] = useState<Group | null>(null);
  const [editingGroup, setEditingGroup] = useState<Group | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [formData, setFormData] = useState<GroupFormState>(() => createEmptyGroupForm());
  const [toast, setToast] = useState<string | null>(null);

  const showToast = (message: string) => {
    setToast(message);
    window.setTimeout(() => setToast(null), 2200);
  };

  const filteredGroups = useMemo(
    () =>
      groupList.filter((group) => {
        const query = searchTerm.toLowerCase();
        const matchesSearch =
          group.name.toLowerCase().includes(query) ||
          group.course.toLowerCase().includes(query) ||
          group.teacher.toLowerCase().includes(query);
        const matchesStatus = selectedStatus === 'all' || group.status === selectedStatus;

        return matchesSearch && matchesStatus;
      }),
    [groupList, searchTerm, selectedStatus],
  );

  const updateField = <K extends keyof GroupFormState>(key: K, value: GroupFormState[K]) => {
    setFormData((current) => ({ ...current, [key]: value }));
  };

  const openAddForm = () => {
    setEditingGroup(null);
    setFormData(createEmptyGroupForm());
    setIsFormOpen(true);
  };

  const openEditForm = (group: Group) => {
    setEditingGroup(group);
    setFormData({
      name: group.name,
      course: group.course,
      teacher: group.teacher,
      studentsCount: group.studentsCount,
      maxStudents: group.maxStudents,
      startDate: group.startDate,
      endDate: group.endDate,
      schedule: group.schedule,
      status: group.status,
      room: group.room,
    });
    setIsFormOpen(true);
  };

  const closeForm = () => {
    setIsFormOpen(false);
    setEditingGroup(null);
  };

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (editingGroup) {
      const updatedGroup: Group = { ...editingGroup, ...formData };
      setGroupList((current) => current.map((group) => (group.id === editingGroup.id ? updatedGroup : group)));
      setSelectedGroup((current) => (current?.id === editingGroup.id ? updatedGroup : current));
      showToast('Группа обновлена');
    } else {
      const newGroup: Group = { id: crypto.randomUUID(), ...formData };
      setGroupList((current) => [newGroup, ...current]);
      showToast('Группа создана');
    }

    closeForm();
  };

  const handleDelete = (group: Group) => {
    const isConfirmed = window.confirm(`Удалить группу ${group.name}?`);
    if (!isConfirmed) return;

    setGroupList((current) => current.filter((item) => item.id !== group.id));
    setSelectedGroup((current) => (current?.id === group.id ? null : current));
    showToast('Группа удалена');
  };

  return (
    <div className="space-y-6">
      {toast && (
        <div className="fixed right-4 top-20 z-[60] rounded-lg bg-slate-900 px-4 py-3 text-sm font-medium text-white shadow-lg">
          {toast}
        </div>
      )}

      <div className="flex flex-col justify-between gap-4 sm:flex-row">
        <div className="flex flex-col gap-3 sm:flex-row">
          <div className="relative">
            <SearchIcon className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Поиск групп..."
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
            <option value="upcoming">Предстоящие</option>
            <option value="completed">Завершенные</option>
          </select>
        </div>
        <button
          onClick={openAddForm}
          className="inline-flex items-center justify-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-white transition-colors hover:bg-indigo-700"
        >
          <PlusIcon className="h-5 w-5" />
          <span>Создать группу</span>
        </button>
      </div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
        {filteredGroups.map((group) => (
          <div key={group.id} className="overflow-hidden rounded-xl border border-gray-100 bg-white shadow-sm transition-shadow hover:shadow-md">
            <div className="p-6">
              <div className="mb-4 flex items-start justify-between">
                <div>
                  <h3 className="text-lg font-semibold text-gray-800">{group.name}</h3>
                  <p className="text-sm text-gray-500">{group.course}</p>
                </div>
                <StatusBadge status={group.status} />
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-500">Преподаватель</span>
                  <span className="font-medium text-gray-800">{group.teacher}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-500">Расписание</span>
                  <span className="font-medium text-gray-800">{group.schedule}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-500">Аудитория</span>
                  <span className="font-medium text-gray-800">{group.room}</span>
                </div>
                <div>
                  <div className="mb-1 flex items-center justify-between text-sm">
                    <span className="text-gray-500">Студенты</span>
                    <span className="font-medium text-gray-800">
                      {group.studentsCount}/{group.maxStudents}
                    </span>
                  </div>
                  <div className="h-2 w-full rounded-full bg-gray-200">
                    <div
                      className={`h-full rounded-full ${
                        group.studentsCount >= group.maxStudents
                          ? 'bg-red-500'
                          : group.studentsCount >= group.maxStudents * 0.8
                            ? 'bg-amber-500'
                            : 'bg-green-500'
                      }`}
                      style={{ width: `${Math.min((group.studentsCount / group.maxStudents) * 100, 100)}%` }}
                    />
                  </div>
                </div>
              </div>

              <div className="mt-4 flex items-center justify-between border-t border-gray-100 pt-4">
                <span className="text-xs text-gray-400">
                  {group.startDate} - {group.endDate}
                </span>
                <div className="flex gap-1">
                  <button
                    onClick={() => setSelectedGroup(group)}
                    className="rounded-lg p-2 text-gray-400 transition-colors hover:bg-indigo-50 hover:text-indigo-600"
                    aria-label="Открыть группу"
                  >
                    <EyeIcon className="h-5 w-5" />
                  </button>
                  <button
                    onClick={() => openEditForm(group)}
                    className="rounded-lg p-2 text-gray-400 transition-colors hover:bg-indigo-50 hover:text-indigo-600"
                    aria-label="Редактировать группу"
                  >
                    <EditIcon className="h-5 w-5" />
                  </button>
                  <button
                    onClick={() => handleDelete(group)}
                    className="rounded-lg p-2 text-gray-400 transition-colors hover:bg-red-50 hover:text-red-600"
                    aria-label="Удалить группу"
                  >
                    <TrashIcon className="h-5 w-5" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {selectedGroup && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
          <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-xl bg-white shadow-xl">
            <div className="border-b border-gray-200 p-6">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="text-xl font-semibold text-gray-800">{selectedGroup.name}</h3>
                  <p className="text-gray-500">{selectedGroup.course}</p>
                </div>
                <StatusBadge status={selectedGroup.status} />
              </div>
            </div>
            <div className="space-y-4 p-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-500">Преподаватель</p>
                  <p className="font-medium text-gray-800">{selectedGroup.teacher}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Аудитория</p>
                  <p className="font-medium text-gray-800">{selectedGroup.room}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Начало</p>
                  <p className="font-medium text-gray-800">{selectedGroup.startDate}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Окончание</p>
                  <p className="font-medium text-gray-800">{selectedGroup.endDate}</p>
                </div>
                <div className="col-span-2">
                  <p className="text-sm text-gray-500">Расписание</p>
                  <p className="font-medium text-gray-800">{selectedGroup.schedule}</p>
                </div>
              </div>
              <div>
                <p className="mb-2 text-sm text-gray-500">Заполненность</p>
                <div className="flex items-center gap-3">
                  <div className="h-3 flex-1 rounded-full bg-gray-200">
                    <div
                      className="h-full rounded-full bg-indigo-500"
                      style={{ width: `${Math.min((selectedGroup.studentsCount / selectedGroup.maxStudents) * 100, 100)}%` }}
                    />
                  </div>
                  <span className="font-medium text-gray-800">
                    {selectedGroup.studentsCount}/{selectedGroup.maxStudents}
                  </span>
                </div>
              </div>
            </div>
            <div className="flex justify-end gap-3 border-t border-gray-200 p-6">
              <button
                onClick={() => setSelectedGroup(null)}
                className="rounded-lg border border-gray-300 px-4 py-2 transition-colors hover:bg-gray-50"
              >
                Закрыть
              </button>
              <button
                onClick={() => openEditForm(selectedGroup)}
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
              <h3 className="text-xl font-semibold text-gray-800">{editingGroup ? 'Редактировать группу' : 'Создать группу'}</h3>
            </div>
            <div className="grid grid-cols-1 gap-4 p-6 md:grid-cols-2">
              <label className="block text-sm font-medium text-gray-700">
                Название группы
                <input
                  required
                  type="text"
                  value={formData.name}
                  onChange={(event) => updateField('name', event.target.value)}
                  className="mt-2 w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500"
                />
              </label>
              <label className="block text-sm font-medium text-gray-700">
                Курс
                <input
                  required
                  type="text"
                  value={formData.course}
                  onChange={(event) => updateField('course', event.target.value)}
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
                Аудитория
                <input
                  required
                  type="text"
                  value={formData.room}
                  onChange={(event) => updateField('room', event.target.value)}
                  className="mt-2 w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500"
                />
              </label>
              <label className="block text-sm font-medium text-gray-700 md:col-span-2">
                Расписание
                <input
                  required
                  type="text"
                  value={formData.schedule}
                  onChange={(event) => updateField('schedule', event.target.value)}
                  placeholder="Например: Пн, Ср, Пт 18:00-20:00"
                  className="mt-2 w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500"
                />
              </label>
              <label className="block text-sm font-medium text-gray-700">
                Студентов
                <input
                  min="0"
                  type="number"
                  value={formData.studentsCount}
                  onChange={(event) => updateField('studentsCount', Number(event.target.value))}
                  className="mt-2 w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500"
                />
              </label>
              <label className="block text-sm font-medium text-gray-700">
                Максимум студентов
                <input
                  min="1"
                  type="number"
                  value={formData.maxStudents}
                  onChange={(event) => updateField('maxStudents', Number(event.target.value))}
                  className="mt-2 w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500"
                />
              </label>
              <label className="block text-sm font-medium text-gray-700">
                Начало
                <input
                  required
                  type="date"
                  value={formData.startDate}
                  onChange={(event) => updateField('startDate', event.target.value)}
                  className="mt-2 w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500"
                />
              </label>
              <label className="block text-sm font-medium text-gray-700">
                Окончание
                <input
                  required
                  type="date"
                  value={formData.endDate}
                  onChange={(event) => updateField('endDate', event.target.value)}
                  className="mt-2 w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500"
                />
              </label>
              <label className="block text-sm font-medium text-gray-700 md:col-span-2">
                Статус
                <select
                  value={formData.status}
                  onChange={(event) => updateField('status', event.target.value as Group['status'])}
                  className="mt-2 w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="active">Активная</option>
                  <option value="upcoming">Предстоит</option>
                  <option value="completed">Завершена</option>
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
                {editingGroup ? 'Сохранить' : 'Создать'}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};