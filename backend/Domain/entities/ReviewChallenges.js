class Review {
    constructor({
                    id = null,
                    userId,
                    challengeId = null,
                    testId = null,
                    content,
                    rating = 5,
                    createdAt = new Date()
                }) {
        this.id = id;
        this.userId = userId;
        this.challengeId = challengeId;
        this.testId = testId;
        this.content = content;
        this.rating = rating;
        this.createdAt = createdAt;
    }
}

module.exports = Review;
