class ChallengeTestCase {
    constructor({
                    id = null,
                    challengeId,
                    inputArgs = [],
                    expectedOutput = null,
                    isSample = false,
                    order = 0,
                    weight = 1,
                }) {
        this.id = id;
        this.challengeId = challengeId;
        this.inputArgs = inputArgs;          // массив аргументов для функции (то, что было "in")
        this.expectedOutput = expectedOutput; // ожидаемый результат (то, что было "out")
        this.isSample = isSample;            // показывать ли юзеру в примерах
        this.order = order;                  // порядок отображения/прогонки
        this.weight = weight;                // вес теста (на будущее для скоринга)
    }
}

module.exports = ChallengeTestCase;
