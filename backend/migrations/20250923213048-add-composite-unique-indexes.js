'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.addIndex('TestTheoryQustions', {
      fields: ['Testid', 'TheoryQustionsid'],
      unique: true,
      name: 'unique_test_theory_combination'
    });

    await queryInterface.addIndex('TestCodes', {
      fields: ['Testid', 'CodeTaskid'],
      unique: true,
      name: 'unique_test_code_combination'
    });

    console.log('Составные уникальные индексы успешно созданы');
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.removeIndex('TestTheoryQustions', 'unique_test_theory_combination');
    await queryInterface.removeIndex('TestCodes', 'unique_test_code_combination');

    console.log('Составные уникальные индексы удалены');
  }
};