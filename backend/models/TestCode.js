const sequelize = require('../config/dbConfig');
const {DataTypes} = require('sequelize');

const TestCode = sequelize.define('TestCode', {
    id: {type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true},
})

module.exports = TestCode;