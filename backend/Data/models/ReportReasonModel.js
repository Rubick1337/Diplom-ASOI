const sequelize = require('../config/dbConfig');
const { DataTypes } = require('sequelize');

const ReportReasonModel = sequelize.define(
    'ReportReason',
    {
        id:   { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
        name: { type: DataTypes.STRING(100), allowNull: false, unique: true },
    },
    {
        tableName:  'ReportReasons',
        timestamps: false,
    }
);

module.exports = ReportReasonModel;
