var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var stackSchema = new Schema({
	userID: String,
	priceArray: Array
}, { timestamps: true });


mongoose.model('Stack', stackSchema);
