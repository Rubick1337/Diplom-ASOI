class ChallengeTestCase {
    constructor({
                    id = null,
                    challengeId,
                    title = 'Test Case',
                    expectedOutput,
                    testArgs = []
                }) {
        this.id = id;
        this.challengeId = challengeId;
        this.title = title;
        this.expectedOutput = expectedOutput;
        this.testArgs = testArgs;
    }
}
module.exports = ChallengeTestCase;
