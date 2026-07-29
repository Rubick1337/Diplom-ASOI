const sequelize = require('../config/dbConfig');
const { DataTypes } = require('sequelize');

const SolutionVoteModel = sequelize.define(
    'SolutionVote',
    {
        id:         { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
        solutionId: { type: DataTypes.INTEGER, allowNull: false },
        userId:     { type: DataTypes.INTEGER, allowNull: false },
        vote:       { type: DataTypes.SMALLINT, allowNull: false, validate: { isIn: [[-1, 1]] } },
        createdAt:  { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
    },
    {
        tableName: 'SolutionVotes',
        timestamps: false,
        indexes: [{ unique: true, fields: ['solutionId', 'userId'] }],
    }
);

module.exports = SolutionVoteModel;
