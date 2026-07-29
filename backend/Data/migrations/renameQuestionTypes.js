/**
 * One-time migration: rename QuestionTypes.name from English keys to Russian,
 * and drop the obsolete `label` and `isMoodleCompatible` columns if they exist.
 *
 * Run once: node backend/Data/migrations/renameQuestionTypes.js
 */

require('dotenv').config({ path: require('path').resolve(__dirname, '../../.env') });
const sequelize = require('../config/dbConfig');

const NAME_MAP = {
    'multichoice':  'Множественный выбор',
    'truefalse':    'Да / Нет',
    'shortanswer':  'Короткий ответ',
    'numerical':    'Числовой ответ',
    'cloze':        'Заполни пропуск',
    'matching':     'Сопоставление',
    'description':  'Информационный блок',
    'code':         'Выполнение кода',
};

async function up() {
    await sequelize.authenticate();
    console.log('Connected to DB.');

    const qi = sequelize.getQueryInterface();

    // 1. Rename type names
    for (const [oldName, newName] of Object.entries(NAME_MAP)) {
        const [, meta] = await sequelize.query(
            `UPDATE "QuestionTypes" SET name = :newName WHERE name = :oldName`,
            { replacements: { oldName, newName } }
        );
        const count = meta?.rowCount ?? meta;
        if (count > 0) console.log(`  Renamed "${oldName}" → "${newName}"`);
        else           console.log(`  Skipped "${oldName}" (not found or already renamed)`);
    }

    // 2. Drop obsolete columns if they still exist
    const tableDesc = await qi.describeTable('QuestionTypes');
    for (const col of ['label', 'isMoodleCompatible']) {
        if (tableDesc[col]) {
            await qi.removeColumn('QuestionTypes', col);
            console.log(`  Dropped column "${col}"`);
        } else {
            console.log(`  Column "${col}" not found, skipping`);
        }
    }

    console.log('\nMigration done.');
}

up()
    .then(() => sequelize.close())
    .catch(err => { console.error('Migration failed:', err); process.exit(1); });
