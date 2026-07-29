class TestAttempt {
    constructor({
        id = null,
        testId,
        userId,
        startedAt = new Date(),
        finishedAt = null,
        status = 'active',
        score = null,
        maxScore,
    }) {
        this.id = id;
        this.testId = testId;
        this.userId = userId;
        this.startedAt = startedAt;
        this.finishedAt = finishedAt;
        this.status = status; // 'active' | 'completed' | 'timed_out'
        this.score = score;
        this.maxScore = maxScore;
    }
}

module.exports = TestAttempt;
