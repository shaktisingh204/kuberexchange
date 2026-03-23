var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var ledgerSchema = new Schema({
	username: 			{type:String, require:true, index:true},
	action: 				String,						//CREDIT/DEBIT
	amount: 				Number,
	openingAmount: 	Number,
	closingAmount: 	Number,
	description: 		String,			//brief description about action
	eventTypeId:		{type:String, index:true},
	eventTypeName:	{type:String},
	competitionId: 	{type:String, index:true},
	competitionName:{type:String},
	eventId:				{type:String, index:true},
	eventName:			{type:String},
	marketId:				{type:String, index:true},
	marketName:			{type:String},
	betId:					{type:String, index:true},
	time:						Date,
	deleted:				Boolean					 //true false
});

mongoose.model('Ledger', ledgerSchema);
