class AnswerTestCaseResult {
    constructor({
        id = null,
        answerId,
        position,
        input = null,
        expectedOutput,
        actualOutput = null,
        passed = false,
        isHidden = false,
        timedOut = false,
        error = null,
    }) {
        this.id = id;
        this.answerId = answerId;
        this.position = position;
        this.input = input;
        this.expectedOutput = expectedOutput;
        this.actualOutput = actualOutput;
        this.passed = passed;
        this.isHidden = isHidden;
        this.timedOut = timedOut;
        this.error = error;
    }
}

module.exports = AnswerTestCaseResult;
