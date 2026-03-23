//required modules
var mongoose              = require('mongoose');
var phantom               = require('phantom');
var logger                = require('log4js').getLogger();
// var fs          = require('fs');
// var cmd         = require('node-cmd');

// required internal modules
var eventTypeModule       = require('../../whiteJetsu/eventType');
var competitionModule     = require('../../whiteJetsu/competition');
var eventModule           = require('../../whiteJetsu/event');
var marketTypeModule      = require('../../whiteJetsu/marketType');
var marketCatalogueModule = require('../../whiteJetsu/marketCatalogue');
var marketBook            = require('../../whiteJetsu/marketBook');

// required models
var EventType             = mongoose.model('EventType');
var Competition           = mongoose.model('Competition');
var Event                 = mongoose.model('Event');
var Market                = mongoose.model('Market');
var User                  = mongoose.model('User');
// var UserDetail = mongoose.model('UserDetail');

// required handlers
var eventHndl  = require('./event');
var marketHndl  = require('./market');

//
// @description
// - fill eventTypes
module.exports.eventTypes   = function(io, socket, request, token){
  logger.info("fill eventTypes: "+JSON.stringify(request));
  eventTypeModule.listEventTypes(token, function(bfEventTypes){
    if(bfEventTypes == null){
      return;
    }
    else{
      bfEventTypes.forEach(function(bfEventType, index){
        EventType.update({"eventType.id":bfEventType.eventType.id}, bfEventType, {upsert:true}, function(err, updateMessage){
          if(err) logger.debug(err);
        });
        if(index == bfEventTypes.length-1){
          eventHndl.getEventTypes(io, socket, request);
        }
      });
    }
  });
};

// // fill-competitions request:{admin/manager, eventTypeId}
module.exports.competitions = function(io, socket, request, token){
  if(!request || !token) return;
  if(!request.user || !request.eventTypeId || !request.eventTypeName) return;
  logger.info("fill Competitions: "+JSON.stringify(request));

	competitionModule.listCompetitions(token, request.eventTypeId, request.eventTypeName, function(bfCompetitions){
		if(bfCompetitions == null){
			return;
		}
		Competition.update({'eventTypeId':request.eventTypeId}, {$set:{visible:false}}, {multi:true}, function(err, raw){
      if(err) logger.debug(err);
			bfCompetitions.forEach(function(val, index){
				Competition.findOne({"competition.id":val.competition.id}, function(err, c){
          if(err) logger.debug(err);
					if(!c){
						Competition.update({"competition.id":val.competition.id}, val, {upsert:true}, function(err, raw){
              if(err) logger.debug(err);
              if(index == bfCompetitions.length-1){
                eventHndl.getEventTypes(io, socket, request);
              }
						});
					}
					else{
						Competition.update({"competition.id":val.competition.id}, {$set:{visible:true, deleted:false}}, function(err, raw){
              if(err) logger.debug(err);
              if(index == bfCompetitions.length-1){
                eventHndl.getEventTypes(io, socket, request);
              }
            });
					}
				});
			});
		});
	});
};

// fill-events request:{admin/manager, competition}
module.exports.events       = function(io, socket, request, token){
  if(!request || !token) return;
  if(!request.user || !request.competition) return;
  logger.info("fill Events: "+JSON.stringify(request));

	eventModule.listEvents(token, request.competition, function(newEvents){
		if(newEvents == null){
      return;
		}
		Event.update({"competitionId":request.competition.competition.id},{$set:{visible:false}},{multi:true},function(err, raw){
			newEvents.forEach(function(val, index){
				Event.findOne({"event.id":val.event.id}, function(err, c){
          if(err) logger.debug(err);
					if(!c){
						Event.update({"event.id":val.event.id}, val, {upsert:true}, function(err, raw){
              if(err) logger.debug(err);
              if(index == newEvents.length-1){
                eventHndl.getEvents(io, socket, request);
              }
						});
					}
					else{
						Event.update({'event.id':val.event.id},{$set:{visible:true, deleted:false}}, function(err, raw){
              if(err) logger.debug(err);
              if(index == newEvents.length-1){
                eventHndl.getEvents(io, socket, request);
              }
            });
					}
				});
			});
		});
	});
};

