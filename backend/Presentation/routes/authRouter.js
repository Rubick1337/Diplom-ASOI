const { Router } = require('express');
const passport = require('../Auth/passport');
const router = Router();

router.get('/google',
    passport.authenticate('google', { scope: ['profile', 'email'] })
);

router.get(
    '/google/callback',
    passport.authenticate('google', { session: false, failureRedirect: '/login?error=google' }),
    (req, res) => {

        const { user, accessToken, refreshToken } = req.user;

        res.cookie('accessToken', accessToken, {
            httpOnly: true,
            secure: false,
            sameSite: 'strict',
            maxAge: 30 * 60 * 1000
        });

        res.cookie('refreshToken', refreshToken, {
            httpOnly: true,
            secure: false,
            sameSite: 'strict',
            maxAge: 10 * 24 * 60 * 60 * 1000
        });

        res.redirect('http://localhost:3000');
    }
);

router.get('/github',
    passport.authenticate('github', { scope: ['user:email'] })
);

router.get(
    '/github/callback',
    passport.authenticate('github', { session: false, failureRedirect: '/login?error=github' }),
    (req, res) => {
        const { user, accessToken, refreshToken } = req.user;

        res.cookie('accessToken', accessToken, {
            httpOnly: true,
            secure: false,
            sameSite: 'strict',
            maxAge: 30 * 60 * 1000
        });

        res.cookie('refreshToken', refreshToken, {
            httpOnly: true,
            secure: false,
            sameSite: 'strict',
            maxAge: 10 * 24 * 60 * 60 * 1000
        });

        res.redirect('http://localhost:3000');
    }
);

module.exports = router;
