var mongoose = require('mongoose');
var Schema = mongoose.Schema;

// Log Schema
var PushnotificationSchema = new Schema({
	username:{type:String, require:true, index:true},
	manager:{type:String},
	token:{type:String},
	deleted:Boolean
});

mongoose.model('Pushnotification', PushnotificationSchema);
