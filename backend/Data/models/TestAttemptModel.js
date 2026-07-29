const { DataTypes } = require('sequelize');
const sequelize = require('../config/dbConfig');

const TestAttempt = sequelize.define(
    'TestAttempt',
    {
        id:         { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
        testId:     { type: DataTypes.INTEGER, allowNull: false }, // FK → Tests
        userId:     { type: DataTypes.INTEGER, allowNull: false }, // FK → Users

        startedAt:  { type: DataTypes.DATE,    allowNull: false, defaultValue: DataTypes.NOW },
        finishedAt: { type: DataTypes.DATE,    allowNull: true  }, // null = ещё не завершена

        // active     — попытка идёт, таймер тикает
        // completed  — пользователь сам нажал "Сдать"
        // timed_out  — время вышло, сабмит произошёл автоматически
        status:     { type: DataTypes.STRING,  allowNull: false, defaultValue: 'active' },

        score:    { type: DataTypes.FLOAT, allowNull: true  }, // null пока попытка активна
        maxScore: { type: DataTypes.FLOAT, allowNull: false }, // сумма points выбранных вопросов
    },
    { tableName: 'TestAttempts', timestamps: false }
);

module.exports = TestAttempt;
