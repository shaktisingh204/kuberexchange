var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var informationSchema = new Schema({
	username: 	   String,
	phone: 		   String,
	manager: 		String,
	time: 			Date,
	visible: 		Boolean,
	deleted: 		Boolean,
});

mongoose.model('Information', informationSchema);
