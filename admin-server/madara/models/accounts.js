var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var accountSchema = new Schema({
	username:  {type:String, require:true, index:true},
	password:  {type:String, require:true},
	website:   {type:String},					       // Betfair,Sky,Multi,777
	active:    Boolean,
	deleted:   Boolean							         // true false
});

mongoose.model('Account', accountSchema);
