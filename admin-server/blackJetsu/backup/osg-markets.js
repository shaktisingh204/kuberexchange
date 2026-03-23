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
var EventType             = mongoose.model('EventType');  
var Competition           = mongoose.model('Competition');
var Event                 = mongoose.model('Event');
var Market                = mongoose.model('Market');
var User                  = mongoose.model('User');

var token="";

console.log("Osg markets");

setInterval(function () {
  var request = require('request');
  var options = {
    'method': 'GET',
    'url': 'https://rnapi.paisaexch.com/api/getMatchOddsMarket',
    'headers': {
    }
  };
  request(options,async function (error, response) {
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
           
          }, async function(err, data) {

            if(!data)
            {
				newevent.rateSource = "OSGExchange";
              var DataSave = new Market(newevent);

             await DataSave.save(async function (err) {
                //   console.log(err);
                  if (err) logger.debug(err);
				  newevent.createdate = new Date();
				//   await client.set("mid" + newevent.eventId + " " + newevent.marketId, JSON.stringify(newevent), 'ex', 8);
                  console.log("Saved",newevent.eventId,newevent.marketId)
                });
            }else{
            //   console.log("already added")  
            }
            
            });

            i++;
    }
  });
}, 3600);

setInterval(function() {

	Market.find({
		"eventTypeId": "4",

		"marketBook.status": {
			$in: ["OPEN", "SUSPENDED", "INACTIVE"]
		},
		"visible": true,
		
		'marketType': 'MATCH_ODDS',

		marketType: {
			$ne: "SESSION"
		},
	}, function(err, dbMarket) {
		dbMarket.forEach(function(element) {
			var eventId = element.eventId;
			var marketId = element.marketId;
			// request('http://172.105.55.40/getbm?eventId=' + eventId, function(error, response, body) {
				request('http://20.219.2.60/getbm?eventId=' + eventId, function (error, response, body) {

				// if(element.eventId == "32303550"){
				// 	console.log("32303550",response.body); 
				//   }
				try {
					if (!response) return;
					if (!response.body) {
						Market.find({
							eventId: eventId,
							marketType: "Special",
							'marketBook.status': 'OPEN',

						}, function(err, dbMarketS) {

							if (dbMarketS.length == 0) return;
							dbMarketS.forEach((val, index) => {
								val.marketBook.status = 'SUSPENDED';
								Market.update({
									marketId: val.marketId
								}, val, function(err, raw) {});
							})


						});
					}
					if (!response.body) return;


					if (!response.body) {
						Market.findOne({
							rateSource: 'LotusBook',
							eventId: eventId,
							marketType: "Special",

						}, function(err, dbMarketS) {

							if (!dbMarketS) return;
							dbMarketS.marketBook.runners.forEach((val, index) => {
								//dbMarketS.marketBook.runners[index].status='SUSPENDED';
							})

							Market.update({
								marketId: dbMarketS.marketId
							}, dbMarketS, function(err, raw) {});
						});
					}

					if (!response.body) return;
					if (response.body == '') return;
					var objj = JSON.parse(response.body);
					if (!objj) return;
					if (!objj.data) return;
					objj.data.forEach((val) => {
						
						if (val.mname == 'Bookmaker' || val.mname == 'Bookmaker 2') {
							// console.log((val));
							var order = 0;
							if(val.mname == 'Bookmaker 2'){
								order = 1;
							}
							var marketRunner = val.section;
						
							var marketDb = [];
							for (var j = 0; j < marketRunner.length; j++) {
								var runn = {
									"selectionId": marketRunner[j].sid,
									"runnerName": marketRunner[j].nat,
									"rate": 0,
									"layrate": 0,
									"status": marketRunner[j].gstatus,
								}
								marketDb.push(runn);
							}


							if (!marketDb) {

								return;
							}
							var marketId = val.mid;

							var runners = [];
							for (var m = 0; m < marketDb.length; m++) {
								var selectionidAll = Math.floor(Math.random() * 1000000);
								var selection = {
									"selectionId": marketDb[m].selectionId,
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
								marketName: val.mname,
								rateSource: 'LotusBook',
								order:parseInt(order),
                  				psrorder:parseInt(order),
								marketBook: {
									marketId: marketId,
									status: "OPEN",

									runners: runners,
								},
								runners: runners,
								managers: [],
								usersPermission: [],
								managerStatus: {},
								createdBy: '',
								shared: true,
								auto: true,
								timers: 90,
								visible: true,
								deleted: false,
								message:val.rem,
								minlimit:val.min,
								maxlimit:val.max,  
							}
							var market = val.section;
							(function(val,market) {

								Market.findOne({
									marketId: marketId,
									marketType: "Special",
								},async function(err, dbMarket) {
									// console.log(dbMarket)

									if (dbMarket) {
										dbMarket.marketBook.status = 'OPEN';
                    					dbMarket.createdBy=val.rem;
                    					// console.log(val.rem)
										if (dbMarket && dbMarket.marketBook.runners) {
											for (var k = 0; k < market.length; k++) {
												//console.log(market[k]);
												for (var l = 0; l < dbMarket.marketBook.runners.length; l++) {
													//console.log("1");
													// console.log(market[k].selectionId);
													// console.log(JSON.stringify(market));
													if (market[k].odds) {
                                          
														if (market[k].sid == dbMarket.marketBook.runners[l].selectionId) {
															// console.log(market[k])
															// if(parseInt(market[k].odds[1].odds)!=0)
															// {

																for(m=0;m<market[k].odds.length;m++)
																{
																	if(market[k].odds[m].oname=='back1')
																	{
                                    
																		dbMarket.marketBook.runners[l]['availableToBack']['kprice'] = market[k].odds[m].odds;
																		if(market[k].odds[m].odds>10)
																		{
                                    	dbMarket.marketBook.runners[l]['availableToBack']['price'] = ( 1+market[k].odds[m].odds / 100).toFixed(2);

																		}
																		else
																		{
                                     	dbMarket.marketBook.runners[l]['availableToBack']['price'] = ( 1+market[k].odds[m].odds*10/1000);
                                     	
																		}
																	
																		dbMarket.marketBook.runners[l]['availableToBack']['size'] = market[k].odds[m].size;
																	}

																	if(market[k].odds[m].oname=='lay1')
																	{
																		dbMarket.marketBook.runners[l]['availableToLay']['kprice'] = market[k].odds[m].odds;

																		if(market[k].odds[m].odds>10)
																		{
                                    		dbMarket.marketBook.runners[l]['availableToLay']['price'] = ( 1+market[k].odds[m].odds / 100).toFixed(2);

																		}
																		else
																		{
                                 	dbMarket.marketBook.runners[l]['availableToLay']['price'] = ( 1+market[k].odds[m].odds*10 / 1000);
                                     	
																		}
																	
																		dbMarket.marketBook.runners[l]['availableToLay']['size'] = market[k].odds[m].size;
																	}
																}
														

																// }
																/* else
																{
																	dbMarket.marketBook.runners[l]['availableToLay']['kprice'] = market[k].odds[0].odds;
																	dbMarket.marketBook.runners[l]['availableToLay']['price'] = ( market[k].odds[0].odds).toFixed(2);
																	dbMarket.marketBook.runners[l]['availableToLay']['size'] = market[k].odds[0].size;

																	dbMarket.marketBook.runners[l]['availableToBack']['kprice'] = market[k].odds[1].odds;
																	dbMarket.marketBook.runners[l]['availableToBack']['price'] = ( market[k].odds[1].odds).toFixed(2);
																	dbMarket.marketBook.runners[l]['availableToBack']['size'] = market[k].odds[1].size;
																}*/
							
																dbMarket.marketBook.runners[l]['status'] = market[k].gstatus;
														}
														else
														{
                                     
														}
													} 

												}
											}

										}

										if (dbMarket.marketBook.status == 'CLOSED') {
											dbMarket.marketBook.status == 'CLOSED';
										} else {
											dbMarket.marketBook.status == 'OPEN';
										}
										//console.log(JSON.stringify(dbMarket))
										// dbMarket.order = parseInt(order);
										// dbMarket.psrorder = parseInt(order);

										dbMarket.message = val.rem;
										dbMarket.minlimit = val.min;
										dbMarket.maxlimit = val.max;
									
										// await client.set("mid" + eventId + " " + marketId, JSON.stringify(dbMarket), 'ex', 3);
										//dbMarket.visible=true;
										Market.update({
											marketId: marketId
										}, dbMarket, function(err, raw) {
											//console.log('marketId'+marketId);
											if (err) logger.error(err);
											// dbMarket.createdate = new Date();
				  							
										});
									} else {
										User.find({
											deleted: false,
											status: 'active',
											'role': 'manager',
											availableEventTypes: m2.eventTypeId
										}, {
											username: 1
										},async function(err, dbManagers) {
											if (err) logger.error(err);
											if (dbManagers) {
												for (var i = 0; i < dbManagers.length; i++) {
													m2.managers.unshift(dbManagers[i].username);
													m2.managerStatus[dbManagers[i].username] = true;
												}
											}
											// console.log(m2);
											// await client.set("mid" + eventId + " " + marketId, JSON.stringify(m2), 'ex', 3);
											var market = new Market(m2);
											//  console.log(m2.marketBook.runners)
											market.save(function(err) {
												if (err) logger.debug(err);
												
											});
										});

									}


								});
							})(val,market);
						}

					});
				} catch (e) {

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
}, 1000);

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


// setInterval(function () {

//   Market.find({
//     "eventTypeId": "4",
//     "marketBook.status": {
//       $in: ["OPEN", "SUSPENDED","INACTIVE"]
//     },
//     "visible": true,
//     'marketType': 'MATCH_ODDS',
//   },async function (err, dbMarket) {
  
//    await dbMarket.forEach(function (element) {
//       var eventId = element.eventId;
//       // console.log("eventId",eventId);
//       var request = require('request');
//       var options = {
//         'method': 'GET',
//         'url': 'https://rnapi.paisaexch.com/api/getfancyBookmaker/' + eventId,
//         'headers': {
//         }
//       };
//       request(options,async function (error, response) {
//         if (error) throw new Error(error);
//         // console.log(response.body);
//         var result = JSON.parse(response.body);
//           // console.log(result,result.data);
//         // var result = JSON.parse(response.body);
//         if(result.data){
//           // console.log(result.data.length);
//           let i = 0;
//           while (i < result.data.length) {
//             var newevent = result.data[i];
//             // console.log(newevent.marketId);
//             newevent.managers = [
//               "TESTMANAGER",
//               "A70"
//             ];
//             newevent.managerStatus = {
//               "TESTMANAGER": true,
//               "A70":true
//             };
//                 await Market.findOne({
//                   'marketId': newevent.marketId,
//                 }, async function(err, data) {
      
//                   if(!data)
//                   {
//                     var DataSave = new Market(newevent);
//                     await DataSave.save(function (err) {
//                         // console.log(err);
//                         if (err) logger.debug(err);
      
//                         // console.log("Saved",newevent.marketId)
//                       });
//                   }else{
//                     // console.log(data.marketBook.status);
//                     // if(data.marketBook.status == "CLOSED"){ i++; return; }
//                     Market.update({
//                       marketId: newevent.marketId
//                     }, newevent, function (err, raw) {
//                       if (err) logger.error(err);
//                       // console.log("update fancy");
//                     });
//                   }
                  
//                 });
      
//               i++;
//           }
//         }
//       });
//     });
//   });
//   }, 1000);
  
  


// setInterval(function () {
//   var request = require('request');
//   var options = {
//     'method': 'GET',
//     'url': 'https://rnapi.paisaexch.com/api/getEvents',
//     'headers': {
//     }
//   };
//   request(options,async function (error, response) {
//     if (error) throw new Error(error);
//     // console.log(response.body);
//     var result = JSON.parse(response.body);
//     // console.log(result.data.length);
//     let i = 0;
//     while (i < result.data.length) {
//       var newevent = result.data[i];
//       // console.log(newevent.event.id);

//           await Event.findOne({
//             'event.id': newevent.event.id,
           
//           }, async function(err, data) {

//             if(!data)
//             {
//               newevent.managers = [
//                 "TESTMANAGER"
//               ];
//               newevent.managerStatus = {
//                 "TESTMANAGER": true
//               };
//               var DataSave = new Event(newevent);

//              await DataSave.save(function (err) {
//                   console.log(err);
//                   if (err) logger.debug(err);

//                   // console.log("Saved",newevent.event.id)
//                 });
//             }else{
//               // console.log("already added")
//             }
            
//             });

//             i++;
//     }
//   });
// }, 360000);



///////////------tV or Score update------////////////

//tennis match
// setInterval(function () {
  
//        request('http://172.105.37.170/api/v1/getMatches?sport_id=1&token=Ix7zyHbZXclURvUaGYhWYTFOgAqzzmiF52HAHz2y', function (error, response, body) {

//          var response1 = JSON.parse(response.body);
//         if(!response1.data)return;
//         if(response1.data.length==0)return;
  
//         for(var i=0;i<response1.data.length;i++)
//         {
//           (function(val)
//           {
//           if(val.marketType=='MATCH_ODDS')
//           {


//          var e2=   {
//   "event": {
//     "id": val.eventId,
//     "name": val.eventName,
//     "countryCode": "GB",
//     "timezone": "GMT",
//     "openDate": new Date(val.eventDate)
//   },
//   "__v": 0,
//   "availableSources": [
//     "esport"
//   ],
//   "marketTypes": [],
//   "showScore": true,
//   "deleted": false,
//   "visible": true,
//   "competitionName": val.SeriesName,
//   "countryCode": "GB",
//   "competitionId": val.SeriesId,
//   "eventTypeName": val.EventTypeName,
//   "eventTypeId": val.EventTypeId,
//   "marketCount": 4,
//   "managerFeesProfit": {}
// }


// var m2={
//   "marketId": val.marketId,
//   "__v": 0,
//   "auto": true,
//   "visible": true,
//   "availableSources": [
//     "BetFair",
//     "OSGExchange",
//     "BetVendor",
//     "None"
//   ],
//   "bookmakerSource": "Lotus",
//   "competitionId": val.SeriesId,
//   "competitionName":  val.SeriesName,
//   "createdBy": "Auto By Api",
//   "deleted": false,
//   "eventId": val.eventId,
//   "eventName": val.eventName,
//   "eventTypeId": val.EventTypeId,
//   "eventTypeName": val.EventTypeName,
//   "marketBook": {
//     "marketId": val.marketId,
//     "isMarketDataDelayed": true,
//     "status": "OPEN",
//     "betDelay": 0,
//     "bspReconciled": false,
//     "complete": true,
//     "inplay": false,
//     "numberOfWinners": 1,
//     "numberOfRunners": 2,
//     "numberOfActiveRunners": 2,
//     "totalMatched": 0,
//     "totalAvailable": 908927.27,
//     "crossMatching": true,
//     "runnersVoidable": false,
//     "version": 4736463864,
   
//   },
//   "marketName":val.marketName,
//   "marketType": val.marketType,
//   "masterStatus": {},
//   "masters": [],
//   "maxlimit": 1000000,
//   "minlimit": 100,
//   "openDate": new Date(val.eventDate),
//   "rateSource": "OSGExchange",
 
//   "shared": false,
//   "ssnrateSource": "FancyBook",
//   "subadminStatus": {},
//   "subadmins": [],
//   "totalMatched": 0,
  
//   "visibleStatus": true,
//   "availablebookmakerSources": [
//     "Diamond",
//     "Lotus",
//     "None"
//   ],
//   "availablessnSources": [
//     "DreamBook",
//     "FancyBook",
//     "None"
//   ],
//   "ledger": true,
//   'managerStatus':{},
//    "managers": [],
//   "managerBlocks": [],
//   "masterBlocks": [],
//   "runnersResult": [],
//   "subadminBlocks": [],
//   "usersPermission": [],
//   "betStatus": false,
//   "managerProfit": {
    
//   }
// }
//   var  runners=[];
//   var marketrunner= [];
//     var response1l = JSON.parse(val.market_runner_json);
//   for(var j=0;j<response1l.length;j++)
//   {

//     var es=  {
//       "selectionId": response1l[j].selectionId,
//       "runnerName": response1l[j].name,
//        "status": "ACTIVE",
//       "handicap": 0,
//       "sortPriority": 1,
//       "logo": "sri-lanka.svg",
//       "availableToBack": {
//           "price": 0,
//           "size": 0
//         },
//         "availableToLay": {
//           "price": 0,
//           "size": 0
//         }
//     }
//   runners.push(es);

// var ms={
//         "status": "ACTIVE",
//         "sortPriority": 1,
//         "runnerName": response1l[j].name,
//         "selectionId": response1l[j].selectionId
//       }

//       marketrunner.push(ms);

//   }
//       if(runners.length==0)return;

//       m2.runners=marketrunner;
//       m2.marketBook.runners=runners;
      
//          var e3 = new Event(e2);
          
//           Event.findOne({
//             'event.id': val.eventId,
           
//           }, function(err, event) {

//             if(!event)
//             {
//                          e3.save(function (err) {
//                                     //console.log(err);
//                                     if (err) logger.debug(err);
//                                  });
//             }

//             });


//                       User.find({
//                            deleted: false,
//                            status: 'active',
//                            'role':'manager',
                          
//                         }, {
//                            username: 1
//                         }, function (err, dbManagers) {
//                            if (err) logger.error(err);
//                            if (dbManagers) {
//                               for (var i = 0; i < dbManagers.length; i++) {
//                                  m2.managers.unshift(dbManagers[i].username);
//                                  m2.managerStatus[dbManagers[i].username] = true;
//                               }
//                            }
//               var m3 = new Market(m2);
//                           Market.findOne({
//             'marketId': val.marketId,
           
//           }, function(err, market) {
//             if(market)
//             {
               
            
//             }
//            if(!market)
//             {
                    
//                          m3.save(function (err) {
//                                     //console.log(err);
//                                     if (err) logger.debug(err);
//                                  });
//             }
//             else
//             {
              
//             }
//           });


//                          });
//                     }

//           })(response1.data[i])
//         }
       
// });

//  }, 21100000);


// //crciket match
// setInterval(function () {
//        request('http://172.105.37.170/api/v1/getMatches?sport_id=2&token=Ix7zyHbZXclURvUaGYhWYTFOgAqzzmiF52HAHz2y', function (error, response, body) {

//          var response1 = JSON.parse(response.body);
//         if(!response1.data)return;
//         if(response1.data.length==0)return;
      
//         for(var i=0;i<response1.data.length;i++)
//         {
//           (function(val)
//           {
//           if(val.marketType=='MATCH_ODDS')
//           {


//          var e2=   {
//   "event": {
//     "id": val.eventId,
//     "name": val.eventName,
//     "countryCode": "GB",
//     "timezone": "GMT",
//     "openDate": new Date(val.eventDate)
//   },
//   "__v": 0,
//   "availableSources": [
//     "esport"
//   ],
//   "marketTypes": [],
//   "showScore": true,
//   "deleted": false,
//   "visible": true,
//   "competitionName": val.SeriesName,
//   "countryCode": "GB",
//   "competitionId": val.SeriesId,
//   "eventTypeName": val.EventTypeName,
//   "eventTypeId": val.EventTypeId,
//   "marketCount": 4,
//   "managerFeesProfit": {}
// }


// var m2={
//   "marketId": val.marketId,
//   "__v": 0,
//   "auto": true,
//   "availableSources": [
//     "BetFair",
//     "OSGExchange",
//     "BetVendor",
//     "None"
//   ],
//   "bookmakerSource": "Lotus",
//   "competitionId": val.SeriesId,
//   "competitionName":  val.SeriesName,
//   "createdBy": "Auto By Api",
//   "deleted": false,
//   "eventId": val.eventId,
//   "eventName": val.eventName,
//   eventTypeId: val.EventTypeId,
//   "eventTypeName": val.EventTypeName,
//   "marketBook": {
//     "marketId": val.marketId,
//     "isMarketDataDelayed": true,
//     "status": "OPEN",
//     "betDelay": 0,
//     "bspReconciled": false,
//     "complete": true,
//     "inplay": false,
//     "numberOfWinners": 1,
//     "numberOfRunners": 2,
//     "numberOfActiveRunners": 2,
//     "totalMatched": 0,
//     "totalAvailable": 908927.27,
//     "crossMatching": true,
//     "runnersVoidable": false,
//     "version": 4736463864,
   
//   },
//   "marketName":val.marketName,
//   "marketType": val.marketType,
//   "masterStatus": {},
//   managerStatus:{},
//    "managers": [],
//   "masters": [],
 
//   "maxlimit": 1000000,
//   "minlimit": 100,
//   "openDate": new Date(val.eventDate),
//   "rateSource": "OSGExchange",
 
//   "shared": false,
//   "ssnrateSource": "FancyBook",
//   "subadminStatus": {},
//   "subadmins": [],
//   "totalMatched": 0,
//   "visible": true,
//   "visibleStatus": true,
//   "availablebookmakerSources": [
//     "Diamond",
//     "Lotus",
//     "None"
//   ],
//   "availablessnSources": [
//     "DreamBook",
//     "FancyBook",
//     "None"
//   ],
//   "ledger": true,
//   "managerBlocks": [],
//   "masterBlocks": [],
//   "runnersResult": [],
//   "subadminBlocks": [],
//   "usersPermission": [],
//   "betStatus": false,
//   "managerProfit": {
    
//   }
// }
//   var  runners=[];
//   var marketrunner= [];
//     var response1l = JSON.parse(val.market_runner_json);

//   for(var j=0;j<response1l.length;j++)
//   {

//     var es=  {
//       "selectionId": response1l[j].selectionId,
//       "runnerName": response1l[j].name,
//        "status": "ACTIVE",
//       "handicap": 0,
//       "sortPriority": 1,
//       "logo": "sri-lanka.svg",
//       "availableToBack": {
//           "price": 0,
//           "size": 0
//         },
//         "availableToLay": {
//           "price": 0,
//           "size": 0
//         }
//     }
//   runners.push(es);

// var ms={
//         "status": "ACTIVE",
//         "sortPriority": 1,
//         "runnerName": response1l[j].name,
//         "selectionId": response1l[j].selectionId
//       }

//       marketrunner.push(ms);

//   }

//       m2.runners=marketrunner;
//       m2.marketBook.runners=runners;
//          var e3 = new Event(e2);
         
//           Event.findOne({
//             'event.id': e3.eventId,
           
//           }, function(err, event) {

//             if(!event)
//             {
//                          e3.save(function (err) {
//                                     //console.log(err);
//                                     if (err) logger.debug(err);
//                                  });
//             }

//             });

       
//                       User.find({
//                            deleted: false,
//                            status: 'active',
//                            'role':'manager',
                           
//                         }, {
//                            username: 1
//                         }, function (err, dbManagers) {
//                           console.log(dbManagers)
//                            if (err) logger.error(err);
//                            if (dbManagers) {
//                               for (var i = 0; i < dbManagers.length; i++) {
//                                  m2.managers.unshift(dbManagers[i].username);
//                                  m2.managerStatus[dbManagers[i].username] = true;
//                               }
//                            }
//                  var m3 = new Market(m2);
//                           Market.findOne({
//             'marketId': m3.marketId,
           
//           }, function(err, market) {
//             // console.log(market);
//            if(!market)
//             {
                    
//                          m3.save(function (err) {
//                                     //console.log(err);
//                                     if (err) logger.debug(err);
//                                  });
//             }
//             else
//             {
//              // console.log(market.eventName);
//              console.log(m2.managers)
              
//             }
//           });


//                          });
//                     }

//           })(response1.data[i])
//         }
       
// });

//  }, 21300000);


// //tennis match
// setInterval(function () {
  
//        request('http://172.105.37.170/api/v1/getMatches?sport_id=4&token=Ix7zyHbZXclURvUaGYhWYTFOgAqzzmiF52HAHz2y', function (error, response, body) {

//          var response1 = JSON.parse(response.body);
//         if(!response1.data)return;
//         if(response1.data.length==0)return;
  
//         for(var i=0;i<response1.data.length;i++)
//         {
//           (function(val)
//           {
//           if(val.marketType=='MATCH_ODDS')
//           {


//          var e2=   {
//   "event": {
//     "id": val.eventId,
//     "name": val.eventName,
//     "countryCode": "GB",
//     "timezone": "GMT",
//     "openDate": new Date(val.eventDate)
//   },
//   "__v": 0,
//   "availableSources": [
//     "esport"
//   ],
//   "marketTypes": [],
//   "showScore": true,
//   "deleted": false,
//   "visible": true,
//   "competitionName": val.SeriesName,
//   "countryCode": "GB",
//   "competitionId": val.SeriesId,
//   "eventTypeName": val.EventTypeName,
//   "eventTypeId": val.EventTypeId,
//   "marketCount": 4,
//   "managerFeesProfit": {}
// }


// var m2={
//   "marketId": val.marketId,
//   "__v": 0,
//   "auto": true,
//   "visible": true,
//   "availableSources": [
//     "BetFair",
//     "OSGExchange",
//     "BetVendor",
//     "None"
//   ],
//   "bookmakerSource": "Lotus",
//   "competitionId": val.SeriesId,
//   "competitionName":  val.SeriesName,
//   "createdBy": "Auto By Api",
//   "deleted": false,
//   "eventId": val.eventId,
//   "eventName": val.eventName,
//   "eventTypeId": val.EventTypeId,
//   "eventTypeName": val.EventTypeName,
//   "marketBook": {
//     "marketId": val.marketId,
//     "isMarketDataDelayed": true,
//     "status": "OPEN",
//     "betDelay": 0,
//     "bspReconciled": false,
//     "complete": true,
//     "inplay": false,
//     "numberOfWinners": 1,
//     "numberOfRunners": 2,
//     "numberOfActiveRunners": 2,
//     "totalMatched": 0,
//     "totalAvailable": 908927.27,
//     "crossMatching": true,
//     "runnersVoidable": false,
//     "version": 4736463864,
   
//   },
//   "marketName":val.marketName,
//   "marketType": val.marketType,
//   "masterStatus": {},
//   "masters": [],
//   "maxlimit": 1000000,
//   "minlimit": 100,
//   "openDate": new Date(val.eventDate),
//   "rateSource": "OSGExchange",
 
//   "shared": false,
//   "ssnrateSource": "FancyBook",
//   "subadminStatus": {},
//   "subadmins": [],
//   "totalMatched": 0,
  
//   "visibleStatus": true,
//   "availablebookmakerSources": [
//     "Diamond",
//     "Lotus",
//     "None"
//   ],
//   "availableSources":[
//   "BetFair",
//   "OSGExchange",
//   "BetVendor",
//   "None"],
//   "availablessnSources": [
//     "DreamBook",
//     "FancyBook",
//     "None"
//   ],
//   "ledger": true,
//   'managerStatus':{},
//    "managers": [],
//   "managerBlocks": [],
//   "masterBlocks": [],
//   "runnersResult": [],
//   "subadminBlocks": [],
//   "usersPermission": [],
//   "betStatus": false,
//   "managerProfit": {
    
//   }
// }
//   var  runners=[];
//   var marketrunner= [];
//     var response1l = JSON.parse(val.market_runner_json);
//   for(var j=0;j<response1l.length;j++)
//   {

//     var es=  {
//       "selectionId": response1l[j].selectionId,
//       "runnerName": response1l[j].name,
//        "status": "ACTIVE",
//       "handicap": 0,
//       "sortPriority": 1,
//       "logo": "sri-lanka.svg",
//       "availableToBack": {
//           "price": 0,
//           "size": 0
//         },
//         "availableToLay": {
//           "price": 0,
//           "size": 0
//         }
//     }
//   runners.push(es);

// var ms={
//         "status": "ACTIVE",
//         "sortPriority": 1,
//         "runnerName": response1l[j].name,
//         "selectionId": response1l[j].selectionId
//       }

//       marketrunner.push(ms);

//   }
//       if(runners.length==0)return;

//       m2.runners=marketrunner;
//       m2.marketBook.runners=runners;
      
//          var e3 = new Event(e2);
          
//           Event.findOne({
//             'event.id': val.eventId,
           
//           }, function(err, event) {

//             if(!event)
//             {
//                          e3.save(function (err) {
//                                     //console.log(err);
//                                     if (err) logger.debug(err);
//                                  });
//             }

//             });


//                       User.find({
//                            deleted: false,
//                            status: 'active',
//                            'role':'manager',
                          
//                         }, {
//                            username: 1
//                         }, function (err, dbManagers) {
//                            if (err) logger.error(err);
//                            if (dbManagers) {
//                               for (var i = 0; i < dbManagers.length; i++) {
//                                  m2.managers.unshift(dbManagers[i].username);
//                                  m2.managerStatus[dbManagers[i].username] = true;
//                               }
//                            }
//               var m3 = new Market(m2);
//                           Market.findOne({
//             'marketId': val.marketId,
           
//           }, function(err, market) {
//             if(market)
//             {
               
            
//             }
//            if(!market)
//             {
                    
//                          m3.save(function (err) {
//                                     //console.log(err);
//                                     if (err) logger.debug(err);
//                                  });
//             }
//             else
//             {
              
//             }
//           });


//                          });
//                     }

//           })(response1.data[i])
//         }
       
// });

//  }, 21600000);
