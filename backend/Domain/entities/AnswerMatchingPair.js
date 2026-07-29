class AnswerMatchingPair {
    constructor({ id = null, answerId, optionId, matchPair }) {
        this.id = id;
        this.answerId = answerId;
        this.optionId = optionId;
        this.matchPair = matchPair;
    }
}

module.exports = AnswerMatchingPair;
