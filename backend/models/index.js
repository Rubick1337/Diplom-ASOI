const sequelize = require('../config/dbConfig');

const User = require('../models/User');
const AnswerQuestions = require('../models/AnswerQuestions');
const CodeTask = require('../models/CodeTask');
const HistoryTest = require('../models/HistoryTest');
const RoadMaps = require('../models/RoadMaps');
const RoadMapsSteps = require('../models/RoadMapsSteps');
const TestCode = require('../models/TestCode');
const Tests = require('../models/Tests');
const TestTheoryQustions = require('../models/TestTheoryQustions');
const TheoryQuestions = require('../models/TheoryQuestions');

// Связи для User
User.hasMany(HistoryTest, { foreignKey: 'UserId', as: 'historyTest' });

// Связи для Tests
Tests.hasMany(HistoryTest, { foreignKey: 'TestsId', as: 'historyTest' });
Tests.hasMany(TestTheoryQustions, { foreignKey: 'Testid', as: 'TestTheoryQustions' });
Tests.hasMany(TestCode, { foreignKey: 'Testid', as: 'TestCode' });

// Связи для TheoryQuestions
TheoryQuestions.hasMany(TestTheoryQustions, { foreignKey: 'TheoryQustionsid', as: 'TestTheoryQustions' });
TheoryQuestions.hasMany(AnswerQuestions, { foreignKey: 'TheoryQustionsId', as: 'AnswerQuestions' });

// Связи для CodeTask
CodeTask.hasMany(TestCode, { foreignKey: 'CodeTaskid', as: 'TestCode' });

// Связи для Roadmaps
RoadMaps.hasMany(RoadMapsSteps, { foreignKey: 'RoadMapsid', as: 'RoadMapsSteps' });

// Связи для RoadmapSteps (самореференциальная связь)
RoadMapsSteps.belongsTo(RoadMapsSteps, { foreignKey: 'RoadMapStepsid', as: 'parentStep' });
RoadMapsSteps.hasMany(RoadMapsSteps, { foreignKey: 'RoadMapStepsid', as: 'childSteps' });

HistoryTest.belongsTo(User, { foreignKey: 'UserId', as: 'User' });
HistoryTest.belongsTo(Tests, { foreignKey: 'TestsId', as: 'Tests' });

AnswerQuestions.belongsTo(TheoryQuestions, { foreignKey: 'TheoryQustionsId', as: 'TheoryQuestions' });

TestTheoryQustions.belongsTo(Tests, { foreignKey: 'Testid', as: 'Tests' });
TestTheoryQustions.belongsTo(TheoryQuestions, { foreignKey: 'TheoryQustionsid', as: 'TheoryQuestions' });

TestCode.belongsTo(Tests, { foreignKey: 'Testid', as: 'Tests' });
TestCode.belongsTo(CodeTask, { foreignKey: 'CodeTaskid', as: 'CodeTask' });

RoadMapsSteps.belongsTo(RoadMaps, { foreignKey: 'RoadMapsid', as: 'RoadMaps' });

const models = {
    User,
    AnswerQuestions,
    CodeTask,
    HistoryTest,
    RoadMaps,
    RoadMapsSteps,
    TestCode,
    Tests,
    TestTheoryQustions,
    TheoryQuestions
}

module.exports = models;