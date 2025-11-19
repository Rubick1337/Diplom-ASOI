const sequelize = require('../config/dbConfig');

const User = require('./UserModel');
const Challenge = require('./challengeModel');
const ChallengeTestCase = require('./challengeTestCaseModel');

User.hasMany(Challenge, {
    foreignKey: 'createdByUserId',
    as: 'challenges',
});

Challenge.belongsTo(User, {
    foreignKey: 'createdByUserId',
    as: 'author',
});

Challenge.hasMany(ChallengeTestCase, {
    foreignKey: 'challengeId',
    as: 'testCases',
    onDelete: 'CASCADE',
});

ChallengeTestCase.belongsTo(Challenge, {
    foreignKey: 'challengeId',
    as: 'challenge',
});

const models = {
    User,
    Challenge,
    ChallengeTestCase,
};

module.exports = models;
