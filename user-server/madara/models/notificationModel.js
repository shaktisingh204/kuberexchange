const mongoose = require('mongoose');

const Schema = mongoose.Schema;

const notification = new Schema({
    type : { type : String },

    userId : { type : String },

    amount : { type : String },

    name : { type : String },

    message : { type : String },

    remarks : { type : String },

    status: {type : String},

    sitename: {type : String},

    siteurl: {type : String},

    payment: { type: Schema.Types.ObjectId, ref: 'Payment' },

    sites: { type: Schema.Types.ObjectId, ref: 'Mysite' },

}, {timestamps :true});

module.exports = mongoose.model('Notification', notification);
