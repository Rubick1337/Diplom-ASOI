const sequelize = require('../config/dbConfig');
const { DataTypes } = require('sequelize');

const ChallengeModel = sequelize.define(
    'Challenge',
    {
        id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
        name: { type: DataTypes.STRING, allowNull: false, unique: true },
        description: { type: DataTypes.TEXT, allowNull: false },
        topic: { type: DataTypes.STRING, allowNull: false, defaultValue: 'General' },
        mode: { type: DataTypes.STRING, allowNull: false, defaultValue: 'harness' },
        funcName: { type: DataTypes.STRING, allowNull: false },
        timeLimitMs: { type: DataTypes.INTEGER, allowNull: true },
        createdByUserId: { type: DataTypes.INTEGER, allowNull: true },
        sampleInput: { type: DataTypes.TEXT, allowNull: true, defaultValue: '' },
        sampleOutput: { type: DataTypes.TEXT, allowNull: true, defaultValue: '' },
        isHidden: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
    },
    { tableName: 'Challenges', timestamps: false }
);

module.exports = ChallengeModel;