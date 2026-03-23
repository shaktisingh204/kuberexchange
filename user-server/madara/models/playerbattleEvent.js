var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var playerBattleEventSchema = new Schema({
	eventId:			{type:String, index:true},
	eventTypeId:			{type:String, index:true},
	eventName:			{type:String},
	min:				{type:Number},
	max:				{type:Number},
	minSelect:			{type:Number},
	minSelect:			{type:Number},
	userSelect:			{type:Number},
	computerSelect:	    {type:Number},
	openDate:			{type:Date, index:true},
	createDate:			{type:Date, index:true},
	status:				{type:Boolean},
	deleted:			{type:Boolean},

});
playerBattleEventSchema.index({wheel:1, status: 1});

mongoose.model('PlayerBattleEvent', playerBattleEventSchema);
