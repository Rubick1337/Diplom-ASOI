const sequelize = require('../config/dbConfig');
const {DataTypes} = require('sequelize');

const RoadMaps = sequelize.define('RoadMaps', {
    id: {type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true},
    title: {type: DataTypes.STRING, allowNull: false},
    description: {type: DataTypes.STRING, allowNull: false},
})

module.exports = RoadMaps;