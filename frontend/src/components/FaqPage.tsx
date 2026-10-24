import React, { useState } from "react";
import { useNavigate } from "react-router-dom";

export const FaqPage: React.FC = () => {
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(true);

  return (
    <div className="min-h-screen bg-gray-50 text-gray-800 p-6 flex flex-col items-center">
      <div className="w-full max-w-4xl flex items-center justify-between mb-8 border-b pb-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-950">База знаний & FAQ</h1>
          <p className="text-gray-500 mt-1">Ответы на частые вопросы по настройке Soft-Skills CRM</p>
        </div>
        <button 
          onClick={() => navigate(-1)} 
          className="px-4 py-2 bg-white border rounded-lg shadow-sm hover:bg-gray-50 transition text-sm font-medium"
        >
          ← Назад
        </button>
      </div>

      <div className="w-full max-w-4xl space-y-4">
        
        <div className="bg-white rounded-xl shadow-sm border overflow-hidden transition-all">
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="w-full text-left p-5 font-semibold text-lg flex justify-between items-center bg-gray-50/50 hover:bg-gray-50 transition"
          >
            <span>Как перенести клиентов, лидов и сотрудников из Alpha CRM через Excel?</span>
            <span className={`text-xl transform transition-transform ${isOpen ? "rotate-180" : ""}`}>
              ▼
            </span>
          </button>

          {isOpen && (
            <div className="p-6 border-t space-y-6 text-sm leading-relaxed text-gray-650">
              
              <div>
                <h3 className="text-base font-bold text-gray-900 mb-3 flex items-center">
                  <span className="bg-blue-100 text-blue-700 px-2 py-0.5 rounded text-xs mr-2">Шаг 1</span>
                  Экспорт данных из Alpha CRM
                </h3>
                <p className="mb-2">Чтобы забрать таблицы из вашей старой системы Alpha CRM, выполните следующие действия:</p>
                <ul className="list-disc pl-5 space-y-2 text-gray-600">
                  <li>
                    <strong>Клиенты и Лиды:</strong> Перейдите в левом меню в раздел <span className="font-medium text-gray-900">«Клиенты»</span> (или «Лиды»). В правом верхнем углу над списком нажмите кнопку <span className="font-medium text-gray-900">«Экспорт»</span>. Выберите формат <span className="text-green-700 font-medium">Excel (.xlsx)</span>. Убедитесь, что выгружаете все активные столбцы (ФИО, Телефон, Email, Статус).
                  </li>
                  <li>
                    <strong>Сотрудники (Педагоги):</strong> Перейдите в раздел <span className="font-medium text-gray-900">«Настройки системы» → «Сотрудники»</span>. Аналогично нажмите кнопку <span className="font-medium text-gray-900">«Экспорт»</span> вверху таблицы для скачивания файла.
                  </li>
                </ul>
              </div>

              <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 text-amber-900">
                <h4 className="font-bold flex items-center mb-1 text-sm">
                  ⚠️ Важное требование к файлам перед загрузкой:
                </h4>
                <p className="text-xs leading-normal">
                  Перед импортом в нашу CRM откройте скачанные файлы в Excel и убедитесь, что первая строчка таблицы содержит четкие названия заголовков (например: <code>Фио</code>, <code>Телефон</code>, <code>Email</code>). Пустых строк между заголовками и данными быть не должно.
                </p>
              </div>

              <div>
                <h3 className="text-base font-bold text-gray-900 mb-3 flex items-center">
                  <span className="bg-green-100 text-green-700 px-2 py-0.5 rounded text-xs mr-2">Шаг 2</span>
                  Импорт данных в Soft-Skills CRM
                </h3>
                <p className="mb-2">Для загрузки готовых Excel-таблиц в нашу систему:</p>
                <ol className="list-decimal pl-5 space-y-2 text-gray-600">
                  <li>
                    Перейдите в соответствующий раздел в нашей панели управления (<span className="font-medium text-gray-900">«База клиентов»</span>, <span className="font-medium text-gray-900">«Лиды»</span> или <span className="font-medium text-gray-900">«Сотрудники»</span>).
                  </li>
                  <li>
                    Нажмите кнопку <span className="font-medium text-gray-900">«Импорт из Excel»</span> (находится в панели инструментов над таблицей).
                  </li>
                  <li>
                    В появившемся окне нажмите <span className="font-medium text-gray-900">«Выбрать файл»</span> и укажите документ, скачанный из Alpha CRM.
                  </li>
                  <li>
                    <span className="font-medium text-gray-900">Сопоставление полей:</span> Система автоматически считает заголовки. Вам нужно будет проверить и подтвердить, какой столбец из Excel соответствует полю в нашей CRM (например, сопоставить столбец «Контакты» с полем «Номер телефона»).
                  </li>
                  <li>
                    Нажмите кнопку <span className="px-2 py-0.5 bg-blue-600 text-white rounded text-xs font-medium">Запустить импорт</span>. Через несколько секунд данные появятся в вашей системе.
                  </li>
                </ol>
              </div>

            </div>
          )}
        </div>

      </div>
    </div>
  );
};
