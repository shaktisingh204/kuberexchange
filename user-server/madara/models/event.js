var mongoose 	= require('mongoose');
var Schema 		= mongoose.Schema;

var eventSchema = new Schema({
	eventTypeId: 					{type:String, index:true},
	eventTypeName: 				String,
	competitionId: 				{type:String, index:true},
	competitionName: 			String,
	event:								{type:{countryCode:String, id:String, name:String, openDate:Date, timezone:String}, unique:true},
	marketTypes:					Array,
	marketCount: 					Number,
	managerMatchProfit: 	Object,
	managerCommisionProfit: 	Object,
	managerSessionProfit: Object,
	managerFeesProfit: 		Object,
	availableSources:			Array,
	visible: 							Boolean,
	status: 							Boolean,
	showScore: 						Boolean,
	deleted: 							Boolean,
	min:                         Number,
	max:                         Number,
	minSelect:                   Number,
	userSelect:                  Number,
	computerSelect:              Number,
});

mongoose.model('Event', eventSchema);
