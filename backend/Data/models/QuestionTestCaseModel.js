const { DataTypes } = require('sequelize');
const sequelize = require('../config/dbConfig');

const QuestionTestCase = sequelize.define(
    'QuestionTestCase',
    {
        id:             { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
        questionId:     { type: DataTypes.INTEGER, allowNull: false },
        input:          { type: DataTypes.TEXT,    allowNull: true },
        expectedOutput: { type: DataTypes.TEXT,    allowNull: false },
        isHidden:       { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
        order:          { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
    },
    { tableName: 'QuestionTestCases', timestamps: false }
);

module.exports = QuestionTestCase;
