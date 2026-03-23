var mongoose = require('mongoose');
var Schema = mongoose.Schema;

// Log Schema
var logSchema = new Schema({
	username:{type:String, require:true, index:true},
	manager:{type:String},
	playerId:{type:String},
	roundId:{type:String},
	gameId:{type:String},
	totalBet:{type:String},
	totalPayout:{type:String},
	totalNgr:{type:String},
	time:Date,
	deleted:Boolean
});

mongoose.model('Summary', logSchema);
