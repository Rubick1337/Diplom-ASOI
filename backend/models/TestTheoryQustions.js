const sequelize = require('../config/dbConfig');
const {DataTypes} = require('sequelize');

const TestTheoryQustions = sequelize.define('TestTheoryQustions', {
    id: {type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true},
})

module.exports = TestTheoryQustions;