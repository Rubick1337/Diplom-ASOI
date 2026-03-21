require("dotenv").config()
const express = require('express');
const app = express()
const sequelize = require('../Data/config/dbConfig');
const models = require('../Data/models');
const cors = require('cors');
const router = require("./routes/indexRoute");
const errorHandler = require("./middleware/ErrorHandlingMiddleware");
const { connectRedis, checkRedisConnection, client } = require("../Data/config/redisConfig");
const passport = require('./Auth/passport');
const cookieParser = require('cookie-parser');

const http = require('http');
const server = http.createServer(app);
const initSocket = require('./socket/socket');
initSocket(server);

app.use(cors({ origin: process.env.CLIENT_URL, credentials: true }));
app.use(cookieParser());
app.use(passport.initialize());
app.use(express.json());
app.use('/api', router);
app.use(errorHandler);

app.get('/health', (req, res) => {
    res.status(200).json({ status: 'ok' });
});

const PORT = process.env.PORT || 8500;

const start = async () => {
    try {
        await connectRedis();
        await checkRedisConnection();

        await sequelize.authenticate();
        await sequelize.sync();

        server.listen(PORT, () => {
            console.log("Server started on port " + PORT);
            console.log("Redis connected: " + (client.isReady ? 'yes' : 'no'));
        });
    } catch (err) {
        console.log(err);
        process.exit(1);
    }
}
start();