// fill-markets request:{admin/manager, event}
module.exports.markets      = function(io, socket, request, token){
  if(!request || !token) return;
  if(!request.user || !request.event) return;
  if(!request.user.details || !request.event.event) return;
  logger.info("fill Markets: "+JSON.stringify(request));

  socket.emit('fill-markets-status', {BetFair:'in-progress', LotusBook:'Not Started', SkyExchange:'Not Started'});
	marketTypeModule.listMarketTypes(token, request.event, function(bfMarketTypes){
		if(bfMarketTypes == null){
      return;
		}
		Event.update({'event.id':request.event.event.id},{$set:{marketTypes:bfMarketTypes}}, function(err, updatedEvent){
      if(err) logger.debug(err);
      setTimeout(function(){
        marketHndl.getMarkets(io, socket, {user:request.user, filter:{eventId:request.event.event.id, deleted:false}, sort:{marketName:1}});
      }, 10000);
     /* setTimeout(async function(){
        var instance;
        var page;
        instance = await phantom.create(['--ignore-ssl-errors=yes', '--load-images=no']);
        page = await instance.createPage();
        var url = 'http://139.59.6.114/api.php?url=exchange/odds/sma-event/LIOR/'+request.event.eventTypeId+'/'+request.event.event.id;
        console.log(url);
        await page.on('onLoadFinished', async function(status){
          var plainText = await page.property('plainText');
          console.log(plainText);
          socket.emit('fill-markets-status', {BetFair:'completed', LotusBook:'completed', SkyExchange:'in-progress'});
          var data = JSON.parse(plainText);
          var markets = data.result;
          for(var i=0;i<markets.length;i++){
            (function(market){
              Market.findOne({marketId:market.id}, function(err, dbMarket){
                if(err) logger.debug(err);
                if(!dbMarket){
                  var m2 = {
                    eventTypeId: request.event.eventTypeId,
                    eventTypeName: request.event.eventTypeName,
                    competitionId: request.event.competitionId,
                    competitionName: request.event.competitionName,
                    eventId: request.event.event.id,
                    eventName: request.event.event.name,
                    openDate: request.event.event.openDate,
                    marketId: market.id,
                    marketName: market.name,
                    marketType:'SESSION',
                    totalMatched:0,
                    marketBook:{
                      status: 'SUSPENDED',
                      inplay: true,
                      availableToBack:{price:0, size:0},
                      availableToLay:{price:0, size:0}
                    },
                    runners:[],
                    managers:[],
                    createdBy:'luffy',
                    managerStatus:{},
                    availableSources:['LotusBook','OSGExchange'],
                    rateSource:'LotusBook',
                    shared:false,
                    visible:true,
                    deleted:false,
                    auto: true
                  };
                  User.find({deleted:false, status:'active', availableEventTypes:m2.eventTypeId}, {username:1},  function(err, dbManagers){
                    if(err) logger.error(err);
                    if(dbManagers){
                      for(var i=0;i<dbManagers.length;i++){
                        m2.managers.unshift(dbManagers[i].username);
                        m2.managerStatus[dbManagers[i].username] = true;
                      }
                    }
                    var m3 = new Market(m2);
                    m3.save(function(err){
                      if(err) logger.debug(err);
                    });
                  });
                }
                else{
                  if(dbMarket.availableSources){
                    if(dbMarket.availableSources.indexOf('LotusBook') == -1){
                      dbMarket.availableSources.unshift('LotusBook');
                    }
                  }
                  else{
                    dbMarket.availableSources = ['LotusBook'];
                  }
                  dbMarket.save(function(err){
                    if(err) logger.debug(err);
                  });
                }
              });
            })(markets[i]);
          }
        });
        await page.open(url);
      }, 5000);*/
      /*setTimeout(async function(){
        var instance;
        var page;
        instance = await phantom.create(['--ignore-ssl-errors=yes', '--load-images=no']);
        page = await instance.createPage();
        var url = 'https://api.osgexch.com/api/gamex-all-api-exchange-event/' + request.event.eventTypeId + '/' + request.event.event.id;
       // console.log(url);
        await page.on('onLoadFinished', async function(status){
          var plainText = await page.property('plainText');
         // console.log(plainText);
          socket.emit('fill-markets-status', {BetFair:'completed', LotusBook:'completed', SkyExchange:'completed'});
          if(!plainText)return;
          var data = JSON.parse(plainText);
          var markets = data.result;
          for(var i=0;i<markets.length;i++){
            (function(market){
              Market.findOne({marketId:market.id}, function(err, dbMarket){
                if(err) logger.debug(err);
                if(!dbMarket){
                  var m2 = {
                    eventTypeId: request.event.eventTypeId,
                    eventTypeName: request.event.eventTypeName,
                    competitionId: request.event.competitionId,
                    competitionName: request.event.competitionName,
                    eventId: request.event.event.id,
                    eventName: request.event.event.name,
                    openDate: request.event.event.openDate,
                    marketId: market.id,
                    marketName: market.name,
                    marketType:'SESSION',
                    totalMatched:0,
                    marketBook:{
                      status: 'SUSPENDED',
                      inplay: true,
                      availableToBack:{price:0, size:0},
                      availableToLay:{price:0, size:0}
                    },
                    runners:[],
                    managers:[],
                    createdBy:'luffy',
                    managerStatus:{},
                    availableSources:['OSGExchange'],
                    rateSource:'OSGExchange',
                    shared:false,
                    visible:true,
                    deleted:false,
                    auto: true
                  };
                  User.find({deleted:false, status:'active', availableEventTypes:m2.eventTypeId}, {username:1},  function(err, dbManagers){
                    if(err) logger.error(err);
                    if(dbManagers){
                      for(var i=0;i<dbManagers.length;i++){
                        m2.managers.unshift(dbManagers[i].username);
                        m2.managerStatus[dbManagers[i].username] = true;
                      }
                    }
                    var m3 = new Market(m2);
                    m3.save(function(err){
                      if(err) logger.debug(err);
                    });
                  });
                }
                else{
                  if(dbMarket.availableSources){
                    if(dbMarket.availableSources.indexOf('OSGExchange') == -1){
                      dbMarket.availableSources.unshift('OSGExchange');
                    }
                  }
                  else{
                    dbMarket.availableSources = ['OSGExchange'];
                  }
                  dbMarket.save(function(err){
                    if(err) logger.debug(err);
                  });
                }
              });
            })(markets[i]);
          }
        });
        await page.open(url);
      }, 7000);*/
			bfMarketTypes.forEach(function(marketType, marketTypeIndex){
				marketCatalogueModule.listMarketCatalogue(token, request.event, marketType, function(newMarketCatalogue){
					newMarketCatalogue.forEach(function(val, index){
						(function(val, index){
							Market.findOne({"marketId":val.marketId}, function(err, m){
                if(err) logger.debug(err);

                 User.find({
                deleted: false,
                status: 'active',
                availableEventTypes: m.eventTypeId
              }, {
                username: 1
              }, function (err, dbManagers) {
                if (err) logger.error(err);
                if (dbManagers) {
                  for (var i = 0; i < dbManagers.length; i++) {
                    val.managers.unshift(dbManagers[i].username);
                    val.managerStatus[dbManagers[i].username] = true;
                  }
                }
								if(!m){
									val.createdBy = request.user.details.username;
									val.shared = false;
									val.managers = [];
									val.managerStatus = {};
									Market.update({"marketId":val.marketId}, val, {upsert:true}, function(err, updatedMarket){
                    if(err) logger.debug(err);
                   


										marketBook.listMarketBook(token, val, function(newMarketBook){
											newMarketBook.status = 'SUSPENDED';
										Market.update({'marketId':val.marketId},{$set:{marketBook:newMarketBook,availableSources:["BetFair","OSGExchange","BetVendor"],availablessnSources:["DreamBook","FancyBook","None"]}}, function(err, updatedMarket){
                        if(err) logger.debug(err);
                      });
										});
									});
                    
								}
                });
							});
						})(val, index);
					});
          // socket.emit('fill-markets-status', {BetFair:'completed', LotusBook:'in-progress', SkyExchange:'Not Started'});
          // (async function() {
          //   instance = await phantom.create(['--ignore-ssl-errors=yes', '--load-images=no']);
          //   page = await instance.createPage();
          //   var url = 'https://www.skyexchange.com/exchange/member/playerService/queryEventsWithMarket?eventTs=1536844001833&eventType=4&eventId='+request.event.event.id+'&marketTs=-1&selectionTs=-1&competitionId=-1';
          //   logger.info(url);
          //   const status = await page.open(url);
          //   var plainText = await page.property('plainText');
          //   socket.emit('fill-markets-status', {BetFair:'completed', LotusBook:'completed', SkyExchange:'completed'});
          //   var data = JSON.parse(plainText);
          //   var markets = data.markets;
          //   for(var i=0;i<markets.length;i++){
          //     (function(market){
          //       Market.findOne({marketId:market.id}, function(err, dbMarket){
          //         if(err) logger.debug(err);
          //         if(!dbMarket){
          //         }
          //         else{
          //           if(dbMarket.availableSources){
          //             if(dbMarket.availableSources.indexOf('SkyExchange') == -1){
          //               dbMarket.availableSources.unshift('SkyExchange');
          //             }
          //           }
          //           else{
          //             dbMarket.availableSources = ['SkyExchange'];
          //           }
          //           dbMarket.save(function(err){
          //             if(err) logger.debug(err);
          //           });
          //         }
          //       });
          //     })(markets[i]);
          //   }
          // })();
				});
			});
		});

	});
};
