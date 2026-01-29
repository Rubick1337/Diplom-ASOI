#!/bin/bash

set -e

# 1. Загружаем переменные из .env
if [ -f .env ]; then
    # shellcheck disable=SC2046
    export $(grep -v '^#' .env | xargs)
else
    echo "Ошибка: файл .env не найден."
    exit 1
fi

DB_SERVICE="db"                          # имя сервиса из docker-compose.yml
BACKUP_FILE="./backups/latest.sql"

if [ ! -f "$BACKUP_FILE" ]; then
    echo "Ошибка: Файл резервной копии '${BACKUP_FILE}' не найден."
    echo "Сначала создай резервную копию, используя './backup.sh'."
    exit 1
fi

echo "--- НАЧИНАЕМ ПРОЦЕСС ВОССТАНОВЛЕНИЯ И ТЕСТИРОВАНИЯ ---"

echo "1/4. Остановка контейнеров и удаление volume (db_data)..."
docker compose down -v

echo "2/4. Перезапуск контейнеров с пустой БД..."
docker compose up -d db

echo "Ожидание запуска базы данных..."

# Ждём, пока Postgres станет готов (pg_isready из healthcheck)
ATTEMPTS=10
SLEEP_SEC=3
for i in $(seq 1 $ATTEMPTS); do
  if docker compose exec -T "${DB_SERVICE}" pg_isready -U "${DB_USER}" > /dev/null 2>&1; then
    echo "База данных готова."
    break
  else
    echo "  Ожидание БД... (${i}/${ATTEMPTS})"
    sleep "${SLEEP_SEC}"
  fi
done

if ! docker compose exec -T "${DB_SERVICE}" pg_isready -U "${DB_USER}" > /dev/null 2>&1; then
  echo "БД так и не стала доступна. Прерываем."
  exit 1
fi

echo "3/4. Восстановление данных из ${BACKUP_FILE}..."

docker compose exec -T "${DB_SERVICE}" \
  psql -U "${DB_USER}" -d "${DB_NAME}" < "${BACKUP_FILE}"

if [ $? -eq 0 ]; then
    echo "4/4. ВОССТАНОВЛЕНИЕ ЗАВЕРШЕНО УСПЕШНО."
    echo "Запуск backend и frontend..."
    docker compose up -d backend frontend
    echo "Проверь приложение на http://localhost:3000"
else
    echo "КРИТИЧЕСКАЯ ОШИБКА при восстановлении."
    exit 1
fi
