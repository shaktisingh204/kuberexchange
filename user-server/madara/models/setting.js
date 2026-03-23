var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var settingSchema = new Schema({
	autoresult: String,
	razorpaystatus: String,
	razorpaykey: String,
	razorpaysecret: String,
	maintenancepage: String,
	fancyMinLimit: String,
	fancyMaxLimit: String,
	oddsMinLimit: String,
	oddsMaxLimit: String,
	bookmakerMinLimit: String,
	bookmakerMaxLimit: String,
	fancyBetDelay: String,
	oddsBetDelay: String,
	bookmakerBetDelay: String,
	casinourl: String,
	casinousername: String,
	casinopassword: String,
	casinopasskey: String,
});


mongoose.model('Setting', settingSchema);
