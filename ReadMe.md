# Diplom-ASOI-IT
Платформа для выполнения и автоматизированной проверки знаний программистов.  
Проект включает backend (Node.js + Express + PostgreSQL) и frontend (Next.js).  
Все сервисы запускаются через Docker.

## Описание проекта
Приложение предоставляет возможности:
- просматривать задачи по программированию;
- решать теоретические тесты по it
- выполнять поиск и фильтрацию;
- открывать полное описание задачи;
- запускать и проверять решения через систему тесткейсов;
- использовать JWT авторизацию;
- хранить данные в PostgreSQL;
- запускать всю систему единой командой через Docker Compose.

## Технологии

### Backend
- Node.js
- Express
- Sequelize ORM
- PostgreSQL
- JWT авторизация
- Docker
- Auth02

### Frontend
- Next.js 15
- React
- Redux Toolkit
- TypeScript

## Требования

Перед запуском приложения необходимо установить:

1. Node.js версии 20.17.0 или выше  
   https://nodejs.org

2. Docker Desktop  
   https://docs.docker.com/desktop/

3. WebStorm (рекомендуется)  
   https://www.jetbrains.com/webstorm/

---

## Установка и запуск

### 1. Клонирование репозитория
```bash
git clone <https://github.com/Rubick1337/Diplom-ASOI>
cd Diplom-ASOI-IT
```
### 2. Создание файла `.env`

Создайте файл **.env в корне проекта** и файл **.env в папке backend**,  
заполнив их следующими параметрами:



- DB_HOST=db
- DB_PORT=5432
- DB_NAME=EvaluationProgrammers
- DB_USER=postgres
- DB_PASSWORD=your_password_here

- PORT=8000
- NODE_ENV=production

- JWT_ACCESS_SECRET=your_access_secret_here
- JWT_REFRESH_SECRET=your_refresh_secret_here

- SMTP_HOST=smtp.gmail.com
- SMTP_PORT=587
- SMTP_USER=your_email_here
- SMTP_PASSWORD=your_email_password_here

- CLIENT_URL=http://localhost:3000

- GOOGLE_CLIENT_ID=your_google_client_id
- GOOGLE_CLIENT_SECRET=your_google_client_secret
- GOOGLE_CALLBACK_URL=http://localhost:8000/api/auth/google/callback

- GITHUB_CLIENT_ID=your_github_client_id
- GITHUB_CLIENT_SECRET=your_github_client_secret
- GITHUB_CALLBACK_URL=http://localhost:8000/api/auth/github/callback

- NEXT_PUBLIC_API_BASE_URL=http://localhost:8000/api

Сборка контейнеров в корне проекта
- docker compose build

Запуск проекта в корне проекта
- docker compose up 

После запуска:

Frontend доступен по адресу:
http://localhost:3000

Backend доступен по адресу:
http://localhost:8000/api

# Команды Docker
### 3. Сборка контейнеров (в корне проекта)

```bash
docker compose build
docker compose up 
```
Посмотреть логи:
```bash
docker compose logs -f
```

# backup.sh — создание резервной копии в терминале выбрать git bash
```bash 
backup.sh
```

# restore.sh — восстановление данных в терминале выбрать git bash
```bash 
restore.sh
```
