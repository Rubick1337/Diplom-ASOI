class QuestionTestCase {
    constructor({
        id = null,
        questionId,
        input = null,
        expectedOutput,
        isHidden = false,
        order = 0,
    }) {
        this.id = id;
        this.questionId = questionId;
        this.input = input;
        this.expectedOutput = expectedOutput;
        this.isHidden = isHidden;
        this.order = order;
    }
}

module.exports = QuestionTestCase;
