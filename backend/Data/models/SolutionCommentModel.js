const sequelize = require('../config/dbConfig');
const { DataTypes } = require('sequelize');

const SolutionCommentModel = sequelize.define(
    'SolutionComment',
    {
        id:         { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
        solutionId: { type: DataTypes.INTEGER, allowNull: false },
        userId:     { type: DataTypes.INTEGER, allowNull: false },
        content:    { type: DataTypes.TEXT,    allowNull: false },
        createdAt:  { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
        updatedAt:  { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
    },
    {
        tableName: 'SolutionComments',
        timestamps: false,
    }
);

module.exports = SolutionCommentModel;
