var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var lockSchema = new Schema({
	usertype: String,
	bettype: String,
	eventId: String,
	userBlocks: Array
});


mongoose.model('Lock', lockSchema);
