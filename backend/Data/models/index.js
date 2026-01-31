const sequelize = require('../config/dbConfig');
const User = require('./UserModel');
const Challenge = require('./ChallengeModel');
const ChallengeParameter = require('./ChallengeParameterModel');
const ChallengeTestCase = require('./ChallengeTestCaseModel');
const TestCaseArgument = require('./TestCaseArgumentModel');
const HistoryChallenges = require('./HistoryChallengesModel');
const ReviewChallenges = require('./ReviewChallengesModel');

Challenge.hasMany(ChallengeParameter, {
    foreignKey: 'challengeId',
    as: 'parameters',
    onDelete: 'CASCADE',
});
ChallengeParameter.belongsTo(Challenge, { foreignKey: 'challengeId' });

Challenge.hasMany(ChallengeTestCase, {
    foreignKey: 'challengeId',
    as: 'testCases',
    onDelete: 'CASCADE',
});
ChallengeTestCase.belongsTo(Challenge, { foreignKey: 'challengeId' });

ChallengeTestCase.hasMany(TestCaseArgument, {
    foreignKey: 'testCaseId',
    as: 'testArgs',
    onDelete: 'CASCADE',
});
TestCaseArgument.belongsTo(ChallengeTestCase, { foreignKey: 'testCaseId' });

User.hasMany(Challenge, {
    foreignKey: 'createdByUserId',
    as: 'challenges',
});
Challenge.belongsTo(User, {
    foreignKey: 'createdByUserId',
    as: 'author',
});

User.hasMany(HistoryChallenges, {
    foreignKey: 'userId',
    as: 'historyChallenges',
    onDelete: 'CASCADE',
});
HistoryChallenges.belongsTo(User, { foreignKey: 'userId', as: 'user' });

Challenge.hasMany(HistoryChallenges, {
    foreignKey: 'challengeId',
    as: 'historyChallenges',
    onDelete: 'CASCADE',
});
HistoryChallenges.belongsTo(Challenge, { foreignKey: 'challengeId', as: 'challenge' });

User.hasMany(ReviewChallenges, {
    foreignKey: 'userId',
    as: 'reviews',
    onDelete: 'CASCADE',
});
ReviewChallenges.belongsTo(User, { foreignKey: 'userId', as: 'user' });

Challenge.hasMany(ReviewChallenges, {
    foreignKey: 'challengeId',
    as: 'reviews',
    onDelete: 'CASCADE',
});
ReviewChallenges.belongsTo(Challenge, { foreignKey: 'challengeId', as: 'challenge' });

const models = {
    User,
    Challenge,
    ChallengeParameter,
    ChallengeTestCase,
    TestCaseArgument,
    HistoryChallenges,
    ReviewChallenges,
};

module.exports = models;