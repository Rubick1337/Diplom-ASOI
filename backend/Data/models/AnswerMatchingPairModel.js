const { DataTypes } = require('sequelize');
const sequelize = require('../config/dbConfig');

const AnswerMatchingPair = sequelize.define(
    'AnswerMatchingPair',
    {
        id:        { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
        answerId:  { type: DataTypes.INTEGER, allowNull: false }, // FK → AttemptAnswers
        optionId:  { type: DataTypes.INTEGER, allowNull: false }, // FK → QuestionOptions (левая часть)
        matchPair: { type: DataTypes.TEXT,    allowNull: false }, // введённая правая часть
    },
    { tableName: 'AnswerMatchingPairs', timestamps: false }
);

module.exports = AnswerMatchingPair;
