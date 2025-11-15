const sequelize = require('../config/dbConfig');
const {DataTypes} = require('sequelize');

const User = sequelize.define('User', {
    id: {type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true},
    username: {type: DataTypes.STRING, allowNull: false, unique: true},
    password: {type: DataTypes.STRING, allowNull: false},
    email: {type: DataTypes.STRING, allowNull: false, unique: true},
    role: {type: DataTypes.INTEGER, allowNull: false},
    refreshToken: {type: DataTypes.STRING, allowNull: false},
})

module.exports = User;