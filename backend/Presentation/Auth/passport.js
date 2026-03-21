const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const GitHubStrategy = require('passport-github2').Strategy;

const UserRepositorySequelize = require('../../Data/repository/UserRepositorySequelize');
const UserService = require('../../Application/services/UserService');

const userRepository = new UserRepositorySequelize();
const userService = new UserService(userRepository);

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

                return done(null, result);
            } catch (err) {
                console.error('loginWithGoogle error:', err);
                return done(err, null);
            }
        }
    )
);

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
