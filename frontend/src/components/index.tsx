interface IndexProps{
  setPage: (page:'registration'|'authorization') => void;
}
const Index = ({ setPage }: IndexProps) => {
  return (
    <div className="min-h-screen bg-white font-sans text-gray-900">
      {/* Шапка */}
      <header className="flex justify-between items-center px-6 py-4 md:px-12 bg-white/80 backdrop-blur-md sticky top-0 z-50 border-b border-gray-100">
        <div className="text-2xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
          💜 EduCRM
        </div>
        <div className="flex gap-4">
          <button 
            onClick={() => setPage('authorization')}
            className="px-5 py-2 text-indigo-600 font-medium hover:bg-indigo-50 rounded-xl transition-all"
          >
            Войти
          </button>
          <button 
            onClick={() => setPage('registration')}
            className="px-5 py-2 bg-indigo-600 text-white font-medium rounded-xl hover:bg-indigo-700 shadow-lg shadow-indigo-200 transition-all"
          >
            Регистрация
          </button>
        </div>
      </header>

      {/* Hero Section (Главный блок) */}
      <main className="max-w-6xl mx-auto px-6 pt-20 pb-12 text-center">
        <div className="inline-block px-4 py-1.5 mb-6 text-sm font-semibold tracking-wide text-indigo-600 uppercase bg-indigo-50 rounded-full">
          Система управления обучением v1.0
        </div>
        
        <h1 className="text-5xl md:text-7xl font-extrabold mb-8 tracking-tight">
          Управляйте учебным процессом <br />
          <span className="text-indigo-600">без лишней суеты</span>
        </h1>
        
        <p className="text-xl text-gray-500 mb-10 max-w-2xl mx-auto leading-relaxed">
          Автоматизируйте расписание, следите за успехами студентов и контролируйте финансы в одной интуитивно понятной панели.
        </p>

        <div className="flex flex-col sm:flex-row gap-4 justify-center mb-20">
          <button 
            className="px-8 py-4 bg-indigo-600 text-white text-lg font-bold rounded-2xl hover:bg-indigo-700 hover:-translate-y-1 transition-all shadow-xl shadow-indigo-200"
          >
            Начать работу бесплатно
          </button>
          <button className="px-8 py-4 bg-white text-gray-700 text-lg font-semibold border border-gray-200 rounded-2xl hover:bg-gray-50 transition-all">
            Посмотреть демо
          </button>
        </div>

        {/* Карточки преимуществ */}
        <div className="grid md:grid-cols-3 gap-8 text-left">
          {[
            { title: 'Дашборд', desc: 'Наглядная статистика всех процессов в реальном времени.', icon: '📊' },
            { title: 'Студенты', desc: 'Удобная база данных с историей обучения и оценками.', icon: '👥' },
            { title: 'Финансы', desc: 'Автоматический учет оплат и задолженностей.', icon: '💰' },
          ].map((feature, i) => (
            <div key={i} className="p-8 bg-gray-50 rounded-3xl border border-transparent hover:border-indigo-100 hover:bg-white hover:shadow-2xl transition-all group">
              <div className="text-4xl mb-4 grayscale group-hover:grayscale-0 transition-all">{feature.icon}</div>
              <h3 className="text-xl font-bold mb-2">{feature.title}</h3>
              <p className="text-gray-500 leading-relaxed">{feature.desc}</p>
            </div>
          ))}
        </div>
      </main>

      <footer className="py-12 border-t border-gray-100 text-center text-gray-400 text-sm">
        &copy; 2024 EduCRM System. Все права защищены.
      </footer>
    </div>
  );
};

export default Index;
