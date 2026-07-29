class AttemptAnswer {
    constructor({
        id = null,
        attemptId,
        questionId,
        answerText = null,
        codeAnswer = null,
        isCorrect = null,
        pointsEarned = 0,
    }) {
        this.id = id;
        this.attemptId = attemptId;
        this.questionId = questionId;
        this.answerText = answerText;
        this.codeAnswer = codeAnswer;
        this.isCorrect = isCorrect;
        this.pointsEarned = pointsEarned;
    }
}

module.exports = AttemptAnswer;
