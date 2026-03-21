const { DataTypes } = require('sequelize');
const sequelize = require('../config/dbConfig');

const Notification = sequelize.define(
    'Notification',
    {
        id:          { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
        userId:      { type: DataTypes.INTEGER, allowNull: false },
        title:       { type: DataTypes.STRING,  allowNull: false },
        message:     { type: DataTypes.TEXT,    allowNull: false },
        type:        { type: DataTypes.STRING,  allowNull: false, defaultValue: 'admin' },
        isRead:      { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
        challengeId: { type: DataTypes.INTEGER, allowNull: true  },
    },
    { tableName: 'Notifications', timestamps: true }
);

module.exports = Notification;
