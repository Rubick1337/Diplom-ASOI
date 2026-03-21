const { DataTypes } = require('sequelize');
const sequelize = require('../config/dbConfig');

const TopicModel = sequelize.define('Topic', {
    id:   { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    name: { type: DataTypes.STRING,  allowNull: false, unique: true },
}, {
    tableName: 'Topics',
    timestamps: false,
});

module.exports = TopicModel;
