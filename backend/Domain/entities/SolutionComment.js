class SolutionComment {
    constructor({
        id = null,
        solutionId,
        userId,
        content,
        createdAt = new Date(),
        updatedAt = new Date(),
    }) {
        this.id = id;
        this.solutionId = solutionId;
        this.userId = userId;
        this.content = content;
        this.createdAt = createdAt;
        this.updatedAt = updatedAt;
    }
}

module.exports = SolutionComment;
