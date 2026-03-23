var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var betSchema = new Schema({
	username: { type: String, required: true, index: true },
	userId: { type: String, required: true, index: true },
	eventTypeId: { type: String, index: true },
	eventTypeName: { type: String },
	eventId: { type: String, index: true },
	eventName: String,
	marketId: { type: String, required: true, index: true },
	marketName: String,
	marketType: String,
	runnerId: String,
	selectionName: String,
	type: { type: String, index: true },
	rate: Number,
	serverRate: Number,
	stake: Number,
	ratestake: Number,
	amount: Number,
	placedTime: { type: Date, index: true },
	matchedTime: { type: Date, index: true },
	status: { type: String, index: true },
	result: { type: String, index: true },
	managerresult: { type: String, index: true },
	manager: { type: String, index: true },
	deleted: { type: Boolean, index: true },
	undecalreStatus: { type: Boolean, index: true, default: false },
	image: String,
	subadmin: String,
	master: String,
	totalPayout: Number,
	marketState: Object,
	runnerArray: Array,
	runnerRuns: Number,
	managerCommision:Number,
	masterCommision: Number,
	subadminCommision: Number,
	adminCommision: Number,
	gameResultUrl:String,
	ipaddress: String,
	browserdetail: String,
	deleteRequest: Object
},{timestamps :true});
betSchema.index({ marketId: 1, username: 1, status: 1, result: 1, deleted: -1 });
betSchema.index({ marketId: 1, deleted: -1, placedTime: -1 });
mongoose.model('Bet', betSchema);
