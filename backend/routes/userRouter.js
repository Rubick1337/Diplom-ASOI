const Router = require("express");
const router = new Router();
const userController = require("../controllers/userController");

router.post('/register',userController.registration)
router.post('/login',userController.login )
// router.get("/getAll",userController.getAll)
// router.get("activate/:link",userController.activate);
router.get('/refresh',userController.refresh);
router.post("/logout",userController.logout);
// router.put("/:id",userController.updateUser)

module.exports = router;