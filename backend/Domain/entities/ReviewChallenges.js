class ReviewChallenges {
    constructor({
                    id = null,
                    userId,
                    challengeId,
                    content,
                    rating = 5,
                    createdAt = new Date()
                }) {
        this.id = id;
        this.userId = userId;
        this.challengeId = challengeId;
        this.content = content;
        this.rating = rating;
        this.createdAt = createdAt;
    }
}

module.exports = ReviewChallenges;