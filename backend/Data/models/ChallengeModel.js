// Data/models/challengeModel.js

const sequelize = require('../config/dbConfig');
const { DataTypes } = require('sequelize');

const ChallengeModel = sequelize.define(
    'Challenge',
    {
        id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true,
        },
        name: {
            type: DataTypes.STRING,
            allowNull: false,
            unique: true,
        },
        description: {
            type: DataTypes.TEXT,
            allowNull: false,
        },
        mode: {
            type: DataTypes.STRING,
            allowNull: false,
            defaultValue: 'harness',
        },
        funcName: {
            type: DataTypes.STRING,
            allowNull: false,
        },
        properties: {
            type: DataTypes.JSONB,
            allowNull: true,
        },
        timeLimitMs: {
            type: DataTypes.INTEGER,
            allowNull: false,
            defaultValue: 2000,
        },
        createdByUserId: {
            type: DataTypes.INTEGER,
            allowNull: false,
        },
    },
    {
        tableName: 'Challenges',
        timestamps: false,
    }
);

module.exports = ChallengeModel;
