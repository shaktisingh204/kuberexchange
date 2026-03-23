var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var bounsSchema = new Schema({
	userId: { type: String, index: true },
	bonusType: { type: String, index: true },
	bonusName: { type: String, index: true },
	bonusCode: { type: String, index: true },
	bonusValue: { type: String, index: true },
	openDate: { type: Date, index: true },
	endDate: { type: Date, index: true },
	status: Boolean,
}, { timestamps: true });

mongoose.model('Bonus', bounsSchema);
