const sequelize = require('../config/dbConfig');
const {DataTypes} = require('sequelize');

const TheoryQustions = sequelize.define('TheoryQustions', {
    id: {type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true},
    qustions_text: {type: DataTypes.STRING, allowNull: false},
    type: {type: DataTypes.ENUM('single_choice', 'multiple_choice', 'text_answer'), allowNull: false},
})

module.exports = TheoryQustions;