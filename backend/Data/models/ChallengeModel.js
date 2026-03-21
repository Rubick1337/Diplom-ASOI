const { DataTypes } = require('sequelize');
const sequelize = require('../config/dbConfig');

const ChallengeModel = sequelize.define(
    'Challenge',
    {
        id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
        name: { type: DataTypes.STRING, allowNull: false, unique: true },
        description: { type: DataTypes.TEXT, allowNull: false },
        difficulty: {
            type: DataTypes.INTEGER,
            allowNull: false,
            defaultValue: 1,
            validate: { min: 1, max: 10 }
        },
        mode: { type: DataTypes.STRING, allowNull: false, defaultValue: 'harness' },
        funcName: { type: DataTypes.STRING, allowNull: false },
        timeLimitMs: { type: DataTypes.INTEGER, allowNull: true },
        createdByUserId: { type: DataTypes.INTEGER, allowNull: true },
        sampleInput: { type: DataTypes.TEXT, allowNull: true, defaultValue: '' },
        sampleOutput: { type: DataTypes.TEXT, allowNull: true, defaultValue: '' },
        isHidden: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
    },
    { tableName: 'Challenges', timestamps: false }
);

ChallengeModel.addScope('withStats', {
    attributes: {
        include: [
            [
                sequelize.literal(`(
                    SELECT COUNT(DISTINCT "userId")
                    FROM "HistoryChallenges"
                    WHERE "challengeId" = "Challenge"."id" AND "status" = 'success'
                )`),
                'solvedCount'
            ],
            [
                sequelize.literal(`(
                    SELECT COALESCE(AVG("rating"), 0)
                    FROM "ReviewChallenges"
                    WHERE "challengeId" = "Challenge"."id"
                )`),
                'averageRating'
            ]
        ]
    }
});

module.exports = ChallengeModel;
