class UserResponseDto {
    constructor(userEntity) {
        this.id = userEntity.id;
        this.username = userEntity.username;
        this.email = userEntity.email;
        this.role = userEntity.role;
        this.googleId = userEntity.googleId;
        this.githubId = userEntity.githubId;
        this.experience = userEntity.experience;
        // пароль и refreshToken наружу не отдаём
    }
}

module.exports = UserResponseDto;
