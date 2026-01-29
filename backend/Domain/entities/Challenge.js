class Challenge {
    constructor({
                    id = null, name, description, topic = 'General',
                    mode = 'harness', funcName, timeLimitMs = 2000,
                    createdByUserId = null, isHidden = false,
                    sampleInput = '', sampleOutput = '',
                    parameters = [],
                    testCases = []
                }) {
        this.id = id;
        this.name = name;
        this.description = description;
        this.topic = topic;
        this.mode = mode;
        this.funcName = funcName;
        this.timeLimitMs = timeLimitMs;
        this.createdByUserId = createdByUserId;
        this.isHidden = isHidden;
        this.sampleInput = sampleInput;
        this.sampleOutput = sampleOutput;
        this.parameters = parameters;
        this.testCases = testCases;
    }
}
module.exports = Challenge;