import React, { useState } from 'react';
import { grades, students, groups } from '../data/mockData';

export const Grades: React.FC = () => {
  const [selectedGroup, setSelectedGroup] = useState<string>('all');
  const [selectedSubject, setSelectedSubject] = useState<string>('all');

  // Get unique subjects
  const subjects = [...new Set(grades.map((g) => g.subject))];

  // Get students from selected group
  const groupStudents = selectedGroup === 'all'
    ? students.filter(s => s.status === 'active')
    : students.filter((s) => s.group === selectedGroup && s.status === 'active');

  // Filter grades
  const filteredGrades = grades.filter((grade) => {
    const matchesSubject = selectedSubject === 'all' || grade.subject === selectedSubject;
    const matchesStudent = groupStudents.some(s => `${s.lastName} ${s.firstName}` === grade.studentName);
    return matchesSubject && matchesStudent;
  });

  // Group grades by student
  const gradesByStudent = groupStudents.map((student) => {
    const studentGrades = filteredGrades.filter(
      (g) => g.studentName === `${student.lastName} ${student.firstName}`
    );
    return {
      student,
      grades: studentGrades,
      average: studentGrades.length > 0
        ? studentGrades.reduce((sum, g) => sum + g.value, 0) / studentGrades.length
        : 0,
    };
  });

  const getGradeColor = (value: number) => {
    if (value === 5) return 'bg-green-100 text-green-700';
    if (value === 4) return 'bg-blue-100 text-blue-700';
    if (value === 3) return 'bg-amber-100 text-amber-700';
    return 'bg-red-100 text-red-700';
  };

  return (
    <div className="space-y-6">
      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <select
          value={selectedGroup}
          onChange={(e) => setSelectedGroup(e.target.value)}
          className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
        >
          <option value="all">Все группы</option>
          {groups.filter(g => g.status === 'active').map((group) => (
            <option key={group.id} value={group.name}>{group.name}</option>
          ))}
        </select>
        <select
          value={selectedSubject}
          onChange={(e) => setSelectedSubject(e.target.value)}
          className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
        >
          <option value="all">Все предметы</option>
          {subjects.map((subject) => (
            <option key={subject} value={subject}>{subject}</option>
          ))}
        </select>
      </div>

      {/* Grades Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Студент
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider hidden md:table-cell">
                  Группа
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Оценки
                </th>
                <th className="px-6 py-3 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Средний балл
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {gradesByStudent.map(({ student, grades, average }) => (
                <tr key={student.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-gradient-to-br from-indigo-400 to-purple-500 rounded-full flex items-center justify-center text-white font-medium">
                        {student.firstName[0]}{student.lastName[0]}
                      </div>
                      <div>
                        <p className="font-medium text-gray-800">{student.lastName} {student.firstName}</p>
                        <p className="text-sm text-gray-500 md:hidden">{student.group}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap hidden md:table-cell">
                    <span className="px-2 py-1 bg-slate-100 text-slate-700 rounded text-sm font-medium">
                      {student.group}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex flex-wrap gap-2">
                      {grades.length > 0 ? (
                        grades.map((grade) => (
                          <div key={grade.id} className="group relative">
                            <span className={`inline-flex items-center justify-center w-8 h-8 rounded-full text-sm font-semibold ${getGradeColor(grade.value)}`}>
                              {grade.value}
                            </span>
                            <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-gray-800 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-10">
                              {grade.date}
                              {grade.comment && <><br />{grade.comment}</>}
                            </div>
                          </div>
                        ))
                      ) : (
                        <span className="text-sm text-gray-400">Нет оценок</span>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-center">
                    {average > 0 ? (
                      <span className={`inline-flex items-center justify-center w-10 h-10 rounded-full text-sm font-bold ${getGradeColor(Math.round(average))}`}>
                        {average.toFixed(1)}
                      </span>
                    ) : (
                      <span className="text-sm text-gray-400">—</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <p className="text-sm text-gray-500 mb-1">Отличников</p>
          <p className="text-2xl font-bold text-green-600">
            {gradesByStudent.filter((g) => g.average >= 4.5).length}
          </p>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <p className="text-sm text-gray-500 mb-1">Хорошистов</p>
          <p className="text-2xl font-bold text-blue-600">
            {gradesByStudent.filter((g) => g.average >= 3.5 && g.average < 4.5).length}
          </p>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <p className="text-sm text-gray-500 mb-1">Троечников</p>
          <p className="text-2xl font-bold text-amber-600">
            {gradesByStudent.filter((g) => g.average >= 2.5 && g.average < 3.5).length}
          </p>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <p className="text-sm text-gray-500 mb-1">Средний балл</p>
          <p className="text-2xl font-bold text-indigo-600">
            {gradesByStudent.filter(g => g.average > 0).length > 0
              ? (gradesByStudent.filter(g => g.average > 0).reduce((sum, g) => sum + g.average, 0) / 
                 gradesByStudent.filter(g => g.average > 0).length).toFixed(1)
              : '—'}
          </p>
        </div>
      </div>
    </div>
  );
};
