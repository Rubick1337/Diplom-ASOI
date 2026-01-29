const Router = require("express");
const router = new Router();

const challengeController = require("../controllers/challengeController");

router.post('/create', challengeController.create);
router.get('/getAll', challengeController.getAll);
router.get('/:id', challengeController.getOne);
router.put('/:id', challengeController.update);
router.delete('/:id', challengeController.delete);
router.post('/:id/execute', challengeController.execute);
router.post('/format', challengeController.format);

module.exports = router;
