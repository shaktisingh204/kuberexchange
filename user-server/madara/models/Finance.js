var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var FinanceSchema = new Schema({
	username: 			{type:String, require:true, index:true},
	action: 				String,						//CREDIT/DEBIT
	amount: 				String,
	note: 				String,
	manager: 				String,	
	mobile:	{type:String},
	bank: 	{type:String, index:true},
	account:{type:String},
	ifsc:				{type:String, index:true},
	holdername:			{type:String},
	time:						Date,
	status: 				String,	
	deleted:				Boolean					 //true false
});

mongoose.model('Finance', FinanceSchema);
