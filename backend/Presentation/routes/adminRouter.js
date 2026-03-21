const Router = require('express');
const router = new Router();
const adminController = require('../controllers/adminController');

router.get('/overview',          adminController.getOverview);
router.get('/activity',          adminController.getActivity);
router.get('/challenges',        adminController.getChallengeStats);
router.get('/users',             adminController.getTopUsers);
router.get('/reports',           adminController.getReportsStats);
router.get('/reports/recent',    adminController.getRecentReports);
router.get('/report-reasons',    adminController.getReportReasons);
router.get('/heatmap',           adminController.getActivityHeatmap);
router.get('/funnel',            adminController.getChallengeFunnel);
router.get('/distributions',     adminController.getUserDistributions);
router.get('/leaderboard',       adminController.getLeaderboard);

router.patch('/reports/:id',     adminController.updateReportStatus);

router.get('/challenges/manage',            adminController.getChallengesManage);
router.patch('/challenges/:id',             adminController.updateChallengeAdmin);
router.get('/challenges/:id/detail',        adminController.getChallengeDetail);
router.patch('/challenges/:id/hidden',      adminController.toggleChallengeHidden);
router.patch('/challenges/:id/difficulty',  adminController.updateChallengeDifficulty);
router.delete('/challenges/:id',            adminController.deleteChallengeAdmin);

router.get('/topics',        adminController.getAllTopics);
router.post('/topics',       adminController.createTopic);
router.put('/topics/:id',    adminController.updateTopic);
router.delete('/topics/:id', adminController.deleteTopic);

module.exports = router;
