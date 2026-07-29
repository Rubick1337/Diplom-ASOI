const { DataTypes } = require('sequelize');
const sequelize = require('../config/dbConfig');

const AnswerTestCaseResult = sequelize.define(
    'AnswerTestCaseResult',
    {
        id:             { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
        answerId:       { type: DataTypes.INTEGER, allowNull: false }, // FK → AttemptAnswers
        position:       { type: DataTypes.INTEGER, allowNull: false }, // порядок тест-кейса
        input:          { type: DataTypes.TEXT,    allowNull: true  },
        expectedOutput: { type: DataTypes.TEXT,    allowNull: false },
        actualOutput:   { type: DataTypes.TEXT,    allowNull: true  },
        passed:         { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
        isHidden:       { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
        timedOut:       { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
        error:          { type: DataTypes.TEXT,    allowNull: true  },
    },
    { tableName: 'AnswerTestCaseResults', timestamps: false }
);

module.exports = AnswerTestCaseResult;
