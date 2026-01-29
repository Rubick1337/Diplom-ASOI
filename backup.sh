#!/bin/bash

set -e

if [ -f .env ]; then

    export $(grep -v '^#' .env | xargs)
else
    echo "Ошибка: файл .env не найден."
    exit 1
fi

SCRIPT_ROOT="$(dirname "$(readlink -f "$0")")"
BACKUPS_DIR="${SCRIPT_ROOT}/backups"


mkdir -p "${BACKUPS_DIR}"


DB_SERVICE="db"
DB_USER="${DB_USER}"
DB_NAME="${DB_NAME}"

DUMP_FILE="backup_$(date +%Y%m%d_%H%M%S).sql"
DUMP_PATH="${BACKUPS_DIR}/${DUMP_FILE}"

echo "--- Начинаем создание резервной копии БД '${DB_NAME}' ---"

docker compose exec -T "${DB_SERVICE}" \
  pg_dump -U "${DB_USER}" -d "${DB_NAME}" -c -F p > "${DUMP_PATH}"

if [ $? -eq 0 ]; then
    echo "Успешно. Дамп сохранен в: backups/${DUMP_FILE}"
    ln -sf "${DUMP_PATH}" "${BACKUPS_DIR}/latest.sql"
else
    echo "Ошибка при выполнении pg_dump."
    exit 1
fi
