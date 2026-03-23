var mongoose 	= require('mongoose');
var Schema 		= mongoose.Schema;

var videoTeamSchema = new Schema({
	TeamID: {
		type: String,
		trim: true,
	  },

	  TeamName: {
		type: String,
		trim: true,
	  },
	   Key: {
		type: String,
		trim: true,
	  },
	  
	  TeamLogo: {
		type: String,
		trim: true,
	  },
	});

mongoose.model('VideoTeam', videoTeamSchema);
