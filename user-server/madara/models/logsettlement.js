var mongoose = require('mongoose');
var Schema = mongoose.Schema;

// Log Schema
var logSchema = new Schema({
	username:{type:String, require:true, index:true},
	action:String,
	subAction:{type:String, index:true},
	commision:{type:String, index:true},
	description:String,
	amount:Number,
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
	deleted:Boolean
});

mongoose.model('Logsettlement', logSchema);
