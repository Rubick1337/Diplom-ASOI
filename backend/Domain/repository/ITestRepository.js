class ITestRepository {

    // ── Типы вопросов ──────────────────────────────────────────────────────────

    async getQuestionTypes() {
        throw new Error('getQuestionTypes not implemented');
    }

    // ── Тесты (CRUD) ──────────────────────────────────────────────────────────

    async findAllAdmin() {
        throw new Error('findAllAdmin not implemented');
    }

    async findByIdAdmin(id) {
        throw new Error('findByIdAdmin not implemented');
    }

    async create(data, adminId) {
        throw new Error('create not implemented');
    }

    async update(id, data) {
        throw new Error('update not implemented');
    }

    async publish(id, isPublished) {
        throw new Error('publish not implemented');
    }

    async delete(id) {
        throw new Error('delete not implemented');
    }

    // ── Вопросы ───────────────────────────────────────────────────────────────

    async createQuestion(testId, data) {
        throw new Error('createQuestion not implemented');
    }

    async updateQuestion(id, data) {
        throw new Error('updateQuestion not implemented');
    }

    async deleteQuestion(id) {
        throw new Error('deleteQuestion not implemented');
    }

    async reorderQuestions(testId, orderedIds) {
        throw new Error('reorderQuestions not implemented');
    }

    // ── Публичные: список и прохождение ───────────────────────────────────────

    async findAllPublished() {
        throw new Error('findAllPublished not implemented');
    }

    async findPublishedById(id) {
        throw new Error('findPublishedById not implemented');
    }

    async startAttempt(testId, userId) {
        throw new Error('startAttempt not implemented');
    }

    async submitAttempt(attemptId, userId, answers) {
        throw new Error('submitAttempt not implemented');
    }

    async findAttemptsByUser(testId, userId) {
        throw new Error('findAttemptsByUser not implemented');
    }

    async findAttemptResult(attemptId, userId) {
        throw new Error('findAttemptResult not implemented');
    }

    // ── Жалобы ────────────────────────────────────────────────────────────────

    async getReportReasons() {
        throw new Error('getReportReasons not implemented');
    }

    async createReport(userId, testId, reasonId, reasonText) {
        throw new Error('createReport not implemented');
    }

    // ── Отзывы ────────────────────────────────────────────────────────────────

    async findReviews(testId, options) {
        throw new Error('findReviews not implemented');
    }

    async upsertReview(userId, testId, content, rating) {
        throw new Error('upsertReview not implemented');
    }
}

module.exports = ITestRepository;
