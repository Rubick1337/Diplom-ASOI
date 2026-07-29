class AnswerSelectedOption {
    constructor({ id = null, answerId, optionId }) {
        this.id = id;
        this.answerId = answerId;
        this.optionId = optionId;
    }
}

module.exports = AnswerSelectedOption;
