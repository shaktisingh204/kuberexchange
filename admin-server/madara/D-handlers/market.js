// required modules
var mongoose = require('mongoose');
var logger = require('log4js').getLogger();

// var fancyResult = require('../../blackJetsu/fancy-result');
// var bookmakerResult = require('../../blackJetsu/bookmaker-result');
var accountStatementHndl = require('./account-statement');
var request = require('request');
var betStatement = require('./bet');
// required models
var Login = mongoose.model('Login');
var User = mongoose.model('User');
var EventType = mongoose.model('EventType');
var Competition = mongoose.model('Competition');
var Logsettlement = mongoose.model('Logsettlement');
var Casinotrans = mongoose.model('Casinotrans');
var Event = mongoose.model('Event');
var Market = mongoose.model('Market');
var Lock = mongoose.model('Lock');
var Bet = mongoose.model('Bet');
var Log = mongoose.model('Log');
var LogMinus = mongoose.model('LogMinus');
var WebToken = mongoose.model('WebToken');


////////////// --------- API ------------ ////////////////

module.exports.declareMarket = async function (req, res) {
  try {
    // console.log(req.body)
    if (!req.body) return;
    if (!req.body.details) return;
    // logger.info("getopenMarkets: " + JSON.stringify(req.body));
    // if (req.body.details.role == 'operator') {
      User.findOne({
        hash: req.body.details.key,
        _id: req.body.details._id,
        role: req.body.details.role ,
        deleted: false,
        status: 'active'
      }, function (err, dbAdmin) {
        if (err) logger.error(err);
        if (!dbAdmin) {
          logger.error("Invalid Access: " + JSON.stringify(req.body));
          res.json({ response: [], error: true, "message": "No user found" });
          // return;
        }else{
          Market.findOne({marketId:req.body.marketId}).sort({_id:-1}).exec(function (err, DbMarket) {
            if (err) logger.error(err);
            if(DbMarket){
              if(DbMarket.marketType == "SESSION"){
                if(DbMarket.managerlog == 0){
                  fancyResult.managerLogs(req.body.marketId);
                  res.json({ response: DbMarket, error: false, "message": "server response success" });
                }else if(DbMarket.masterlog == 0){
                  fancyResult.masterLogs(req.body.marketId);
                  res.json({ response: DbMarket, error: false, "message": "server response success" });
                }else if(DbMarket.subadminlog == 0){
                  fancyResult.subadminLogs(req.body.marketId);
                  res.json({ response: DbMarket, error: false, "message": "server response success" });
                }else{
                  fancyResult.adminLogs(req.body.marketId);
                  res.json({ response: DbMarket, error: false, "message": "server response success" });
                }
              }else if(DbMarket.marketType == "Special"){
                if(DbMarket.managerlog == 0){
                  bookmakerResult.managerLogs(req.body.marketId);
                  res.json({ response: DbMarket, error: false, "message": "server response success" });
                }else if(DbMarket.masterlog == 0){
                  bookmakerResult.masterLogs(req.body.marketId);
                  res.json({ response: DbMarket, error: false, "message": "server response success" });
                }else if(DbMarket.subadminlog == 0){
                  bookmakerResult.subadminLogs(req.body.marketId);
                  res.json({ response: DbMarket, error: false, "message": "server response success" });
                }else{
                  bookmakerResult.adminLogs(req.body.marketId);
                  res.json({ response: DbMarket, error: false, "message": "server response success" });
                }
              }else{
                res.json({ response: [], error: true, "message": "NO Market Found!" });
              }
            }
            res.json({ response: DbMarket, error: false, "message": "server response success" });
          });
        }
      });
    // }
  } catch (err) {
    res.json({ response: [], error: true, "message": "server response success" });
  }
};

module.exports.getClosedMarkets = async function (req, res) {
  try {
    // console.log(req.body)
    if (!req.body) return;
    if (!req.body.details) return;
    // logger.info("getopenMarkets: " + JSON.stringify(req.body));
    // if (req.body.details.role == 'operator') {
      User.findOne({
        hash: req.body.details.key,
        _id: req.body.details._id,
        role: req.body.details.role ,
        deleted: false,
        status: 'active'
      }, function (err, dbAdmin) {
        if (err) logger.error(err);
        if (!dbAdmin) {
          logger.error("Invalid Access: " + JSON.stringify(req.body));
          res.json({ response: [], error: true, "message": "No user found" });
          // return;
        }else{
          Market.find({adminlog:1,"marketBook.status": 'CLOSED'}).sort({_id:-1}).exec(function (err, result) {
            if (err) logger.error(err);
            res.json({ response: result, error: false, "message": "server response success" });
          });
        }
      });
    // }
  } catch (err) {
    res.json({ response: [], error: true, "message": "server response success" });
  }
};

module.exports.getOpenMarkets = async function (req, res) {
  try {
    // console.log(req.body)
    if (!req.body) return;
    if (!req.body.details) return;
    // logger.info("getopenMarkets: " + JSON.stringify(req.body));
    // if (req.body.details.role == 'admin') {
      User.findOne({
        hash: req.body.details.key,
        _id: req.body.details._id,
        role: req.body.details.role ,
        deleted: false,
        status: 'active'
      }, function (err, dbAdmin) {
        if (err) logger.error(err);
        if (!dbAdmin) {
          logger.error("Invalid Access: " + JSON.stringify(req.body));
          res.json({ response: [], error: true, "message": "No user found" });
          // return;
        }else{
          Market.find({
            "marketType": "MATCH_ODDS",
            "marketBook.runners.status": "ACTIVE",
            "visible": true,
            "auto":true,
            "adminlog":0, 
            "marketBook.status": {
              $in: ["CLOSED"]
            }
          }).sort({_id:-1}).exec(function (err, result) {
            if (err) logger.error(err);
            res.json({ response: result, error: false, "message": "server response success" });
          });
        }
      });
    // }
  } catch (err) {
    res.json({ response: [], error: true, "message": "server response success" });
  }
};

module.exports.getOtherMarkets = async function (req, res) {
  try {
    // console.log(req.body)
    if (!req.body) return;
    if (!req.body.details) return;
    // logger.info("getopenMarkets: " + JSON.stringify(req.body));
    // if (req.body.details.role == 'operator') {
      User.findOne({
        hash: req.body.details.key,
        _id: req.body.details._id,
        role: req.body.details.role ,
        deleted: false,
        status: 'active'
      }, function (err, dbAdmin) {
        if (err) logger.error(err);
        if (!dbAdmin) {
          logger.error("Invalid Access: " + JSON.stringify(req.body));
          res.json({ response: [], error: true, "message": "No user found" });
          // return;
        }else{
          Market.find({
            "marketType": "MATCH_ODDS",
            "marketBook.runners.status": "ACTIVE",
            "visible": true,
            "auto":true,
            "adminlog":0,
            "competitionName":"Others"
          }).sort({_id:-1}).exec(function (err, result) {
            if (err) logger.error(err);
            res.json({ response: result, error: false, "message": "server response success" });
          });
        }
      });
    // }
  } catch (err) {
    res.json({ response: [], error: true, "message": "server response success" });
  }
};

module.exports.getUncompleteMarkets = async function (req, res) {
  try {
    console.log(req.body)
    if (!req.body) return;
    if (!req.body.details) return;
    logger.info("getopenMarkets: " + JSON.stringify(req.body));
    // if (req.body.details.role == 'admin') {
      User.findOne({
        hash: req.body.details.key,
        _id: req.body.details._id,
        role: req.body.details.role ,
        deleted: false,
        status: 'active'
      }, function (err, dbAdmin) {
        if (err) logger.error(err);
        if (!dbAdmin) {
          logger.error("Invalid Access: " + JSON.stringify(req.body));
          res.json({ response: [], error: true, "message": "No user found" });
          // return;
        }else{
          Market.find({userlog: 1, adminlog: 0}).sort({_id:-1}).exec(function (err, result) {
            if (err) logger.error(err);
            res.json({ response: result, error: false, "message": "server response success" });
          });
        }
      });
    // }
  } catch (err) {
    res.json({ response: [], error: true, "message": "server response success" });
  }
};

module.exports.getMarketBet = async function (req, res) {
  try {
    // console.log(req.body);
    if (!req.body) return;
    if (!req.body.details) return;

    var filter = {
      'marketId': req.body.marketId,
      'manager': req.body.details.username,
    };

    if (req.body.details.role == "master") {
      filter = {
        'marketId': req.body.marketId,
        'master': req.body.details.username,
      };
    }

    if (req.body.details.role == "subadmin") {
      filter = {
        'marketId': req.body.marketId,
        'subadmin': req.body.details.username,
      };
    }

    if (req.body.details.role == "admin") {
      filter = {
        'marketId': req.body.marketId,
        'admin': req.body.details.username,
      };
    }

    if (req.body.details.role == "user") {
      filter = {
        'marketId': req.body.marketId,
        'username': req.body.details.username,
      };
    }

    if(req.body.username){
      var searchUser = await User.findOne({ username: req.body.username }, { role: 1 });
      if(searchUser){
        if(searchUser.role == "admin"){
          filter.admin = req.body.username;
        }else if(searchUser.role == "subadmin"){
          filter.subadmin = req.body.username;
        }else if(searchUser.role == "master"){
            filter.master = req.body.username;
        }else if(searchUser.role == "manager"){
          filter.manager = req.body.username;
        }else{
          filter.username = req.body.username;
        }
      }else{
        filter.username = req.body.username;
      }
    }
    // console.log(filter);
    // Bet.find({filter}, function (err, bets) {
    Bet.find(filter).sort({
      'placedTime': -1
    }).exec(function (err, bets) {

      res.json({ response: bets, error: false, "message": "server response success" });
    });

  } catch (err) {
    res.json({ response: [], error: true, "message": "server response success" });
  }

}

module.exports.userBetLock = async function (req, res) {
  try {
    // console.log(req.body);
    let { details, type, eventId, username } = req.body;

    var filter = {
      manager: details.username,
    };

    if (req.body.details.role == "master") {
      filter = {
        master: details.username,
      };
    }

    if (req.body.details.role == "subadmin") {
      filter = {
        subadmin: details.username,
      };
    }

    if (req.body.details.role == "admin") {
      filter = {
        admin: details.username,
      };
    }


    Lock.findOne({ "eventId": eventId, bettype: "ODDS" }, { _id: 1, userBlocks: 1 })
      .then(async data => {
        if (!data) {
          let lockusers = [];

          if (type === "all") {
            if (!lockusers.includes(details.username)) {
              lockusers.push(details.username);
            }

            await User.distinct('username', filter, function (err, distinctuser) {
              for (var j = 0; j < distinctuser.length; j++) {
                if (!lockusers.includes(distinctuser[j])) {
                  lockusers.push(distinctuser[j]);
                }
              }
            });

            // lockusers.push(details.username);

          } else {

            lockusers.push(username);

            // for (var j = 0; j < userid.length; j++) {
            //   if (!lockusers.includes(userid[j])) {
            //     lockusers.push(userid[j]);
            //   }
            // }
          }

          var lock = new Lock();
          lock.eventId = eventId;
          lock.usertype = type;
          lock.bettype = 'ODDS';
          lock.userBlocks = lockusers,
            lock.save(function (err, docs) {
              if (err) {
                logger.error('create-user-error: Log entry failed.');
              } else {
                res.json({ response: docs, error: false, "message": "server response success" });
              }
            });
        }
        else {
          let lockusers = data.userBlocks;
          if (type === "all") {
            if (!lockusers.includes(details.username)) {
              lockusers.push(details.username);
            }

            await User.distinct('username', filter, function (err, distinctuser) {
              for (var j = 0; j < distinctuser.length; j++) {
                if (!lockusers.includes(distinctuser[j])) {
                  lockusers.push(distinctuser[j]);
                }
              }
            });

            // if (!lockusers.includes(details.username)) {
            //   lockusers.push(details.username);
            // }
          } else {
            if (!lockusers.includes(username)) {
              lockusers.push(username);
            }
            // for (var j = 0; j < userid.length; j++) {
            //   if (!lockusers.includes(userid[j])) {
            //     lockusers.push(userid[j]);
            //   }
            // }
          }
          // console.log(lockusers);
          const update = {
            userBlocks: lockusers,
          };
          Lock.findOneAndUpdate({ _id: data._id },
            update, async function (err, docs) {
              if (err) {
                console.log("DB error: Application error ", err);
              }
              else {
                res.json({ response: docs, error: false, "message": "server response success" });
              }
            })
        }
      })
  } catch (err) {
    console.log(err)
    res.json({ response: docs, error: true, "message": "server response success" });
  }
}

module.exports.userRemoveBetLock = async function (req, res) {
  try {
    // console.log(req.body); 
    let { details, type, eventId, username } = req.body;

    var filter = {
      manager: details.username,
    };

    if (req.body.details.role == "master") {
      filter = {
        master: details.username,
      };
    }

    if (req.body.details.role == "subadmin") {
      filter = {
        subadmin: details.username,
      };
    }

    if (req.body.details.role == "admin") {
      filter = {
        admin: details.username,
      };
    }

    Lock.findOne({ "eventId": eventId, bettype: "ODDS" }, { _id: 1, userBlocks: 1 })
      .then(async data => {
        if (data) {
          let lockusers = data.userBlocks;



          if (type === "all") {

            if (lockusers.includes(details.username)) {
              const index = lockusers.findIndex(key => key === details.username);
              lockusers.splice(index, 1);
            }

            await User.distinct('username', filter, function (err, distinctuser) {
              for (var j = 0; j < distinctuser.length; j++) {
                if (lockusers.includes(distinctuser[j])) {
                  const index = lockusers.findIndex(key => key === distinctuser[j]);
                  // console.log(index); // 0
                  lockusers.splice(index, 1);
                }
              }
            });


            // if (lockusers.includes(details.username)) {
            //   const index = lockusers.findIndex(key => key === details.username);
            //   // console.log(index); // 0
            //   lockusers.splice(index, 1);
            // }
          } else {
            if (lockusers.includes(username)) {
              const index = lockusers.findIndex(key => key === username);
              // console.log(index); // 0
              lockusers.splice(index, 1);
            }
            // for (var j = 0; j < userid.length; j++) {
            //   if (!lockusers.includes(userid[j])) {
            //     const index = lockusers.findIndex(key => key === userid[j]);
            //     // console.log(index); // 0
            //     lockusers.splice(index, 1);
            //   }
            // }
          }
          const update = {
            userBlocks: lockusers,
          };
          Lock.findOneAndUpdate({ _id: data._id },
            update, async function (err, docs) {
              if (err) {
                console.log("DB error: Application error ", err);
              }
              else {
                res.json({ response: docs, error: false, "message": "server response success" });
              }
            })
        }
      })
  } catch (err) {
    console.log(err)
    res.json({ response: docs, error: true, "message": "server response success" });
  }
}

module.exports.userFancyLock = async function (req, res) {
  try {
    let { details, type, eventId, username } = req.body;

    var filter = {
      manager: details.username,
    };

    if (req.body.details.role == "master") {
      filter = {
        master: details.username,
      };
    }

    if (req.body.details.role == "subadmin") {
      filter = {
        subadmin: details.username,
      };
    }

    if (req.body.details.role == "admin") {
      filter = {
        admin: details.username,
      };
    }

    Lock.findOne({ "eventId": eventId, bettype: "FANCY" }, { _id: 1, userBlocks: 1 })
      .then(async data => {
        if (!data) {
          let lockusers = [];
          if (type === "all") {
            if (!lockusers.includes(details.username)) {
              lockusers.push(details.username);
            }

            await User.distinct('username', filter, function (err, distinctuser) {
              for (var j = 0; j < distinctuser.length; j++) {
                if (!lockusers.includes(distinctuser[j])) {
                  lockusers.push(distinctuser[j]);
                }
              }
            });
            // lockusers.push(details.username);

          } else {

            lockusers.push(username);

            // for (var j = 0; j < userid.length; j++) {
            //   if (!lockusers.includes(userid[j])) {
            //     lockusers.push(userid[j]);
            //   }
            // }
          }

          var lock = new Lock();
          lock.eventId = eventId;
          lock.usertype = type;
          lock.bettype = 'FANCY';
          lock.userBlocks = lockusers,
            lock.save(function (err, docs) {
              if (err) {
                logger.error('create-user-error: Log entry failed.');
              } else {
                res.json({ response: docs, error: false, "message": "server response success" });
              }
            });
        }
        else {
          let lockusers = data.userBlocks;
          if (type === "all") {

            if (!lockusers.includes(details.username)) {
              lockusers.push(details.username);
            }

            await User.distinct('username', filter, function (err, distinctuser) {
              for (var j = 0; j < distinctuser.length; j++) {
                if (!lockusers.includes(distinctuser[j])) {
                  lockusers.push(distinctuser[j]);
                }
              }
            });

            // if (!lockusers.includes(details.username)) {
            //   lockusers.push(details.username);
            // }
          } else {
            if (!lockusers.includes(username)) {
              lockusers.push(username);
            }
            // for (var j = 0; j < userid.length; j++) {
            //   if (!lockusers.includes(userid[j])) {
            //     lockusers.push(userid[j]);
            //   }
            // }
          }
          const update = {
            userBlocks: lockusers,
          };
          Lock.findOneAndUpdate({ _id: data._id },
            update, async function (err, docs) {
              if (err) {
                console.log("DB error: Application error ", err);
              }
              else {
                res.json({ response: docs, error: false, "message": "server response success" });
              }
            })
        }
      })
  } catch (err) {
    console.log(err)
    res.json({ response: docs, error: true, "message": "server response success" });
  }
}

module.exports.userRemoveFancyLock = async function (req, res) {
  try {
    let { details, type, eventId, username } = req.body;
    var filter = {
      manager: details.username,
    };

    if (req.body.details.role == "master") {
      filter = {
        master: details.username,
      };
    }

    if (req.body.details.role == "subadmin") {
      filter = {
        subadmin: details.username,
      };
    }

    if (req.body.details.role == "admin") {
      filter = {
        admin: details.username,
      };
    }

    Lock.findOne({ "eventId": eventId, bettype: "FANCY" }, { _id: 1, userBlocks: 1 })
      .then(async data => {
        if (data) {
          let lockusers = data.userBlocks;
          if (type === "all") {

            if (lockusers.includes(details.username)) {
              const index = lockusers.findIndex(key => key === details.username);
              lockusers.splice(index, 1);
            }

            await User.distinct('username', filter, function (err, distinctuser) {
              for (var j = 0; j < distinctuser.length; j++) {
                if (lockusers.includes(distinctuser[j])) {
                  const index = lockusers.findIndex(key => key === distinctuser[j]);
                  // console.log(index); // 0
                  lockusers.splice(index, 1);
                }
              }
            });

            // if (lockusers.includes(details.username)) {
            //   const index = lockusers.findIndex(key => key === details.username);
            //   // console.log(index); // 0
            //   lockusers.splice(index, 1);
            // }
          } else {
            if (lockusers.includes(username)) {
              const index = lockusers.findIndex(key => key === username);
              // console.log(index); // 0
              lockusers.splice(index, 1);
            }
            // for (var j = 0; j < userid.length; j++) {
            //   if (!lockusers.includes(userid[j])) {
            //     const index = lockusers.findIndex(key => key === userid[j]);
            //     console.log(index); // 0
            //     lockusers.splice(index, 1);
            //   }
            // }
          }
          const update = {
            userBlocks: lockusers,
          };
          Lock.findOneAndUpdate({ _id: data._id },
            update, async function (err, docs) {
              if (err) {
                console.log("DB error: Application error ", err);
              }
              else {
                res.json({ response: docs, error: false, "message": "server response success" });
              }
            })
        }
      })
  } catch (err) {
    console.log(err)
    res.json({ response: docs, error: true, "message": "server response success" });
  }
}

module.exports.getMarketAnalysis = async function (req, res) {
  try {
    // console.log(req.body);
    if (!req.body) return;
    if (!req.body.details) return;

    var filter = {
      "manager": req.body.details.username,
      "deleted": false,
      "result": 'ACTIVE'
    };

    if (req.body.details.role == "master") {
      filter = {
        "master": req.body.details.username,
        "deleted": false,
        "result": 'ACTIVE'
      };
    }

    if (req.body.details.role == "subadmin") {
      filter = {
        "subadmin": req.body.details.username,
        "deleted": false,
        "result": 'ACTIVE'
      };
    }

    if (req.body.details.role == "admin") {
      filter = {
        "admin": req.body.details.username,
        "deleted": false,
        "result": 'ACTIVE'
      };
    }

    Market.find({ visible: true, visibleStatus: true, marketType: { $in: ['MATCH_ODDS'] }, 'marketBook.status': { $ne: 'CLOSED' } }).exec(function (err, dbMarketAll) {
      Bet.distinct('eventId', filter).exec(function (err, dbBet) {
        Market.find({
          "eventId": {
            $in: dbBet
          },
          "marketBook.status": "OPEN",
          "marketType": "MATCH_ODDS"
        }).exec(function (err, dbMarket) {
          var market = {
            dbMarket: dbMarket,
            totalMarket: dbMarketAll.length,
            totalBetMarket: dbMarket.length
          }
          // res.json(market);
          res.json({ response: market, error: false, "message": "server response success" });

        });
      });
    });

  } catch (err) {
    res.json({ response: [], error: true, "message": "server response success" });
  }

}

module.exports.getMarketIdUserbets = async function (req, res) {
  try {
    // console.log(req.body);
    if (!req.body) return;
    if (!req.body.details) return;

    var filter = {
      "manager": req.body.details.username,
      "deleted": false,
      "marketType": "SESSION",
      "result": 'ACTIVE'
    };

    if (req.body.details.role == "master") {
      filter = {
        "master": req.body.details.username,
        "deleted": false,
        "marketType": "SESSION",
        "result": 'ACTIVE'
      };
    }

    if (req.body.details.role == "subadmin") {
      filter = {
        "subadmin": req.body.details.username,
        "deleted": false,
        "marketType": "SESSION",
        "result": 'ACTIVE'
      };
    }

    if (req.body.details.role == "admin") {
      filter = {
        "admin": req.body.details.username,
        "deleted": false,
        "marketType": "SESSION",
        "result": 'ACTIVE'
      };
    }

    if (req.body.eventId) {
      filter.eventId = req.body.eventId;
    }

    console.log("getMarketIdUserbets", filter);
    Bet.distinct("marketId", filter, function (err, dbBets) {
      if (err) console.log("tttttt", err); logger.error(err);
      // console.log(dbBets)
      // console.log("getMarketIdUserbets success",dbBets.length);  
      res.json({ response: dbBets, error: false, "message": "server response success" });
      //  socket.emit('get-marketid-bets-success', dbBets);

    });
  } catch (err) {
    // console.log("getMarketIdUserbets",err);
    res.json({ response: [], error: true, "message": "server response success" });
  }

}

module.exports.getCasinoReport = async function (req, res) {
  try {
    // console.log(req.body);
    if (!req.body) return;
    if (!req.body.details) return;
    let { pageNumber, sortBy, limit } = req.body;
    let setlimit = 10;
    if (limit) {
      setlimit = limit;
    }
    let page = pageNumber >= 1 ? pageNumber : 1;
    page = page - 1;
    let setskip = setlimit * page;

    var filter = {
      'type': "TRANSACTION",
      'manager': req.body.details.username,
    };

    if (req.body.details.role == "master") {
      filter = {
        'type': "TRANSACTION",
        'master': req.body.details.username,
      };
    }

    if (req.body.details.role == "subadmin") {
      filter = {
        'type': "TRANSACTION",
        'subadmin': req.body.details.username,
      };
    }

    if (req.body.details.role == "admin") {
      filter = {
        'type': "TRANSACTION",
        'admin': req.body.details.username,
      };
    }

    if (req.body.details.role == "user") {
      filter = {
        'type': "TRANSACTION",
        'username': req.body.details.username,
      };
    }
    filter.placedate = { '$gte': req.body.from, '$lte': req.body.to };
    // console.log(filter);

    Casinotrans.find(filter, {}, { skip: setskip, limit: setlimit }).sort({
      '_id': -1
    }).exec(function (err, bets) {
      res.json({ response: bets, error: false, "message": "server response success" });
    });

  } catch (err) {
    res.json({ response: [], error: true, "message": "server response success" });
  }

}

////////////// --------- SOCKET ------------ ////////////////


module.exports.getUserBook = function (io, socket, req) {
  if (!req) return;
  if (!req.user) return;

  // console.log('step1;')

  try {
    // console.log('step2;')
    Market.findOne({ eventId: req.eventId, marketType: 'MATCH_ODDS' }, function (err, market) {
      // console.log(market)
      if (!market) return;
      var byname = String("username");
      var filter = {
        "ParentUser": req.user.details.username,
        'marketId': market.marketId,
        'marketType': "MATCH_ODDS",
        'deleted': false
      };
      if (req.user.details.role == "master") {
        byname = String("manager");
        filter = {
          "ParentUser": req.user.details.username,
          'marketId': market.marketId,
          'marketType': "MATCH_ODDS",
          'deleted': false
        };
      }

      if (req.user.details.role == "subadmin") {
        byname = String("master");
        filter = {
          "ParentUser": req.user.details.username,
          'marketId': market.marketId,
          'marketType': "MATCH_ODDS",
          'deleted': false
        };
      }

      if (req.user.details.role == "admin") {
        byname = String("subadmin");
        filter = {
          "ParentUser": req.user.details.username,
          'marketId': market.marketId,
          'marketType': "MATCH_ODDS",
          'deleted': false
        };
      }
      // console.log("asdf",byname,filter);
      User.find({ ParentUser: req.user.details.username }, { username: 1, role: 1 }, function (err, userlist) {
        // console.log(userlist,userlist.length)
        var output = {};
        if (userlist.length == 0) {
          output.user = userlist;
          output.profit = {};
          socket.emit('user-book-success', output);
          return;
        }
        var counter = 0;
        output.user = [];
        output.profit = {};
        var len = userlist.length;

        for (var i = 0; i < userlist.length; i++) {

          (function (user, indexs, callback) {
            var runnerProfit = {};
            var w = null;
            market.marketBook.runners.forEach(function (r, index) {
              runnerProfit[r.selectionId] = 0;
              if (index == market.marketBook.runners.length - 1) {
                var filter1 = {
                  "status": 'MATCHED',
                  'marketId': market.marketId,
                  'marketType': "MATCH_ODDS",
                  'deleted': false
                };
                if (user.role == "user") { filter1.username = user.username; }
                if (user.role == "manager") { filter1.manager = user.username; }
                if (user.role == "master") { filter1.master = user.username; }
                if (user.role == "subadmin") { filter1.subadmin = user.username; }
                // console.log(filter1);
                Bet.find(filter1, function (err, userBets) {
                  if (userBets.length > 0) {
                    // Alluser.push = user.username;
                    userBets.forEach(function (val, bindex) {
                      // console.log(user,val.managerCommision, val.masterCommision ,val.subadminCommision ,val.adminCommision); 
                      var partnership = 100;
                      if (user.role == "manager") {
                        partnership = val.managerCommision;
                      }
                      if (user.role == "master") {
                        partnership = val.masterCommision;
                      }

                      if (user.role == "subadmin") {
                        partnership = val.subadminCommision;
                      }

                      if (user.role == "admin") {
                        partnership = val.adminCommision;
                      }
                      if (val.type == 'Back') {
                        for (var k in runnerProfit) {
                          console.log(k,val.runnerId)
                          if (k == val.runnerId) {
                            if (user.role != "user") {
                              console.log("enter 1")
                              runnerProfit[k] += -1 * (((val.rate - 1) * val.stake) * partnership / 100);
                            } else {
                              console.log("enter 2")
                              runnerProfit[k] += (((val.rate - 1) * val.stake) * partnership / 100);
                            }
                          } else {
                            if (user.role != "user") {
                              console.log("enter 3")
                              runnerProfit[k] -= -1 * (val.stake * partnership / 100);
                            } else {
                              console.log("enter 4")
                              runnerProfit[k] -= (val.stake * partnership / 100);
                            }

                          }
                        }
                      } else {
                        for (var k in runnerProfit) {
                          console.log(k,val.runnerId)
                          if (k == val.runnerId) {
                            if (user.role != "user") {
                              console.log("enter 5")
                              runnerProfit[k] -= -1 * (((val.rate - 1) * val.stake) * partnership / 100);
                            } else {
                              console.log("enter 6")
                              runnerProfit[k] -= (((val.rate - 1) * val.stake) * partnership / 100);
                            }
                          } else {
                            if (user.role != "user") {
                              console.log("enter 7")
                              runnerProfit[k] += -1 * (val.stake * partnership / 100);
                            } else {
                              console.log("enter 8")
                              runnerProfit[k] += (( val.stake) * partnership / 100);
                            }
                          }
                        }
                      }
                      console.log("runnerProfit",runnerProfit)
                      if (bindex == userBets.length - 1) {
                        if (w != null) {
                          if (runnerProfit[w] == null) {
                            runnerProfit[w] = 0;
                          }
                        }
                        callback(runnerProfit, indexs);
                      }
                    });
                  } else {
                    callback(0, indexs);
                    // counter++;
                  }
                });
              }
            });

          })(userlist[i], i, function (profit, index) {
            counter++;
            // console.log(counter,len,index,userlist[index].username);
            if (counter == len) {
              if (profit != 0) {
                output.user.push(userlist[index].username);
                output.profit[userlist[index].username] = profit;
              }
              // console.log(output);
              socket.emit('user-book-success', output);
            } else {
              if (profit != 0) {
                output.user.push(userlist[index].username);
                output.profit[userlist[index].username] = profit;
              }
              // console.log(output);
            }
          });

        }

      });
    });
  } catch (e) {

  }


}

module.exports.oldgetCasinoBook = function (io, socket, req) {
  if (!req) return;
  if (!req.user) return;

  console.log('step1;', req)

  try {
    // console.log('step2;')
    Market.findOne({ eventId: req.eventId, marketType: 'Casino', "marketBook.status": "OPEN" }).sort({ _id: -1 }).exec(function (err, market) {
      // console.log(market)
      if (!market) return;
      var byname = String("username");
      var filter = {
        "ParentUser": req.user.details.username,
        'marketId': market.marketId,
        'marketType': "MATCH_ODDS",
        'deleted': false
      };
      if (req.user.details.role == "master") {
        byname = String("manager");
        filter = {
          "ParentUser": req.user.details.username,
          'marketId': market.marketId,
          'marketType': "MATCH_ODDS",
          'deleted': false
        };
      }

      if (req.user.details.role == "subadmin") {
        byname = String("master");
        filter = {
          "ParentUser": req.user.details.username,
          'marketId': market.marketId,
          'marketType': "MATCH_ODDS",
          'deleted': false
        };
      }

      if (req.user.details.role == "admin") {
        byname = String("subadmin");
        filter = {
          "ParentUser": req.user.details.username,
          'marketId': market.marketId,
          'marketType': "MATCH_ODDS",
          'deleted': false
        };
      }
      // console.log("asdf",byname,filter);
      User.find({ ParentUser: req.user.details.username }, { username: 1, role: 1, Parentpartnership: 1 }, function (err, userlist) {
        // console.log(userlist,userlist.length)
        var output = {};
        if (userlist.length == 0) {
          output.user = userlist;
          output.profit = {};
          socket.emit('casino-book-success', output);
          return;
        }
        var counter = 0;
        output.user = [];
        output.profit = {};
        var len = userlist.length;

        for (var i = 0; i < userlist.length; i++) {

          (function (user, indexs, callback) {

            var managerCommision = 0;
            var masterCommision = 0;
            var subadminCommision = 0;
            var adminCommision = 0;
            for (var k = 0; k < user.Parentpartnership.length; k++) {
              if (market.eventTypeId == user.Parentpartnership[k].sport_id) {
                managerCommision = user.Parentpartnership[k].manager;
                masterCommision = user.Parentpartnership[k].master;
                subadminCommision = user.Parentpartnership[k].subadmin;
                adminCommision = user.Parentpartnership[k].admin;
              }
            }

            var runnerProfit = {};
            var w = null;
            market.marketBook.runners.forEach(function (r, index) {
              runnerProfit[r.selectionId] = 0;
              if (index == market.marketBook.runners.length - 1) {
                var filter1 = {
                  "status": 'PENDING',
                  'marketId': market.marketId,
                  'marketType': "Casino",
                  'deleted': false
                };
                if (user.role == "user") { filter1.username = user.username; }
                if (user.role == "manager") { filter1.manager = user.username; }
                if (user.role == "master") { filter1.master = user.username; }
                if (user.role == "subadmin") { filter1.subadmin = user.username; }
                console.log(filter1);
                Bet.find(filter1, function (err, userBets) {
                  console.log(userBets.length)
                  if (userBets.length > 0) {
                    // Alluser.push = user.username;
                    userBets.forEach(function (val, bindex) {
                      // console.log(user,val.managerCommision, val.masterCommision ,val.subadminCommision ,val.adminCommision); 
                      var partnership = 100;
                      if (user.role == "manager") {
                        partnership = managerCommision;
                      }
                      if (user.role == "master") {
                        partnership = masterCommision;
                      }

                      if (user.role == "subadmin") {
                        partnership = subadminCommision;
                      }

                      if (user.role == "admin") {
                        partnership = adminCommision;
                      }
                      if (val.type == 'Back') {
                        for (var k in runnerProfit) {
                          if (k == val.runnerId) {
                            if (user.role != "user") {
                              runnerProfit[k] += -1 * (((val.rate - 1) * val.stake) * partnership / 100);
                            } else {
                              runnerProfit[k] += (((val.rate - 1) * val.stake) * partnership / 100);
                            }
                          } else {
                            if (user.role != "user") {
                              runnerProfit[k] -= -1 * (val.stake * partnership / 100);
                            } else {
                              runnerProfit[k] -= (val.stake * partnership / 100);
                            }

                          }
                        }
                      } else {
                        for (var k in runnerProfit) {
                          if (k == val.runnerId) {
                            if (user.role != "user") {
                              runnerProfit[k] -= -1 * (((val.rate - 1) * val.stake) * partnership / 100);
                            } else {
                              runnerProfit[k] -= (((val.rate - 1) * val.stake) * partnership / 100);
                            }
                          } else {
                            if (user.role != "user") {
                              runnerProfit[k] += -1 * (val.stake * partnership / 100);
                            } else {
                              runnerProfit[k] -= (((val.rate - 1) * val.stake) * partnership / 100);
                            }
                          }
                        }
                      }
                      if (bindex == userBets.length - 1) {
                        if (w != null) {
                          if (runnerProfit[w] == null) {
                            runnerProfit[w] = 0;
                          }
                        }
                        callback(runnerProfit, indexs);
                      }
                    });
                  } else {
                    callback(0, indexs);
                    // counter++;
                  }
                });
              }
            });

          })(userlist[i], i, function (profit, index) {
            counter++;
            console.log(counter, len, index, userlist[index].username);
            if (counter == len) {
              if (profit != 0) {
                output.user.push(userlist[index].username);
                output.profit[userlist[index].username] = profit;
              }
              console.log(output);
              socket.emit('casino-book-success', output);
            } else {
              if (profit != 0) {
                output.user.push(userlist[index].username);
                output.profit[userlist[index].username] = profit;
              }
              console.log(output);
            }
          });

        }

      });
    });
  } catch (e) {

  }


}

module.exports.getCasinoBook = async function (io, socket, request) {
  if (!request) return;
  if (!request.user) return;
  // console.log(request);
  var filter = {
    "manager": request.user.details.username,
    // "deleted": false,
    "result": 'ACTIVE'
  };

  if (request.user.details.role == "master") {
    filter = {
      "master": request.user.details.username,
      // "deleted": false,
      "result": 'ACTIVE'
    };
  }

  if (request.user.details.role == "subadmin") {
    filter = {
      "subadmin": request.user.details.username,
      // "deleted": false,
      "result": 'ACTIVE'
    };
  }

  if (request.user.details.role == "admin") {
    filter = {
      "admin": request.user.details.username,
      // "deleted": false,
      "result": 'ACTIVE'
    };
  }

  if (request.eventId) {
    filter.eventId = request.eventId;
  }

  Bet.distinct("marketId", filter, function (err, dbBetmarketids) {
    if (err) console.log("tttttt", err); logger.error(err);
    // console.log(dbBetmarketids.length);
    var AllRunners = [];
    var count = 1
    dbBetmarketids.forEach(async function (val, bindex) {
      // for (var i = 0; i < dbBetmarketids.length; i++) {
      // console.log(bindex,val)
      await Market.findOne({ marketId: val, marketType: 'LiveCasino' },{marketBook: 1}).exec(function (err, market) {
      // console.log(getRunner.marketBook.runners);
      if(market){
        AllRunners = AllRunners.concat(market.marketBook.runners);
        count = count + 1;
        // console.log(bindex,count,dbBetmarketids.length);
      if (count == dbBetmarketids.length + 1) {
            // console.log("AllRunners", AllRunners);
            request.AllRunners = AllRunners;
            callcasinobook(io, socket, request)
          }
      }
      })
    })
  });
};

function callcasinobook(io, socket, request){

  var filter = {
    "manager": request.user.details.username,
    // "deleted": false,
    "result": 'ACTIVE'
  };

  if (request.user.details.role == "master") {
    filter = {
      "master": request.user.details.username,
      // "deleted": false,
      "result": 'ACTIVE'
    };
  }

  if (request.user.details.role == "subadmin") {
    filter = {
      "subadmin": request.user.details.username,
      // "deleted": false,
      "result": 'ACTIVE'
    };
  }

  if (request.user.details.role == "admin") {
    filter = {
      "admin": request.user.details.username,
      // "deleted": false,
      "result": 'ACTIVE'
    };
  }

  if (request.eventId) {
    filter.eventId = request.eventId;
  }
  var runnerProfit = {};
  var runnerLoss = {};
  var w = null;
  request.AllRunners.forEach(function (r, index) {
    runnerProfit[r.selectionId] = 0;
    runnerLoss[r.selectionId] = 0;
})

// for (var k = 0; k < request.AllRunners.length; k++) {
//     runnerProfit[request.AllRunners[k]] = 0;
//     runnerLoss[request.AllRunners[k]] = 0;
// }

// console.log(runnerProfit,runnerLoss)
    Bet.find(filter).sort({ placedTime: -1 }).exec(function (err, userBets) {
      if (err) console.log("tttttt", err); logger.error(err);
      // console.log(dbBets)
      // console.log("success", userBets.length);
      if (userBets.length > 0) {
        // Alluser.push = user.username;
        var count = 1;
        userBets.forEach(async function (val, bindex) {
          await User.findOne({ username: val.username }, { Parentpartnership: 1 }).exec(function (err, users) {
          // console.log(users)
          var managerCommision = 0;
          var masterCommision = 0;
          var subadminCommision = 0;
          var adminCommision = 0;
          for (var k = 0; k < users.Parentpartnership.length; k++) {
            if (users.Parentpartnership[k].sport_id == "c9") {
              managerCommision = users.Parentpartnership[k].manager;
              masterCommision = users.Parentpartnership[k].master;
              subadminCommision = users.Parentpartnership[k].subadmin;
              adminCommision = users.Parentpartnership[k].admin;
            }
          }


          // console.log(val.username, managerCommision, masterCommision, subadminCommision, adminCommision);
          var partnership = 100;
          if (request.user.details.role == "manager") {
            partnership = managerCommision;
          }
          if (request.user.details.role == "master") {
            partnership = masterCommision;
          }

          if (request.user.details.role == "subadmin") {
            partnership = subadminCommision;
          }

          if (request.user.details.role == "admin") {
            partnership = adminCommision;
          }
          // console.log(val.runnerId,val.type,val.stake,val.ratestake)
          if (val.type == 'Back') {
            // for (var k in runnerProfit) {
            //   if (k == val.runnerId) {
            //     runnerProfit[k] += ((val.stake) * partnership / 100);
            //     runnerLoss[k] += ((val.ratestake) * partnership / 100);
            //   } else {
                runnerProfit[val.runnerId] += ((val.stake) * partnership / 100);
                runnerLoss[val.runnerId] += ((val.ratestake) * partnership / 100);
            //   }
            // }
            count = count + 1;
          } else {
            // for (var k in runnerProfit) {
            //   if (k == val.runnerId) {
            //     runnerProfit[k] += ((val.stake) * partnership / 100);
            //     runnerLoss[k] += ((val.ratestake) * partnership / 100);
            //   } else {
                runnerProfit[val.runnerId] += ((val.stake) * partnership / 100);
                runnerLoss[val.runnerId] += ((val.ratestake) * partnership / 100);
            //   }
            // }
            count = count + 1;
          }

          // if (val.type == 'Back') {
          //   runnerProfit[val.runnerId] += ((val.stake) * partnership / 100);
          //   runnerLoss[val.runnerId] += ((val.ratestake) * partnership / 100);
          // } else {
          //   runnerProfit[val.runnerId] += ((val.stake) * partnership / 100);
          //   runnerLoss[val.runnerId] += ((val.ratestake) * partnership / 100);
          // }
          // count = count + 1;
          // console.log(bindex,count,userBets.length + 1)
          if (count == userBets.length + 1) {
            // console.log(runnerProfit, runnerLoss)
            for (var k = 0; k < request.AllRunners.length; k++) {
              request.AllRunners[k].profit = runnerProfit[request.AllRunners[k].selectionId];
              request.AllRunners[k].loss = runnerLoss[request.AllRunners[k].selectionId];
            }
            // console.log(request.AllRunners);
            socket.emit('casino-book-success', request.AllRunners);
          }
        })
          
          // console.log(runnerProfit, runnerLoss)
        });
        
      }
      //  socket.emit('get-bets-success', dbBets);


    });

}

module.exports.getUserBookmakerBook = function (io, socket, req) {
  if (!req) return;
  if (!req.user) return;

  // console.log(req)
  try {
    // console.log(req)
    Market.findOne({ eventId: req.eventId, marketType: 'Special' }, function (err, market) {
      // console.log(market)
      if (!market) return;
      var byname = String("username");
      var filter = {
        "ParentUser": req.user.details.username,
        'marketId': market.marketId,
        'marketType': "Special",
        'deleted': false
      };
      var filter1 = {
        "status": 'MATCHED',
        'marketId': market.marketId,
        'marketType': "Special",
        'deleted': false
      };

      if (req.user.details.role == "master") {
        byname = String("manager");
        filter = {
          "ParentUser": req.user.details.username,
          'marketId': market.marketId,
          'marketType': "Special",
          'deleted': false
        };
      }

      if (req.user.details.role == "subadmin") {
        byname = String("master");
        filter = {
          "ParentUser": req.user.details.username,
          'marketId': market.marketId,
          'marketType': "Special",
          'deleted': false
        };
      }

      if (req.user.details.role == "admin") {
        byname = String("subadmin");
        filter = {
          "ParentUser": req.user.details.username,
          'marketId': market.marketId,
          'marketType': "Special",
          'deleted': false
        };
      }
      // console.log(byname,filter);
      User.find({ ParentUser: req.user.details.username }, { username: 1, role: 1 }, function (err, userlist) {
        // console.log(userlist)
        var output = {};
        if (userlist.length == 0) {
          output.user = userlist;
          output.profit = {};
          socket.emit('user-bookmer-success', output);
          return;
        }
        var counter = 0;
        output.user = [];
        output.profit = {};
        var len = userlist.length;

        for (var i = 0; i < userlist.length; i++) {
          (function (user, indexs, callback) {
            var runnerProfit = {};
            var w = null;
            market.marketBook.runners.forEach(function (r, index) {
              runnerProfit[r.selectionId] = 0;
              if (index == market.marketBook.runners.length - 1) {
                var filter1 = {
                  "status": 'MATCHED',
                  'marketId': market.marketId,
                  'marketType': "Special",
                  'deleted': false
                };
                if (user.role == "user") { filter1.username = user.username; }
                if (user.role == "manager") { filter1.manager = user.username; }
                if (user.role == "master") { filter1.master = user.username; }
                if (user.role == "subadmin") { filter1.subadmin = user.username; }
                // console.log(filter1);
                Bet.find(filter1, function (err, userBets) {
                  if (userBets.length > 0) {
                    userBets.forEach(function (val, bindex) {
                      // console.log(user,val.managerCommision, val.masterCommision ,val.subadminCommision ,val.adminCommision); 
                      var partnership = 100;
                      if (user.role == "manager") {
                        partnership = val.managerCommision;
                      }
                      if (user.role == "master") {
                        partnership = val.masterCommision;
                      }

                      if (user.role == "subadmin") {
                        partnership = val.subadminCommision;
                      }

                      if (user.role == "admin") {
                        partnership = val.adminCommision;
                      }

                      if (val.type == 'Back') {
                        for (var k in runnerProfit) {
                          if (k == val.runnerId) {
                            if (user.role != "user") {
                              runnerProfit[k] += -1 * (((val.rate - 1) * val.stake) * partnership / 100);
                            } else {
                              runnerProfit[k] += (((val.rate - 1) * val.stake) * partnership / 100);
                            }
                          } else {
                            if (user.role != "user") {
                              runnerProfit[k] -= -1 * (val.stake * partnership / 100);
                            } else {
                              runnerProfit[k] -= (val.stake * partnership / 100);
                            }
                          }
                        }
                      } else {
                        for (var k in runnerProfit) {
                          if (k == val.runnerId) {
                            if (user.role != "user") {
                              runnerProfit[k] -= -1 * (((val.rate - 1) * val.stake) * partnership / 100);
                            } else {
                              runnerProfit[k] -= (((val.rate - 1) * val.stake) * partnership / 100);
                            }
                          } else {
                            if (user.role != "user") {
                              runnerProfit[k] += -1 * (val.stake * partnership / 100);
                            } else {
                              runnerProfit[k] += (val.stake * partnership / 100);
                            }
                          }
                        }
                      }
                      if (bindex == userBets.length - 1) {
                        if (w != null) {
                          if (runnerProfit[w] == null) {
                            runnerProfit[w] = 0;
                          }
                        }
                        callback(runnerProfit, indexs);
                      }
                    });
                  } else {
                    callback(0, indexs);
                    // counter++;
                  }
                });
              }
            });

          })(userlist[i], i, function (profit, index) {
            counter++;
            // console.log(counter,len);
            if (counter == len) {
              if (profit != 0) {
                output.user.push(userlist[index].username);
                output.profit[userlist[index].username] = profit;
              }
              // console.log(output);
              socket.emit('user-bookmer-success', output);
            } else {
              if (profit != 0) {
                output.user.push(userlist[index].username);
                output.profit[userlist[index].username] = profit;
              }
            }
          });

        }

      });
    });
  } catch (e) {

  }

}

///////////----------------- old functons -----------------/////////

module.exports.olduserBetLock = async function (req, res) {
  try {
    // console.log(req.body.filter);
    let { details, type, eventId, userid } = req.body;
    await Market.distinct('marketId', {
      eventId: eventId,
      marketType: {
        $nin: ["SESSION"]
      },
    }, function (err, distinctmarket) {
      if (err) {
        res.send({ data: err, error: true, message: "No Application Found" });
      }
      for (var i = 0; i < distinctmarket.length; i++) {
        Market.findOne({ "marketId": distinctmarket[i] }, { userBlocks: 1 })
          .then(async data => {
            if (data) {
              let lockusers = [];
              lockusers = data.userBlocks;
              if (type === "all") {
                // await User.distinct('username', {
                //   manager: details.manager,
                // }, function (err, distinctuser) {
                //   for (var j = 0; j < distinctuser.length; j++) {
                //     if (!lockusers.includes(distinctuser[j])) {
                //       lockusers.push(distinctuser[j]);
                //     }
                //   }
                // });
                lockusers.push(details.username);
              } else {
                // console.log(userid.length)
                for (var j = 0; j < userid.length; j++) {
                  if (!lockusers.includes(userid[j])) {
                    lockusers.push(userid[j]);
                  }
                }
              }
              const update = {
                userBlocks: lockusers,
              };

              Market.findOneAndUpdate({ "marketId": distinctmarket[i] },
                update, async function (err, docs) {
                  if (err) {
                    console.log("DB error: Application error ", err);
                  }
                  else {



                    res.json({ response: docs, error: false, "message": "server response success" });
                  }
                })
            }
          })
      }
    });
  } catch (err) {
    console.log(err)
    res.json({ response: docs, error: true, "message": "server response success" });
  }

}

module.exports.olduserRemoveBetLock = async function (req, res) {
  try {
    // console.log(req.body.filter);
    let { details, type, eventId, eventType, marketId, userid } = req.body;
    await Market.distinct('marketId', {
      eventId: eventId,
      marketType: {
        $nin: ["SESSION"]
      },
    }, function (err, distinctmarket) {
      if (err) {
        res.send({ data: err, error: true, message: "No Application Found" });
      }
      for (var i = 0; i < distinctmarket.length; i++) {
        Market.findOne({ "marketId": distinctmarket[i] }, { userBlocks: 1 })
          .then(async data => {
            if (!data) {
              res.send({ data: {}, success: false, message: "No Application Found" });
            }
            else {
              let lockusers = [];
              lockusers = data.userBlocks;
              console.log("lockuser", lockusers)
              if (type === "all") {
                await User.distinct('username', {
                  manager: details.manager,
                }, function (err, distinctuser) {
                  for (var j = 0; j < distinctuser.length; j++) {
                    console.log("all lock", distinctuser[j]); // 0
                    const index = lockusers.findIndex(key => key === distinctuser[j]);
                    console.log(index); // 0
                    lockusers.splice(index, 1);
                    // console.log(someArray);
                  }
                });
              } else {
                // console.log(userid.length)
                for (var j = 0; j < userid.length; j++) {
                  console.log("single lock", userid[j]); // 0
                  const index = lockusers.findIndex(key => key === userid[j]);
                  console.log(index); // 0
                  lockusers.splice(index, 1);
                  // console.log(someArray);
                }
              }


              const update = {
                userBlocks: lockusers,
              };

              Market.findOneAndUpdate({ "marketId": distinctmarket[i] },
                update, async function (err, docs) {
                  if (err) {
                    console.log("DB error: Application error ", err);
                  }
                  else {
                    res.json({ response: docs, error: false, "message": "server response success" });
                  }
                })
            }
          })
      }
    });
  } catch (err) {
    console.log(err)
    res.json({ response: docs, error: true, "message": "server response success" });
  }

}

module.exports.olduserFancyLock = async function (req, res) {
  try {
    // console.log(req.body.filter);
    let { details, type, eventId, eventType, marketId, userid } = req.body;
    await Market.distinct('marketId', {
      eventId: eventId,
      marketType: {
        $in: ["SESSION"]
      },
    }, function (err, distinctmarket) {
      if (err) {
        res.send({ data: err, error: true, message: "No Application Found" });
      }
      for (var i = 0; i < distinctmarket.length; i++) {
        Market.findOne({ "marketId": distinctmarket[i] }, { userfancyBlocks: 1 })
          .then(async data => {
            if (!data) {
              res.send({ data: {}, success: false, message: "No Application Found" });
            }
            else {
              let lockusers = [];
              lockusers = data.userfancyBlocks;
              if (type === "all") {
                await User.distinct('username', {
                  manager: details.manager,
                }, function (err, distinctuser) {
                  for (var j = 0; j < distinctuser.length; j++) {
                    if (!lockusers.includes(distinctuser[j])) {
                      lockusers.push(distinctuser[j]);
                    }
                  }
                });
              } else {
                // console.log(userid.length)
                for (var j = 0; j < userid.length; j++) {
                  if (!lockusers.includes(userid[j])) {
                    lockusers.push(userid[j]);
                  }
                }
              }


              const update = {
                userfancyBlocks: lockusers,
              };

              Market.findOneAndUpdate({ "marketId": distinctmarket[i] },
                update, async function (err, docs) {
                  if (err) {
                    console.log("DB error: Application error ", err);
                  }
                  else {
                    res.json({ response: docs, error: false, "message": "server response success" });
                  }
                })
            }
          })
      }
    });
  } catch (err) {
    console.log(err)
    res.json({ response: docs, error: true, "message": "server response success" });
  }
}

module.exports.olduserRemoveFancyLock = async function (req, res) {
  try {
    // console.log(req.body.filter);
    let { details, type, eventId, eventType, marketId, userid } = req.body;
    await Market.distinct('marketId', {
      eventId: eventId,
      marketType: {
        $in: ["SESSION"]
      },
    }, function (err, distinctmarket) {
      if (err) {
        res.send({ data: err, error: true, message: "No Application Found" });
      }
      for (var i = 0; i < distinctmarket.length; i++) {
        Market.findOne({ "marketId": distinctmarket[i] }, { userfancyBlocks: 1 })
          .then(async data => {
            if (!data) {
              res.send({ data: {}, success: false, message: "No Application Found" });
            }
            else {
              let lockusers = [];
              lockusers = data.userfancyBlocks;
              console.log("lockuser", lockusers)
              if (type === "all") {
                await User.distinct('username', {
                  manager: details.manager,
                }, function (err, distinctuser) {
                  for (var j = 0; j < distinctuser.length; j++) {
                    console.log("all lock", distinctuser[j]); // 0
                    const index = lockusers.findIndex(key => key === distinctuser[j]);
                    console.log(index); // 0
                    lockusers.splice(index, 1);
                    // console.log(someArray);
                  }
                });
              } else {
                // console.log(userid.length)
                for (var j = 0; j < userid.length; j++) {
                  console.log("single lock", userid[j]); // 0
                  const index = lockusers.findIndex(key => key === userid[j]);
                  console.log(index); // 0
                  lockusers.splice(index, 1);
                  // console.log(someArray);
                }
              }


              const update = {
                userfancyBlocks: lockusers,
              };

              Market.findOneAndUpdate({ "marketId": distinctmarket[i] },
                update, async function (err, docs) {
                  if (err) {
                    console.log("DB error: Application error ", err);
                  }
                  else {
                    res.json({ response: docs, error: false, "message": "server response success" });
                  }
                })
            }
          })
      }
    });
  } catch (err) {
    console.log(err)
    res.json({ response: docs, error: true, "message": "server response success" });
  }

}

module.exports.gameDetails = async function (req, res) {
  try {

    WebToken.findOne({

    }, function (err, dbToken) {

      if (!dbToken) return;
      var token = dbToken.token;
      var options = {
        method: 'GET',
        url: 'https://api.qtplatform.com/v1/game-rounds/' + req.params.roundId,
        headers: {
          'postman-token': 'a7e7a003-10f4-347e-27df-e834e39356e6',
          'cache-control': 'no-cache',
          'content-type': 'application/json',
          'Time-Zone': 'Asia/Calcutta',
          authorization: 'Bearer ' + token
        },
        json: true
      };

      request(options, function (error, response, body) {
        // console.log(error,response,body)
        return res.json(
          {
            response: body,
            error: false,
            "message": "success"
          });
      });
    });
  }
  catch (e) {
    console.log(e)
    return res.json(
      {
        response: e,
        roundId: req.params.roundId,
        error: true,
        "message": "error"
      });
  }
}

module.exports.marketUnsettlementBet = function (io, socket, request) {

  try {
    LogMinus.distinct('marketName', {
      "deleted": false
    }, function (err, logList) {
      if (!logList) return;
      if (logList.length == 0) return;
      console.log(logList)
      var output = {};
      output.list = logList;
      output.userList = {};
      var counter = 0;
      var len = logList.length;
      for (var i = 0; i < logList.length; i++) {
        (function (user, index, callback) {


          LogMinus.distinct('username', {
            "deleted": false,
            marketName: user
          }, function (err, userListk) {

            callback(userListk, index);
          });

        })(logList[i], i, function (userListk, index) {
          counter++;
          if (counter == len) {
            output.userList[logList[index]] = userListk;
            socket.emit('get-unsettle-success', output);

          }
          else {
            output.userList[logList[index]] = userListk;
          }
        });
      }
    })


  } catch (e) {

  }
}

module.exports.refreshLog = function (io, socket, request) {
  try {

  } catch (e) {

  }
}

module.exports.getSummaryView = function (io, socket, request) {
  try {
    if (!request) return;
    if (!request.user) return;
    if (!request.user.details) return;

    let date_obj = new Date();
    let requestedTime = new Date(new Date().setDate(date_obj.getDate() - 15));
    var counter = 0;
    var output = [];
    Log.aggregate(
      [{
        $match: {
          time: {
            $gt: requestedTime
          },
          'username': request.username,
          'subAction': {
            '$ne': 'MATCH_FEE'
          }
        }
      },
      {
        $group: {
          _id: {
            marketId: "$marketId"
          },

          count: {
            $sum: 1
          }
        }
      },
      {
        $match: {
          count: {
            $gte: 2
          }
        }
      },


      ],
      function (err, event) {
        // console.log(JSON.stringify(event))

        var marketIdArr = [];

        event.forEach((val) => {
          if (val) {
            if (val['_id']['marketId'] != null) {
              marketIdArr.push(val['_id']['marketId']);
            }

          }
        });

        var len = marketIdArr.length;
        for (var i = 0; i < marketIdArr.length; i++) {

          (function (marketId, index, callback) {

            Log.find({
              "marketId": marketId,
              username: request.username,
              'subAction': {
                '$ne': 'MATCH_FEE'
              }
            }, function (err, userlist) {

              callback(userlist, index);
            });


          })(marketIdArr[i], i, function (event, index) {

            counter++;
            if (counter == len) {
              if (event) {


                output.push(event);

                socket.emit('get-summary-view-success', output);


              }


            } else {
              if (event) {

                output.push(event);

              }

            }


          });
        }

      })

  } catch (err) {

  }

}

module.exports.getSummaryPage = function (io, socket, request) {
  try {
    if (!request) return;
    if (!request.user) return;
    if (!request.user.details) return;


    let date_obj = new Date();
    var counter = 0;
    var output = [];
    var varcol;
    //output = [];


    let requestedTime = new Date(new Date().setDate(date_obj.getDate() - 15));
    Bet.distinct('username', {
      'marketId': request.market.marketId
    }, function (err, userlist) {
      if (!userlist) return;
      var len = userlist.length;
      for (var i = 0; i < userlist.length; i++) {

        (function (user, index, callback) {
          Log.aggregate(
            [{
              $match: {
                time: {
                  $gt: requestedTime
                },
                'username': user,
                'marketId': request.market.marketId,
                'subAction': {
                  '$ne': 'MATCH_FEE'
                }
              }
            },
            {
              $group: {
                _id: {
                  marketId: "$marketId"
                },

                count: {
                  $sum: 1
                }
              }
            },
            {
              $match: {
                count: {
                  $gte: 2
                }
              }
            },


            ],
            function (err, event) {
              Log.find({
                "marketId": request.market.marketId,
                username: user,
                'subAction': {
                  '$ne': 'MATCH_FEE'
                }
              }, function (err, loglist) {
                callback(event, index, user, loglist);

              });
            });

        })(userlist[i], i, function (event, index, user, loglist) {
          counter++;
          //.log(event)
          if (counter == len) {
            if (event.length > 0) {
              if (event[0]['_id']['marketId'] != null) {
                varcol = {
                  'username': user,
                  logList: loglist
                }


              }
            }
            socket.emit('get-summary-page-success', output);

          } else {
            if (event.length > 0) {
              if (event[0]['_id']['marketId'] != null) {
                varcol = {
                  'username': user,
                  logList: loglist
                }
                output.push(varcol);
              }
            }

          }

        });

      }

    })

  } catch (err) {

  }

}

module.exports.getMarketLine = function (io, socket, request) {
  try {
    if (!request) return;
    if (!request.user) return;
    if (!request.user.details) return;

    Market.find({
      eventTypeId: '4',
      'marketType': 'MATCH_ODDS',
      'marketBook.status': 'OPEN',
      visible: true,

    }, function (err, market) {

      socket.emit('get-market-line-success', market);
    });

  } catch (err) {

  }

}

module.exports.getMarketFancy = function (io, socket, request) {
  try {
    if (!request) return;
    if (!request.user) return;
    if (!request.user.details) return;

    Market.find({
      'eventTypeId': '4',
      'eventId': request.eventId,
      'marketType': 'SESSION',
      visible: true,

    }, function (err, market) {

      socket.emit('get-market-fancy-success', market);
    });

  } catch (err) {

  }

}

module.exports.userLine = function (io, socket, request) {
  try {
    if (!request) return;
    if (!request.user) return;
    if (!request.user.details) return;

    User.find({

      'username': request.targetUser.username,
    }, function (err, user) {


      user.startDate = request.startDate;
      user.endDate = request.endDate;
      user.amount = request.amount;
      User.update({
        username: request.targetUser.username
      }, user, function (err, raw) {
        // console.log(raw)
      });


    });

  } catch (err) {

  }

}

module.exports.updateMarketLine = function (io, socket, request) {
  try {
    if (!request) return;
    if (!request.user) return;
    if (!request.user.details) return;

    Market.findOne({
      '_id': request.updatedMarket._id,
    }, function (err, market) {
      //console.log(market.totalMatched)
      if (market.totalMatched == '1') {

        market.totalMatched = '0';
        Market.update({
          marketId: request.updatedMarket.marketId
        }, market, function (err, raw) {

        });
      } else {

        market.totalMatched = '1';
        Market.update({
          marketId: request.updatedMarket.marketId
        }, market, function (err, raw) { });

      }
    });

  } catch (err) {

  }

}

module.exports.getSportBookMarkets = function (io, socket, request) {
  try {
    if (!request) return;
    if (!request.user) return;
    if (!request.user.details) return;
    // logger.info("getSportBookMarkets: " + JSON.stringify(request));

    var filter = {};

    if (request.user.details.role == 'user') {

      if (!request.filter || !request.sort) return;

      Market.find(request.filter).sort(request.sort).exec(function (err, result) {
        if (err) logger.debug(err);
        // console.log(result);
        // console.log("test done");
        socket.emit("get-sportbookmarkets-success", result);
      });
    }
    if (request.user.details.role == 'manager') {
      if (!request.filter || !request.sort) return;
      User.findOne({
        hash: request.user.key,
        username: request.user.details.username,
        role: 'manager',
        deleted: false,
        status: 'active'
      }, function (err, dbManager) {
        if (err) logger.error(err);
        if (!dbManager) {
          logger.error("Invalid Access: " + JSON.stringify(request));
          return;
        }
        var filter = request.filter;
        filter['managers'] = request.user.details.username;
        Market.find(filter).sort(request.sort).exec(function (err, result) {
          if (err) logger.error(err);
          socket.emit("get-markets-success", result);
        });
      });
    }
    if (request.user.details.role == 'partner') {
      if (!request.filter || !request.sort) return;
      User.findOne({
        hash: request.user.key,
        username: request.user.details.username,
        role: 'partner',
        deleted: false,
        status: 'active'
      }, function (err, dbManager) {
        if (err) logger.error(err);
        if (!dbManager) {
          logger.error("Invalid Access: " + JSON.stringify(request));
          return;
        }
        var filter = request.filter;
        filter['managers'] = request.user.details.manager;
        Market.find(filter).sort(request.sort).exec(function (err, result) {
          if (err) logger.error(err);
          socket.emit("get-markets-success", result);
        });
      });
    }
    if (request.user.details.role == 'admin') {
      if (!request.filter || !request.sort) return;
      User.findOne({
        hash: request.user.key,
        username: request.user.details.username,
        role: 'admin',
        deleted: false,
        status: 'active'
      }, function (err, dbAdmin) {
        if (err) logger.error(err);
        if (!dbAdmin) {
          logger.error("Invalid Access: " + JSON.stringify(request));
          return;
        }
        Market.find(request.filter).sort(request.sort).exec(function (err, result) {
          if (err) logger.error(err);
          socket.emit("get-markets-success", result);
        });
      });
    }

    if (request.user.details.role == 'operator') {
      if (!request.filter || !request.sort) return;
      User.findOne({
        hash: request.user.key,
        username: request.user.details.username,
        role: 'operator',
        deleted: false,
        status: 'active'
      }, function (err, dbAdmin) {
        if (err) logger.error(err);
        if (!dbAdmin) {
          logger.error("Invalid Access: " + JSON.stringify(request));
          return;
        }
        Market.find(request.filter).sort(request.sort).exec(function (err, result) {
          if (err) logger.error(err);
          socket.emit("get-markets-success", result);
        });
      });
    }
  } catch (err) {
    if (err) logger.error({
      'function': 'getsportbook',
      error: err
    });
  }
};

module.exports.getVedio = function (io, socket, requestall) {
  try {
    //console.log(requestall);
    // logger.info('getVedio: ' + JSON.stringify(requestall));
    if (requestall.eventTypeId == '2') {
      var dataurl = 'http://185.181.9.7:81/?sp=tennis';
    } else if (requestall.eventTypeId == '1') {
      var dataurl = 'http://185.181.9.7:81/?sp=soccer';
    } else if (requestall.eventTypeId == '4') {
      var dataurl = 'http://185.181.9.7:81/?sp=cricket';
    } else {
      var dataurl = '';
    }

    request(dataurl, function (error, response, body) {
      try {
        var obj = JSON.parse(response.body);
        socket.emit('get-vedio-success', obj);
      } catch (err) {

        socket.emit('get-vedio-success', []);
      }


    });
  } catch (err) {
    if (err) logger.error({
      'function': 'getvedio',
      error: err
    });
  }
};

module.exports.getScore = function (io, socket, requestall) {
  try {
    //console.log(requestall);
    // logger.info('getScore: ' + JSON.stringify(requestall));
    if (requestall.eventTypeId == '2') {
      var dataurl = 'http://185.181.9.158:81/?sp=tennis';
    } else if (requestall.eventTypeId == '1') {
      var dataurl = 'http://185.181.9.158:81/?sp=soccer';
    } else if (requestall.eventTypeId == '4') {
      var dataurl = 'http://185.181.9.158:81/?sp=cricket';
    } else {
      var dataurl = '';
    }

    request(dataurl, function (error, response, body) {
      try {
        var obj = JSON.parse(response.body);
        socket.emit('get-score-success', obj);
      } catch (err) {

        socket.emit('get-score-success', []);
      }


    });
  } catch (err) {
    if (err) logger.error({
      'function': 'getscore',
      error: err
    });
  }
};

module.exports.getMarketAnalasis = function (io, socket, request) {

  try {
    if (!request) return;
    if (!request.user) return;
    //logger.info('getMarketAnalasis: ' + JSON.stringify(request));
    var output = {};
    var counter = 0;
    var arrprofit = [];


    if (request.user.details.role == 'admin' || request.user.details.role == 'operator') {

      Bet.distinct("marketId", {
        status: 'MATCHED',
        'result': 'ACTIVE',
        deleted: false
      }, function (err, marketUnique) {
        // console.log(marketUnique);
        Market.find({
          "marketId": {
            $in: marketUnique
          }
        }).sort({
          $natural: -1
        }).exec(function (err, market) {


          socket.emit('get-market-analasis-success', market);

        });


      });


    }


    if (request.user.details.role == 'subadmin') {
      console.log("step11111111111111111111111")
      Bet.distinct("marketId", {
        status: 'MATCHED',
        'result': 'ACTIVE',
        'subadmin': request.user.details.username,
        deleted: false
      }, function (err, marketUnique) {
        console.log("step11111111111111111111111444")
        // console.log(marketUnique);
        Market.find({
          "marketId": {
            $in: marketUnique
          }
        }).sort({
          $natural: -1
        }).exec(function (err, market) {



          socket.emit('get-markets-analasis-success', {
            market: market
          });

        });
      });



    }

    if (request.user.details.role == 'master') {

      Bet.distinct("marketId", {
        status: 'MATCHED',
        'result': 'ACTIVE',
        'master': request.user.details.username,
        deleted: false
      }, function (err, marketUnique) {
        // console.log(marketUnique);
        Market.find({
          "marketId": {
            $in: marketUnique
          }
        }).sort({
          $natural: -1
        }).exec(function (err, market) {


          socket.emit('get-market-analasis-success', market);

        });


      });

    }

    if (request.user.details.role == 'manager') {
      Bet.distinct("marketId", {
        status: 'MATCHED',
        'result': 'ACTIVE',
        'manager': request.user.details.username,
        deleted: false
      }, function (err, marketUnique) {
        // console.log(marketUnique);
        Market.find({
          "marketId": {
            $in: marketUnique
          }
        }).sort({
          $natural: -1
        }).exec(function (err, market) {


          socket.emit('get-market-analasis-success', market);

        });


      });


    }

    if (request.user.details.role == 'partner') {
      Bet.distinct("marketId", {
        status: 'MATCHED',
        'result': 'ACTIVE',
        'manager': request.user.details.manager,
        deleted: false
      }, function (err, marketUnique) {
        // console.log(marketUnique);
        Market.find({
          "marketId": {
            $in: marketUnique
          }
        }).sort({
          $natural: -1
        }).exec(function (err, market) {


          socket.emit('get-market-analasis-success', market);

        });


      });


    }


  } catch (err) {
    console.log(err)
    if (err) logger.error({
      'function': 'marketanalais',
      error: err
    });
  }
};

module.exports.getMarketSummary = function (io, socket, request) {
  try {
    if (!request) return;
    if (!request.user) return;
    //logger.info('getMarketSummary: ' + JSON.stringify(request));
    //console.log(request.user);
    var output = {};
    User.findOne({
      username: request.user.details.username,
      role: request.user.details.role,
      hash: request.user.key,
      deleted: false
    }, function (err, dbUser) {
      if (err) logger.debug(err);
      if (!dbUser) {
        logger.error("Invalid Access: " + JSON.stringify(request));
        socket.emit('logout');
        return;
      }


      if (dbUser.role == 'admin') {

        Market.find({
          'eventId': request.eventId,
          "openDate": {
            $gte: (new Date((new Date()).getTime() - (1 * 24 * 60 * 60 * 1000)))
          },
          'marketBook.status': 'CLOSED',
        }).sort({
          sort: 1
        }).exec(function (err, market) {

          socket.emit('get-market-summary-success', market);
        });

      }

      if (dbUser.role == 'manager') {

        Market.find({
          'eventId': request.eventId,
          "openDate": {
            $gte: (new Date((new Date()).getTime() - (1 * 24 * 60 * 60 * 1000)))
          },
          'marketBook.status': 'CLOSED',
        }).sort({
          $natural: -1
        }).exec(function (err, market) {

          socket.emit('get-market-summary-success', market);
        });

      }
    });
  } catch (err) {
    if (err) logger.error({
      'function': 'marketsummary',
      error: err
    });
  }
};

module.exports.getProfit = function (io, socket, request) {
  try {
    if (!request) return;
    if (!request.user) return;
    //logger.info('getProfit: ' + JSON.stringify(request));
    var output = {};
    var counter = 0;
    var arrprofit = [];

    if (request.user.details.role == 'master') {

      User.distinct("username", {
        'master': request.user.details.username,
        role: 'manager'
      }, function (err, managers) {
        Bet.distinct("manager", {
          status: 'MATCHED',
          'marketId': request.filter.marketId,
          'manager': {
            $in: managers
          },
          deleted: false
        }, function (err, userUnique) {
          //  console.log(userUnique);
          User.find({
            "username": {
              $in: userUnique
            },

          }, {
            username: 1,
            hyper: 1,
            master: 1,
            manager: 1,

          }).sort({
            'username': -1
          }).exec(function (err, users) {

            output.users = users;
            var len = users.length;
            output.bets = {};

            socket.emit('get-profit-success', output);

          });


        });
      });


    }

    if (request.user.details.role == 'subadmin') {

      User.distinct("username", {
        'subadmin': request.user.details.username,
        role: 'master'
      }, function (err, managers) {
        Bet.distinct("master", {
          status: 'MATCHED',
          'marketId': request.filter.marketId,
          'master': {
            $in: managers
          },
          deleted: false
        }, function (err, userUnique) {
          //  console.log(userUnique);
          User.find({
            "username": {
              $in: userUnique
            },

          }, {
            username: 1,
            hyper: 1,
            master: 1,
            manager: 1,

          }).sort({
            'username': -1
          }).exec(function (err, users) {

            output.users = users;
            var len = users.length;
            output.bets = {};

            socket.emit('get-profit-success', output);

          });


        });
      });


    }


    if (request.user.details.role == 'admin') {
      Bet.distinct("subadmin", {
        status: 'MATCHED',
        'marketId': request.filter.marketId,
        deleted: false
      }, function (err, userUnique) {
        //console.log(userUnique);
        User.find({
          "username": {
            $in: userUnique
          },

        }, {
          username: 1,
          hyper: 1,
          master: 1,
          manager: 1,

        }).sort({
          'username': -1
        }).exec(function (err, users) {

          output.users = users;
          var len = users.length;
          output.bets = {};

          socket.emit('get-profit-success', output);

        });


      });

    }


  } catch (err) {
    if (err) logger.error({
      'function': 'getprofit',
      error: err
    });
  }
};

module.exports.getUserProfit = function (io, socket, request) {
  try {
    if (!request) return;
    if (!request.user) return;
    //logger.info('getProfit: ' + JSON.stringify(request));
    var output = {};
    var counter = 0;
    var arrprofit = [];


    if (request.user.details.role == 'admin') {

      if (request.user.details.roleSub) {
        User.distinct("username", {
          'manager': request.user.details.username
        }, function (err, managers) {
          Bet.distinct("username", {
            status: 'MATCHED',
            'manager': {
              $in: managers
            },
            'marketId': request.filter.marketId,
            deleted: false
          }, function (err, userUnique) {
            // console.log(userUnique);
            User.find({
              "username": {
                $in: userUnique
              },
              type: request.filter.type
            }, {
              username: 1,
              hyper: 1,
              master: 1,
              manager: 1,

            }).sort({
              'username': -1
            }).exec(function (err, users) {

              output.users = users;
              var len = users.length;
              output.bets = {};

              socket.emit('get-user-profit-success', output);

            });

          });
        });
      } else {
        Bet.distinct("username", {
          status: 'MATCHED',
          'marketId': request.filter.marketId,
          deleted: false
        }, function (err, userUnique) {
          // console.log(userUnique);
          User.find({
            "username": {
              $in: userUnique
            },
            type: request.filter.type
          }, {
            username: 1,
            hyper: 1,
            master: 1,
            manager: 1,

          }).sort({
            'username': -1
          }).exec(function (err, users) {

            output.users = users;
            var len = users.length;
            output.bets = {};

            socket.emit('get-user-profit-success', output);

          });


        });
      }


    }


  } catch (err) {
    if (err) logger.error({
      'function': 'getprofit',
      error: err
    });
  }
};

module.exports.getteenpatiProfit = function (io, socket, request) {
  try {
    if (!request) return;
    if (!request.user) return;
    //logger.info('getProfit: ' + JSON.stringify(request));
    var output = {};
    var counter = 0;
    var arrprofit = [];


    if (request.user.details.role == 'admin') {
      Bet.distinct("manager", {
        status: 'MATCHED',
        'marketId': request.filter.marketId,
        deleted: false
      }, function (err, userUnique) {
        // console.log(userUnique);
        User.find({
          "username": {
            $in: userUnique
          }
        }, {
          username: 1,
          hyper: 1,
          master: 1,
          manager: 1,

        }).sort({
          'username': -1
        }).exec(function (err, users) {

          output.users = users;
          var len = users.length;
          output.bets = {};

          socket.emit('get-teenpati-profit-success', output);

        });


      });


    }

  } catch (err) {
    if (err) logger.error({
      'function': 'teenpati',
      error: err
    });
  }

};

module.exports.getvirtualProfit = function (io, socket, request) {
  try {
    if (!request) return;
    if (!request.user) return;
    //logger.info('getProfit: ' + JSON.stringify(request));
    var output = {};
    var counter = 0;
    var arrprofit = [];


    if (request.user.details.role == 'admin') {
      Bet.distinct("manager", {
        status: 'MATCHED',
        'marketId': request.filter.marketId,
        deleted: false
      }, function (err, userUnique) {
        //  console.log(userUnique);
        User.find({
          "username": {
            $in: userUnique
          }
        }, {
          username: 1,
          hyper: 1,
          master: 1,
          manager: 1,

        }).sort({
          'username': -1
        }).exec(function (err, users) {

          output.users = users;
          var len = users.length;
          output.bets = {};

          socket.emit('get-virtual-profit-success', output);

        });


      });


    }

  } catch (err) {
    if (err) logger.error({
      'function': 'getvirtualprofit',
      error: err
    });
  }

};

module.exports.createEventMarket = function (io, socket, request) {
  try {
    if (!request) return;
    if (!request.user) return;
    Event.findOne({
      'event.id': request.eventId
    }).exec(function (err, event) {
      var marketDb = [{
        "runnerName": request.team1,
        "rate": request.back1,
        "layrate": request.lay1,
      },
      {
        "runnerName": request.team2,
        "rate": request.back2,
        "layrate": request.lay2,
      },

      ];

      var marketId = 1. + '-' + Math.floor(Math.random() * 100000000);
      var runners = [];
      for (var m = 0; m < marketDb.length; m++) {
        var selectionidAll = Math.floor(Math.random() * 1000000);
        var selection = {
          "selectionId": selectionidAll,
          "runnerName": marketDb[m].runnerName,
          "status": "ACTIVE",
          "availableToBack": {
            "price": marketDb[m].rate,
            "size": "100"
          },
          "availableToLay": {
            "price": marketDb[m].layrate,
            "size": "100"
          },
        };
        runners.push(selection);
      }

      var m2 = {
        eventTypeId: "4",
        eventName: event.event.name,
        eventId: event.event.id,
        openDate: event.event.openDate,
        marketId: marketId,
        marketType: "Special",
        marketName: "Bookmaker Market",
        marketBook: {
          marketId: marketId,
          status: "OPEN",

          runners: runners,
        },
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
        // console.log(m2);
        var market = new Market(m2);
        market.save(function (err) {

          //console.log('save new market');
          if (err) logger.debug(err);
          socket.emit("create-eventmarket-success", {
            message: "market create success"
          });

        });
      });
    });

  } catch (err) {
    if (err) logger.error({
      'function': 'createeventmarket',
      error: err
    });
  }
}

module.exports.setRate = function (io, socket, request) {
  try {
    if (!request) return;
    if (!request.user) return;
    // console.log(request.market);
    var runners = request.market.runners;

    var newRunners = [];
    for (var l = 0; l < runners.length; l++) {
      newRunners[l] = {};
      newRunners[l].status = 'ACTIVE';
      //newRunners[l].sortPriority = runners[l].state.sortPriority;
      newRunners[l].selectionId = runners[l].selectionId;
      if (l == 0) {
        if (request.back1) {
          if (request.back1 > 0) {
            newRunners[l].availableToBack = {
              price: request.back1,
              size: 0.00
            };
          }
        }

      } else {
        if (request.back2 > 0) {
          newRunners[l].availableToBack = {
            price: request.back2,
            size: 0.00
          };
        }

      }
    }
    request.market.marketBook.runners = newRunners;

    Market.update({
      marketId: request.market.marketId
    }, request.market, function (err, raw) {
      console.log(err);
      if (err) logger.error(err);
      if (err) {
        socket.emit("update-market-success", {
          message: "opps has some problem.!"
        });
      } else {
        socket.emit("update-market-success", {
          message: "rate updated successfully"
        });
      }

      // No need to wait for this operation to complete
    });
  } catch (err) {
    if (err) logger.error({
      'function': 'setrate',
      error: err
    });
  }

}

module.exports.updateUrl = function (io, socket, request) {
  try {
    if (!request) return;
    if (!request.user) return;

    Market.update({
      marketId: request.market.marketId
    }, {
      $set: {
        url: request.newMarket.url
      }
    }, function (err, raw) {
      if (err) logger.error(err);
      if (err) {
        socket.emit("update-markets-url-success", {
          message: "opps has some problem.!"
        });
      } else {
        socket.emit("update-markets-url-success", {
          message: "Market updated successfully"
        });
      }

      // No need to wait for this operation to complete
    });
  } catch (err) {
    if (err) logger.error({
      'function': 'updateurl',
      error: err
    });
  }

}

module.exports.getoMarkets = function (io, socket, request) {
  try {
    if (!request) return;
    if (!request.user) return;
    if (!request.user.details) return;
    //logger.info("getoMarkets: " + JSON.stringify(request));

    var filter = {};

    if (request.user.details.role == 'user') {
      if (!request.filter || !request.sort) return;
      Market.find(request.filter).sort(request.sort).exec(function (err, result) {
        if (err) logger.debug(err);
        //console.log(result);
        socket.emit("get-markets-success", result);
      });
    }
    if (request.user.details.role == 'manager') {
      if (!request.filter || !request.sort) return;
      User.findOne({
        hash: request.user.key,
        username: request.user.details.username,
        role: 'manager',
        deleted: false,
        status: 'active'
      }, function (err, dbManager) {
        if (err) logger.error(err);
        if (!dbManager) {
          logger.error("Invalid Access: " + JSON.stringify(request));
          return;
        }
        var filter = request.filter;
        filter['managers'] = request.user.details.username;
        Market.find(filter).sort(request.sort).exec(function (err, result) {
          if (err) logger.error(err);
          socket.emit("get-markets-success", result);
        });
      });
    }
    if (request.user.details.role == 'partner') {
      if (!request.filter || !request.sort) return;
      User.findOne({
        hash: request.user.key,
        username: request.user.details.username,
        role: 'partner',
        deleted: false,
        status: 'active'
      }, function (err, dbManager) {
        if (err) logger.error(err);
        if (!dbManager) {
          logger.error("Invalid Access: " + JSON.stringify(request));
          return;
        }
        var filter = request.filter;
        filter['managers'] = request.user.details.manager;
        Market.find(filter).sort(request.sort).exec(function (err, result) {
          if (err) logger.error(err);
          socket.emit("get-markets-success", result);
        });
      });
    }
    if (request.user.details.role == 'admin') {
      if (!request.filter || !request.sort) return;
      User.findOne({
        hash: request.user.key,
        username: request.user.details.username,
        role: 'admin',
        deleted: false,
        status: 'active'
      }, function (err, dbAdmin) {
        if (err) logger.error(err);
        if (!dbAdmin) {
          logger.error("Invalid Access: " + JSON.stringify(request));
          return;
        }
        Market.find(request.filter).limit(1).sort(request.sort).exec(function (err, result) {
          if (err) logger.error(err);
          socket.emit("get-markets-success", result);
        });
      });
    }

    if (request.user.details.role == 'operator') {
      if (!request.filter || !request.sort) return;
      User.findOne({
        hash: request.user.key,
        username: request.user.details.username,
        role: 'operator',
        deleted: false,
        status: 'active'
      }, function (err, dbAdmin) {
        if (err) logger.error(err);
        if (!dbAdmin) {
          logger.error("Invalid Access: " + JSON.stringify(request));
          return;
        }
        Market.find(request.filter).sort(request.sort).exec(function (err, result) {
          if (err) logger.error(err);
          socket.emit("get-markets-success", result);
        });
      });
    }
  } catch (err) {
    if (err) logger.error({
      'function': 'getmarket',
      error: err
    });
  }
};

module.exports.getSummaryMarket = function (io, socket, request) {
  try {
    if (!request) return;
    if (!request.user) return;
    if (!request.user.details) return;
    // logger.info("getMarkets: " + JSON.stringify(request));

    var filter = {};

    if (request.user.details.role == 'admin') {
      if (!request.filter || !request.sort) return;
      User.findOne({
        hash: request.user.key,
        username: request.user.details.username,
        role: 'admin',
        deleted: false,
        status: 'active'
      }, function (err, dbAdmin) {
        if (err) logger.error(err);
        if (!dbAdmin) {
          logger.error("Invalid Access: " + JSON.stringify(request));
          return;
        }
        Market.findOne(request.filter).sort(request.sort).exec(function (err, result) {
          if (err) logger.error(err);
          socket.emit("get-summarymarket-success", result);
        });
      });
    }

    if (request.user.details.role == 'operator') {
      if (!request.filter || !request.sort) return;
      User.findOne({
        hash: request.user.key,
        username: request.user.details.username,
        role: 'operator',
        deleted: false,
        status: 'active'
      }, function (err, dbAdmin) {
        if (err) logger.error(err);
        if (!dbAdmin) {
          logger.error("Invalid Access: " + JSON.stringify(request));
          return;
        }
        Market.find(request.filter).sort(request.sort).exec(function (err, result) {
          if (err) logger.error(err);
          socket.emit("get-markets-success", result);
        });
      });
    }
  } catch (err) {
    if (err) logger.error({
      'function': 'getmarkets',
      error: err
    });
  }
};

module.exports.getMarketHomes = function (io, socket, request) {
  try {
    if (!request) return;
    if (!request.user) return;
    if (!request.user.details) return;
    // logger.info("getMarkets: " + JSON.stringify(request));

    var filter = {};

    if (request.user.details.role == 'user') {
      if (!request.filter || !request.sort) return;
      Market.find(request.filter).sort(request.sort).exec(function (err, result) {
        if (err) logger.debug(err);
        //console.log(result);
        socket.emit("get-markets-success", result);
      });
    }
    if (request.user.details.role == 'manager') {
      if (!request.filter || !request.sort) return;
      User.findOne({
        hash: request.user.key,
        username: request.user.details.username,
        role: 'manager',
        deleted: false,
        status: 'active'
      }, function (err, dbManager) {
        if (err) logger.error(err);
        if (!dbManager) {
          logger.error("Invalid Access: " + JSON.stringify(request));
          return;
        }
        Bet.distinct('marketId', {
          'manager': request.user.details.username,
          deleted: false,
          'result': 'ACTIVE'
        }).exec(function (err, betMarket) {
          var filter = request.filter;
          filter['managers'] = request.user.details.username;
          Market.find({
            'managers': request.user.details.username,
            visible: true,
            'marketId': {
              $in: betMarket
            }
          }).sort(request.sort).exec(function (err, result) {
            if (err) logger.error(err);
            socket.emit("get-markets-success", result);
          });
        });

        Market.find({
          'managers': request.user.details.username,
          visible: true,
          'marketType': 'MATCH_ODDS',
          'marketBook.status': {
            $ne: 'CLOSED'
          }
        }).exec(function (err, resultclount) {
          if (err) logger.error(err);
          Bet.distinct('marketId', {
            'manager': request.user.details.username,
            deleted: false,

            'result': 'ACTIVE'
          }).exec(function (err, betMarket) {

            Market.find({
              'managers': request.user.details.username,
              visible: true,

              'marketId': {
                $in: betMarket
              }
            }).exec(function (err, result) {
              socket.emit("get-marketscount-success", {
                'all': resultclount.length,
                'analasis': result.length
              });
            });
          });
        });

      });
    }

    if (request.user.details.role == 'master') {
      if (!request.filter || !request.sort) return;
      User.findOne({
        hash: request.user.key,
        username: request.user.details.username,
        role: 'master',
        deleted: false,
        status: 'active'
      }, function (err, dbManager) {
        if (err) logger.error(err);
        if (!dbManager) {
          logger.error("Invalid Access: " + JSON.stringify(request));
          return;
        }
        Bet.distinct('marketId', {
          'master': request.user.details.username,
          deleted: false,
          'result': 'ACTIVE'
        }).exec(function (err, betMarket) {
          var filter = request.filter;
          Market.find({
            visible: true,
            'marketId': {
              $in: betMarket
            }
          }).sort(request.sort).exec(function (err, result) {
            if (err) logger.error(err);
            socket.emit("get-markets-success", result);
          });
        });


        if (err) logger.error(err);
        Bet.distinct('marketId', {
          'master': request.user.details.username,
          deleted: false,
          'result': 'ACTIVE'
        }).exec(function (err, betMarket) {


          socket.emit("get-marketscount-success", {

            'analasis': betMarket.length
          });


        });

      });
    }

    if (request.user.details.role == 'subadmin') {
      if (!request.filter || !request.sort) return;
      User.findOne({
        hash: request.user.key,
        username: request.user.details.username,
        role: 'subadmin',
        deleted: false,
        status: 'active'
      }, function (err, dbManager) {
        if (err) logger.error(err);
        if (!dbManager) {
          logger.error("Invalid Access: " + JSON.stringify(request));
          return;
        }
        Bet.distinct('marketId', {
          'subadmin': request.user.details.username,
          deleted: false,
          'result': 'ACTIVE'
        }).exec(function (err, betMarket) {
          var filter = request.filter;
          Market.find({
            visible: true,
            'marketId': {
              $in: betMarket
            }
          }).sort(request.sort).exec(function (err, result) {
            if (err) logger.error(err);
            socket.emit("get-markets-success", result);
          });
        });


        Bet.distinct('marketId', {
          'subadmin': request.user.details.username,
          deleted: false,
          'result': 'ACTIVE'
        }).exec(function (err, betMarket) {

          Market.find({
            visible: true,
            'marketId': {
              $in: betMarket
            }
          }).exec(function (err, result) {
            socket.emit("get-marketscount-success", {
              'analasis': result.length
            });
          });
        });
      });


    }


    if (request.user.details.role == 'partner') {
      if (!request.filter || !request.sort) return;
      User.findOne({
        hash: request.user.key,
        username: request.user.details.username,
        role: 'partner',
        deleted: false,
        status: 'active'
      }, function (err, dbManager) {
        if (err) logger.error(err);
        if (!dbManager) {
          logger.error("Invalid Access: " + JSON.stringify(request));
          return;
        }
        var filter = request.filter;
        filter['managers'] = request.user.details.manager;
        Bet.distinct('marketId', {
          'manager': request.user.details.manager,
          deleted: false,
          'result': 'ACTIVE'
        }).exec(function (err, betMarket) {
          var filter = request.filter;
          filter['managers'] = request.user.details.username;
          Market.find({
            'managers': request.user.details.manager,
            'marketId': {
              $in: betMarket
            }
          }).sort(request.sort).exec(function (err, result) {
            if (err) logger.error(err);
            socket.emit("get-markets-success", result);
          });
        });

        Market.find({
          'managers': request.user.details.manager,
          visible: true,
          'marketBook.status': {
            $ne: 'CLOSED'
          }
        }).exec(function (err, resultclount) {
          if (err) logger.error(err);
          Bet.distinct('marketId', {
            'manager': request.user.details.manager,
            deleted: false,
            'result': 'ACTIVE'
          }).exec(function (err, betMarket) {

            Market.find({
              'managers': request.user.details.manager,
              visible: true,
              'marketId': {
                $in: betMarket
              }
            }).exec(function (err, result) {
              socket.emit("get-marketscount-success", {
                'all': resultclount.length,
                'analasis': result.length
              });
            });
          });
        });
      });
    }
    if (request.user.details.role == 'admin') {
      if (!request.filter || !request.sort) return;
      User.findOne({
        hash: request.user.key,
        username: request.user.details.username,
        role: 'admin',
        deleted: false,
        status: 'active'
      }, function (err, dbAdmin) {
        if (err) logger.error(err);
        if (!dbAdmin) {
          logger.error("Invalid Access: " + JSON.stringify(request));
          return;
        }
        Market.find(request.filter).sort(request.sort).exec(function (err, result) {
          if (err) logger.error(err);
          socket.emit("get-markets-success", result);
        });
      });
    }

    if (request.user.details.role == 'operator') {
      if (!request.filter || !request.sort) return;
      User.findOne({
        hash: request.user.key,
        username: request.user.details.username,
        role: 'operator',
        deleted: false,
        status: 'active'
      }, function (err, dbAdmin) {
        if (err) logger.error(err);
        if (!dbAdmin) {
          logger.error("Invalid Access: " + JSON.stringify(request));
          return;
        }
        Market.find(request.filter).sort(request.sort).exec(function (err, result) {
          if (err) logger.error(err);
          socket.emit("get-markets-success", result);
        });
      });
    }
  } catch (err) {
    if (err) logger.error({
      'function': 'getmarkets',
      error: err
    });
  }
};

module.exports.getopenMarkets = function (io, socket, request) {
  try {
    if (!request) return;
    if (!request.user) return;
    if (!request.user.details) return;
    // logger.info("getopenMarkets: " + JSON.stringify(request));

    var filter = {};

    if (request.user.details.role == 'user') {
      if (!request.filter || !request.sort) return;
      Market.find(request.filter).sort(request.sort).exec(function (err, result) {
        if (err) logger.debug(err);
        //console.log(result);
        socket.emit("get-markets-success", result);
      });
    }


    if (request.user.details.role == 'manager') {
      if (!request.filter || !request.sort) return;
      User.findOne({
        hash: request.user.key,
        username: request.user.details.username,
        role: 'manager',
        deleted: false,
        status: 'active'
      }, function (err, dbManager) {
        if (err) logger.error(err);
        if (!dbManager) {
          logger.error("Invalid Access: " + JSON.stringify(request));
          return;
        }
        var filter = request.filter;
        filter['managers'] = request.user.details.username;
        Market.distinct('eventId', {
          "openDate": {
            $gte: (new Date((new Date()).getTime() - (0 * 24 * 60 * 60 * 1000)))
          },
          'managers': request.user.details.username,
          visible: true,
          'marketBook.status': 'OPEN'
        }).exec(function (err, arr) {
          if (arr.length == 0) return;
          Market.find({
            'managers': request.user.details.username,
            'eventId': {
              $in: arr
            },
            visible: true,
            visibleStatus: true
          }).sort(request.sort).exec(function (err, result) {
            if (err) logger.error(err);
            socket.emit("get-markets-success", result);
          });

        });


        Market.find({
          'managers': request.user.details.username,
          visible: true,
          'marketBook.status': {
            $ne: 'CLOSED'
          }
        }).exec(function (err, resultclount) {
          if (err) logger.error(err);
          Bet.distinct('marketId', {
            'manager': request.user.details.username,
            deleted: false,
            'result': 'ACTIVE'
          }).exec(function (err, betMarket) {

            Market.find({
              'managers': request.user.details.username,
              visible: true,
              'marketId': {
                $in: betMarket
              }
            }).exec(function (err, result) {
              socket.emit("get-marketscount-success", {
                'all': resultclount.length,
                'analasis': result.length
              });
            });
          });
        });
      });
    }
    if (request.user.details.role == 'partner') {
      if (!request.filter || !request.sort) return;
      User.findOne({
        hash: request.user.key,
        username: request.user.details.username,
        role: 'partner',
        deleted: false,
        status: 'active'
      }, function (err, dbManager) {
        if (err) logger.error(err);
        if (!dbManager) {
          logger.error("Invalid Access: " + JSON.stringify(request));
          return;
        }
        var filter = request.filter;
        filter['managers'] = request.user.details.manager;
        Market.find(filter).sort(request.sort).exec(function (err, result) {
          if (err) logger.error(err);
          socket.emit("get-markets-success", result);
        });

        Market.find({
          'managers': request.user.details.manager,
          visible: true,
          'marketBook.status': {
            $ne: 'CLOSED'
          }
        }).exec(function (err, resultclount) {
          if (err) logger.error(err);
          Bet.distinct('marketId', {
            'manager': request.user.details.manager,
            deleted: false,
            'result': 'ACTIVE'
          }).exec(function (err, betMarket) {

            Market.find({
              'managers': request.user.details.manager,
              visible: true,
              'marketId': {
                $in: betMarket
              }
            }).exec(function (err, result) {
              socket.emit("get-marketscount-success", {
                'all': resultclount.length,
                'analasis': result.length
              });
            });
          });


        });
      });
    }
    if (request.user.details.role == 'admin') {
      if (!request.filter || !request.sort) return;
      User.findOne({
        hash: request.user.key,
        username: request.user.details.username,
        role: 'admin',
        deleted: false,
        status: 'active'
      }, function (err, dbAdmin) {

        if (err) logger.error(err);
        if (!dbAdmin) {
          logger.error("Invalid Access: " + JSON.stringify(request));
          return;
        }
        Market.find(request.filter).sort(request.sort).exec(function (err, result) {
          if (err) logger.error(err);
          //console.log("error" + result)
          socket.emit("get-market-success", result);
          socket.emit("get-markets-success", result);
        });
      });
    }

    if (request.user.details.role == 'subadmin') {
      if (!request.filter || !request.sort) return;
      User.findOne({
        hash: request.user.key,
        username: request.user.details.username,
        role: 'subadmin',
        deleted: false,
        status: 'active'
      }, function (err, dbAdmin) {

        if (err) logger.error(err);
        if (!dbAdmin) {
          logger.error("Invalid Accessss: " + JSON.stringify(request));
          return;
        }
        var filter = request.filter;

        Market.find(filter).sort(request.sort).exec(function (err, result) {
          if (err) logger.error(err);
          //console.log("error" + result)
          socket.emit("get-market-success", result);
          socket.emit("get-markets-success", result);

          Bet.distinct('marketId', {
            'subadmin': request.user.details.username,
            deleted: false,
            'result': 'ACTIVE'
          }).exec(function (err, betMarket) {

            Market.find({

              visible: true,
              'marketId': {
                $in: betMarket
              }
            }).exec(function (err, resultl) {
              socket.emit("get-marketscount-success", {

                'allcount': result.length,
                'analasis': resultl.length
              });
            });
          });
        });
      });


    }

    if (request.user.details.role == 'master') {
      if (!request.filter || !request.sort) return;
      User.findOne({
        hash: request.user.key,
        username: request.user.details.username,
        role: 'master',
        deleted: false,
        status: 'active'
      }, function (err, dbAdmin) {

        if (err) logger.error(err);
        if (!dbAdmin) {
          logger.error("Invalid Access: " + JSON.stringify(request));
          return;
        }
        var filter = request.filter;
        //filter['masters'] = request.user.details.username;
        Market.find(filter).sort(request.sort).exec(function (err, result) {
          if (err) logger.error(err);
          console.log("error")
          socket.emit("get-market-success", result);
          socket.emit("get-markets-success", result);
        });
      });


      Bet.distinct('marketId', {
        'master': request.user.details.username,
        deleted: false,
        'result': 'ACTIVE'
      }).exec(function (err, betMarket) {


        socket.emit("get-marketscount-success", {

          'analasis': betMarket.length
        });


      });
    }


    if (request.user.details.role == 'operator') {
      if (!request.filter || !request.sort) return;
      User.findOne({
        hash: request.user.key,
        username: request.user.details.username,
        role: 'operator',
        deleted: false,
        status: 'active'
      }, function (err, dbAdmin) {
        if (err) logger.error(err);
        if (!dbAdmin) {
          logger.error("Invalid Access: " + JSON.stringify(request));
          return;
        }
        Market.find(request.filter).sort(request.sort).exec(function (err, result) {
          if (err) logger.error(err);
          socket.emit("get-markets-success", result);
        });
      });
    }
  } catch (err) {
    if (err) logger.error({
      'function': 'getmarkets',
      error: err
    });
  }
};

module.exports.getMarkets = function (io, socket, request) {
  try {
    if (!request) return;
    if (!request.user) return;
    if (!request.user.details) return;
    // logger.info("getMarkets: " + JSON.stringify(request));
    // console.log(request);
    var filter = {};

    if (request.user.details.role == 'user') {
      if (!request.filter || !request.sort) return;
      Market.find(request.filter).sort(request.sort).exec(function (err, result) {
        if (err) logger.debug(err);
        //console.log(result);
        socket.emit("get-markets-success", result);
      });
    }


    if (request.user.details.role == 'manager') {
      if (!request.filter || !request.sort) return;
      User.findOne({
        hash: request.user.key,
        username: request.user.details.username,
        role: 'manager',
        deleted: false,
        status: 'active'
      }, function (err, dbManager) {
        if (err) logger.error(err);
        if (!dbManager) {
          logger.error("Invalid Access: " + JSON.stringify(request));
          return;
        }
        var filter = request.filter;
        // console.log(filter);
        // filter['managers'] = request.user.details.username;
        Market.find(filter).sort(request.sort).exec(function (err, result) {
          if (err) console.log(err); logger.error(err);
          socket.emit("get-markets-success", result);
        });

        Market.find({
          'managers': request.user.details.username,
          visible: true,
          'marketBook.status': {
            $ne: 'CLOSED'
          }
        }).exec(function (err, resultclount) {
          if (err) logger.error(err);
          Bet.distinct('marketId', {
            'manager': request.user.details.username,
            deleted: false,
            'result': 'ACTIVE'
          }).exec(function (err, betMarket) {

            Market.find({
              'managers': request.user.details.username,
              visible: true,
              'marketId': {
                $in: betMarket
              }
            }).exec(function (err, result) {
              socket.emit("get-marketscount-success", {
                'all': resultclount.length,
                'analasis': result.length
              });
            });
          });
        });
      });
    }
    if (request.user.details.role == 'partner') {
      if (!request.filter || !request.sort) return;
      User.findOne({
        hash: request.user.key,
        username: request.user.details.username,
        role: 'partner',
        deleted: false,
        status: 'active'
      }, function (err, dbManager) {
        if (err) logger.error(err);
        if (!dbManager) {
          logger.error("Invalid Access: " + JSON.stringify(request));
          return;
        }
        var filter = request.filter;
        // filter['managers'] = request.user.details.manager;
        Market.find(filter).sort(request.sort).exec(function (err, result) {
          if (err) logger.error(err);
          socket.emit("get-markets-success", result);
        });

        Market.find({
          'managers': request.user.details.manager,
          visible: true,
          'marketBook.status': {
            $ne: 'CLOSED'
          }
        }).exec(function (err, resultclount) {
          if (err) logger.error(err);
          Bet.distinct('marketId', {
            'manager': request.user.details.manager,
            deleted: false,
            'result': 'ACTIVE'
          }).exec(function (err, betMarket) {

            Market.find({
              'managers': request.user.details.manager,
              visible: true,
              'marketId': {
                $in: betMarket
              }
            }).exec(function (err, result) {
              socket.emit("get-marketscount-success", {
                'all': resultclount.length,
                'analasis': result.length
              });
            });
          });


        });
      });
    }
    if (request.user.details.role == 'admin') {
      if (!request.filter || !request.sort) return;
      User.findOne({
        hash: request.user.key,
        username: request.user.details.username,
        role: 'admin',
        deleted: false,
        status: 'active'
      }, function (err, dbAdmin) {

        if (err) logger.error(err);
        if (!dbAdmin) {
          logger.error("Invalid Access: " + JSON.stringify(request));
          return;
        }
        // console.log(request.filter);
        Market.find(request.filter).sort(request.sort).exec(function (err, result) {
          if (err) logger.error(err);
          // console.log("error" + result)
          socket.emit("get-market-success", result);
          socket.emit("get-markets-success", result);
        });
      });
    }

    if (request.user.details.role == 'subadmin') {
      if (!request.filter || !request.sort) return;
      User.findOne({
        hash: request.user.key,
        username: request.user.details.username,
        role: 'subadmin',
        deleted: false,
        status: 'active'
      }, function (err, dbAdmin) {

        if (err) logger.error(err);
        if (!dbAdmin) {
          logger.error("Invalid Accessss: " + JSON.stringify(request));
          return;
        }
        var filter = request.filter;

        Market.find(filter).sort(request.sort).exec(function (err, result) {
          if (err) logger.error(err);
          //console.log("error" + result)
          socket.emit("get-market-success", result);
          socket.emit("get-markets-success", result);

          Bet.distinct('marketId', {
            'subadmin': request.user.details.username,
            deleted: false,
            'result': 'ACTIVE'
          }).exec(function (err, betMarket) {

            Market.find({

              visible: true,
              'marketId': {
                $in: betMarket
              }
            }).exec(function (err, resultl) {
              socket.emit("get-marketscount-success", {

                'allcount': result.length,
                'analasis': resultl.length
              });
            });
          });
        });
      });


    }

    if (request.user.details.role == 'master') {
      if (!request.filter || !request.sort) return;
      User.findOne({
        hash: request.user.key,
        username: request.user.details.username,
        role: 'master',
        deleted: false,
        status: 'active'
      }, function (err, dbAdmin) {

        if (err) logger.error(err);
        if (!dbAdmin) {
          logger.error("Invalid Access: " + JSON.stringify(request));
          return;
        }
        var filter = request.filter;
        //filter['masters'] = request.user.details.username;
        Market.find(filter).sort(request.sort).exec(function (err, result) {
          if (err) logger.error(err);
          console.log("error")
          socket.emit("get-market-success", result);
          socket.emit("get-markets-success", result);
        });
      });


      Bet.distinct('marketId', {
        'master': request.user.details.username,
        deleted: false,
        'result': 'ACTIVE'
      }).exec(function (err, betMarket) {


        socket.emit("get-marketscount-success", {

          'analasis': betMarket.length
        });


      });
    }


    if (request.user.details.role == 'operator') {
      if (!request.filter || !request.sort) return;
      User.findOne({
        hash: request.user.key,
        username: request.user.details.username,
        role: 'operator',
        deleted: false,
        status: 'active'
      }, function (err, dbAdmin) {
        if (err) logger.error(err);
        if (!dbAdmin) {
          logger.error("Invalid Access: " + JSON.stringify(request));
          return;
        }
        Market.find(request.filter).sort(request.sort).exec(function (err, result) {
          if (err) logger.error(err);
          socket.emit("get-markets-success", result);
        });
      });
    }
  } catch (err) {
    if (err) logger.error({
      'function': 'getmarkets',
      error: err
    });
  }
};

module.exports.getManagerSummaryfilter = function (io, socket, request) {
  try {
    if (!request) return;
    if (!request.user) return;
    //logger.info('getManagerSummary: ' + JSON.stringify(request));
    //console.log(request.user);
    var output = {};
    User.findOne({
      username: request.user.details.username,
      role: request.user.details.role,
      hash: request.user.key,
      deleted: false
    }, function (err, dbUser) {
      if (err) logger.debug(err);
      if (!dbUser) {
        logger.error("Invalid Access: " + JSON.stringify(request));
        socket.emit('logout');
        return;
      }
      if (dbUser.role == 'partner') {
        User.findOne({
          username: request.user.details.manager
        }, function (err, partnerManager) {
          if (err) logger.error(err);
          if (!partnerManager) return;
          EventType.find({
            'eventType.id': {
              $in: partnerManager.availableEventTypes
            },
            visible: true
          }).sort("eventType.name").exec(function (err, eventTypes) {
            if (!eventTypes) return;
            var counter = 0;
            output.eventTypes = eventTypes;
            output.markets = {};
            output.events = {};
            //Todo: optimize. use single query using $in
            var len = eventTypes.length;
            var days = 30;
            if (request.days) {
              days = request.days;
            }
            for (var i = 0; i < eventTypes.length; i++) {
              (function (eventTypeId, index, callback) {
                Market.find({
                  eventTypeId: eventTypeId,

                  managers: partnerManager.username,
                  'marketBook.status': 'CLOSED',
                  "openDate": {
                    "$gte": new Date(request.from + "T00:00:00.000Z"),
                    "$lte": new Date(request.to + "T23:59:00.000Z")
                  }
                }, {
                  eventTypeId: 1,
                  eventTypeName: 1,
                  competitionId: 1,
                  competitionName: 1,
                  eventId: 1,
                  eventName: 1,
                  openDate: 1,
                  marketId: 1,
                  marketName: 1,
                  marketType: 1,
                  sessionResult: 1,
                  managerProfit: 1,
                  winner: 1
                }).sort({
                  'openDate': -1
                }).exec(function (err, markets) {
                  if (err) throw err;
                  var eventIds = [];
                  for (var i = 0; i < markets.length; i++) {
                    if (eventIds.indexOf(markets[i].eventId) == -1) {
                      eventIds.unshift(markets[i].eventId);
                    }
                  }
                  Event.find({
                    eventTypeId: eventTypeId,
                    "event.id": {
                      $in: eventIds
                    }
                  }, {
                    eventTypeId: 1,
                    eventTypeName: 1,
                    competitionId: 1,
                    competitionName: 1,
                    event: 1,
                    managerMatchProfit: 1,
                    managerSessionProfit: 1,
                    managerFeesProfit: 1,
                    managerCommisionProfit: 1
                  }).sort({
                    'event.openDate': -1
                  }).exec(function (err, events) {
                    callback(markets, events, index);
                  });
                });
              })(eventTypes[i].eventType.id, i, function (markets, events, index) {
                counter++;
                if (counter == len) {
                  output.markets[eventTypes[index].eventType.id] = markets;
                  output.events[eventTypes[index].eventType.id] = events;
                  socket.emit('get-manager-summary-success', output);
                } else {
                  output.markets[eventTypes[index].eventType.id] = markets;
                  output.events[eventTypes[index].eventType.id] = events;
                }
              });
            }
          });
        });
      }

      if (dbUser.role == 'manager') {
        EventType.find({
          'eventType.id': {
            $in: request.user.details.availableEventTypes
          },
          visible: true
        }).sort("eventType.name").exec(function (err, eventTypes) {
          if (!eventTypes) return;
          var counter = 0;
          output.eventTypes = eventTypes;
          output.markets = {};
          output.events = {};
          //Todo: optimize. use single query using $in
          var len = eventTypes.length;
          var days = 1;

          for (var i = 0; i < eventTypes.length; i++) {
            (function (eventTypeId, index, callback) {
              Market.find({
                eventTypeId: eventTypeId,

                managers: request.user.details.username,
                'marketBook.status': 'CLOSED',
                "openDate": {
                  "$gte": new Date(request.from + "T00:00:00.000Z"),
                  "$lte": new Date(request.to + "T23:59:00.000Z")
                }
              }, {
                eventTypeId: 1,
                eventTypeName: 1,
                competitionId: 1,
                competitionName: 1,
                eventId: 1,
                eventName: 1,
                openDate: 1,
                marketId: 1,
                marketName: 1,
                marketType: 1,
                sessionResult: 1,
                managerProfit: 1,
                winner: 1,
              }).sort({
                'openDate': -1
              }).exec(function (err, markets) {
                //console.log(markets);
                if (err) throw err;
                var eventIds = [];
                for (var i = 0; i < markets.length; i++) {
                  if (eventIds.indexOf(markets[i].eventId) == -1) {
                    eventIds.unshift(markets[i].eventId);
                  }
                }
                Event.find({
                  eventTypeId: eventTypeId,
                  "event.id": {
                    $in: eventIds
                  }
                }, {
                  eventTypeId: 1,
                  eventTypeName: 1,
                  competitionId: 1,
                  competitionName: 1,
                  event: 1,
                  managerMatchProfit: 1,
                  managerSessionProfit: 1,
                  managerFeesProfit: 1,
                  managerCommisionProfit: 1
                }).sort({
                  'event.openDate': -1
                }).exec(function (err, events) {
                  callback(markets, events, index);
                });
              });
            })(eventTypes[i].eventType.id, i, function (markets, events, index) {
              counter++;
              if (counter == len) {
                output.markets[eventTypes[index].eventType.id] = markets;
                output.events[eventTypes[index].eventType.id] = events;
                socket.emit('get-manager-summary-success', output);
              } else {
                output.markets[eventTypes[index].eventType.id] = markets;
                output.events[eventTypes[index].eventType.id] = events;
              }
            });
          }
        });
      }
    });
  } catch (err) {
    if (err) logger.error({
      'function': 'getmanagersummaryfilter',
      error: err
    });
  }
};

module.exports.createMarketToss = function (io, socket, request) {
  try {
    if (!request) return;
    if (!request.user || !request.market || !request.newMarket) return;
    if (!request.user.details) return;
    //logger.info("createMarket: " + JSON.stringify(request));

    var filter = {};

    if (request.user.details.role == 'admin') {
      User.findOne({
        hash: request.user.key,
        username: request.user.details.username,
        role: 'admin',
        deleted: false,
        status: 'active'
      }, function (err, dbAdmin) {
        User.find({
          deleted: false,
          role: 'manager',
          status: 'active',
          availableEventTypes: '4'
        }, {
          username: 1
        }, function (err, dbManagers) {

          if (err) logger.error(err);
          if (!dbAdmin) {
            logger.error("Invalid Access: " + JSON.stringify(request));
            return;
          }
          var newId = Math.floor(Date.now()) + '';
          var selectionId1 = Math.floor((Math.random() * 100000));
          var selectionId2 = Math.floor((Math.random() * 100000));

          var newMarket = new Market();
          newMarket.eventTypeId = request.market.eventTypeId;
          newMarket.eventTypeName = request.market.eventTypeName;
          newMarket.competitionId = request.market.competitionId;
          newMarket.competitionName = request.market.competitionName;
          newMarket.eventId = request.market.eventId;
          newMarket.eventName = request.market.eventName;
          newMarket.openDate = request.market.openDate;
          newMarket.marketId = newId;
          newMarket.marketName = "TO Win Toss";
          newMarket.marketType = 'Toss';
          newMarket.totalMatched = 0;
          newMarket.marketBook = {
            status: 'OPEN',
            inplay: true,
            runners: [{
              "selectionId": selectionId1,
              "status": "ACTIVE",
              "availableToBack": {
                "price": request.newMarket.back,
                "size": 0
              },
              "availableToLay": {

              }
            },
            {
              "selectionId": selectionId2,
              "status": "ACTIVE",
              "availableToBack": {
                "price": request.newMarket.back,
                "size": 0
              },
              "availableToLay": {

              }
            },

            ]
          };
          newMarket.runners = [{
            "selectionId": selectionId1,
            "runnerName": request.newMarket.marketName1,
            "handicap": 0,
            "sortPriority": 1
          },
          {
            "selectionId": selectionId2,
            "runnerName": request.newMarket.marketName2,
            "handicap": 0,
            "sortPriority": 2
          },

          ];
          newMarket.managers = [];
          newMarket.managerStatus = {};
          if (dbManagers) {
            for (var i = 0; i < dbManagers.length; i++) {
              newMarket.managers.unshift(dbManagers[i].username);
              newMarket.managerStatus[dbManagers[i].username] = true;
            }
          }

          newMarket.createdBy = request.user.details.username;

          newMarket.shared = false;
          newMarket.visible = true;
          newMarket.deleted = false;
          newMarket.auto = false;
          newMarket.save(function (err, newUpdatedMarket) {
            if (err) logger.error(err);
            socket.emit('create-market-success', newUpdatedMarket);
          });
        });
      });
    }

    if (request.user.details.role == 'operator') {
      User.findOne({
        hash: request.user.key,
        username: request.user.details.username,
        role: 'operator',
        deleted: false,
        status: 'active'
      }, function (err, dbAdmin) {
        User.find({
          deleted: false,
          role: 'manager',
          status: 'active',
          availableEventTypes: '4'
        }, {
          username: 1
        }, function (err, dbManagers) {

          if (err) logger.error(err);
          if (!dbAdmin) {
            logger.error("Invalid Access: " + JSON.stringify(request));
            return;
          }
          var newId = Math.floor(Date.now()) + '';
          var selectionId1 = Math.floor((Math.random() * 100000));
          var selectionId2 = Math.floor((Math.random() * 100000));

          var newMarket = new Market();
          newMarket.eventTypeId = request.market.eventTypeId;
          newMarket.eventTypeName = request.market.eventTypeName;
          newMarket.competitionId = request.market.competitionId;
          newMarket.competitionName = request.market.competitionName;
          newMarket.eventId = request.market.eventId;
          newMarket.eventName = request.market.eventName;
          newMarket.openDate = request.market.openDate;
          newMarket.marketId = newId;
          newMarket.marketName = "TO Win Toss";
          newMarket.marketType = 'Toss';
          newMarket.totalMatched = 0;
          newMarket.marketBook = {
            status: 'OPEN',
            inplay: true,
            runners: [{
              "selectionId": selectionId1,
              "status": "ACTIVE",
              "availableToBack": {
                "price": request.newMarket.back,
                "size": 0
              },
              "availableToLay": {

              }
            },
            {
              "selectionId": selectionId2,
              "status": "ACTIVE",
              "availableToBack": {
                "price": request.newMarket.back,
                "size": 0
              },
              "availableToLay": {

              }
            },

            ]
          };
          newMarket.runners = [{
            "selectionId": selectionId1,
            "runnerName": request.newMarket.marketName1,
            "handicap": 0,
            "sortPriority": 1
          },
          {
            "selectionId": selectionId2,
            "runnerName": request.newMarket.marketName2,
            "handicap": 0,
            "sortPriority": 2
          },

          ];
          newMarket.managers = [];
          newMarket.managerStatus = {};
          if (dbManagers) {
            for (var i = 0; i < dbManagers.length; i++) {
              newMarket.managers.unshift(dbManagers[i].username);
              newMarket.managerStatus[dbManagers[i].username] = true;
            }
          }

          newMarket.createdBy = request.user.details.username;

          newMarket.shared = false;
          newMarket.visible = true;
          newMarket.deleted = false;
          newMarket.auto = false;
          newMarket.save(function (err, newUpdatedMarket) {
            if (err) logger.error(err);
            socket.emit('create-market-success', newUpdatedMarket);
          });
        });
      });
    }

    /* if(request.user.details.role == 'operator'){
      User.findOne({hash:request.user.key, username:request.user.details.username, role:'operator', deleted:false, status:'active'}, function(err, dbAdmin){
        if(err) logger.error(err);
        if(!dbAdmin){
          logger.error("Invalid Access: "+JSON.stringify(request));
          return;
        }
        var newId = Math.floor(Date.now())+'';
        var newMarket = new Market();
        newMarket.eventTypeId = request.market.eventTypeId;
        newMarket.eventTypeName = request.market.eventTypeName;
        newMarket.competitionId = request.market.competitionId;
        newMarket.competitionName = request.market.competitionName;
        newMarket.eventId = request.market.eventId;
        newMarket.eventName = request.market.eventName;
        newMarket.openDate = request.market.openDate;
        newMarket.marketId = newId;
        newMarket.marketName = request.newMarket.marketName;
        newMarket.marketType = 'SESSION';
        newMarket.totalMatched = 0;
        newMarket.marketBook = {
          status:'SUSPENDED',
          inplay:true,
          availableToBack:{price:request.newMarket.back, size:100},
          availableToLay:{price:request.newMarket.lay, size:100}
        };
        newMarket.runners = [];
        newMarket.managers = [];
        newMarket.createdBy = request.user.details.username;
        newMarket.managerStatus = {};
        newMarket.shared = false;
        newMarket.visible = true;
        newMarket.deleted = false;
        newMarket.auto = false;
        newMarket.save(function(err, newUpdatedMarket){
          if(err) logger.error(err);
          socket.emit('create-market-success', newUpdatedMarket);
        });
      });
    }*/
  } catch (err) {
    if (err) logger.error({
      'function': 'createmarkettoss',
      error: err
    });
  }
};

function closeMarket(io, socket, request) {
  try {
    if (!request) return;
    //if(!request.marketId) return;
    // logger.debug("closeMarket: "+JSON.stringify(request));
    //console.log('second step');

    var marketId = request.market.marketId;
    //console.log(marketId);
    // Delete unmatched bets
    Bet.update({
      marketId: marketId,
      status: 'UNMATCHED'
    }, {
      $set: {
        deleted: true
      }
    }, {
      multi: true
    }, function (err, raw) {
      if (err) logger.error(err);
      // No need to wait for this operation to complete
    });

    Market.findOne({
      marketId: marketId,
      "marketBook.status": 'SUSPENDED',
      deleted: false
    }, function (err, market) {
      if (err) logger.error(err);
      if (!market) return;
      User.find({
        deleted: false,
        role: 'user'
      }, function (err, users) {
        if (!users) return;
        for (var i = 0; i < users.length; i++) {
          (function (user, market) {
            Bet.find({
              marketId: market.marketId,
              username: user.username,
              status: 'MATCHED',
              result: 'ACTIVE',
              deleted: false
            }, function (err, bets) {
              if (bets) {
                //console.log(err);
                var winners = {};
                //calculate runnerProfit for each runner
                var runnerProfit = {};
                for (var i = 0; i < market.marketBook.runners.length; i++) {
                  runnerProfit[market.marketBook.runners[i].selectionId] = 0;
                  winners[market.marketBook.runners[i].selectionId] = market.marketBook.runners[i].selectionId;
                }
                bets.forEach(function (val, index) {
                  if (val.type == 'Back') {
                    for (var k in runnerProfit) {
                      if (k == val.runnerId) {
                        runnerProfit[k] += Math.round(((val.rate - 1) * val.stake));
                      } else {
                        runnerProfit[k] -= Math.round(val.stake);
                      }
                    }
                  } else {
                    for (var k in runnerProfit) {
                      if (k == val.runnerId) {
                        runnerProfit[k] -= Math.round(((val.rate - 1) * val.stake));
                      } else {
                        runnerProfit[k] += Math.round(val.stake);
                      }
                    }
                  }
                  if (val.type == 'Back') {
                    if (val.runnerId == request.sessionResult) {
                      val.result = 'WON';
                    } else {
                      val.result = 'LOST';
                    }
                  }

                  (function (val) {
                    Bet.update({
                      _id: val._id
                    }, val, function (err, raw) { });
                  })(val);
                  if (index == bets.length - 1) {
                    var maxLoss = 0;
                    var maxWinnerLoss = 0;
                    var profit = 0;
                    var i = 0,
                      j = 0;
                    for (var key in runnerProfit) {
                      if (winners[key] == request.sessionResult) {
                        if (j == 0) {
                          profit = runnerProfit[key];
                          j++;
                        } else {
                          if (profit > runnerProfit[key]) {
                            profit = runnerProfit[key];
                          }
                        }
                      }
                      if (i == 0) {
                        maxLoss = runnerProfit[key];
                        i++;
                      } else {
                        if (maxLoss > runnerProfit[key]) {
                          maxLoss = runnerProfit[key];
                        }
                      }
                    }
                    socket.emit('set-session-result-success', market);
                    // logger.info(user.username + " market: " + market.marketName + " exposure: " + maxLoss + " profit: " + profit);
                    user.exposure = user.exposure - maxLoss;
                    user.balance = user.balance - maxLoss;
                    user.balance = user.balance + profit;
                    var oldLimit = user.limit;
                    user.limit = user.limit + profit;
                    (function (user, market, profit, oldLimit) {
                      User.update({
                        username: user.username
                      }, user, function (err, raw) {
                        // console.log(raw);
                        if (err) return;
                        // io.emit("user-details-"+user._id, user);
                        var log = new Log();
                        log.username = user.username;
                        log.action = 'AMOUNT';
                        log.subAction = 'AMOUNT_WON';
                        log.amount = profit;
                        if (profit < 0) log.subAction = 'AMOUNT_LOST';
                        log.description = 'Profit: ' + profit + ' Old Limit: ' + oldLimit + ' New Limit: ' + user.limit;
                        log.marketId = market.marketId;
                        log.marketName = market.marketName;
                        log.eventId = market.eventId;
                        log.eventName = market.eventName;
                        log.competitionId = market.competitionId;
                        log.competitionName = market.competitionName;
                        log.eventTypeId = market.eventTypeId;
                        log.eventTypeName = market.eventTypeName;
                        log.manager = user.manager;
                        log.time = new Date();
                        log.deleted = false;
                        log.save(function (err) {
                          if (err) {
                            logger.error('close-market: Log entry failed for ' + user.username);
                          }
                        });
                        //log end
                      });
                    })(user, market, profit, oldLimit);
                  }
                });
              }
            });
          })(users[i], market);
        }
      });
      Market.findOne({
        marketId: marketId
      }, function (err, market) {
        var runners = market.marketBook.runners;
        var newRunners = [];
        for (var l = 0; l < runners.length; l++) {
          newRunners[l] = {};
          if (request.sessionResult == runners[l].selectionId) {
            newRunners[l].status = "WINNER";
          } else {
            newRunners[l].status = "LOSER";
          }
          newRunners[l].selectionId = runners[l].selectionId;
          newRunners[l].availableToBack = runners[l].availableToBack;
        }

        market.marketBook.runners = newRunners;
        market.marketBook.status = "CLOSED";
        Market.update({
          marketId: market.marketId
        }, market, function (err, raw) {
          if (err) logger.error(err);
          // No need to wait for this operation to complete
        });
      });
    });

  } catch (err) {
    if (err) logger.error({
      'function': 'closedmarkettoss',
      error: err
    });
  }
}

function closeMarketManagerToss(io, socket, request) {
  try {
    if (!request) return;
    var marketId = request.market.marketId;
    Market.findOne({
      marketId: marketId,

      deleted: false
    }, function (err, market) {
      if (err) logger.error(err);
      if (!market) return;
      Bet.distinct("manager", {
        status: 'MATCHED',
        "marketId": marketId,
        deleted: false
      }, function (err, users) {
        if (!users) return;
        for (var i = 0; i < users.length; i++) {
          (function (user, market) {
            Bet.find({
              marketId: market.marketId,
              'manager': user,
              deleted: false
            }, function (err, bets) {
              if (bets) {
                //console.log(err);
                var winners = {};
                //calculate runnerProfit for each runner
                var runnerProfit = {};
                for (var i = 0; i < market.marketBook.runners.length; i++) {
                  runnerProfit[market.marketBook.runners[i].selectionId] = 0;
                  winners[market.marketBook.runners[i].selectionId] = market.marketBook.runners[i].selectionId;
                }
                bets.forEach(function (val, index) {
                  var comm = Math.round(100) - Math.round(val.adminCommision + val.subadminCommision + val.masterCommision);

                  if (val.type == 'Back') {
                    for (var k in runnerProfit) {
                      if (k == val.runnerId) {
                        runnerProfit[k] += Math.round(((val.rate - 1) * val.stake));
                      } else {
                        runnerProfit[k] -= Math.round(val.stake);
                      }
                    }
                  } else {
                    for (var k in runnerProfit) {
                      if (k == val.runnerId) {
                        runnerProfit[k] -= Math.round(((val.rate - 1) * val.stake));
                      } else {
                        runnerProfit[k] += Math.round(val.stake);
                      }
                    }
                  }
                  if (val.type == 'Back') {
                    if (val.runnerId == request.sessionResult) {
                      val.managerresult = 'WON';
                    } else {
                      val.managerresult = 'LOST';
                    }
                  } else {
                    if (val.runnerId == request.sessionResult) {
                      val.managerresult = 'LOST';
                    } else {
                      val.managerresult = 'WON';
                    }
                  }

                  (function (val) {

                  })(val);
                  if (index == bets.length - 1) {
                    var maxLoss = 0;
                    var maxWinnerLoss = 0;
                    var profit = 0;
                    var i = 0,
                      j = 0;
                    for (var key in runnerProfit) {
                      if (parseInt(winners[key]) == parseInt(request.sessionResult)) {
                        if (j == 0) {
                          profit = runnerProfit[key];
                          j++;
                        } else {
                          if (profit > runnerProfit[key]) {
                            profit = runnerProfit[key];
                          }
                        }
                      }
                      if (i == 0) {
                        maxLoss = runnerProfit[key];
                        i++;
                      } else {
                        if (maxLoss > runnerProfit[key]) {
                          maxLoss = runnerProfit[key];
                        }
                      }
                    }


                    if (market.managerProfit) {
                      market.managerProfit[user] = Math.round(profit);
                    } else {
                      market.managerProfit = {};
                      market.managerProfit[user] = Math.round(profit);

                    }
                    Market.update({
                      marketId: market.marketId,
                      deleted: false,
                      'marketBook.status': 'CLOSED'
                    }, {
                      $set: {
                        managerProfit: market.managerProfit
                      }
                    }, function (err, raw) {
                      //console.log(raw);
                    });
                    User.findOne({
                      username: user,

                      deleted: false
                    }, function (err, userData) {
                      var today = new Date();
                      if (today.getDate() <= 9) {
                        var acdate = '0' + today.getDate();
                      } else {
                        var acdate = today.getDate();
                      }

                      if ((today.getMonth() + 1) <= 9) {
                        var acmonth = '0' + (today.getMonth() + 1);
                      } else {
                        var acmonth = (today.getMonth() + 1);
                      }

                      var date = today.getFullYear() + '-' + acmonth + '-' + acdate;

                      var log = new Log();
                      log.createdAt = date;
                      log.username = userData.username;
                      log.action = 'AMOUNT';
                      log.subAction = 'AMOUNT_WON';

                      log.oldLimit = 0;
                      log.newLimit = 0;
                      if (profit > 0) {
                        log.amount = profit;
                        log.subAction = 'AMOUNT_LOST';
                      } else {
                        log.amount = -1 * profit;
                      }
                      log.description = market.eventName + " " + market.marketName + ' Profit: ' + profit;
                      log.eventTypeName = market.eventTypeName;
                      log.marketId = market.marketId;
                      log.marketName = market.marketName;
                      log.eventId = market.eventId;
                      log.eventName = market.eventName;
                      log.competitionId = market.competitionId;
                      log.competitionName = market.competitionName;
                      log.eventTypeId = market.eventTypeId;

                      log.subadmin = userData.subadmin;
                      log.master = userData.master;
                      log.time = new Date();
                      log.deleted = false;
                      Log.findOne({
                        marketId: market.marketId,
                        username: userData.username,
                      }, function (err, userData) {
                        if (!userData) {
                          log.save(function (err) { });
                        }
                      });
                    });

                  }
                });
              }
            });
          })(users[i], market);
        }
      });

    });

  } catch (err) {
    if (err) logger.error({
      'function': 'closedmanagermarkettoss',
      error: err
    });
  }
}

function closeMarketMasterToss(io, socket, request) {
  try {
    if (!request) return;
    var marketId = request.market.marketId;
    Market.findOne({
      marketId: marketId,

      deleted: false
    }, function (err, market) {
      if (err) logger.error(err);
      if (!market) return;
      Bet.distinct("master", {
        status: 'MATCHED',
        "marketId": marketId,
        deleted: false
      }, function (err, users) {
        if (!users) return;
        for (var i = 0; i < users.length; i++) {
          (function (user, market) {
            Bet.find({
              marketId: market.marketId,
              'master': user,
              deleted: false
            }, function (err, bets) {
              if (bets) {
                //console.log(err);
                var winners = {};
                //calculate runnerProfit for each runner
                var runnerProfit = {};
                for (var i = 0; i < market.marketBook.runners.length; i++) {
                  runnerProfit[market.marketBook.runners[i].selectionId] = 0;
                  winners[market.marketBook.runners[i].selectionId] = market.marketBook.runners[i].selectionId;
                }
                bets.forEach(function (val, index) {
                  var comm = Math.round(val.masterCommision);

                  if (val.type == 'Back') {
                    for (var k in runnerProfit) {
                      if (k == val.runnerId) {
                        runnerProfit[k] += Math.round(((val.rate - 1) * val.stake));
                      } else {
                        runnerProfit[k] -= Math.round(val.stake);
                      }
                    }
                  } else {
                    for (var k in runnerProfit) {
                      if (k == val.runnerId) {
                        runnerProfit[k] -= Math.round(((val.rate - 1) * val.stake));
                      } else {
                        runnerProfit[k] += Math.round(val.stake);
                      }
                    }
                  }
                  if (val.type == 'Back') {
                    if (val.runnerId == request.sessionResult) {
                      val.managerresult = 'WON';
                    } else {
                      val.managerresult = 'LOST';
                    }
                  } else {
                    if (val.runnerId == request.sessionResult) {
                      val.managerresult = 'LOST';
                    } else {
                      val.managerresult = 'WON';
                    }
                  }

                  (function (val) {

                  })(val);
                  if (index == bets.length - 1) {
                    var maxLoss = 0;
                    var maxWinnerLoss = 0;
                    var profit = 0;
                    var i = 0,
                      j = 0;
                    for (var key in runnerProfit) {
                      if (parseInt(winners[key]) == parseInt(request.sessionResult)) {
                        if (j == 0) {
                          profit = runnerProfit[key];
                          j++;
                        } else {
                          if (profit > runnerProfit[key]) {
                            profit = runnerProfit[key];
                          }
                        }
                      }
                      if (i == 0) {
                        maxLoss = runnerProfit[key];
                        i++;
                      } else {
                        if (maxLoss > runnerProfit[key]) {
                          maxLoss = runnerProfit[key];
                        }
                      }
                    }


                    if (market.masterProfit) {
                      market.masterProfit[user] = Math.round(profit);
                    } else {
                      market.masterProfit = {};
                      market.masterProfit[user] = Math.round(profit);

                    }
                    Market.update({
                      marketId: market.marketId,
                      deleted: false,
                      'marketBook.status': 'CLOSED'
                    }, {
                      $set: {
                        masterProfit: market.masterProfit
                      }
                    }, function (err, raw) {
                      //console.log(raw);
                    });
                    User.findOne({
                      username: user,

                      deleted: false
                    }, function (err, userData) {
                      var today = new Date();
                      if (today.getDate() <= 9) {
                        var acdate = '0' + today.getDate();
                      } else {
                        var acdate = today.getDate();
                      }

                      if ((today.getMonth() + 1) <= 9) {
                        var acmonth = '0' + (today.getMonth() + 1);
                      } else {
                        var acmonth = (today.getMonth() + 1);
                      }

                      var date = today.getFullYear() + '-' + acmonth + '-' + acdate;

                      var log = new Log();
                      log.createdAt = date;
                      log.username = userData.username;
                      log.action = 'AMOUNT';
                      log.subAction = 'AMOUNT_WON';

                      log.oldLimit = userData.limit;
                      log.newLimit = userData.limit;
                      if (profit > 0) {
                        log.amount = profit;
                        log.subAction = 'AMOUNT_LOST';
                      } else {
                        log.amount = -1 * profit;
                      }
                      log.description = market.eventName + " " + market.marketName + ' Profit: ' + profit;

                      log.marketId = market.marketId;
                      log.marketName = market.marketName;
                      log.eventId = market.eventId;
                      log.eventName = market.eventName;
                      log.competitionId = market.competitionId;
                      log.competitionName = market.competitionName;
                      log.eventTypeId = market.eventTypeId;
                      log.eventTypeName = market.eventTypeName;

                      log.time = new Date();
                      log.deleted = false;
                      Log.findOne({
                        marketId: market.marketId,
                        username: userData.username,
                      }, function (err, userData) {
                        if (!userData) {
                          log.save(function (err) { });
                        }
                      });
                    });

                  }
                });
              }
            });
          })(users[i], market);
        }
      });

    });

  } catch (err) {
    if (err) logger.error({
      'function': 'closedmanagermarkettoss',
      error: err
    });
  }
}

function closeMarketsubadminToss(io, socket, request) {
  try {
    if (!request) return;
    var marketId = request.market.marketId;
    Market.findOne({
      marketId: marketId,

      deleted: false
    }, function (err, market) {
      if (err) logger.error(err);
      if (!market) return;
      Bet.distinct("subadmin", {
        status: 'MATCHED',
        "marketId": marketId,
        deleted: false
      }, function (err, users) {
        if (!users) return;
        for (var i = 0; i < users.length; i++) {
          (function (user, market) {
            Bet.find({
              marketId: market.marketId,
              'subadmin': user,
              deleted: false
            }, function (err, bets) {
              if (bets) {
                //console.log(err);
                var winners = {};
                //calculate runnerProfit for each runner
                var runnerProfit = {};
                for (var i = 0; i < market.marketBook.runners.length; i++) {
                  runnerProfit[market.marketBook.runners[i].selectionId] = 0;
                  winners[market.marketBook.runners[i].selectionId] = market.marketBook.runners[i].selectionId;
                }
                bets.forEach(function (val, index) {
                  var comm = Math.round(val.subadminCommision);

                  if (val.type == 'Back') {
                    for (var k in runnerProfit) {
                      if (k == val.runnerId) {
                        runnerProfit[k] += Math.round(((val.rate - 1) * val.stake));
                      } else {
                        runnerProfit[k] -= Math.round(val.stake);
                      }
                    }
                  } else {
                    for (var k in runnerProfit) {
                      if (k == val.runnerId) {
                        runnerProfit[k] -= Math.round(((val.rate - 1) * val.stake));
                      } else {
                        runnerProfit[k] += Math.round(val.stake);
                      }
                    }
                  }
                  if (val.type == 'Back') {
                    if (val.runnerId == request.sessionResult) {
                      val.managerresult = 'WON';
                    } else {
                      val.managerresult = 'LOST';
                    }
                  } else {
                    if (val.runnerId == request.sessionResult) {
                      val.managerresult = 'LOST';
                    } else {
                      val.managerresult = 'WON';
                    }
                  }

                  (function (val) {

                  })(val);
                  if (index == bets.length - 1) {
                    var maxLoss = 0;
                    var maxWinnerLoss = 0;
                    var profit = 0;
                    var i = 0,
                      j = 0;
                    for (var key in runnerProfit) {
                      if (parseInt(winners[key]) == parseInt(request.sessionResult)) {
                        if (j == 0) {
                          profit = runnerProfit[key];
                          j++;
                        } else {
                          if (profit > runnerProfit[key]) {
                            profit = runnerProfit[key];
                          }
                        }
                      }
                      if (i == 0) {
                        maxLoss = runnerProfit[key];
                        i++;
                      } else {
                        if (maxLoss > runnerProfit[key]) {
                          maxLoss = runnerProfit[key];
                        }
                      }
                    }


                    if (market.masterProfit) {
                      market.masterProfit[user] = Math.round(profit);
                    } else {
                      market.masterProfit = {};
                      market.masterProfit[user] = Math.round(profit);

                    }
                    Market.update({
                      marketId: market.marketId,
                      deleted: false,
                      'marketBook.status': 'CLOSED'
                    }, {
                      $set: {
                        masterProfit: market.masterProfit
                      }
                    }, function (err, raw) {
                      //console.log(raw);
                    });
                    User.findOne({
                      username: user,

                      deleted: false
                    }, function (err, userData) {
                      var today = new Date();
                      if (today.getDate() <= 9) {
                        var acdate = '0' + today.getDate();
                      } else {
                        var acdate = today.getDate();
                      }

                      if ((today.getMonth() + 1) <= 9) {
                        var acmonth = '0' + (today.getMonth() + 1);
                      } else {
                        var acmonth = (today.getMonth() + 1);
                      }

                      var date = today.getFullYear() + '-' + acmonth + '-' + acdate;


                      var log = new Log();
                      log.createdAt = date;
                      log.username = userData.username;
                      log.action = 'AMOUNT';
                      log.subAction = 'AMOUNT_WON';

                      log.oldLimit = userData.limit;
                      log.newLimit = userData.limit;
                      if (profit > 0) {
                        log.amount = profit;
                        log.subAction = 'AMOUNT_LOST';
                      } else {
                        log.amount = -1 * profit;
                      }
                      log.description = market.eventName + " " + market.marketName + ' Profit: ' + profit;
                      log.marketId = market.marketId;
                      log.marketName = market.marketName;
                      log.eventId = market.eventId;
                      log.eventName = market.eventName;
                      log.competitionId = market.competitionId;
                      log.competitionName = market.competitionName;
                      log.eventTypeId = market.eventTypeId;
                      log.eventTypeName = market.eventTypeName;

                      log.time = new Date();
                      log.deleted = false;
                      Log.findOne({
                        marketId: market.marketId,
                        username: userData.username,
                      }, function (err, userData) {
                        if (!userData) {
                          log.save(function (err) { });
                        }
                      });
                    });

                  }
                });
              }
            });
          })(users[i], market);
        }
      });

    });

  } catch (err) {
    if (err) logger.error({
      'function': 'closedmanagermarkettoss',
      error: err
    });
  }
}

function closeMarketadminToss(io, socket, request) {
  try {
    if (!request) return;
    var marketId = request.market.marketId;
    Market.findOne({
      marketId: marketId,

      deleted: false
    }, function (err, market) {
      if (err) logger.error(err);
      if (!market) return;

      Bet.find({
        marketId: market.marketId,
        deleted: false
      }, function (err, bets) {
        if (bets) {
          //console.log(err);
          var winners = {};
          //calculate runnerProfit for each runner
          var runnerProfit = {};
          for (var i = 0; i < market.marketBook.runners.length; i++) {
            runnerProfit[market.marketBook.runners[i].selectionId] = 0;
            winners[market.marketBook.runners[i].selectionId] = market.marketBook.runners[i].selectionId;
          }
          bets.forEach(function (val, index) {
            var comm = Math.round(val.adminCommision);

            if (val.type == 'Back') {
              for (var k in runnerProfit) {
                if (k == val.runnerId) {
                  runnerProfit[k] += Math.round(((val.rate - 1) * val.stake));
                } else {
                  runnerProfit[k] -= Math.round(val.stake);
                }
              }
            } else {
              for (var k in runnerProfit) {
                if (k == val.runnerId) {
                  runnerProfit[k] -= Math.round(((val.rate - 1) * val.stake));
                } else {
                  runnerProfit[k] += Math.round(val.stake);
                }
              }
            }
            if (val.type == 'Back') {
              if (val.runnerId == request.sessionResult) {
                val.managerresult = 'WON';
              } else {
                val.managerresult = 'LOST';
              }
            } else {
              if (val.runnerId == request.sessionResult) {
                val.managerresult = 'LOST';
              } else {
                val.managerresult = 'WON';
              }
            }

            (function (val) {

            })(val);
            if (index == bets.length - 1) {
              var maxLoss = 0;
              var maxWinnerLoss = 0;
              var profit = 0;
              var i = 0,
                j = 0;
              for (var key in runnerProfit) {
                if (parseInt(winners[key]) == parseInt(request.sessionResult)) {
                  if (j == 0) {
                    profit = runnerProfit[key];
                    j++;
                  } else {
                    if (profit > runnerProfit[key]) {
                      profit = runnerProfit[key];
                    }
                  }
                }
                if (i == 0) {
                  maxLoss = runnerProfit[key];
                  i++;
                } else {
                  if (maxLoss > runnerProfit[key]) {
                    maxLoss = runnerProfit[key];
                  }
                }
              }


              if (market.adminProfit) {
                market.adminProfit['admin'] = Math.round(profit);
              } else {
                market.adminProfit = {};
                market.adminProfit['admin'] = Math.round(profit);

              }
              Market.update({
                marketId: market.marketId,
                deleted: false,
                'marketBook.status': 'CLOSED'
              }, {
                $set: {
                  adminProfit: market.adminProfit
                }
              }, function (err, raw) {
                //console.log(raw);
              });
              User.findOne({
                role: 'admin',
              }, function (err, userData) {
                var today = new Date();
                if (today.getDate() <= 9) {
                  var acdate = '0' + today.getDate();
                } else {
                  var acdate = today.getDate();
                }

                if ((today.getMonth() + 1) <= 9) {
                  var acmonth = '0' + (today.getMonth() + 1);
                } else {
                  var acmonth = (today.getMonth() + 1);
                }

                var date = today.getFullYear() + '-' + acmonth + '-' + acdate;


                var log = new Log();
                log.createdAt = date;
                log.username = 'admin';
                log.action = 'AMOUNT';
                log.subAction = 'AMOUNT_WON';

                log.oldLimit = userData.limit;
                log.newLimit = userData.limit;
                if (profit > 0) {
                  log.amount = profit;
                  log.subAction = 'AMOUNT_LOST';

                } else {
                  log.amount = -1 * profit;
                }

                log.description = market.eventName + " " + market.marketName + ' Profit: ' + profit;
                log.marketId = market.marketId;
                log.marketName = market.marketName;
                log.eventId = market.eventId;
                log.eventName = market.eventName;
                log.competitionId = market.competitionId;
                log.competitionName = market.competitionName;
                log.eventTypeId = market.eventTypeId;
                log.eventTypeName = market.eventTypeName;

                log.time = new Date();
                log.deleted = false;
                Log.findOne({
                  marketId: market.marketId,
                  username: 'admin',
                }, function (err, userData) {
                  if (!userData) {
                    log.save(function (err) { });
                  }
                });
              });

            }
          });
        }
      });


    });

  } catch (err) {
    if (err) logger.error({
      'function': 'closedmanagermarkettoss',
      error: err
    });
  }
}

async function referSpecialCommision(request) {
  try {
    Market.findOne({
      deleted: false,
      marketId: request.market.marketId,
    }, function (err, market) {
      if (!market) return;
      let userbProfit = {};
      let userlProfit = {};
      let usercProfit = {};
      let referbalance;
      User.distinct('referal', {
        deleted: false,
      }, function (err, userr) {
        if (!userr) return;
        User.find({
          deleted: false,
          username: {
            $in: userr
          },
        }, async function (err, userr) {
          if (!userr) return;
          for (const variable of userr) {
            /*for (var j = 0; j < userr.length; j++) {*/
            userbProfit[variable.username] = variable.balance;
            userlProfit[variable.username] = variable.limit;
            usercProfit[variable.username] = 0;
            (async function (userf, market) {
              await User.find({
                deleted: false,
                referal: userf.username,
              }, async function (err, users) {

                if (!users) return;
                for (const variableu of users) {
                  /*for (var i = 0; i < users.length; i++) {*/

                  (async function (user, market) {
                    await Bet.find({
                      marketId: market.marketId,
                      username: user.username,
                      status: 'MATCHED',
                      result: 'ACTIVE',
                      deleted: false
                    }, {
                      rate: 1,
                      stake: 1,
                      type: 1,
                      result: 1,
                      runnerId: 1
                    }, async function (err, bets) {
                      if (bets) {
                        //console.log(err);
                        var winners = {};
                        //calculate runnerProfit for each runner
                        var runnerProfit = {};
                        for (var i = 0; i < market.marketBook.runners.length; i++) {
                          runnerProfit[market.marketBook.runners[i].selectionId] = 0;
                          winners[market.marketBook.runners[i].selectionId] = market.marketBook.runners[i].selectionId;
                        }
                        bets.forEach(function (val, index) {
                          if (val.type == 'Back') {
                            for (var k in runnerProfit) {
                              if (k == val.runnerId) {
                                runnerProfit[k] += Math.round(((val.rate - 1) * val.stake));
                              } else {
                                runnerProfit[k] -= Math.round(val.stake);
                              }
                            }
                          } else {
                            for (var k in runnerProfit) {
                              if (k == val.runnerId) {
                                runnerProfit[k] -= Math.round(((val.rate - 1) * val.stake));
                              } else {
                                runnerProfit[k] += Math.round(val.stake);
                              }
                            }
                          }
                          if (val.type == 'Back') {
                            if (val.runnerId == request.sessionResult) {
                              val.result = 'WON';
                            } else {
                              val.result = 'LOST';
                            }
                          } else {
                            if (val.runnerId == request.sessionResult) {
                              val.result = 'LOST';
                            } else {
                              val.result = 'WON';
                            }
                          }

                          (function (val) {
                            /* Bet.update({
                               _id: val._id
                             }, val, function (err, raw) {});*/
                          })(val);
                          if (index == bets.length - 1) {
                            var maxLoss = 0;
                            var maxWinnerLoss = 0;
                            var profit = 0;
                            var i = 0,
                              j = 0;
                            for (var key in runnerProfit) {
                              if (parseInt(winners[key]) == parseInt(request.sessionResult)) {
                                if (j == 0) {
                                  profit = runnerProfit[key];
                                  j++;
                                } else {
                                  if (profit > runnerProfit[key]) {
                                    profit = runnerProfit[key];
                                  }
                                }
                              }

                              if (i == 0) {
                                maxLoss = runnerProfit[key];
                                i++;
                              } else {
                                if (maxLoss > runnerProfit[key]) {
                                  maxLoss = runnerProfit[key];
                                }
                              }
                            }


                            //logger.info(user.username + " market: " + market.marketName + " exposure: " + maxLoss + " profit: " + profit);

                            if (profit < 0) {
                              if (user.referal && user.rfcommisionloss) {

                                if (user.rfcommisionloss == 0) {
                                  var commision1 = 0;
                                } else {
                                  var commision1 = Math.round(-1 * profit * user.rfcommisionloss / 100);
                                  usercProfit[variable.username] = usercProfit[variable.username] + commision1;

                                }
                                var referbalance = userbProfit[userf.username];
                                var referlimit = userlProfit[userf.username];
                                var refercomm = usercProfit[userf.username];


                                var balance = referbalance + refercomm;
                                var oldLimits = userf.limit;
                                var limit = referlimit + refercomm;
                                User.update({
                                  username: userf.username
                                }, {
                                  $set: {
                                    "balance": balance,
                                    "limit": limit
                                  }
                                }, function (err, raw) {

                                  //console.log('err' + err)
                                  //console.log(raw)
                                });

                                /*Log.findOne({
                                  deleted: false,
                                  'marketId': market.marketId,
                                  'subAction': 'MATCH_FEE',
                                  "commision": 'MATCH_COMM',
                                  'relation': user.username,
                                  username: userf.username,
                                }, function (err, logf) {
                                  if (logf) return;*/
                                var logReCommision = new Log();
                                logReCommision.username = userf.username;
                                logReCommision.action = 'AMOUNT';
                                logReCommision.subAction = 'MATCH_FEE';
                                logReCommision.commision = 'MATCH_COMM';
                                logReCommision.description = 'Match Special: ' + commision1 + ' Old Limit: ' + oldLimits + ' New Limit: ' + limit;
                                logReCommision.amount = commision1;
                                logReCommision.remark = user.username + "Special Commision " + commision1;
                                logReCommision.oldLimit = oldLimits;
                                logReCommision.newLimit = limit;
                                logReCommision.relation = user.username;
                                logReCommision.marketId = market.marketId;
                                logReCommision.marketName = market.marketName;
                                logReCommision.eventId = market.eventId;
                                logReCommision.eventName = market.eventName;
                                logReCommision.competitionId = market.competitionId;
                                logReCommision.competitionName = market.competitionName;
                                logReCommision.eventTypeId = market.eventTypeId;
                                logReCommision.eventTypeName = market.eventTypeName;
                                logReCommision.manager = userf.manager;
                                logReCommision.time = new Date();
                                logReCommision.deleted = false;
                                logReCommision.save(function (err) {


                                });
                                //})

                              }
                            }
                          }
                        });

                      }
                    });
                  })(variableu, market);
                }

              });
            })(variable, market);
          }
        });
      });
    });

  } catch (e) {

  }

}

function closeMarketToss(io, socket, request) {
  try {
    if (!request) return;
    var marketId = request.market.marketId;
    Bet.update({
      marketId: marketId,
      status: 'UNMATCHED'
    }, {
      $set: {
        deleted: true
      }
    }, {
      multi: true
    }, function (err, raw) {
      if (err) logger.error(err);
      // No need to wait for this operation to complete
    });

    Market.findOne({
      marketId: marketId,
      deleted: false,
      'marketBook.status': 'SUSPENDED',
    }, function (err, market) {
      if (err) logger.error(err);
      if (!market) return;

      if (market.marketBook.status == 'OPEN') {
        return;
      }
      //referSpecialCommision(request);
      //close manual event
      if (market.marketType == 'Special') {
        Event.update({
          'event.id': market.eventId
        }, {
          $set: {
            'visible': false
          }
        }, function (err, raw) {
          if (err) logger.error(err);
          // No need to wait for this operation to complete
        });
      }

      var winnerId = market.marketBook.runners.find((val) => {
        return parseInt(val.selectionId) == parseInt(request.sessionResult)
      });

      closeMarketManagerToss(io, socket, request);
      closeMarketMasterToss(io, socket, request);

      closeMarketsubadminToss(io, socket, request);
      closeMarketadminToss(io, socket, request);

      if (typeof winnerId != 'undefined') {


        market.marketBook.runners.forEach(function (mval, index) {
          if (parseInt(mval.selectionId) == parseInt(request.sessionResult)) {
            market.marketBook.runners[index].status = 'WINNER';
          } else {
            market.marketBook.runners[index].status = 'LOSER';
          }

        });
        market.sessionResult = parseInt(request.sessionResult);
        market.visible = true;
        Market.update({
          marketId: market.marketId,

        }, market, function (err, raw) {

          if (err) logger.error(err);
        });


        User.find({
          deleted: false,
          role: 'user'
        }, function (err, users) {
          if (!users) return;
          for (var i = 0; i < users.length; i++) {
            (function (user, market) {
              Bet.find({
                marketId: market.marketId,
                username: user.username,
                status: 'MATCHED',
                result: 'ACTIVE',
                deleted: false
              }, function (err, bets) {
                if (bets) {
                  //console.log(err);
                  var winners = {};
                  //calculate runnerProfit for each runner
                  var runnerProfit = {};
                  for (var i = 0; i < market.marketBook.runners.length; i++) {
                    runnerProfit[market.marketBook.runners[i].selectionId] = 0;
                    winners[market.marketBook.runners[i].selectionId] = market.marketBook.runners[i].selectionId;
                  }
                  bets.forEach(function (val, index) {
                    if (val.type == 'Back') {
                      for (var k in runnerProfit) {
                        if (k == val.runnerId) {
                          runnerProfit[k] += Math.round(((val.rate - 1) * val.stake));
                        } else {
                          runnerProfit[k] -= Math.round(val.stake);
                        }
                      }
                    } else {
                      for (var k in runnerProfit) {
                        if (k == val.runnerId) {
                          runnerProfit[k] -= Math.round(((val.rate - 1) * val.stake));
                        } else {
                          runnerProfit[k] += Math.round(val.stake);
                        }
                      }
                    }
                    if (val.type == 'Back') {
                      if (val.runnerId == request.sessionResult) {
                        val.result = 'WON';
                      } else {
                        val.result = 'LOST';
                      }
                    } else {
                      if (val.runnerId == request.sessionResult) {
                        val.result = 'LOST';
                      } else {
                        val.result = 'WON';
                      }
                    }

                    (function (val) {
                      Bet.update({
                        _id: val._id
                      }, val, function (err, raw) { });
                    })(val);
                    if (index == bets.length - 1) {
                      var maxLoss = 0;
                      var maxWinnerLoss = 0;
                      var profit = 0;
                      var i = 0,
                        j = 0;
                      for (var key in runnerProfit) {
                        if (parseInt(winners[key]) == parseInt(request.sessionResult)) {
                          if (j == 0) {
                            profit = runnerProfit[key];
                            j++;
                          } else {
                            if (profit > runnerProfit[key]) {
                              profit = runnerProfit[key];
                            }
                          }
                        }

                        if (i == 0) {
                          maxLoss = runnerProfit[key];
                          i++;
                        } else {
                          if (maxLoss > runnerProfit[key]) {
                            maxLoss = runnerProfit[key];
                          }
                        }
                      }
                      socket.emit('set-session-result-success', market);
                      // logger.info(user.username + " market: " + market.marketName + " exposure: " + maxLoss + " profit: " + profit);
                      user.exposure = user.exposure - maxLoss;
                      user.balance = user.balance - maxLoss;
                      user.balance = user.balance + profit;
                      var oldLimit = user.limit;
                      user.limit = user.limit + profit;
                      (function (user, market, profit, oldLimit) {
                        User.update({
                          username: user.username
                        }, user, function (err, raw) {
                          //console.log(raw);
                          if (err) return;

                          var today = new Date();
                          if (today.getDate() <= 9) {
                            var acdate = '0' + today.getDate();
                          } else {
                            var acdate = today.getDate();
                          }

                          if ((today.getMonth() + 1) <= 9) {
                            var acmonth = '0' + (today.getMonth() + 1);
                          } else {
                            var acmonth = (today.getMonth() + 1);
                          }

                          var date = today.getFullYear() + '-' + acmonth + '-' + acdate;
                          // io.emit("user-details-"+user._id, user);
                          var log = new Log();
                          log.createdAt = date;
                          log.username = user.username;
                          log.action = 'AMOUNT';
                          log.subAction = 'AMOUNT_WON';

                          if (profit < 0) {
                            log.subAction = 'AMOUNT_LOST';
                            log.amount = profit;
                          } else {
                            log.amount = profit;
                          }
                          log.description = 'Profit: ' + profit + ' Old Limit: ' + oldLimit + ' New Limit: ' + user.limit;

                          log.marketId = market.marketId;
                          log.marketName = market.marketName;
                          log.oldLimit = oldLimit;
                          log.newLimit = user.limit;
                          log.eventId = market.eventId;
                          log.eventName = market.eventName;
                          log.competitionId = market.competitionId;
                          log.competitionName = market.competitionName;
                          log.eventTypeId = market.eventTypeId;
                          log.eventTypeName = market.eventTypeName;
                          log.manager = user.manager;
                          log.time = new Date();
                          log.deleted = false;
                          log.save(function (err) { });

                          if (log.subAction == 'AMOUNT_LOST' && profit < 0) {
                            if (user.referal && user.rfcommisionloss) {
                              if (user.rfcommisionloss == 0) {
                                var commisionall = 0;
                              } else {
                                var commisionall = Math.round(-1 * profit * user.rfcommisionloss / 100);
                              }
                              var logs = new Logsettlement();
                              logs.createdAt = date;
                              logs.username = user.username;
                              logs.action = 'AMOUNT';
                              logs.amount = commisionall;
                              logs.manager = user.referal;
                              logs.relation = user.manager;
                              logs.master = user.master;
                              logs.subadmin = user.subadmin;
                              logs.subAction = 'MATCH_FEE';
                              logs.commision = 'MATCH_FEE';
                              logs.remark = 'U earn commision' + market.eventName + '' + market.marketName + ' Commision' + commisionall;
                              logs.marketId = market.marketId;
                              logs.marketName = market.marketName;
                              logs.eventId = market.eventId;
                              logs.eventName = market.eventName;
                              logs.competitionId = market.competitionId;
                              logs.competitionName = market.competitionName;
                              logs.eventTypeId = market.eventTypeId;
                              logs.eventTypeName = market.eventTypeName;
                              logs.time = new Date();
                              logs.deleted = false;
                              logs.save(function (err) { });
                            }
                          }

                          if (log.subAction == 'AMOUNT_LOST' && profit < 0) {
                            if (user.commisionloss) {
                              if (user.rfcommisionloss > 0) {
                                var totalamount = Math.round(-1 * profit * (user.commisionloss + user.rfcommisionloss) / 100);
                                var commision = Math.round(-1 * profit * user.commisionloss / 100);

                              } else {
                                var totalamount = Math.round(-1 * profit * user.commisionloss / 100);
                                var commision = Math.round(-1 * profit * user.commisionloss / 100);

                              }
                              User.findOne({
                                deleted: false,
                                role: 'user',
                                username: user.username,
                              }, function (err, useronecomm) {

                                User.findOne({
                                  deleted: false,
                                  role: 'manager',
                                  username: user.manager,
                                }, function (err, manageronecomm) {

                                  var managerCommision = Math.round(100) - Math.round(manageronecomm.commisionadmin + manageronecomm.commisionsubadmin + manageronecomm.commision);
                                  var masterCommision = manageronecomm.commision;
                                  var subadminCommision = manageronecomm.commisionsubadmin;
                                  var adminCommision = manageronecomm.commisionadmin;


                                  useronecomm.balance = useronecomm.balance + commision;
                                  var oldLimits = useronecomm.limit;
                                  useronecomm.limit = useronecomm.limit + commision;
                                  User.update({
                                    username: useronecomm.username
                                  }, useronecomm, function (err, raw) {
                                    updateBalance(useronecomm, function (res) { });
                                  });
                                  var logCommision = new Log();
                                  logCommision.username = useronecomm.username;
                                  logCommision.createdAt = date;
                                  logCommision.action = 'COMMISION';
                                  logCommision.subAction = 'AMOUNT_WON';
                                  logCommision.totalamount = commision;
                                  logCommision.amount = totalamount;
                                  logCommision.remark = market.eventName + ' ' + market.marketName + 'Commision: ' + commision;
                                  logCommision.description = market.eventName + ' ' + market.marketName + ' ' + commision;
                                  logCommision.manager = useronecomm.manager;
                                  logCommision.master = useronecomm.master;
                                  logCommision.subadmin = useronecomm.subadmin;
                                  logCommision.managerSharing = managerCommision;
                                  logCommision.masterSharing = masterCommision;
                                  logCommision.subadminSharing = subadminCommision;
                                  logCommision.adminSharing = adminCommision;
                                  logCommision.oldLimit = oldLimits;
                                  logCommision.newLimit = useronecomm.limit;
                                  logCommision.marketId = market.marketId;
                                  logCommision.marketName = market.marketName;
                                  logCommision.eventId = market.eventId;
                                  logCommision.eventName = market.eventName;
                                  logCommision.competitionId = market.competitionId;
                                  logCommision.competitionName = market.competitionName;
                                  logCommision.eventTypeId = market.eventTypeId;
                                  logCommision.eventTypeName = market.eventTypeName;
                                  logCommision.manager = useronecomm.manager;
                                  logCommision.time = new Date();
                                  logCommision.deleted = false;
                                  logCommision.save(function (err) {

                                  });
                                });
                              });
                            }

                          } else {
                            updateBalance(user, function (res) { });
                          }


                          //log end
                        });
                      })(user, market, profit, oldLimit);
                    }
                  });
                }
              });
            })(users[i], market);
          }
        });
        Market.findOne({
          marketId: marketId
        }, function (err, market) {
          var runners = market.marketBook.runners;
          var newRunners = [];
          for (var l = 0; l < runners.length; l++) {
            newRunners[l] = {};
            if (request.sessionResult == runners[l].selectionId) {
              newRunners[l].status = "WINNER";
            } else {
              newRunners[l].status = "LOSER";
            }
            newRunners[l].selectionId = runners[l].selectionId;
            newRunners[l].availableToBack = runners[l].availableToBack;
            if (runners[l].availableToLay) {
              newRunners[l].availableToBack = runners[l].availableToLay;
            }

          }

          market.marketBook.runners = newRunners;
          market.marketBook.status = "CLOSED";
          Market.update({
            marketId: market.marketId
          }, market, function (err, raw) {
            if (err) logger.error(err);
            // No need to wait for this operation to complete
          });
        });

      } else {
        //console.log('result wrrong');
        socket.emit('set-session-result-success', []);
      }
    });

  } catch (err) {
    if (err) logger.error({
      'function': 'closedmarkettoss1',
      error: err
    });
  }
}
async function referRevSpecialCommision(request) {
  try {
    Market.findOne({
      deleted: false,
      marketId: request.market.marketId,
    }, function (err, market) {
      if (!market) return;
      let userbProfit = {};
      let userlProfit = {};
      let usercProfit = {};
      let referbalance;
      User.distinct('referal', {
        deleted: false,
      }, function (err, userr) {
        if (!userr) return;
        User.find({
          deleted: false,
          username: {
            $in: userr
          },
        }, async function (err, userr) {
          if (!userr) return;
          for (const variable of userr) {
            /*for (var j = 0; j < userr.length; j++) {*/
            userbProfit[variable.username] = variable.balance;
            userlProfit[variable.username] = variable.limit;
            usercProfit[variable.username] = 0;
            (async function (userf, market) {
              await User.find({
                deleted: false,
                referal: userf.username,
              }, async function (err, users) {

                if (!users) return;
                for (const variableu of users) {
                  /*for (var i = 0; i < users.length; i++) {*/

                  (async function (user, market) {
                    await Bet.find({
                      marketId: market.marketId,
                      username: user.username,
                      status: 'MATCHED',
                      deleted: false
                    }, {
                      rate: 1,
                      stake: 1,
                      type: 1,
                      result: 1,
                      runnerId: 1
                    }, async function (err, bets) {
                      var profit = 0;
                      var exposure = 0;
                      if (bets) {


                        var winners = {};
                        //calculate runnerProfit for each runner
                        var runnerProfit = {};
                        for (var i = 0; i < market.marketBook.runners.length; i++) {
                          runnerProfit[market.marketBook.runners[i].selectionId] = 0;
                          winners[market.marketBook.runners[i].selectionId] = market.marketBook.runners[i].selectionId;
                        }
                        bets.forEach(function (val, index) {
                          if (val.type == 'Back') {
                            for (var k in runnerProfit) {
                              if (k == val.runnerId) {
                                runnerProfit[k] += Math.round(((val.rate - 1) * val.stake));
                              } else {
                                runnerProfit[k] -= Math.round(val.stake);
                              }
                            }
                          } else {
                            for (var k in runnerProfit) {
                              if (k == val.runnerId) {
                                runnerProfit[k] -= Math.round(((val.rate - 1) * val.stake));
                              } else {
                                runnerProfit[k] += Math.round(val.stake);
                              }
                            }
                          }
                          if (val.type == 'Back') {
                            if (val.runnerId == market.sessionResult) {
                              val.result = 'WON';
                            } else {
                              val.result = 'LOST';
                            }
                          } else {
                            if (val.runnerId == market.sessionResult) {
                              val.result = 'LOST';
                            } else {
                              val.result = 'WON';
                            }
                          }

                          (function (val) {
                            Bet.update({
                              _id: val._id
                            }, val, function (err, raw) { });
                          })(val);
                          if (index == bets.length - 1) {
                            var maxLoss = 0;
                            var maxWinnerLoss = 0;
                            var profit = 0;
                            var i = 0,
                              j = 0;
                            for (var key in runnerProfit) {
                              if (parseInt(winners[key]) == parseInt(market.sessionResult)) {
                                if (j == 0) {
                                  profit = runnerProfit[key];
                                  j++;
                                } else {
                                  if (profit > runnerProfit[key]) {
                                    profit = runnerProfit[key];
                                  }
                                }
                              }

                              if (i == 0) {
                                maxLoss = runnerProfit[key];
                                i++;
                              } else {
                                if (maxLoss > runnerProfit[key]) {
                                  maxLoss = runnerProfit[key];
                                }
                              }
                            }


                            //logger.info(user.username + " market: " + market.marketName + " exposure: " + maxLoss + " profit: " + profit);

                            if (profit < 0) {
                              if (user.referal && user.rfcommisionloss) {

                                if (user.rfcommisionloss == 0) {
                                  var commision1 = 0;
                                } else {
                                  var commision1 = Math.round(-1 * profit * user.rfcommisionloss / 100);
                                  usercProfit[variable.username] = usercProfit[variable.username] + commision1;

                                }
                                var referbalance = userbProfit[userf.username];
                                var referlimit = userlProfit[userf.username];
                                var refercomm = usercProfit[userf.username];


                                var balance = referbalance - refercomm;
                                var oldLimits = userf.limit;
                                var limit = referlimit - refercomm;
                                User.update({
                                  username: userf.username
                                }, {
                                  $set: {
                                    "balance": balance,
                                    "limit": limit
                                  }
                                }, function (err, raw) {

                                  //console.log('err' + err)
                                  //console.log(raw)
                                });

                                /*Log.findOne({
                                  deleted: false,
                                  'marketId': market.marketId,
                                  'subAction': 'MATCH_FEE',
                                  "commision": 'MATCH_COMM',
                                  'relation': user.username,
                                  username: userf.username,
                                }, function (err, logf) {
                                  if (logf) return;*/
                                var logReCommision = new Log();
                                logReCommision.username = userf.username;
                                logReCommision.action = 'AMOUNT';
                                logReCommision.subAction = 'MATCH_FEE';
                                logReCommision.commision = 'MATCH_COMM';
                                logReCommision.description = 'Match Rev Special: ' + commision1 + ' Old Limit: ' + oldLimits + ' New Limit: ' + limit;
                                logReCommision.amount = commision1;
                                logReCommision.remark = user.username + "Special Rev Commision " + commision1;
                                logReCommision.oldLimit = oldLimits;
                                logReCommision.newLimit = limit;
                                logReCommision.relation = user.username;
                                logReCommision.marketId = market.marketId;
                                logReCommision.marketName = market.marketName;
                                logReCommision.eventId = market.eventId;
                                logReCommision.eventName = market.eventName;
                                logReCommision.competitionId = market.competitionId;
                                logReCommision.competitionName = market.competitionName;
                                logReCommision.eventTypeId = market.eventTypeId;
                                logReCommision.eventTypeName = market.eventTypeName;
                                logReCommision.manager = userf.manager;
                                logReCommision.time = new Date();
                                logReCommision.deleted = false;
                                logReCommision.save(function (err) {


                                });
                                // })

                              }
                            }
                          }
                        });

                      }
                    });
                  })(variableu, market);
                }

              });
            })(variable, market);
          }
        });
      });
    });

  } catch (e) {

  }

}

module.exports.unsettossResult = function (io, socket, request) {
  //return;
  //if(request.user.details.username!='Ztestadmin' || request.user.details.username!='osg')return;
  try {
    if (!request) return;
    if (!request.user || !request.market) return;
    if (!request.user.details) return;
    // logger.info('unsetResult: ' + JSON.stringify(request));
    if (request.user.details.role != 'admin') return;
    //if (request.user.details.role != 'admin' || request.user.details.username != 'OSGADMIN' || request.user.details.username != 'MAHIADMIN') return;
    User.findOne({
      hash: request.user.key,
      username: request.user.details.username,
      role: 'admin',
      deleted: false,
      status: 'active'
    }, function (err, dbAdmin) {
      if (err) logger.error(err);
      if (!dbAdmin) {
        logger.error("Invalid Access: " + JSON.stringify(request));
        return;
      }
      if (dbAdmin.role != 'admin') return;
      var marketId = request.market.marketId;


      Market.update({
        marketId: marketId
      }, {
        $set: {
          'marketBook.status': 'SUSPENDED',
          "managerProfit": {},
          auto: false
        }
      }, function (err, raw) {
        if (err) logger.error(err);
        Market.findOne({
          marketId: marketId,
          'marketBook.status': 'SUSPENDED'
        }, function (err, market) {

          if (err) logger.error(err);
          if (!market) return;
          socket.emit('update-market-success', {
            market: marketId
          });
          //referRevSpecialCommision(request);
          Bet.distinct("username", {
            marketId: market.marketId,
            status: 'MATCHED',
            deleted: false
          }, function (err, dbUserList) {
            unsetManagerToss(io, socket, request);
            unsetMasterToss(io, socket, request);
            unsetsubadminToss(io, socket, request);
            unsetadminToss(io, socket, request);
            if (err) logger.error(err);
            if (!dbUserList) return;
            for (var i = 0; i < dbUserList.length; i++) {
              var u = dbUserList[i];
              (function (u, market) {
                User.findOne({
                  username: u,
                  deleted: false,
                  role: 'user'
                }, function (err, user) {
                  if (err) logger.error(err);
                  if (!user) return;
                  Bet.find({
                    marketId: market.marketId,
                    username: user.username,
                    status: 'MATCHED',
                    result: {
                      $ne: "ACTIVE"
                    },
                    deleted: false
                  }, function (err, bets) {
                    if (err) logger.error(err);
                    if (!bets) return;
                    var profit = 0;
                    var exposure = 0;
                    bets.forEach(function (val, index) {
                      if (val.type == 'Back') {
                        if (val.result == 'WON') {
                          profit += Math.round((val.rate - 1) * val.stake);
                          exposure += val.stake;
                        } else {

                          if (val.result == 'LOST') profit -= val.stake;
                          exposure += val.stake;
                        }
                      } else {
                        if (val.result == 'WON') {
                          profit += val.stake;
                          exposure += Math.round((val.rate - 1) * val.stake);
                        } else {

                          if (val.result == 'LOST') profit -= Math.round((val.rate - 1) * val.stake);
                          exposure += Math.round((val.rate - 1) * val.stake);
                        }
                      }
                      if (index == bets.length - 1) {
                        var commision = 0

                        user.limit = user.limit - profit;
                        user.exposure = user.exposure - exposure;
                        user.balance = user.balance - profit - exposure;


                        (function (user, market) {
                          User.update({
                            username: user.username
                          }, user, function (err, raw) {
                            if (err) logger.error(err);
                            var today = new Date();
                            if (today.getDate() <= 9) {
                              var acdate = '0' + today.getDate();
                            } else {
                              var acdate = today.getDate();
                            }

                            if ((today.getMonth() + 1) <= 9) {
                              var acmonth = '0' + (today.getMonth() + 1);
                            } else {
                              var acmonth = (today.getMonth() + 1);
                            }

                            var date = today.getFullYear() + '-' + acmonth + '-' + acdate;



                            var log = new Log();
                            log.createdAt = date;
                            log.username = user.username;
                            log.action = 'BALANCE';
                            log.subAction = 'WRONG_RESULT';
                            log.amount = -1 * profit;
                            log.oldLimit = user.limit - profit;
                            log.newLimit = user.limit;
                            log.marketId = market.marketId;
                            log.marketName = market.marketName;
                            log.eventId = market.eventId;
                            log.eventName = market.eventName;
                            log.competitionId = market.competitionId;
                            log.competitionName = market.competitionName;
                            log.eventTypeId = market.eventTypeId;
                            log.eventTypeName = market.eventTypeName;
                            log.description = 'Balance updated. Old Limit: ' + (user.limit - profit) + '. New Limit: ' + user.limit;
                            log.manager = user.manager;
                            log.master = user.master;
                            log.subadmin = user.subadmin;
                            log.time = new Date();
                            log.deleted = false;
                            log.save(function (err) {

                              User.findOne({
                                deleted: false,
                                role: 'user',
                                username: user.username,
                              }, function (err, useronecomm) {
                                if (useronecomm.commisionloss) {
                                  var commision = Math.round(-1 * profit * useronecomm.commisionloss / 100);
                                  useronecomm.balance = useronecomm.balance - commision;
                                  var oldLimits = useronecomm.limit;
                                  useronecomm.limit = useronecomm.limit - commision;
                                  var logCommision = new Log();
                                  logCommision.createdAt = date;
                                  logCommision.username = useronecomm.username;
                                  logCommision.action = 'AMOUNT';
                                  logCommision.subAction = 'MATCH_FEE';
                                  logCommision.commision = 'MATCH_COMM';
                                  logCommision.description = 'Match Commision: ' + commision + ' Old Limit: ' + oldLimits + ' New Limit: ' + useronecomm.limit;
                                  logCommision.amount = -1 * commision;
                                  logCommision.remark = "Reverse Commision " + commision;
                                  logCommision.oldLimit = oldLimits;
                                  logCommision.newLimit = useronecomm.limit;
                                  logCommision.marketId = market.marketId;
                                  logCommision.marketName = market.marketName;
                                  logCommision.eventId = market.eventId;
                                  logCommision.eventName = market.eventName;
                                  logCommision.competitionId = market.competitionId;
                                  logCommision.competitionName = market.competitionName;
                                  logCommision.eventTypeId = market.eventTypeId;
                                  logCommision.eventTypeName = market.eventTypeName;
                                  logCommision.manager = useronecomm.manager;
                                  logCommision.time = new Date();
                                  logCommision.deleted = false;
                                  logCommision.save(function (err) {
                                    User.update({
                                      username: useronecomm.username
                                    }, useronecomm, function (err, raw) { });
                                  });
                                }


                                if (profit < 0) {
                                  if (useronecomm.referal && useronecomm.rfcommisionloss) {
                                    if (useronecomm.rfcommisionloss == 0) {
                                      var commisionall = 0;
                                    } else {
                                      var commisionall = Math.round(-1 * profit * useronecomm.rfcommisionloss / 100);


                                    }
                                    var logs = new Logsettlement();
                                    logs.createdAt = date;
                                    logs.username = old.username;
                                    logs.action = 'AMOUNT';
                                    logs.amount = -1 * commisionall;
                                    logs.manager = useronecomm.referal;
                                    logs.relation = useronecomm.manager;
                                    logs.master = useronecomm.master;
                                    logs.subadmin = useronecomm.subadmin;
                                    logs.subAction = 'MATCH_FEE';
                                    logs.commision = 'MATCH_FEE';

                                    logs.marketId = market.marketId;
                                    logs.marketName = market.marketName;
                                    logs.eventId = market.eventId;
                                    logs.eventName = market.eventName;
                                    logs.competitionId = market.competitionId;
                                    logs.competitionName = market.competitionName;
                                    logs.eventTypeId = market.eventTypeId;
                                    logs.eventTypeName = market.eventTypeName;
                                    logs.time = new Date();
                                    logs.deleted = false;
                                    logs.save(function (err) { });
                                  }
                                }


                              });

                              if (err) logger.error(err);
                              // logger.info("Username: " + log.username + " Log: " + log.description);
                            });
                          });
                        })(user, market);
                        Bet.update({
                          marketId: market.marketId,
                          username: user.username,
                          status: 'MATCHED'
                        }, {
                          $set: {
                            result: 'ACTIVE',
                            'managerresult': 'ACTIVE'
                          }
                        }, {
                          multi: true
                        }, function (err, raw) {
                          if (err) logger.error(err);
                          updateBalance(user, function (res) { });
                        });
                      }
                    });
                  });
                });
              })(u, market);
            }
          });
        });
      });
    });
  } catch (err) {
    if (err) logger.error({
      'function': 'unsettoss',
      error: err
    });
  }
}

function unsetManagerToss(io, socket, request) {
  if (!request) return;
  User.findOne({
    hash: request.user.key,
    username: request.user.details.username,
    role: 'admin',
    deleted: false,
    status: 'active'
  }, function (err, dbAdmin) {
    if (err) logger.error(err);
    if (!dbAdmin) {
      logger.error("Invalid Access: " + JSON.stringify(request));
      return;
    }
    if (dbAdmin.role != 'admin') return;
    var marketId = request.market.marketId;


    Market.update({
      marketId: marketId
    }, {
      $set: {
        'marketBook.status': 'SUSPENDED',
        "managerProfit": {},
        auto: false
      }
    }, function (err, raw) {
      if (err) logger.error(err);
      Market.findOne({
        marketId: marketId,
        'marketBook.status': 'SUSPENDED'
      }, function (err, market) {

        if (err) logger.error(err);
        if (!market) return;
        socket.emit('update-market-success', {
          market: marketId
        });
        //referRevSpecialCommision(request);
        Bet.distinct("manager", {
          marketId: market.marketId,
          status: 'MATCHED',
          deleted: false
        }, function (err, dbUserList) {
          if (err) logger.error(err);
          if (!dbUserList) return;
          for (var i = 0; i < dbUserList.length; i++) {
            var u = dbUserList[i];
            (function (u, market) {
              User.findOne({
                username: u,
                deleted: false,
                role: 'manager'
              }, function (err, user) {
                if (err) logger.error(err);
                if (!user) return;
                Bet.find({
                  marketId: market.marketId,
                  manager: user.username,
                  status: 'MATCHED',

                  deleted: false
                }, function (err, bets) {
                  if (err) logger.error(err);
                  if (!bets) return;
                  var profit = 0;
                  var exposure = 0;
                  bets.forEach(function (val, index) {
                    var comm = Math.round(100) - (val.adminCommision + val.subadminCommision + val.masterCommision);

                    if (val.type == 'Back') {
                      if (val.result == 'WON') {
                        profit += Math.round((val.rate - 1) * val.stake);
                        exposure += val.stake;
                      } else {

                        if (val.result == 'LOST') profit -= Math.round(val.stake);
                        exposure += val.stake;
                      }
                    } else {
                      if (val.result == 'WON') {
                        profit += Math.round(val.stake);
                        exposure += Math.round((val.rate - 1));
                      } else {

                        if (val.result == 'LOST') profit -= Math.round((val.rate - 1) * val.stake);
                        exposure += Math.round((val.rate - 1) * val.stake);
                      }
                    }
                    if (index == bets.length - 1) {
                      var commision = 0


                        (function (user, market) {
                          User.update({
                            username: user.username
                          }, user, function (err, raw) {
                            if (err) logger.error(err);
                            Log.remove({
                              username: user.username,
                              marketId: market.marketId
                            }, function (err, obj) {
                              // console.log(obj.result.n + " document(s) deleted admin");
                            });
                            /*  var log = new Log();
                              log.username = user.username;
                              log.action = 'BALANCE';
                              log.subAction = 'WRONG_RESULT';
                              log.amount = -1 * profit;
                              log.oldLimit = user.limit;
                              log.newLimit = user.limit;
                              log.marketId = market.marketId;
                              log.marketName = market.marketName;
                              log.eventId = market.eventId;
                              log.eventName = market.eventName;
                              log.competitionId = market.competitionId;
                              log.competitionName = market.competitionName;
                              log.eventTypeId = market.eventTypeId;
                              log.eventTypeName = market.eventTypeName;
                              log.description = market.eventName + '-' + market.marketName + 'WRONG_RESULT profit:' + profit;
  
                              log.time = new Date();
                              log.deleted = false;
                              log.save(function (err)
                              {
  
  
                                if (err) logger.error(err);
                              });*/
                          });
                        })(user, market);

                    }
                  });
                });
              });
            })(u, market);
          }
        });
      });
    });
  });
}

function unsetMasterToss(io, socket, request) {
  User.findOne({
    hash: request.user.key,
    username: request.user.details.username,
    role: 'admin',
    deleted: false,
    status: 'active'
  }, function (err, dbAdmin) {
    if (err) logger.error(err);
    if (!dbAdmin) {
      logger.error("Invalid Access: " + JSON.stringify(request));
      return;
    }
    if (dbAdmin.role != 'admin') return;
    var marketId = request.market.marketId;


    Market.update({
      marketId: marketId
    }, {
      $set: {
        'marketBook.status': 'SUSPENDED',
        "managerProfit": {},
        auto: false
      }
    }, function (err, raw) {
      if (err) logger.error(err);
      Market.findOne({
        marketId: marketId,
        'marketBook.status': 'SUSPENDED'
      }, function (err, market) {

        if (err) logger.error(err);
        if (!market) return;
        socket.emit('update-market-success', {
          market: marketId
        });
        //referRevSpecialCommision(request);
        Bet.distinct("master", {
          marketId: market.marketId,
          status: 'MATCHED',
          deleted: false
        }, function (err, dbUserList) {
          if (err) logger.error(err);
          if (!dbUserList) return;
          for (var i = 0; i < dbUserList.length; i++) {
            var u = dbUserList[i];
            (function (u, market) {
              User.findOne({
                username: u,
                deleted: false,
                role: 'master'
              }, function (err, user) {
                if (err) logger.error(err);
                if (!user) return;
                Bet.find({
                  marketId: market.marketId,
                  master: user.username,
                  status: 'MATCHED',

                  deleted: false
                }, function (err, bets) {
                  if (err) logger.error(err);
                  if (!bets) return;
                  var profit = 0;
                  var exposure = 0;
                  bets.forEach(function (val, index) {
                    var comm = Math.round(val.masterCommision);

                    if (val.type == 'Back') {
                      if (val.result == 'WON') {
                        profit += Math.round((val.rate - 1) * val.stake);
                        exposure += val.stake;
                      } else {

                        if (val.result == 'LOST') profit -= Math.round(val.stake);
                        exposure += val.stake;
                      }
                    } else {
                      if (val.result == 'WON') {
                        profit += Math.round(val.stake);
                        exposure += Math.round((val.rate - 1) * val.stake);
                      } else {

                        if (val.result == 'LOST') profit -= Math.round((val.rate - 1) * val.stake);
                        exposure += Math.round((val.rate - 1) * val.stake);
                      }
                    }
                    if (index == bets.length - 1) {
                      var commision = 0


                        (function (user, market) {
                          User.update({
                            username: user.username
                          }, user, function (err, raw) {
                            if (err) logger.error(err);
                            Log.remove({
                              username: user.username,
                              marketId: market.marketId
                            }, function (err, obj) {
                              // console.log(obj.result.n + " document(s) deleted admin");
                            });
                            /*var log = new Log();
                            log.username = user.username;
                            log.action = 'BALANCE';
                            log.subAction = 'WRONG_RESULT';
                            log.amount = -1 * profit;
                            log.oldLimit = user.limit;
                            log.newLimit = user.limit;
                            log.marketId = market.marketId;
                            log.marketName = market.marketName;
                            log.eventId = market.eventId;
                            log.eventName = market.eventName;
                            log.competitionId = market.competitionId;
                            log.competitionName = market.competitionName;
                            log.eventTypeId = market.eventTypeId;
                            log.eventTypeName = market.eventTypeName;
                            log.description = market.eventName + '-' + market.marketName + 'WRONG_RESULT profit:' + profit;
  
                            log.time = new Date();
                            log.deleted = false;
                            log.save(function (err)
                            {
  
  
                              if (err) logger.error(err);
                            });*/
                          });
                        })(user, market);

                    }
                  });
                });
              });
            })(u, market);
          }
        });
      });
    });
  });
}

function unsetsubadminToss(io, socket, request) {
  User.findOne({
    hash: request.user.key,
    username: request.user.details.username,
    role: 'admin',
    deleted: false,
    status: 'active'
  }, function (err, dbAdmin) {
    if (err) logger.error(err);
    if (!dbAdmin) {
      logger.error("Invalid Access: " + JSON.stringify(request));
      return;
    }
    if (dbAdmin.role != 'admin') return;
    var marketId = request.market.marketId;


    Market.update({
      marketId: marketId
    }, {
      $set: {
        'marketBook.status': 'SUSPENDED',
        "managerProfit": {},
        auto: false
      }
    }, function (err, raw) {
      if (err) logger.error(err);
      Market.findOne({
        marketId: marketId,
        'marketBook.status': 'SUSPENDED'
      }, function (err, market) {

        if (err) logger.error(err);
        if (!market) return;
        socket.emit('update-market-success', {
          market: marketId
        });
        //referRevSpecialCommision(request);
        Bet.distinct("subadmin", {
          marketId: market.marketId,
          status: 'MATCHED',
          deleted: false
        }, function (err, dbUserList) {
          if (err) logger.error(err);
          if (!dbUserList) return;
          for (var i = 0; i < dbUserList.length; i++) {
            var u = dbUserList[i];
            (function (u, market) {
              User.findOne({
                username: u,
                deleted: false,
                role: 'subadmin'
              }, function (err, user) {
                if (err) logger.error(err);
                if (!user) return;
                Bet.find({
                  marketId: market.marketId,
                  subadmin: user.username,
                  status: 'MATCHED',

                  deleted: false
                }, function (err, bets) {
                  if (err) logger.error(err);
                  if (!bets) return;
                  var profit = 0;
                  var exposure = 0;
                  bets.forEach(function (val, index) {
                    var comm = Math.round(val.subadminCommision);

                    if (val.type == 'Back') {
                      if (val.result == 'WON') {
                        profit += Math.round((val.rate - 1) * val.stake);
                        exposure += val.stake;
                      } else {

                        if (val.result == 'LOST') profit -= Math.round(val.stake);
                        exposure += val.stake;
                      }
                    } else {
                      if (val.result == 'WON') {
                        profit += Math.round(val.stake);
                        exposure += Math.round((val.rate - 1) * val.stake);
                      } else {

                        if (val.result == 'LOST') profit -= Math.round((val.rate - 1) * val.stake);
                        exposure += Math.round((val.rate - 1) * val.stake);
                      }
                    }
                    if (index == bets.length - 1) {
                      var commision = 0


                        (function (user, market) {
                          User.update({
                            username: user.username
                          }, user, function (err, raw) {
                            if (err) logger.error(err);
                            Log.remove({
                              username: user.username,
                              marketId: market.marketId
                            }, function (err, obj) {
                              // console.log(obj.result.n + " document(s) deleted admin");
                            });
                            /* var log = new Log();
                             log.username = user.username;
                             log.action = 'BALANCE';
                             log.subAction = 'WRONG_RESULT';
                             log.amount = -1 * profit;
                             log.oldLimit = user.limit;
                             log.newLimit = user.limit;
                             log.marketId = market.marketId;
                             log.marketName = market.marketName;
                             log.eventId = market.eventId;
                             log.eventName = market.eventName;
                             log.competitionId = market.competitionId;
                             log.competitionName = market.competitionName;
                             log.eventTypeId = market.eventTypeId;
                             log.eventTypeName = market.eventTypeName;
                             log.description = market.eventName + '-' + market.marketName + 'WRONG_RESULT profit:' + profit;
  
                             log.time = new Date();
                             log.deleted = false;
                             log.save(function (err)
                             {
  
  
                               if (err) logger.error(err);
                             });*/
                          });
                        })(user, market);

                    }
                  });
                });
              });
            })(u, market);
          }
        });
      });
    });
  });
}

function unsetadminToss(io, socket, request) {
  User.findOne({
    hash: request.user.key,
    username: request.user.details.username,
    role: 'admin',
    deleted: false,
    status: 'active'
  }, function (err, dbAdmin) {
    if (err) logger.error(err);
    if (!dbAdmin) {
      logger.error("Invalid Access: " + JSON.stringify(request));
      return;
    }
    if (dbAdmin.role != 'admin') return;
    var marketId = request.market.marketId;


    Market.update({
      marketId: marketId
    }, {
      $set: {
        'marketBook.status': 'SUSPENDED',
        "managerProfit": {},
        auto: false
      }
    }, function (err, raw) {
      if (err) logger.error(err);
      Market.findOne({
        marketId: marketId,
        'marketBook.status': 'SUSPENDED'
      }, function (err, market) {

        if (err) logger.error(err);
        if (!market) return;
        socket.emit('update-market-success', {
          market: marketId
        });

        User.findOne({

          role: 'admin'
        }, function (err, user) {
          if (err) logger.error(err);
          if (!user) return;
          Bet.find({
            marketId: market.marketId,

            status: 'MATCHED',

            deleted: false
          }, function (err, bets) {
            if (err) logger.error(err);
            if (!bets) return;
            var profit = 0;
            var exposure = 0;
            bets.forEach(function (val, index) {
              var comm = Math.round(val.adminCommision);

              if (val.type == 'Back') {
                if (val.result == 'WON') {
                  profit += Math.round((val.rate - 1) * val.stake);
                  exposure += val.stake;
                } else {

                  if (val.result == 'LOST') profit -= Math.round(val.stake);
                  exposure += val.stake;
                }
              } else {
                if (val.result == 'WON') {
                  profit += Math.round(val.stake);
                  exposure += Math.round((val.rate - 1) * val.stake);
                } else {

                  if (val.result == 'LOST') profit -= Math.round((val.rate - 1) * val.stake);
                  exposure += Math.round((val.rate - 1) * val.stake);
                }
              }
              if (index == bets.length - 1) {
                var commision = 0;


                (function (user, market) {
                  User.update({
                    username: user.username
                  }, user, function (err, raw) {
                    if (err) logger.error(err);
                    Log.remove({
                      username: 'admin',
                      marketId: market.marketId
                    }, function (err, obj) {
                      // console.log(obj.result.n + " document(s) deleted admin");
                    });
                    /*  var log = new Log();
                      log.username = 'admin';
                      log.action = 'BALANCE';
                      log.subAction = 'WRONG_RESULT';
                      log.amount = -1 * profit;
                      log.oldLimit = user.limit;
                      log.newLimit = user.limit;
                      log.marketId = market.marketId;
                      log.marketName = market.marketName;
                      log.eventId = market.eventId;
                      log.eventName = market.eventName;
                      log.competitionId = market.competitionId;
                      log.competitionName = market.competitionName;
                      log.eventTypeId = market.eventTypeId;
                      log.eventTypeName = market.eventTypeName;
                      log.description = market.eventName + '-' + market.marketName + 'WRONG_RESULT profit:' + profit;

                      log.time = new Date();
                      log.deleted = false;
                      log.save(function (err)
                      {


                        if (err) logger.error(err);
                      });*/
                  });
                })(user, market);

              }
            });
          });
        });


      });
    });
  });
}

module.exports.setTossnResult = function (io, socket, request) {
  try {
    if (!request) return;
    if (!request.user || !request.market) return;
    if (!request.user.details) return;
    if (request.user.details.role == 'admin' || request.user.details.role == 'operator') {

      closeMarketToss(io, socket, request);

    }


    //session operator result

  } catch (err) {
    if (err) logger.error({
      'function': 'settossresult',
      error: err
    });
  }
}

module.exports.createMarket = function (io, socket, request) {
  try {
    if (!request) return;
    if (!request.user || !request.market || !request.newMarket) return;
    if (!request.user.details) return;
    //logger.info("createMarket: " + JSON.stringify(request));

    var filter = {};

    if (request.user.details.role == 'admin' || request.user.details.role == 'operator') {
      User.findOne({
        hash: request.user.key,
        username: request.user.details.username,
        role: { $in: ['admin', 'operator'] },
        deleted: false,
        status: 'active'
      }, function (err, dbAdmin) {
        if (err) logger.error(err);
        if (!dbAdmin) {
          logger.error("Invalid Access: " + JSON.stringify(request));
          return;
        }
        var newId = Math.floor(Date.now()) + '';
        User.find({
          deleted: false,
          status: 'active'
        }, {
          username: 1,
          role: 1
        }, function (err, dbManagers) {
          if (err) logger.error(err);
          var managers = [];
          var subadmins = [];
          var masters = [];
          var managerStatus = {};
          var subadminStatus = {};
          var masterStatus = {};
          if (dbManagers) {
            for (var i = 0; i < dbManagers.length; i++) {
              if (dbManagers[i].role == 'manager') {
                managers.unshift(dbManagers[i].username);
                managerStatus[dbManagers[i].username] = true;

              }

              if (dbManagers[i].role == 'subadmin') {
                subadmins.unshift(dbManagers[i].username);
                subadminStatus[dbManagers[i].username] = true;

              }

              if (dbManagers[i].role == 'master') {
                masters.unshift(dbManagers[i].username);
                masterStatus[dbManagers[i].username] = true;

              }
            }
          }


          var newMarket = new Market();
          newMarket.eventTypeId = request.market.eventTypeId;
          newMarket.eventTypeName = request.market.eventTypeName;
          newMarket.competitionId = request.market.competitionId;
          newMarket.competitionName = request.market.competitionName;
          newMarket.eventId = request.market.eventId;
          newMarket.eventName = request.market.eventName;
          newMarket.openDate = request.market.openDate;
          newMarket.marketId = newId;
          newMarket.marketName = request.newMarket.marketName;
          newMarket.marketType = 'SESSION';
          newMarket.totalMatched = 0;
          newMarket.rateSource = 'Manuall';
          newMarket.visibleStatus = true;
          newMarket.marketBook = {
            status: 'SUSPENDED',
            statusLabel: 'SUSPENDED',
            inplay: true,
            availableToBack: {
              price: request.newMarket.back,
              size: 100
            },
            availableToLay: {
              price: request.newMarket.lay,
              size: 100
            }
          };
          newMarket.runners = [];
          newMarket.subadmins = subadmins;
          newMarket.managers = managers;
          newMarket.masters = masters;
          newMarket.createdBy = request.user.details.username;
          newMarket.managerStatus = managerStatus;
          newMarket.masterStatus = masterStatus;
          newMarket.subadminStatus = subadminStatus;
          newMarket.shared = false;
          newMarket.visible = true;
          newMarket.deleted = false;
          newMarket.auto = false;
          newMarket.sessionAuto = true;
          newMarket.save(function (err, newUpdatedMarket) {
            if (err) logger.error(err);
            socket.emit('create-market-success', newUpdatedMarket);
          });
        });
      });
    }


  } catch (err) {
    if (err) logger.error({
      'function': 'createmarket',
      error: err
    });
  }
};
/*module.exports.oddsresultAuto = function(io, socket, request){
  if(!request) return;
  if(!request.user || !request.market) return;
  if(!request.user.details) return;
  logger.info('unsetResult: '+JSON.stringify(request));

  User.findOne({hash:request.user.key, username:request.user.details.username, role:'admin', deleted:false, status:'active'}, function(err, dbAdmin){
    if(err) logger.error(err);
    if(!dbAdmin){
      logger.error("Invalid Access: "+JSON.stringify(request));
      return;
    }
    if(dbAdmin.role != 'admin') return;
    var marketId = request.market.marketId;

    Market.update({marketId:marketId}, {$set:{auto:true}}, function(err, raw){
      if(err) logger.error(err);

      
      socket.emit('update-market-success', {market:marketId});
       
         });
  });
}
*/
module.exports.oddsresultAuto = function (io, socket, requestCall) {
  return;
  request("https://www.betfair.com/www/sports/exchange/readonly/v1/bymarket?alt=json&marketIds=" + requestCall.market.marketId + "&rollupLimit=4&rollupModel=STAKE&types=MARKET_STATE,RUNNER_STATE,RUNNER_EXCHANGE_PRICES_BEST,RUNNER_DESCRIPTION", function (error, response, body) {
    try {
      obj = JSON.parse(response.body);
      logger.debug(JSON.stringify(obj));
    } catch (e) {
      logger.error("Error in parsing.");
      // console.log(e);
      obj = false;
    }
    if (obj) {
      // console.log(obj);
      if (obj.eventTypes) {
        for (var i = 0; i < obj.eventTypes.length; i++) {
          var eventType = obj.eventTypes[i];
          for (var j = 0; j < eventType.eventNodes.length; j++) {
            var event = eventType.eventNodes[j];
            for (var k = 0; k < event.marketNodes.length; k++) {
              var market = event.marketNodes[k];
              (function (market) {
                Market.findOne({
                  marketId: market.marketId,

                }, function (err, m) {
                  // console.log(m);
                  if (err) logger.error(err);
                  if (!m) return;
                  m.marketBook.inplay = market.state.inplay;
                  m.marketBook.complete = market.state.complete;
                  m.marketBook.status = market.state.status;
                  (function (m, market) {
                    var runners = market.runners;
                    var newRunners = [];
                    for (var l = 0; l < runners.length; l++) {
                      newRunners[l] = {};
                      newRunners[l].status = runners[l].state.status;
                      newRunners[l].sortPriority = runners[l].state.sortPriority;
                      newRunners[l].selectionId = runners[l].selectionId;
                      if (runners[l].exchange) {
                        if (runners[l].exchange.availableToBack) {
                          if (runners[l].exchange.availableToBack.length > 0) {
                            newRunners[l].availableToBack = {
                              price: runners[l].exchange.availableToBack[0].price,
                              size: runners[l].exchange.availableToBack[0].size
                            };
                          }
                        }
                        if (runners[l].exchange.availableToLay) {
                          if (runners[l].exchange.availableToLay.length > 0) {
                            newRunners[l].availableToLay = {
                              price: runners[l].exchange.availableToLay[0].price,
                              size: runners[l].exchange.availableToLay[0].size
                            };
                          }
                        }
                      }
                    }
                    m.marketBook.runners = newRunners;
                    m.managerProfit = {};
                    m.superProfit = {};
                    m.hyperProfit = {};
                    m.adminProfit = {};
                    if (m.rateSource == 'BetFair') {
                      Market.update({
                        marketId: m.marketId
                      }, m, function (err, raw) {
                        if (err) logger.error(err);
                        if (m.marketBook.status == 'CLOSED') {
                          closeMarket(m);


                        }
                      });
                    } else {
                      if (m.marketBook.status == 'CLOSED') {
                        Market.update({
                          marketId: m.marketId
                        }, m, function (err, raw) {
                          if (err) logger.error(err);
                          closeMarket(m);

                        });
                      }
                    }
                    // else{
                    //   if(m.marketBook.status=='OPEN'){
                    //     // handleWaitingBets(io, m);
                    //   }
                    // }
                  })(m, market);
                });
              })(market);
            }
          }
        }
      }
    }

  });

}
//called from broadcastActiveMarkets if market is CLOSED
function closeMarket(request) {

  if (!request) return;
  if (!request.marketId) return;
  logger.debug("closeMarket: " + JSON.stringify(request));

  var marketId = request.marketId;
  // Delete unmatched bets
  Bet.update({
    marketId: marketId,
    status: 'UNMATCHED'
  }, {
    $set: {
      deleted: true
    }
  }, {
    multi: true
  }, function (err, raw) {
    if (err) logger.error(err);
    // No need to wait for this operation to complete
  });

  Market.findOne({
    marketId: marketId,
    "marketBook.status": 'CLOSED',
    deleted: false
  }, function (err, market) {
    if (err) logger.error(err);
    if (!market) return;
    User.find({
      deleted: false,
      role: 'user'
    }, function (err, users) {
      if (!users) return;
      for (var i = 0; i < users.length; i++) {
        (function (user, market) {
          Bet.find({
            marketId: market.marketId,
            username: user.username,
            status: 'MATCHED',
            result: 'ACTIVE',
            deleted: false
          }, {
            rate: 1,
            stake: 1,
            type: 1,
            result: 1,
            runnerId: 1
          }, function (err, bets) {

            if (bets) {
              var winners = {};
              //calculate runnerProfit for each runner
              var runnerProfit = {};
              for (var i = 0; i < market.marketBook.runners.length; i++) {
                runnerProfit[market.marketBook.runners[i].selectionId] = 0;
                winners[market.marketBook.runners[i].selectionId] = market.marketBook.runners[i].status;
              }
              bets.forEach(function (val, index) {
                if (val.type == 'Back') {
                  for (var k in runnerProfit) {
                    if (k == val.runnerId) {
                      runnerProfit[k] += Math.round((val.rate - 1) * (val.stake));
                    } else {
                      runnerProfit[k] -= Math.round(val.stake);
                    }
                  }
                } else {
                  for (var k in runnerProfit) {
                    if (k == val.runnerId) {
                      runnerProfit[k] -= Math.round(((val.rate - 1) * val.stake));
                    } else {
                      runnerProfit[k] += Math.round(val.stake);
                    }
                  }
                }
                if (val.type == 'Back') {
                  if (winners[val.runnerId] == 'WINNER') {
                    val.result = 'WON';
                  } else if (winners[val.runnerId] == 'REMOVED') {
                    val.result = 'REMOVED';
                  } else if (winners[val.runnerId] == 'TIE') {
                    val.result = 'TIE';
                  } else {
                    val.result = 'LOST';
                  }
                } else {
                  if (winners[val.runnerId] == 'WINNER') {
                    val.result = 'LOST';
                  } else if (winners[val.runnerId] == 'REMOVED') {
                    val.result = 'REMOVED';
                  } else if (winners[val.runnerId] == 'TIE') {
                    val.result = 'TIE';
                  } else {
                    val.result = 'WON';
                  }
                }
                /*if(val.type == 'Back'){
                  if(winners[val.runnerId] == 'WINNER'){
                    val.result = 'WON';
                  }
                  else{
                    val.result = 'LOST';
                  }
                }
                else{
                  if(winners[val.runnerId] == 'WINNER'){
                    val.result = 'LOST';
                  }
                  else{
                    val.result = 'WON';
                  }
                }*/
                (function (val) {
                  Bet.update({
                    _id: val._id
                  }, val, function (err, raw) { });
                })(val);
                if (index == bets.length - 1) {
                  var maxLoss = 0;
                  var maxWinnerLoss = 0;
                  var profit = 0;
                  var i = 0,
                    j = 0;
                  for (var key in runnerProfit) {
                    if (winners[key] == 'WINNER') {
                      if (j == 0) {
                        profit = runnerProfit[key];
                        j++;
                      } else {
                        if (profit > runnerProfit[key]) {
                          profit = runnerProfit[key];
                        }
                      }
                    }
                    if (i == 0) {
                      maxLoss = runnerProfit[key];
                      i++;
                    } else {
                      if (maxLoss > runnerProfit[key]) {
                        maxLoss = runnerProfit[key];
                      }
                    }
                  }
                  //logger.info(user.username + " market: " + market.marketName + " exposure: " + maxLoss + " profit: " + profit);
                  User.findOne({
                    deleted: false,
                    role: 'user',
                    username: user.username
                  }, function (err, userone) {

                    var commisions = 0;
                    userone.exposure = userone.exposure - maxLoss;
                    userone.balance = userone.balance - maxLoss;
                    userone.balance = userone.balance + profit;
                    var oldLimit = userone.limit;
                    userone.limit = userone.limit + profit;

                    (function (userone, market, profit, oldLimit) {
                      User.update({
                        username: user.username
                      }, userone, function (err, raw) {
                        // if (err) return;
                        // io.emit("user-details-"+user._id, user);
                        var log = new Log();
                        log.username = userone.username;
                        log.action = 'AMOUNT';
                        log.subAction = 'AMOUNT_WON';
                        log.amount = profit;
                        log.oldLimit = oldLimit;
                        log.newLimit = userone.limit;
                        if (profit < 0) log.subAction = 'AMOUNT_LOST';
                        log.description = 'Profit: ' + profit + ' Old Limit: ' + oldLimit + ' New Limit: ' + userone.limit;
                        log.marketId = market.marketId;
                        log.marketName = market.marketName;
                        log.eventId = market.eventId;
                        log.eventName = market.eventName;
                        log.competitionId = market.competitionId;
                        log.competitionName = market.competitionName;
                        log.eventTypeId = market.eventTypeId;
                        log.eventTypeName = market.eventTypeName;
                        log.manager = userone.manager;
                        log.time = new Date();
                        log.deleted = false;
                        log.save(function (err) {
                          if (!err) {
                            //logger.error('close-market: Log entry failed for ' + userone.username);

                            if (profit > 0 && userone.commision) {
                              User.findOne({
                                deleted: false,
                                role: 'user',
                                username: userone.username
                              }, function (err, useronecomm) {
                                var commision = Math.round(profit * useronecomm.commision / 100);

                                useronecomm.balance = useronecomm.balance - commision;

                                var oldLimits = userone.limit;

                                useronecomm.limit = useronecomm.limit - commision;

                                var logCommision = new Log();
                                logCommision.username = useronecomm.username;
                                logCommision.action = 'AMOUNT';
                                logCommision.subAction = 'MATCH_FEE';
                                logCommision.commision = 'MATCH_COMM';
                                logCommision.description = 'Match Commision: ' + commision + ' Old Limit: ' + oldLimits + ' New Limit: ' + useronecomm.limit;
                                logCommision.amount = -1 * commision;
                                logCommision.oldLimit = oldLimits;
                                logCommision.newLimit = useronecomm.limit;
                                logCommision.marketId = market.marketId;
                                logCommision.marketName = market.marketName;
                                logCommision.eventId = market.eventId;
                                logCommision.eventName = market.eventName;
                                logCommision.competitionId = market.competitionId;
                                logCommision.competitionName = market.competitionName;
                                logCommision.eventTypeId = market.eventTypeId;
                                logCommision.eventTypeName = market.eventTypeName;
                                logCommision.manager = useronecomm.manager;
                                logCommision.time = new Date();
                                logCommision.deleted = false;
                                logCommision.save(function (err) {
                                  //console.log(err)

                                  //if (err) logger.error(err);
                                  User.update({
                                    username: useronecomm.username
                                  }, useronecomm, function (err, raw) {

                                  });

                                });


                              });

                            }

                            if (profit < 0 && userone.commisionloss) {
                              User.findOne({
                                deleted: false,
                                role: 'user',
                                username: userone.username
                              }, function (err, useronecomm) {
                                var commision = Math.round(-1 * profit * useronecomm.commisionloss / 100);

                                useronecomm.balance = useronecomm.balance + commision;

                                var oldLimits = userone.limit;

                                useronecomm.limit = useronecomm.limit + commision;

                                var logCommision = new Log();
                                logCommision.username = useronecomm.username;
                                logCommision.action = 'AMOUNT';
                                logCommision.subAction = 'MATCH_FEE';
                                logCommision.commision = 'MATCH_COMM';
                                logCommision.description = 'Match Commision: ' + commision + ' Old Limit: ' + oldLimits + ' New Limit: ' + useronecomm.limit;
                                logCommision.amount = commision;
                                logCommision.oldLimit = oldLimits;
                                logCommision.newLimit = useronecomm.limit;
                                logCommision.marketId = market.marketId;
                                logCommision.marketName = market.marketName;
                                logCommision.eventId = market.eventId;
                                logCommision.eventName = market.eventName;
                                logCommision.competitionId = market.competitionId;
                                logCommision.competitionName = market.competitionName;
                                logCommision.eventTypeId = market.eventTypeId;
                                logCommision.eventTypeName = market.eventTypeName;
                                logCommision.manager = useronecomm.manager;
                                logCommision.time = new Date();
                                logCommision.deleted = false;
                                logCommision.save(function (err) {
                                  //console.log(err)

                                  //if (err) logger.error(err);
                                  User.update({
                                    username: useronecomm.username
                                  }, useronecomm, function (err, raw) {

                                  });

                                });


                              });

                            }

                          }
                        });
                        // accountStatementHndl.getRunnerProfit(market,''); 
                        //log end
                      });
                    })(userone, market, profit, oldLimit);
                  });
                }
              });
            }
          });
        })(users[i], market);
      }
    });
  });
}

module.exports.marketStatusrevert = function (io, socket, request) {
  try {
    if (!request) return;
    if (!request.user || !request.market) return;
    if (!request.user.details) return;
    // logger.info('unsetResult: ' + JSON.stringify(request));

    User.findOne({
      hash: request.user.key,
      username: request.user.details.username,
      role: 'admin',
      deleted: false,
      status: 'active'
    }, function (err, dbAdmin) {
      if (err) logger.error(err);
      if (!dbAdmin) {
        logger.error("Invalid Access: " + JSON.stringify(request));
        return;
      }
      if (dbAdmin.role != 'admin') return;
      var marketId = request.market.marketId;

      Market.update({
        marketId: marketId
      }, {
        $set: {
          visible: true
        }
      }, function (err, raw) {
        if (err) logger.error(err);


        socket.emit('update-market-success', {
          market: marketId
        });

      });
    });
  } catch (err) {
    if (err) logger.error({
      'function': 'marketstatusrevert',
      error: err
    });
  }
}

module.exports.unsetResult = function (io, socket, request) {
  try {
    if (!request) return;
    if (!request.user || !request.market) return;
    if (!request.user.details) return;
    //logger.info('unsetResult: ' + JSON.stringify(request));
    if (request.user.details.role != 'admin') return;
    // if (request.user.details.role != 'admin'  || request.user.details.username != 'OSGADMIN' || request.user.details.username != 'MAHIADMIN') return;
    User.findOne({
      hash: request.user.key,
      username: request.user.details.username,
      role: 'admin',
      deleted: false,
      status: 'active'
    }, function (err, dbAdmin) {
      if (err) logger.error(err);
      if (!dbAdmin) {
        logger.error("Invalid Access: " + JSON.stringify(request));
        return;
      }
      if (dbAdmin.role != 'admin') return;
      var marketId = request.market.marketId;
      Market.update({
        marketId: marketId
      }, {
        $set: {
          'marketBook.status': 'SUSPENDED',
          "managerProfit": {},
          auto: false
        }
      }, function (err, raw) {
        if (err) logger.error(err);
        Market.findOne({
          marketId: marketId,
          'marketBook.status': 'SUSPENDED'
        }, function (err, market) {
          if (err) logger.error(err);
          if (!market) return;
          unsetManagerResult(io, socket, request);
          unsetMasterResult(io, socket, request);
          unsetsubadminResult(io, socket, request);
          unsetadminResult(io, socket, request);
          Bet.distinct("username", {
            marketId: market.marketId,
            status: 'MATCHED',
            deleted: false
          }, function (err, dbUserList) {
            if (err) logger.error(err);
            if (!dbUserList) return;
            for (var i = 0; i < dbUserList.length; i++) {
              var u = dbUserList[i];
              (function (u, market) {
                User.findOne({
                  username: u,
                  deleted: false,
                  role: 'user'
                }, function (err, user) {
                  if (err) logger.error(err);
                  if (!user) return;
                  Bet.find({
                    marketId: market.marketId,
                    username: user.username,
                    status: 'MATCHED',
                    result: {
                      $ne: "ACTIVE"
                    },
                    deleted: false
                  }, function (err, bets) {
                    if (err) logger.error(err);
                    if (!bets) return;
                    var profit = 0;
                    var exposure = 0;
                    bets.forEach(function (val, index) {
                      if (val.type == 'Back') {
                        if (val.result == 'WON') {
                          profit += Math.round((val.rate - 1) * val.stake);
                          exposure += val.stake;
                        } else {

                          if (val.result == 'LOST') profit -= val.stake;
                          exposure += val.stake;
                        }
                      } else {
                        if (val.result == 'WON') {
                          profit += val.stake;
                          exposure += Math.round((val.rate - 1) * val.stake);
                        } else {

                          if (val.result == 'LOST') profit -= Math.round((val.rate - 1) * val.stake);
                          exposure += Math.round((val.rate - 1) * val.stake);
                        }
                      }
                      if (index == bets.length - 1) {
                        var commision = 0;

                        user.limit = user.limit - profit;
                        user.exposure = user.exposure - exposure;
                        user.balance = user.balance - profit - exposure;


                        (function (user, market) {
                          User.update({
                            username: user.username
                          }, user, function (err, raw) {
                            if (err) logger.error(err);
                            var today = new Date();
                            if (today.getDate() <= 9) {
                              var acdate = '0' + today.getDate();
                            } else {
                              var acdate = today.getDate();
                            }

                            if ((today.getMonth() + 1) <= 9) {
                              var acmonth = '0' + (today.getMonth() + 1);
                            } else {
                              var acmonth = (today.getMonth() + 1);
                            }

                            var date = today.getFullYear() + '-' + acmonth + '-' + acdate;


                            var log = new Log();
                            log.createdAt = date;
                            log.username = user.username;
                            log.action = 'BALANCE';
                            log.subAction = 'WRONG_RESULT';
                            log.amount = -1 * profit;
                            log.oldLimit = user.limit - profit;
                            log.newLimit = user.limit;
                            log.marketId = market.marketId;
                            log.marketName = market.marketName;
                            log.eventId = market.eventId;
                            log.eventName = market.eventName;
                            log.competitionId = market.competitionId;
                            log.competitionName = market.competitionName;
                            log.eventTypeId = market.eventTypeId;
                            log.eventTypeName = market.eventTypeName;
                            log.description = 'Balance updated. Old Limit: ' + (user.limit - profit) + '. New Limit: ' + user.limit;
                            log.manager = user.username;
                            log.time = new Date();
                            log.deleted = false;
                            log.save(function (err) {
                              if (err) logger.error(err);

                              if (profit < 0 && user.commisionloss || user.rfcommisionloss) {
                                User.findOne({
                                  deleted: false,
                                  role: 'user',
                                  username: user.username,
                                }, function (err, useronecomm) {


                                  if (useronecomm.referal) {

                                    User.findOne({
                                      deleted: false,
                                      role: 'user',
                                      username: useronecomm.referal,
                                    }, function (err, userreferalcomm) {

                                      if (!userreferalcomm) return;

                                      if (useronecomm.commisionloss == 0) {
                                        var commision1 = 0;
                                      } else {
                                        var commision1 = Math.round(-1 * profit * useronecomm.commisionloss / 100);
                                      }

                                      useronecomm.balance = useronecomm.balance - commision1;
                                      var oldLimits = useronecomm.limit;
                                      useronecomm.limit = useronecomm.limit - commision1;
                                      var logCommision = new Log();
                                      logCommision.username = useronecomm.username;
                                      logCommision.createdAt = date;
                                      logCommision.action = 'AMOUNT';
                                      logCommision.subAction = 'MATCH_FEE';
                                      logCommision.commision = 'MATCH_COMM';
                                      logCommision.description = 'Match Commision: ' + commision1 + ' Old Limit: ' + oldLimits + ' New Limit: ' + useronecomm.limit;
                                      logCommision.amount = -1 * commision1;
                                      logCommision.remark = "Reverse Commision " + commision1;
                                      logCommision.oldLimit = oldLimits;;
                                      logCommision.newLimit = useronecomm.limit;
                                      logCommision.marketId = market.marketId;
                                      logCommision.marketName = market.marketName;
                                      logCommision.eventId = market.eventId;
                                      logCommision.eventName = market.eventName;
                                      logCommision.competitionId = market.competitionId;
                                      logCommision.competitionName = market.competitionName;
                                      logCommision.eventTypeId = market.eventTypeId;
                                      logCommision.eventTypeName = market.eventTypeName;
                                      logCommision.manager = useronecomm.manager;
                                      logCommision.time = new Date();
                                      logCommision.deleted = false;
                                      logCommision.save(function (err) {
                                        User.update({
                                          username: useronecomm.username
                                        }, useronecomm, function (err, raw) { });
                                      });


                                      if (useronecomm.rfcommisionloss == 0) {
                                        var commision2 = 0;
                                      } else {
                                        var commision2 = Math.round(-1 * profit * useronecomm.rfcommisionloss / 100);
                                      }

                                      userreferalcomm.balance = userreferalcomm.balance - commision2;
                                      var oldLimits = userreferalcomm.limit;
                                      userreferalcomm.limit = userreferalcomm.limit - commision2;
                                      var logReCommision = new Log();
                                      logReCommision.createdAt = date;
                                      logReCommision.username = userreferalcomm.username;
                                      logReCommision.action = 'AMOUNT';
                                      logReCommision.subAction = 'MATCH_FEE';
                                      logReCommision.commision = 'MATCH_COMM';
                                      logReCommision.description = 'Match Commision: ' + commision2 + ' Old Limit: ' + oldLimits + ' New Limit: ' + userreferalcomm.limit;
                                      logReCommision.amount = -1 * commision2;
                                      logReCommision.remark = useronecomm.username + "Reverse Commision " + commision2;
                                      logReCommision.oldLimit = oldLimits;
                                      logReCommision.newLimit = userreferalcomm.limit;
                                      logReCommision.marketId = market.marketId;
                                      logReCommision.marketName = market.marketName;
                                      logReCommision.eventId = market.eventId;
                                      logReCommision.eventName = market.eventName;
                                      logReCommision.competitionId = market.competitionId;
                                      logReCommision.competitionName = market.competitionName;
                                      logReCommision.eventTypeId = market.eventTypeId;
                                      logReCommision.eventTypeName = market.eventTypeName;
                                      logReCommision.manager = userreferalcomm.manager;
                                      logReCommision.time = new Date();
                                      logReCommision.deleted = false;
                                      logReCommision.save(function (err) {
                                        User.update({
                                          username: userreferalcomm.username
                                        }, userreferalcomm, function (err, raw) { });
                                      });


                                    });

                                  } else {
                                    var commision = Math.round(-1 * profit * useronecomm.commisionloss / 100);
                                    useronecomm.balance = useronecomm.balance - commision;
                                    var oldLimits = useronecomm.limit;
                                    useronecomm.limit = useronecomm.limit - commision;
                                    var logCommision = new Log();
                                    logCommision.createdAt = date;
                                    logCommision.username = useronecomm.username;
                                    logCommision.action = 'AMOUNT';
                                    logCommision.subAction = 'MATCH_FEE';
                                    logCommision.commision = 'MATCH_COMM';
                                    logCommision.description = 'Match Commision: ' + commision + ' Old Limit: ' + oldLimits + ' New Limit: ' + useronecomm.limit;
                                    logCommision.amount = -1 * commision;
                                    logCommision.remark = "Reverse Commision " + commision;
                                    logCommision.oldLimit = oldLimits;
                                    logCommision.newLimit = useronecomm.limit;
                                    logCommision.marketId = market.marketId;
                                    logCommision.marketName = market.marketName;
                                    logCommision.eventId = market.eventId;
                                    logCommision.eventName = market.eventName;
                                    logCommision.competitionId = market.competitionId;
                                    logCommision.competitionName = market.competitionName;
                                    logCommision.eventTypeId = market.eventTypeId;
                                    logCommision.eventTypeName = market.eventTypeName;
                                    logCommision.manager = useronecomm.manager;
                                    logCommision.time = new Date();
                                    logCommision.deleted = false;
                                    logCommision.save(function (err) {
                                      User.update({
                                        username: useronecomm.username
                                      }, useronecomm, function (err, raw) { });
                                    });
                                  }


                                });

                              }

                              //logger.info("Username: " + log.username + " Log: " + log.description);
                            });
                          });
                        })(user, market);
                        Bet.update({
                          marketId: market.marketId,
                          username: user.username,
                          status: 'MATCHED'
                        }, {
                          $set: {
                            result: 'ACTIVE',
                            'managerresult': 'ACTIVE'
                          }
                        }, {
                          multi: true
                        }, function (err, raw) {
                          if (err) logger.error(err);
                          updateBalance(user, function (res) { });
                        });
                      }
                    });
                  });
                });
              })(u, market);
            }
          });


        });
        socket.emit('update-market-result-success', {
          message: "odds result unset successfully.!"
        });
      });
    });
  } catch (err) {
    if (err) logger.error({
      'function': 'unsetresult',
      error: err
    });
  }
}

function unsetManagerResult(io, socket, request) {
  User.findOne({
    hash: request.user.key,
    username: request.user.details.username,
    role: 'admin',
    deleted: false,
    status: 'active'
  }, function (err, dbAdmin) {
    if (err) logger.error(err);
    if (!dbAdmin) {
      logger.error("Invalid Access: " + JSON.stringify(request));
      return;
    }
    if (dbAdmin.role != 'admin') return;
    var marketId = request.market.marketId;
    Market.update({
      marketId: marketId
    }, {
      $set: {
        'marketBook.status': 'SUSPENDED',
        "managerProfit": {},
        auto: false
      }
    }, function (err, raw) {
      if (err) logger.error(err);
      Market.findOne({
        marketId: marketId,
        'marketBook.status': 'SUSPENDED'
      }, function (err, market) {
        if (err) logger.error(err);
        if (!market) return;
        Bet.distinct("manager", {
          marketId: market.marketId,
          status: 'MATCHED',
          deleted: false
        }, function (err, dbUserList) {
          if (err) logger.error(err);
          if (!dbUserList) return;
          for (var i = 0; i < dbUserList.length; i++) {
            var u = dbUserList[i];
            (function (u, market) {
              User.findOne({
                username: u,
                deleted: false,
                role: 'manager'
              }, function (err, user) {
                if (err) logger.error(err);
                if (!user) return;
                Bet.find({
                  marketId: market.marketId,
                  manager: user.username,
                  status: 'MATCHED',

                  deleted: false
                }, function (err, bets) {
                  if (err) logger.error(err);
                  if (!bets) return;
                  var profit = 0;
                  var exposure = 0;
                  bets.forEach(function (val, index) {
                    var comm = Math.round(100) - (val.adminCommision + val.subadminCommision + val.masterCommision);

                    if (val.type == 'Back') {
                      if (val.result == 'WON') {
                        profit += Math.round((val.rate - 1) * val.stake);
                        exposure += val.stake;
                      } else {

                        if (val.result == 'LOST') profit -= Math.round(val.stake);
                        exposure += val.stake;
                      }
                    } else {
                      if (val.result == 'WON') {
                        profit += Math.round(val.stake);
                        exposure += Math.round((val.rate - 1) * val.stake);
                      } else {

                        if (val.result == 'LOST') profit -= Math.round((val.rate - 1) * val.stake);
                        exposure += Math.round((val.rate - 1) * val.stake);
                      }
                    }
                    if (index == bets.length - 1) {
                      var commision = 0;

                      (function (user, market) {
                        User.update({
                          username: user.username
                        }, user, function (err, raw) {
                          if (err) logger.error(err);
                          Log.remove({
                            username: user.username,
                            marketId: market.marketId
                          }, function (err, obj) {
                            // console.log(obj.result.n + " document(s) deleted admin");
                          });
                          /* var log = new Log();
                           log.username = user.username;
                           log.action = 'BALANCE';
                           log.subAction = 'WRONG_RESULT';
                           log.amount = -1 * profit;
                           log.oldLimit = user.limit;
                           log.newLimit = user.limit;
                           log.marketId = market.marketId;
                           log.marketName = market.marketName;
                           log.eventId = market.eventId;
                           log.eventName = market.eventName;
                           log.competitionId = market.competitionId;
                           log.competitionName = market.competitionName;
                           log.eventTypeId = market.eventTypeId;
                           log.eventTypeName = market.eventTypeName;
                           log.description = market.evenName + '-' + market.marketName + 'WRONG_RESULT-Profit:' + profit;

                           log.time = new Date();
                           log.deleted = false;
                           log.save(function (err)
                           {
                             if (err) logger.error(err);

                             //logger.info("Username: " + log.username + " Log: " + log.description);
                           });*/
                        });
                      })(user, market);

                    }
                  });
                });
              });
            })(u, market);
          }
        });


      });
      socket.emit('update-market-result-success', {
        message: "odds result unset successfully.!"
      });
    });
  });
}

function unsetMasterResult(io, socket, request) {
  User.findOne({
    hash: request.user.key,
    username: request.user.details.username,
    role: 'admin',
    deleted: false,
    status: 'active'
  }, function (err, dbAdmin) {
    if (err) logger.error(err);
    if (!dbAdmin) {
      logger.error("Invalid Access: " + JSON.stringify(request));
      return;
    }
    if (dbAdmin.role != 'admin') return;
    var marketId = request.market.marketId;
    Market.update({
      marketId: marketId
    }, {
      $set: {
        'marketBook.status': 'SUSPENDED',
        "managerProfit": {},
        auto: false
      }
    }, function (err, raw) {
      if (err) logger.error(err);
      Market.findOne({
        marketId: marketId,
        'marketBook.status': 'SUSPENDED'
      }, function (err, market) {
        if (err) logger.error(err);
        if (!market) return;
        Bet.distinct("master", {
          marketId: market.marketId,
          status: 'MATCHED',
          deleted: false
        }, function (err, dbUserList) {
          if (err) logger.error(err);
          if (!dbUserList) return;
          for (var i = 0; i < dbUserList.length; i++) {
            var u = dbUserList[i];
            (function (u, market) {
              User.findOne({
                username: u,
                deleted: false,
                role: 'master'
              }, function (err, user) {
                if (err) logger.error(err);
                if (!user) return;
                Bet.find({
                  marketId: market.marketId,
                  master: user.username,
                  status: 'MATCHED',

                  deleted: false
                }, function (err, bets) {
                  if (err) logger.error(err);
                  if (!bets) return;
                  var profit = 0;
                  var exposure = 0;
                  bets.forEach(function (val, index) {
                    var comm = Math.round(val.masterCommision);

                    if (val.type == 'Back') {
                      if (val.result == 'WON') {
                        profit += Math.round((val.rate - 1) * val.stake);
                        exposure += val.stake;
                      } else {

                        if (val.result == 'LOST') profit -= Math.round(val.stake);
                        exposure += val.stake;
                      }
                    } else {
                      if (val.result == 'WON') {
                        profit += Math.round(val.stake);
                        exposure += Math.round((val.rate - 1) * val.stake);
                      } else {

                        if (val.result == 'LOST') profit -= Math.round((val.rate - 1) * val.stake);
                        exposure += Math.round((val.rate - 1) * val.stake);
                      }
                    }
                    if (index == bets.length - 1) {
                      var commision = 0;

                      (function (user, market) {
                        User.update({
                          username: user.username
                        }, user, function (err, raw) {
                          if (err) logger.error(err);
                          Log.remove({
                            username: user.username,
                            marketId: market.marketId
                          }, function (err, obj) {
                            // console.log(obj.result.n + " document(s) deleted admin");
                          });
                          /* var log = new Log();
                           log.username = user.username;
                           log.action = 'BALANCE';
                           log.subAction = 'WRONG_RESULT';
                           log.amount = -1 * profit;
                           log.oldLimit = user.limit;
                           log.newLimit = user.limit;
                           log.marketId = market.marketId;
                           log.marketName = market.marketName;
                           log.eventId = market.eventId;
                           log.eventName = market.eventName;
                           log.competitionId = market.competitionId;
                           log.competitionName = market.competitionName;
                           log.eventTypeId = market.eventTypeId;
                           log.eventTypeName = market.eventTypeName;
                           log.description = market.evenName + '-' + market.marketName + 'WRONG_RESULT-Profit:' + profit;

                           log.time = new Date();
                           log.deleted = false;
                           log.save(function (err)
                           {
                             if (err) logger.error(err);

                             //logger.info("Username: " + log.username + " Log: " + log.description);
                           });*/
                        });
                      })(user, market);

                    }
                  });
                });
              });
            })(u, market);
          }
        });


      });
      socket.emit('update-market-result-success', {
        message: "odds result unset successfully.!"
      });
    });
  });
}

function unsetsubadminResult(io, socket, request) {
  User.findOne({
    hash: request.user.key,
    username: request.user.details.username,
    role: 'admin',
    deleted: false,
    status: 'active'
  }, function (err, dbAdmin) {
    if (err) logger.error(err);
    if (!dbAdmin) {
      logger.error("Invalid Access: " + JSON.stringify(request));
      return;
    }
    if (dbAdmin.role != 'admin') return;
    var marketId = request.market.marketId;
    Market.update({
      marketId: marketId
    }, {
      $set: {
        'marketBook.status': 'SUSPENDED',
        "managerProfit": {},
        auto: false
      }
    }, function (err, raw) {
      if (err) logger.error(err);
      Market.findOne({
        marketId: marketId,
        'marketBook.status': 'SUSPENDED'
      }, function (err, market) {
        if (err) logger.error(err);
        if (!market) return;
        Bet.distinct("subadmin", {
          marketId: market.marketId,
          status: 'MATCHED',
          deleted: false
        }, function (err, dbUserList) {
          if (err) logger.error(err);
          if (!dbUserList) return;
          for (var i = 0; i < dbUserList.length; i++) {
            var u = dbUserList[i];
            (function (u, market) {
              User.findOne({
                username: u,
                deleted: false,
                role: 'subadmin'
              }, function (err, user) {
                if (err) logger.error(err);
                if (!user) return;
                Bet.find({
                  marketId: market.marketId,
                  subadmin: user.username,
                  status: 'MATCHED',

                  deleted: false
                }, function (err, bets) {
                  if (err) logger.error(err);
                  if (!bets) return;
                  var profit = 0;
                  var exposure = 0;
                  bets.forEach(function (val, index) {
                    var comm = Math.round(val.subadminCommision);

                    if (val.type == 'Back') {
                      if (val.result == 'WON') {
                        profit += Math.round((val.rate - 1) * val.stake);
                        exposure += val.stake;
                      } else {

                        if (val.result == 'LOST') profit -= Math.round(val.stake);
                        exposure += val.stake;
                      }
                    } else {
                      if (val.result == 'WON') {
                        profit += Math.round(val.stake);
                        exposure += Math.round((val.rate - 1) * val.stake);
                      } else {

                        if (val.result == 'LOST') profit -= Math.round((val.rate - 1) * val.stake);
                        exposure += Math.round((val.rate - 1) * val.stake);
                      }
                    }
                    if (index == bets.length - 1) {
                      var commision = 0;

                      (function (user, market) {
                        User.update({
                          username: user.username
                        }, user, function (err, raw) {
                          if (err) logger.error(err);
                          Log.remove({
                            username: user.username,
                            marketId: market.marketId
                          }, function (err, obj) {
                            // console.log(obj.result.n + " document(s) deleted admin");
                          });
                          /* var log = new Log();
                           log.username = user.username;
                           log.action = 'BALANCE';
                           log.subAction = 'WRONG_RESULT';
                           log.amount = -1 * profit;
                           log.oldLimit = user.limit;
                           log.newLimit = user.limit;
                           log.marketId = market.marketId;
                           log.marketName = market.marketName;
                           log.eventId = market.eventId;
                           log.eventName = market.eventName;
                           log.competitionId = market.competitionId;
                           log.competitionName = market.competitionName;
                           log.eventTypeId = market.eventTypeId;
                           log.eventTypeName = market.eventTypeName;
                           log.description = market.evenName + '-' + market.marketName + 'WRONG_RESULT-Profit:' + profit;

                           log.time = new Date();
                           log.deleted = false;
                           log.save(function (err)
                           {
                             if (err) logger.error(err);

                             //logger.info("Username: " + log.username + " Log: " + log.description);
                           });*/
                        });
                      })(user, market);

                    }
                  });
                });
              });
            })(u, market);
          }
        });


      });
      socket.emit('update-market-result-success', {
        message: "odds result unset successfully.!"
      });
    });
  });
}

function unsetadminResult(io, socket, request) {
  User.findOne({
    hash: request.user.key,
    username: request.user.details.username,
    role: 'admin',
    deleted: false,
    status: 'active'
  }, function (err, dbAdmin) {
    if (err) logger.error(err);
    if (!dbAdmin) {
      logger.error("Invalid Access: " + JSON.stringify(request));
      return;
    }
    if (dbAdmin.role != 'admin') return;
    var marketId = request.market.marketId;
    Market.update({
      marketId: marketId
    }, {
      $set: {
        'marketBook.status': 'SUSPENDED',
        "managerProfit": {},
        auto: false
      }
    }, function (err, raw) {
      if (err) logger.error(err);
      Market.findOne({
        marketId: marketId,
        'marketBook.status': 'SUSPENDED'
      }, function (err, market) {
        if (err) logger.error(err);
        if (!market) return;

        User.findOne({
          role: 'admin',

        }, function (err, user) {
          if (err) logger.error(err);
          if (!user) return;
          Bet.find({
            marketId: market.marketId,

            status: 'MATCHED',

            deleted: false
          }, function (err, bets) {
            if (err) logger.error(err);
            if (!bets) return;
            var profit = 0;
            var exposure = 0;
            bets.forEach(function (val, index) {
              var comm = Math.round(val.adminCommision);

              if (val.type == 'Back') {
                if (val.result == 'WON') {
                  profit += Math.round((val.rate - 1) * val.stake);
                  exposure += val.stake;
                } else {

                  if (val.result == 'LOST') profit -= Math.round(val.stake);
                  exposure += val.stake;
                }
              } else {
                if (val.result == 'WON') {
                  profit += Math.round(val.stake);
                  exposure += Math.round((val.rate - 1) * val.stake);
                } else {

                  if (val.result == 'LOST') profit -= Math.round((val.rate - 1) * val.stake);
                  exposure += Math.round((val.rate - 1) * val.stake);
                }
              }
              if (index == bets.length - 1) {
                var commision = 0;

                (function (user, market) {
                  User.update({
                    username: user.username
                  }, user, function (err, raw) {
                    if (err) logger.error(err);
                    Log.remove({
                      username: 'admin',
                      marketId: market.marketId
                    }, function (err, obj) {
                      // console.log(obj.result.n + " document(s) deleted admin");
                    });
                    /* var log = new Log();
                     log.username = 'admin';
                     log.action = 'BALANCE';
                     log.subAction = 'WRONG_RESULT';
                     log.amount = -1 * profit;
                     log.oldLimit = user.limit;
                     log.newLimit = user.limit;
                     log.marketId = market.marketId;
                     log.marketName = market.marketName;
                     log.eventId = market.eventId;
                     log.eventName = market.eventName;
                     log.competitionId = market.competitionId;
                     log.competitionName = market.competitionName;
                     log.eventTypeId = market.eventTypeId;
                     log.eventTypeName = market.eventTypeName;
                     log.description = market.evenName + '-' + market.marketName + 'WRONG_RESULT-Profit:' + profit;

                     log.time = new Date();
                     log.deleted = false;
                     log.save(function (err)
                     {
                       if (err) logger.error(err);

                       //logger.info("Username: " + log.username + " Log: " + log.description);
                     });*/
                  });
                })(user, market);

              }
            });
          });
        });


      });
      socket.emit('update-market-result-success', {
        message: "odds result unset successfully.!"
      });
    });
  });
}

module.exports.updateMarket = function (io, socket, request) {
  try {
    if (!request) return;
    if (!request.user || !request.updatedMarket) return;
    if (!request.user.details) return;
    // logger.info("updateMarket: " + JSON.stringify(request));

    if (request.user.details.role == 'admin') {
      User.findOne({
        username: request.user.details.username,
        role: 'admin',
        hash: request.user.key,
        deleted: false
      }, function (err, dbAdmin) {
        if (err) logger.debug(err);
        if (dbAdmin) {
          if (request.updatedMarket.marketType == "SESSION") {
            if (request.updatedMarket.marketBook.status == "OPEN") {
              request.updatedMarket.statusLabel = "SUSPENDED";
            } else {
              request.updatedMarket.statusLabel = "OPEN";
            }

          }
          Market.update({
            marketId: request.updatedMarket.marketId
          }, request.updatedMarket, function (err, updateMessage) {
            if (err) logger.debug(err);
            logger.debug(updateMessage);
            socket.emit('update-market-success', {
              market: request.updatedMarket
            });
            if (request.updatedMarket.visible) {
              Event.update({
                "event.id": request.updatedMarket.eventId
              }, {
                $set: {
                  showScore: true
                }
              }, function (err, updateMessage) {
                if (err) logger.debug(err);
                logger.debug(updateMessage);
              });
            }
          });
        }
      });
    }

    if (request.user.details.role == 'master') {
      User.findOne({
        username: request.user.details.username,
        role: 'master',
        hash: request.user.key,
        deleted: false
      }, function (err, dbAdmin) {
        if (err) logger.debug(err);
        if (dbAdmin) {
          if (request.updatedMarket.marketType == "SESSION") {
            if (request.updatedMarket.marketBook.status == "OPEN") {
              request.updatedMarket.statusLabel = "SUSPENDED";
            } else {
              request.updatedMarket.statusLabel = "OPEN";
            }

          }
          Market.update({
            marketId: request.updatedMarket.marketId
          }, request.updatedMarket, function (err, updateMessage) {
            if (err) logger.debug(err);
            logger.debug(updateMessage);
            socket.emit('update-market-success', {
              market: request.updatedMarket
            });
            if (request.updatedMarket.visible) {
              Event.update({
                "event.id": request.updatedMarket.eventId
              }, {
                $set: {
                  showScore: true
                }
              }, function (err, updateMessage) {
                if (err) logger.debug(err);
                logger.debug(updateMessage);
              });
            }
          });
        }
      });
    }

    if (request.user.details.role == 'subadmin') {
      User.findOne({
        username: request.user.details.username,
        role: 'subadmin',
        hash: request.user.key,
        deleted: false
      }, function (err, dbAdmin) {
        if (err) logger.debug(err);
        if (dbAdmin) {
          if (request.updatedMarket.marketType == "SESSION") {
            if (request.updatedMarket.marketBook.status == "OPEN") {
              request.updatedMarket.statusLabel = "SUSPENDED";
            } else {
              request.updatedMarket.statusLabel = "OPEN";
            }

          }
          Market.update({
            marketId: request.updatedMarket.marketId
          }, request.updatedMarket, function (err, updateMessage) {
            if (err) logger.debug(err);
            logger.debug(updateMessage);
            socket.emit('update-market-success', {
              market: request.updatedMarket
            });
            if (request.updatedMarket.visible) {
              Event.update({
                "event.id": request.updatedMarket.eventId
              }, {
                $set: {
                  showScore: true
                }
              }, function (err, updateMessage) {
                if (err) logger.debug(err);
                logger.debug(updateMessage);
              });
            }
          });
        }
      });
    }
    if (request.user.details.role == 'operator') {
      User.findOne({
        username: request.user.details.username,
        role: 'operator',
        hash: request.user.key,
        deleted: false
      }, function (err, dbAdmin) {
        if (err) logger.debug(err);
        if (dbAdmin) {
          Market.update({
            marketId: request.updatedMarket.marketId
          }, request.updatedMarket, function (err, updateMessage) {
            if (err) logger.debug(err);
            logger.debug(updateMessage);
            socket.emit('update-market-success', {
              market: request.updatedMarket
            });
            if (request.updatedMarket.visible) {
              Event.update({
                "event.id": request.updatedMarket.eventId
              }, {
                $set: {
                  showScore: true
                }
              }, function (err, updateMessage) {
                if (err) logger.debug(err);
                logger.debug(updateMessage);
              });
            }
          });
        }
      });
    }
    if (request.user.details.role == 'manager') {
      User.findOne({
        username: request.user.details.username,
        role: 'manager',
        hash: request.user.key,
        deleted: false
      }, function (err, dbAdmin) {
        if (err) logger.debug(err);
        if (dbAdmin) {
          Market.update({
            marketId: request.updatedMarket.marketId
          }, {
            managers: request.updatedMarket.managers,
            managerStatus: request.updatedMarket.managerStatus
          }, function (err, updateMessage) {
            if (err) logger.debug(err);
            logger.debug(updateMessage);
            socket.emit('update-market-success', {
              market: request.updatedMarket
            });
          });
        }
      });
    }
    if (request.user.details.role == 'partner') {
      User.findOne({
        username: request.user.details.username,
        role: 'partner',
        hash: request.user.key,
        deleted: false
      }, function (err, dbPartner) {
        if (err) logger.debug(err);
        if (!dbPartner) return;
        Market.update({
          marketId: request.updatedMarket.marketId
        }, {
          managerStatus: request.updatedMarket.managerStatus
        }, function (err, updateMessage) {
          if (err) logger.debug(err);
          logger.debug(updateMessage);
          socket.emit('update-market-success', {
            market: request.updatedMarket
          });
        });
      });
    }
  } catch (err) {
    if (err) logger.error({
      'function': 'updatemarket',
      error: err
    });
  }
};

async function refersessionsCommision(request) {
  try {
    Market.findOne({
      deleted: false,
      marketId: request.market.marketId,
    }, function (err, market) {
      if (!market) return;
      let userbProfit = {};
      let userlProfit = {};
      let usercProfit = {};
      let referbalance;
      User.distinct('referal', {
        deleted: false,
      }, function (err, userr) {
        if (!userr) return;
        User.find({
          deleted: false,
          username: {
            $in: userr
          },
        }, async function (err, userr) {
          if (!userr) return;
          for (const variable of userr) {
            /*for (var j = 0; j < userr.length; j++) {*/
            userbProfit[variable.username] = variable.balance;
            userlProfit[variable.username] = variable.limit;
            usercProfit[variable.username] = 0;
            (async function (userf, market) {
              await User.find({
                deleted: false,
                referal: userf.username,
              }, async function (err, users) {

                if (!users) return;
                for (const variableu of users) {
                  /*for (var i = 0; i < users.length; i++) {*/

                  (async function (user, market) {
                    await Bet.find({
                      marketId: market.marketId,
                      username: user.username,
                      status: 'MATCHED',
                      result: 'ACTIVE',
                      deleted: false
                    }, {
                      rate: 1,
                      stake: 1,
                      type: 1,
                      result: 1,
                      runnerId: 1
                    }, async function (err, bets) {

                      var profit = 0;
                      var maxLoss = 0;
                      if (bets) {
                        bets.forEach(async function (val, index) {
                          if (val.type == 'Back') {
                            if (parseInt(val.selectionName) <= request.sessionResult) {
                              val.result = 'WON';
                              profit += Math.round(val.rate * val.stake);
                              maxLoss += val.stake;
                            } else {
                              val.result = 'LOST';
                              profit -= val.stake;
                              maxLoss += val.stake;
                            }
                          } else {
                            if (parseInt(val.selectionName) <= request.sessionResult) {
                              val.result = 'LOST';
                              profit -= Math.round(val.rate * val.stake);
                              maxLoss += Math.round(val.rate * val.stake);
                            } else {
                              val.result = 'WON';
                              profit += val.stake;
                            }
                          }
                          (function (val) {
                            /* Bet.update({
                               _id: val._id
                             }, val, function (err, raw) {});*/
                          })(val);
                          if (index == bets.length - 1) {


                            // logger.info(user.username + " market: " + market.marketName + " exposure: " + maxLoss + " profit: " + profit);

                            if (profit < 0) {
                              if (user.referal && user.rfcommisionloss) {

                                if (user.rfcommisionloss == 0) {
                                  var commision1 = 0;
                                } else {
                                  var commision1 = Math.round(-1 * profit * user.rfcommisionloss / 100);
                                  usercProfit[variable.username] = usercProfit[variable.username] + commision1;

                                }
                                var referbalance = userbProfit[userf.username];
                                var referlimit = userlProfit[userf.username];
                                var refercomm = usercProfit[userf.username];


                                var balance = referbalance + refercomm;
                                var oldLimits = userf.limit;
                                var limit = referlimit + refercomm;
                                User.update({
                                  username: userf.username
                                }, {
                                  $set: {
                                    "balance": balance,
                                    "limit": limit
                                  }
                                }, function (err, raw) {

                                  console.log('err' + err)
                                  console.log(raw)
                                });

                                /*Log.findOne({
                                  deleted: false,
                                  'marketId': market.marketId,
                                  'subAction': 'MATCH_FEE',
                                  "commision": 'MATCH_COMM',
                                  'relation': user.username,
                                  username: userf.username,
                                }, function (err, logf) {
                                  if (logf) return;*/
                                var logReCommision = new Log();
                                logReCommision.username = userf.username;
                                logReCommision.action = 'AMOUNT';
                                logReCommision.subAction = 'MATCH_FEE';
                                logReCommision.commision = 'MATCH_COMM';
                                logReCommision.description = 'Match Commision: ' + commision1 + ' Old Limit: ' + oldLimits + ' New Limit: ' + limit;
                                logReCommision.amount = commision1;
                                logReCommision.remark = user.username + "Session Commision " + commision1;
                                logReCommision.oldLimit = oldLimits;
                                logReCommision.newLimit = limit;
                                logReCommision.relation = user.username;
                                logReCommision.marketId = market.marketId;
                                logReCommision.marketName = market.marketName;
                                logReCommision.eventId = market.eventId;
                                logReCommision.eventName = market.eventName;
                                logReCommision.competitionId = market.competitionId;
                                logReCommision.competitionName = market.competitionName;
                                logReCommision.eventTypeId = market.eventTypeId;
                                logReCommision.eventTypeName = market.eventTypeName;
                                logReCommision.manager = userf.manager;
                                logReCommision.time = new Date();
                                logReCommision.deleted = false;
                                logReCommision.save(function (err) {


                                });
                                //})

                              }
                            }
                          }
                        });

                      }
                    });
                  })(variableu, market);
                }

              });
            })(variable, market);
          }
        });
      });
    });

  } catch (e) {

  }

}

module.exports.setSessionResult = function (io, socket, request) {
  try {
    if (!request) return;
    if (!request.user || !request.market) return;
    if (!request.user.details) return;
    // logger.info('setSessionResult: ' + JSON.stringify(request));
    //console.log(request);
    //if (request.sessionResult == "" || isNaN(request.sessionResult))
    //{
    //socket.emit('set-session-result-success', );
    //return;
    //}
    //return;

    Bet.distinct('marketId', {
      runnerId: { $ne: '1' },
      result: 'ACTIVE',
    }, function (err, dbBets) {


      Market.find({
        marketType: {
          $nin: ["SESSION", "Lottery", "Special", "Bookmaker"]
        },
        'marketId': { $in: dbBets },
        eventTypeId: {
          $nin: ["v9"]
        },
        "marketBook.runners.status": {
          $eq: "ACTIVE"
        },
        visible: true,
        auto: true,
        "marketBook.status": {
          $in: ["CLOSED"]
        }
      }, {
        "marketBook.marketId": 1,
        marketName: 1
      }, function (err, dbMarkets) {


        if (dbMarkets.length > 0) {
          socket.emit('update-market-result-success', {
            message: 'another match declare wait few second ' + dbBets.length
          });
          return;
        }
        if (dbMarkets.length == 0) {

          //refersessionsCommision(request);
          if (request.user.details.role == 'admin' || request.user.details.role == 'operator') {
            //console.log(request.user.details.role);


            User.findOne({
              hash: request.user.key,
              username: request.user.details.username,
              role: {
                $in: ['admin', 'operator']
              },
              deleted: false,
              status: 'active'
            }, function (err, dbAdmin) {
              if (err) logger.error(err);
              if (!dbAdmin) {
                logger.error("Invalid Access: " + JSON.stringify(request));
                return;
              }
              var marketId = request.market.marketId;
              logger.error("Call to close market " + marketId);

              Market.update({
                marketId: marketId,
                marketType: 'SESSION'
              }, {
                $set: {

                  'sessionResult': request.sessionResult
                }
              }, function (err, raw) {
                if (err) logger.error(err);
                Market.findOne({
                  marketId: marketId,
                  marketType: 'SESSION',

                }, function (err, market) {
                  if (!market) return;
                  if (!market.sessionResult) {
                    Market.update({
                      marketId: market.marketId,
                      marketType: 'SESSION'
                    }, {
                      $set: {
                        'marketBook.status': 'CLOSED',
                        'fResult': request.sessionResult
                      }
                    }, function (err, raw) { });
                  }


                  if (err) logger.error(err);
                  if (!market) return;
                  setSessionResultManager(io, socket, request);
                  setSessionResultMaster(io, socket, request);
                  setSessionResultsubAdmin(io, socket, request);
                  setSessionResultAdmin(io, socket, request);

                  setTimeout(function () {
                    socket.emit('set-session-result-success', market);
                  }, 3000);
                  User.find({
                    deleted: false,
                    role: 'user',
                  }, function (err, users) {
                    if (err) logger.error(err);
                    var counter = 0;
                    var len = users.length;
                    for (var i = 0; i < users.length; i++) {
                      (function (user, market) {

                        Bet.find({
                          marketId: market.marketId,
                          username: user.username,
                          status: 'MATCHED',
                          result: 'ACTIVE',
                          deleted: false
                        }, function (err, bets) {
                          if (err) logger.error(err);
                          var profit = 0;
                          var maxLoss = 0;
                          if (bets.length == 0) return;
                          Market.update({
                            marketId: market.marketId,
                            marketType: 'SESSION'
                          }, {
                            $set: {

                              'marketBook.status': 'CLOSED'
                            }
                          }, function (err, raw) { });
                          if (bets) {
                            bets.forEach(function (val, index) {
                              if (val.type == 'Back') {
                                if (parseInt(val.selectionName) <= request.sessionResult) {
                                  val.result = 'WON';
                                  profit += Math.round(val.rate * val.stake);
                                  maxLoss += val.stake;
                                } else {
                                  val.result = 'LOST';
                                  profit -= val.stake;
                                  maxLoss += val.stake;
                                }
                              } else {
                                if (parseInt(val.selectionName) <= request.sessionResult) {
                                  val.result = 'LOST';
                                  profit -= Math.round(val.rate * val.stake);
                                  maxLoss += Math.round(val.rate * val.stake);
                                } else {
                                  val.result = 'WON';
                                  profit += val.stake;
                                  maxLoss += Math.round(val.rate * val.stake);
                                }
                              }
                              (function (val) {
                                Bet.update({
                                  _id: val._id
                                }, val, function (err, raw) { });
                              })(val);
                              if (index == bets.length - 1) {

                                if (profit > 0) {
                                  user.exposure = user.exposure + maxLoss;
                                } else {
                                  user.exposure = user.exposure + maxLoss;
                                }

                                var oldLimit = user.limit;
                                if (profit > 0) {
                                  var commisionall = 0;
                                  user.limit = user.limit + profit;
                                  user.balance = user.limit + user.exposure;
                                } else {
                                  var commisionall = 0;

                                  user.limit = user.limit + profit + commisionall;
                                  user.balance = user.limit + user.exposure + commisionall;

                                }

                                (function (user, market, profit, oldLimit) {
                                  User.findOne({
                                    username: user.username,
                                    role: 'user',
                                    deleted: false
                                  }, function (err, old) {
                                    User.update({
                                      username: user.username
                                    }, user, function (err, raw) {
                                      var today = new Date();
                                      if (today.getDate() <= 9) {
                                        var acdate = '0' + today.getDate();
                                      } else {
                                        var acdate = today.getDate();
                                      }

                                      if ((today.getMonth() + 1) <= 9) {
                                        var acmonth = '0' + (today.getMonth() + 1);
                                      } else {
                                        var acmonth = (today.getMonth() + 1);
                                      }

                                      var date = today.getFullYear() + '-' + acmonth + '-' + acdate;

                                      //log start
                                      var log = new Log();
                                      log.createdAt = date;
                                      log.username = old.username;
                                      log.action = 'AMOUNT';
                                      if (old.limit < user.limit) {
                                        log.amount = profit;
                                        log.subAction = 'AMOUNT_WON';
                                      } else {
                                        log.amount = profit;
                                        log.subAction = 'AMOUNT_LOST';
                                      }

                                      log.oldLimit = old.limit;
                                      log.newLimit = Math.round(user.limit);
                                      log.description = 'Balance updated. Old Limit: ' + old.limit + '. New Limit: ' + (user.limit);
                                      log.manager = user.manager;
                                      log.marketId = market.marketId;
                                      log.marketName = market.marketName;
                                      log.eventId = market.eventId;
                                      log.eventName = market.eventName;
                                      log.competitionId = market.competitionId;
                                      log.competitionName = market.competitionName;
                                      log.eventTypeId = market.eventTypeId;
                                      log.eventTypeName = market.eventTypeName;
                                      log.time = new Date();
                                      log.deleted = false;
                                      log.save(function (err) { });
                                      if (log.subAction == 'AMOUNT_LOST' && profit < 0) {
                                        if (user.referal && user.rfcommisionloss) {
                                          if (user.rfcommisionloss == 0) {
                                            var commisionall = 0;
                                          } else {
                                            var commisionall = Math.round(-1 * profit * user.rfcommisionloss / 100);
                                          }
                                          var logs = new Logsettlement();
                                          logs.createdAt = date;
                                          logs.username = old.username;
                                          logs.action = 'AMOUNT';
                                          logs.amount = commisionall;
                                          logs.manager = user.referal;
                                          logs.relation = user.manager;
                                          logs.master = user.master;
                                          logs.subadmin = user.subadmin;
                                          logs.subAction = 'MATCH_FEE';
                                          logs.commision = 'MATCH_FEE';
                                          logs.remark = 'U earn commision' + market.eventName + '' + market.marketName + ' Commision' + commisionall;
                                          logs.marketId = market.marketId;
                                          logs.marketName = market.marketName;
                                          logs.eventId = market.eventId;
                                          logs.eventName = market.eventName;
                                          logs.competitionId = market.competitionId;
                                          logs.competitionName = market.competitionName;
                                          logs.eventTypeId = market.eventTypeId;
                                          logs.eventTypeName = market.eventTypeName;
                                          logs.time = new Date();
                                          logs.deleted = false;
                                          logs.save(function (err) { });
                                        }
                                      }

                                      if (log.subAction == 'AMOUNT_LOST' && profit < 0) {
                                        if (user.commisionloss) {
                                          if (user.rfcommisionloss > 0) {
                                            var totalamount = Math.round(-1 * profit * (user.commisionloss + user.rfcommisionloss) / 100);
                                            var commision = Math.round(-1 * profit * user.commisionloss / 100);

                                          } else {
                                            var totalamount = Math.round(-1 * profit * user.commisionloss / 100);
                                            var commision = Math.round(-1 * profit * user.commisionloss / 100);

                                          }
                                          User.findOne({
                                            deleted: false,
                                            role: 'user',
                                            username: user.username,
                                          }, function (err, useronecomm) {

                                            User.findOne({
                                              deleted: false,
                                              role: 'manager',
                                              username: user.manager,
                                            }, function (err, manageronecomm) {

                                              var managerCommision = Math.round(100) - Math.round(manageronecomm.commisionadmin + manageronecomm.commisionsubadmin + manageronecomm.commision);
                                              var masterCommision = manageronecomm.commision;
                                              var subadminCommision = manageronecomm.commisionsubadmin;
                                              var adminCommision = manageronecomm.commisionadmin;

                                              useronecomm.balance = useronecomm.balance + commision;
                                              var oldLimits = useronecomm.limit;
                                              useronecomm.limit = useronecomm.limit + commision;
                                              User.update({
                                                username: useronecomm.username
                                              }, useronecomm, function (err, raw) {

                                              });
                                              var logCommision = new Log();
                                              logCommision.username = useronecomm.username;
                                              logCommision.createdAt = date;
                                              logCommision.action = 'COMMISION';
                                              logCommision.subAction = 'AMOUNT_WON';
                                              logCommision.totalamount = commision;
                                              logCommision.amount = totalamount;
                                              logCommision.remark = market.eventName + ' ' + market.marketName + 'Commision: ' + commision;
                                              logCommision.description = market.eventName + ' ' + market.marketName + ' ' + commision;
                                              logCommision.manager = useronecomm.manager;
                                              logCommision.master = useronecomm.master;
                                              logCommision.subadmin = useronecomm.subadmin;
                                              logCommision.managerSharing = managerCommision;
                                              logCommision.masterSharing = masterCommision;
                                              logCommision.subadminSharing = subadminCommision;
                                              logCommision.adminSharing = adminCommision;
                                              logCommision.oldLimit = oldLimits;
                                              logCommision.newLimit = useronecomm.limit;
                                              logCommision.marketId = market.marketId;
                                              logCommision.marketName = market.marketName;
                                              logCommision.eventId = market.eventId;
                                              logCommision.eventName = market.eventName;
                                              logCommision.competitionId = market.competitionId;
                                              logCommision.competitionName = market.competitionName;
                                              logCommision.eventTypeId = market.eventTypeId;
                                              logCommision.eventTypeName = market.eventTypeName;
                                              logCommision.manager = useronecomm.manager;
                                              logCommision.time = new Date();
                                              logCommision.deleted = false;
                                              logCommision.save(function (err) {

                                              });
                                            });
                                          });
                                        }

                                      }

                                      updateBalance(user, function (res) { });

                                    });
                                  });
                                })(user, market, profit, oldLimit);
                                //betStatement.getRunnerProfit(io, socket, request);

                              }
                            });
                          }
                        });
                      })(users[i], market);
                    }
                  });
                });
              });
            });
          }
          //session operator result


        }
      });
    });
  } catch (err) {
    if (err) logger.error({
      'function': 'setsessionresult',
      error: err
    });
  }
}

function setSessionResultManager(io, socket, request) {
  try {
    if (!request) return;
    if (!request.user || !request.market) return;
    if (!request.user.details) return;
    // logger.info('setSessionResultManager: ' + JSON.stringify(request));
    //console.log(request);
    if (request.user.details.role == 'admin' || request.user.details.role == 'operator') {
      //console.log(request.user.details.role);
      User.findOne({
        hash: request.user.key,
        username: request.user.details.username,
        deleted: false,
        status: 'active'
      }, function (err, dbAdmin) {
        if (err) logger.error(err);
        if (!dbAdmin) {
          logger.error("Invalid Access: " + JSON.stringify(request));
          return;
        }
        var marketId = request.market.marketId;
        logger.error("Call to close market " + marketId);
        Market.update({
          marketId: marketId,
          marketType: 'SESSION'
        }, {
          $set: {
            'marketBook.status': 'CLOSED',
            'sessionResult': request.sessionResult
          }
        }, function (err, raw) {
          if (err) logger.error(err);
          Market.findOne({
            marketId: marketId,
            marketType: 'SESSION',
            'marketBook.status': 'CLOSED'
          }, function (err, market) {
            if (err) logger.error(err);
            if (!market) return;


            Bet.distinct("manager", {
              status: 'MATCHED',
              "marketId": marketId,
              deleted: false
            }, function (err, users) {
              if (err) logger.error(err);

              for (var i = 0; i < users.length; i++) {
                (function (user, market) {

                  Bet.find({
                    marketId: market.marketId,
                    manager: user,
                    status: 'MATCHED',
                    deleted: false
                  }, function (err, bets) {
                    if (err) logger.error(err);
                    var profit = 0;
                    var balanceprofit = 0;
                    var commision = 0;
                    var stake = 0;
                    if (bets) {

                      Market.update({
                        marketId: market.marketId,
                        deleted: false,
                        'marketBook.status': 'CLOSED'
                      }, {
                        $set: {
                          managerProfit: market.managerProfit
                        }
                      }, function (err, raw) { });

                      bets.forEach(function (val, index) {

                        var totalComm = Math.round(100) - Math.round(val.adminCommision + val.masterCommision + val.subadminCommision);
                        // console.log("totalComm" + totalComm)

                        if (val.type == 'Back') {
                          if (parseInt(val.selectionName) <= request.sessionResult) {
                            val.managerresult = 'WON';

                            profit += Math.round(val.rate * val.stake);
                          } else {
                            val.managerresult = 'LOST';
                            profit -= Math.round(val.stake);
                          }
                        } else {
                          if (parseInt(val.selectionName) <= request.sessionResult) {
                            val.managerresult = 'LOST';
                            profit -= Math.round(val.rate * val.stake);
                          } else {
                            val.managerresult = 'WON';
                            profit += Math.round(val.stake);
                          }
                        }
                        (function (val) {

                        })(val);
                        if (index == bets.length - 1) {
                          logger.debug(user + " market: " + market.marketName + " exposure: " + profit + " profit: " + profit);

                          if (market.managerProfit) {
                            market.managerProfit[user] = profit;
                          } else {
                            market.managerProfit = {};
                            market.managerProfit[user] = profit;

                          }

                          User.findOne({
                            username: user
                          }, function (err, userData) {

                            var today = new Date();
                            if (today.getDate() <= 9) {
                              var acdate = '0' + today.getDate();
                            } else {
                              var acdate = today.getDate();
                            }

                            if ((today.getMonth() + 1) <= 9) {
                              var acmonth = '0' + (today.getMonth() + 1);
                            } else {
                              var acmonth = (today.getMonth() + 1);
                            }

                            var date = today.getFullYear() + '-' + acmonth + '-' + acdate;

                            var log = new Log();
                            log.createdAt = date;
                            log.username = userData.username;
                            log.action = 'AMOUNT';
                            if (profit < 0) {
                              log.amount = -1 * profit;
                              log.subAction = 'AMOUNT_WON';
                            } else {
                              log.amount = profit;
                              log.subAction = 'AMOUNT_LOST';
                            }

                            log.oldLimit = userData.limit;
                            log.newLimit = userData.limit;
                            log.description = market.eventName + "-" + market.marketName + '-Profit:' + -1 * profit;
                            log.master = userData.master;
                            log.subadmin = userData.subadmin;
                            log.marketId = market.marketId;
                            log.marketName = market.marketName;
                            log.eventId = market.eventId;
                            log.eventName = market.eventName;
                            log.competitionId = market.competitionId;
                            log.competitionName = market.competitionName;
                            log.eventTypeId = market.eventTypeId;
                            log.eventTypeName = market.eventTypeName;
                            log.time = new Date();
                            log.deleted = false;
                            Log.findOne({
                              marketId: market.marketId,
                              username: userData.username,
                            }, function (err, userData) {
                              if (!userData) {
                                log.save(function (err) { });
                              }
                            });



                            Market.update({
                              marketId: market.marketId,
                              deleted: false,
                              'marketBook.status': 'CLOSED'
                            }, {
                              $set: {
                                managerProfit: market.managerProfit
                              }
                            }, function (err, raw) { });
                          });


                        }
                      });
                    }
                  });
                })(users[i], market);
              }
            });
          });
        });
      });
    }
  } catch (err) {
    if (err) logger.error({
      'function': 'setsessionmanagerresult',
      error: err
    });
  }
}

function setSessionResultMaster(io, socket, request) {
  try {
    if (!request) return;
    if (!request.user || !request.market) return;
    if (!request.user.details) return;
    // logger.info('setSessionResultManager: ' + JSON.stringify(request));
    //console.log(request);
    if (request.user.details.role == 'admin' || request.user.details.role == 'operator') {
      //console.log(request.user.details.role);
      User.findOne({
        hash: request.user.key,
        username: request.user.details.username,
        deleted: false,
        status: 'active'
      }, function (err, dbAdmin) {
        if (err) logger.error(err);
        if (!dbAdmin) {
          logger.error("Invalid Access: " + JSON.stringify(request));
          return;
        }
        var marketId = request.market.marketId;
        logger.error("Call to close market " + marketId);
        Market.update({
          marketId: marketId,
          marketType: 'SESSION'
        }, {
          $set: {
            'marketBook.status': 'CLOSED',

          }
        }, function (err, raw) {
          if (err) logger.error(err);
          Market.findOne({
            marketId: marketId,
            marketType: 'SESSION',
            'marketBook.status': 'CLOSED'
          }, function (err, market) {
            if (err) logger.error(err);
            if (!market) return;


            Bet.distinct("master", {
              status: 'MATCHED',
              "marketId": marketId,
              deleted: false
            }, function (err, users) {
              if (err) logger.error(err);

              for (var i = 0; i < users.length; i++) {
                (function (user, market) {

                  Bet.find({
                    marketId: market.marketId,
                    master: user,
                    status: 'MATCHED',
                    deleted: false
                  }, function (err, bets) {
                    if (err) logger.error(err);
                    var profit = 0;
                    var balanceprofit = 0;
                    var commision = 0;
                    var stake = 0;
                    if (bets) {

                      Market.update({
                        marketId: market.marketId,
                        deleted: false,
                        'marketBook.status': 'CLOSED'
                      }, {
                        $set: {
                          masterProfit: market.masterProfit
                        }
                      }, function (err, raw) { });

                      bets.forEach(function (val, index) {
                        if (val.type == 'Back') {
                          if (parseInt(val.selectionName) <= request.sessionResult) {
                            val.managerresult = 'WON';

                            profit += Math.round(val.rate * val.stake);
                          } else {
                            val.managerresult = 'LOST';
                            profit -= Math.round(val.stake);
                          }
                        } else {
                          if (parseInt(val.selectionName) <= request.sessionResult) {
                            val.managerresult = 'LOST';
                            profit -= Math.round(val.rate * val.stake);
                          } else {
                            val.managerresult = 'WON';
                            profit += Math.round(val.stake);
                          }
                        }
                        (function (val) {

                        })(val);
                        if (index == bets.length - 1) {
                          logger.debug(user + " market: " + market.marketName + " exposure: " + profit + " profit: " + profit);

                          if (market.masterProfit) {
                            market.masterProfit[user] = profit;
                          } else {
                            market.masterProfit = {};
                            market.masterProfit[user] = profit;

                          }
                          User.findOne({
                            username: user
                          }, function (err, userData) {
                            var today = new Date();
                            if (today.getDate() <= 9) {
                              var acdate = '0' + today.getDate();
                            } else {
                              var acdate = today.getDate();
                            }

                            if ((today.getMonth() + 1) <= 9) {
                              var acmonth = '0' + (today.getMonth() + 1);
                            } else {
                              var acmonth = (today.getMonth() + 1);
                            }

                            var date = today.getFullYear() + '-' + acmonth + '-' + acdate;


                            var log = new Log();
                            log.createdAt = date;
                            log.username = userData.username;
                            log.action = 'AMOUNT';
                            if (profit < 0) {
                              log.amount = -1 * profit;
                              log.subAction = 'AMOUNT_WON';
                            } else {
                              log.amount = profit;
                              log.subAction = 'AMOUNT_LOST';
                            }

                            log.oldLimit = userData.limit;
                            log.newLimit = userData.limit;
                            log.description = market.eventName + "-" + market.marketName + '-Profit:' + -1 * profit;
                            log.subadmin = userData.subadmin;
                            log.marketId = market.marketId;
                            log.marketName = market.marketName;
                            log.eventId = market.eventId;
                            log.eventName = market.eventName;
                            log.competitionId = market.competitionId;
                            log.competitionName = market.competitionName;
                            log.eventTypeId = market.eventTypeId;
                            log.eventTypeName = market.eventTypeName;
                            log.time = new Date();
                            log.deleted = false;
                            Log.findOne({
                              marketId: market.marketId,
                              username: userData.username,
                            }, function (err, userData) {
                              if (!userData) {
                                log.save(function (err) { });
                              }
                            });
                            Market.update({
                              marketId: market.marketId,
                              deleted: false,
                              'marketBook.status': 'CLOSED'
                            }, {
                              $set: {
                                masterProfit: market.masterProfit
                              }
                            }, function (err, raw) { });
                          });


                        }
                      });
                    }
                  });
                })(users[i], market);
              }
            });
          });
        });
      });
    }
  } catch (err) {
    if (err) logger.error({
      'function': 'setsessionmanagerresult',
      error: err
    });
  }
}

function setSessionResultsubAdmin(io, socket, request) {
  try {
    if (!request) return;
    if (!request.user || !request.market) return;
    if (!request.user.details) return;
    // logger.info('setSessionResultManager: ' + JSON.stringify(request));
    //console.log(request);
    if (request.user.details.role == 'admin' || request.user.details.role == 'operator') {
      //console.log(request.user.details.role);
      User.findOne({
        hash: request.user.key,
        username: request.user.details.username,
        deleted: false,
        status: 'active'
      }, function (err, dbAdmin) {
        if (err) logger.error(err);
        if (!dbAdmin) {
          logger.error("Invalid Access: " + JSON.stringify(request));
          return;
        }
        var marketId = request.market.marketId;
        logger.error("Call to close market " + marketId);
        Market.update({
          marketId: marketId,
          marketType: 'SESSION'
        }, {
          $set: {
            'marketBook.status': 'CLOSED',

          }
        }, function (err, raw) {
          if (err) logger.error(err);
          Market.findOne({
            marketId: marketId,
            marketType: 'SESSION',
            'marketBook.status': 'CLOSED'
          }, function (err, market) {
            if (err) logger.error(err);
            if (!market) return;


            Bet.distinct("subadmin", {
              status: 'MATCHED',
              "marketId": marketId,
              deleted: false
            }, function (err, users) {
              if (err) logger.error(err);

              for (var i = 0; i < users.length; i++) {
                (function (user, market) {

                  Bet.find({
                    marketId: market.marketId,
                    subadmin: user,
                    status: 'MATCHED',
                    deleted: false
                  }, function (err, bets) {
                    if (err) logger.error(err);
                    var profit = 0;
                    var balanceprofit = 0;
                    var commision = 0;
                    var stake = 0;
                    if (bets) {

                      Market.update({
                        marketId: market.marketId,
                        deleted: false,
                        'marketBook.status': 'CLOSED'
                      }, {
                        $set: {
                          subadminProfit: market.subadminProfit
                        }
                      }, function (err, raw) { });

                      bets.forEach(function (val, index) {
                        if (val.type == 'Back') {
                          if (parseInt(val.selectionName) <= request.sessionResult) {
                            val.managerresult = 'WON';

                            profit += Math.round(val.rate * val.stake);
                          } else {
                            val.managerresult = 'LOST';
                            profit -= Math.round(val.stake);
                          }
                        } else {
                          if (parseInt(val.selectionName) <= request.sessionResult) {
                            val.managerresult = 'LOST';
                            profit -= Math.round(val.rate * val.stake);
                          } else {
                            val.managerresult = 'WON';
                            profit += Math.round(val.stake);
                          }
                        }
                        (function (val) {

                        })(val);
                        if (index == bets.length - 1) {
                          logger.debug(user + " market: " + market.marketName + " exposure: " + profit + " profit: " + profit);

                          if (market.subadminProfit) {
                            market.subadminProfit[user] = profit;
                          } else {
                            market.subadminProfit = {};
                            market.subadminProfit[user] = profit;

                          }
                          User.findOne({
                            username: user
                          }, function (err, userData) {
                            var today = new Date();
                            if (today.getDate() <= 9) {
                              var acdate = '0' + today.getDate();
                            } else {
                              var acdate = today.getDate();
                            }

                            if ((today.getMonth() + 1) <= 9) {
                              var acmonth = '0' + (today.getMonth() + 1);
                            } else {
                              var acmonth = (today.getMonth() + 1);
                            }

                            var date = today.getFullYear() + '-' + acmonth + '-' + acdate;


                            var log = new Log();
                            log.createdAt = date;
                            log.username = userData.username;
                            log.action = 'AMOUNT';
                            if (profit < 0) {
                              log.amount = -1 * profit;
                              log.subAction = 'AMOUNT_WON';
                            } else {
                              log.amount = profit;
                              log.subAction = 'AMOUNT_LOST';
                            }

                            log.oldLimit = userData.limit;
                            log.newLimit = userData.limit;
                            log.description = market.eventName + "-" + market.marketName + '-Profit:' + -1 * profit;
                            log.marketId = market.marketId;
                            log.marketName = market.marketName;
                            log.eventId = market.eventId;
                            log.eventName = market.eventName;
                            log.competitionId = market.competitionId;
                            log.competitionName = market.competitionName;
                            log.eventTypeId = market.eventTypeId;
                            log.eventTypeName = market.eventTypeName;
                            log.time = new Date();
                            log.deleted = false;
                            Log.findOne({
                              marketId: market.marketId,
                              username: userData.username,
                            }, function (err, userData) {
                              if (!userData) {
                                log.save(function (err) { });
                              }
                            });
                            Market.update({
                              marketId: market.marketId,
                              deleted: false,
                              'marketBook.status': 'CLOSED'
                            }, {
                              $set: {
                                subadminProfit: market.subadminProfit
                              }
                            }, function (err, raw) { });
                          });


                        }
                      });
                    }
                  });
                })(users[i], market);
              }
            });
          });
        });
      });
    }
  } catch (err) {
    if (err) logger.error({
      'function': 'setsessionmanagerresult',
      error: err
    });
  }
}

function setSessionResultAdmin(io, socket, request) {
  try {
    if (!request) return;
    if (!request.user || !request.market) return;
    if (!request.user.details) return;
    // logger.info('setSessionResultManager: ' + JSON.stringify(request));
    //console.log(request);
    if (request.user.details.role == 'admin' || request.user.details.role == 'operator') {
      //console.log(request.user.details.role);
      User.findOne({
        hash: request.user.key,
        username: request.user.details.username,
        deleted: false,
        status: 'active'
      }, function (err, dbAdmin) {
        if (err) logger.error(err);
        if (!dbAdmin) {
          logger.error("Invalid Access: " + JSON.stringify(request));
          return;
        }
        var marketId = request.market.marketId;
        logger.error("Call to close market " + marketId);
        Market.update({
          marketId: marketId,
          marketType: 'SESSION'
        }, {
          $set: {
            'marketBook.status': 'CLOSED',

          }
        }, function (err, raw) {
          if (err) logger.error(err);
          Market.findOne({
            marketId: marketId,
            marketType: 'SESSION',
            'marketBook.status': 'CLOSED'
          }, function (err, market) {
            if (err) logger.error(err);
            if (!market) return;

            market.adminProfit = {};


            Bet.find({
              marketId: market.marketId,

              status: 'MATCHED',
              deleted: false
            }, function (err, bets) {
              if (err) logger.error(err);
              var profit = 0;
              var balanceprofit = 0;
              var commision = 0;
              var stake = 0;
              if (bets) {

                Market.update({
                  marketId: market.marketId,
                  deleted: false,
                  'marketBook.status': 'CLOSED'
                }, {
                  $set: {
                    adminProfit: market.adminProfit
                  }
                }, function (err, raw) { });

                bets.forEach(function (val, index) {
                  //console.log('val.adminCommision' + val.adminCommision)
                  if (val.type == 'Back') {
                    if (parseInt(val.selectionName) <= request.sessionResult) {
                      val.managerresult = 'WON';

                      profit += Math.round(val.rate * val.stake);
                      //console.log('step1' + profit)

                    } else {
                      val.managerresult = 'LOST';
                      profit -= Math.round(val.stake);
                      //console.log('step2' + profit)

                    }
                  } else {
                    if (parseInt(val.selectionName) <= request.sessionResult) {
                      val.managerresult = 'LOST';
                      profit -= Math.round(val.rate * val.stake);
                      // console.log('step3' + profit)
                    } else {
                      val.managerresult = 'WON';
                      profit += Math.round(val.stake);
                      //console.log('step4' + profit)
                    }
                  }
                  (function (val) {

                  })(val);
                  if (index == bets.length - 1) {
                    //console.log('step5' + profit)
                    if (market.adminProfit) {
                      market.adminProfit['admin'] = profit;
                    } else {
                      market.adminProfit = {};
                      market.adminProfit['admin'] = profit;

                    }
                    User.findOne({
                      role: 'admin'
                    }, function (err, AdminUser) {
                      if (!AdminUser) return;

                      var today = new Date();
                      if (today.getDate() <= 9) {
                        var acdate = '0' + today.getDate();
                      } else {
                        var acdate = today.getDate();
                      }

                      if ((today.getMonth() + 1) <= 9) {
                        var acmonth = '0' + (today.getMonth() + 1);
                      } else {
                        var acmonth = (today.getMonth() + 1);
                      }

                      var date = today.getFullYear() + '-' + acmonth + '-' + acdate;
                      var log = new Log();
                      log.createdAt = date;
                      log.username = 'admin';
                      log.action = 'AMOUNT';
                      if (profit < 0) {
                        log.amount = -1 * profit;
                        log.subAction = 'AMOUNT_WON';
                      } else {
                        log.amount = profit;
                        log.subAction = 'AMOUNT_LOST';
                      }

                      log.oldLimit = AdminUser.limit;
                      log.newLimit = AdminUser.limit;
                      log.description = market.eventName + "-" + market.marketName + '-Profit:' + -1 * profit;

                      log.marketId = market.marketId;
                      log.marketName = market.marketName;
                      log.eventId = market.eventId;
                      log.eventName = market.eventName;
                      log.competitionId = market.competitionId;
                      log.competitionName = market.competitionName;
                      log.eventTypeId = market.eventTypeId;
                      log.eventTypeName = market.eventTypeName;
                      log.time = new Date();
                      log.deleted = false;
                      Log.findOne({
                        marketId: market.marketId,
                        username: 'admin',
                      }, function (err, userData) {
                        if (!userData) {
                          log.save(function (err) { });
                        }
                      });
                    });
                    Market.update({
                      marketId: market.marketId,
                      deleted: false,
                      'marketBook.status': 'CLOSED'
                    }, {
                      $set: {
                        adminProfit: market.adminProfit
                      }
                    }, function (err, raw) { });


                  }
                });

              }
            });
          });
        });
      });
    }
  } catch (err) {
    if (err) logger.error({
      'function': 'setsessionmanagerresult',
      error: err
    });
    console.log(err)
  }
}

function updateBalance(user, done) {
  try {
    var balance = 0;
    var request = {};
    request.user = {};
    request.user.details = user; {
      User.findOne({
        username: user.username,
        deleted: false
      }, function (err, result) {
        request.user._id = result._id;
        if (result.username != request.user.details.username) {
          logger.error("updateBalance error: invalid details");
          done(-1);
          return;
        } else {
          User.findOne({
            username: request.user.details.username,
            deleted: false
          }, function (err, user) {
            if (!user) {
              logger.error("updateBalance error: UnauthorizedError");
              done(-1);
              return;
            }
            Bet.find({
              username: user.username,
              deleted: false,
              status: 'MATCHED',
              result: 'ACTIVE'
            }, {
              marketId: 1
            }, function (err, bets) {
              if (err) {
                done(-1);
                return;
              }
              if (!bets) {
                User.update({
                  username: user.username
                }, {
                  $set: {
                    balance: user.limit,
                    exposure: 0
                  }
                }, function (err, raw) { });
                done(-1);
                return;
              }
              if (bets.length < 1) {
                User.update({
                  username: user.username
                }, {
                  $set: {
                    balance: user.limit,
                    exposure: 0
                  }
                }, function (err, raw) { });
                done(-1);
                return;
              }
              var markets = [];
              var j = 0;
              for (var i = 0; i < bets.length; i++) {
                var flag = 0;
                for (var k = 0; k < markets.length; k++) {
                  if (bets[i].marketId == markets[k]) {
                    flag = 1;
                    break;
                  }
                }
                if (flag == 0) {
                  markets[j] = bets[i].marketId;
                  j++;
                }
              }
              Market.find({
                managers: user.manager,
                deleted: false,
                marketId: {
                  $in: markets
                }
              }, function (err, markets) {
                if (err) {
                  logger.error("updateBalance error: DBError");
                  done(-1);
                  return;
                }
                if (markets.length == 0) {
                  logger.error("updateBalance error: no market found");
                  done(-1);
                  return;
                }
                var exposure = 0;
                var counter = 0;
                var len = markets.length;
                markets.forEach(function (market, index) {
                  if (market.marketType != 'SESSION') {
                    (function (market, mindex, callback) {
                      Bet.find({
                        marketId: market.marketId,
                        username: user.username,
                        status: 'MATCHED',
                        result: 'ACTIVE',
                        deleted: false
                      }, function (err, bets) {
                        if (err) {
                          callback(0, mindex);
                          return;
                        }
                        if (bets.length == 0) {
                          callback(0, mindex);
                          return;
                        }
                        //calculate runnerProfit for each runner
                        var runnerProfit = {};
                        for (var i = 0; i < market.marketBook.runners.length; i++) {
                          runnerProfit[market.marketBook.runners[i].selectionId] = 0;
                        }
                        bets.forEach(function (val, index) {
                          if (val.type == 'Back') {
                            for (var k in runnerProfit) {
                              if (k == val.runnerId && val.status == 'MATCHED') {
                                runnerProfit[k] += Math.round(((val.rate - 1) * val.stake));
                              } else {
                                runnerProfit[k] -= Math.round(val.stake);
                              }
                            }
                          } else {
                            for (var k in runnerProfit) {
                              if (k == val.runnerId || val.status == 'UNMATCHED') {
                                runnerProfit[k] -= Math.round(((val.rate - 1) * val.stake));
                              } else {
                                runnerProfit[k] += Math.round(val.stake);
                              }
                            }
                          }
                          if (index == bets.length - 1) {
                            var maxLoss = 0;
                            var profit = 0;
                            var i = 0,
                              j = 0;
                            for (var key in runnerProfit) {
                              if (i == 0) {
                                maxLoss = runnerProfit[key];
                                i++;
                              } else {
                                if (maxLoss > runnerProfit[key]) {
                                  maxLoss = runnerProfit[key];
                                }
                              }
                            }
                            callback(maxLoss, mindex);
                            return;
                          }
                        });
                      });
                    })(market, index, function (e, i) {
                      counter++;
                      if (counter == len) {
                        exposure += e * 1;
                        user.balance = user.limit + exposure;
                        User.update({
                          _id: user._id
                        }, {
                          $set: {
                            balance: user.balance,
                            exposure: exposure
                          }
                        }, function (err, raw) {
                          done(1);
                          return;
                        });
                      } else {
                        exposure += e * 1;
                      }
                    });
                  } else {
                    (function (market, mindex, callback) {
                      Bet.find({
                        marketId: market.marketId,
                        username: user.username,
                        status: 'MATCHED',
                        result: 'ACTIVE',
                        deleted: false
                      }, function (err, bets) {
                        if (bets.length < 1) {
                          callback(0);
                        }
                        var min = 0,
                          max = 0,
                          bc = 0;
                        var len = bets.length;
                        bets.forEach(function (b, bi) {
                          bc++;
                          if (bc == 1) {
                            min = parseInt(b.selectionName);
                            max = parseInt(b.selectionName);
                          } else {
                            if (parseInt(b.selectionName) > max) max = parseInt(b.selectionName);
                            if (parseInt(b.selectionName) < min) min = parseInt(b.selectionName);
                          }
                          if (bc == len) {
                            bc = 0;
                            var ml = 0;
                            for (var i = min - 1; i < max + 1; i++) {
                              (function (result, callback) {
                                var c2 = 0,
                                  maxLoss = 0;
                                bets.forEach(function (b1, bi1) {
                                  c2++;
                                  if (b1.type == 'Back') {
                                    if (result >= parseInt(b1.selectionName)) {
                                      maxLoss += Math.round(b1.rate * b1.stake);
                                    } else {
                                      maxLoss -= b1.stake;
                                    }
                                  } else {
                                    if (result < parseInt(b1.selectionName)) {
                                      maxLoss += b1.stake;
                                    } else {
                                      maxLoss -= Math.round(b1.rate * b1.stake);
                                    }
                                  }
                                  if (c2 == bets.length) {
                                    callback(maxLoss);
                                  }
                                });
                              })(i, function (maxLoss) {
                                bc++;
                                if (bc == 1) {
                                  ml = maxLoss;
                                } else {
                                  if (ml > maxLoss) ml = maxLoss;
                                }
                                if (bc == (max - min + 2)) {
                                  //logger.info(user);
                                  logger.info("max loss " + ml);
                                  callback(ml, mindex);
                                  return;
                                }
                              });
                            }
                          }
                        });
                      });
                    })(market, index, function (e, i) {
                      counter++;
                      if (counter == len) {
                        exposure += e * 1;
                        user.balance = user.limit + exposure;
                        User.update({
                          _id: user._id
                        }, {
                          $set: {
                            balance: user.balance,
                            exposure: exposure
                          }
                        }, function (err, raw) {
                          done(1);
                          return;
                        });
                      } else {
                        exposure += e * 1;
                      }
                    });
                  }
                });
              });
            });
          });
        }
      });
    }
  } catch (err) {
    if (err) logger.error({
      'function': 'updatebaance',
      error: err
    });
  }
}

async function referrevsessionsCommision(request) {

  try {

    Market.findOne({
      deleted: false,
      marketId: request.market.marketId,
    }, function (err, market) {

      if (!market) return;

      let userbProfit = {};
      let userlProfit = {};
      let usercProfit = {};
      let referbalance;
      User.distinct('referal', {
        deleted: false,
      }, function (err, userr) {
        if (!userr) return;
        User.find({
          deleted: false,
          username: {
            $in: userr
          },
        }, async function (err, userr) {
          if (!userr) return;
          for (const variable of userr) {
            /*for (var j = 0; j < userr.length; j++) {*/
            userbProfit[variable.username] = variable.balance;
            userlProfit[variable.username] = variable.limit;
            usercProfit[variable.username] = 0;
            (async function (userf, market) {
              await User.find({
                deleted: false,
                referal: userf.username,
              }, async function (err, users) {

                if (!users) return;
                for (const variableu of users) {
                  /*for (var i = 0; i < users.length; i++) {*/

                  (async function (user, market) {
                    await Bet.find({
                      marketId: market.marketId,
                      username: user.username,
                      status: 'MATCHED',
                      deleted: false
                    }, {
                      rate: 1,
                      stake: 1,
                      type: 1,
                      result: 1,
                      runnerId: 1
                    }, async function (err, bets) {

                      var profit = 0;
                      var maxLoss = 0;
                      if (bets) {
                        bets.forEach(function (val, index) {
                          if (val.type == 'Back') {
                            if (parseInt(val.selectionName) <= market.sessionResult) {
                              val.result = 'WON';
                              profit += Math.round(val.rate * val.stake);
                              maxLoss += val.stake;
                            } else {
                              val.result = 'LOST';
                              profit -= val.stake;
                              maxLoss += val.stake;
                            }
                          } else {
                            if (parseInt(val.selectionName) <= market.sessionResult) {
                              val.result = 'LOST';
                              profit -= Math.round(val.rate * val.stake);
                              maxLoss += Math.round(val.rate * val.stake);
                            } else {
                              val.result = 'WON';
                              profit += val.stake;
                            }
                          }
                          (function (val) {
                            Bet.update({
                              _id: val._id
                            }, val, function (err, raw) { });
                          })(val);
                          if (index == bets.length - 1) {


                            //logger.info(user.username + " market: " + market.marketName + " exposure: " + maxLoss + " profit: " + profit);


                          }
                        });

                      }
                    });
                  })(variableu, market);
                }

              });
            })(variable, market);
          }
        });
      });
    });

  } catch (e) {
    console.log(e)
  }

}

module.exports.unsetSessionResult = function (io, socket, request) {
  try {
    if (!request) return;
    if (request.user.details.role != 'admin') return;
    if (!request.user.details) return;
    //logger.info('unsetSessionResult: ' + JSON.stringify(request));
    if (!request.user || !request.market) return;
    console.log('request.user.details.username' + request.user.details.username)
    //if(request.user.details.role!='admin' || request.user.details.username!='ZTESTADMINS' || request.user.details.username!='MAHIADMIN' || request.user.details.username!='OSGADMIN')return;
    //if (request.market.eventId != '31645595') return;
    console.log('request.user.details.usernamemmmmmmm' + request.user.details.username)
    if (request.user.details.role == 'admin') {

      User.findOne({
        hash: request.user.key,
        username: request.user.details.username,
        role: 'admin',
        deleted: false,
        status: 'active'
      }, function (err, dbAdmin) {
        if (err) logger.error(err);
        if (!dbAdmin) {
          //logger.error("Invalid Access: " + JSON.stringify(request));
          return;
        }
        if (dbAdmin.role != 'admin') return;
        var marketId = request.market.marketId;
        Market.update({
          marketId: marketId,
          marketType: 'SESSION'
        }, {
          $set: {
            'marketBook.status': 'SUSPENDED',
            'sessionResult': '',
          }
        },
          function (err, raw) {
            if (err) logger.error(err);
            Market.findOne({
              marketId: marketId,
              marketType: 'SESSION',
              'marketBook.status': 'SUSPENDED'
            }, function (err, market) {
              //referrevsessionsCommision(request);

              if (err) logger.error(err);
              if (!market) return;
              unsetsessionManger(io, socket, request);
              unsetsessionMaster(io, socket, request);
              unsetsessionsubAdmin(io, socket, request);
              unsetsessionAdmin(io, socket, request);
              Bet.distinct("username", {
                marketId: market.marketId,

                status: 'MATCHED',
                deleted: false
              }, function (err, dbUserList) {
                if (err) logger.error(err);
                if (!dbUserList) return;
                for (var i = 0; i < dbUserList.length; i++) {
                  var u = dbUserList[i];
                  (function (u, market) {
                    User.findOne({
                      username: u,
                      deleted: false,
                      role: 'user'
                    }, function (err, user) {
                      if (err) logger.error(err);
                      if (!user) return;
                      Bet.find({
                        marketId: market.marketId,
                        username: user.username,
                        status: 'MATCHED',
                        deleted: false
                      }, function (err, bets) {
                        if (err) logger.error(err);
                        if (!bets) return;
                        var profit = 0;
                        var maxloss = 0;
                        bets.forEach(function (val, index) {
                          if (val.type == 'Back') {
                            if (val.result == 'WON') profit += Math.round(val.rate * val.stake);
                            else
                              if (val.result == 'LOST') profit -= val.stake;
                          } else {
                            if (val.result == 'WON') profit += val.stake;
                            else
                              if (val.result == 'LOST') profit -= Math.round(val.rate * val.stake);
                          }
                          var commision = 0;
                          if (index == bets.length - 1) {
                            var balanceold = user.balance;
                            var limitold = user.limit;
                            user.limit = user.limit - profit;
                            user.balance = user.balance - profit;

                            console.log('profit' + profit);
                            console.log('user.balance' + user.balance);
                            console.log('user.user' + user.username);

                            var balanceStatus = user.balance;
                            if (user.balance < 0) {

                              user.balance = balanceold;
                              user.limit = limitold;
                              user.betStatus = false;
                              console.log('balance afetr' + user.balance);
                            }

                            (function (user, market, profit, balanceStatus) {
                              User.update({
                                username: user.username
                              }, user, function (err, raw) {
                                if (err) logger.error(err);
                                var today = new Date();
                                if (today.getDate() <= 9) {
                                  var acdate = '0' + today.getDate();
                                } else {
                                  var acdate = today.getDate();
                                }

                                if ((today.getMonth() + 1) <= 9) {
                                  var acmonth = '0' + (today.getMonth() + 1);
                                } else {
                                  var acmonth = (today.getMonth() + 1);
                                }

                                var date = today.getFullYear() + '-' + acmonth + '-' + acdate;

                                var log = new Log();
                                log.createdAt = date;
                                log.username = user.username;
                                log.action = 'BALANCE';
                                log.subAction = 'RESETTLED_SSN';
                                log.amount = -1 * profit;
                                log.oldLimit = user.limit - profit;
                                log.newLimit = user.limit;
                                log.marketId = market.marketId;
                                log.marketName = market.marketName;
                                log.eventId = market.eventId;
                                log.eventName = market.eventName;
                                log.competitionId = market.competitionId;
                                log.competitionName = market.competitionName;
                                log.eventTypeId = market.eventTypeId;
                                log.eventTypeName = market.eventTypeName;
                                log.description = 'Balance updated. Old Limit: ' + (user.limit - profit) + '. New Limit: ' + user.limit;
                                log.manager = user.manager;
                                log.master = user.master;
                                log.subadmin = user.subadmin;
                                log.time = new Date();
                                log.deleted = false;
                                log.save(function (err) {
                                  console.log('balanceStatus' + balanceStatus)
                                  if (balanceStatus < 0) {

                                    var logM = new LogMinus();

                                    logM.username = user.username;
                                    logM.action = 'BALANCE';
                                    logM.subAction = 'RESETTLED_SSN';
                                    logM.amount = -1 * profit;
                                    logM.oldLimit = user.limit - profit;
                                    logM.newLimit = user.limit;
                                    logM.marketId = market.marketId;
                                    logM.marketName = market.marketName;
                                    logM.eventId = market.eventId;
                                    logM.eventName = market.eventName;
                                    logM.competitionId = market.competitionId;
                                    logM.competitionName = market.competitionName;
                                    logM.eventTypeId = market.eventTypeId;
                                    logM.eventTypeName = market.eventTypeName;
                                    logM.description = 'user bet inavlid';
                                    logM.manager = user.manager;
                                    logM.master = user.master;
                                    logM.subadmin = user.subadmin;
                                    logM.time = new Date();
                                    logM.deleted = false;
                                    logM.save(function (err) { });
                                    User.update({

                                      username: user.username,

                                    }, {
                                      $set: {
                                        betStatus: false,


                                      }
                                    }, {
                                      multi: true
                                    }, function (err, raw) {
                                      if (err) logger.error(err);
                                      // updateBalance(user, function(res) {});
                                    });
                                    Bet.update({
                                      marketId: market.marketId,
                                      username: user.username,
                                      status: 'MATCHED'
                                    }, {
                                      $set: {
                                        deleted: true,


                                      }
                                    }, {
                                      multi: true
                                    }, function (err, raw) {
                                      if (err) logger.error(err);
                                      updateBalance(user, function (res) { });
                                    });
                                  } else {
                                    Bet.update({
                                      marketId: market.marketId,
                                      username: user.username,
                                      status: 'MATCHED'
                                    }, {
                                      $set: {
                                        result: 'ACTIVE',
                                        managerresult: 'ACTIVE'
                                      }
                                    }, {
                                      multi: true
                                    }, function (err, raw) {
                                      if (err) logger.error(err);
                                      updateBalance(user, function (res) { });
                                    });
                                  }
                                });
                              });
                            })(user, market, profit, balanceStatus);
                            //manager balance manage after result unset




                          }
                        });
                      });
                    });
                  })(u, market);
                }
              });
            });
          });
      });

    }

    if (request.user.details.role == 'operator') {
      return;
      User.findOne({
        hash: request.user.key,
        username: request.user.details.username,
        role: 'operator',
        deleted: false,
        status: 'active'
      }, function (err, dbAdmin) {
        if (err) logger.error(err);
        if (!dbAdmin) {
          logger.error("Invalid Access: " + JSON.stringify(request));
          return;
        }
        if (dbAdmin.role != 'operator') return;
        var marketId = request.market.marketId;
        Market.update({
          marketId: marketId,
          marketType: 'SESSION'
        }, {
          $set: {
            'marketBook.status': 'SUSPENDED',
            'sessionResult': '',
          }
        }, function (err, raw) {
          if (err) logger.error(err);
          Market.findOne({
            marketId: marketId,
            marketType: 'SESSION',
            'marketBook.status': 'SUSPENDED'
          }, function (err, market) {
            if (err) logger.error(err);
            if (!market) return;
            unsetsessionManger(io, socket, request);
            unsetsessionMaster(io, socket, request);
            unsetsessionsubAdmin(io, socket, request);
            unsetsessionAdmin(io, socket, request);
            Bet.distinct("username", {
              marketId: market.marketId,
              status: 'MATCHED',
              deleted: false
            }, function (err, dbUserList) {
              if (err) logger.error(err);
              if (!dbUserList) return;
              for (var i = 0; i < dbUserList.length; i++) {
                var u = dbUserList[i];
                (function (u, market) {
                  User.findOne({
                    username: u,
                    deleted: false,
                    role: 'user'
                  }, function (err, user) {
                    if (err) logger.error(err);
                    if (!user) return;
                    Bet.find({
                      marketId: market.marketId,
                      username: user.username,
                      status: 'MATCHED',
                      deleted: false
                    }, function (err, bets) {
                      if (err) logger.error(err);
                      if (!bets) return;
                      var profit = 0;
                      bets.forEach(function (val, index) {
                        if (val.type == 'Back') {
                          if (val.result == 'WON') profit += Math.round(val.rate * val.stake);
                          else
                            if (val.result == 'LOST') profit -= val.stake;
                        } else {
                          if (val.result == 'WON') profit += val.stake;
                          else
                            if (val.result == 'LOST') profit -= Math.round(val.rate * val.stake);
                        }
                        if (index == bets.length - 1) {
                          user.limit = user.limit - profit;
                          user.balance = user.balance - profit;
                          (function (user, market) {
                            User.update({
                              username: user.username
                            }, user, function (err, raw) {
                              if (err) logger.error(err);

                              var today = new Date();
                              if (today.getDate() <= 9) {
                                var acdate = '0' + today.getDate();
                              } else {
                                var acdate = today.getDate();
                              }

                              if ((today.getMonth() + 1) <= 9) {
                                var acmonth = '0' + (today.getMonth() + 1);
                              } else {
                                var acmonth = (today.getMonth() + 1);
                              }

                              var date = today.getFullYear() + '-' + acmonth + '-' + acdate;
                              var log = new Log();
                              log.createdAt = date;
                              log.username = user.username;
                              log.action = 'BALANCE';
                              log.subAction = 'RESETTLED_SSN';
                              log.amount = -1 * profit;
                              log.oldLimit = user.limit - profit;
                              log.newLimit = user.limit;
                              log.marketId = market.marketId;
                              log.marketName = market.marketName;
                              log.eventId = market.eventId;
                              log.eventName = market.eventName;
                              log.competitionId = market.competitionId;
                              log.competitionName = market.competitionName;
                              log.eventTypeId = market.eventTypeId;
                              log.eventTypeName = market.eventTypeName;
                              log.description = 'Balance updated. Old Limit: ' + (user.limit - profit) + '. New Limit: ' + user.limit;
                              log.manager = user.manager;
                              log.master = user.master;
                              log.subadmin = user.subadmin;
                              log.time = new Date();
                              log.deleted = false;
                              log.save(function (err) {
                                if (err) logger.error(err);
                                /// logger.info("Username: " + log.username + " Log: " + log.description);
                              });
                            });
                          })(user, market);
                          //manager balance manage after result unset


                          Bet.update({
                            marketId: market.marketId,
                            username: user.username,
                            status: 'MATCHED'
                          }, {
                            $set: {
                              result: 'ACTIVE'
                            }
                          }, {
                            multi: true
                          }, function (err, raw) {
                            if (err) logger.error(err);
                            updateBalance(user, function (res) { });
                          });
                        }
                      });
                    });
                  });
                })(u, market);
              }
            });
          });
        });
      });

    }

  } catch (err) {
    if (err) logger.error({
      'function': 'unsetresult',
      error: err
    });
  }
}

function unsetsessionManger(io, socket, request) {
  User.findOne({
    hash: request.user.key,
    username: request.user.details.username,
    role: 'admin',
    deleted: false,
    status: 'active'
  }, function (err, dbAdmin) {
    if (err) logger.error(err);
    if (!dbAdmin) {
      logger.error("Invalid Access: " + JSON.stringify(request));
      return;
    }
    if (dbAdmin.role != 'admin') return;
    var marketId = request.market.marketId;
    Market.update({
      marketId: marketId,
      marketType: 'SESSION'
    }, {
      $set: {
        'marketBook.status': 'SUSPENDED',
        'sessionResult': '',
      }
    },
      function (err, raw) {
        if (err) logger.error(err);
        Market.findOne({
          marketId: marketId,
          marketType: 'SESSION',
          'marketBook.status': 'SUSPENDED'
        }, function (err, market) {
          //referrevsessionsCommision(request);

          if (err) logger.error(err);
          if (!market) return;
          Bet.distinct("manager", {
            marketId: market.marketId,
            status: 'MATCHED',
            deleted: false
          }, function (err, dbUserList) {
            if (err) logger.error(err);
            if (!dbUserList) return;
            for (var i = 0; i < dbUserList.length; i++) {
              var u = dbUserList[i];
              (function (u, market) {
                User.findOne({
                  username: u,
                  deleted: false,
                  role: 'manager'
                }, function (err, user) {
                  if (err) logger.error(err);
                  if (!user) return;
                  Bet.find({
                    marketId: market.marketId,
                    manager: user.username,
                    status: 'MATCHED',
                    deleted: false
                  }, function (err, bets) {
                    if (err) logger.error(err);
                    if (!bets) return;
                    var profit = 0;
                    var maxloss = 0;
                    bets.forEach(function (val, index) {
                      var comm = Math.round(100) - (val.masterCommision + val.subadminCommision + val.adminCommision);
                      if (val.type == 'Back') {
                        if (val.result == 'WON') profit += Math.round(val.rate * val.stake);
                        else
                          if (val.result == 'LOST') profit -= Math.round(val.stake);
                      } else {
                        if (val.result == 'WON') profit += Math.round(val.stake);
                        else
                          if (val.result == 'LOST') profit -= Math.round(val.rate * val.stake);
                      }
                      var commision = 0;
                      if (index == bets.length - 1) {


                        (function (user, market) {
                          User.update({
                            username: user.username
                          }, user, function (err, raw) {
                            if (err) logger.error(err);
                            Log.remove({
                              username: user.username,
                              marketId: market.marketId
                            }, function (err, obj) {
                              // console.log(obj.result.n + " document(s) deleted admin");
                            });
                            /*     Log.findOne(
                            {
                             username:user.username,marketId:market.marketId
                            }, function (err, LogOne)
                            {
                              if(!LogOne)return;
                              if(profit>0)
                              {
                                var amount=LogOne[i].amount-profit;
                              }
                              else
                              {
                                var amount=LogOne[i].amount+profit;
                              }
                             
                               Log.updateOne({username:user.username,marketId:market.marketId},
                                {$set:{amount:amount}}, function(err,raw){

                                });

                             }); */

                            /*var log = new Log();
                            log.username = user.username;
                            log.action = 'BALANCE';
                            log.subAction = 'RESETTLED_SSN';
                            log.amount = -1 * profit;
                            log.oldLimit = user.limit;
                            log.newLimit = user.limit;
                            log.marketId = market.marketId;
                            log.marketName = market.marketName;
                            log.eventId = market.eventId;
                            log.eventName = market.eventName;
                            log.competitionId = market.competitionId;
                            log.competitionName = market.competitionName;
                            log.eventTypeId = market.eventTypeId;
                            log.eventTypeName = market.eventTypeName;
                            log.description = market.eventName + " " + market.marketName + ' Reverse Profit:' + profit;

                            log.time = new Date();
                            log.deleted = false;
                            log.save(function (err) {});*/
                          });
                        })(user, market);
                        //manager balance manage after result unset


                      }
                    });
                  });
                });
              })(u, market);
            }
          });
        });
      });
  });
}

function unsetsessionMaster(io, socket, request) {
  User.findOne({
    hash: request.user.key,
    username: request.user.details.username,
    role: 'admin',
    deleted: false,
    status: 'active'
  }, function (err, dbAdmin) {
    if (err) logger.error(err);
    if (!dbAdmin) {
      logger.error("Invalid Access: " + JSON.stringify(request));
      return;
    }
    if (dbAdmin.role != 'admin') return;
    var marketId = request.market.marketId;
    Market.update({
      marketId: marketId,
      marketType: 'SESSION'
    }, {
      $set: {
        'marketBook.status': 'SUSPENDED',
        'sessionResult': '',
      }
    },
      function (err, raw) {
        if (err) logger.error(err);
        Market.findOne({
          marketId: marketId,
          marketType: 'SESSION',
          'marketBook.status': 'SUSPENDED'
        }, function (err, market) {
          //referrevsessionsCommision(request);

          if (err) logger.error(err);
          if (!market) return;
          Bet.distinct("master", {
            marketId: market.marketId,
            status: 'MATCHED',
            deleted: false
          }, function (err, dbUserList) {
            if (err) logger.error(err);
            if (!dbUserList) return;
            for (var i = 0; i < dbUserList.length; i++) {
              var u = dbUserList[i];
              (function (u, market) {
                User.findOne({
                  username: u,
                  deleted: false,
                  role: 'master'
                }, function (err, user) {
                  if (err) logger.error(err);
                  if (!user) return;
                  Bet.find({
                    marketId: market.marketId,
                    master: user.username,
                    status: 'MATCHED',
                    deleted: false
                  }, function (err, bets) {
                    if (err) logger.error(err);
                    if (!bets) return;
                    var profit = 0;
                    var maxloss = 0;
                    bets.forEach(function (val, index) {
                      var comm = Math.round(val.masterCommision);
                      if (val.type == 'Back') {
                        if (val.result == 'WON') profit += Math.round(val.rate * val.stake);
                        else
                          if (val.result == 'LOST') profit -= Math.round(val.stake);
                      } else {
                        if (val.result == 'WON') profit += Math.round(val.stake);
                        else
                          if (val.result == 'LOST') profit -= Math.round(val.rate * val.stake);
                      }
                      var commision = 0;
                      if (index == bets.length - 1) {


                        (function (user, market) {
                          User.update({
                            username: user.username
                          }, user, function (err, raw) {
                            if (err) logger.error(err);
                            Log.remove({
                              username: user.username,
                              marketId: market.marketId
                            }, function (err, obj) {
                              // console.log(obj.result.n + " document(s) deleted admin");
                            });
                            /* var log = new Log();
                             log.username = user.username;
                             log.action = 'BALANCE';
                             log.subAction = 'RESETTLED_SSN';
                             log.amount = -1 * profit;
                             log.oldLimit = user.limit;
                             log.newLimit = user.limit;
                             log.marketId = market.marketId;
                             log.marketName = market.marketName;
                             log.eventId = market.eventId;
                             log.eventName = market.eventName;
                             log.competitionId = market.competitionId;
                             log.competitionName = market.competitionName;
                             log.eventTypeId = market.eventTypeId;
                             log.eventTypeName = market.eventTypeName;
                             log.description = market.eventName + " " + market.marketName + ' Reverse Profit:' + profit;

                             log.time = new Date();
                             log.deleted = false;
                             log.save(function (err) {});*/
                          });
                        })(user, market);
                        //manager balance manage after result unset


                      }
                    });
                  });
                });
              })(u, market);
            }
          });
        });
      });
  });
}

function unsetsessionsubAdmin(io, socket, request) {
  User.findOne({
    hash: request.user.key,
    username: request.user.details.username,
    role: 'admin',
    deleted: false,
    status: 'active'
  }, function (err, dbAdmin) {
    if (err) logger.error(err);
    if (!dbAdmin) {
      logger.error("Invalid Access: " + JSON.stringify(request));
      return;
    }
    if (dbAdmin.role != 'admin') return;
    var marketId = request.market.marketId;
    Market.update({
      marketId: marketId,
      marketType: 'SESSION'
    }, {
      $set: {
        'marketBook.status': 'SUSPENDED',
        'sessionResult': '',
      }
    },
      function (err, raw) {
        if (err) logger.error(err);
        Market.findOne({
          marketId: marketId,
          marketType: 'SESSION',
          'marketBook.status': 'SUSPENDED'
        }, function (err, market) {
          //referrevsessionsCommision(request);

          if (err) logger.error(err);
          if (!market) return;
          Bet.distinct("subadmin", {
            marketId: market.marketId,
            status: 'MATCHED',
            deleted: false
          }, function (err, dbUserList) {
            if (err) logger.error(err);
            if (!dbUserList) return;
            for (var i = 0; i < dbUserList.length; i++) {
              var u = dbUserList[i];
              (function (u, market) {
                User.findOne({
                  username: u,
                  deleted: false,
                  role: 'subadmin'
                }, function (err, user) {
                  if (err) logger.error(err);
                  if (!user) return;
                  Bet.find({
                    marketId: market.marketId,
                    subadmin: user.username,
                    status: 'MATCHED',
                    deleted: false
                  }, function (err, bets) {
                    if (err) logger.error(err);
                    if (!bets) return;
                    var profit = 0;
                    var maxloss = 0;
                    bets.forEach(function (val, index) {
                      var comm = Math.round(val.subadminCommision);
                      if (val.type == 'Back') {
                        if (val.result == 'WON') profit += Math.round(val.rate * val.stake);
                        else
                          if (val.result == 'LOST') profit -= Math.round(val.stake);
                      } else {
                        if (val.result == 'WON') profit += Math.round(val.stake);
                        else
                          if (val.result == 'LOST') profit -= Math.round(val.rate * val.stake);
                      }
                      var commision = 0;
                      if (index == bets.length - 1) {


                        (function (user, market) {
                          User.update({
                            username: user.username
                          }, user, function (err, raw) {
                            if (err) logger.error(err);
                            var log = new Log();
                            Log.remove({
                              username: user.username,
                              marketId: market.marketId
                            }, function (err, obj) {
                              // console.log(obj.result.n + " document(s) deleted admin");
                            });
                            /* log.username = user.username;
                             log.action = 'BALANCE';
                             log.subAction = 'RESETTLED_SSN';
                             log.amount = -1 * profit;
                             log.oldLimit = user.limit;
                             log.newLimit = user.limit;
                             log.marketId = market.marketId;
                             log.marketName = market.marketName;
                             log.eventId = market.eventId;
                             log.eventName = market.eventName;
                             log.competitionId = market.competitionId;
                             log.competitionName = market.competitionName;
                             log.eventTypeId = market.eventTypeId;
                             log.eventTypeName = market.eventTypeName;
                             log.description = market.eventName + " " + market.marketName + ' Reverse Profit:' + profit;

                             log.time = new Date();
                             log.deleted = false;
                             log.save(function (err) {});*/
                          });
                        })(user, market);
                        //manager balance manage after result unset


                      }
                    });
                  });
                });
              })(u, market);
            }
          });
        });
      });
  });
}

function unsetsessionAdmin(io, socket, request) {
  User.findOne({
    hash: request.user.key,
    username: request.user.details.username,
    role: 'admin',
    deleted: false,
    status: 'active'
  }, function (err, dbAdmin) {
    if (err) logger.error(err);
    if (!dbAdmin) {
      logger.error("Invalid Access: " + JSON.stringify(request));
      return;
    }
    if (dbAdmin.role != 'admin') return;
    var marketId = request.market.marketId;
    Market.update({
      marketId: marketId,
      marketType: 'SESSION'
    }, {
      $set: {
        'marketBook.status': 'SUSPENDED',
        'sessionResult': '',
      }
    },
      function (err, raw) {
        if (err) logger.error(err);
        Market.findOne({
          marketId: marketId,
          marketType: 'SESSION',
          'marketBook.status': 'SUSPENDED'
        }, function (err, market) {
          //referrevsessionsCommision(request);

          if (err) logger.error(err);
          if (!market) return;

          User.findOne({
            role: 'admin',

          }, function (err, user) {
            if (err) logger.error(err);
            if (!user) return;
            Bet.find({
              marketId: market.marketId,

              status: 'MATCHED',
              deleted: false
            }, function (err, bets) {
              if (err) logger.error(err);
              if (!bets) return;
              var profit = 0;
              var maxloss = 0;
              bets.forEach(function (val, index) {
                var comm = Math.round(val.adminCommision);
                if (val.type == 'Back') {
                  if (val.result == 'WON') profit += Math.round(val.rate * val.stake);
                  else
                    if (val.result == 'LOST') profit -= Math.round(val.stake);
                } else {
                  if (val.result == 'WON') profit += Math.round(val.stake);
                  else
                    if (val.result == 'LOST') profit -= Math.round(val.rate * val.stake);
                }
                var commision = 0;
                if (index == bets.length - 1) {


                  (function (user, market) {
                    User.update({
                      username: 'admin'
                    }, user, function (err, raw) {
                      if (err) logger.error(err);
                      Log.remove({
                        username: 'admin',
                        marketId: market.marketId
                      }, function (err, obj) {
                        // console.log(obj.result.n + " document(s) deleted admin");
                      });
                      /* var log = new Log();
                       log.username = user.username;
                       log.action = 'BALANCE';
                       log.subAction = 'RESETTLED_SSN';
                       log.amount = -1 * profit;
                       log.oldLimit = user.limit;
                       log.newLimit = user.limit;
                       log.marketId = market.marketId;
                       log.marketName = market.marketName;
                       log.eventId = market.eventId;
                       log.eventName = market.eventName;
                       log.competitionId = market.competitionId;
                       log.competitionName = market.competitionName;
                       log.eventTypeId = market.eventTypeId;
                       log.eventTypeName = market.eventTypeName;
                       log.description = market.eventName + " " + market.marketName + ' Reverse Profit:' + profit;

                       log.time = new Date();
                       log.deleted = false;
                       log.save(function (err) {});*/
                    });
                  })(user, market);
                  //manager balance manage after result unset


                }
              });
            });
          });


        });
      });
  });
}

// get-closed-markets-manager request:{manager, days}
module.exports.getSubAdminSummary = function (io, socket, request) {
  try {
    if (!request) return;
    if (!request.user) return;
    // logger.info('getAdminSummary: ' + JSON.stringify(request));
    var output = {};
    User.distinct("username", {
      'manager': request.user.details.username,
      'role': 'manager'
    }).exec(function (err, alluser) {
      EventType.find({
        visible: true
      }).sort("eventType.name").exec(function (err, eventTypes) {
        if (!eventTypes) return;
        var counter = 0;
        output.eventTypes = eventTypes;
        output.markets = {};
        output.events = {};
        output.managers = [];
        output.managers = alluser;
        //console.log(alluser)
        //Todo: optimize. use single query using $in
        var len = eventTypes.length;
        var days = 1;
        if (request.days) {
          days = request.days;
        }
        for (var i = 0; i < eventTypes.length; i++) {
          (function (eventTypeId, index, callback) {
            Market.find({
              eventTypeId: eventTypeId,
              manaagerProfit: {
                $in: alluser
              },
              'marketBook.status': 'CLOSED',
              "openDate": {
                $gte: (new Date((new Date()).getTime() - (days * 24 * 60 * 60 * 1000)))
              }
            }, {
              eventTypeId: 1,
              eventTypeName: 1,
              competitionId: 1,
              competitionName: 1,
              eventId: 1,
              eventName: 1,
              openDate: 1,
              marketId: 1,
              marketName: 1,
              marketType: 1,
              sessionResult: 1,
              managerProfit: 1,
              winner: 1
            }).sort({
              $natural: 1
            }).exec(function (err, markets) {
              if (err) throw err;
              var eventIds = [];
              for (var i = 0; i < markets.length; i++) {
                if (eventIds.indexOf(markets[i].eventId) == -1) {
                  eventIds.unshift(markets[i].eventId);
                }
              }
              Event.find({
                eventTypeId: eventTypeId,
                "event.id": {
                  $in: eventIds
                }
              }, {
                eventTypeId: 1,
                eventTypeName: 1,
                competitionId: 1,
                competitionName: 1,
                event: 1,
                managerMatchProfit: 1,
                managerSessionProfit: 1,
                managerFeesProfit: 1
              }).sort({
                'event.openDate': -1
              }).exec(function (err, events) {

                callback(markets, events, index);
              });
            });
          })(eventTypes[i].eventType.id, i, function (markets, events, index) {
            counter++;
            if (counter == len) {
              output.markets[eventTypes[index].eventType.id] = markets;
              output.events[eventTypes[index].eventType.id] = events;
              socket.emit('get-admin-summary-success', output);
            } else {
              output.markets[eventTypes[index].eventType.id] = markets;
              output.events[eventTypes[index].eventType.id] = events;
            }
          });
        }
      });
    });
  } catch (err) {
    if (err) logger.error({
      'function': 'getadminsummary',
      error: err
    });
  }
}
// get-closed-markets-manager request:{manager, days}
module.exports.getAdminSummary = function (io, socket, request) {
  try {
    if (!request) return;
    if (!request.user) return;
    // logger.info('getAdminSummary: ' + JSON.stringify(request));
    if (request.user.details.role == 'admin') {
      var output = {};
      EventType.find({
        visible: true
      }).sort("eventType.name").exec(function (err, eventTypes) {
        if (!eventTypes) return;

        User.distinct("username", {

          'role': 'subadmin'
        }).exec(function (err, alluser) {
          var counter = 0;
          output.eventTypes = eventTypes;
          output.markets = {};
          output.events = {};
          output.managers = alluser;
          //Todo: optimize. use single query using $in
          var len = eventTypes.length;
          var days = 1;
          if (request.days) {
            days = request.days;
          }
          for (var i = 0; i < eventTypes.length; i++) {
            (function (eventTypeId, index, callback) {
              Market.find({
                eventTypeId: eventTypeId,

                'marketBook.status': 'CLOSED',
                "openDate": {
                  $gte: (new Date((new Date()).getTime() - (days * 24 * 60 * 60 * 1000)))
                }
              }, {
                eventTypeId: 1,
                eventTypeName: 1,
                competitionId: 1,
                competitionName: 1,
                eventId: 1,
                eventName: 1,
                openDate: 1,
                marketId: 1,
                marketName: 1,
                marketType: 1,
                sessionResult: 1,
                adminProfit: 1,
                subadminProfit: 1,
                managers: 1,
                winner: 1
              }).sort({
                $natural: 1
              }).exec(function (err, markets) {
                if (err) throw err;
                var eventIds = [];
                for (var i = 0; i < markets.length; i++) {
                  if (eventIds.indexOf(markets[i].eventId) == -1) {
                    eventIds.unshift(markets[i].eventId);
                  }
                }
                Event.find({
                  eventTypeId: eventTypeId,
                  "event.id": {
                    $in: eventIds
                  }
                }, {
                  eventTypeId: 1,
                  eventTypeName: 1,
                  competitionId: 1,
                  competitionName: 1,
                  event: 1,
                  managerMatchProfit: 1,
                  managerSessionProfit: 1,
                  managerFeesProfit: 1
                }).sort({
                  'event.openDate': -1
                }).exec(function (err, events) {

                  callback(markets, events, index);
                });
              });
            })(eventTypes[i].eventType.id, i, function (markets, events, index) {
              counter++;
              if (counter == len) {
                output.markets[eventTypes[index].eventType.id] = markets;
                output.events[eventTypes[index].eventType.id] = events;
                socket.emit('get-admin-summary-success', output);
              } else {
                output.markets[eventTypes[index].eventType.id] = markets;
                output.events[eventTypes[index].eventType.id] = events;
              }
            });
          }
        });
      });
    }

    if (request.user.details.role == 'master') {
      var output = {};
      EventType.find({
        visible: true
      }).sort("eventType.name").exec(function (err, eventTypes) {
        if (!eventTypes) return;

        User.distinct("username", {
          'master': request.user.details.username,
          'role': 'manager'
        }).exec(function (err, alluser) {
          var counter = 0;
          output.eventTypes = eventTypes;
          output.markets = {};
          output.events = {};
          output.managers = alluser;
          //Todo: optimize. use single query using $in
          var len = eventTypes.length;
          var days = 1;
          if (request.days) {
            days = request.days;
          }
          for (var i = 0; i < eventTypes.length; i++) {
            (function (eventTypeId, index, callback) {
              Market.find({
                eventTypeId: eventTypeId,

                'marketBook.status': 'CLOSED',
                "openDate": {
                  $gte: (new Date((new Date()).getTime() - (days * 24 * 60 * 60 * 1000)))
                }
              }, {
                eventTypeId: 1,
                eventTypeName: 1,
                competitionId: 1,
                competitionName: 1,
                eventId: 1,
                eventName: 1,
                openDate: 1,
                marketId: 1,
                marketName: 1,
                marketType: 1,
                sessionResult: 1,
                masterProfit: 1,
                managerProfit: 1,
                managers: 1,
                winner: 1
              }).sort({
                $natural: 1
              }).exec(function (err, markets) {
                if (err) throw err;
                var eventIds = [];
                for (var i = 0; i < markets.length; i++) {
                  if (eventIds.indexOf(markets[i].eventId) == -1) {
                    eventIds.unshift(markets[i].eventId);
                  }
                }
                Event.find({
                  eventTypeId: eventTypeId,
                  "event.id": {
                    $in: eventIds
                  }
                }, {
                  eventTypeId: 1,
                  eventTypeName: 1,
                  competitionId: 1,
                  competitionName: 1,
                  event: 1,
                  managerMatchProfit: 1,
                  managerSessionProfit: 1,
                  managerFeesProfit: 1
                }).sort({
                  'event.openDate': -1
                }).exec(function (err, events) {

                  callback(markets, events, index);
                });
              });
            })(eventTypes[i].eventType.id, i, function (markets, events, index) {
              counter++;
              if (counter == len) {
                output.markets[eventTypes[index].eventType.id] = markets;
                output.events[eventTypes[index].eventType.id] = events;
                socket.emit('get-admin-summary-success', output);
              } else {
                output.markets[eventTypes[index].eventType.id] = markets;
                output.events[eventTypes[index].eventType.id] = events;
              }
            });
          }
        });
      });
    }

    if (request.user.details.role == 'subadmin') {
      var output = {};
      EventType.find({
        visible: true
      }).sort("eventType.name").exec(function (err, eventTypes) {
        if (!eventTypes) return;

        User.distinct("username", {
          'subadmin': request.user.details.username,
          'role': 'master'
        }).exec(function (err, alluser) {
          var counter = 0;
          output.eventTypes = eventTypes;
          output.markets = {};
          output.events = {};
          output.managers = alluser;
          //Todo: optimize. use single query using $in
          var len = eventTypes.length;
          var days = 1;
          if (request.days) {
            days = request.days;
          }
          for (var i = 0; i < eventTypes.length; i++) {
            (function (eventTypeId, index, callback) {
              Market.find({
                eventTypeId: eventTypeId,

                'marketBook.status': 'CLOSED',
                "openDate": {
                  $gte: (new Date((new Date()).getTime() - (days * 24 * 60 * 60 * 1000)))
                }
              }, {
                eventTypeId: 1,
                eventTypeName: 1,
                competitionId: 1,
                competitionName: 1,
                eventId: 1,
                eventName: 1,
                openDate: 1,
                marketId: 1,
                marketName: 1,
                marketType: 1,
                sessionResult: 1,
                masterProfit: 1,

                managers: 1,
                winner: 1
              }).sort({
                $natural: 1
              }).exec(function (err, markets) {
                if (err) throw err;
                var eventIds = [];
                for (var i = 0; i < markets.length; i++) {
                  if (eventIds.indexOf(markets[i].eventId) == -1) {
                    eventIds.unshift(markets[i].eventId);
                  }
                }
                Event.find({
                  eventTypeId: eventTypeId,
                  "event.id": {
                    $in: eventIds
                  }
                }, {
                  eventTypeId: 1,
                  eventTypeName: 1,
                  competitionId: 1,
                  competitionName: 1,
                  event: 1,
                  managerMatchProfit: 1,
                  managerSessionProfit: 1,
                  managerFeesProfit: 1
                }).sort({
                  'event.openDate': -1
                }).exec(function (err, events) {

                  callback(markets, events, index);
                });
              });
            })(eventTypes[i].eventType.id, i, function (markets, events, index) {
              counter++;
              if (counter == len) {
                output.markets[eventTypes[index].eventType.id] = markets;
                output.events[eventTypes[index].eventType.id] = events;
                socket.emit('get-admin-summary-success', output);
              } else {
                output.markets[eventTypes[index].eventType.id] = markets;
                output.events[eventTypes[index].eventType.id] = events;
              }
            });
          }
        });
      });
    }
  } catch (err) {
    if (err) logger.error({
      'function': 'getadminsummary',
      error: err
    });
  }
};

// get-closed-markets-manager request:{manager, datefilter}
module.exports.getSubAdminSummaryfilter = function (io, socket, request) {
  try {
    if (!request) return;
    if (!request.user) return;
    //logger.info('getAdminSummary: ' + JSON.stringify(request));
    var output = {};
    User.distinct("username", {
      'manager': request.user.details.username,
      'role': 'manager'
    }).exec(function (err, alluser) {
      EventType.find({
        visible: true
      }).sort("eventType.name").exec(function (err, eventTypes) {
        if (!eventTypes) return;
        var counter = 0;
        output.eventTypes = eventTypes;
        output.markets = {};
        output.events = {};
        output.managers = alluser;
        //Todo: optimize. use single query using $in
        var len = eventTypes.length;

        //console.log(request.from+"aa");

        // console.log(request.to);
        if (request.from === undefined || request.to === undefined) {
          return;
        }

        if (!request.from && !request.to) {
          return;
        }
        for (var i = 0; i < eventTypes.length; i++) {
          (function (eventTypeId, index, callback) {
            Market.find({
              eventTypeId: eventTypeId,
              managers: {
                $in: alluser
              },
              'marketBook.status': 'CLOSED',
              "openDate": {
                "$gte": new Date(request.from),
                "$lte": new Date(request.to + "T23:59:00.000Z")
              }
            }, {
              eventTypeId: 1,
              eventTypeName: 1,
              competitionId: 1,
              competitionName: 1,
              eventId: 1,
              eventName: 1,
              openDate: 1,
              marketId: 1,
              marketName: 1,
              marketType: 1,
              sessionResult: 1,
              managerProfit: 1,
              winner: 1
            }).sort({
              'openDate': -1
            }).exec(function (err, markets) {
              if (err) throw err;
              var eventIds = [];
              for (var i = 0; i < markets.length; i++) {
                if (eventIds.indexOf(markets[i].eventId) == -1) {
                  eventIds.unshift(markets[i].eventId);
                }
              }
              Event.find({
                eventTypeId: eventTypeId,
                "event.id": {
                  $in: eventIds
                }
              }, {
                eventTypeId: 1,
                eventTypeName: 1,
                competitionId: 1,
                competitionName: 1,
                event: 1,
                managerMatchProfit: 1,
                managerSessionProfit: 1,
                managerFeesProfit: 1
              }).sort({
                'event.openDate': -1
              }).exec(function (err, events) {
                callback(markets, events, index);
              });
            });
          })(eventTypes[i].eventType.id, i, function (markets, events, index) {
            counter++;
            if (counter == len) {
              output.markets[eventTypes[index].eventType.id] = markets;
              output.events[eventTypes[index].eventType.id] = events;
              socket.emit('get-admin-summary-success', output);
            } else {
              output.markets[eventTypes[index].eventType.id] = markets;
              output.events[eventTypes[index].eventType.id] = events;
            }
          });
        }
      });
    });
  } catch (err) {
    if (err) logger.error({
      'function': 'getadminsummaryfilter',
      error: err
    });
  }
};

module.exports.getAdminSummaryfilter = function (io, socket, request) {
  try {
    if (!request) return;
    if (!request.user) return;
    //logger.info('getAdminSummary: ' + JSON.stringify(request));
    var output = {};
    EventType.find({
      visible: true
    }).sort("eventType.name").exec(function (err, eventTypes) {
      if (!eventTypes) return;
      var counter = 0;
      output.eventTypes = eventTypes;
      output.markets = {};
      output.events = {};
      //Todo: optimize. use single query using $in
      var len = eventTypes.length;

      //console.log(request.from+"aa");

      // console.log(request.to);
      if (request.from === undefined || request.to === undefined) {
        return;
      }

      if (!request.from && !request.to) {
        return;
      }
      for (var i = 0; i < eventTypes.length; i++) {
        (function (eventTypeId, index, callback) {
          Market.find({
            eventTypeId: eventTypeId,

            'marketBook.status': 'CLOSED',
            "openDate": {
              "$gte": new Date(request.from),
              "$lte": new Date(request.to + "T23:59:00.000Z")
            }
          }, {
            eventTypeId: 1,
            eventTypeName: 1,
            competitionId: 1,
            competitionName: 1,
            eventId: 1,
            eventName: 1,
            openDate: 1,
            marketId: 1,
            marketName: 1,
            marketType: 1,
            sessionResult: 1,
            managerProfit: 1,
            winner: 1
          }).sort({
            'openDate': -1
          }).exec(function (err, markets) {
            if (err) throw err;
            var eventIds = [];
            for (var i = 0; i < markets.length; i++) {
              if (eventIds.indexOf(markets[i].eventId) == -1) {
                eventIds.unshift(markets[i].eventId);
              }
            }
            Event.find({
              eventTypeId: eventTypeId,
              "event.id": {
                $in: eventIds
              }
            }, {
              eventTypeId: 1,
              eventTypeName: 1,
              competitionId: 1,
              competitionName: 1,
              event: 1,
              managerMatchProfit: 1,
              managerSessionProfit: 1,
              managerFeesProfit: 1
            }).sort({
              'event.openDate': -1
            }).exec(function (err, events) {
              callback(markets, events, index);
            });
          });
        })(eventTypes[i].eventType.id, i, function (markets, events, index) {
          counter++;
          if (counter == len) {
            output.markets[eventTypes[index].eventType.id] = markets;
            output.events[eventTypes[index].eventType.id] = events;
            socket.emit('get-admin-summary-success', output);
          } else {
            output.markets[eventTypes[index].eventType.id] = markets;
            output.events[eventTypes[index].eventType.id] = events;
          }
        });
      }
    });
  } catch (err) {
    if (err) logger.error({
      'function': 'getadminsummaryfilter',
      error: err
    });
  }
};

module.exports.getManagerSummarydateadmin = function (io, socket, request) {
  try {
    if (!request) return;
    if (!request.user) return;
    //logger.info('getManagerSummarydateadmin: ' + JSON.stringify(request));

    var output = {};
    User.findOne({
      username: request.user.username,
      deleted: false
    }, function (err, dbUser) {
      if (err) logger.debug(err);
      // console.log(dbUser);
      if (!dbUser) {
        logger.error("Invalid Access: " + JSON.stringify(request));
        socket.emit('logout');
        return;
      }

      if (dbUser.role == 'manager') {

        EventType.find({
          'eventType.id': {
            $in: request.user.availableEventTypes
          },
          visible: true
        }).sort("eventType.name").exec(function (err, eventTypes) {
          if (!eventTypes) return;
          var counter = 0;
          output.eventTypes = eventTypes;
          output.markets = {};
          output.events = {};
          //Todo: optimize. use single query using $in
          var len = eventTypes.length;
          // if(request.from===undefined || request.to===undefined)
          //  {
          // console.log("sssssssssssss");
          //   return;
          //  }

          for (var i = 0; i < eventTypes.length; i++) {
            (function (eventTypeId, index, callback) {
              Market.find({
                eventTypeId: eventTypeId,

                managers: request.user.username,
                'marketBook.status': 'CLOSED',
                "openDate": {
                  "$gte": new Date(request.from + "T00:00:00.000Z"),
                  "$lte": new Date(request.to + "T23:59:00.000Z")
                }
              }, {
                eventTypeId: 1,
                eventTypeName: 1,
                competitionId: 1,
                competitionName: 1,
                eventId: 1,
                eventName: 1,
                openDate: 1,
                marketId: 1,
                marketName: 1,
                marketType: 1,
                sessionResult: 1,
                managerProfit: 1,
                winner: 1
              }).sort({
                'openDate': -1
              }).exec(function (err, markets) {
                if (err) throw err;
                var eventIds = [];
                for (var i = 0; i < markets.length; i++) {
                  if (eventIds.indexOf(markets[i].eventId) == -1) {
                    eventIds.unshift(markets[i].eventId);
                  }
                }
                Event.find({
                  eventTypeId: eventTypeId,
                  "event.id": {
                    $in: eventIds
                  }
                }, {
                  eventTypeId: 1,
                  eventTypeName: 1,
                  competitionId: 1,
                  competitionName: 1,
                  event: 1,
                  managerMatchProfit: 1,
                  managerSessionProfit: 1,
                  managerFeesProfit: 1
                }).sort({
                  'event.openDate': -1
                }).exec(function (err, events) {
                  callback(markets, events, index);
                });
              });
            })(eventTypes[i].eventType.id, i, function (markets, events, index) {
              counter++;
              if (counter == len) {
                output.markets[eventTypes[index].eventType.id] = markets;
                output.events[eventTypes[index].eventType.id] = events;
                socket.emit('get-manager1-summary-success', output);
                //console.log("ccccccccccccccc");
                //console.log(output);
              } else {
                output.markets[eventTypes[index].eventType.id] = markets;
                output.events[eventTypes[index].eventType.id] = events;
              }
            });
          }
        });
      }
    });
  } catch (err) {
    if (err) logger.error({
      'function': 'getadminsummaryfilter1',
      error: err
    });
  }
};

module.exports.getManagerSummaryadmin = function (io, socket, request) {
  try {
    if (!request) return;
    if (!request.user) return;
    //logger.info('getManagerSummaryadmin: ' + JSON.stringify(request));

    var output = {};
    User.findOne({
      username: request.user.username,
      deleted: false
    }, function (err, dbUser) {
      if (err) logger.debug(err);
      // console.log(dbUser);
      if (!dbUser) {
        logger.error("Invalid Access: " + JSON.stringify(request));
        socket.emit('logout');
        return;
      }

      if (dbUser.role == 'manager') {
        EventType.find({
          'eventType.id': {
            $in: request.user.availableEventTypes
          },
          visible: true
        }).sort("eventType.name").exec(function (err, eventTypes) {
          if (!eventTypes) return;
          var counter = 0;
          output.eventTypes = eventTypes;
          output.markets = {};
          output.events = {};
          //Todo: optimize. use single query using $in
          var len = eventTypes.length;
          var days = 30;
          if (request.days) {
            days = request.days;
          }
          for (var i = 0; i < eventTypes.length; i++) {
            (function (eventTypeId, index, callback) {
              Market.find({
                eventTypeId: eventTypeId,

                managers: request.user.username,
                'marketBook.status': 'CLOSED',
                "openDate": {
                  $gte: (new Date((new Date()).getTime() - (days * 24 * 60 * 60 * 1000)))
                }
              }, {
                eventTypeId: 1,
                eventTypeName: 1,
                competitionId: 1,
                competitionName: 1,
                eventId: 1,
                eventName: 1,
                openDate: 1,
                marketId: 1,
                marketName: 1,
                marketType: 1,
                sessionResult: 1,
                managerProfit: 1,
                winner: 1
              }).sort({
                'openDate': -1
              }).exec(function (err, markets) {
                if (err) throw err;
                var eventIds = [];
                for (var i = 0; i < markets.length; i++) {
                  if (eventIds.indexOf(markets[i].eventId) == -1) {
                    eventIds.unshift(markets[i].eventId);
                  }
                }
                Event.find({
                  eventTypeId: eventTypeId,
                  "event.id": {
                    $in: eventIds
                  }
                }, {
                  eventTypeId: 1,
                  eventTypeName: 1,
                  competitionId: 1,
                  competitionName: 1,
                  event: 1,
                  managerMatchProfit: 1,
                  managerSessionProfit: 1,
                  managerFeesProfit: 1
                }).sort({
                  'event.openDate': -1
                }).exec(function (err, events) {
                  callback(markets, events, index);
                });
              });
            })(eventTypes[i].eventType.id, i, function (markets, events, index) {
              counter++;
              if (counter == len) {
                output.markets[eventTypes[index].eventType.id] = markets;
                output.events[eventTypes[index].eventType.id] = events;
                socket.emit('get-manager1-summary-success', output);
                // console.log(output);
              } else {
                output.markets[eventTypes[index].eventType.id] = markets;
                output.events[eventTypes[index].eventType.id] = events;
              }
            });
          }
        });
      }
    });
  } catch (err) {
    if (err) logger.error({
      'function': 'getmanageradminsummary',
      error: err
    });
  }
};

module.exports.getManagerSummary = function (io, socket, request) {
  try {
    if (!request) return;
    if (!request.user) return;
    //logger.info('getManagerSummary: ' + JSON.stringify(request));
    // console.log(request.user);
    var output = {};
    User.findOne({
      username: request.user.details.username,
      role: request.user.details.role,
      hash: request.user.key,
      deleted: false
    }, function (err, dbUser) {
      if (err) logger.debug(err);
      if (!dbUser) {
        logger.error("Invalid Access: " + JSON.stringify(request));
        socket.emit('logout');
        return;
      }
      if (dbUser.role == 'partner') {
        User.findOne({
          username: request.user.details.manager
        }, function (err, partnerManager) {
          if (err) logger.error(err);
          if (!partnerManager) return;
          EventType.find({
            'eventType.id': {
              $in: partnerManager.availableEventTypes
            },
            visible: true
          }).sort("eventType.name").exec(function (err, eventTypes) {
            if (!eventTypes) return;
            var counter = 0;
            output.eventTypes = eventTypes;
            output.markets = {};
            output.events = {};
            //Todo: optimize. use single query using $in
            var len = eventTypes.length;
            var days = 30;
            if (request.days) {
              days = request.days;
            }
            for (var i = 0; i < eventTypes.length; i++) {
              (function (eventTypeId, index, callback) {
                Market.find({
                  eventTypeId: eventTypeId,

                  managers: partnerManager.username,
                  'marketBook.status': 'CLOSED',
                  "openDate": {
                    $gte: (new Date((new Date()).getTime() - (days * 24 * 60 * 60 * 1000)))
                  }
                }, {
                  eventTypeId: 1,
                  eventTypeName: 1,
                  competitionId: 1,
                  competitionName: 1,
                  eventId: 1,
                  eventName: 1,
                  openDate: 1,
                  marketId: 1,
                  marketName: 1,
                  marketType: 1,
                  sessionResult: 1,
                  managerProfit: 1,
                  winner: 1
                }).sort({
                  'openDate': -1
                }).exec(function (err, markets) {
                  if (err) throw err;
                  var eventIds = [];
                  for (var i = 0; i < markets.length; i++) {
                    if (eventIds.indexOf(markets[i].eventId) == -1) {
                      eventIds.unshift(markets[i].eventId);
                    }
                  }
                  Event.find({
                    eventTypeId: eventTypeId,
                    "event.id": {
                      $in: eventIds
                    }
                  }, {
                    eventTypeId: 1,
                    eventTypeName: 1,
                    competitionId: 1,
                    competitionName: 1,
                    event: 1,
                    managerMatchProfit: 1,
                    managerSessionProfit: 1,
                    managerFeesProfit: 1,
                    managerCommisionProfit: 1,
                  }).sort({
                    'event.openDate': -1
                  }).exec(function (err, events) {
                    callback(markets, events, index);
                  });
                });
              })(eventTypes[i].eventType.id, i, function (markets, events, index) {
                counter++;
                if (counter == len) {
                  output.markets[eventTypes[index].eventType.id] = markets;
                  output.events[eventTypes[index].eventType.id] = events;
                  socket.emit('get-manager-summary-success', output);
                } else {
                  output.markets[eventTypes[index].eventType.id] = markets;
                  output.events[eventTypes[index].eventType.id] = events;
                }
              });
            }
          });
        });
      }
      if (dbUser.role == 'manager') {
        EventType.find({
          'eventType.id': {
            $in: request.user.details.availableEventTypes
          },
          visible: true
        }).sort("eventType.name").exec(function (err, eventTypes) {
          if (!eventTypes) return;
          var counter = 0;
          output.eventTypes = eventTypes;
          output.markets = {};
          output.events = {};
          //Todo: optimize. use single query using $in
          var len = eventTypes.length;
          var days = 30;
          if (request.days) {
            days = request.days;
          }
          for (var i = 0; i < eventTypes.length; i++) {
            (function (eventTypeId, index, callback) {
              Market.find({
                eventTypeId: eventTypeId,

                managers: request.user.details.username,
                'marketBook.status': 'CLOSED',
                "openDate": {
                  $gte: (new Date((new Date()).getTime() - (days * 24 * 60 * 60 * 1000)))
                }
              }, {
                eventTypeId: 1,
                eventTypeName: 1,
                competitionId: 1,
                competitionName: 1,
                eventId: 1,
                eventName: 1,
                openDate: 1,
                marketId: 1,
                marketName: 1,
                marketType: 1,
                sessionResult: 1,
                managerProfit: 1,
                winner: 1,
              }).sort({
                'openDate': -1
              }).exec(function (err, markets) {
                if (err) throw err;
                var eventIds = [];
                for (var i = 0; i < markets.length; i++) {
                  if (eventIds.indexOf(markets[i].eventId) == -1) {
                    eventIds.unshift(markets[i].eventId);
                  }
                }
                Event.find({
                  eventTypeId: eventTypeId,
                  "event.id": {
                    $in: eventIds
                  }
                }, {
                  eventTypeId: 1,
                  eventTypeName: 1,
                  competitionId: 1,
                  competitionName: 1,
                  event: 1,
                  managerMatchProfit: 1,
                  managerSessionProfit: 1,
                  managerFeesProfit: 1,
                  managerCommisionProfit: 1,
                }).sort({
                  'event.openDate': -1
                }).exec(function (err, events) {
                  callback(markets, events, index);
                });
              });
            })(eventTypes[i].eventType.id, i, function (markets, events, index) {
              counter++;
              if (counter == len) {
                output.markets[eventTypes[index].eventType.id] = markets;
                output.events[eventTypes[index].eventType.id] = events;
                socket.emit('get-manager-summary-success', output);
              } else {
                output.markets[eventTypes[index].eventType.id] = markets;
                output.events[eventTypes[index].eventType.id] = events;
              }
            });
          }
        });
      }
    });
  } catch (err) {
    if (err) logger.error({
      'function': 'getmanagersummary',
      error: err
    });
  }
};

module.exports.getMatchCoomProfit = function (io, socket, request) {
  try {
    if (!request) return;
    if (!request.user || !request.eventId) return;
    if (!request.user.details) return;

    logger.debug("getMatchCoomProfit: " + JSON.stringify(request));
    User.findOne({
      username: request.user.details.username,
      role: request.user.details.role,
      hash: request.user.key,
      deleted: false
    }, function (err, dbUser) {
      if (err) logger.debug(err);
      if (!dbUser) {
        logger.error("Invalid Access: " + JSON.stringify(request));
        socket.emit('logout');
        return;
      }
      if (dbUser.role == 'user') { }
      if (dbUser.role == 'partner') {
        User.findOne({
          username: request.user.details.manager,
          role: 'manager',
          deleted: false
        }, function (err, dbManager) {
          if (err) logger.error(err);
          if (dbManager) {
            Bet.distinct("username", {
              eventId: request.eventId,
              manager: dbUser.manager,
              status: 'MATCHED'
            }, function (err, users) {
              if (err) logger.error(err);
              if (users) {
                var matchFeeProfit = users.length * dbManager.matchFees;
                Event.findOne({
                  "event.id": request.eventId
                }, function (err, e) {
                  if (err) logger.error(err);
                  if (e.managerFeesProfit) {
                    e.managerFeesProfit[dbUser.manager] = matchFeeProfit;
                  } else {
                    e.managerFeesProfit = {
                      [dbUser.manager]: matchFeeProfit
                    }
                  }
                  Event.update({
                    "event.id": request.eventId
                  }, {
                    $set: {
                      "managerFeesProfit": e.managerFeesProfit
                    }
                  }, function (err, raw) {
                    if (err) logger.error(err);
                    socket.emit('get-match-fees-profit-success', e);
                  });
                });
              } else {
                var matchFeeProfit = 0;
                Event.findOne({
                  "event.id": request.eventId
                }, function (err, e) {
                  if (err) logger.error(err);
                  if (e.managerFeesProfit) {
                    e.managerFeesProfit[dbUser.manager] = matchFeeProfit;
                  } else {
                    e.managerFeesProfit = {
                      [dbUser.manager]: matchFeeProfit
                    }
                  }
                  Event.update({
                    "event.id": request.eventId
                  }, {
                    $set: {
                      "managerFeesProfit": e.managerFeesProfit
                    }
                  }, function (err, raw) {
                    if (err) logger.error(err);
                    socket.emit('get-match-fees-profit-success', e);
                  });
                });
              }
            });
          }
        });
      }
      if (dbUser.role == 'manager') {
        Bet.distinct("username", {
          eventId: request.eventId,
          manager: dbUser.username,
          status: 'MATCHED'
        }, function (err, users) {
          if (err) logger.error(err);
          if (users) {
            var matchFeeProfit = users.length * request.user.details.matchFees;
            Event.findOne({
              "event.id": request.eventId
            }, function (err, e) {
              if (err) logger.error(err);
              if (e.managerFeesProfit) {
                e.managerFeesProfit[dbUser.username] = matchFeeProfit;
              } else {
                e.managerFeesProfit = {
                  [dbUser.username]: matchFeeProfit
                }
              }
              Event.update({
                "event.id": request.eventId
              }, {
                $set: {
                  "managerFeesProfit": e.managerFeesProfit
                }
              }, function (err, raw) {
                if (err) logger.error(err);
                socket.emit('get-match-fees-profit-success', e);
              });
            });
          } else {
            var matchFeeProfit = 0;
            Event.findOne({
              "event.id": request.eventId
            }, function (err, e) {
              if (err) logger.error(err);
              if (e.managerFeesProfit) {
                e.managerFeesProfit[dbUser.username] = matchFeeProfit;
              } else {
                e.managerFeesProfit = {
                  [dbUser.username]: matchFeeProfit
                }
              }
              Event.update({
                "event.id": request.eventId
              }, {
                $set: {
                  "managerFeesProfit": e.managerFeesProfit
                }
              }, function (err, raw) {
                if (err) logger.error(err);
                socket.emit('get-match-fees-profit-success', e);
              });
            });
          }
        });
      }
      if (dbUser.role == 'admin') {
        User.find({
          role: 'manager',
          deleted: false
        }, {
          username: 1
        }, function (err, managers) {
          if (err) logger.error(err);
          managers.forEach(function (manager, index) {
            Bet.distinct("username", {
              eventId: request.eventId,
              manager: manager.username,
              status: 'MATCHED'
            }, function (err, users) {
              if (err) logger.error(err);
              if (users) {
                var matchFeeProfit = users.length * manager.matchFees;
                Event.findOne({
                  "event.id": request.eventId
                }, function (err, e) {
                  if (err) logger.error(err);
                  if (e.managerFeesProfit) {
                    if (matchFeeProfit) {
                      e.managerFeesProfit[manager.username] = matchFeeProfit;
                    } else {
                      e.managerFeesProfit[manager.username] = 0;
                    }

                  } else {
                    if (matchFeeProfit) {
                      e.managerFeesProfit = {

                        [manager.username]: matchFeeProfit
                      }
                    } else {
                      e.managerFeesProfit = {

                        [manager.username]: 0
                      }
                    }

                  }
                  Event.update({
                    "event.id": request.eventId
                  }, {
                    $set: {
                      "managerFeesProfit": e.managerFeesProfit
                    }
                  }, function (err, raw) {
                    if (err) logger.error(err);
                    if (index == managers.length - 1)
                      socket.emit('get-match-fees-profit-success', e);
                  });
                });
              } else {
                var matchFeeProfit = 0;
                Event.findOne({
                  "event.id": request.eventId
                }, function (err, e) {
                  if (e.managerFeesProfit) {
                    e.managerFeesProfit[manager.username] = matchFeeProfit;
                  } else {
                    e.managerFeesProfit = {
                      [manager.username]: matchFeeProfit
                    }
                  }
                  Event.update({
                    "event.id": request.eventId
                  }, {
                    $set: {
                      "managerFeesProfit": e.managerFeesProfit
                    }
                  }, function (err, raw) {
                    if (err) logger.error(err);
                    if (index == managers.length - 1)
                      socket.emit('get-match-fees-profit-success', e);
                  });
                });
              }
            });
          });
        });
      }
    });
  } catch (err) {
    if (err) logger.error({
      'function': 'fee',
      error: err
    });
  }
}

module.exports.getMatchFeesProfit = function (io, socket, request) {
  if (!request) return;
  if (!request.user || !request.eventId) return;
  if (!request.user.details) return;

  //logger.debug("getMatchFeesProfit: " + JSON.stringify(request));
  User.findOne({
    username: request.user.details.username,
    role: request.user.details.role,
    hash: request.user.key,
    deleted: false
  }, function (err, dbUser) {
    if (err) logger.debug(err);
    if (!dbUser) {
      logger.error("Invalid Access: " + JSON.stringify(request));
      socket.emit('logout');
      return;
    }
    if (dbUser.role == 'user') { }
    if (dbUser.role == 'partner') {
      User.findOne({
        username: request.user.details.manager,
        role: 'manager',
        deleted: false
      }, function (err, dbManager) {
        if (err) logger.error(err);
        if (dbManager) {
          Bet.distinct("username", {
            eventId: request.eventId,
            manager: dbUser.manager,
            status: 'MATCHED'
          }, function (err, users) {
            if (err) logger.error(err);
            if (users) {
              var matchFeeProfit = users.length * dbManager.matchFees;
              Event.findOne({
                "event.id": request.eventId
              }, function (err, e) {
                if (err) logger.error(err);
                if (e.managerFeesProfit == null) {
                  e.managerFeesProfit = {
                    [dbUser.manager]: 0
                  }
                } else {
                  if (e.managerFeesProfit) {
                    e.managerFeesProfit[dbUser.manager] = matchFeeProfit;
                  } else {
                    e.managerFeesProfit = {
                      [dbUser.manager]: matchFeeProfit
                    }
                  }
                }


                Event.update({
                  "event.id": request.eventId
                }, {
                  $set: {
                    "managerFeesProfit": e.managerFeesProfit
                  }
                }, function (err, raw) {
                  if (err) logger.error(err);
                  socket.emit('get-match-fees-profit-success', e);
                });
              });
            } else {
              var matchFeeProfit = 0;
              Event.findOne({
                "event.id": request.eventId
              }, function (err, e) {
                if (err) logger.error(err);
                if (e.managerFeesProfit) {
                  e.managerFeesProfit[dbUser.manager] = matchFeeProfit;
                } else {
                  e.managerFeesProfit = {
                    [dbUser.manager]: matchFeeProfit
                  }
                }
                Event.update({
                  "event.id": request.eventId
                }, {
                  $set: {
                    "managerFeesProfit": e.managerFeesProfit
                  }
                }, function (err, raw) {
                  if (err) logger.error(err);
                  socket.emit('get-match-fees-profit-success', e);
                });
              });
            }
          });
        }
      });
    }
    /* if (dbUser.role == 'manager') {
       Bet.distinct("username", {
         eventId: request.eventId,
         manager: dbUser.username,
         status: 'MATCHED'
       }, function (err, users) {
         if (err) logger.error(err);
         if (users) {
           var matchFeeProfit = users.length * request.user.details.matchFees;
           Event.findOne({
             "event.id": request.eventId
           }, function (err, e) {
             if (err) logger.error(err);
             if (e.managerFeesProfit) {
               e.managerFeesProfit[dbUser.username] = matchFeeProfit;
             } else {
               e.managerFeesProfit = {
                 [dbUser.username]: matchFeeProfit
               }
             }
             Event.update({
               "event.id": request.eventId
             }, {
               $set: {
                 "managerFeesProfit": e.managerFeesProfit
               }
             }, function (err, raw) {
               if (err) logger.error(err);
               socket.emit('get-match-fees-profit-success', e);
             });
           });
         } else {
           var matchFeeProfit = 0;
           Event.findOne({
             "event.id": request.eventId
           }, function (err, e) {
             if (err) logger.error(err);
             if (e.managerFeesProfit) {
               e.managerFeesProfit[dbUser.username] = matchFeeProfit;
             } else {
               e.managerFeesProfit = {
                 [dbUser.username]: matchFeeProfit
               }
             }
             Event.update({
               "event.id": request.eventId
             }, {
               $set: {
                 "managerFeesProfit": e.managerFeesProfit
               }
             }, function (err, raw) {
               if (err) logger.error(err);
               socket.emit('get-match-fees-profit-success', e);
             });
           });
         }
       });
     }*/

    if (dbUser.role == 'manager') {
      var matchFeeProfit = 0;

      Log.find({
        eventId: request.eventId,
        manager: dbUser.username,
        "subAction": "MATCH_FEE",
        "commision": {
          $ne: "MATCH_COMM"
        },
      }, function (err, logss) {

        if (err) logger.error(err);
        if (logss) {
          var logsslength = logss.length;
          for (var i = 0; i < logss.length; i++) {

            matchFeeProfit += logss[i].amount;
            Event.findOne({
              "event.id": request.eventId
            }, function (err, e) {
              if (err) logger.error(err);
              if (e.managerFeesProfit == null) {
                e.managerFeesProfit = {
                  [dbUser.username]: 0
                }
              } else {
                if (e.managerFeesProfit) {
                  e.managerFeesProfit[dbUser.username] = matchFeeProfit;
                } else {
                  e.managerFeesProfit = {
                    [dbUser.username]: matchFeeProfit
                  }
                }
              }
              Event.update({
                "event.id": request.eventId
              }, {
                $set: {
                  "managerFeesProfit": e.managerFeesProfit
                }
              }, function (err, raw) {
                if (err) logger.error(err);
                socket.emit('get-match-fees-profit-success', e);
              });
            });
          }
        } else {
          e.managerFeesProfit = {
            [dbUser.username]: 0
          }
          Event.update({
            "event.id": request.eventId
          }, {
            $set: {
              "managerFeesProfit": e.managerFeesProfit
            }
          }, function (err, raw) {
            if (err) logger.error(err);
            socket.emit('get-match-fees-profit-success', e);
          });

        }
      });

      // commsion 
      //console.log("bbbbbbbbbbbbbbbbbbb");
      var matchCommProfit = 0;

      Log.find({
        eventId: request.eventId,
        manager: dbUser.username,
        "commision": "MATCH_COMM",
      }, function (err, logss) {
        //console.log(logss);
        if (err) logger.error(err);
        if (logss) {
          var logsslength = logss.length;
          for (var i = 0; i < logss.length; i++) {

            matchCommProfit += logss[i].amount;
            Event.findOne({
              "event.id": request.eventId
            }, function (err, e) {
              if (err) logger.error(err);
              if (e.managerFeesProfit == null) {
                e.managerCommisionProfit = {
                  [dbUser.username]: 0
                }
              } else {
                if (e.managerCommisionProfit) {
                  e.managerCommisionProfit[dbUser.username] = matchCommProfit;
                } else {
                  e.managerCommisionProfit = {
                    [dbUser.username]: matchCommProfit
                  }
                }
              }
              Event.update({
                "event.id": request.eventId
              }, {
                $set: {
                  "managerCommisionProfit": e.managerCommisionProfit
                }
              }, function (err, raw) {
                if (err) logger.error(err);
                // console.log(e.managerCommisionProfit);
                socket.emit('get-match-fees-profit-success', e);

              });
            });
          }
        } else {
          e.managerCommisionProfit = {
            [dbUser.username]: 0
          }
          Event.update({
            "event.id": request.eventId
          }, {
            $set: {
              "managerCommisionProfit": e.managerCommisionProfit
            }
          }, function (err, raw) {
            if (err) logger.error(err);
            socket.emit('get-match-fees-profit-success', e);
          });

        }
      });

    }
    /* if (dbUser.role == 'admin') {
       User.find({
         role: 'manager',
         deleted: false
       }, {
         username: 1
       }, function (err, managers) {
         if (err) logger.error(err);
         managers.forEach(function (manager, index) {
           Bet.distinct("username", {
             eventId: request.eventId,
             manager: manager.username,
             status: 'MATCHED'
           }, function (err, users) {
             if (err) logger.error(err);
             if (users) {
               var matchFeeProfit = users.length * manager.matchFees;
               Event.findOne({
                 "event.id": request.eventId
               }, function (err, e) {
                 if (err) logger.error(err);
                 if (e.managerFeesProfit) {
                   if(matchFeeProfit)
                   {
                    e.managerFeesProfit[manager.username] = matchFeeProfit;
                   }
                   else
                   {
                   e.managerFeesProfit[manager.username] = 0;
                   }
                  
                 } else {
                   if(matchFeeProfit)
                     {
                   e.managerFeesProfit = {

                     [manager.username]: matchFeeProfit
                   }
                     }
                     else
                     {
                  e.managerFeesProfit = {

                     [manager.username]: 0
                   }     
                     }
                   
                 }
                 Event.update({
                   "event.id": request.eventId
                 }, {
                   $set: {
                     "managerFeesProfit": e.managerFeesProfit
                   }
                 }, function (err, raw) {
                   if (err) logger.error(err);
                   if (index == managers.length - 1)
                     socket.emit('get-match-fees-profit-success', e);
                 });
               });
             } else {
               var matchFeeProfit = 0;
               Event.findOne({
                 "event.id": request.eventId
               }, function (err, e) {
                 if (e.managerFeesProfit) {
                   e.managerFeesProfit[manager.username] = matchFeeProfit;
                 } else {
                   e.managerFeesProfit = {
                     [manager.username]: matchFeeProfit
                   }
                 }
                 Event.update({
                   "event.id": request.eventId
                 }, {
                   $set: {
                     "managerFeesProfit": e.managerFeesProfit
                   }
                 }, function (err, raw) {
                   if (err) logger.error(err);
                   if (index == managers.length - 1)
                     socket.emit('get-match-fees-profit-success', e);
                 });
               });
             }
           });
         });
       });
     }*/
    if (dbUser.role == 'admin') {


      Log.distinct('manager', {
        eventId: request.eventId,
        "subAction": "MATCH_FEE",
        'commision': {
          $ne: 'MATCH_COMM'
        }
      }, function (err, managers) {
        if (err) logger.error(err);

        managers.forEach(function (manager, index) {


          // commsion
          var matchFeeProfit = 0;

          Log.find({
            eventId: request.eventId,
            manager: manager,
            "subAction": "MATCH_FEE",
            'commision': {
              $ne: 'MATCH_COMM'
            }
          }, function (err, logss) {

            if (err) logger.error(err);
            if (logss) {
              var logsslength = logss.length;
              for (var i = 0; i < logss.length; i++) {

                matchFeeProfit += logss[i].amount;
                Event.findOne({
                  "event.id": request.eventId
                }, function (err, e) {
                  if (err) logger.error(err);
                  if (e.managerFeesProfit == null) {
                    e.managerFeesProfit = {
                      [manager.username]: 0
                    }
                  } else {
                    if (e.matchFeeProfit) {
                      e.managerFeesProfit[manager] = matchFeeProfit;
                    } else {
                      e.managerFeesProfit = {
                        [manager]: matchFeeProfit
                      }
                    }
                  }
                  Event.update({
                    "event.id": request.eventId
                  }, {
                    $set: {
                      "matchFeeProfit": e.matchFeeProfit
                    }
                  }, function (err, raw) {
                    if (err) logger.error(err);

                    socket.emit('get-match-fees-profit-success', e);

                  });
                });
              }
            } else {
              e.managerFeesProfit = {
                [manager]: 0
              }
              Event.update({
                "event.id": request.eventId
              }, {
                $set: {
                  "managerFeesProfit": e.matchFeeProfit
                }
              }, function (err, raw) {
                if (err) logger.error(err);
                socket.emit('get-match-fees-profit-success', e);
              });

            }
          });
        });
      });

    }

  });
}

module.exports.getPendingResultMarkets = function (io, socket, request) {
  if (!request) return;
  if (!request.user) return;
  if (!request.user.details) return;

  logger.debug("getPendingResultMarkets: " + JSON.stringify(request));
  User.findOne({
    username: request.user.details.username,
    role: {
      $in: ['admin', 'operator']
    },
    hash: request.user.key,
    deleted: false
  }, function (err, dbUser) {
    if (err) logger.debug(err);
    if (!dbUser) {
      logger.error("Invalid Access: " + JSON.stringify(request));
      socket.emit('logout');
      return;
    }
    if (dbUser.role == 'admin') {
      Bet.distinct("marketId", {
        status: 'MATCHED',
        result: 'ACTIVE',
        deleted: false
      }, function (err, marketIds) {
        if (err) logger.error(err);
        Market.find({
          marketId: {
            $in: marketIds,

          },
          /* marketType:{$in:['SESSION','Special']}*/
          visible: false
        }, function (err, dbMarkets) {

          Bet.distinct("marketId", {
            status: 'MATCHED',
            result: 'ACTIVE',
            deleted: false
          }, function (err, marketIdss) {
            if (err) logger.error(err);
            Market.find({
              marketId: {
                $in: marketIdss,

              },
              /* marketType:{$in:['SESSION','Special']}*/
              /*visible: false*/
            }, function (err, dbMarketas) {

              if (err) logger.error(err);
              socket.emit('get-pending-result-markets-success', {
                dbMarkets: dbMarkets,
                dbMarketas: dbMarketas
              });
            })
          });
        })
      });
    }
    if (dbUser.role == 'operator') {
      Bet.distinct("marketId", {
        status: 'MATCHED',
        result: 'ACTIVE',
        deleted: false
      }, function (err, marketIds) {
        if (err) logger.error(err);
        Market.find({
          marketId: {
            $in: marketIds
          },
          visible: false
        }, function (err, dbMarkets) {
          if (err) logger.error(err);
          socket.emit('get-pending-result-markets-success', dbMarkets);
        })
      });
    }
  });
}