class Notification {
    constructor({
        id = null,
        userId,
        title,
        message,
        type = 'admin',
        isRead = false,
        challengeId = null,
        createdAt = new Date(),
    }) {
        this.id = id;
        this.userId = userId;
        this.title = title;
        this.message = message;
        this.type = type;
        this.isRead = isRead;
        this.challengeId = challengeId;
        this.createdAt = createdAt;
    }
}

module.exports = Notification;
