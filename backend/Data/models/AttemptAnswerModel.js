const { DataTypes } = require('sequelize');
const sequelize = require('../config/dbConfig');

const AttemptAnswer = sequelize.define(
    'AttemptAnswer',
    {
        id:          { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
        attemptId:   { type: DataTypes.INTEGER, allowNull: false }, // FK → TestAttempts
        questionId:  { type: DataTypes.INTEGER, allowNull: false }, // FK → Questions

        // shortanswer / numerical / cloze — введённый текст
        answerText:   { type: DataTypes.TEXT,    allowNull: true },

        // code — исходный код пользователя
        codeAnswer:   { type: DataTypes.TEXT,    allowNull: true },

        isCorrect:    { type: DataTypes.BOOLEAN, allowNull: true },
        pointsEarned: { type: DataTypes.FLOAT,   allowNull: false, defaultValue: 0 },

        // selectedOptionIds → AnswerSelectedOptions
        // matchingAnswer    → AnswerMatchingPairs
        // testCaseResults   → AnswerTestCaseResults
    },
    { tableName: 'AttemptAnswers', timestamps: false }
);

module.exports = AttemptAnswer;
