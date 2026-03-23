var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var teamSchema = new Schema({
	TeamID: 	   String,
	TeamName: 		String,
	TeamLogo: 		String,
	Key: 		String,
	
});

mongoose.model('VideoTeam', teamSchema);
