const { DataTypes } = require('sequelize');
const sequelize = require('../config/dbConfig');

const Achievement = sequelize.define('Achievement', {
    id:            { type: DataTypes.INTEGER,     primaryKey: true, autoIncrement: true },
    title:         { type: DataTypes.STRING(255), allowNull: false },
    desc:          { type: DataTypes.TEXT,        allowNull: false },
    rarity:        { type: DataTypes.STRING(20),  allowNull: false, defaultValue: 'common' },
    imageFilename: { type: DataTypes.STRING(255), allowNull: true },
}, { tableName: 'Achievements', timestamps: false });

module.exports = Achievement;
