const { DataTypes } = require('sequelize');
const sequelize = require('../config/dbConfig');

const RoleModel = sequelize.define('Role', {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    name: { type: DataTypes.STRING, allowNull: false, unique: true },
}, {
    tableName: 'Roles',
    timestamps: false,
});

module.exports = RoleModel;
