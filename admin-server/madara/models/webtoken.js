var mongoose 	= require('mongoose');
var Schema 		= mongoose.Schema;

var webTokenSchema = new Schema({
	token: 					{type:String, index:true},
	deleted:Boolean
});

mongoose.model('WebToken', webTokenSchema);
