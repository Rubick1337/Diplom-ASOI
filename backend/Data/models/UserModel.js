const sequelize = require('../config/dbConfig');
const { DataTypes } = require('sequelize');

const UserModel = sequelize.define('User', {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    username: { type: DataTypes.STRING, allowNull: false, unique: false },
    password: { type: DataTypes.STRING, allowNull: true },
    email: { type: DataTypes.STRING, allowNull: false, unique: true },
    roleId: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 3 },
    refreshToken: { type: DataTypes.STRING, allowNull: true },
    googleId: { type: DataTypes.STRING, allowNull: true, unique: true },
    githubId: { type: DataTypes.STRING, allowNull: true, unique: true },
    experience: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
    rating: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
}, {
    tableName: 'Users',
    timestamps: false,
});

module.exports = UserModel;
