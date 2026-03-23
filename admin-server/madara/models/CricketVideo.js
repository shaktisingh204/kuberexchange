var mongoose 	= require('mongoose');
var Schema 		= mongoose.Schema;

var cricketVideoSchema = new Schema({
	TeamID: {
		type: String,
		trim: true,
	  },
	  OpponentID: {
		type: String,
		trim: true,
	  },
	  Run: {
		type: String,
		trim: true,
	  },
          status: {
		type: String,
		trim: true,
	  },
           marketId: {
		type: String,
		trim: true,
	  },
        marketName: {
		type: String,
		trim: true,
	  },
	  Wicket: {
		type: String,
		trim: true,
	  },
	  URL: {
		type: String,
		trim: true,
	  },
	  Category: {
		type: String,
		trim: true,
	  },
	  Remark: {
		type: String,
		trim: true,
	  },
        timelen: {
		type: String,
		trim: true,
	  },
	});

mongoose.model('CricketVideo', cricketVideoSchema);
