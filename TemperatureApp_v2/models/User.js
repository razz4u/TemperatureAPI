const Sequelize = require('sequelize');
const db = require('../config/database');
const log = require('./Log')


const User = db.define('user', {
    id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        allowNull: false,
    },
    name: {
        type: Sequelize.STRING,
        allowNull: false,
    },
    role: {
        type: Sequelize.STRING,
        allowNull: false,
    },
    station: {
        type: Sequelize.STRING,
        allowNull: false,
    }
    
});

User.hasMany(log, {
    foreignKey: {
        type: Sequelize.DataTypes.INTEGER,
        allowNull: false
    }
});

log.belongsTo(User);

User.sync({alter : true}).then(() => console.log("User table created")
).catch(err => console.log("Error:" + err));

module.exports = User