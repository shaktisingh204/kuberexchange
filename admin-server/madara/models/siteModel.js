const mongoose = require('mongoose');

const Schema = mongoose.Schema;

const site = new Schema({
    name : { type : String },

    url : { type : String },

    image : { type : String },

    demoId : { type : String },

    demoPassword : { type : String },

    cricket : { type : String },

    football : { type : String },

    tennis : { type : String },

    horse_racing : { type : String },

    politics : { type : String },

    cards : { type : String },

    live_casino : { type : String },

    status : { type : String },

    type : { type : String },
    
    typeId : { type : String },

    refill : { type : String },

    minwithdrawn : { type : String },

    maxwithdrawn : { type : String },

    balance : { type : String },

    payments: [{ type: Schema.Types.ObjectId, ref: 'Payment' }],

    mysites: [{ type: Schema.Types.ObjectId, ref: 'Mysite' }]

}, {timestamps :true});

module.exports = mongoose.model('Site',site );
