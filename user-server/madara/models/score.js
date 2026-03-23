var mongoose 	= require('mongoose');
var Schema 		= mongoose.Schema;

var scoreSchema = new Schema({
	eventTypeId: 			{type:String, index:true},
	eventTypeName: 		{type:String},
	competitionId: 		{type:String, index:true},
	competitionName: 	String,
	openDate: 				Date,
	eventId: 					{type:String, index:true},
	eventName: 				String,
	score: 						Object,
  lotusScore:       Object,
	visible: 					{type:Boolean, index:true},
	deleted: 					{type:Boolean, index:true}
});

mongoose.model('Score', scoreSchema);
