class HistoryChallenges {
    constructor({
                    id = null,
                    userId,
                    challengeId,
                    code,
                    language,
                    status = 'Pending',
                    executionTimeMs = null,
                    createdAt = new Date()
                }) {
        this.id = id;
        this.userId = userId;
        this.challengeId = challengeId;
        this.code = code;
        this.language = language;
        this.status = status;
        this.executionTimeMs = executionTimeMs;
        this.createdAt = createdAt;
    }
}

module.exports = HistoryChallenges;
