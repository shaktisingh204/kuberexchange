var mongoose 	= require('mongoose');
var Schema 		= mongoose.Schema;

var competitionSchema = new Schema({
	eventTypeId: 				{type:String, index:true},
	eventTypeName: 			String,
	competitionRegion: 	String,
	competition:				{type:{id: String, name: String}, unique:true},
	marketCount: 				Number,
	visible: 						Boolean,
	deleted: 						Boolean
});

mongoose.model('Competition', competitionSchema);
