
class UserCreateDto {
    constructor({ username, password, email, role = 3, googleId = null, githubId = null }) {
        this.username = username;
        this.password = password;
        this.email = email;
        this.role = role;
        this.googleId = googleId;
        this.githubId = githubId;
    }
}

module.exports = UserCreateDto;
