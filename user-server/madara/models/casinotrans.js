var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var casinotransSchema = new Schema({
	txnId: String,  
	betId: String,
	rewardtxnId: String,
	rewardType:String,
	rewardTitle:String,
	roundId: String,
	txntype: String,
	amount: String,
	currency: String,
	gameId: String,
	category: String,
	clientRoundId: String,
	created: String,
	type:String,
	username:String,
	manager:String,
	master:String,
	subadmin:String,
	admin:String,
	ParentUser:String,
	userId:String,
	managerId:String,
	masterId:String,
	subadminId:String,
	adminId:String,
	ParentId:String,
	ParentRole:String,
	placedate:String,
	datetime:String,
	CompleteStatus:Boolean,
	Userlog:Number,
	oldLimit: Number,
	newLimit: Number,
	playerId: String
}, { timestamps: true });


mongoose.model('Casinotrans', casinotransSchema);
