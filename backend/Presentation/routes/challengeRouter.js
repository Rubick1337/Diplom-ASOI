const Router = require("express");
const router = new Router();
const challengeController = require("../controllers/challengeController");

router.post('/create', challengeController.create);
router.post('/verify', challengeController.verify);
router.get('/getAll', challengeController.getAll);
router.post('/format', challengeController.format);
router.get('/topics', challengeController.getTopics);
router.post('/topics', challengeController.createTopic);
router.post('/ai/generate', challengeController.aiGenerateChallenge);

router.get('/:id', challengeController.getOne);
router.put('/:id', challengeController.update);
router.delete('/:id', challengeController.delete);

router.post('/:id/execute', challengeController.execute);
router.get('/:id/history', challengeController.getHistory);
router.get('/:id/solutions', challengeController.getSolutions);

router.get('/:id/reviews', challengeController.getReviews);
router.post('/:id/reviews', challengeController.createReview);

router.get('/:id/report-reasons', challengeController.getReportReasons);
router.post('/:id/report', challengeController.createReport);

router.post('/:id/ai/analyze', challengeController.aiAnalyze);
router.post('/:id/ai/chat', challengeController.aiChat);

module.exports = router;
