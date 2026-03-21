const sequelize = require('../config/dbConfig');
const { DataTypes } = require('sequelize');

const ReportChallengeModel = sequelize.define(
    'ReportChallenge',
    {
        id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
        userId: {
            type: DataTypes.INTEGER,
            allowNull: false
        },
        challengeId: {
            type: DataTypes.INTEGER,
            allowNull: false
        },
        reasonId: {
            type: DataTypes.INTEGER,
            allowNull: true,
        },
        reasonText: {
            type: DataTypes.TEXT,
            allowNull: true,
        },
        status: {
            type: DataTypes.STRING,
            allowNull: false,
            defaultValue: 'Pending'
        },
        resolvedById: {
            type: DataTypes.INTEGER,
            allowNull: true,
            defaultValue: null,
        },
        resolvedAt: {
            type: DataTypes.DATE,
            allowNull: true,
            defaultValue: null,
        },
        createdAt: {
            type: DataTypes.DATE,
            defaultValue: DataTypes.NOW
        }
    },
    {
        tableName: 'ReportChallenges',
        timestamps: false
    }
);

module.exports = ReportChallengeModel;
