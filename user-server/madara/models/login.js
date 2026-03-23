var mongoose 	= require('mongoose');
var crypto 		= require('crypto');

// Basic information required to login
var Schema = mongoose.Schema;
var loginSchema = new Schema({
	username:{type:String, unique:true, required:true, index:true},
	hash:String,
	token:String,
	type:									String,			// active/inactive
	salt:String,
	role:String,							//admin/manager/user/partner
	status:String,						//active/inactive
	manager:String,						//manager username
	otp:String,						//manager username
	mobile:String,						//manager username
	deleted:Boolean,					//true/false
	loginStatus:Boolean,					//true/false
	betStatus:Boolean,					//true/false
	betStop:Boolean,					//true/false
	loginAttempts:Number,			//number of invalid login attempts
}, {timestamps: true});

loginSchema.methods.setDefaults = function(){
	this.role = 'user';
	this.status = 'active';
	this.deleted = false;
	this.loginStatus = false;
	this.betStatus = true;
	this.betStop = true;
	this.loginAttempts = 0;
}
loginSchema.methods.setPassword = function(password){
	this.salt = crypto.randomBytes(16).toString('hex');
	this.hash = crypto.pbkdf2Sync(password, this.salt, 1000, 64, 'sha1').toString('hex');
};
loginSchema.methods.validPassword = function(password){
	var hash = crypto.pbkdf2Sync(password, this.salt, 1000, 64, 'sha1').toString('hex');
	return this.hash === hash;
};
mongoose.model('Login', loginSchema);
