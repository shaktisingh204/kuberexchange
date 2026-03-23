var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var bannerSchema = new Schema({
	userId: { type: String, index: true },
	bannerName: { type: String, index: true },
	bannerImage: { type: String, index: true },
	status: { type: String, index: true },
}, { timestamps: true });

mongoose.model('Banner', bannerSchema);
