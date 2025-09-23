const sequelize = require('../config/dbConfig');
const {DataTypes} = require('sequelize');

const AnswerQuestions = sequelize.define('AnswerQuestions', {
    id: {type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true},
    answer: {type: DataTypes.STRING, allowNull: false},
    is_correct: {type: DataTypes.BOOLEAN, allowNull: false},
})

module.exports = AnswerQuestions;