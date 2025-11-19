// Data/models/challengeTestCaseModel.js

const sequelize = require('../config/dbConfig');
const { DataTypes } = require('sequelize');
const ChallengeModel = require('./challengeModel');

const ChallengeTestCaseModel = sequelize.define(
    'ChallengeTestCase',
    {
        id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true,
        },

        challengeId: {
            type: DataTypes.INTEGER,
            allowNull: false,
            references: {
                model: ChallengeModel,
                key: 'id',
            },
            onDelete: 'CASCADE',
        },

        inputArgs: {
            type: DataTypes.JSONB,
            allowNull: false,
            defaultValue: [],
        },

        expectedOutput: {
            type: DataTypes.JSONB,
            allowNull: false,
        },

        isSample: {
            type: DataTypes.BOOLEAN,
            allowNull: false,
            defaultValue: false,
        },

        order: {
            type: DataTypes.INTEGER,
            allowNull: false,
            defaultValue: 0,
        },

        weight: {
            type: DataTypes.INTEGER,
            allowNull: false,
            defaultValue: 1,
        },
    },
    {
        tableName: 'ChallengeTestCases',
        timestamps: false,
    }
);



module.exports = ChallengeTestCaseModel;
