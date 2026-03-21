const sequelize = require('../config/dbConfig');
const { DataTypes } = require('sequelize');

const HistoryChallengesModel = sequelize.define(
    'HistoryChallenges',
    {
        id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
        userId: { type: DataTypes.INTEGER, allowNull: false },
        challengeId: { type: DataTypes.INTEGER, allowNull: false },
        code: { type: DataTypes.TEXT, allowNull: false },
        language: { type: DataTypes.STRING, allowNull: false },
        status: {
            type: DataTypes.STRING,
            allowNull: false,
            defaultValue: 'Pending'
        },
        executionTimeMs: { type: DataTypes.INTEGER, allowNull: true },
        testsPassed: { type: DataTypes.INTEGER, allowNull: true },
        testsTotal:  { type: DataTypes.INTEGER, allowNull: true },
        createdAt: {
            type: DataTypes.DATE,
            defaultValue: DataTypes.NOW
        }
    },
    {
        tableName: 'HistoryChallenges',
        timestamps: false
    }
);

module.exports = HistoryChallengesModel;
