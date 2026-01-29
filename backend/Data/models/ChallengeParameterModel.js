const sequelize = require('../config/dbConfig');
const { DataTypes } = require('sequelize');

const ChallengeParameterModel = sequelize.define(
    'ChallengeParameter',
    {
        id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
        challengeId: { type: DataTypes.INTEGER, allowNull: false },
        name: { type: DataTypes.STRING, allowNull: false },
        dataType: { type: DataTypes.STRING, allowNull: false },
    },
    { tableName: 'ChallengeParameters', timestamps: false }
);

module.exports = ChallengeParameterModel;