USE `crm`;
-- Компании
CREATE TABLE companies (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    access_key_admin VARCHAR(50), -- Ключ для админских прав
    access_key_user VARCHAR(50)   -- Ключ для обычных прав
);

-- Пользователи
CREATE TABLE users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    full_name VARCHAR(255),
    email VARCHAR(100) UNIQUE
);

-- Связь: кто в какой компании и с какой ролью
CREATE TABLE company_members (
    user_id INT,
    company_id INT,
    role ENUM('admin', 'employee', 'viewer') DEFAULT 'viewer',
    PRIMARY KEY (user_id, company_id),
    FOREIGN KEY (user_id) REFERENCES users(id),
    FOREIGN KEY (company_id) REFERENCES companies(id)
);


npm install eslint --save-dev

npx eslint --init
ESLint 