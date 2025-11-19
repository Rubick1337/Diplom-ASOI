class Challenge {
    constructor({
                    id = null,
                    name,
                    description,
                    mode = 'harness',
                    funcName,
                    properties = null,
                    timeLimitMs = 2000,
                    createdByUserId = null,
                    testCases = [],
                }) {
        this.id = id;
        this.name = name;
        this.description = description;
        this.mode = mode;
        this.funcName = funcName;
        this.properties = properties;
        this.timeLimitMs = timeLimitMs;
        this.createdByUserId = createdByUserId;
        this.testCases = testCases;
    }
}

module.exports = Challenge;
