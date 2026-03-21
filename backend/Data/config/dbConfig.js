const { Sequelize } = require("sequelize");
const { types }    = require('pg');

types.setTypeParser(1114, str => new Date(str + 'Z'));
types.setTypeParser(1184, str => new Date(str));

module.exports = new Sequelize(
    process.env.DB_NAME,
    process.env.DB_USER,
    process.env.DB_PASSWORD,
    {
        dialect:'postgres',
        host: process.env.DB_HOST,
        port: process.env.DB_PORT
    }
)
