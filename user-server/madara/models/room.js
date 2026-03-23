var mongoose 	= require('mongoose');
var crypto 		= require('crypto');

// connected user's session details
var Schema = mongoose.Schema;
var roomSchema = new Schema({
	roomId:			{type:String, index:true},
	type:				{type:String, index:true},
	socket:			{type:Object, index:true},
	username:		{type:String},
	userId:		{type:String}
});
roomSchema.methods.setDefaults = function(){
}
mongoose.model('Room', roomSchema);
