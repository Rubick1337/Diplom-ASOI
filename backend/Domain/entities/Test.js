class Test {
    constructor({
        id = null,
        title,
        description = null,
        timeLimitMinutes = null,
        isPublished = false,
        createdBy = null,
        topicId = null,
        difficulty = null,
        shuffleQuestions = false,
        shuffleOptions = false,
        questionPoolSize = null,
        showCorrectAnswers = true,
        createdAt = new Date(),
        updatedAt = new Date(),
    }) {
        this.id = id;
        this.title = title;
        this.description = description;
        this.timeLimitMinutes = timeLimitMinutes;
        this.isPublished = isPublished;
        this.createdBy = createdBy;
        this.topicId = topicId;
        this.difficulty = difficulty;
        this.shuffleQuestions = shuffleQuestions;
        this.shuffleOptions = shuffleOptions;
        this.questionPoolSize = questionPoolSize;
        this.showCorrectAnswers = showCorrectAnswers;
        this.createdAt = createdAt;
        this.updatedAt = updatedAt;
    }
}

module.exports = Test;
