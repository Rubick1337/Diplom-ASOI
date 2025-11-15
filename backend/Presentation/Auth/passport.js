const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const GitHubStrategy = require('passport-github2').Strategy;

const UserRepositorySequelize = require('../../Data/repository/UserRepositorySequelize');
const UserService = require('../../Application/services/UserService');

const userRepository = new UserRepositorySequelize();
const userService = new UserService(userRepository);

// Google
passport.use(
    new GoogleStrategy(
        {
            clientID: process.env.GOOGLE_CLIENT_ID,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET,
            callbackURL: process.env.GOOGLE_CALLBACK_URL,
        },
        async (accessToken, refreshToken, profile, done) => {
            try {
                const result = await userService.loginWithGoogle(profile);
                // result: { user, accessToken, refreshToken }
                // мы передадим только user, а токены положим в cookie позже в контроллере
                return done(null, result);
            } catch (err) {
                return done(err, null);
            }
        }
    )
);

// GitHub
passport.use(
    new GitHubStrategy(
        {
            clientID: process.env.GITHUB_CLIENT_ID,
            clientSecret: process.env.GITHUB_CLIENT_SECRET,
            callbackURL: process.env.GITHUB_CALLBACK_URL,
            scope: ['user:email'],
        },
        async (accessToken, refreshToken, profile, done) => {
            try {
                const result = await userService.loginWithGithub(profile);
                return done(null, result);
            } catch (err) {
                return done(err, null);
            }
        }
    )
);

module.exports = passport;
