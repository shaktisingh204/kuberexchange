// required modules
var phantom = require('phantom');
var mongoose = require('mongoose');
var request = require('request');
var logger = require('log4js').getLogger();
var db = require('../madara/models/db');
var client = require('../madara/models/redis');
var index = 0;
// required models
// var eventTypeModule       = require('../whiteJetsu/eventType');
// var competitionModule     = require('../whiteJetsu/competition');
// var eventModule           = require('../whiteJetsu/event');
// var marketTypeModule      = require('../whiteJetsu/marketType');
// var marketCatalogueModule = require('../whiteJetsu/marketCatalogue');
// var marketBook            = require('../whiteJetsu/marketBook');
// var tokenModule         =   require('../whiteJetsu/token');

// required models
var EventType = mongoose.model('EventType');
var Competition = mongoose.model('Competition');
var Event = mongoose.model('Event');
var Market = mongoose.model('Market');
var User = mongoose.model('User');

var token = "";

console.log("Osg markets");

setInterval(function () {
	var request = require('request');
	var options = {
		'method': 'GET',
		'url': 'https://rnapi.paisaexch.com/api/getMatchOddsMarket',
		'headers': {
		}
	};
	request(options, async function (error, response) {
		if (error) throw new Error(error);
		// console.log(response.body);
		var result = JSON.parse(response.body);
		// console.log(result.data.length);
		let i = 0;
		while (i < result.data.length) {
			var newevent = result.data[i];
			//   console.log(newevent.eventId,newevent.eventName);
			// if(newevent.eventId === "32126984"){
			// 	console.log(newevent.marketId,newevent);
			// }
			await Market.findOne({
				'marketId': newevent.marketId,

			}, async function (err, data) {

				if (!data) {
					newevent.rateSource = "OSGExchange";
					var DataSave = new Market(newevent);

					await DataSave.save(async function (err) {
						//   console.log(err);
						if (err) logger.debug(err);
						newevent.createdate = new Date();
						//   await client.set("mid" + newevent.eventId + " " + newevent.marketId, JSON.stringify(newevent), 'ex', 8);
						console.log("Saved", newevent.eventId, newevent.marketId)
					});
				} else {
					//   console.log("already added")  
					// newevent.imgArr = 'SUSPENDED';
					Market.update({
						marketId: newevent.marketId
					}, { imgArr: newevent.imgArr }, function (err, raw) { });
				}

			});

			i++;
		}
	});
}, 3600);

