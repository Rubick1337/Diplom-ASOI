class AttemptQuestion {
    constructor({ id = null, attemptId, questionId, position }) {
        this.id = id;
        this.attemptId = attemptId;
        this.questionId = questionId;
        this.position = position;
    }
}

module.exports = AttemptQuestion;
