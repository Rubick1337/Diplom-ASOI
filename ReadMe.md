# GooseCode — Платформа для обучения и соревнований по программированию

---

## Содержание

- [О проекте](#о-проекте)
- [Ключевые возможности](#ключевые-возможности)
- [Технологический стек](#технологический-стек)
- [Архитектура](#архитектура)
- [Быстрый старт](#быстрый-старт)
- [Переменные окружения](#переменные-окружения)
- [Документация](#документация)
- [Резервное копирование](#резервное-копирование)

---

## О проекте

**GooseCode** — это полнофункциональная платформа для обучения программированию, объединяющая теоретическую подготовку, практику написания кода и соревновательный элемент в единый цикл.

Платформа позволяет пользователям:
- решать задачи по программированию на **9 языках** в браузерном IDE с мгновенной проверкой
- проходить **теоретические тесты** с детальным разбором ошибок
- сражаться с другими участниками в **PvP-батлах** в реальном времени
- получать подсказки от **ИИ-помощника**  без раскрытия готового ответа
- просматривать **решения сообщества**, оставлять отзывы и жалобы

Администраторы модерируют контент, владелец платформы имеет доступ к **аналитическому дашборду** с визуализацией KPI, тепловыми картами активности и статистикой задач.

---

## Ключевые возможности

### Для пользователей

| Возможность | Описание |
|---|---|
| **Браузерный IDE** | Monaco Editor с подсветкой синтаксиса, автоформатированием и переключением языков |
| **Безопасное выполнение кода** | Docker sandbox: 128 МБ ОЗУ, без сети, лимит по времени |
| **9 языков программирования** | JavaScript, TypeScript, Python, C++, C, C#, Java, PHP, CoffeeScript |
| **PvP-батлы** | Матчмейкинг, приватные комнаты, прогресс соперника в реальном времени, чат |
| **ИИ-помощник** | Анализ кода, объяснение провалов тест-кейсов, советы без готового решения |
| **Теоретические тесты** | Вопросы с кодом, таймер, детальный разбор после завершения |
| **Профиль и статистика** | История решений, рейтинг, опыт, процент успеха, среднее время |
| **Сообщество** | Решения других участников по языку, оценки, отзывы, жалобы |
| **Создание контента** | Пользователи создают свои задачи и тесты с автоматической верификацией |

### Для администраторов и владельца

| Роль | Возможности |
|---|---|
| **Администратор** | Модерация задач (редактирование, скрытие, удаление), обработка жалоб |
| **Владелец** | Аналитический дашборд: KPI, тепловые карты, топ-пользователи, воронка вовлечённости |

---

## Технологический стек

### Backend

| Технология | Назначение |
|---|---|
| **Node.js + Express** | REST API и WebSocket-сервер |
| **PostgreSQL + Sequelize** | Основная база данных |
| **Redis** | Хранение состояния комнат и матчмейкинг |
| **Socket.IO** | PvP-батлы и чат в реальном времени |
| **Docker SDK** | Безопасное выполнение пользовательского кода |
| **Passport.js** | Google OAuth2 и GitHub OAuth2 |
| **JWT** | Access/Refresh токены аутентификации |
| **Prettier / Ruff / clang-format** | Автоформатирование кода 7 языков |

### Frontend

| Технология | Назначение |
|---|---|
| **Next.js 15** | SSR/CSR React-фреймворк |
| **TypeScript** | Типизация |
| **Redux Toolkit** | Глобальное состояние |
| **Monaco Editor** | Браузерный IDE (тот же движок, что в VS Code) |
| **Socket.IO Client** | WebSocket-соединение с сервером |

### Инфраструктура

| Технология | Назначение |
|---|---|
| **Docker Compose** | Оркестрация сервисов (backend, frontend, db, redis) |
| **PostgreSQL** | СУБД |
| **Redis** | Кэш и pub/sub |

---

## Архитектура

Проект построен по принципу **Clean Architecture** с разделением на слои:

```
backend/
├── Presentation/          # HTTP-маршруты, контроллеры, WebSocket
│   ├── controllers/       # Обработчики запросов
│   ├── routes/            # Express-маршруты
│   ├── middlewares/       # JWT, роли, валидация
│   └── socket/            # Socket.IO: батлы, чат, комнаты
├── Application/
│   └── services/          # Бизнес-логика (ChallengeService, AdminService…)
├── Domain/
│   ├── entities/          # Доменные модели
│   └── repository/        # Интерфейсы репозиториев
└── Data/
    ├── models/            # Sequelize-модели
    ├── repository/        # Реализации репозиториев
    ├── DockerRunner/      # Запуск кода в Docker
    └── config/            # Конфигурации БД, Redis, Harness
```

```
frontend/src/
├── app/                   # Next.js App Router (страницы)
├── widgets/               # Крупные UI-блоки (ChallengeWorkspace, Header…)
├── features/              # Функциональные компоненты (CodeEditor, ChatPanel…)
├── entities/              # Базовые сущности (TestCaseItem…)
├── shared/
│   ├── services/          # HTTP-клиенты (ChallengeService, AdminApiService…)
│   ├── store/             # Redux store и слайсы
│   ├── types/             # TypeScript-интерфейсы
│   └── lib/               # socket.ts и утилиты
└── pages/                 # Page-компоненты (ChallengesPage, AdminPage…)
```

---

## Быстрый старт

### Требования

- **Docker Desktop** — [скачать](https://docs.docker.com/desktop/)
- **Node.js 20.17+** — [скачать](https://nodejs.org) *(только для локальной разработки без Docker)*
- **Git**

### Запуск через Docker Compose

```bash
# 1. Клонировать репозиторий
git clone https://github.com/Rubick1337/Diplom-ASOI
cd Diplom-ASOI-IT

# 2. Создать .env файлы (см. раздел ниже)

# 3. Собрать и запустить все сервисы
docker compose build
docker compose up

# Frontend: http://localhost:3000
# Backend API: http://localhost:8000/api
```

### Полезные команды Docker

```bash
# Запуск в фоновом режиме
docker compose up -d

# Просмотр логов всех сервисов
docker compose logs -f

# Просмотр логов конкретного сервиса
docker compose logs -f backend

# Остановка
docker compose down

# Остановка с удалением томов (сбросит БД)
docker compose down -v
```

---

## Переменные окружения

Создайте два файла: `.env` в **корне проекта** и `.env` в папке **`backend/`**.

### Корневой `.env` (для Docker Compose)

```env
# База данных
DB_HOST=db
DB_PORT=5432
DB_NAME=EvaluationProgrammers
DB_USER=postgres
DB_PASSWORD=your_password_here

# Frontend
NEXT_PUBLIC_API_BASE_URL=http://localhost:8000/api
```

### `backend/.env`

```env
# Сервер
PORT=8000
NODE_ENV=production

# База данных
DB_HOST=db
DB_PORT=5432
DB_NAME=EvaluationProgrammers
DB_USER=postgres
DB_PASSWORD=your_password_here

# JWT
JWT_ACCESS_SECRET=your_access_secret_here
JWT_REFRESH_SECRET=your_refresh_secret_here

# Email (SMTP)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your_email_here
SMTP_PASSWORD=your_email_app_password_here

# URLs
CLIENT_URL=http://localhost:3000

# Google OAuth2
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
GOOGLE_CALLBACK_URL=http://localhost:8000/api/auth/google/callback

# GitHub OAuth2
GITHUB_CLIENT_ID=your_github_client_id
GITHUB_CLIENT_SECRET=your_github_client_secret
GITHUB_CALLBACK_URL=http://localhost:8000/api/auth/github/callback

```

> **Настроить Google OAuth:** [console.cloud.google.com](https://console.cloud.google.com)
> **Настроить GitHub OAuth:** Настройки GitHub → Developer settings → OAuth Apps

---

## Документация

| Файл | Описание |
|---|---|
| [`modules.md`](./modules.md) | Описание всех 10 модулей платформы и схема их взаимодействия |
| [`functional-requirements.md`](./functional-requirements.md) | Детальные функциональные требования по каждому разделу системы |
| [`educational-value.md`](./educational-value.md) | Педагогическая ценность платформы для обучения программированию |

---

## Резервное копирование

Скрипты для резервного копирования и восстановления БД *(запускать через Git Bash)*:

```bash
# Создать резервную копию PostgreSQL
bash backup.sh

# Восстановить данные из резервной копии
bash restore.sh
```

---

## Тестовые пользователи

После инициализации БД (`init-db/init.sql`) доступны следующие тестовые аккаунты.

Пароль для всех: **`password123`**

| Роль | Логин | Email | Пароль |
|---|---|---|---|
| Owner | `owner` | owner@example.com | password123 |
| Admin | `admin1` | admin1@example.com | password123 |
| Admin | `admin2` | admin2@example.com | password123 |
| User | `user1` | user1@example.com | password123 |
| User | `user2` | user2@example.com | password123 |
| User | `user3` | user3@example.com | password123 |

---

## Роли пользователей

| Роль | Доступ |
|---|---|
| **Пользователь** | Решение задач и тестов, PvP-батлы, профиль, сообщество, создание контента |
| **Администратор** | Всё выше + панель модерации задач и жалоб |
| **Владелец** | Всё выше + аналитический дашборд платформы |

---

## Поддерживаемые языки программирования

| Язык | Компиляция / Транспиляция |
|---|---|
| JavaScript | Node.js напрямую |
| TypeScript | Транспиляция в JS → Node.js |
| Python | CPython напрямую |
| C++ | g++ → бинарник |
| C | gcc → бинарник |
| C# | dotnet-script / Roslyn |
| Java | javac → JVM |
| PHP | php CLI |
| CoffeeScript | Транспиляция в JS → Node.js |
