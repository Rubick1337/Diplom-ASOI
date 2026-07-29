class QuestionOption {
    constructor({
        id = null,
        questionId,
        text,
        isCorrect = false,
        matchPair = null,
        blankIndex = null,
        order = 0,
    }) {
        this.id = id;
        this.questionId = questionId;
        this.text = text;
        this.isCorrect = isCorrect;
        this.matchPair = matchPair;
        this.blankIndex = blankIndex;
        this.order = order;
    }
}

module.exports = QuestionOption;
