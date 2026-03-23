var mongoose = require('mongoose');
var crypto = require('crypto');
var Schema = mongoose.Schema;

// User details
var userSchema = new Schema({
	username: { type: String, unique: true, required: true, index: true },		//username
	fullname: String,		  // admin/manager/user/partner
	role: String,		  // admin/manager/user/partner
	hash: String,
	token:String,
	salt: String,							//admin/manager/user/partner
	transctionpassword: Number,
	transctionpasswordstatus: Number,
	transctionpasswordsalt: String,
	transctionpasswordhash: String,
	loginAttempts: Number,
	status: String,			// active/inactive
	type: String,			// active/inactive
	city: String,			// active/inactive
	mobile: String,			// active/inactive
	exposurelimit:Number,
	creditrefrence:Number,
	manager: String,		  // name of manager
	master: String,		//manager username
	subadmin: String,	//manager username
	admin: String,		  // name of manager
	superadmin: String,		  // name of manager
	techadmin: String,		  // name of manager
	managerId: String,		  // name of manager
	masterId: String,		//manager username
	subadminId: String,	//manager username
	adminId: String,
	superadminId: String,
	techadminId: String,
	amount: Number,
	availableAmount: Number, // Deposit/Withdraw Balance
	balance: Number,
	casinobalance:Number,
	sportsetting:Array,
	commissionsetting:Array,
	Parentcommission:Array,
	partnershipsetting:Array,
	Parentpartnership:Array,
	openingDate: Date,
	betStatus: Boolean,
	ParentUser:String,
	ParentRole:String,
	ParentId:String,
	exposure: Number,
	cricketexposure: Number,
	tennisexposure: Number,
	soccerexposure: Number,
	limit: Number,
	gameId:String,
	otp:String,
	deviceId:String,
	bounsBalance:Number,
	bounsStatus:Number,
	rawpassword:String,
	pushnotification:Number,


	roleSub: String,		  // playerId
	playerId: String,		  // playerId
	paid: Boolean,			// active/inactive
	creditLimit: Number,
	creditoldLimit: Number,
	walletAmount: Number,
	blockedAmount: Object, 		// {eventId: {'eventName': '', 'amount': ''}}
	settledProfit: Object,			// {eventId: {'overall': '', 'marketId': ''}}
	unsettledProfit: Object,			// {eventId: {'overall': '', 'marketId': ''}}
	matchFees: Number,		  // match fees
	deleted: Boolean,		// true/false
	image: String,
	settings: Object,
	availableEventTypes: Array,			// list of event types available for manager
	sessionAccess: Boolean,		// is session available or not
	partnerPermissions: Array,			// [bet, user, event] specifies whether partner can modify the
	partnerCount: Number,
	commision: Number,
	betStop: Boolean,
	commisionloss: Number,
	rfcommisionloss: Number,
	referal: String,		  // name of manager
	applink: String,
	note: String,
	version: String,
	sharing: String,
	remark: String,
	startDate: String,
	endDate: String,
	whatsapp: String,
	telegram: String,
	partnerLimit: Number,
	managerLimit: Number,
	masterLimit: Number,
	commisionadmin: Number,
	commisionsubadmin: Number,
	commisionmaster: Number,
	userCount: Number,			// if manager- number of users connected to that manager
	userLimit: Number,
	totalexposure: Number,
	totalbalance: Number			// if manager- max number of users that can be connected to that manager
}, { timestamps: true });

userSchema.methods.setDefaults = function () {
	this.role = 'user';
	this.betStop = true;
	this.status = 'inactive';
	this.deleted = false;
	this.loginAttempts = 0;
	this.bounsStatus = 0;
	this.betStatus = true;
	this.commisionadmin = 0;
	this.commisionsubadmin = 0;
	this.transctionpasswordstatus = 0;
	this.commisionmaster = 0;
	this.commision = 0;
	this.openingDate = new Date();
	this.balance = 0;
	this.bounsBalance = 0;
	this.pushnotification = 0;
	this.casinobalance = 0;
	this.exposure = 0;
	this.limit = 0;
	this.walletAmount = 0;
	this.availableAmount = 0;
	this.blockedAmount = { 'overall': 0 };
	this.matchFees = 0;
	this.availableEventTypes = [];
	this.sessionAccess = false;
	this.partnerPermissions = [];
	this.userCount = 0;
	this.creditLimit = 0;
	this.userLimit = 100;
	this.partnerCount = 0;
	this.partnerLimit = 5;
	this.deleted = false;
	this.image = 'man-4.svg';
	this.settings = {};
};
userSchema.methods.setPassword = function (password) {
	this.salt = crypto.randomBytes(16).toString('hex');
	this.hash = crypto.pbkdf2Sync(password, this.salt, 1000, 64, 'sha1').toString('hex');
};
userSchema.methods.settransPassword = function (password) {
	this.transctionpasswordsalt = crypto.randomBytes(16).toString('hex');
	this.transctionpasswordhash = crypto.pbkdf2Sync(password, this.transctionpasswordsalt, 1000, 64, 'sha1').toString('hex');
};
userSchema.methods.validPassword = function (password) {
	var hash = crypto.pbkdf2Sync(password, this.salt, 1000, 64, 'sha1').toString('hex');
	return this.hash === hash;
};
userSchema.methods.validTransPassword = function (password) {
	var transhash = crypto.pbkdf2Sync(password, this.transctionpasswordsalt, 1000, 64, 'sha1').toString('hex');
	return this.transctionpasswordhash === transhash;
};
userSchema.index({ role: 1, manager: 1, deleted: -1 });
mongoose.model('User', userSchema);
