const { DataTypes } = require('sequelize');
const sequelize = require('../config/dbConfig');

const AttemptQuestion = sequelize.define(
    'AttemptQuestion',
    {
        id:         { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
        attemptId:  { type: DataTypes.INTEGER, allowNull: false }, // FK → TestAttempts
        questionId: { type: DataTypes.INTEGER, allowNull: false }, // FK → Questions
        position:   { type: DataTypes.INTEGER, allowNull: false }, // порядок показа вопроса
    },
    { tableName: 'AttemptQuestions', timestamps: false }
);

module.exports = AttemptQuestion;
