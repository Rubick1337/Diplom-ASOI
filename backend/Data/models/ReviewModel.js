const sequelize = require('../config/dbConfig');
const { DataTypes } = require('sequelize');

const ReviewModel = sequelize.define(
    'Review',
    {
        id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
        userId: { type: DataTypes.INTEGER, allowNull: false },
        challengeId: { type: DataTypes.INTEGER, allowNull: true },
        testId: { type: DataTypes.INTEGER, allowNull: true },
        content: { type: DataTypes.TEXT, allowNull: true },
        rating: {
            type: DataTypes.INTEGER,
            allowNull: false,
            defaultValue: 5,
            validate: { min: 1, max: 5 }
        },
        createdAt: { type: DataTypes.DATE, defaultValue: DataTypes.NOW }
    },
    {
        tableName: 'Reviews',
        timestamps: false
    }
);

module.exports = ReviewModel;
