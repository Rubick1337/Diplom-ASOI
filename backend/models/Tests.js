const sequelize = require('../config/dbConfig');
const {DataTypes} = require('sequelize');

const Tests = sequelize.define('Tests', {
    id: {type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true},
    title: {type: DataTypes.STRING, allowNull: false},
    description: {type: DataTypes.STRING, allowNull: false},
    time_limit: {type: DataTypes.TIME, allowNull: true},
})

module.exports = Tests;