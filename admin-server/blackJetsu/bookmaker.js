// required modules
var phantom = require('phantom');
var mongoose = require('mongoose');
var request = require('request');
var logger = require('log4js').getLogger();
var db = require('../madara/models/db');
var index = 0;
// required models
var EventType = mongoose.model('EventType');
var Competition = mongoose.model('Competition');
var Event = mongoose.model('Event');
var Market = mongoose.model('Market');
var Bet = mongoose.model('Bet');
var User = mongoose.model('User');
var Log = mongoose.model('Log');
const https = require('https');
var express = require('express');
var app = express();
var instance;
var page;
var errorCount = 0;
logger.level = 'info';

//add fncy
setInterval(function () {

	Market.find({
		"eventTypeId": "4",
	  bookmakerSource:'Diamond',
		"marketBook.status": {
			$in: ["OPEN", "SUSPENDED"]
		},
		"visible": true,
			
		'marketType': 'MATCH_ODDS',
		
	}, function (err, dbMarket) {
		dbMarket.forEach(function (element) {
			
			
               var eventId = element.eventId;
			 
			var marketId = element.marketId;

request('http://69.12.79.42:40021/api/getBm/'+ eventId, function (error, response, body) {
			
      console.log(response.body)

				try {
					
					if(!response.body)return;
					var objjk = JSON.parse(response.body);
					var objj = objjk.data;
					//console.log(objj)
					if(objj.t2.length==0)return;
					if(objj.t2[0].bm1)
					{
                     var obj = objj.t2[0].bm1;
					}
					else
					{
                    var obj = objj.t2[0].bm2;
					}
					
                    
					 if(obj.length==0)return;
					if (obj.length==0) {

						var marketBookId = obj[0].mid;
						Market.findOne({
							marketId: marketBookId,
							
						}, function (err, dbBookMarket) {
							if (!dbBookMarket) return;
							for (var s = 0; s < dbBookMarket.marketBook.runners.length; s++) {
								dbBookMarket.marketBook.runners[s].status = 'SUSPENDED';
							}

							Market.update({
								marketId: dbBookMarket.marketId
							}, dbBookMarket, function (err, raw) {
								console.log('null value');

								if (err) logger.error(err);
							});
						});
						return;
					}
					var object = obj;
                      
					if (!object) return;


					if (object) {


						if (object.length==0) return;
						if (object.length > 0) {
							var market = object[0].mid;
							var marketRunner = object;

							var marketDb = [];
							for (var j = 0; j < marketRunner.length; j++) {
								var runn = {
									"runnerName": marketRunner[j].nat,
									"rate": marketRunner[j].b1,
									"layrate": marketRunner[j].l1,
									"status": marketRunner[j].s,
								}
								marketDb.push(runn);
							}
							

							if (!marketDb) {

								return;
							}
							var marketId = 1. + '-' + object[0].mid;
							
							var runners = [];
							for (var m = 0; m < marketDb.length; m++) {
								var selectionidAll = Math.floor(Math.random() * 1000000);
								var selection = {
									"selectionId": selectionidAll,
									"runnerName": marketDb[m].runnerName,
									"status": marketDb[m].status,
									"availableToBack": {
										"price": 0,
										"size": "100"
									},
									"availableToLay": {
										"price": 0,
										"size": "100"
									},
								};
								runners.push(selection);
							}
                            
							var m2 = {
								eventTypeId: "4",
								eventName: element.eventName,
								eventId: element.eventId,
								openDate: element.openDate,
								marketId: marketId,
								marketType: "Special",
								marketName: "Bookmaker",
								rateSource: 'Diamond',
								marketBook: {
									marketId: marketId,
									status: "OPEN",

									runners: runners,
								},
								availablebookmakerSources:['Diamond','Lotus','None'],
								runners: runners,
								managers: [],
								usersPermission: [],
								managerStatus: {},
								createdBy: new Date(),
								shared: true,
								auto: true,
								timers: 90,
								visible: true,
								deleted: false,
							}
                            

							if (!object) return;
							var market = object;

							(function (market) {
                               
								Market.findOne({
									marketId: marketId,
									marketType: "Special",
								}, function (err, dbMarket) {
                                       //console.log(dbMarket)
									if (dbMarket) {
                                       // console.log(market[0].nat)

										if (dbMarket && dbMarket.marketBook.runners) {

											for (var l = 0; l < dbMarket.marketBook.runners.length; l++) {
                                               // console.log("market"+dbMarket.marketBook.runners[1].runnerName)
												if (market.length > 2) {
													if (dbMarket.marketBook.runners[0].runnerName == market[0].nat) {
														if (dbMarket.marketBook.runners[0]['availableToBack']) {

															if (market[0].b1 !== "0.00") {

																dbMarket.marketBook.runners[0]['availableToBack']['price'] = parseFloat((1 + market[0].b1 / 100).toFixed(2));
															} else {
																dbMarket.marketBook.runners[0]['availableToBack']['price'] = market[0].b1;
															}

															dbMarket.marketBook.runners[0]['availableToBack']['size'] = 100;

															dbMarket.marketBook.runners[0].status = market[0].s;
															if (dbMarket.marketBook.status != 'CLOSED') {

															}

														}

														if (dbMarket.marketBook.runners[0]['availableToLay']) {
															//console.log("3");
															if (market[0].l1 !== "0.00") {
																if (parseInt(market[0].b1) > 20) {

																	dbMarket.marketBook.runners[0]['availableToLay']['price'] = parseFloat(parseFloat((1 + market[0].b1 / 100).toFixed(2)) + .03).toFixed(2);
																} else {
																	dbMarket.marketBook.runners[0]['availableToLay']['price'] = parseFloat(parseFloat((1 + market[0].b1 / 100).toFixed(2)) + .02).toFixed(2);
																}

																//console.log(dbMarket.marketBook.runners[0]['availableToLay']['price'])
															} else {
																dbMarket.marketBook.runners[0]['availableToLay']['price'] = market[0].l1;
															}


															dbMarket.marketBook.runners[0]['availableToLay']['size'] = 100;

															dbMarket.marketBook.runners[0].status = market[0].s;
															if (dbMarket.marketBook.status != 'CLOSED') {


															}


														}
													}

													if (dbMarket.marketBook.runners[0].runnerName == market[1].nat) {
														
														if (dbMarket.marketBook.runners[0]['availableToBack']) {

															if (market[1].b1 !== "0.00") {

																dbMarket.marketBook.runners[0]['availableToBack']['price'] = parseFloat((1 + market[1].b1 / 100).toFixed(2));
															} else {
																dbMarket.marketBook.runners[0]['availableToBack']['price'] = market[1].b1;
															}

															dbMarket.marketBook.runners[0]['availableToBack']['size'] = 100;

															dbMarket.marketBook.runners[0].status = market[1].s;
															if (dbMarket.marketBook.status != 'CLOSED') {

															}

														}

														if (dbMarket.marketBook.runners[0]['availableToLay']) {
															//console.log("3");
															if (market[1].l1 !== "0.00") {
																if (parseInt(market[1].b1) > 20) {

																	dbMarket.marketBook.runners[0]['availableToLay']['price'] = parseFloat(parseFloat((1 + market[1].b1 / 100).toFixed(2)) + .03).toFixed(2);
																} else {
																	dbMarket.marketBook.runners[0]['availableToLay']['price'] = parseFloat(parseFloat((1 + market[1].b1 / 100).toFixed(2)) + .02).toFixed(2);
																}

																//console.log(dbMarket.marketBook.runners[0]['availableToLay']['price'])
															} else {
																dbMarket.marketBook.runners[0]['availableToLay']['price'] = market[1].l1;
															}


															dbMarket.marketBook.runners[0]['availableToLay']['size'] = 100;

															dbMarket.marketBook.runners[0].status = market[1].s;
															if (dbMarket.marketBook.status != 'CLOSED') {


															}


														}
													}


													if (dbMarket.marketBook.runners[0].runnerName == market[2].nat) {
														if (dbMarket.marketBook.runners[0]['availableToBack']) {

															if (market[2].b1 !== "0.00") {

																dbMarket.marketBook.runners[0]['availableToBack']['price'] = parseFloat((1 + market[2].b1 / 100).toFixed(2));
															} else {
																dbMarket.marketBook.runners[0]['availableToBack']['price'] = market[2].b1;
															}

															dbMarket.marketBook.runners[0]['availableToBack']['size'] = 100;

															dbMarket.marketBook.runners[0].status = market[2].s;
															if (dbMarket.marketBook.status != 'CLOSED') {

															}

														}

														if (dbMarket.marketBook.runners[0]['availableToLay']) {
															//console.log("3");
															if (market[2].l1 !== "0.00") {
																if (parseInt(market[2].b1) > 20) {

																	dbMarket.marketBook.runners[0]['availableToLay']['price'] = parseFloat(parseFloat((1 + market[2].b1 / 100).toFixed(2)) + .03).toFixed(2);
																} else {
																	dbMarket.marketBook.runners[0]['availableToLay']['price'] = parseFloat(parseFloat((1 + market[2].b1 / 100).toFixed(2)) + .02).toFixed(2);
																}

																//console.log(dbMarket.marketBook.runners[0]['availableToLay']['price'])
															} else {
																dbMarket.marketBook.runners[0]['availableToLay']['price'] = market[2].l1;
															}


															dbMarket.marketBook.runners[0]['availableToLay']['size'] = 100;

															dbMarket.marketBook.runners[0].status = market[2].s;
															if (dbMarket.marketBook.status != 'CLOSED') {


															}


														}
													}

                                                     
													if (dbMarket.marketBook.runners[1].runnerName == market[0].nat) {

														if (dbMarket.marketBook.runners[1]['availableToBack']) {

															if (market[0].b1 !== "0.00") {

																dbMarket.marketBook.runners[1]['availableToBack']['price'] = parseFloat((1 + market[0].b1 / 100).toFixed(2));
															} else {
																dbMarket.marketBook.runners[1]['availableToBack']['price'] = market[0].b1;
															}

															dbMarket.marketBook.runners[1]['availableToBack']['size'] = 100;

															dbMarket.marketBook.runners[1].status = market[0].s;
															if (dbMarket.marketBook.status != 'CLOSED') {

															}

														}

														if (dbMarket.marketBook.runners[1]['availableToLay']) {
															//console.log("3");
															if (market[0].l1 !== "0.00") {
																if (parseInt(market[0].b1) > 20) {

																	dbMarket.marketBook.runners[1]['availableToLay']['price'] = parseFloat(parseFloat((1 + market[0].b1 / 100).toFixed(2)) + .03).toFixed(2);
																} else {
																	dbMarket.marketBook.runners[1]['availableToLay']['price'] = parseFloat(parseFloat((1 + market[0].b1 / 100).toFixed(2)) + .02).toFixed(2);
																}

																//console.log(dbMarket.marketBook.runners[0]['availableToLay']['price'])
															} else {
																dbMarket.marketBook.runners[1]['availableToLay']['price'] = market[0].l1;
															}


															dbMarket.marketBook.runners[1]['availableToLay']['size'] = 100;

															dbMarket.marketBook.runners[1].status = market[0].s;
															if (dbMarket.marketBook.status != 'CLOSED') {


															}


														}
													}

													if (dbMarket.marketBook.runners[1].runnerName == market[1].nat) {
														if (dbMarket.marketBook.runners[1]['availableToBack']) {

															if (market[1].b1 !== "0.00") {

																dbMarket.marketBook.runners[1]['availableToBack']['price'] = parseFloat((1 + market[1].b1 / 100).toFixed(2));
															} else {
																dbMarket.marketBook.runners[1]['availableToBack']['price'] = market[1].b1;
															}

															dbMarket.marketBook.runners[1]['availableToBack']['size'] = 100;

															dbMarket.marketBook.runners[1].status = market[1].s;
															if (dbMarket.marketBook.status != 'CLOSED') {

															}

														}

														if (dbMarket.marketBook.runners[1]['availableToLay']) {
															//console.log("3");
															if (market[1].l1 !== "0.00") {
																if (parseInt(market[1].b1) > 20) {

																	dbMarket.marketBook.runners[1]['availableToLay']['price'] = parseFloat(parseFloat((1 + market[1].b1 / 100).toFixed(2)) + .03).toFixed(2);
																} else {
																	dbMarket.marketBook.runners[1]['availableToLay']['price'] = parseFloat(parseFloat((1 + market[1].b1 / 100).toFixed(2)) + .02).toFixed(2);
																}

																//console.log(dbMarket.marketBook.runners[0]['availableToLay']['price'])
															} else {
																dbMarket.marketBook.runners[1]['availableToLay']['price'] = market[1].l1;
															}


															dbMarket.marketBook.runners[1]['availableToLay']['size'] = 100;

															dbMarket.marketBook.runners[1].status = market[1].s;
															if (dbMarket.marketBook.status != 'CLOSED') {


															}


														}
													}


													if (dbMarket.marketBook.runners[1].runnerName == market[2].nat) {
														if (dbMarket.marketBook.runners[1]['availableToBack']) {

															if (market[2].b1 !== "0.00") {

																dbMarket.marketBook.runners[1]['availableToBack']['price'] = parseFloat((1 + market[2].b1 / 100).toFixed(2));
															} else {
																dbMarket.marketBook.runners[1]['availableToBack']['price'] = market[2].b1;
															}

															dbMarket.marketBook.runners[1]['availableToBack']['size'] = 100;

															dbMarket.marketBook.runners[1].status = market[2].s;
															if (dbMarket.marketBook.status != 'CLOSED') {

															}

														}

														if (dbMarket.marketBook.runners[1]['availableToLay']) {
															//console.log("3");
															if (market[2].l1 !== "0.00") {
																if (parseInt(market[2].b1) > 20) {

																	dbMarket.marketBook.runners[1]['availableToLay']['price'] = parseFloat(parseFloat((1 + market[1].b1 / 100).toFixed(2)) + .03).toFixed(2);
																	dbMarket.marketBook.runners[1]['availableToLay']['price'] = parseFloat(parseFloat((1 + market[2].b1 / 100).toFixed(2)) + .02).toFixed(2);
																}

																//console.log(dbMarket.marketBook.runners[0]['availableToLay']['price'])
															} else {
																dbMarket.marketBook.runners[1]['availableToLay']['price'] = market[2].l1;
															}


															dbMarket.marketBook.runners[1]['availableToLay']['size'] = 100;

															dbMarket.marketBook.runners[1].status = market[2].s;
															if (dbMarket.marketBook.status != 'CLOSED') {


															}


														}
													}

													if (dbMarket.marketBook.runners[2].runnerName == market[0].nat) {
														if (dbMarket.marketBook.runners[2]['availableToBack']) {

															if (market[0].b1 !== "0.00") {

																dbMarket.marketBook.runners[2]['availableToBack']['price'] = parseFloat((1 + market[0].b1 / 100).toFixed(2));
															} else {
																dbMarket.marketBook.runners[2]['availableToBack']['price'] = market[0].b1;
															}

															dbMarket.marketBook.runners[2]['availableToBack']['size'] = 100;

															dbMarket.marketBook.runners[2].status = market[0].s;
															if (dbMarket.marketBook.status != 'CLOSED') {

															}

														}

														if (dbMarket.marketBook.runners[2]['availableToLay']) {
															//console.log("3");
															if (market[0].l1 !== "0.00") {
																if (parseInt(market[0].b1) > 20) {

																	dbMarket.marketBook.runners[2]['availableToLay']['price'] = parseFloat(parseFloat((1 + market[0].b1 / 100).toFixed(2)) + .03).toFixed(2);
																} else {
																	dbMarket.marketBook.runners[2]['availableToLay']['price'] = parseFloat(parseFloat((1 + market[0].b1 / 100).toFixed(2)) + .02).toFixed(2);
																}

																//console.log(dbMarket.marketBook.runners[0]['availableToLay']['price'])
															} else {
																dbMarket.marketBook.runners[2]['availableToLay']['price'] = market[0].l1;
															}


															dbMarket.marketBook.runners[2]['availableToLay']['size'] = 100;

															dbMarket.marketBook.runners[2].status = market[0].s;
															if (dbMarket.marketBook.status != 'CLOSED') {


															}


														}
													}

													if (dbMarket.marketBook.runners[2].runnerName == market[1].nat) {
														if (dbMarket.marketBook.runners[2]['availableToBack']) {

															if (market[1].b1 !== "0.00") {

																dbMarket.marketBook.runners[2]['availableToBack']['price'] = parseFloat((1 + market[1].b1 / 100).toFixed(2));
															} else {
																dbMarket.marketBook.runners[2]['availableToBack']['price'] = market[1].b1;
															}

															dbMarket.marketBook.runners[2]['availableToBack']['size'] = 100;

															dbMarket.marketBook.runners[2].status = market[1].s;
															if (dbMarket.marketBook.status != 'CLOSED') {

															}

														}

														if (dbMarket.marketBook.runners[2]['availableToLay']) {
															//console.log("3");
															if (market[1].l1 !== "0.00") {
																if (parseInt(market[1].b1) > 20) {

																	dbMarket.marketBook.runners[2]['availableToLay']['price'] = parseFloat(parseFloat((1 + market[1].b1 / 100).toFixed(2)) + .03).toFixed(2);
																} else {
																	dbMarket.marketBook.runners[2]['availableToLay']['price'] = parseFloat(parseFloat((1 + market[1].b1 / 100).toFixed(2)) + .02).toFixed(2);
																}

																//console.log(dbMarket.marketBook.runners[0]['availableToLay']['price'])
															} else {
																dbMarket.marketBook.runners[2]['availableToLay']['price'] = market[1].l1;
															}


															dbMarket.marketBook.runners[2]['availableToLay']['size'] = 100;

															dbMarket.marketBook.runners[2].status = market[1].s;
															if (dbMarket.marketBook.status != 'CLOSED') {


															}


														}
													}


													if (dbMarket.marketBook.runners[2].runnerName == market[2].nat) {
														if (dbMarket.marketBook.runners[2]['availableToBack']) {

															if (market[2].b1 !== "0.00") {

																dbMarket.marketBook.runners[2]['availableToBack']['price'] = parseFloat((1 + market[2].b1 / 100).toFixed(2));
															} else {
																dbMarket.marketBook.runners[2]['availableToBack']['price'] = market[2].b1;
															}

															dbMarket.marketBook.runners[2]['availableToBack']['size'] = 100;

															dbMarket.marketBook.runners[2].status = market[2].s;
															if (dbMarket.marketBook.status != 'CLOSED') {

															}

														}

														if (dbMarket.marketBook.runners[2]['availableToLay']) {
															//console.log("3");
															if (market[2].l1 !== "0.00") {
																if (parseInt(market[2].b1) > 20) {

																	dbMarket.marketBook.runners[2]['availableToLay']['price'] = parseFloat(parseFloat((1 + market[2].b1 / 100).toFixed(2)) + .03).toFixed(2);
																} else {
																	dbMarket.marketBook.runners[2]['availableToLay']['price'] = parseFloat(parseFloat((1 + market[2].b1 / 100).toFixed(2)) + .02).toFixed(2);
																}

																//console.log(dbMarket.marketBook.runners[0]['availableToLay']['price'])
															} else {
																dbMarket.marketBook.runners[2]['availableToLay']['price'] = market[2].l1;
															}


															dbMarket.marketBook.runners[2]['availableToLay']['size'] = 100;

															dbMarket.marketBook.runners[2].status = market[2].s;
															if (dbMarket.marketBook.status != 'CLOSED') {


															}


														}
													}


												} else {
													if (dbMarket.marketBook.runners[0].runnerName == market[0].nat) {
														if (dbMarket.marketBook.runners[0]['availableToBack']) {

															if (market[0].b1 !== "0.00") {

																dbMarket.marketBook.runners[0]['availableToBack']['price'] = parseFloat((1 + market[0].b1 / 100).toFixed(2));
															} else {
																dbMarket.marketBook.runners[0]['availableToBack']['price'] = market[0].b1;
															}

															dbMarket.marketBook.runners[0]['availableToBack']['size'] = 100;

															dbMarket.marketBook.runners[0].status = market[0].s;
															if (dbMarket.marketBook.status != 'CLOSED') {

															}

														}

														if (dbMarket.marketBook.runners[0]['availableToLay']) {
															//console.log("3");
															if (market[0].l1 !== "0.00") {
																if (parseInt(market[0].b1) > 20) {

																	dbMarket.marketBook.runners[0]['availableToLay']['price'] = parseFloat(parseFloat((1 + market[0].b1 / 100).toFixed(2)) + .03).toFixed(2);
																} else {
																	dbMarket.marketBook.runners[0]['availableToLay']['price'] = parseFloat(parseFloat((1 + market[0].b1 / 100).toFixed(2)) + .02).toFixed(2);
																}

																//console.log(dbMarket.marketBook.runners[0]['availableToLay']['price'])
															} else {
																dbMarket.marketBook.runners[0]['availableToLay']['price'] = market[0].l1;
															}


															dbMarket.marketBook.runners[0]['availableToLay']['size'] = 100;

															dbMarket.marketBook.runners[0].status = market[0].s;
															if (dbMarket.marketBook.status != 'CLOSED') {


															}


														}
													}

													if (dbMarket.marketBook.runners[1].runnerName == market[0].nat) {

														if (dbMarket.marketBook.runners[1]['availableToBack']) {

															if (market[0].b1 !== "0.00") {

																dbMarket.marketBook.runners[1]['availableToBack']['price'] = parseFloat((1 + market[0].b1 / 100).toFixed(2));
															} else {
																dbMarket.marketBook.runners[1]['availableToBack']['price'] = market[0].b1;
															}

															dbMarket.marketBook.runners[1]['availableToBack']['size'] = 100;

															dbMarket.marketBook.runners[1].status = market[0].s;
															if (dbMarket.marketBook.status != 'CLOSED') {

															}

														}

														if (dbMarket.marketBook.runners[1]['availableToLay']) {
															//console.log("3");
															if (market[0].l1 !== "0.00") {

																if (parseInt(market[0].b1) > 20) {
																	dbMarket.marketBook.runners[1]['availableToLay']['price'] = parseFloat(parseFloat((1 + market[0].b1 / 100).toFixed(2)) + .03).toFixed(2);
																} else {
																	dbMarket.marketBook.runners[1]['availableToLay']['price'] = parseFloat(parseFloat((1 + market[0].b1 / 100).toFixed(2)) + .02).toFixed(2);
																}
															} else {
																dbMarket.marketBook.runners[1]['availableToLay']['price'] = market[0].l1;
															}


															dbMarket.marketBook.runners[1]['availableToLay']['size'] = 100;

															dbMarket.marketBook.runners[1].status = market[0].s;
															if (dbMarket.marketBook.status != 'CLOSED') {


															}


														}

													}

													if (dbMarket.marketBook.runners[1].runnerName == market[1].nat) {
														if (dbMarket.marketBook.runners[1]['availableToBack']) {

															if (market[1].b1 !== "0.00") {

																dbMarket.marketBook.runners[1]['availableToBack']['price'] = parseFloat((1 + market[1].b1 / 100).toFixed(2));
															} else {
																dbMarket.marketBook.runners[1]['availableToBack']['price'] = market[1].b1;
															}

															dbMarket.marketBook.runners[1]['availableToBack']['size'] = 100;

															dbMarket.marketBook.runners[1].status = market[1].s;
															if (dbMarket.marketBook.status != 'CLOSED') {

															}

														}

														if (dbMarket.marketBook.runners[1]['availableToLay']) {
															//console.log("3");
															if (market[1].l1 !== "0.00") {

																if (parseInt(market[1].b1) > 20) {
																	dbMarket.marketBook.runners[1]['availableToLay']['price'] = parseFloat(parseFloat((1 + market[1].b1 / 100).toFixed(2)) + .03).toFixed(2);
																} else {
																	dbMarket.marketBook.runners[1]['availableToLay']['price'] = parseFloat(parseFloat((1 + market[1].b1 / 100).toFixed(2)) + .02).toFixed(2);
																}
															} else {
																dbMarket.marketBook.runners[1]['availableToLay']['price'] = market[1].l1;
															}


															dbMarket.marketBook.runners[1]['availableToLay']['size'] = 100;

															dbMarket.marketBook.runners[1].status = market[1].s;
															if (dbMarket.marketBook.status != 'CLOSED') {


															}


														}
													}

													if (dbMarket.marketBook.runners[0].runnerName == market[1].nat) {
														// console.log(dbMarket.marketId)
														// console.log(market[1].back[0].price)
														if (dbMarket.marketBook.runners[0]['availableToBack']) {

															if (market[1].b1 !== "0.00") {

																dbMarket.marketBook.runners[0]['availableToBack']['price'] = parseFloat((1 + market[1].b1 / 100).toFixed(2));
															} else {
																dbMarket.marketBook.runners[0]['availableToBack']['price'] = market[1].b1;
															}

															dbMarket.marketBook.runners[0]['availableToBack']['size'] = 100;

															dbMarket.marketBook.runners[0].status = market[1].s;
															if (dbMarket.marketBook.status != 'CLOSED') {

															}

														}

														if (dbMarket.marketBook.runners[0]['availableToLay']) {
															//console.log("3");
															if (market[1].lay1 !== "0.00") {

																if (parseInt(market[1].b1) > 20) {
																	dbMarket.marketBook.runners[0]['availableToLay']['price'] = parseFloat(parseFloat((1 + market[1].b1 / 100).toFixed(2)) + .03).toFixed(2);
																} else {
																	dbMarket.marketBook.runners[0]['availableToLay']['price'] = parseFloat(parseFloat((1 + market[1].b1 / 100).toFixed(2)) + .02).toFixed(2);
																}
															} else {
																dbMarket.marketBook.runners[0]['availableToLay']['price'] = market[1].l1;
															}


															dbMarket.marketBook.runners[0]['availableToLay']['size'] = 100;

															dbMarket.marketBook.runners[0].status = market[1].s;
															if (dbMarket.marketBook.status != 'CLOSED') {


															}


														}
													}
												}


											}
										}
										if (dbMarket.marketBook.status == 'CLOSED') {
											dbMarket.marketBook.status == 'CLOSED';
										}


										if (dbMarket.auto) {
											Market.update({
												marketId: marketId
											}, dbMarket, function (err, raw) {
												console.log(raw);

												if (err) logger.error(err);
											});
										}


									} else {


										User.find({
											deleted: false,
											status: 'active',
											availableEventTypes: m2.eventTypeId
										}, {
											username: 1
										}, function (err, dbManagers) {
											if (err) logger.error(err);
											if (dbManagers) {
												for (var i = 0; i < dbManagers.length; i++) {
													m2.managers.unshift(dbManagers[i].username);
													m2.managerStatus[dbManagers[i].username] = true;
												}

											}
											 console.log(m2);
											var market = new Market(m2);

											market.save(function (err) {
												//if (err) logger.debug(err);
											});
										});

									}


								});
							})(market);
						}
						//check second array


					}


				} catch (e) {
					console.log(e)
					Market.updateMany({
						marketType: "Special"
					}, {
						$set: {
							'marketBook.status': 'SUSPENDED',


						}
					});
				}


			});
		});
	});
}, 2000);