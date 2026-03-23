var mongoose 	= require('mongoose');
var Schema 		= mongoose.Schema;

var teenpatiResultSchema = new Schema({
	marketId:					String,
	eventId:					String,
	openDate:						{type:Date, index:true},
	createDate:						{type:String, index:true},
	Result:			String,
	description:			String,
	visible:						{type:Boolean, index:true},
	deleted:						{type:Boolean, index:true}
});

mongoose.model('TeenpatiResult', teenpatiResultSchema);
