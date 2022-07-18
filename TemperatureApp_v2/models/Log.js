const Sequelize = require('sequelize');
const db = require('../config/database');


const Log = db.define('log', {
    id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false,
    },
    tempvalue: {
        type: Sequelize.INTEGER
    },
    date: {
        type: Sequelize.DATE
    },
    userId: {
        type: Sequelize.INTEGER
    },
    city: {
        type: Sequelize.STRING
    }
})

Log.sync({ alter: true }).then(() => console.log("Log table created")
).catch(err => console.log("Error:" + err)
);

module.exports = Log

