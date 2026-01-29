const sequelize = require('../config/dbConfig');
const User = require('./UserModel');
const Challenge = require('./ChallengeModel');
const ChallengeParameter = require('./ChallengeParameterModel');
const ChallengeTestCase = require('./ChallengeTestCaseModel');
const TestCaseArgument = require('./TestCaseArgumentModel');

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

const models = {
    User,
    Challenge,
    ChallengeParameter,
    ChallengeTestCase,
    TestCaseArgument,
};

module.exports = models;