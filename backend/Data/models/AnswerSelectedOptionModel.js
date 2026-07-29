const { DataTypes } = require('sequelize');
const sequelize = require('../config/dbConfig');

const AnswerSelectedOption = sequelize.define(
    'AnswerSelectedOption',
    {
        id:       { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
        answerId: { type: DataTypes.INTEGER, allowNull: false }, // FK → AttemptAnswers
        optionId: { type: DataTypes.INTEGER, allowNull: false }, // FK → QuestionOptions
    },
    { tableName: 'AnswerSelectedOptions', timestamps: false }
);

module.exports = AnswerSelectedOption;
