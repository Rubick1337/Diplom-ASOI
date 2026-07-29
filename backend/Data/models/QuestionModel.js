const { DataTypes } = require('sequelize');
const sequelize = require('../config/dbConfig');

const Question = sequelize.define(
    'Question',
    {
        id:           { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
        testId:       { type: DataTypes.INTEGER, allowNull: false }, // FK → Tests
        typeId:       { type: DataTypes.INTEGER, allowNull: false }, // FK → QuestionTypes
        text:         { type: DataTypes.TEXT,    allowNull: false }, // Текст вопроса.
                                                                     // Для cloze — содержит [[1]], [[2]] как плейсхолдеры бланков
        points:       { type: DataTypes.FLOAT,   allowNull: false, defaultValue: 1 },
        order:        { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },

        // Только для multichoice: разрешить выбрать несколько вариантов
        allowMultiple: { type: DataTypes.BOOLEAN, allowNull: true, defaultValue: false },

        // Только для shortanswer: учитывать регистр при проверке
        caseSensitive: { type: DataTypes.BOOLEAN, allowNull: true, defaultValue: false },

        // Только для numerical: допустимая погрешность (например 0.01)
        tolerance:     { type: DataTypes.FLOAT,   allowNull: true },

        // Только для code: язык выполнения
        codeLanguage:  { type: DataTypes.STRING,  allowNull: true },

        // Только для code: начальный код в редакторе
        starterCode:   { type: DataTypes.TEXT,    allowNull: true },

        // Только для code: имя функции (если задано — режим харнесса, иначе stdin)
        funcName:      { type: DataTypes.STRING,  allowNull: true },

        // Изображение вопроса (путь относительно /public)
        imageUrl:      { type: DataTypes.STRING,  allowNull: true },
    },
    { tableName: 'Questions', timestamps: false }
);

module.exports = Question;
