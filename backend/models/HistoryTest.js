const sequelize = require('../config/dbConfig');
const {DataTypes} = require('sequelize');

const HistoryTest = sequelize.define('HistoryTest', {
    id: {type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true},
    score: {type: DataTypes.INTEGER, allowNull: false},
})

module.exports = HistoryTest;