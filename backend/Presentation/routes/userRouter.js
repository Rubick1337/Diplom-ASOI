const Router = require("express");
const router = new Router();
const userController = require("../controllers/userController");
const adminController = require("../controllers/AdminController");

router.post('/send-code', userController.sendVerificationCode);
router.post('/register', userController.registration);
router.post('/login', userController.login);
router.get('/refresh', userController.refresh);
router.post('/logout', userController.logout);
router.get('/getAll', userController.getAll);
router.get('/profile', userController.getProfile);
router.get('/my-history', userController.getMyHistory);
router.get('/my-test-history', userController.getMyTestHistory);
router.get('/my-challenges', userController.getMyChallenges);
router.get('/my-reports', userController.getMyReports);
router.get('/learning-plan', userController.getLearningPlan);
router.get('/activity-heatmap', userController.getActivityHeatmap);
router.post('/topic-guide', userController.generateTopicGuide);
router.get('/leaderboard', adminController.getLeaderboard);
router.get('/notifications', userController.getNotifications);
router.patch('/notifications/:id/read', userController.markNotificationRead);
router.delete('/notifications',     userController.deleteAllNotifications);
router.delete('/notifications/:id', userController.deleteNotification);
router.get('/achievements', userController.getAchievements);
router.put('/:id', userController.updateUser);

module.exports = router;
