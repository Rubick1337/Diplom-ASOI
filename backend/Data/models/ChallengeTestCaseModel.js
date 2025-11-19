const sequelize = require('../config/dbConfig');
const { DataTypes } = require('sequelize');
const ChallengeModel = require('./ChallengeModel');

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
        isHidden: {
            type: DataTypes.BOOLEAN,
            allowNull: false,
            defaultValue: true,
        }
    },
    {
        tableName: 'ChallengeTestCases',
        timestamps: false,
    }
);


module.exports = ChallengeTestCaseModel;
