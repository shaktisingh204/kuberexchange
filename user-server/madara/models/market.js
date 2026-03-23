var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var marketSchema = new Schema({
	eventTypeId: { type: String, index: true },
	eventTypeName: String,
	competitionId: { type: String, index: true },
	competitionName: String,
	eventId: { type: String, index: true },
	eventName: String,
	openDate: { type: Date, index: true },
	marketId: { type: String, unique: true, require: true, index: true },
	roundId: String,
	marketName: String,
	fancyName: String,
	message: String,
	marketType: { type: String, index: true },
	usersPermission: Array,
	Result: String,
	fResult: String,
	sort: {type: Number, default : '0'},
	psort: {type: Number, default : '0'},
	marketTypeStatus: Number,
	totalMatched: Number,
	marketBook: {
		type: {
			marketId: String,
			isMarketDataDelayed: Boolean,
			status: { type: String, index: true },
			betDelay: Number,
			bspReconciled: Boolean,
			complete: Boolean,
			inplay: Boolean,
			computerPoint: Number,
			userPoint: Number,
			numberOfWinners: Number,
			numberOfRunners: Number,
			numberOfActiveRunners: Number,
			lastMatchTime: Date,
			totalMatched: Number,
			totalAvailable: Number,
			crossMatching: Boolean,
			runnersVoidable: Boolean,
			version: Number,
			runners: Array
		}
	},
	runners: Array,
	sessionResult: Number,
	minlimit: Number,
	maxlimit: Number,
	minSelect: Number,
	managers: Array,
	managerStatus: Object,
	masters: Array,
	masterStatus: Object,
	subadmins: Array,
	subadminStatus: Object,
	managerProfit: Object,
	masterProfit: Object,
	subadminProfit: Object,
	adminProfit: Object,
	runnersResult: Array,
	Result: String,
	Set: String,
	timers: Number,
	rateSource: { type: String, index: true },
	ssnrateSource: { type: String, index: true },
	multiExchangeFlag: Boolean,
	linestatus: Boolean,
	bookmakerSource: { type: String, index: true },
	availableSources: Array,
	availablebookmakerSources: Array,
	availablessnSources: Array,
	winner: String,
	url: String,
	score: String,
	imgArr:			Object,
	createdBy: String,
	timers: Number,
	shared: Boolean,
	userBlocks: {
		type: Array,
		_id: false,
		field: "String",
		trim: true,
	  },
	userfancyBlocks: {
		type: Array,
		_id: false,
		field: "String",
		trim: true,
	  },
	auto: { type: Boolean, index: true },
	ledger: { type: Boolean, index: true, default: true },
	visible: { type: Boolean, index: true ,default: true},
	visibleStatus: { type: Boolean },
	sessionAuto: { type: Boolean, index: true },
	deleted: { type: Boolean, index: true },
	userlog:{type: Number, default : '0'},
	managerlog:{type: Number, default : '0'},
	masterlog:{type: Number, default : '0'},
	subadminlog:{type: Number, default : '0'},
	adminlog:{type: Number, default : '0'},
	defaultlimit:{type: Number, default : '0'},
	matchodd_maxlimit: {type: Number, default : '100000'},
	machodds_minlimit: {type: Number, default : '100'},
	session_maxlimit: {type: Number, default : '100000'},
	session_minlimit: {type: Number, default : '100'},
	bookmaker_maxlimit: {type: Number, default : '200000'},
	bookmaker_minlimit: {type: Number, default : '100'},
	Team1run: String,
	scoreHomeVirtual:Array,
	scoreAwayVirtual:Array,
	HomeVirtual:Array,
	AwayVirtual:Array,
	Team1wicket: String,
	Team2run: String,
	Team2wicket: String,
	Team1id: String,
	Team1name: String,
	Team2name: String,
	Team2id: String,
	vedioTime:Boolean,

},{timestamps :true});
marketSchema.methods.setDefaults = function () {
	this.userBlocks = [];
	this.userfancyBlocks = [];
	this.visible = true;
	// this.machodds_minlimit = 0;
	// this.matchodd_maxlimit = 0;
	// this.session_minlimit = 0;
	// this.session_maxlimit = 0;
	// this.bookmaker_minlimit = 0;
	// this.bookmaker_minlimit = 0;

};
// marketSchema.index({ managers: 1, visible: -1, deleted: 1, "marketBook.status": 1, openDate: 1 });
// marketSchema.index({ eventId: 1, visible: -1, deleted: 1, "marketBook.status": 1 });
// marketSchema.index({ visible: -1, marketType: 1, managers: 1, "marketBook.status": 1 });
mongoose.model('Market', marketSchema);
