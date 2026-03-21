const { DataTypes } = require('sequelize');
const sequelize = require('../config/dbConfig');

const ChallengeTopic = sequelize.define('ChallengeTopic', {
    challengeId: { type: DataTypes.INTEGER, primaryKey: true },
    topicId:     { type: DataTypes.INTEGER, primaryKey: true },
}, {
    tableName: 'ChallengeTopics',
    timestamps: false,
});

module.exports = ChallengeTopic;
