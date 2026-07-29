const { DataTypes } = require('sequelize');
const sequelize = require('../config/dbConfig');

// Используется для типов: multichoice, truefalse, matching, cloze, shortanswer (правильные варианты)
const QuestionOption = sequelize.define(
    'QuestionOption',
    {
        id:         { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
        questionId: { type: DataTypes.INTEGER, allowNull: false }, // FK → Questions

        // Текст варианта.
        // multichoice / truefalse  — текст варианта ("Верно", "Python — интерпретируемый язык")
        // matching                 — левая часть пары ("Москва")
        // cloze / shortanswer      — правильный ответ ("Париж"), можно несколько записей = несколько допустимых ответов
        text:       { type: DataTypes.TEXT,    allowNull: false },

        isCorrect:  { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },

        // Только для matching: правая часть пары ("Россия")
        matchPair:  { type: DataTypes.TEXT,    allowNull: true },

        // Для cloze: номер бланка, к которому относится этот вариант ответа (1, 2, ...)
        blankIndex: { type: DataTypes.INTEGER, allowNull: true },

        order:      { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
    },
    { tableName: 'QuestionOptions', timestamps: false }
);

module.exports = QuestionOption;
