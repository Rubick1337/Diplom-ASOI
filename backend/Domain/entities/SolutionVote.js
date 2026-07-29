class SolutionVote {
    constructor({ id = null, solutionId, userId, vote, createdAt = new Date() }) {
        this.id = id;
        this.solutionId = solutionId;
        this.userId = userId;
        this.vote = vote; // -1 | 1
        this.createdAt = createdAt;
    }
}

module.exports = SolutionVote;
