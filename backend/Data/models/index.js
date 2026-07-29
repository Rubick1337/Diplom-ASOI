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
const Review       = require('./ReviewModel');
const Report       = require('./ReportModel');
const ReportReason = require('./ReportReasonModel');
const Notification    = require('./NotificationModel');
const Achievement     = require('./AchievementModel');
const UserAchievement = require('./UserAchievementModel');
const QuestionType     = require('./QuestionTypeModel');
const Test             = require('./TestModel');
const Question         = require('./QuestionModel');
const QuestionOption   = require('./QuestionOptionModel');
const QuestionTestCase = require('./QuestionTestCaseModel');
const TestAttempt           = require('./TestAttemptModel');
const AttemptQuestion       = require('./AttemptQuestionModel');
const AttemptAnswer         = require('./AttemptAnswerModel');
const AnswerSelectedOption  = require('./AnswerSelectedOptionModel');
const AnswerMatchingPair    = require('./AnswerMatchingPairModel');
const AnswerTestCaseResult  = require('./AnswerTestCaseResultModel');
const SolutionVote          = require('./SolutionVoteModel');
const SolutionComment       = require('./SolutionCommentModel');

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

User.hasMany(Review, { foreignKey: 'userId', as: 'reviews', onDelete: 'CASCADE' });
Review.belongsTo(User, { foreignKey: 'userId', as: 'user' });

Challenge.hasMany(Review, { foreignKey: 'challengeId', as: 'reviews', onDelete: 'CASCADE' });
Review.belongsTo(Challenge, { foreignKey: 'challengeId', as: 'challenge' });

Test.hasMany(Review, { foreignKey: 'testId', as: 'reviews', onDelete: 'CASCADE' });
Review.belongsTo(Test, { foreignKey: 'testId', as: 'test' });

User.hasMany(Report, {
    foreignKey: 'userId',
    as: 'reports',
    onDelete: 'CASCADE',
});
Report.belongsTo(User, { foreignKey: 'userId', as: 'reporter' });

User.hasMany(HistoryChallenges, { foreignKey: 'userId', as: 'submissions', onDelete: 'CASCADE' });
Challenge.hasMany(HistoryChallenges, { foreignKey: 'challengeId', as: 'submissions', onDelete: 'CASCADE' });

Challenge.hasMany(Report, {
    foreignKey: 'challengeId',
    as: 'reports',
    onDelete: 'CASCADE',
});
Report.belongsTo(Challenge, { foreignKey: 'challengeId', as: 'challenge' });

ReportReason.hasMany(Report, { foreignKey: 'reasonId', as: 'reports' });
Report.belongsTo(ReportReason, { foreignKey: 'reasonId', as: 'reason' });

Report.belongsTo(User, { as: 'resolver', foreignKey: 'resolvedById' });

User.hasMany(Notification, { foreignKey: 'userId', as: 'notifications', onDelete: 'CASCADE' });
Notification.belongsTo(User, { foreignKey: 'userId', as: 'user' });

User.hasMany(UserAchievement, { foreignKey: 'userId', as: 'userAchievements', onDelete: 'CASCADE' });
UserAchievement.belongsTo(Achievement, { foreignKey: 'achievementId', as: 'achievement' });
Achievement.hasMany(UserAchievement, { foreignKey: 'achievementId', as: 'userAchievements' });

// ─── Tests ────────────────────────────────────────────────────────────────────

// Test → User (createdBy)
User.hasMany(Test, { foreignKey: 'createdBy', as: 'tests' });
Test.belongsTo(User, { foreignKey: 'createdBy', as: 'author' });

// Test → Topic
Topic.hasMany(Test, { foreignKey: 'topicId', as: 'testsInTopic' });
Test.belongsTo(Topic, { foreignKey: 'topicId', as: 'topic' });

// Test → Questions
Test.hasMany(Question, { foreignKey: 'testId', as: 'questions', onDelete: 'CASCADE' });
Question.belongsTo(Test, { foreignKey: 'testId', as: 'test' });

// Question → QuestionType
QuestionType.hasMany(Question, { foreignKey: 'typeId', as: 'questions' });
Question.belongsTo(QuestionType, { foreignKey: 'typeId', as: 'type' });

// Question → QuestionOptions
Question.hasMany(QuestionOption,   { foreignKey: 'questionId', as: 'options',    onDelete: 'CASCADE' });
QuestionOption.belongsTo(Question, { foreignKey: 'questionId', as: 'question' });

// Question → QuestionTestCases
Question.hasMany(QuestionTestCase,   { foreignKey: 'questionId', as: 'testCases', onDelete: 'CASCADE' });
QuestionTestCase.belongsTo(Question, { foreignKey: 'questionId', as: 'question' });

