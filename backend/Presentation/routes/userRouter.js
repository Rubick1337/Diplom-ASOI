const Router = require("express");
const router = new Router();
const userController = require("../controllers/userController");

router.post('/register', userController.registration);
router.post('/login', userController.login);
router.get('/refresh', userController.refresh);
router.post('/logout', userController.logout);
router.get('/getAll', userController.getAll);
router.put('/:id', userController.updateUser);

module.exports = router;
