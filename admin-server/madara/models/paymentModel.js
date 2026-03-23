const mongoose = require('mongoose');

const Schema = mongoose.Schema;

const payment = new Schema({
    type : { type : String },

    userId : { type : String },

    orderId : { type : String },

    amount : { type : String },

    name : { type : String },

    username : { type : String },

    paymentType : { type : String },

    status : { type : String },
    
    image : { type : Array , default : [] },

    remarks : { type : String },

    managerType : { type : String },

    managerId : { type : String },

    balance : { type : String },

    to : { type : String },

    paymentId: { type: Schema.Types.ObjectId, ref: 'Withdrawal' },

    depositId: { type: Schema.Types.ObjectId, ref: 'Peymentmethod' },

    sites: { type: Schema.Types.ObjectId, ref: 'Site' },

    mysites: { type: Schema.Types.ObjectId, ref: 'Mysite' },

    notification: [{ type: Schema.Types.ObjectId, ref: 'Notification' }],

    refrenceNo : { type : String },

    idReq : { type : Number, default: 0 },

    isProcessing : { type : Boolean, default: false },

    approvedBy : { type : String, default: null },

}, {timestamps :true});

module.exports = mongoose.model('Payment', payment);
