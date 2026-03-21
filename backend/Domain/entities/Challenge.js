class Challenge {
    constructor({
                    id = null, name, description, topics = [],
                    mode = 'harness', funcName, timeLimitMs = 2000,
                    createdByUserId = null, isHidden = false,
                    sampleInput = '', sampleOutput = '',
                    parameters = [],
                    testCases = [],
                    difficulty = 1,
                    solvedCount = 0,
                    averageRating = 0
                }) {
        this.id = id;
        this.name = name;
        this.description = description;
        this.topics = topics;
        this.mode = mode;
        this.funcName = funcName;
        this.timeLimitMs = timeLimitMs;
        this.createdByUserId = createdByUserId;
        this.isHidden = isHidden;
        this.sampleInput = sampleInput;
        this.sampleOutput = sampleOutput;
        this.parameters = parameters;
        this.testCases = testCases;
        this.difficulty = difficulty;
        this.solvedCount = solvedCount;
        this.averageRating = averageRating;
    }
}
module.exports = Challenge;
