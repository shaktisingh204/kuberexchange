var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var messageSchema = new Schema({
	messageId: 	String,
	message: 		String,
	time: 			Date,
	visible: 		Boolean,
	deleted: 		Boolean,
	type:				{type:String, index:true},
	createdBy: 	{type:String, index:true},
	image:			String
});

mongoose.model('Message', messageSchema);
