import React from 'react';
import { StudentsIcon, TeachersIcon, GroupsIcon, FinanceIcon, TrendUpIcon, TrendDownIcon, ExclamationIcon, CheckIcon } from './Icons';
import { dashboardStats, revenueData, groups, payments } from '../data/mockData';

const StatCard: React.FC<{
  title: string;
  value: string | number;
  change?: number;
  icon: React.FC<{ className?: string }>;
  color: string;
}> = ({ title, value, change, icon: Icon, color }) => (
  <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
    <div className="flex items-center justify-between">
      <div>
        <p className="text-sm text-gray-500 mb-1">{title}</p>
        <p className="text-2xl font-bold text-gray-800">{value}</p>
        {change !== undefined && (
          <div className={`flex items-center mt-2 text-sm ${change >= 0 ? 'text-green-600' : 'text-red-600'}`}>
            {change >= 0 ? <TrendUpIcon className="w-4 h-4 mr-1" /> : <TrendDownIcon className="w-4 h-4 mr-1" />}
            <span>{Math.abs(change)}% за месяц</span>
          </div>
        )}
      </div>
      <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${color}`}>
        <Icon className="w-6 h-6 text-white" />
      </div>
    </div>
  </div>
);

export const Dashboard: React.FC = () => {
  const activeGroups = groups.filter(g => g.status === 'active');
  const pendingPayments = payments.filter(p => p.status === 'pending');

  return (
    <div className="space-y-6">
      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
        <StatCard
          title="Всего студентов"
          value={dashboardStats.totalStudents}
          change={12}
          icon={StudentsIcon}
          color="bg-blue-500"
        />
        <StatCard
          title="Преподаватели"
          value={dashboardStats.totalTeachers}
          change={5}
          icon={TeachersIcon}
          color="bg-purple-500"
        />
        <StatCard
          title="Активные группы"
          value={dashboardStats.totalGroups}
          change={-3}
          icon={GroupsIcon}
          color="bg-emerald-500"
        />
        <StatCard
          title="Доход за месяц"
          value={`${(dashboardStats.monthlyRevenue / 1000).toFixed(0)}K ₽`}
          change={8}
          icon={FinanceIcon}
          color="bg-amber-500"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Revenue Chart */}
        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Динамика доходов</h3>
          <div className="h-64 flex items-end justify-between gap-2">
            {revenueData.map((item, index) => {
              const height = (item.revenue / 1500000) * 100;
              return (
                <div key={index} className="flex-1 flex flex-col items-center gap-2">
                  <div
                    className="w-full bg-gradient-to-t from-indigo-500 to-indigo-400 rounded-t-sm transition-all hover:from-indigo-600 hover:to-indigo-500"
                    style={{ height: `${Math.max(height, 2)}%` }}
                  />
                  <span className="text-xs text-gray-500">{item.month}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Active Groups */}
        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Активные группы</h3>
          <div className="space-y-4">
            {activeGroups.slice(0, 5).map((group) => (
              <div key={group.id} className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-gray-800">{group.name}</p>
                  <p className="text-sm text-gray-500">{group.course}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-medium text-gray-800">
                    {group.studentsCount}/{group.maxStudents}
                  </p>
                  <div className="w-24 h-2 bg-gray-200 rounded-full mt-1">
                    <div
                      className="h-full bg-indigo-500 rounded-full"
                      style={{ width: `${(group.studentsCount / group.maxStudents) * 100}%` }}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Pending Payments */}
        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-800">Ожидают оплаты</h3>
            <span className="px-2 py-1 bg-amber-100 text-amber-700 text-xs font-medium rounded-full">
              {pendingPayments.length} платежей
            </span>
          </div>
          <div className="space-y-3">
            {pendingPayments.slice(0, 5).map((payment) => (
              <div key={payment.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-amber-100 rounded-full flex items-center justify-center">
                    <ExclamationIcon className="w-5 h-5 text-amber-600" />
                  </div>
                  <div>
                    <p className="font-medium text-gray-800">{payment.studentName}</p>
                    <p className="text-sm text-gray-500">{payment.description}</p>
                  </div>
                </div>
                <p className="font-semibold text-gray-800">{payment.amount.toLocaleString()} ₽</p>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Activity */}
        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Последняя активность</h3>
          <div className="space-y-4">
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
                <CheckIcon className="w-4 h-4 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-gray-800">Новый студент <span className="font-medium">Александр Иванов</span> добавлен в группу П-101</p>
                <p className="text-xs text-gray-400">2 часа назад</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                <FinanceIcon className="w-4 h-4 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-gray-800">Получена оплата <span className="font-medium">15 000 ₽</span> от Дмитрия Сидорова</p>
                <p className="text-xs text-gray-400">5 часов назад</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center flex-shrink-0">
                <GroupsIcon className="w-4 h-4 text-purple-600" />
              </div>
              <div>
                <p className="text-sm text-gray-800">Создана новая группа <span className="font-medium">П-103</span> - Data Science</p>
                <p className="text-xs text-gray-400">Вчера</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 bg-amber-100 rounded-full flex items-center justify-center flex-shrink-0">
                <ExclamationIcon className="w-4 h-4 text-amber-600" />
              </div>
              <div>
                <p className="text-sm text-gray-800">Просрочена оплата для <span className="font-medium">Екатерины Козловой</span></p>
                <p className="text-xs text-gray-400">2 дня назад</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
