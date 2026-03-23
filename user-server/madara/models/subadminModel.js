const mongoose = require('mongoose');

const Schema = mongoose.Schema;

const subadmin = new Schema({
    username : {
        type : String
    },

    password : {
        type : String
    },

    paisaexchId : {
        type : String
    },

    sharing: {
        type : String
    },

    token : {
        type : String
    },

    playerId : {
        type : String
    },

    role: {
        type : String
    },

    managerId: {
        type : String
    },

}, {timestamps :true});

module.exports = mongoose.model('Subadmin',subadmin );
