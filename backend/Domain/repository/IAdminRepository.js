class IAdminRepository {

    async getOverview() {
        throw new Error('getOverview not implemented');
    }

    async getActivity(from, to) {
        throw new Error('getActivity not implemented');
    }

    async getChallengesByTopic() {
        throw new Error('getChallengesByTopic not implemented');
    }

    async getChallengesByDifficulty() {
        throw new Error('getChallengesByDifficulty not implemented');
    }

    async getSubmissionsByLanguage() {
        throw new Error('getSubmissionsByLanguage not implemented');
    }

    async getHardestChallenges() {
        throw new Error('getHardestChallenges not implemented');
    }

    async getTopUsers(limit) {
        throw new Error('getTopUsers not implemented');
    }

    async getReportsByStatus() {
        throw new Error('getReportsByStatus not implemented');
    }

    async getReportsByReason() {
        throw new Error('getReportsByReason not implemented');
    }

    async getRecentReports() {
        throw new Error('getRecentReports not implemented');
    }
}

module.exports = IAdminRepository;
