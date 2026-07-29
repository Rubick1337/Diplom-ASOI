const { DataTypes } = require('sequelize');
const sequelize = require('../config/dbConfig');

const UserAchievement = sequelize.define('UserAchievement', {
    id:            { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    userId:        { type: DataTypes.INTEGER, allowNull: false },
    achievementId: { type: DataTypes.INTEGER, allowNull: false },
    unlockedAt:    { type: DataTypes.DATE,    allowNull: false, defaultValue: DataTypes.NOW },
}, {
    tableName: 'UserAchievements',
    timestamps: false,
    indexes: [{ unique: true, fields: ['userId', 'achievementId'] }],
});

module.exports = UserAchievement;
