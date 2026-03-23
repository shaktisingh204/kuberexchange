const mongoose = require('mongoose');

const Schema = mongoose.Schema;

const mysite = new Schema({
    userId : { type : String },

    username : { type : String },

    name : { type : String },

    password : { type : String },

    type : { type : String },

    typeId : { type : String },

    balance : { type : String, default: 0 },

    exposure : { type : String, default: 0 },

    remarks : { type : String },

    status : { type : String },

    sites: { type: Schema.Types.ObjectId, ref: 'Site' },
    
    image : { type : Array , default : [] },

}, {timestamps :true});

module.exports = mongoose.model('Mysite', mysite );
