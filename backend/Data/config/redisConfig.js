const redis = require('redis');

const client = redis.createClient({

});

client.on('error', (err) => {
    console.error('Redis Client Error:', err);
});

const connectRedis = async () => {
    try {
        await client.connect();
        console.log('Connected to Redis successfully');
    } catch (error) {
        console.error('Failed to connect to Redis:', error);
        process.exit(1);
    }
};

const checkRedisConnection = async () => {
    try {
        await client.ping();
        console.log('Redis is responding');
        return true;
    } catch (error) {
        console.error('Redis is not responding:', error);
        return false;
    }
};

module.exports = {
    client,
    connectRedis,
    checkRedisConnection
};