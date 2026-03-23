var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var battleMarketSchema = new Schema({
	eventTypeId:				{type:String, index:true},
	eventTypeName:			String,
	competitionId:			{type:String, index:true},
	competitionName:		String,
	eventId:						{type:String, index:true},
	eventName:					String,
	openDate:						{type:Date, index:true},
	marketId:						{type:String, unique:true, require:true, index:true},
	marketName:					String,
	message:					String,
	marketType:					{type:String, index:true},
	usersPermission:			    Array,
	totalMatched:				Number,
	marketBook:					{type:{
		marketId: String,
		isMarketDataDelayed: Boolean,
		status: {type: String, index:true},
		complete: Boolean,
		inplay: Boolean,
		runners: Array
	}},
	runners:						Array,
	minlimit:			Number,
	maxlimit:			Number,
	maxrun:			Number,
	managers:						Array,
	managerStatus:			Object,
	managerProfit:			Object,
	runnersResult:						Array,
	Result:			String,
	rateSource:					{type:String, index:true},
	createdBy:					String,
	visible:						{type:Boolean, index:true},
	deleted:						{type:Boolean, index:true}

});
battleMarketSchema.index({wheel:1, status: 1});

mongoose.model('battleMarket', battleMarketSchema);
