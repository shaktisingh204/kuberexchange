const mongoose = require('mongoose');

const Schema = mongoose.Schema;

const paymentmethod = new Schema({
    type : { type : String },

    typeId : { type : String },

    paymenttype : { type : String },

    name : { type : String },

    mobile : { type : String },

    upi : { type : String },

    accnumber : { type : String },

    ifsc : { type : String },

    acctype : { type : String },
    
    image : { type : String },

    upiName : { type : String },

    preffered : { type: Boolean },
    
}, {timestamps :true});

module.exports = mongoose.model('Peymentmethod', paymentmethod);
