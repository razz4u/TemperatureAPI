const { Sequelize } = require('sequelize');

module.exports = new Sequelize('yourDBname', 'postgres', 'yourDBpassword', {
    host: 'localhost',
    dialect: 'postgres'
});
