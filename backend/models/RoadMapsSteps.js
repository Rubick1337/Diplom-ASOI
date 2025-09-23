const sequelize = require('../config/dbConfig');
const {DataTypes} = require('sequelize');

const RoadMapsSteps = sequelize.define('RoadMapsSteps', {
    id: {type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true},
    techology_name: {type: DataTypes.STRING, allowNull: false},
    description: {type: DataTypes.STRING, allowNull: false},
})

module.exports = RoadMapsSteps;