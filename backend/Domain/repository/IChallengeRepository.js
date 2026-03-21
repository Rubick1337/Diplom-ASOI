class IChallengeRepository {

    async createWithTestCases(challengeData, testCasesData) {
        throw new Error('createWithTestCases not implemented');
    }

    async findOne(filter) {
        throw new Error('findOne not implemented');
    }

    async findByIdWithTestCases(id) {
        throw new Error('findByIdWithTestCases not implemented');
    }

    async findManyWithTestCases(filter, options) {
        throw new Error('findManyWithTestCases not implemented');
    }

    async updateWithTestCases(id, challengeData, testCasesData) {
        throw new Error('updateWithTestCases not implemented');
    }

    async delete(id) {
        throw new Error('delete not implemented');
    }

    async createSubmission(submissionData) {
        throw new Error('createSubmission not implemented');
    }

    async findUserHistory(userId, challengeId) {
        throw new Error('findUserHistory not implemented');
    }

    async hasUserSolvedChallenge(userId, challengeId) {
        throw new Error('hasUserSolvedChallenge not implemented');
    }

    async findCommunitySolutions(challengeId, options = { limit: 20, offset: 0 }) {
        throw new Error('findCommunitySolutions not implemented');
    }

    async createReview(reviewData) {
        throw new Error('createReview not implemented');
    }

    async findReviewsByChallengeId(challengeId) {
        throw new Error('findReviewsByChallengeId not implemented');
    }

    async getAverageRating(challengeId) {
        throw new Error('getAverageRating not implemented');
    }
}

module.exports = IChallengeRepository;
