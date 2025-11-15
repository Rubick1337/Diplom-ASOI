const Router = require("express");
const router = new Router();
const userRouter = require("./userRouter");
const authRouter = require('./authRouter');

router.use("/users", userRouter);
router.use('/api/auth', authRouter);

module.exports = router