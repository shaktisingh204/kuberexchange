const mongoose = require('mongoose');

const Schema = mongoose.Schema;

const withdrawnMethod = new Schema({
    name : { type : String },

    type : { type : String },

    image : { type : String },

    withdrawns: [{ type: Schema.Types.ObjectId, ref: 'Withdrawal' }],

    manager: [],

    status : { type : String },

}, {timestamps :true});

module.exports = mongoose.model('WithdrawnMethod',withdrawnMethod );
