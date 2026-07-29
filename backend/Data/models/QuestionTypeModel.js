const { DataTypes } = require('sequelize');
const sequelize = require('../config/dbConfig');

const QuestionType = sequelize.define(
    'QuestionType',
    {
        id:   { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
        name: { type: DataTypes.STRING,  allowNull: false, unique: true },
    },
    { tableName: 'QuestionTypes', timestamps: false }
);

module.exports = QuestionType;
