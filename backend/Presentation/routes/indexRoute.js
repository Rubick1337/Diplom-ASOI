const Router = require("express");
const router = new Router();
const userRouter = require("./userRouter");
const authRouter = require('./authRouter');
const challengeRouter = require("./challengeRouter");
const adminRouter = require('./adminRouter');
const testRouter     = require('./testRouter');
const solutionRouter = require('./solutionRouter');

router.use("/users", userRouter);
router.use('/auth', authRouter);
router.use("/challenges", challengeRouter);
router.use('/admin', adminRouter);
router.use('/tests', testRouter);
router.use('/solutions', solutionRouter);

module.exports = router
