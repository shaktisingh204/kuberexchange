var mongoose 	= require('mongoose');
var crypto 		= require('crypto');

// connected user's session details
var Schema = mongoose.Schema;
var sessionSchema = new Schema({
	socket:			{type:String, index:true, unique:true},
	username:		{type:String, index:true, unique:true},
	role:				{type:String, index:true},						//admin/manager/user/partner
	manager:		String,
	image: 			String,
	headers:		Object,
	lastLogin:	Date,
	deviceName: String,
	deviceType: String,
	online:			{type:Boolean, index:true}
});
sessionSchema.methods.setDefaults = function(){
	this.online = true;
}
mongoose.model('Session', sessionSchema);
