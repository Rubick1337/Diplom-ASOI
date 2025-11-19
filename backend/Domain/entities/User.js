class User {
    constructor({
                    id = null,
                    username,
                    password = null,
                    email,
                    role,
                    refreshToken = null,
                    googleId = null,
                    githubId = null,
                    experience = 0,
                }) {
        this.id = id;
        this.username = username;
        this.password = password;
        this.email = email;
        this.role = role;
        this.refreshToken = refreshToken;
        this.googleId = googleId;
        this.githubId = githubId;
        this.experience = experience;
    }
}

module.exports = User;
