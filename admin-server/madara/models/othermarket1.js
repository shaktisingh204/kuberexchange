var mongoose 	= require('mongoose');
var Schema 		= mongoose.Schema;

var othermarketSchema = new Schema({
	eventName:					String,
	openDate:						{type:Date, index:true},
	marketId:						{type:String, unique:true, require:true, index:true},
	marketType:					{type:String, index:true},
	marketBook:					{type:{
		marketId: String,
		status: {type: String, index:true},
		runners: Array
	}},
	runners:						Array,
	runnersResult:						Array,
	Result:			String,
	managers:						Array,
	managerStatus:			Object,
	multiExchangeFlag:	Boolean,
	winner:							String,
	createdBy:					String,
	shared:							Boolean,
	timers:							Number,
	managerProfit:			Object,
	auto:								{type:Boolean, index:true},
	ledger:								{type:Boolean, index:true,default:true},
	visible:						{type:Boolean, index:true},
	deleted:						{type:Boolean, index:true}
});
othermarketSchema.index({managers: 1, visible:-1, deleted:1, "marketBook.status":1, openDate:1});
othermarketSchema.index({eventId: 1, visible:-1, deleted:1, "marketBook.status":1});
othermarketSchema.index({visible: -1, marketType: 1, managers: 1, "marketBook.status": 1});
mongoose.model('Othermarket', othermarketSchema);
