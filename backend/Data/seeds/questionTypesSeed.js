const { QuestionType } = require('../models');

const QUESTION_TYPES = [
    { name: 'Множественный выбор'  },
    { name: 'Да / Нет'             },
    { name: 'Короткий ответ'       },
    { name: 'Числовой ответ'       },
    { name: 'Заполни пропуск'      },
    { name: 'Сопоставление'        },
    { name: 'Информационный блок'  },
    { name: 'Выполнение кода'      },
];

async function seedQuestionTypes() {
    await QuestionType.bulkCreate(QUESTION_TYPES, {
        ignoreDuplicates: true, // не падать если уже существуют
    });
}

module.exports = seedQuestionTypes;
