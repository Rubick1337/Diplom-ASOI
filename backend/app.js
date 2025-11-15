require("dotenv").config()
const express = require('express');
const app = express()
const sequelize = require('../backend/config/dbConfig');
const models = require('../backend/models/index');
const cors = require('cors');
const router = require("./routes/indexRoute");
const errorHandler = require("./middleware/ErrorHandlingMiddleware");
const { connectRedis, checkRedisConnection, client } = require("./config/redisConfig");

app.use(cors({ origin: process.env.CLIENT_URL, credentials: true }));

app.use(express.json());
app.use(cors());
app.use('/api', router);
app.use(errorHandler);

const PORT = process.env.PORT || 8500;

const start = async () => {
    try {
        await connectRedis();

        await checkRedisConnection();

        await sequelize.authenticate();
        await sequelize.sync();

        app.listen(PORT, () => {
            console.log("Server started on port " + PORT);
            console.log("Redis connected: " + (client.isReady ? 'yes' : 'no'));
        });
    } catch (err) {
        console.log(err);
        process.exit(1);
    }
}
start();