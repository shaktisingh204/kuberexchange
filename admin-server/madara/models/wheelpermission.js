var mongoose 	= require('mongoose');
var Schema 		= mongoose.Schema;

var wheelPermissionSchema = new Schema({
	username:					String,
	status:						{type:Boolean},
	deleted:						{type:Boolean},
});

mongoose.model('Wheelpermission', wheelPermissionSchema);
