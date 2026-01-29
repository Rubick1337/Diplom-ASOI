const sequelize = require('../config/dbConfig');
const { DataTypes } = require('sequelize');

const ChallengeTestCaseModel = sequelize.define(
    'ChallengeTestCase',
    {
        id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
        challengeId: { type: DataTypes.INTEGER, allowNull: false },
        title: { type: DataTypes.STRING, allowNull: false, defaultValue: 'Test Case' },
        expectedOutput: { type: DataTypes.TEXT, allowNull: false }, 
    },
    { tableName: 'ChallengeTestCases', timestamps: false }
);

module.exports = ChallengeTestCaseModel;