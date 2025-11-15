class UserUpdateDto {
    constructor({ id, username, email, role, googleId = null, githubId = null }) {
        this.id = id;
        this.username = username;
        this.email = email;
        this.role = role;
        this.googleId = googleId;
        this.githubId = githubId;
    }
}

module.exports = UserUpdateDto;
