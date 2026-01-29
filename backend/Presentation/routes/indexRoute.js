const Router = require("express");
const router = new Router();
const userRouter = require("./userRouter");
const authRouter = require('./authRouter');
const challengeRouter = require("./challengeRouter");

router.use("/users", userRouter);
router.use('/auth', authRouter);
router.use("/challenges", challengeRouter);

module.exports = router