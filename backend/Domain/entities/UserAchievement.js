class UserAchievement {
    constructor({ id = null, userId, achievementId, unlockedAt = new Date() }) {
        this.id = id;
        this.userId = userId;
        this.achievementId = achievementId;
        this.unlockedAt = unlockedAt;
    }
}

module.exports = UserAchievement;
