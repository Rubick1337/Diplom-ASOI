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
}

module.exports = IChallengeRepository;