// Test → TestAttempts
Test.hasMany(TestAttempt, { foreignKey: 'testId', as: 'attempts', onDelete: 'CASCADE' });
TestAttempt.belongsTo(Test, { foreignKey: 'testId', as: 'test' });

// User → TestAttempts
User.hasMany(TestAttempt, { foreignKey: 'userId', as: 'testAttempts', onDelete: 'CASCADE' });
TestAttempt.belongsTo(User, { foreignKey: 'userId', as: 'user' });

// TestAttempt → AttemptQuestions
TestAttempt.hasMany(AttemptQuestion, { foreignKey: 'attemptId', as: 'attemptQuestions', onDelete: 'CASCADE' });
AttemptQuestion.belongsTo(TestAttempt, { foreignKey: 'attemptId', as: 'attempt' });

// Question → AttemptQuestions
Question.hasMany(AttemptQuestion, { foreignKey: 'questionId', as: 'attemptQuestions', onDelete: 'CASCADE' });
AttemptQuestion.belongsTo(Question, { foreignKey: 'questionId', as: 'question' });

// TestAttempt → AttemptAnswers
TestAttempt.hasMany(AttemptAnswer, { foreignKey: 'attemptId', as: 'answers', onDelete: 'CASCADE' });
AttemptAnswer.belongsTo(TestAttempt, { foreignKey: 'attemptId', as: 'attempt' });

// AttemptAnswer → Question (чтобы подгружать текст вопроса в результатах)
Question.hasMany(AttemptAnswer, { foreignKey: 'questionId', as: 'answers', onDelete: 'CASCADE' });
AttemptAnswer.belongsTo(Question, { foreignKey: 'questionId', as: 'question' });

// AttemptAnswer → AnswerSelectedOptions
AttemptAnswer.hasMany(AnswerSelectedOption, { foreignKey: 'answerId', as: 'selectedOptions', onDelete: 'CASCADE' });
AnswerSelectedOption.belongsTo(AttemptAnswer, { foreignKey: 'answerId' });
QuestionOption.hasMany(AnswerSelectedOption, { foreignKey: 'optionId', as: 'selectedInAnswers', onDelete: 'CASCADE' });
AnswerSelectedOption.belongsTo(QuestionOption, { foreignKey: 'optionId', as: 'option' });

// AttemptAnswer → AnswerMatchingPairs
AttemptAnswer.hasMany(AnswerMatchingPair, { foreignKey: 'answerId', as: 'matchingPairs', onDelete: 'CASCADE' });
AnswerMatchingPair.belongsTo(AttemptAnswer, { foreignKey: 'answerId' });
QuestionOption.hasMany(AnswerMatchingPair, { foreignKey: 'optionId', as: 'matchingInAnswers', onDelete: 'CASCADE' });
AnswerMatchingPair.belongsTo(QuestionOption, { foreignKey: 'optionId', as: 'option' });

// AttemptAnswer → AnswerTestCaseResults
AttemptAnswer.hasMany(AnswerTestCaseResult, { foreignKey: 'answerId', as: 'testCaseResultRows', onDelete: 'CASCADE' });
AnswerTestCaseResult.belongsTo(AttemptAnswer, { foreignKey: 'answerId' });

// ─── SolutionVotes & SolutionComments ────────────────────────────────────────

HistoryChallenges.hasMany(SolutionVote, { foreignKey: 'solutionId', as: 'votes', onDelete: 'CASCADE' });
SolutionVote.belongsTo(HistoryChallenges, { foreignKey: 'solutionId', as: 'solution' });

User.hasMany(SolutionVote, { foreignKey: 'userId', as: 'solutionVotes', onDelete: 'CASCADE' });
SolutionVote.belongsTo(User, { foreignKey: 'userId', as: 'voter' });

HistoryChallenges.hasMany(SolutionComment, { foreignKey: 'solutionId', as: 'comments', onDelete: 'CASCADE' });
SolutionComment.belongsTo(HistoryChallenges, { foreignKey: 'solutionId', as: 'solution' });

User.hasMany(SolutionComment, { foreignKey: 'userId', as: 'solutionComments', onDelete: 'CASCADE' });
SolutionComment.belongsTo(User, { foreignKey: 'userId', as: 'author' });

// ─────────────────────────────────────────────────────────────────────────────

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
    Review,
    Report,
    ReportReason,
    Notification,
    Achievement,
    UserAchievement,
    QuestionType,
    Test,
    Question,
    QuestionOption,
    QuestionTestCase,
    TestAttempt,
    AttemptQuestion,
    AttemptAnswer,
    AnswerSelectedOption,
    AnswerMatchingPair,
    AnswerTestCaseResult,
    SolutionVote,
    SolutionComment,
};

module.exports = models;
