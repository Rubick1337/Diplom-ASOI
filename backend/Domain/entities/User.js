class User {
    constructor({ id, username, password, email, role, refreshToken }) {
        this.id = id ?? null;
        this.username = username;
        this.password = password;
        this.email = email;
        this.role = role;
        this.refreshToken = refreshToken ?? null;
    }
}

module.exports = User;
