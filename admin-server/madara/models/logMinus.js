var mongoose = require('mongoose');
var Schema = mongoose.Schema;
 
// Log Schema
var logMinusSchema = new Schema({
	username:{type:String, require:true, index:true},
	action:String,
	subAction:{type:String, index:true},
	commision:{type:String, index:true},
	description:String,
	actionBy:String,
	amount:Number,
	totalamount:Number,
	oldLimit: Number,
	newLimit: Number,
	mnewLimit: Number,
	marketId: {type:String, index:true},
	marketName:String,
	eventId:{type:String, index:true},
	eventName:String,
	competitionId: {type:String, index:true},
	competitionName:String,
	eventTypeId: {type:String, index:true},
	eventTypeName:String,
	manager:String,
	relation:String,
	remark:String,
	time:Date,
	playerId:String,
	roundId:String,
	gameId:String,
	totalBet:String,
	totalPayout:String,
	totalNgr:String,
	Id:String,
	createdAt:String,
	version:String,
	master:String,
	subadmin:String,
	managerSharing:String,
	masterSharing:String,
	subadminSharing:String,
	adminSharing:String,
	deleted:Boolean
});

mongoose.model('LogMinus', logMinusSchema);
