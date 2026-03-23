const mongoose = require('mongoose');

const Schema = mongoose.Schema;

const admin = new Schema({
    firstname : {
        type : String
    },
    lastname : {
        type : String
    },
    email : {
        type : String
    },
    subadmin : {
        type : String
    },
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
}, {timestamps :true});

module.exports = mongoose.model('Member',admin );
