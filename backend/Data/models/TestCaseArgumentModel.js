const sequelize = require('../config/dbConfig');
const { DataTypes } = require('sequelize');

const TestCaseArgumentModel = sequelize.define(
    'TestCaseArgument',
    {
        id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
        testCaseId: { type: DataTypes.INTEGER, allowNull: false },
        value: { type: DataTypes.TEXT, allowNull: false },
    },
    { tableName: 'TestCaseArguments', timestamps: false }
);

module.exports = TestCaseArgumentModel;