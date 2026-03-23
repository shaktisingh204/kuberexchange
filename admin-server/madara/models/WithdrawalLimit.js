const mongoose = require('mongoose');

const Schema = mongoose.Schema;

const WithdrawalLimit = new Schema({

    managerId : { type : String },

    limit : { type : Number },

    withdrawnMethod: { type: Schema.Types.ObjectId, ref: 'WithdrawnMethod' },
    
}, {timestamps :true});

module.exports = mongoose.model('WithdrawalLimit', WithdrawalLimit);