setInterval(function () {

	Market.find({
		"eventTypeId": "4",

		"marketBook.status": {
			$in: ["OPEN", "SUSPENDED", "INACTIVE"]
		},
		"visible": true,
		// 'marketType': 'Special',

		marketType: {
			$ne: "SESSION"
		},
	}, function (err, dbMarket) {
		// console.log(dbMarket.length)
		dbMarket.forEach(function (element) {
			// console.log(element.eventId) 
			var eventId = element.eventId;
			var marketId = element.marketId;
			var eventName = element.eventName;
			var openDate = element.openDate;
			// request('http://172.105.55.40/getbm?eventId=' + eventId, function(error, response, body) {
			// request('http://20.219.2.60/getbm?eventId=' + eventId, function (error, response, body) {
			// request('http://209.97.133.27:5050/api/market/fancy/' + eventId, function (error, response, body) {
			// request('http://64.227.176.192:40021/api/market/fancy/' + eventId, function (error, response, body) {
			// request('http://52.172.254.145/getbm2?eventId=' + eventId, function (error, response, body) {
			// request('http://4.224.85.185/getbm2?eventId=' + eventId, function (error, response, body) {
			// 	response.body = "";
			// 	if (eventId == 32613264) {
			// 		//   if (!response) return;
			// 		console.log("32613264", element.eventId, response.body);
			// 	}
			// 	try {
			// 		// if (!response) return;
			// 		if (!response.body) {
						request('http://178.62.77.178:3006/api/get-fancy-bokmaker/' + eventId, function (error, response, body) {

							// console.log("Second Api Response", response.body);
							// 							if(eventId == 32556158){  
							//   if (!response) return;
							//   console.log("32556158",element.eventId,response.body);  
							// }

							if (error) {
								console.log(error);
								return;
							}
							if (response.statusCode == 200) {
								// onComplete(true);
								var objj = JSON.parse(response.body);
								if (!objj) return;
								if (!objj.dbBookmaker) return;
								// console.log(objj.dbBookmaker);

								var response1 = objj.dbBookmaker;

								response1.forEach(async function (elementall) {

									// console.log(elementall, elementall.marketId, elementall.marketName);
									var marketId = elementall.marketId;
									var m4 = {
										eventTypeId: "4",
										eventTypeName: "Cricket",
										eventId: eventId,
										eventName: elementall.eventName,
										openDate: openDate,
										marketId: marketId,
										marketName: elementall.marketName,
										marketType: 'Special',
										runners: elementall.marketBook.runners,
										totalMatched: 0,
										betcount: 0,
										order: 1,
										psrorder: 1,
										marketBook: elementall.marketBook,
										runners: [],
										managers: [],
										createdBy: 'luffy',
										managerStatus: {},
										availableSources: [],
										rateSource: 'FancyBook',
										message: null,
										minlimit: 100,
										maxlimit: 50000,
										visible: elementall.marketBook.visible,
										shared: false,
										deleted: false,
										auto: true,
										visibleStatus: true,
									};


									var newMarket = new Market(m4);

									Market.findOne({
										"marketId": marketId,
									}, {}, async function (err, dbMarketcount) {
										if (dbMarketcount) {
											if (dbMarketcount.auto == true) {
												dbMarketcount.visible = elementall.marketBook.visible;
												dbMarketcount.visibleStatus = elementall.marketBook.visible;
											}
											dbMarketcount.marketBook = elementall.marketBook;
											if (dbMarketcount.sessionResult && newMarket.sessionResult != null) {
												dbMarketcount.marketBook.status = 'CLOSED';
											}
											dbMarketcount.createdate = new Date();
											// console.log("mid" + eventId + " " + marketId,dbMarketcount.auto)
											// var autostatus = await Market.findOne({ marketId: marketId }, { auto: 1 });
											dbMarketcount.marketType = 'Special';
											dbMarketcount.runners = elementall.marketBook.runners;
											if (dbMarketcount.auto == true) {
												// console.log(dbMarketcount, marketId)
												// await client.set("mid" + eventId + " " + marketId, JSON.stringify(dbMarketcount), 'ex', 3);

												Market.update({
													marketId: marketId
												}, dbMarketcount, function (err, raw) {
													// console.log(raw);
													if (err) logger.error(err);
												});
											}
										} else {
											console.log(newMarket)
											// await client.set("mid" + eventId + " " + marketId, JSON.stringify(newMarket), 'ex', 3);

											newMarket.save(function (err) {
												console.log(err);
												// if (err) logger.debug(err);
											});
										}
									});
								});
							}
							else {
								// onComplete(false)
								Market.find({
									eventId: eventId,
									marketType: "Special",
									'marketBook.status': 'OPEN',
									'rateSource': { $nin: ['Manuall'] },
								}, function (err, dbMarketS) {

									if (dbMarketS.length == 0) return;
									dbMarketS.forEach((val, index) => {
										val.marketBook.status = 'SUSPENDED';
										Market.update({
											marketId: val.marketId
										}, val, function (err, raw) {
										});
									})


								});
							}


							// if (!response) {

							// }

							// if (!response.body) return;
							// if (response.body == "") return;

						})

					// }
					// if (!response.body) return;
					// console.log("blank 333");
					// if (response.body == "") return;
					// var objjk = JSON.parse(response.body);
					// var objj = objjk.t2[0];
					// // if (objj.length == 0) return;
					// // console.log(objj.length)
					// if (objj.bm1) {
					// 	var obj = objj.bm1;
					// } else {
					// 	var obj = objj.bm2;
					// }
					// // console.log(obj.length)

					// if (obj.length == 0) return;
					// if (obj.length == 0) {
					// 	// console.log(obj)
					// 	var marketBookId = obj[0].mid;
					// 	Market.findOne({
					// 		marketId: marketBookId,

					// 	}, function (err, dbBookMarket) {
					// 		if (!dbBookMarket) return;
					// 		for (var s = 0; s < dbBookMarket.marketBook.runners.length; s++) {
					// 			dbBookMarket.marketBook.runners[s].status = 'SUSPENDED';
					// 		}

					// 		Market.update({
					// 			marketId: dbBookMarket.marketId
					// 		}, dbBookMarket, function (err, raw) {
					// 			//console.log('null value');

					// 			if (err) logger.error(err);
					// 		});
					// 	});
					// 	return;
					// }
					// var object = obj;
					// // console.log("11111")
					// if (!object) return;
					// // console.log("2222")

					// if (object) {
					// 	// console.log("3333")
					// 	if (object.length == 0) return;
					// 	if (object.length > 0) {
					// 		// console.log("4444")
					// 		var market = object[0].mid;
					// 		var marketRunner = object;
					// 		var order = 0;
					// 		var marketDb = [];
					// 		for (var j = 0; j < marketRunner.length; j++) {
					// 			var runn = {
					// 				"runnerName": marketRunner[j].nat,
					// 				"rate": marketRunner[j].b1,
					// 				"layrate": marketRunner[j].l1,
					// 				"status": marketRunner[j].s,
					// 			}
					// 			marketDb.push(runn);
					// 		}

					// 		//    console.log("5555")
					// 		if (!marketDb) {

					// 			return;
					// 		}
					// 		//    console.log("6666")
					// 		var marketId = 1. + '-' + object[0].mid;

					// 		var runners = [];
					// 		for (var m = 0; m < marketDb.length; m++) {
					// 			var selectionidAll = Math.floor(Math.random() * 1000000);
					// 			var selection = {
					// 				"selectionId": selectionidAll,
					// 				"runnerName": marketDb[m].runnerName,
					// 				"status": marketDb[m].status,
					// 				"availableToBack": {
					// 					"price": 0,
					// 					"size": "100"
					// 				},
					// 				"availableToLay": {
					// 					"price": 0,
					// 					"size": "100"
					// 				},
					// 			};
					// 			runners.push(selection);
					// 		}
					// 		//    console.log("7777")
					// 		var m2 = {
					// 			eventTypeId: "4",
					// 			eventName: element.eventName,
					// 			eventId: element.eventId,
					// 			openDate: element.openDate,
					// 			marketId: marketId,
					// 			marketType: "Special",
					// 			marketName: "Bookmaker",
					// 			rateSource: 'LotusBook',
					// 			order: parseInt(order),
					// 			psrorder: parseInt(order),
					// 			marketBook: {
					// 				marketId: marketId,
					// 				status: "OPEN",

					// 				runners: runners,
					// 			},
					// 			runners: runners,
					// 			managers: [],
					// 			usersPermission: [],
					// 			managerStatus: {},
					// 			createdBy: '',
					// 			shared: true,
					// 			auto: true,
					// 			timers: 90,
					// 			visible: true,
					// 			deleted: false,
					// 			message: object[0].remark,
					// 			minlimit: object[0].min,
					// 			maxlimit: object[0].max,
					// 		}
					// 		// var market = val.section;
					// 		if (!object) return;
					// 		var market = object;
					// 		(function (market) {

					// 			Market.findOne({
					// 				marketId: marketId,
					// 				marketType: "Special",
					// 			}, async function (err, dbMarket) {
					// 				// console.log(err)
					// 				// console.log(dbMarket)
					// 				// console.log("8888")
					// 				if (dbMarket) {
					// 					dbMarket.marketBook.status = 'OPEN';
					// 					// dbMarket.createdBy=val.rem;
					// 					// console.log(val.rem)
					// 					if (dbMarket && dbMarket.marketBook.runners) {

					// 						for (var l = 0; l < dbMarket.marketBook.runners.length; l++) {
					// 							// console.log("market"+dbMarket.marketBook.runners[1].runnerName)
					// 							if (market.length > 2) {
					// 								if (dbMarket.marketBook.runners[0].runnerName == market[0].nat) {
					// 									if (dbMarket.marketBook.runners[0]['availableToBack']) {

					// 										if (market[0].b1 !== "0.00") {

					// 											dbMarket.marketBook.runners[0]['availableToBack']['price'] = parseFloat((1 + market[0].b1 / 100).toFixed(2));
					// 											dbMarket.marketBook.runners[0]['availableToBack']['kprice'] = market[0].b1;
					// 										} else {
					// 											dbMarket.marketBook.runners[0]['availableToBack']['price'] = market[0].b1;
					// 											dbMarket.marketBook.runners[0]['availableToBack']['kprice'] = market[0].b1;
					// 										}

					// 										dbMarket.marketBook.runners[0]['availableToBack']['size'] = 100;

					// 										dbMarket.marketBook.runners[0].status = market[0].s;
					// 										if (dbMarket.marketBook.status != 'CLOSED') {

					// 										}

					// 									}

					// 									if (dbMarket.marketBook.runners[0]['availableToLay']) {
					// 										//console.log("3");
					// 										if (market[0].l1 !== "0.00") {
					// 											if (parseFloat(market[0].b1) > 20) {

					// 												dbMarket.marketBook.runners[0]['availableToLay']['price'] = parseFloat(parseFloat((1 + market[0].b1 / 100).toFixed(2)) + .03).toFixed(2);
					// 												dbMarket.marketBook.runners[0]['availableToLay']['kprice'] = parseFloat(market[0].b1) + 3;
					// 											} else {
					// 												dbMarket.marketBook.runners[0]['availableToLay']['price'] = parseFloat(parseFloat((1 + market[0].b1 / 100).toFixed(2)) + .02).toFixed(2);
					// 												dbMarket.marketBook.runners[0]['availableToLay']['kprice'] = parseFloat(market[0].b1) + 2;
					// 											}

					// 											//console.log(dbMarket.marketBook.runners[0]['availableToLay']['price'])
					// 										} else {
					// 											dbMarket.marketBook.runners[0]['availableToLay']['price'] = market[0].l1;
					// 										}


					// 										dbMarket.marketBook.runners[0]['availableToLay']['size'] = 100;

					// 										dbMarket.marketBook.runners[0].status = market[0].s;
					// 										if (dbMarket.marketBook.status != 'CLOSED') {


					// 										}


					// 									}
					// 								}

					// 								if (dbMarket.marketBook.runners[0].runnerName == market[1].nat) {

					// 									if (dbMarket.marketBook.runners[0]['availableToBack']) {

					// 										if (market[1].b1 !== "0.00") {

					// 											dbMarket.marketBook.runners[0]['availableToBack']['price'] = parseFloat((1 + market[1].b1 / 100).toFixed(2));
					// 											dbMarket.marketBook.runners[0]['availableToBack']['kprice'] = market[1].b1;
					// 										} else {
					// 											dbMarket.marketBook.runners[0]['availableToBack']['price'] = market[1].b1;
					// 											dbMarket.marketBook.runners[0]['availableToBack']['kprice'] = market[1].b1;
					// 										}

					// 										dbMarket.marketBook.runners[0]['availableToBack']['size'] = 100;

					// 										dbMarket.marketBook.runners[0].status = market[1].s;
					// 										if (dbMarket.marketBook.status != 'CLOSED') {

					// 										}

					// 									}

					// 									if (dbMarket.marketBook.runners[0]['availableToLay']) {
					// 										//console.log("3");
					// 										if (market[1].l1 !== "0.00") {
					// 											if (parseFloat(market[1].b1) > 20) {

					// 												dbMarket.marketBook.runners[0]['availableToLay']['price'] = parseFloat(parseFloat((1 + market[1].b1 / 100).toFixed(2)) + .03).toFixed(2);
					// 												dbMarket.marketBook.runners[0]['availableToLay']['kprice'] = parseFloat(market[1].b1) + 3;
					// 											} else {
					// 												dbMarket.marketBook.runners[0]['availableToLay']['price'] = parseFloat(parseFloat((1 + market[1].b1 / 100).toFixed(2)) + .02).toFixed(2);
					// 												dbMarket.marketBook.runners[0]['availableToLay']['kprice'] = parseFloat(market[1].b1) + 2;
					// 											}

					// 											//console.log(dbMarket.marketBook.runners[0]['availableToLay']['price'])
					// 										} else {
					// 											dbMarket.marketBook.runners[0]['availableToLay']['price'] = market[1].l1;
					// 										}


					// 										dbMarket.marketBook.runners[0]['availableToLay']['size'] = 100;

					// 										dbMarket.marketBook.runners[0].status = market[1].s;
					// 										if (dbMarket.marketBook.status != 'CLOSED') {


					// 										}


					// 									}
					// 								}


					// 								if (dbMarket.marketBook.runners[0].runnerName == market[2].nat) {
					// 									if (dbMarket.marketBook.runners[0]['availableToBack']) {

					// 										if (market[2].b1 !== "0.00") {

					// 											dbMarket.marketBook.runners[0]['availableToBack']['price'] = parseFloat((1 + market[2].b1 / 100).toFixed(2));
					// 											dbMarket.marketBook.runners[0]['availableToBack']['kprice'] = market[2].b1;
					// 										} else {
					// 											dbMarket.marketBook.runners[0]['availableToBack']['price'] = market[2].b1;
					// 											dbMarket.marketBook.runners[0]['availableToBack']['kprice'] = market[2].b1;
					// 										}

					// 										dbMarket.marketBook.runners[0]['availableToBack']['size'] = 100;

					// 										dbMarket.marketBook.runners[0].status = market[2].s;
					// 										if (dbMarket.marketBook.status != 'CLOSED') {

					// 										}

					// 									}

					// 									if (dbMarket.marketBook.runners[0]['availableToLay']) {
					// 										//console.log("3");
					// 										if (market[2].l1 !== "0.00") {
					// 											if (parseFloat(market[2].b1) > 20) {

					// 												dbMarket.marketBook.runners[0]['availableToLay']['price'] = parseFloat(parseFloat((1 + market[2].b1 / 100).toFixed(2)) + .03).toFixed(2);
					// 												dbMarket.marketBook.runners[0]['availableToLay']['kprice'] = parseFloat(market[2].b1) + 3;
					// 											} else {
					// 												dbMarket.marketBook.runners[0]['availableToLay']['price'] = parseFloat(parseFloat((1 + market[2].b1 / 100).toFixed(2)) + .02).toFixed(2);
					// 												dbMarket.marketBook.runners[0]['availableToLay']['kprice'] = parseFloat(market[2].b1) + 2;
					// 											}

					// 											//console.log(dbMarket.marketBook.runners[0]['availableToLay']['price'])
					// 										} else {
					// 											dbMarket.marketBook.runners[0]['availableToLay']['price'] = market[2].l1;
					// 										}


					// 										dbMarket.marketBook.runners[0]['availableToLay']['size'] = 100;

					// 										dbMarket.marketBook.runners[0].status = market[2].s;
					// 										if (dbMarket.marketBook.status != 'CLOSED') {


					// 										}


					// 									}
					// 								}


					// 								if (dbMarket.marketBook.runners[1].runnerName == market[0].nat) {

					// 									if (dbMarket.marketBook.runners[1]['availableToBack']) {

					// 										if (market[0].b1 !== "0.00") {

					// 											dbMarket.marketBook.runners[1]['availableToBack']['price'] = parseFloat((1 + market[0].b1 / 100).toFixed(2));
					// 											dbMarket.marketBook.runners[1]['availableToBack']['kprice'] = market[0].b1;
					// 										} else {
					// 											dbMarket.marketBook.runners[1]['availableToBack']['price'] = market[0].b1;
					// 											dbMarket.marketBook.runners[1]['availableToBack']['kprice'] = market[0].b1;
					// 										}

					// 										dbMarket.marketBook.runners[1]['availableToBack']['size'] = 100;

					// 										dbMarket.marketBook.runners[1].status = market[0].s;
					// 										if (dbMarket.marketBook.status != 'CLOSED') {

					// 										}

					// 									}

					// 									if (dbMarket.marketBook.runners[1]['availableToLay']) {
					// 										//console.log("3");
					// 										if (market[0].l1 !== "0.00") {
					// 											if (parseFloat(market[0].b1) > 20) {

					// 												dbMarket.marketBook.runners[1]['availableToLay']['price'] = parseFloat(parseFloat((1 + market[0].b1 / 100).toFixed(2)) + .03).toFixed(2);
					// 												dbMarket.marketBook.runners[1]['availableToLay']['kprice'] = parseFloat(market[0].b1) + 3;
					// 											} else {
					// 												dbMarket.marketBook.runners[1]['availableToLay']['price'] = parseFloat(parseFloat((1 + market[0].b1 / 100).toFixed(2)) + .02).toFixed(2);
					// 												dbMarket.marketBook.runners[1]['availableToLay']['kprice'] = parseFloat(market[0].b1) + 2;
					// 											}

					// 											//console.log(dbMarket.marketBook.runners[0]['availableToLay']['price'])
					// 										} else {
					// 											dbMarket.marketBook.runners[1]['availableToLay']['price'] = market[0].l1;
					// 										}


					// 										dbMarket.marketBook.runners[1]['availableToLay']['size'] = 100;

					// 										dbMarket.marketBook.runners[1].status = market[0].s;
					// 										if (dbMarket.marketBook.status != 'CLOSED') {


					// 										}


					// 									}
					// 								}

					// 								if (dbMarket.marketBook.runners[1].runnerName == market[1].nat) {
					// 									if (dbMarket.marketBook.runners[1]['availableToBack']) {

					// 										if (market[1].b1 !== "0.00") {

					// 											dbMarket.marketBook.runners[1]['availableToBack']['price'] = parseFloat((1 + market[1].b1 / 100).toFixed(2));
					// 											dbMarket.marketBook.runners[1]['availableToBack']['kprice'] = market[1].b1;
					// 										} else {
					// 											dbMarket.marketBook.runners[1]['availableToBack']['price'] = market[1].b1;
					// 											dbMarket.marketBook.runners[1]['availableToBack']['kprice'] = market[1].b1;
					// 										}

					// 										dbMarket.marketBook.runners[1]['availableToBack']['size'] = 100;

					// 										dbMarket.marketBook.runners[1].status = market[1].s;
					// 										if (dbMarket.marketBook.status != 'CLOSED') {

					// 										}

					// 									}

					// 									if (dbMarket.marketBook.runners[1]['availableToLay']) {
					// 										//console.log("3");
					// 										if (market[1].l1 !== "0.00") {
					// 											if (parseFloat(market[1].b1) > 20) {

					// 												dbMarket.marketBook.runners[1]['availableToLay']['price'] = parseFloat(parseFloat((1 + market[1].b1 / 100).toFixed(2)) + .03).toFixed(2);
					// 												dbMarket.marketBook.runners[1]['availableToLay']['kprice'] = parseFloat(market[1].b1) + 3;
					// 											} else {
					// 												dbMarket.marketBook.runners[1]['availableToLay']['price'] = parseFloat(parseFloat((1 + market[1].b1 / 100).toFixed(2)) + .02).toFixed(2);
					// 												dbMarket.marketBook.runners[1]['availableToLay']['kprice'] = parseFloat(market[1].b1) + 2;
					// 											}

					// 											//console.log(dbMarket.marketBook.runners[0]['availableToLay']['price'])
					// 										} else {
					// 											dbMarket.marketBook.runners[1]['availableToLay']['price'] = market[1].l1;
					// 										}


					// 										dbMarket.marketBook.runners[1]['availableToLay']['size'] = 100;

					// 										dbMarket.marketBook.runners[1].status = market[1].s;
					// 										if (dbMarket.marketBook.status != 'CLOSED') {


					// 										}


					// 									}
					// 								}


					// 								if (dbMarket.marketBook.runners[1].runnerName == market[2].nat) {
					// 									if (dbMarket.marketBook.runners[1]['availableToBack']) {

					// 										if (market[2].b1 !== "0.00") {

					// 											dbMarket.marketBook.runners[1]['availableToBack']['price'] = parseFloat((1 + market[2].b1 / 100).toFixed(2));
					// 											dbMarket.marketBook.runners[1]['availableToBack']['kprice'] = market[2].b1;
					// 										} else {
					// 											dbMarket.marketBook.runners[1]['availableToBack']['price'] = market[2].b1;
					// 											dbMarket.marketBook.runners[1]['availableToBack']['kprice'] = market[2].b1;
					// 										}

					// 										dbMarket.marketBook.runners[1]['availableToBack']['size'] = 100;

					// 										dbMarket.marketBook.runners[1].status = market[2].s;
					// 										if (dbMarket.marketBook.status != 'CLOSED') {

					// 										}

					// 									}

					// 									if (dbMarket.marketBook.runners[1]['availableToLay']) {
					// 										//console.log("3");
					// 										if (market[2].l1 !== "0.00") {
					// 											if (parseFloat(market[2].b1) > 20) {

					// 												dbMarket.marketBook.runners[1]['availableToLay']['price'] = parseFloat(parseFloat((1 + market[1].b1 / 100).toFixed(2)) + .03).toFixed(2);
					// 												dbMarket.marketBook.runners[1]['availableToLay']['kprice'] = parseFloat(market[1].b1) + 3;

					// 												dbMarket.marketBook.runners[1]['availableToLay']['price'] = parseFloat(parseFloat((1 + market[2].b1 / 100).toFixed(2)) + .02).toFixed(2);
					// 												dbMarket.marketBook.runners[1]['availableToLay']['kprice'] = parseFloat(market[1].b1) + 2;
					// 											}

					// 											//console.log(dbMarket.marketBook.runners[0]['availableToLay']['price'])
					// 										} else {
					// 											dbMarket.marketBook.runners[1]['availableToLay']['price'] = market[2].l1;
					// 										}


					// 										dbMarket.marketBook.runners[1]['availableToLay']['size'] = 100;

					// 										dbMarket.marketBook.runners[1].status = market[2].s;
					// 										if (dbMarket.marketBook.status != 'CLOSED') {


					// 										}


					// 									}
					// 								}

					// 								if (dbMarket.marketBook.runners[2].runnerName == market[0].nat) {
					// 									if (dbMarket.marketBook.runners[2]['availableToBack']) {

					// 										if (market[0].b1 !== "0.00") {

					// 											dbMarket.marketBook.runners[2]['availableToBack']['price'] = parseFloat((1 + market[0].b1 / 100).toFixed(2));
					// 											dbMarket.marketBook.runners[2]['availableToBack']['kprice'] = market[0].b1;
					// 										} else {
					// 											dbMarket.marketBook.runners[2]['availableToBack']['price'] = market[0].b1;
					// 											dbMarket.marketBook.runners[2]['availableToBack']['kprice'] = market[0].b1;
					// 										}

					// 										dbMarket.marketBook.runners[2]['availableToBack']['size'] = 100;

					// 										dbMarket.marketBook.runners[2].status = market[0].s;
					// 										if (dbMarket.marketBook.status != 'CLOSED') {

					// 										}

					// 									}

					// 									if (dbMarket.marketBook.runners[2]['availableToLay']) {
					// 										//console.log("3");
					// 										if (market[0].l1 !== "0.00") {
					// 											if (parseFloat(market[0].b1) > 20) {

					// 												dbMarket.marketBook.runners[2]['availableToLay']['price'] = parseFloat(parseFloat((1 + market[0].b1 / 100).toFixed(2)) + .03).toFixed(2);
					// 												dbMarket.marketBook.runners[2]['availableToLay']['kprice'] = parseFloat(market[0].b1) + 3;
					// 											} else {
					// 												dbMarket.marketBook.runners[2]['availableToLay']['price'] = parseFloat(parseFloat((1 + market[0].b1 / 100).toFixed(2)) + .02).toFixed(2);
					// 												dbMarket.marketBook.runners[2]['availableToLay']['kprice'] = parseFloat(market[0].b1) + 2;
					// 											}

					// 											//console.log(dbMarket.marketBook.runners[0]['availableToLay']['price'])
					// 										} else {
					// 											dbMarket.marketBook.runners[2]['availableToLay']['price'] = market[0].l1;
					// 										}


					// 										dbMarket.marketBook.runners[2]['availableToLay']['size'] = 100;

					// 										dbMarket.marketBook.runners[2].status = market[0].s;
					// 										if (dbMarket.marketBook.status != 'CLOSED') {


					// 										}


					// 									}
					// 								}

					// 								if (dbMarket.marketBook.runners[2].runnerName == market[1].nat) {
					// 									if (dbMarket.marketBook.runners[2]['availableToBack']) {

					// 										if (market[1].b1 !== "0.00") {

					// 											dbMarket.marketBook.runners[2]['availableToBack']['price'] = parseFloat((1 + market[1].b1 / 100).toFixed(2));
					// 											dbMarket.marketBook.runners[2]['availableToBack']['kprice'] = market[1].b1;
					// 										} else {
					// 											dbMarket.marketBook.runners[2]['availableToBack']['price'] = market[1].b1;
					// 											dbMarket.marketBook.runners[2]['availableToBack']['kprice'] = market[1].b1;
					// 										}

					// 										dbMarket.marketBook.runners[2]['availableToBack']['size'] = 100;

					// 										dbMarket.marketBook.runners[2].status = market[1].s;
					// 										if (dbMarket.marketBook.status != 'CLOSED') {

					// 										}

					// 									}

					// 									if (dbMarket.marketBook.runners[2]['availableToLay']) {
					// 										//console.log("3");
					// 										if (market[1].l1 !== "0.00") {
					// 											if (parseFloat(market[1].b1) > 20) {

					// 												dbMarket.marketBook.runners[2]['availableToLay']['price'] = parseFloat(parseFloat((1 + market[1].b1 / 100).toFixed(2)) + .03).toFixed(2);
					// 												dbMarket.marketBook.runners[2]['availableToLay']['kprice'] = parseFloat(market[1].b1) + 3;
					// 											} else {
					// 												dbMarket.marketBook.runners[2]['availableToLay']['price'] = parseFloat(parseFloat((1 + market[1].b1 / 100).toFixed(2)) + .02).toFixed(2);
					// 												dbMarket.marketBook.runners[2]['availableToLay']['kprice'] = parseFloat(market[1].b1) + 2;
					// 											}

					// 											//console.log(dbMarket.marketBook.runners[0]['availableToLay']['price'])
					// 										} else {
					// 											dbMarket.marketBook.runners[2]['availableToLay']['price'] = market[1].l1;
					// 										}


					// 										dbMarket.marketBook.runners[2]['availableToLay']['size'] = 100;

					// 										dbMarket.marketBook.runners[2].status = market[1].s;
					// 										if (dbMarket.marketBook.status != 'CLOSED') {


					// 										}


					// 									}
					// 								}


					// 								if (dbMarket.marketBook.runners[2].runnerName == market[2].nat) {
					// 									if (dbMarket.marketBook.runners[2]['availableToBack']) {

					// 										if (market[2].b1 !== "0.00") {

					// 											dbMarket.marketBook.runners[2]['availableToBack']['price'] = parseFloat((1 + market[2].b1 / 100).toFixed(2));
					// 											dbMarket.marketBook.runners[2]['availableToBack']['kprice'] = market[2].b1;
					// 										} else {
					// 											dbMarket.marketBook.runners[2]['availableToBack']['price'] = market[2].b1;
					// 											dbMarket.marketBook.runners[2]['availableToBack']['kprice'] = market[2].b1;
					// 										}

					// 										dbMarket.marketBook.runners[2]['availableToBack']['size'] = 100;

					// 										dbMarket.marketBook.runners[2].status = market[2].s;
					// 										if (dbMarket.marketBook.status != 'CLOSED') {

					// 										}

					// 									}

					// 									if (dbMarket.marketBook.runners[2]['availableToLay']) {
					// 										//console.log("3");
					// 										if (market[2].l1 !== "0.00") {
					// 											if (parseFloat(market[2].b1) > 20) {

					// 												dbMarket.marketBook.runners[2]['availableToLay']['price'] = parseFloat(parseFloat((1 + market[2].b1 / 100).toFixed(2)) + .03).toFixed(2);
					// 												dbMarket.marketBook.runners[2]['availableToLay']['kprice'] = parseFloat(market[2].b1) + 3;
					// 											} else {
					// 												dbMarket.marketBook.runners[2]['availableToLay']['price'] = parseFloat(parseFloat((1 + market[2].b1 / 100).toFixed(2)) + .02).toFixed(2);
					// 												dbMarket.marketBook.runners[2]['availableToLay']['kprice'] = parseFloat(market[2].b1) + 2;
					// 											}

					// 											//console.log(dbMarket.marketBook.runners[0]['availableToLay']['price'])
					// 										} else {
					// 											dbMarket.marketBook.runners[2]['availableToLay']['price'] = market[2].l1;
					// 										}


					// 										dbMarket.marketBook.runners[2]['availableToLay']['size'] = 100;

					// 										dbMarket.marketBook.runners[2].status = market[2].s;
					// 										if (dbMarket.marketBook.status != 'CLOSED') {


					// 										}


					// 									}
					// 								}


					// 							} else {
					// 								if (dbMarket.marketBook.runners[0].runnerName == market[0].nat) {
					// 									if (dbMarket.marketBook.runners[0]['availableToBack']) {

					// 										if (market[0].b1 !== "0.00") {

					// 											dbMarket.marketBook.runners[0]['availableToBack']['price'] = parseFloat((1 + market[0].b1 / 100).toFixed(2));
					// 											dbMarket.marketBook.runners[0]['availableToBack']['kprice'] = market[0].b1;
					// 										} else {
					// 											dbMarket.marketBook.runners[0]['availableToBack']['price'] = market[0].b1;
					// 											dbMarket.marketBook.runners[0]['availableToBack']['kprice'] = market[0].b1;
					// 										}

					// 										dbMarket.marketBook.runners[0]['availableToBack']['size'] = 100;

					// 										dbMarket.marketBook.runners[0].status = market[0].s;
					// 										if (dbMarket.marketBook.status != 'CLOSED') {

					// 										}

					// 									}

					// 									if (dbMarket.marketBook.runners[0]['availableToLay']) {
					// 										//console.log("3");
					// 										if (market[0].l1 !== "0.00") {
					// 											if (parseFloat(market[0].b1) > 20) {

					// 												dbMarket.marketBook.runners[0]['availableToLay']['price'] = parseFloat(parseFloat((1 + market[0].b1 / 100).toFixed(2)) + .03).toFixed(2);
					// 												dbMarket.marketBook.runners[0]['availableToLay']['kprice'] = parseFloat(market[0].b1) + 3;
					// 											} else {
					// 												dbMarket.marketBook.runners[0]['availableToLay']['price'] = parseFloat(parseFloat((1 + market[0].b1 / 100).toFixed(2)) + .02).toFixed(2);
					// 												dbMarket.marketBook.runners[0]['availableToLay']['kprice'] = parseFloat(market[0].b1) + 2;
					// 											}

					// 											//console.log(dbMarket.marketBook.runners[0]['availableToLay']['price'])
					// 										} else {
					// 											dbMarket.marketBook.runners[0]['availableToLay']['price'] = market[0].l1;
					// 										}


					// 										dbMarket.marketBook.runners[0]['availableToLay']['size'] = 100;

					// 										dbMarket.marketBook.runners[0].status = market[0].s;
					// 										if (dbMarket.marketBook.status != 'CLOSED') {


					// 										}


					// 									}
					// 								}

					// 								if (dbMarket.marketBook.runners[1].runnerName == market[0].nat) {

					// 									if (dbMarket.marketBook.runners[1]['availableToBack']) {

					// 										if (market[0].b1 !== "0.00") {

					// 											dbMarket.marketBook.runners[1]['availableToBack']['price'] = parseFloat((1 + market[0].b1 / 100).toFixed(2));
					// 											dbMarket.marketBook.runners[1]['availableToBack']['kprice'] = market[0].b1;
					// 										} else {
					// 											dbMarket.marketBook.runners[1]['availableToBack']['price'] = market[0].b1;
					// 											dbMarket.marketBook.runners[1]['availableToBack']['kprice'] = market[0].b1;
					// 										}

					// 										dbMarket.marketBook.runners[1]['availableToBack']['size'] = 100;

					// 										dbMarket.marketBook.runners[1].status = market[0].s;
					// 										if (dbMarket.marketBook.status != 'CLOSED') {

					// 										}

					// 									}

					// 									if (dbMarket.marketBook.runners[1]['availableToLay']) {
					// 										//console.log("3");
					// 										if (market[0].l1 !== "0.00") {

					// 											if (parseFloat(market[0].b1) > 20) {
					// 												dbMarket.marketBook.runners[1]['availableToLay']['price'] = parseFloat(parseFloat((1 + market[0].b1 / 100).toFixed(2)) + .03).toFixed(2);
					// 												dbMarket.marketBook.runners[1]['availableToLay']['kprice'] = parseFloat(market[0].b1) + 3;
					// 											} else {
					// 												dbMarket.marketBook.runners[1]['availableToLay']['price'] = parseFloat(parseFloat((1 + market[0].b1 / 100).toFixed(2)) + .02).toFixed(2);
					// 												dbMarket.marketBook.runners[1]['availableToLay']['kprice'] = parseFloat(market[0].b1) + 2;
					// 											}
					// 										} else {
					// 											dbMarket.marketBook.runners[1]['availableToLay']['price'] = market[0].l1;
					// 										}


					// 										dbMarket.marketBook.runners[1]['availableToLay']['size'] = 100;

					// 										dbMarket.marketBook.runners[1].status = market[0].s;
					// 										if (dbMarket.marketBook.status != 'CLOSED') {


					// 										}


					// 									}

					// 								}

					// 								if (dbMarket.marketBook.runners[1].runnerName == market[1].nat) {
					// 									if (dbMarket.marketBook.runners[1]['availableToBack']) {

					// 										if (market[1].b1 !== "0.00") {

					// 											dbMarket.marketBook.runners[1]['availableToBack']['price'] = parseFloat((1 + market[1].b1 / 100).toFixed(2));
					// 											dbMarket.marketBook.runners[1]['availableToBack']['kprice'] = market[1].b1;
					// 										} else {
					// 											dbMarket.marketBook.runners[1]['availableToBack']['price'] = market[1].b1;
					// 											dbMarket.marketBook.runners[1]['availableToBack']['kprice'] = market[1].b1;
					// 										}

					// 										dbMarket.marketBook.runners[1]['availableToBack']['size'] = 100;

					// 										dbMarket.marketBook.runners[1].status = market[1].s;
					// 										if (dbMarket.marketBook.status != 'CLOSED') {

					// 										}

					// 									}

					// 									if (dbMarket.marketBook.runners[1]['availableToLay']) {
					// 										//console.log("3");
					// 										if (market[1].l1 !== "0.00") {

					// 											if (parseFloat(market[1].b1) > 20) {
					// 												dbMarket.marketBook.runners[1]['availableToLay']['price'] = parseFloat(parseFloat((1 + market[1].b1 / 100).toFixed(2)) + .03).toFixed(2);
					// 												dbMarket.marketBook.runners[1]['availableToLay']['kprice'] = parseFloat(market[1].b1) + 3;
					// 											} else {
					// 												dbMarket.marketBook.runners[1]['availableToLay']['price'] = parseFloat(parseFloat((1 + market[1].b1 / 100).toFixed(2)) + .02).toFixed(2);
					// 												dbMarket.marketBook.runners[1]['availableToLay']['kprice'] = parseFloat(market[1].b1) + 2;
					// 											}
					// 										} else {
					// 											dbMarket.marketBook.runners[1]['availableToLay']['price'] = market[1].l1;
					// 										}


					// 										dbMarket.marketBook.runners[1]['availableToLay']['size'] = 100;

					// 										dbMarket.marketBook.runners[1].status = market[1].s;
					// 										if (dbMarket.marketBook.status != 'CLOSED') {


					// 										}


					// 									}
					// 								}

					// 								if (dbMarket.marketBook.runners[0].runnerName == market[1].nat) {
					// 									// console.log(dbMarket.marketId)
					// 									// console.log(market[1].back[0].price)
					// 									if (dbMarket.marketBook.runners[0]['availableToBack']) {

					// 										if (market[1].b1 !== "0.00") {

					// 											dbMarket.marketBook.runners[0]['availableToBack']['price'] = parseFloat((1 + market[1].b1 / 100).toFixed(2));
					// 											dbMarket.marketBook.runners[0]['availableToBack']['kprice'] = parseFloat(market[1].b1);
					// 										} else {
					// 											dbMarket.marketBook.runners[0]['availableToBack']['price'] = market[1].b1;
					// 											dbMarket.marketBook.runners[0]['availableToLay']['kprice'] = parseFloat(market[1].b1);
					// 										}

					// 										dbMarket.marketBook.runners[0]['availableToBack']['size'] = 100;

					// 										dbMarket.marketBook.runners[0].status = market[1].s;
					// 										if (dbMarket.marketBook.status != 'CLOSED') {

					// 										}

					// 									}

					// 									if (dbMarket.marketBook.runners[0]['availableToLay']) {
					// 										//console.log("3");
					// 										if (market[1].lay1 !== "0.00") {

					// 											if (parseFloat(market[1].b1) > 20) {
					// 												dbMarket.marketBook.runners[0]['availableToLay']['price'] = parseFloat(parseFloat((1 + market[1].b1 / 100).toFixed(2)) + .03).toFixed(2);
					// 												dbMarket.marketBook.runners[0]['availableToLay']['kprice'] = parseFloat(market[1].b1) + 3;
					// 											} else {
					// 												dbMarket.marketBook.runners[0]['availableToLay']['price'] = parseFloat(parseFloat((1 + market[1].b1 / 100).toFixed(2)) + .02).toFixed(2);
					// 												dbMarket.marketBook.runners[0]['availableToLay']['kprice'] = parseFloat(market[1].b1) + 2;
					// 											}
					// 										} else {
					// 											dbMarket.marketBook.runners[0]['availableToLay']['price'] = market[1].l1;
					// 										}


					// 										dbMarket.marketBook.runners[0]['availableToLay']['size'] = 100;

					// 										dbMarket.marketBook.runners[0].status = market[1].s;
					// 										if (dbMarket.marketBook.status != 'CLOSED') {


					// 										}


					// 									}
					// 								}
					// 							}


					// 						}
					// 					}

					// 					if (dbMarket.marketBook.status == 'CLOSED') {
					// 						dbMarket.marketBook.status == 'CLOSED';
					// 					} else {
					// 						dbMarket.marketBook.status == 'OPEN';
					// 					}

					// 					if (eventId == "32439480") {
					// 						// console.log(JSON.stringify(dbMarket.marketBook.runners))
					// 					}

					// 					// dbMarket.order = parseInt(order);
					// 					// dbMarket.psrorder = parseInt(order);

					// 					dbMarket.message = object[0].remark;
					// 					dbMarket.minlimit = object[0].min;
					// 					dbMarket.maxlimit = object[0].max;
					// 					// console.log("mid" + eventId + " " + marketId, dbMarket.auto)
					// 					if (dbMarket.auto == true) {
					// 						// await client.set("mid" + eventId + " " + marketId, JSON.stringify(dbMarket), 'ex', 3);

					// 						//dbMarket.visible=true;
					// 						Market.update({
					// 							marketId: marketId
					// 						}, dbMarket, function (err, raw) {
					// 							// console.log('marketId'+marketId);
					// 							if (err) logger.error(err);
					// 							// dbMarket.createdate = new Date();

					// 						});
					// 					}
					// 				} else {
					// 					// User.find({
					// 					// 	deleted: false,
					// 					// 	status: 'active',
					// 					// 	'role': 'manager',
					// 					// 	availableEventTypes: m2.eventTypeId
					// 					// }, {
					// 					// 	username: 1
					// 					// },async function(err, dbManagers) {
					// 					// 	if (err) logger.error(err);
					// 					// if (dbManagers) {
					// 					// 	for (var i = 0; i < dbManagers.length; i++) {
					// 					// 		m2.managers.unshift(dbManagers[i].username);
					// 					// 		m2.managerStatus[dbManagers[i].username] = true;
					// 					// 	}
					// 					// }
					// 					// console.log("mid" + eventId + " " + marketId)
					// 					// await client.set("mid" + eventId + " " + marketId, JSON.stringify(m2), 'ex', 3);
					// 					var Savemarket = new Market(m2);
					// 					// console.log(m2.marketBook.runners)
					// 					Savemarket.save(function (err) {
					// 						if (err) logger.debug(err);

					// 					});
					// 					// });

					// 				}


					// 			});
					// 		})(market);
					// 	}
					// }

				// } catch (e) {

				// 	Market.updateMany({
				// 		marketType: "Special"
				// 	}, {
				// 		$set: {
				// 			'marketBook.status': 'SUSPENDED',


				// 		}
				// 	});
				// }


			// });
		});
	});
}, 800);

setInterval(function () {

	Market.find({
		"marketType": "MATCH_ODDS",
		'marketBook.status': 'OPEN'
	}, {
		eventId: 1, url: 1, score: 1, _id: 1, marketName: 1
	}, function (err, dbMarket) {

		if (!dbMarket) return;

		if (dbMarket.length == 0) return;

		for (var i = 0; i < dbMarket.length; i++) {
			(function (val) {
				// console.log("list",val.url,val.score,val.eventId);
				// if(!val.url && !val.score){
				// console.log("list22222",val.url,val.score,val.eventId);
				// https://rnapi.paisaexch.com/api/get-score-tv/31875398
				request('https://rnapi.paisaexch.com/api/get-score-tv/' + val.eventId, function (error, response, body) {

					if (body != "" && body != undefined && body != null) {
						var result = JSON.parse(body);
						// console.log(val.marketName);
						// console.log(result.data);
						if (result.data != null && result.data.url != "") {
							val.url = result.data.url;
							val.score = result.data.score;

							// console.log(val.url,val.score)

							Market.updateOne({
								_id: val._id
							}, val, function (err, raw) {

							});
						}
					}
				});
				// }

			})(dbMarket[i]);
		}
	});
}, 180000);

