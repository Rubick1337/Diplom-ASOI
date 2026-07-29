const { DataTypes } = require('sequelize');
const sequelize = require('../config/dbConfig');

const Test = sequelize.define(
    'Test',
    {
        id:                 { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
        title:              { type: DataTypes.STRING,  allowNull: false },
        description:        { type: DataTypes.TEXT,    allowNull: true  },
        timeLimitMinutes:   { type: DataTypes.INTEGER, allowNull: true  },
        isPublished:        { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
        createdBy:          { type: DataTypes.INTEGER, allowNull: true  },
        topicId:            { type: DataTypes.INTEGER, allowNull: true  },
        difficulty:         { type: DataTypes.INTEGER, allowNull: true  },
        shuffleQuestions:   { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
        shuffleOptions:       { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
        questionPoolSize:     { type: DataTypes.INTEGER, allowNull: true  },
        showCorrectAnswers:   { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true  },
    },
    { tableName: 'Tests', timestamps: true }
);

module.exports = Test;
