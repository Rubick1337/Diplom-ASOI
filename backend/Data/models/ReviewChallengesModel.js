const sequelize = require('../config/dbConfig');
const { DataTypes } = require('sequelize');

const ReviewChallengesModel = sequelize.define(
    'ReviewChallenges',
    {
        userId: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            allowNull: false
        },
        challengeId: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            allowNull: false
        },
        content: { type: DataTypes.TEXT, allowNull: true },
        rating: {
            type: DataTypes.INTEGER,
            allowNull: false,
            defaultValue: 5,
            validate: { min: 1, max: 5 }
        },
        createdAt: {
            type: DataTypes.DATE,
            defaultValue: DataTypes.NOW
        }
    },
    {
        tableName: 'ReviewChallenges',
        timestamps: false
    }
);

module.exports = ReviewChallengesModel;
