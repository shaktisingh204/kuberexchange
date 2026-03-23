var mongoose 	= require('mongoose');
var Schema 		= mongoose.Schema;

var eventTypeSchema = new Schema({
	eventType: 		{type:{id: String, name: String}, unique:true},
	marketCount: 	Number,
	visible: 			Boolean
});

mongoose.model('EventType', eventTypeSchema);
