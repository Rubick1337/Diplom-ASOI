# Руководство по установке и развёртыванию системы оценки навыков программирования

---

## Содержание

1. [Введение](#введение)
2. [Требования к оборудованию](#требования-к-оборудованию)
3. [Необходимое программное обеспечение](#необходимое-программное-обеспечение)
4. [Получение исходного кода](#получение-исходного-кода)
5. [Настройка конфигурационного файла](#настройка-конфигурационного-файла)
6. [Настройка внешних сервисов](#настройка-внешних-сервисов)
7. [Загрузка Docker-образов для sandbox-выполнения кода](#загрузка-docker-образов-для-sandbox-выполнения-кода)
8. [Запуск приложения](#запуск-приложения)
9. [Проверка работоспособности](#проверка-работоспособности)
10. [Остановка приложения](#остановка-приложения)
11. [Локальный запуск для разработки](#локальный-запуск-для-разработки-опционально)
12. [Часто возникающие проблемы](#часто-возникающие-проблемы)
13. [Зависимости Backend](#зависимости-backend-полный-список)
14. [Зависимости Frontend](#зависимости-frontend-полный-список)

---

## Введение

Данное руководство описывает пошаговую процедуру развёртывания платформы оценки навыков программирования на чистой машине под управлением Windows, macOS или Linux.

Приложение состоит из четырёх Docker-контейнеров:

| Контейнер | Описание | Порт |
|---|---|---|
| `diplom-frontend` | Next.js 15 — пользовательский интерфейс | 3000 |
| `diplom-backend` | Express 5 — REST API + WebSocket | 8000 |
| `diplom-db` | PostgreSQL 16 — основная база данных | 5432 (внутренний) |
| `diplom-redis` | Redis 7 — кэш и очереди | 6379 (внутренний) |

Для безопасного выполнения пользовательского кода бэкенд дополнительно запускает изолированные Docker-контейнеры на том же хосте (Docker-in-Docker через сокет).

---

## Требования к оборудованию

| Компонент | Минимум | Рекомендуется |
|---|---|---|
| ОЗУ | 4 ГБ | 8 ГБ |
| Процессор | 2 ядра | 4 ядра |
| Диск | 10 ГБ свободного места | 20 ГБ |
| ОС | Windows 10 (64-bit), Ubuntu 20.04, macOS 12 | — |

---

## Необходимое программное обеспечение

### 1. Git

Система управления версиями для получения исходного кода.

- **Версия:** 2.x и новее
- **Скачать:** https://git-scm.com/downloads
- **Установка на Windows:** запустите скачанный `.exe`-установщик, оставив все параметры по умолчанию.
- **Установка на Ubuntu/Debian:**
  ```bash
  sudo apt update && sudo apt install -y git
  ```
- **Установка на macOS:**
  ```bash
  brew install git
  ```

**Проверка установки:**
```bash
git --version
# ожидаемый вывод: git version 2.x.x
```

---

### 2. Docker Desktop (включает Docker Engine + Docker Compose)

Платформа контейнеризации — основной инструмент для запуска всех сервисов приложения.

- **Версия:** Docker Engine 24.x и новее, Docker Compose v2.x и новее
- **Скачать для Windows:** https://docs.docker.com/desktop/install/windows-install/
- **Скачать для macOS:** https://docs.docker.com/desktop/install/mac-install/
- **Скачать для Linux (Ubuntu):** https://docs.docker.com/engine/install/ubuntu/

#### Установка на Windows:

1. Скачайте `Docker Desktop Installer.exe` по ссылке выше.
2. Запустите установщик от имени администратора.
3. На шаге конфигурации убедитесь, что опция **«Use WSL 2 instead of Hyper-V»** включена (рекомендуется).
4. После установки перезагрузите компьютер.
5. Запустите **Docker Desktop** из меню «Пуск» и дождитесь, когда иконка в трее станет зелёной («Engine running»).

> **Важно для Windows:** необходимо включить WSL 2. Если WSL 2 не установлен, выполните в PowerShell (от администратора):
> ```powershell
> wsl --install
> ```
> После чего перезагрузите компьютер.

#### Установка на Ubuntu:

```bash
# Добавляем официальный репозиторий Docker
sudo apt-get update
sudo apt-get install -y ca-certificates curl
sudo install -m 0755 -d /etc/apt/keyrings
sudo curl -fsSL https://download.docker.com/linux/ubuntu/gpg -o /etc/apt/keyrings/docker.asc
sudo chmod a+r /etc/apt/keyrings/docker.asc

echo \
  "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.asc] \
  https://download.docker.com/linux/ubuntu \
  $(. /etc/os-release && echo "$VERSION_CODENAME") stable" | \
  sudo tee /etc/apt/sources.list.d/docker.list > /dev/null

sudo apt-get update
sudo apt-get install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin

# Добавляем текущего пользователя в группу docker (чтобы не нужен был sudo)
sudo usermod -aG docker $USER
newgrp docker
```

**Проверка установки:**
```bash
docker --version
# ожидаемый вывод: Docker version 24.x.x

docker compose version
# ожидаемый вывод: Docker Compose version v2.x.x
```

---

### 3. Node.js 18 LTS *(только для локальной разработки)*

Требуется **только** если вы хотите запускать фронтенд или бэкенд локально (не через Docker). При развёртывании через Docker этот шаг можно пропустить.

- **Версия:** 18.x LTS (18.20.x и новее)
- **Скачать:** https://nodejs.org/en/download (выберите «LTS»)
- **Рекомендуется использовать nvm** для управления версиями:
  - Windows (nvm-windows): https://github.com/coreybutler/nvm-windows/releases
  - Linux/macOS: https://github.com/nvm-sh/nvm

**Установка через nvm (Linux/macOS):**
```bash
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.7/install.sh | bash
source ~/.bashrc  # или ~/.zshrc
nvm install 18
nvm use 18
```

**Проверка установки:**
```bash
node --version
# ожидаемый вывод: v18.x.x

npm --version
# ожидаемый вывод: 10.x.x
```

---

## Получение исходного кода

Откройте терминал (PowerShell на Windows, Terminal на macOS/Linux) и выполните:

```bash
# Клонирование репозитория
git clone https://github.com/Rubick1337/Diplom-ASOI-It.git

# Переход в директорию проекта
cd Diplom-ASOI-It
```

Структура проекта:

```
Diplom-ASOI-It/
├── backend/          # Express API
├── frontend/         # Next.js приложение
├── init-db/          # SQL-скрипт инициализации БД
├── docker-compose.yml
└── .env.example      # Шаблон конфигурации
```

---

## Настройка конфигурационного файла

Скопируйте файл-шаблон и откройте его для редактирования:

```bash
# Windows (PowerShell)
Copy-Item .env.example .env

# Linux / macOS
cp .env.example .env
```

Откройте файл `.env` в любом текстовом редакторе и заполните все параметры:

```dotenv
# ─── База данных PostgreSQL ───────────────────────────────────────────────────
DB_HOST=db                      # Не меняйте — это имя Docker-сервиса
DB_PORT=5432
DB_NAME=EvaluationProgrammers   # Имя создаваемой базы данных
DB_USER=postgres                # Пользователь PostgreSQL
DB_PASSWORD=ЗАМЕНИТЕ_НА_ПАРОЛЬ  # Придумайте надёжный пароль

# ─── Сервер ───────────────────────────────────────────────────────────────────
PORT=8000
NODE_ENV=production

# ─── JWT токены ───────────────────────────────────────────────────────────────
JWT_ACCESS_SECRET=ЗАМЕНИТЕ_НА_СЛУЧАЙНУЮ_СТРОКУ_32_СИМВОЛА
JWT_REFRESH_SECRET=ЗАМЕНИТЕ_НА_ДРУГУЮ_СЛУЧАЙНУЮ_СТРОКУ_32_СИМВОЛА

# ─── Email (SMTP) ─────────────────────────────────────────────────────────────
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=ваш_email@gmail.com
SMTP_PASSWORD=пароль_приложения_gmail   # См. раздел "Настройка внешних сервисов"

# ─── URL клиента ──────────────────────────────────────────────────────────────
CLIENT_URL=http://localhost:3000

# ─── Google OAuth ─────────────────────────────────────────────────────────────
GOOGLE_CLIENT_ID=ваш_google_client_id
GOOGLE_CLIENT_SECRET=ваш_google_client_secret
GOOGLE_CALLBACK_URL=http://localhost:8000/api/auth/google/callback

# ─── GitHub OAuth ─────────────────────────────────────────────────────────────
GITHUB_CLIENT_ID=ваш_github_client_id
GITHUB_CLIENT_SECRET=ваш_github_client_secret
GITHUB_CALLBACK_URL=http://localhost:8000/api/auth/github/callback

# ─── AI (Mistral) ─────────────────────────────────────────────────────────────
MISTRAL_API_KEY=ваш_mistral_api_key

# ─── Frontend ─────────────────────────────────────────────────────────────────
NEXT_PUBLIC_API_BASE_URL=http://localhost:8000/api
```

> **Генерация секретных ключей JWT:** используйте любой генератор случайных строк, например:
> ```bash
> # Linux / macOS
> openssl rand -hex 32
>
> # Windows PowerShell
> -join ((65..90) + (97..122) + (48..57) | Get-Random -Count 32 | % {[char]$_})
> ```

---

## Настройка внешних сервисов

### Google OAuth 2.0

Необходим для входа через Google-аккаунт.

1. Откройте [Google Cloud Console](https://console.cloud.google.com/).
2. Создайте новый проект (кнопка «Новый проект» вверху).
3. В меню слева выберите **API и сервисы → Учётные данные**.
4. Нажмите **«Создать учётные данные» → «Идентификатор клиента OAuth»**.
5. Тип приложения: **«Веб-приложение»**.
6. В разделе **«Авторизованные URI перенаправления»** добавьте:
   ```
   http://localhost:8000/api/auth/google/callback
   ```
7. Нажмите «Создать». Скопируйте **Client ID** и **Client Secret** в файл `.env`.

> **Примечание:** Перед созданием учётных данных может потребоваться настроить экран согласия OAuth (раздел «Экран согласия OAuth» → тип «Внешний»).

---

### GitHub OAuth App

Необходим для входа через GitHub-аккаунт.

1. Откройте [GitHub → Settings → Developer settings → OAuth Apps](https://github.com/settings/developers).
2. Нажмите **«New OAuth App»**.
3. Заполните поля:
   - **Application name:** любое имя, например `EvaluationPlatform`
   - **Homepage URL:** `http://localhost:3000`
   - **Authorization callback URL:** `http://localhost:8000/api/auth/github/callback`
4. Нажмите «Register application».
5. Скопируйте **Client ID** в `.env`.
6. Нажмите **«Generate a new client secret»**, скопируйте **Client Secret** в `.env`.

---

### Mistral AI API Key

Необходим для работы AI-подсказок при решении задач.

1. Зарегистрируйтесь на [console.mistral.ai](https://console.mistral.ai/).
2. В разделе **«API Keys»** нажмите **«Create new key»**.
3. Скопируйте ключ в поле `MISTRAL_API_KEY` файла `.env`.

---

### Gmail — пароль приложения (SMTP)

Используется для отправки уведомлений на email пользователей.

1. Откройте [Аккаунт Google → Безопасность](https://myaccount.google.com/security).
2. Включите **«Двухэтапная аутентификация»** (если ещё не включена).
3. В поиске на странице безопасности введите «Пароли приложений».
4. Создайте новый пароль: выберите приложение «Почта», устройство «Другое», введите имя.
5. Скопируйте сгенерированный 16-символьный пароль в поле `SMTP_PASSWORD` файла `.env`.

---

## Загрузка Docker-образов для sandbox-выполнения кода

Для безопасного запуска кода пользователей в изолированной среде используются следующие Docker-образы. Их нужно загрузить заранее, чтобы ускорить первое выполнение задач:

| Язык | Docker-образ | Описание |
|---|---|---|
| Python | `python:3.10-slim` | CPython 3.10 |
| JavaScript | `node:18-alpine` | Node.js 18 |
| C++ | `gcc:latest` | GCC компилятор |
| C# | `mono:latest` | Mono runtime |
| Java | `openjdk:17-slim` | OpenJDK 17 |
| PHP | `php:8.2-cli-alpine` | PHP 8.2 CLI |

Выполните загрузку:

```bash
docker pull python:3.10-slim
docker pull node:18-alpine
docker pull gcc:latest
docker pull mono:latest
docker pull openjdk:17-slim
docker pull php:8.2-cli-alpine
```

> Загрузка займёт несколько минут в зависимости от скорости интернета (суммарно ~2–3 ГБ).

---

## Запуск приложения

Убедитесь, что вы находитесь в корневой директории проекта (там, где лежит `docker-compose.yml`), и Docker Desktop запущен.

### Шаг 1 — Сборка и запуск всех сервисов

```bash
docker compose up --build -d
```

Флаги:
- `--build` — пересобирает образы из `Dockerfile` (нужно при первом запуске или после изменений в коде)
- `-d` — запускает контейнеры в фоновом режиме

При первом запуске команда выполняет:
1. Сборку образа бэкенда из `backend/Dockerfile`
2. Сборку образа фронтенда из `frontend/Dockerfile`
3. Загрузку образов `postgres:16-alpine` и `redis:7-alpine`
4. Инициализацию базы данных (выполняется скрипт `init-db/init.sql`)
5. Запуск всех четырёх контейнеров

> Первая сборка занимает **5–15 минут**. Последующие запуски без `--build` стартуют за несколько секунд.

### Шаг 2 — Проверка статуса контейнеров

```bash
docker compose ps
```

Ожидаемый вывод — все контейнеры должны иметь статус `running` (или `healthy`):

```
NAME                IMAGE                COMMAND                  STATUS
diplom-frontend     diplom-frontend      "npm start"              Up (healthy)
diplom-backend      diplom-backend       "npm run start"          Up (healthy)
diplom-db           postgres:16-alpine   "docker-entrypoint..."   Up (healthy)
diplom-redis        redis:7-alpine       "docker-entrypoint..."   Up (healthy)
```

### Шаг 3 — Просмотр логов (при необходимости)

```bash
# Все сервисы
docker compose logs -f

# Только бэкенд
docker compose logs -f backend

# Только фронтенд
docker compose logs -f frontend
```

Нажмите `Ctrl+C` для выхода из режима просмотра логов.

---

## Проверка работоспособности

### 1. Открытие приложения

Откройте браузер и перейдите по адресу:

```
http://localhost:3000
```

Должна открыться главная страница платформы.

### 2. Проверка API

Откройте в браузере или в `curl`:

```
http://localhost:8000/health
```

Ожидаемый ответ:
```json
{"status": "ok"}
```

### 3. Проверка регистрации и входа

1. Нажмите кнопку «Регистрация» на главной странице.
2. Заполните форму (имя пользователя, email, пароль).
3. Подтвердите email (письмо придёт на указанный адрес).
4. Войдите в аккаунт.

### 4. Проверка выполнения кода

1. Перейдите в раздел «Задачи» (Challenges).
2. Выберите любую задачу.
3. Напишите решение на любом из доступных языков (Python, JavaScript, C++, C#, Java, PHP).
4. Нажмите «Запустить» — должны появиться результаты тестов.

---

## Остановка приложения

```bash
# Остановить все контейнеры (данные сохраняются)
docker compose stop

# Остановить и удалить контейнеры (данные БД сохраняются в volume)
docker compose down

# Остановить, удалить контейнеры И удалить данные БД (полная очистка)
docker compose down -v
```

> **Внимание:** флаг `-v` удаляет Docker volume с данными PostgreSQL. Используйте только если хотите начать с чистой базы данных.

---

## Локальный запуск для разработки (опционально)

Если вы хотите запускать фронтенд или бэкенд локально (без Docker) для разработки:

### Запуск только инфраструктуры (БД + Redis) через Docker

```bash
docker compose up db redis -d
```

### Запуск бэкенда локально

```bash
cd backend
npm install
# Создайте .env в папке backend с теми же параметрами,
# но DB_HOST=localhost (вместо db)
npm run dev
```

Бэкенд запустится на `http://localhost:8000` с авто-перезапуском при изменении файлов (`nodemon`).

### Запуск фронтенда локально

```bash
cd frontend
npm install
npm run dev
```

Фронтенд запустится на `http://localhost:3000` с Turbopack (быстрая сборка в режиме разработки).

---

## Часто возникающие проблемы

### «Docker daemon is not running» (Windows)

**Причина:** Docker Desktop не запущен.  
**Решение:** Запустите Docker Desktop из меню «Пуск» и дождитесь зелёной иконки в трее.

---

### «Port 3000/8000 is already in use»

**Причина:** Другой процесс занимает порт.  
**Решение (Windows PowerShell):**
```powershell
# Найти процесс на порту 3000
netstat -ano | findstr :3000
# Завершить процесс по PID
Stop-Process -Id <PID> -Force
```
**Решение (Linux/macOS):**
```bash
lsof -ti:3000 | xargs kill -9
```

---

### «permission denied while trying to connect to the Docker daemon socket»  (Linux)

**Причина:** Текущий пользователь не добавлен в группу docker.  
**Решение:**
```bash
sudo usermod -aG docker $USER
newgrp docker
```

---

### База данных не инициализируется

**Причина:** Контейнер БД запустился, но скрипт `init.sql` не выполнился (volume уже существует).  
**Решение:** Пересоздайте volume:
```bash
docker compose down -v
docker compose up --build -d
```

---

### Код пользователя не выполняется (ошибка docker.sock)

**Причина:** На Linux бэкенд не имеет доступа к Docker-сокету хоста.  
**Решение:**
```bash
sudo chmod 666 /var/run/docker.sock
```

---

### Письмо с подтверждением не приходит

**Причина:** Неверные SMTP-настройки или не настроен пароль приложения Gmail.  
**Решение:** Проверьте `.env` — убедитесь, что `SMTP_PASSWORD` содержит **пароль приложения** (16 символов без пробелов), а не пароль от аккаунта Google.

---

## Зависимости Backend (полный список)

Backend написан на **Node.js 18** с использованием **Express 5**. Все пакеты устанавливаются командой `npm install` из файла `backend/package.json`.

| Пакет | Версия | Назначение | Ссылка |
|---|---|---|---|
| `express` | ^5.1.0 | HTTP-фреймворк | https://expressjs.com |
| `sequelize` | ^6.37.7 | ORM для PostgreSQL | https://sequelize.org |
| `sequelize-cli` | ^6.6.3 | Миграции БД | https://github.com/sequelize/cli |
| `pg` | ^8.16.3 | PostgreSQL-драйвер | https://node-postgres.com |
| `redis` | ^5.8.2 | Redis-клиент | https://github.com/redis/node-redis |
| `ioredis` | ^5.9.3 | Альтернативный Redis-клиент | https://github.com/redis/ioredis |
| `socket.io` | ^4.8.3 | WebSocket (совместное редактирование) | https://socket.io |
| `y-socket.io` | ^1.1.3 | Yjs провайдер для Socket.IO | https://github.com/rozek/y-socket.io |
| `jsonwebtoken` | ^9.0.2 | JWT-аутентификация | https://github.com/auth0/node-jsonwebtoken |
| `bcryptjs` | ^3.0.2 | Хеширование паролей | https://github.com/dcodeIO/bcrypt.js |
| `passport` | ^0.7.0 | Middleware аутентификации | https://www.passportjs.org |
| `passport-google-oauth20` | ^2.0.0 | Google OAuth стратегия | https://github.com/jaredhanson/passport-google-oauth2 |
| `passport-github2` | ^0.1.12 | GitHub OAuth стратегия | https://github.com/jaredhanson/passport-github2 |
| `nodemailer` | ^8.0.7 | Отправка email | https://nodemailer.com |
| `@mistralai/mistralai` | ^1.15.1 | Mistral AI SDK | https://github.com/mistralai/client-js |
| `typescript` | ^5.9.3 | Транспиляция TypeScript кода пользователей | https://www.typescriptlang.org |
| `coffeescript` | ^2.7.0 | Транспиляция CoffeeScript кода пользователей | https://coffeescript.org |
| `prettier` | ^3.8.1 | Форматирование кода | https://prettier.io |
| `@prettier/plugin-php` | ^0.24.0 | Форматирование PHP | https://github.com/prettier/plugin-php |
| `@prettier/plugin-python` | ^0.0.0-dev | Форматирование Python | https://github.com/prettier/plugin-python |
| `clang-format` | ^1.8.0 | Форматирование C++ | https://clang.llvm.org/docs/ClangFormat.html |
| `@astral-sh/ruff-wasm-nodejs` | ^0.14.14 | Python-линтер | https://github.com/astral-sh/ruff |
| `express-validator` | ^7.2.1 | Валидация входных данных | https://express-validator.github.io |
| `cors` | ^2.8.5 | CORS-заголовки | https://github.com/expressjs/cors |
| `cookie-parser` | ^1.4.7 | Парсинг cookies | https://github.com/expressjs/cookie-parser |
| `dotenv` | ^17.2.2 | Загрузка переменных окружения | https://github.com/motdotla/dotenv |
| `multer` | ^2.1.1 | Загрузка файлов | https://github.com/expressjs/multer |
| `uuid` | ^8.3.2 | Генерация UUID | https://github.com/uuidjs/uuid |
| `jszip` | ^3.10.1 | Архивация файлов | https://stuk.github.io/jszip |
| `xml2js` | ^0.6.2 | Парсинг XML | https://github.com/Leonidas-from-XIV/node-xml2js |
| `nodemon` | ^3.1.10 | Авто-перезапуск в режиме разработки | https://nodemon.io |

---

## Зависимости Frontend (полный список)

Frontend написан на **Next.js 15** с **React 19** и **TypeScript 5**. Все пакеты устанавливаются командой `npm install` из файла `frontend/package.json`.

| Пакет | Версия | Назначение | Ссылка |
|---|---|---|---|
| `next` | 15.5.3 | React-фреймворк | https://nextjs.org |
| `react` | 19.1.0 | UI-библиотека | https://react.dev |
| `react-dom` | 19.1.0 | DOM-рендеринг React | https://react.dev |
| `typescript` | 5.9.3 | Типизация | https://www.typescriptlang.org |
| `@reduxjs/toolkit` | ^2.10.1 | Управление состоянием | https://redux-toolkit.js.org |
| `react-redux` | ^9.2.0 | React-биндинги Redux | https://react-redux.js.org |
| `@monaco-editor/react` | ^4.7.0 | Редактор кода (Monaco/VS Code) | https://github.com/suren-atoyan/monaco-react |
| `axios` | ^1.13.2 | HTTP-запросы | https://axios-http.com |
| `socket.io-client` | ^4.8.3 | WebSocket-клиент | https://socket.io |
| `yjs` | ^13.6.29 | CRDT для совместного редактирования | https://yjs.dev |
| `y-monaco` | ^0.1.6 | Yjs-биндинг для Monaco | https://github.com/yjs/y-monaco |
| `y-socket.io` | ^1.1.3 | Yjs провайдер Socket.IO | https://github.com/rozek/y-socket.io |
| `y-websocket` | ^3.0.0 | Yjs WebSocket провайдер | https://github.com/yjs/y-websocket |
| `framer-motion` | ^12.30.0 | Анимации | https://www.framer.com/motion |
| `animejs` | ^4.2.0 | JavaScript анимации | https://animejs.com |
| `canvas-confetti` | ^1.9.4 | Эффект конфетти | https://github.com/catdad/canvas-confetti |
| `lucide-react` | ^0.563.0 | Иконки | https://lucide.dev |
| `recharts` | ^3.7.0 | Графики и диаграммы | https://recharts.org |
| `react-markdown` | ^10.1.0 | Рендеринг Markdown | https://github.com/remarkjs/react-markdown |
| `react-syntax-highlighter` | ^16.1.0 | Подсветка синтаксиса | https://github.com/react-syntax-highlighter/react-syntax-highlighter |
| `@dnd-kit/core` | ^6.3.1 | Drag-and-drop | https://dndkit.com |
| `react-scroll-parallax` | ^3.5.0 | Параллакс-эффекты | https://react-scroll-parallax.damnthat.tv |
| `jspdf` | ^4.2.0 | Генерация PDF | https://github.com/parallax/jsPDF |
| `jspdf-autotable` | ^5.0.7 | Таблицы в PDF | https://github.com/simonbengtsson/jsPDF-AutoTable |
| `html2canvas` | ^1.4.1 | Снимок DOM в canvas | https://html2canvas.hertzen.com |
| `prettier` | ^3.8.1 | Форматирование кода | https://prettier.io |
| `@astral-sh/ruff-wasm-web` | ^0.14.14 | Python-линтер (WASM) | https://github.com/astral-sh/ruff |
| `@prettier/plugin-python` | ^0.0.0-dev | Форматирование Python | https://github.com/prettier/plugin-python |
| `randomcolor` | ^0.6.2 | Генерация случайных цветов | https://github.com/davidmerfield/randomColor |
| `tailwindcss` | ^4 | CSS-фреймворк | https://tailwindcss.com |
| `@tailwindcss/postcss` | ^4 | PostCSS-плагин Tailwind | https://tailwindcss.com/docs/installation/using-postcss |
| `eslint` | ^9 | Линтер JavaScript/TypeScript | https://eslint.org |
| `eslint-config-next` | 15.5.3 | ESLint-правила для Next.js | https://nextjs.org/docs/app/api-reference/config/eslint |

---

*Документ сформирован для версии приложения от июня 2026 г.*
