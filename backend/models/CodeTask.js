const sequelize = require('../config/dbConfig');
const {DataTypes} = require('sequelize');

const CodeTask = sequelize.define('CodeTask', {
    id: {type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true},
    title: {type: DataTypes.STRING, allowNull: false,},
    description: {type: DataTypes.STRING, allowNull: false},
    input_example: {type: DataTypes.STRING, allowNull: false},
    output_example: {type: DataTypes.STRING, allowNull: false},
    execution_time_limit:{type: DataTypes.TIME, allowNull: true},
    expected_output:{type: DataTypes.STRING, allowNull: false},
})

module.exports = CodeTask;