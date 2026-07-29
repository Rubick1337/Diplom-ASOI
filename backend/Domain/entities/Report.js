class Report {
    constructor({
        id = null,
        userId,
        challengeId = null,
        testId = null,
        reasonId = null,
        reasonText = null,
        status = 'Pending',
        resolvedById = null,
        resolvedAt = null,
        createdAt = new Date(),
    }) {
        this.id = id;
        this.userId = userId;
        this.challengeId = challengeId;
        this.testId = testId;
        this.reasonId = reasonId;
        this.reasonText = reasonText;
        this.status = status;
        this.resolvedById = resolvedById;
        this.resolvedAt = resolvedAt;
        this.createdAt = createdAt;
    }
}

module.exports = Report;
