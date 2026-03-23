var mongoose = require('mongoose');
var Schema = mongoose.Schema;
 
// Log Schema
var logSchema = new Schema({
	username:{type:String, require:true, index:true},
	userId:{type:String, require:true, index:true},
	action:String,
	subAction:{type:String, index:true},
	commision:{type:String, index:true},
	description:String,
	actionBy:String,
	logtype:String,
	amount:Number,
	totalamount:Number,
	availableAmount:Number,
	oldLimit: Number,
	newLimit: Number,
	mnewLimit: Number,
	marketId: {type:String, index:true},
	marketName:String,
	marketType:String,
	eventId:{type:String, index:true},
	eventName:String,
	competitionId: {type:String, index:true},
	competitionName:String,
	eventTypeId: {type:String, index:true},
	eventTypeName:String,
	
	relation:String,
	remark:String,
	time:Date,
    timeMatched:Date,
	playerId:String,
	roundId:String,
	gameId:String,
	totalBet:String,
	totalPayout:String,
	totalNgr:String,
	Id:String,
	createDate:String,
	version:String,
	manager: String,		  // name of manager
	master: String,		//manager username
	subadmin: String,	//manager username
	admin: String,		  // name of manager
	managerId: String,		  // name of manager
	masterId: String,		//manager username
	subadminId: String,	//manager username
	adminId: String,
	managerSharing:String,
	masterSharing:String,
	subadminSharing:String,
	adminSharing:String,
	ParentId:String,
	ParentUser:String,
	ParentRole:String,
	Commpercentage:String,
	Partnerpercentage:String,
	OWNpercentage:String,
	from:String,
	result:String,
	newBalance:String,
	newExposure:String,
	to:String,
	datetime:String,
	deleted:Boolean
},{timestamps :true});

mongoose.model('Log', logSchema);
