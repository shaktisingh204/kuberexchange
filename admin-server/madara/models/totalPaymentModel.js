const mongoose = require('mongoose');

const Schema = mongoose.Schema;

const totalPaymentModel = new Schema({
    typeId : { type : String },

    amount : { type : String },

}, {timestamps :true});

module.exports = mongoose.model('TotalPayment',totalPaymentModel );
