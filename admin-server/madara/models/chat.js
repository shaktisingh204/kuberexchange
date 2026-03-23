var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var chatSchema = new Schema({
	messageId: 	   String,
	message: 		String,
	manager: 		String,
	user: 		String,
	senderId: 		String,
	receiverId:    String,
	time: 			Date,
	visible: 		Boolean,
	visiblebymanager: 		Boolean,
	status: 		Boolean,
	visiblebyuser: 		Boolean,
	deleted: 		Boolean,
	type:				{type:String, index:true},
	createdBy: 	{type:String, index:true},
	createdPartnerBy: 	{type:String, index:true},
	image:			String
});

mongoose.model('Chat', chatSchema);
