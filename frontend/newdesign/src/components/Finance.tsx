import React, { useMemo, useState } from 'react';
import { payments as initialPayments, revenueData, students as initialStudents } from '../data/mockData';
import { Payment } from '../types';
import { PlusIcon, TrendUpIcon, CheckIcon, ExclamationIcon, XCircleIcon, EyeIcon } from './Icons';

type PaymentFormState = {
  studentId: string;
  amount: number;
  date: string;
  status: Payment['status'];
  method: Payment['method'];
  description: string;
};

const StatusBadge: React.FC<{ status: Payment['status'] }> = ({ status }) => {
  const config = {
    completed: { label: 'Оплачен', icon: CheckIcon, className: 'bg-green-100 text-green-700' },
    pending: { label: 'Ожидает', icon: ExclamationIcon, className: 'bg-amber-100 text-amber-700' },
    failed: { label: 'Ошибка', icon: XCircleIcon, className: 'bg-red-100 text-red-700' },
  };
  const { label, icon: Icon, className } = config[status];

  return (
    <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${className}`}>
      <Icon className="h-3 w-3" />
      {label}
    </span>
  );
};

const methodLabels: Record<Payment['method'], string> = {
  cash: 'Наличные',
  card: 'Карта',
  transfer: 'Перевод',
};

export const Finance: React.FC = () => {
  const [paymentList, setPaymentList] = useState<Payment[]>(initialPayments);
  const [studentList, setStudentList] = useState(initialStudents);
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [selectedPayment, setSelectedPayment] = useState<Payment | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [remindedStudentIds, setRemindedStudentIds] = useState<string[]>([]);
  const [toast, setToast] = useState<string | null>(null);
  const [formData, setFormData] = useState<PaymentFormState>(() => ({
    studentId: initialStudents[0]?.id ?? '',
    amount: 15000,
    date: new Date().toISOString().slice(0, 10),
    status: 'completed',
    method: 'card',
    description: 'Оплата обучения',
  }));

  const filteredPayments = useMemo(
    () => (selectedStatus === 'all' ? paymentList : paymentList.filter((payment) => payment.status === selectedStatus)),
    [paymentList, selectedStatus],
  );

  const totalRevenue = paymentList.filter((payment) => payment.status === 'completed').reduce((sum, payment) => sum + payment.amount, 0);
  const pendingAmount = paymentList.filter((payment) => payment.status === 'pending').reduce((sum, payment) => sum + payment.amount, 0);
  const debtStudents = studentList.filter((student) => student.balance > 0);

  const showToast = (message: string) => {
    setToast(message);
    window.setTimeout(() => setToast(null), 2200);
  };

  const updateField = <K extends keyof PaymentFormState>(key: K, value: PaymentFormState[K]) => {
    setFormData((current) => ({ ...current, [key]: value }));
  };

  const markPaymentCompleted = (payment: Payment) => {
    const updatedPayment: Payment = { ...payment, status: 'completed' };
    setPaymentList((current) => current.map((item) => (item.id === payment.id ? updatedPayment : item)));
    setStudentList((current) =>
      current.map((student) =>
        student.id === payment.studentId ? { ...student, balance: 0, paymentStatus: 'paid' } : student,
      ),
    );
    setSelectedPayment((current) => (current?.id === payment.id ? updatedPayment : current));
    showToast('Платеж отмечен как оплаченный');
  };

  const sendReminder = (studentId: string, studentName: string) => {
    setRemindedStudentIds((current) => (current.includes(studentId) ? current : [...current, studentId]));
    showToast(`Напоминание отправлено: ${studentName}`);
  };

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const student = studentList.find((item) => item.id === formData.studentId);
    if (!student) return;

    const newPayment: Payment = {
      id: crypto.randomUUID(),
      studentId: student.id,
      studentName: `${student.firstName} ${student.lastName}`,
      amount: formData.amount,
      date: formData.date,
      status: formData.status,
      method: formData.method,
      description: formData.description,
    };

    setPaymentList((current) => [newPayment, ...current]);
    if (formData.status === 'completed') {
      setStudentList((current) =>
        current.map((item) =>
          item.id === student.id ? { ...item, balance: Math.max(item.balance - formData.amount, 0), paymentStatus: 'paid' } : item,
        ),
      );
    }

    setIsFormOpen(false);
    showToast('Платеж добавлен');
  };

  return (
    <div className="space-y-6">
      {toast && (
        <div className="fixed right-4 top-20 z-[60] rounded-lg bg-slate-900 px-4 py-3 text-sm font-medium text-white shadow-lg">
          {toast}
        </div>
      )}

      <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
        <div className="rounded-xl bg-gradient-to-br from-green-500 to-emerald-600 p-6 text-white">
          <p className="mb-1 text-sm text-green-100">Получено</p>
          <p className="text-2xl font-bold">{totalRevenue.toLocaleString()} ₽</p>
          <div className="mt-2 flex items-center text-sm text-green-100">
            <TrendUpIcon className="mr-1 h-4 w-4" />
            <span>+15% за месяц</span>
          </div>
        </div>
        <div className="rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 p-6 text-white">
          <p className="mb-1 text-sm text-amber-100">Ожидается</p>
          <p className="text-2xl font-bold">{pendingAmount.toLocaleString()} ₽</p>
          <p className="mt-2 text-sm text-amber-100">{paymentList.filter((payment) => payment.status === 'pending').length} платежей</p>
        </div>
        <div className="rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 p-6 text-white">
          <p className="mb-1 text-sm text-blue-100">Месячный доход</p>
          <p className="text-2xl font-bold">1 250 000 ₽</p>
          <p className="mt-2 text-sm text-blue-100">Октябрь 2024</p>
        </div>
        <div className="rounded-xl bg-gradient-to-br from-red-500 to-rose-600 p-6 text-white">
          <p className="mb-1 text-sm text-red-100">Должники</p>
          <p className="text-2xl font-bold">{debtStudents.length}</p>
          <p className="mt-2 text-sm text-red-100">Требуется действие</p>
        </div>
      </div>

      <div className="rounded-xl border border-gray-100 bg-white p-6 shadow-sm">
        <h3 className="mb-4 text-lg font-semibold text-gray-800">Динамика доходов по месяцам</h3>
        <div className="flex h-48 items-end justify-between gap-2">
          {revenueData.map((item) => {
            const height = (item.revenue / 1500000) * 100;
            return (
              <div key={item.month} className="flex flex-1 flex-col items-center gap-2">
                <div className="text-xs text-gray-500">{item.revenue > 0 ? `${(item.revenue / 1000).toFixed(0)}K` : ''}</div>
                <div className="w-full rounded-t-sm bg-gradient-to-t from-indigo-500 to-indigo-400" style={{ height: `${Math.max(height, 2)}%` }} />
                <span className="text-xs text-gray-500">{item.month}</span>
              </div>
            );
          })}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="rounded-xl border border-gray-100 bg-white shadow-sm">
          <div className="flex flex-col gap-3 border-b border-gray-100 p-4 sm:flex-row sm:items-center sm:justify-between">
            <h3 className="text-lg font-semibold text-gray-800">Платежи</h3>
            <div className="flex gap-2">
              <select
                value={selectedStatus}
                onChange={(event) => setSelectedStatus(event.target.value)}
                className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500"
              >
                <option value="all">Все</option>
                <option value="completed">Оплаченные</option>
                <option value="pending">Ожидающие</option>
                <option value="failed">Неуспешные</option>
              </select>
              <button
                onClick={() => setIsFormOpen(true)}
                className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-3 py-1.5 text-sm text-white transition-colors hover:bg-indigo-700"
              >
                <PlusIcon className="h-4 w-4" />
                Добавить
              </button>
            </div>
          </div>
          <div className="max-h-96 overflow-y-auto overflow-x-auto">
            <table className="w-full">
              <thead className="sticky top-0 bg-gray-50">
                <tr>
                  <th className="px-4 py-2 text-left text-xs font-semibold text-gray-600">Студент</th>
                  <th className="hidden px-4 py-2 text-left text-xs font-semibold text-gray-600 sm:table-cell">Дата</th>
                  <th className="px-4 py-2 text-right text-xs font-semibold text-gray-600">Сумма</th>
                  <th className="hidden px-4 py-2 text-center text-xs font-semibold text-gray-600 md:table-cell">Статус</th>
                  <th className="px-4 py-2 text-right text-xs font-semibold text-gray-600">Действия</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredPayments.map((payment) => (
                  <tr key={payment.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <p className="text-sm font-medium text-gray-800">{payment.studentName}</p>
                      <p className="text-xs text-gray-500 md:hidden">{payment.date}</p>
                    </td>
                    <td className="hidden px-4 py-3 text-sm text-gray-600 sm:table-cell">{payment.date}</td>
                    <td className="px-4 py-3 text-right font-medium text-gray-800">{payment.amount.toLocaleString()} ₽</td>
                    <td className="hidden px-4 py-3 text-center md:table-cell">
                      <StatusBadge status={payment.status} />
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex justify-end gap-2">
                        <button
                          onClick={() => setSelectedPayment(payment)}
                          className="rounded-lg p-2 text-gray-400 transition-colors hover:bg-indigo-50 hover:text-indigo-600"
                          aria-label="Открыть платеж"
                        >
                          <EyeIcon className="h-4 w-4" />
                        </button>
                        {payment.status !== 'completed' && (
                          <button
                            onClick={() => markPaymentCompleted(payment)}
                            className="rounded-lg px-2 py-1 text-xs font-medium text-green-700 transition-colors hover:bg-green-50"
                          >
                            Оплачен
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="rounded-xl border border-gray-100 bg-white shadow-sm">
          <div className="border-b border-gray-100 p-4">
            <h3 className="text-lg font-semibold text-gray-800">Студенты с задолженностью</h3>
          </div>
          <div className="space-y-3 p-4">
            {debtStudents.map((student) => (
              <div key={student.id} className="flex items-center justify-between rounded-lg border border-red-100 bg-red-50 p-3">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-red-400 to-rose-500 font-medium text-white">
                    {student.firstName[0]}
                    {student.lastName[0]}
                  </div>
                  <div>
                    <p className="font-medium text-gray-800">
                      {student.lastName} {student.firstName}
                    </p>
                    <p className="text-sm text-gray-500">{student.group}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-semibold text-red-600">{student.balance.toLocaleString()} ₽</p>
                  <button
                    onClick={() => sendReminder(student.id, `${student.lastName} ${student.firstName}`)}
                    className="text-xs text-indigo-600 hover:text-indigo-800"
                  >
                    {remindedStudentIds.includes(student.id) ? 'Отправлено' : 'Напомнить'}
                  </button>
                </div>
              </div>
            ))}
            {debtStudents.length === 0 && <p className="py-8 text-center text-gray-500">Нет студентов с задолженностью</p>}
          </div>
        </div>
      </div>

      {selectedPayment && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
          <div className="w-full max-w-lg rounded-xl bg-white shadow-xl">
            <div className="border-b border-gray-200 p-6">
              <h3 className="text-xl font-semibold text-gray-800">Платеж</h3>
              <p className="mt-1 text-sm text-gray-500">{selectedPayment.studentName}</p>
            </div>
            <div className="grid grid-cols-2 gap-4 p-6">
              <div>
                <p className="text-sm text-gray-500">Сумма</p>
                <p className="font-medium text-gray-800">{selectedPayment.amount.toLocaleString()} ₽</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Дата</p>
                <p className="font-medium text-gray-800">{selectedPayment.date}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Метод</p>
                <p className="font-medium text-gray-800">{methodLabels[selectedPayment.method]}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Статус</p>
                <div className="mt-1">
                  <StatusBadge status={selectedPayment.status} />
                </div>
              </div>
              <div className="col-span-2">
                <p className="text-sm text-gray-500">Описание</p>
                <p className="font-medium text-gray-800">{selectedPayment.description}</p>
              </div>
            </div>
            <div className="flex justify-end gap-3 border-t border-gray-200 p-6">
              {selectedPayment.status !== 'completed' && (
                <button
                  onClick={() => markPaymentCompleted(selectedPayment)}
                  className="rounded-lg bg-green-600 px-4 py-2 text-white transition-colors hover:bg-green-700"
                >
                  Отметить оплаченным
                </button>
              )}
              <button
                onClick={() => setSelectedPayment(null)}
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
          <form onSubmit={handleSubmit} className="w-full max-w-2xl rounded-xl bg-white shadow-xl">
            <div className="border-b border-gray-200 p-6">
              <h3 className="text-xl font-semibold text-gray-800">Добавить платеж</h3>
            </div>
            <div className="grid grid-cols-1 gap-4 p-6 md:grid-cols-2">
              <label className="block text-sm font-medium text-gray-700 md:col-span-2">
                Студент
                <select
                  value={formData.studentId}
                  onChange={(event) => updateField('studentId', event.target.value)}
                  className="mt-2 w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500"
                >
                  {studentList.map((student) => (
                    <option key={student.id} value={student.id}>
                      {student.lastName} {student.firstName} - {student.group}
                    </option>
                  ))}
                </select>
              </label>
              <label className="block text-sm font-medium text-gray-700">
                Сумма
                <input
                  required
                  min="1"
                  type="number"
                  value={formData.amount}
                  onChange={(event) => updateField('amount', Number(event.target.value))}
                  className="mt-2 w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500"
                />
              </label>
              <label className="block text-sm font-medium text-gray-700">
                Дата
                <input
                  required
                  type="date"
                  value={formData.date}
                  onChange={(event) => updateField('date', event.target.value)}
                  className="mt-2 w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500"
                />
              </label>
              <label className="block text-sm font-medium text-gray-700">
                Статус
                <select
                  value={formData.status}
                  onChange={(event) => updateField('status', event.target.value as Payment['status'])}
                  className="mt-2 w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="completed">Оплачен</option>
                  <option value="pending">Ожидает</option>
                  <option value="failed">Ошибка</option>
                </select>
              </label>
              <label className="block text-sm font-medium text-gray-700">
                Метод
                <select
                  value={formData.method}
                  onChange={(event) => updateField('method', event.target.value as Payment['method'])}
                  className="mt-2 w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="cash">Наличные</option>
                  <option value="card">Карта</option>
                  <option value="transfer">Перевод</option>
                </select>
              </label>
              <label className="block text-sm font-medium text-gray-700 md:col-span-2">
                Описание
                <input
                  required
                  type="text"
                  value={formData.description}
                  onChange={(event) => updateField('description', event.target.value)}
                  className="mt-2 w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500"
                />
              </label>
            </div>
            <div className="flex justify-end gap-3 border-t border-gray-200 p-6">
              <button
                type="button"
                onClick={() => setIsFormOpen(false)}
                className="rounded-lg border border-gray-300 px-4 py-2 transition-colors hover:bg-gray-50"
              >
                Отмена
              </button>
              <button type="submit" className="rounded-lg bg-indigo-600 px-4 py-2 text-white transition-colors hover:bg-indigo-700">
                Добавить
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};