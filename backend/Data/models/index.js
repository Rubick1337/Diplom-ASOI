const sequelize = require('../config/dbConfig');
const User = require('./UserModel');
const Role = require('./RoleModel');
const Topic = require('./TopicModel');
const Challenge = require('./ChallengeModel');
const ChallengeTopic = require('./ChallengeTopicModel');
const ChallengeParameter = require('./ChallengeParameterModel');
const ChallengeTestCase = require('./ChallengeTestCaseModel');
const TestCaseArgument = require('./TestCaseArgumentModel');
const HistoryChallenges = require('./HistoryChallengesModel');
const ReviewChallenges = require('./ReviewChallengesModel');
const ReportChallenge = require('./ReportChallengeModel');
const ReportReason    = require('./ReportReasonModel');
const Notification    = require('./NotificationModel');

Role.hasMany(User, { foreignKey: 'roleId', as: 'users' });
User.belongsTo(Role, { foreignKey: 'roleId', as: 'role' });

Challenge.belongsToMany(Topic,     { through: ChallengeTopic, foreignKey: 'challengeId', otherKey: 'topicId', as: 'topics' });
Topic.belongsToMany(Challenge,     { through: ChallengeTopic, foreignKey: 'topicId',     otherKey: 'challengeId', as: 'challenges' });

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

User.hasMany(Challenge, { foreignKey: 'createdByUserId', as: 'challenges' });
Challenge.belongsTo(User, { foreignKey: 'createdByUserId', as: 'author' });

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

User.hasMany(ReportChallenge, {
    foreignKey: 'userId',
    as: 'reports',
    onDelete: 'CASCADE',
});
ReportChallenge.belongsTo(User, { foreignKey: 'userId', as: 'reporter' });

User.hasMany(HistoryChallenges, { foreignKey: 'userId', as: 'submissions', onDelete: 'CASCADE' });
Challenge.hasMany(HistoryChallenges, { foreignKey: 'challengeId', as: 'submissions', onDelete: 'CASCADE' });

Challenge.hasMany(ReportChallenge, {
    foreignKey: 'challengeId',
    as: 'reports',
    onDelete: 'CASCADE',
});
ReportChallenge.belongsTo(Challenge, { foreignKey: 'challengeId', as: 'challenge' });

ReportReason.hasMany(ReportChallenge, { foreignKey: 'reasonId', as: 'reports' });
ReportChallenge.belongsTo(ReportReason, { foreignKey: 'reasonId', as: 'reason' });

ReportChallenge.belongsTo(User, { as: 'resolver', foreignKey: 'resolvedById' });

User.hasMany(Notification, { foreignKey: 'userId', as: 'notifications', onDelete: 'CASCADE' });
Notification.belongsTo(User, { foreignKey: 'userId', as: 'user' });

const models = {
    User,
    Role,
    Topic,
    Challenge,
    ChallengeTopic,
    ChallengeParameter,
    ChallengeTestCase,
    TestCaseArgument,
    HistoryChallenges,
    ReviewChallenges,
    ReportChallenge,
    ReportReason,
    Notification,
};

module.exports = models;
