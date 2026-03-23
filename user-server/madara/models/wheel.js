var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var wheelSchema = new Schema({
	wheel:					{type:Array},
	status:				{type:Boolean},

});
wheelSchema.index({wheel:1, status: 1});

mongoose.model('Wheel', wheelSchema);
