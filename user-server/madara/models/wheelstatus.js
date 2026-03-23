var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var wheelstatusSchema = new Schema({
	marketId:		   {type:String},
	status:				{type:Boolean},

});
wheelstatusSchema.index({marketId:1, status: 1});

mongoose.model('WheelStatus', wheelstatusSchema);
