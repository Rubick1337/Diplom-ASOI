const Router = require("express");
const router = new Router();
const challengeController = require("../controllers/challengeController");

router.post('/create', challengeController.create);
router.get('/getAll', challengeController.getAll);
router.post('/format', challengeController.format);

router.get('/:id', challengeController.getOne);
router.put('/:id', challengeController.update);
router.delete('/:id', challengeController.delete);

router.post('/:id/execute', challengeController.execute);
router.get('/:id/history', challengeController.getHistory);
router.get('/:id/solutions', challengeController.getSolutions);

router.get('/:id/reviews', challengeController.getReviews);
router.post('/:id/reviews', challengeController.createReview);

module.exports = router;