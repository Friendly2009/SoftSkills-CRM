import { useState, useRef } from "react";

export const TransferFilesPage: React.FC = () => {
    type TransferType = 'employees' | 'clients' | 'leads' | '';
    const [targetType, setTargetType] = useState<TransferType>('');
    const [file, setFile] = useState<File | null>(null);
    const [isDragActive, setIsDragActive] = useState<boolean>(false);

    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            setFile(e.target.files[0]);
        }
    };

    const handleDrag = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        if (e.type === "dragenter" || e.type === "dragover") {
            setIsDragActive(true);
        } else if (e.type === "dragleave") {
            setIsDragActive(false);
        }
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragActive(false);

        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
            const droppedFile = e.dataTransfer.files[0];
            if (droppedFile.name.endsWith('.xlsx') || droppedFile.name.endsWith('.xls') || droppedFile.type === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet') {
                setFile(droppedFile);
            } else {
                alert('Пожалуйста, загрузите файл в формате Excel (.xlsx, .xls)');
            }
        }
    };

    const onButtonClick = () => {
        fileInputRef.current?.click();
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!targetType || !file) return;

        console.log("=== ОТПРАВКА ДАННЫХ ===");
        console.log("Тип импорта:", targetType);
        console.log("Файл:", file.name);

    };

    return (
        <div className="min-h-screen bg-[#f8fafc] flex items-center justify-center p-4">
            <div className="bg-white rounded-xl shadow-md border border-[#e2e8f0] w-full max-w-xl p-6 sm:p-8">

                <div className="mb-6 text-center sm:text-left">
                    <h1 className="text-2xl font-semibold text-[#0f172a] mb-1">Импорт данных из Excel</h1>
                    <p className="text-sm text-[#64748b]">Загрузите файл и выберите категорию для автоматического обновления базы данных.</p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">

                    {/* Блок Селекта */}
                    <div className="flex flex-col gap-2">
                        <label className="text-sm font-medium text-[#475569]">
                            Категория импортируемых данных
                        </label>
                        <select
                            value={targetType}
                            onChange={(e) => setTargetType(e.target.value as TransferType)}
                            className="w-full px-3 py-2.5 bg-white border border-[#cbd5e1] rounded-lg text-sm text-[#1e293b] focus:border-[#2563eb] focus:ring-1 focus:ring-[#2563eb] outline-none cursor-pointer transition-colors"
                        >
                            <option value="" disabled hidden>Выберите категорию...</option>
                            <option value="employees">Сотрудники</option>
                            <option value="clients">Клиенты</option>
                            <option value="leads">Лиды</option>
                        </select>
                    </div>

                    <div className="flex flex-col gap-2">
                        <label className="text-sm font-medium text-[#475569]">
                            Файл таблицы (.xlsx, .xls)
                        </label>

                        <input
                            ref={fileInputRef}
                            type="file"
                            accept=".xlsx, .xls"
                            onChange={handleFileChange}
                            className="hidden"
                        />

                        <div
                            onDragEnter={handleDrag}
                            onDragOver={handleDrag}
                            onDragLeave={handleDrag}
                            onDrop={handleDrop}
                            onClick={onButtonClick}
                            className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all flex flex-col items-center justify-center min-h-[160px]
                ${isDragActive ? 'border-[#2563eb] bg-[#f0f9ff]' : 'border-[#cbd5e1] hover:border-[#94a3b8] bg-[#fafbfc]'}`}
                        >
                            {file ? (
                                <div className="flex flex-col items-center">
                                    <div className="p-3 bg-[#f0fdf4] rounded-full mb-3">
                                        <svg className="w-8 h-8 text-[#166534]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                        </svg>
                                    </div>
                                    <span className="text-sm font-medium text-[#1e293b] max-w-[280px] truncate" title={file.name}>
                                        {file.name}
                                    </span>
                                    <span className="text-xs text-[#94a3b8] mt-1">
                                        {(file.size / 1024).toFixed(1)} КБ
                                    </span>
                                    <button
                                        type="button"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            setFile(null);
                                        }}
                                        className="mt-3 text-xs text-[#ef4444] hover:underline font-medium"
                                    >
                                        Удалить и выбрать другой
                                    </button>
                                </div>
                            ) : (
                                <div className="flex flex-col items-center">
                                    <div className="p-3 bg-[#f1f5f9] rounded-full mb-3 text-[#64748b]">
                                        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                                        </svg>
                                    </div>
                                    <p className="text-sm font-medium text-[#334155]">
                                        Перетащите Excel-файл сюда или <span className="text-[#2563eb] hover:underline">выберите на компьютере</span>
                                    </p>
                                    <p className="text-xs text-[#94a3b8] mt-1">Максимальный размер файла: 10MB</p>
                                </div>
                            )}
                        </div>
                    </div>

                    <button
                        type="submit"
                        disabled={!targetType || !file}
                        className={`w-full py-3 px-4 rounded-lg font-medium text-sm transition-all shadow-sm text-center
              ${(!targetType || !file)
                                ? 'bg-[#e2e8f0] text-[#94a3b8] cursor-not-allowed'
                                : 'bg-[#2563eb] hover:bg-[#1d4ed8] text-white active:scale-[0.99] cursor-pointer'
                            }`}
                    >
                        Принять и импортировать
                    </button>

                </form>
            </div>
        </div>
    );
};