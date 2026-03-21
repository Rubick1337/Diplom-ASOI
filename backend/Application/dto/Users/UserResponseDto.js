class UserResponseDto {
    constructor(userEntity) {
        this.id = userEntity.id;
        this.username = userEntity.username;
        this.email = userEntity.email;
        this.role = userEntity.role;
        this.roleName = userEntity.roleName;
        this.googleId = userEntity.googleId;
        this.githubId = userEntity.githubId;
        this.experience = userEntity.experience;

    }
}

module.exports = UserResponseDto;
