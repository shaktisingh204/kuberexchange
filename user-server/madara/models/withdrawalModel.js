const mongoose = require('mongoose');

const Schema = mongoose.Schema;

const withdrawal = new Schema({
    type : { type : String },

    userId : { type : String },

    bankName : { type : String },

    name : { type : String },

    upi : { type : String },

    accnumber : { type : String },

    ifsc : { type : String },

    status: { type : Boolean },

    activestatus: { type : Boolean },

    withdrawnMethod: { type: Schema.Types.ObjectId, ref: 'WithdrawnMethod' },

    payments: [{ type: Schema.Types.ObjectId, ref: 'Payment' }],
    
}, {timestamps :true});

module.exports = mongoose.model('Withdrawal', withdrawal);
