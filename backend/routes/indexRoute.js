const Router = require("express");
const router = new Router();
const userRouter = require("../routes/userRouter");
const historyRouter = require("../routes/historyRouter");
const roadMapRouter = require("../routes/roadMapRouter");
const testRouter = require("../routes/testRouter");
const codeTaskRouter = require("../routes/codeTaskRouter");

router.use("/users", userRouter);
router.use("/history", historyRouter);
router.use("/roadmaps", roadMapRouter);
router.use("/tests", testRouter);
router.use("/code-tasks", codeTaskRouter);

module.exports = router