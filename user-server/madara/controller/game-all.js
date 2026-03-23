// required modules
var mongoose = require('mongoose');
var logger = require('log4js').getLogger();
var jwt = require('jsonwebtoken');
const myEnv = require('dotenv').config();

// required models
var Login = mongoose.model('Login');
var User = mongoose.model('User');
var EventType = mongoose.model('EventType');
var Competition = mongoose.model('Competition');
var Event = mongoose.model('Event');
var Market = mongoose.model('Market');
var Ledger = mongoose.model('Ledger');
var Log = mongoose.model('Log');
var Setting = mongoose.model('Setting');
var Bet = mongoose.model('Bet');
var Session = mongoose.model('Session');
var Teenpatimarket = mongoose.model('Marketteenpati');
var Othermarket = mongoose.model('Othermarket');
var Summary = mongoose.model('Summary');
var requestUrl = require("request");
var WebToken = mongoose.model('WebToken');
//
// Helper Functions
//
// updatewebToken()

// console.log("user api env", process.env.Casino_PassKey)

/////// ------ Used Api Socket ------- ///////

module.exports.providerGames = async (req, res) => {
  var request = req.body;
  // console.log(request);
  let decoded = jwt.verify(req.token, myEnv.parsed.SECRET);
  let { userId } = jwt.decode(req.token);
  let user = await User.findOne({ _id: userId, token: req.token });
  if (!user) return res.send({ data: [], success: false, logout: true, message: "User Not Valid" });
  if (user.token != req.token) return res.send({ data: [], logout: true, success: false, message: "User Not Valid" });
  // var getSetting = await Setting.findOne();
  // var passKey = getSetting.casinopasskey;
  // // console.log("2222", passKey);

  await WebToken.findOne({}).then(async dbToken => {
    var token = dbToken.token;
    var options1 = {
      method: 'GET',
      url: process.env.Casino_Url + '/v2/games? size=50&currencies=INR&languages=en_US&includeFields=id,name,provider,images&gameTypes=' + request.gametype,
      headers: {
        'postman-token': 'a7e7a003-10f4-347e-27df-e834e39356e6',
        'cache-control': 'no-cache',
        'content-type': 'application/json',
        authorization: 'Bearer ' + token
      },
      json: true
    };

    requestUrl(options1, function (error, response, body1) {
      // console.log("error" + JSON.stringify(error))
      // // console.log("success" + JSON.stringify(body1))
      if (body1 == 'undefined') return;
      // // console.log(error);
      if (body1) {
        if (body1.code == 'INVALID_TOKEN') {
          updatewebToken();
        }
      }
      if (error) {
        // socket.emit('get-allgames-success', error);
        res.send({ data: [], success: false, message: "Unknown Error" });
      } else {
        // socket.emit('get-allgames-success', body1);
        res.send({ data: body1, success: true, message: "Game Success" });
      }
    });
  })
    .catch(error => {
      // console.log(error)
    })
}

module.exports.singleGame = async (req, res) => {

  var request = req.body;
  // console.log(req.body);
  let decoded = jwt.verify(req.token, myEnv.parsed.SECRET);
  let { userId } = jwt.decode(req.token);
  let user = await User.findOne({ _id: userId, token: req.token });
  if (!user) return res.send({ data: [], success: false, logout: true, message: "User Not Valid" });
  if (user.token != req.token) return res.send({ data: [], logout: true, success: false, message: "User Not Valid" });

  var gameId = request.gameId;
  // var gameId = "EVO-lightningtable01";

  WebToken.findOne({}).then(async dbToken => {

    var token = dbToken.token;
    var options1 = {
      method: 'POST',
      url: process.env.Casino_Url + '/v1/games/' + gameId + '/launch-url',
      headers: {
        'postman-token': 'a7e7a003-10f4-347e-27df-e834e39356e6',
        'cache-control': 'no-cache',
        'content-type': 'application/json',
        authorization: 'Bearer ' + token
      },
      body: {
        playerId: user._id,
        displayName: user._id,
        walletSessionId: process.env.WalletSession,
        tableId: request.tableId,
        // gameLaunchTarget: 'SELF',
        currency: 'INR',
        country: 'IN',
        gender: 'M',
        birthDate: '1986-01-01',
        lang: 'en_US',
        mode: 'real',
        returnUrl: process.env.Casino_returnUrl,
        device: 'mobile'
      },
      json: true
    };

    requestUrl(options1, function (error, response, body1) {
      // console.log("error" + JSON.stringify(error))
      // console.log("success" + JSON.stringify(body1))
      if (body1 == 'undefined') return;
      if (body1) {
        if (body1.code == 'INVALID_TOKEN') {
          updatewebToken();
        }
      }
      if (error) {
        res.send({ data: [], success: false, message: "Unknown Error" });
      } else {
        res.send({ data: body1, success: true, message: "Game Success" });
      }
    });
  }).catch(error => {
    // console.log(error)
  })

}

/////// ------ End Used Api Socket ----- /////////

function updatewebToken() {

  var options = {
    method: 'POST',
    url: process.env.Casino_Url + '/v1/auth/token',
    qs: {
      grant_type: 'password',
      response_type: 'token',
      username: process.env.Casino_UserName,
      password: process.env.Casino_PassWord
    },
    headers: {
      'content-type': 'application/x-www-form-urlencoded',
      'postman-token': '9f1c383f-5de6-0f44-f46d-a5eb2b69a5f2',
      'cache-control': 'no-cache'
    },
    form: {}
  };

  requestUrl(options, function (error, response, body) {
    // console.log('update token all');

    if (body == 'undefined') return;
    var res = JSON.parse(body);
    var token = res.access_token;
    // console.log('token' + token)
    WebToken.update({

    }, {
      $set: {
        token: token,
      }
    }, function (err, raw) { 
      // console.log(raw) 
    });

  });

}

module.exports.verifySession = async (req, res) => {
  try {
    // console.log("fdfgdgfd", req.body);


    User.findOne({
      'username': "USER7"
    }, { balance: 1 },
      async function (err, row) {
        res.send({
          row,
          success: true,
          message: "User Status Update"
        });
      });

  } catch (error) {
    // // console.log(error);
    res.send({
      error,
      success: false,
      message: "Unknown error"
    });
  }

}

module.exports.getUserReport = function (io, socket, request) {

  if (!request) return;
  if (!request.user) return;
  var usercall = request.users;
  if (!request.user.details) return;
  logger.debug("balanceTransfer: " + JSON.stringify(request));
  //// console.log(request);

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
    if (dbUser.role == 'manager') {


      User.findOne({
        username: usercall
      }, function (err, updatedUser) {


        if (err) logger.error(err);

        var randomTransfer = Math.floor((Math.random() * 10000) + 1);

        WebToken.findOne({

        }, function (err, dbToken) {

          var token = dbToken.token;
          var options1 = {
            method: 'POST',
            url: process.env.Casino_Url + '/v1/players/' + updatedUser._id + '/service-url',
            headers: {
              'postman-token': 'a7e7a003-10f4-347e-27df-e834e39356e6',
              'cache-control': 'no-cache',
              'content-type': 'application/json',
              authorization: 'Bearer ' + token
            },
            body: {
              "currency": "INR",
              "country": "IN",
              "gender": "M",
              "birthDate": "1986-01-01",
              "lang": "en_US",
              "timeZone": "Asia/Shanghai"

            },
            json: true
          };

          requestUrl(options1, function (error, response, body1) {
            if (error) // console.log("error:" + error);
            if (body1 == 'undefined') return;
            if (body1) {
              if (body1.code == 'INVALID_TOKEN') {
                updatewebToken();
              }
            }

            //// console.log(body1);
            if (error) {
              socket.emit('get-history-success', error);
            } else {
              socket.emit('get-history-success', body1);
            }

          });
        });
      });

    }


    if (dbUser.role == 'partner') {


      User.findOne({
        username: usercall
      }, function (err, updatedUser) {


        if (err) logger.error(err);

        var randomTransfer = Math.floor((Math.random() * 10000) + 1);
        WebToken.findOne({

        }, function (err, dbToken) {

          var token = dbToken.token;
          var options1 = {
            method: 'POST',
            url: process.env.Casino_Url + '/v1/players/' + updatedUser._id + '/service-url',
            headers: {
              'postman-token': 'a7e7a003-10f4-347e-27df-e834e39356e6',
              'cache-control': 'no-cache',
              'content-type': 'application/json',
              authorization: 'Bearer ' + token
            },
            body: {
              "currency": "INR",
              "country": "IN",
              "gender": "M",
              "birthDate": "1986-01-01",
              "lang": "en_US",
              "timeZone": "Asia/Shanghai"

            },
            json: true
          };

          requestUrl(options1, function (error, response, body1) {
            if (error) // console.log(error);
            if (body1 == 'undefined') return;
            if (body1) {
              if (body1.code == 'INVALID_TOKEN') {
                updatewebToken();
              }
            }
            //// console.log(body1);
            if (error) {
              socket.emit('get-history-success', error);
            } else {
              socket.emit('get-history-success', body1);
            }

          });
        });
      });

    }


  });
}

module.exports.gameReport = function (io, socket, request) {

  if (!request) return;
  if (!request.user) return;
  if (!request.user.details) return;
  // logger.info("updateUserBalance: "+JSON.stringify(request));
  User.findOne({
    username: request.user.details.username,
    hash: request.user.key
  }, {
    role: 1,
    username: 1,
    manager: 1
  }, function (err, dbUser) {
    if (err) logger.error(err);
    if (!dbUser) return;
    if (dbUser.role == 'admin') {
      var counter = 0;
      var output = {};

      Summary.distinct("manager", {

      }, function (err, users) {

        User.find({
          "username": {
            $in: users
          },

        }, {
          username: 1,
          'mainbalance': 1,
        }).sort({
          'username': -1,

        }).exec(function (err, userall) {

          output.userGet = userall;
          var len = userall.length;
          output.totalBet = {};
          output.totalPayout = {};
          output.totalNgr = {};

          for (var i = 0; i < userall.length; i++) {
            (function (username, index, callback) {
              request.filter.manager = username;
              Summary.find(request.filter).sort(request.sort).exec(function (err, summarys) {
                var totalBet = 0;
                var totalPayout = 0;
                var totalNgr = 0;
                for (var j = 0; j < summarys.length; j++) {
                  var val = summarys[j];
                  totalBet = parseFloat(totalBet) + parseFloat(val.totalBet);
                  totalPayout = parseFloat(totalPayout) + parseFloat(val.totalPayout);
                  totalNgr = parseFloat(totalNgr) + parseFloat(val.totalNgr);

                }


                callback(totalBet, totalPayout, totalNgr, index);
              });

            })(userall[i].username, i, function (totalBet, totalPayout, totalNgr, index) {
              counter++;
              if (counter == len) {
                output.totalBet[userall[index].username] = totalBet;
                output.totalPayout[userall[index].username] = totalPayout;
                output.totalNgr[userall[index].username] = totalNgr;

                socket.emit('get-game-report-success', output);
              } else {
                output.totalBet[userall[index].username] = totalBet;
                output.totalPayout[userall[index].username] = totalPayout;
                output.totalNgr[userall[index].username] = totalNgr;

              }

            });
          }


        });
      });

    }


    if (dbUser.role == 'manager') {
      var counter = 0;
      var output = {};

      Summary.distinct("username", {

      }, function (err, users) {

        User.find({
          "username": {
            $in: users
          },
          'manager': dbUser.username,
        }, {
          username: 1,
          'mainbalance': 1,
        }).sort({
          'username': -1,

        }).exec(function (err, userall) {

          output.userGet = userall;
          var len = userall.length;
          output.totalBet = {};
          output.totalPayout = {};
          output.totalNgr = {};

          for (var i = 0; i < userall.length; i++) {
            (function (username, index, callback) {
              request.filter.username = username;
              Summary.find(request.filter).sort(request.sort).exec(function (err, summarys) {
                var totalBet = 0;
                var totalPayout = 0;
                var totalNgr = 0;
                for (var j = 0; j < summarys.length; j++) {
                  var val = summarys[j];
                  totalBet = parseFloat(totalBet) + parseFloat(val.totalBet);
                  totalPayout = parseFloat(totalPayout) + parseFloat(val.totalPayout);
                  totalNgr = parseFloat(totalNgr) + parseFloat(val.totalNgr);

                }


                callback(totalBet, totalPayout, totalNgr, index);
              });

            })(userall[i].username, i, function (totalBet, totalPayout, totalNgr, index) {
              counter++;
              if (counter == len) {
                output.totalBet[userall[index].username] = totalBet;
                output.totalPayout[userall[index].username] = totalPayout;
                output.totalNgr[userall[index].username] = totalNgr;

                socket.emit('get-game-report-success', output);
              } else {
                output.totalBet[userall[index].username] = totalBet;
                output.totalPayout[userall[index].username] = totalPayout;
                output.totalNgr[userall[index].username] = totalNgr;

              }

            });
          }


        });
      });

    }


    if (dbUser.role == 'partner') {
      var counter = 0;
      var output = {};

      Summary.distinct("username", {

      }, function (err, users) {

        User.find({
          "username": {
            $in: users
          },
          'manager': dbUser.manager,
        }, {
          username: 1,
          'mainbalance': 1,
        }).sort({
          'username': -1,

        }).exec(function (err, userall) {

          output.userGet = userall;
          var len = userall.length;
          output.totalBet = {};
          output.totalPayout = {};
          output.totalNgr = {};

          for (var i = 0; i < userall.length; i++) {
            (function (username, index, callback) {
              request.filter.username = username;
              Summary.find(request.filter).sort(request.sort).exec(function (err, summarys) {
                var totalBet = 0;
                var totalPayout = 0;
                var totalNgr = 0;
                for (var j = 0; j < summarys.length; j++) {
                  var val = summarys[j];
                  totalBet = parseFloat(totalBet) + parseFloat(val.totalBet);
                  totalPayout = parseFloat(totalPayout) + parseFloat(val.totalPayout);
                  totalNgr = parseFloat(totalNgr) + parseFloat(val.totalNgr);

                }


                callback(totalBet, totalPayout, totalNgr, index);
              });

            })(userall[i].username, i, function (totalBet, totalPayout, totalNgr, index) {
              counter++;
              if (counter == len) {
                output.totalBet[userall[index].username] = totalBet;
                output.totalPayout[userall[index].username] = totalPayout;
                output.totalNgr[userall[index].username] = totalNgr;

                socket.emit('get-game-report-success', output);
              } else {
                output.totalBet[userall[index].username] = totalBet;
                output.totalPayout[userall[index].username] = totalPayout;
                output.totalNgr[userall[index].username] = totalNgr;

              }

            });
          }


        });
      });

    }


  });
}

function deposit(io, socket, user, amount) {

  // socket.emit("get-transfer-error-success",{message:"Balance tarnsfer successfully."});
  User.findOne({
    username: user.username
  }, function (err, dbBUser) {
    var limit = parseInt(dbBUser.limit) - parseInt(amount);
    var balance = parseInt(dbBUser.balance) - parseInt(amount);
    var Oldlimit = parseInt(dbBUser.limit);
    User.update({
      username: user.username,
      role: 'user',
      deleted: false
    }, {
      $set: {
        limit: limit,
        balance: balance
      }
    }, function (err, raw) { });
    var log = new Log();
    log.username = user.username;
    log.action = 'BALANCE';
    log.subAction = 'BALANCE_WITHDRAWL';
    log.oldLimit = Oldlimit;
    log.newLimit = limit;
    log.description = 'Balance Transfer to Game Wallet updated. Old Limit: ' + Oldlimit + '. New Limit: ' + limit;
    log.manager = user.username;
    log.eventTypeId = "550";
    log.time = new Date();
    log.deleted = false;

    log.save(function (err, saveId) {
      if (err) {
        logger.error('update-user-balance-error: Log entry failed.');
      }
    });
  });

}

function withdraw(io, socket, user, amount) {

  socket.emit("get-transfer-error-success", {
    message: "Balance withdraw successfully."
  });
  User.findOne({
    username: user.username
  }, function (err, dbBUser) {
    var limit = parseInt(dbBUser.limit) + parseInt(amount);
    var balance = parseInt(dbBUser.balance) + parseInt(amount);
    var Oldlimit = parseInt(dbBUser.limit);
    User.update({
      username: user.username,
      role: 'user',
      deleted: false
    }, {
      $set: {
        limit: limit,
        balance: balance
      }
    }, function (err, raw) { });
    var log = new Log();
    log.username = user.username;
    log.action = 'BALANCE';
    log.subAction = 'BALANCE_DEPOSIT';
    log.oldLimit = Oldlimit;
    log.newLimit = limit;
    log.description = 'Balance Transfer to Game Wallet updated. Old Limit: ' + Oldlimit + '. New Limit: ' + limit;
    log.manager = user.manager;
    log.eventTypeId = "550";
    log.time = new Date();
    log.deleted = false;

    log.save(function (err) {
      if (err) {
        logger.error('update-user-balance-error: Log entry failed.');
      }
    });
  });

}

module.exports.updateBalance = function (io, socket, request) {

  if (!request) return;
  if (!request.user) return;
  if (!request.user.details) return;
  // logger.info("updateUserBalance: "+JSON.stringify(request));
  User.findOne({
    username: request.user.details.username,
    hash: request.user.key
  }, {
    role: 1,
    username: 1
  }, function (err, dbUser) {
    if (err) logger.error(err);
    if (!dbUser) return;
    if (dbUser.role != 'user') return;
    if (dbUser.role == 'user') {
      if (request.action == "DEPOSIT") {


      }

      if (request.action == "WITHDRAW") {

      }
    }
  });
}

module.exports.getbalance = function (io, socket, request) {
  // return;     
  if (!request) return;
  if (!request.user) return;
  if (!request.user.details) return;
  logger.debug("getbalance: " + JSON.stringify(request));


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
    if (dbUser.role == 'user') {
      var request = require("request");
      User.findOne({
        username: dbUser.username
      }, function (err, updatedUser) {
        if (err) logger.error(err + "error login");


        var d = new Date();
        var randomTransfer = d.getTime();

        WebToken.findOne({

        }, function (err, dbToken) {

          var token = dbToken.token;

          var res = updatedUser._id;

          var options1 = {
            method: 'GET',
            url: process.env.Casino_Url + '/v1/wallet/ext/' + res,
            headers: {
              'postman-token': 'a7e7a003-10f4-347e-27df-e834e39356e6',
              'cache-control': 'no-cache',
              'content-type': 'application/json',
              authorization: 'Bearer ' + token
            },
            json: true
          };

          requestUrl(options1, function (errorHandler, response, body1) {

            if (errorHandler) // console.log(errorHandler);
            if (body1 == 'undefined') return;
            if (body1) {
              if (body1.code == 'INVALID_TOKEN') {
                updatewebToken();

              }
            }
            if (errorHandler) {
              socket.emit('get-balance-success', errorHandler);
            } else {
              socket.emit('get-balance-success', body1);
            }


          });
        });
      });

    }


  });
}

module.exports.balanceTransfer = async function (io, socket, request) {


  //if(request.user.details.username!='Test13')return;

  // // console.log(request);

  if (!request) return;
  if (!request.user) return;
  var amount = request.user.balance;

  if (!request.user.details) return;



  User.findOne({
    username: request.user.details.username,
    role: request.user.details.role,
    hash: request.user.key,
    deleted: false
  }, function (err, dbUser) {
    // // console.log(dbUser);

    if (err) logger.debug(err);
    if (!dbUser) {
      logger.error("Invalid Access: " + JSON.stringify(request));
      socket.emit('logout');
      return;
    }


    User.findOne({
      username: request.user.details.username
    }, async function (err, dbBUser) {
      if (!dbBUser) return;


      var blanceCheker = dbBUser.limit - dbBUser.exposure;
      var holdamount = 0;;
      if (dbBUser.holdAmount) {
        holdamount = dbBUser.holdAmount;
      } else {
        holdamount = 0;
      }

      if (parseInt(amount) > parseInt(blanceCheker)) {
        socket.emit('get-transfer-error-success', {
          message: "Limit exceed .!"
        });

        return;
      } else if (parseInt(amount) + parseInt(holdamount) > parseInt(blanceCheker)) {
        socket.emit('get-transfer-error-success', {
          message: "Balance Request greater than Main Balance .!"
        });

        return;

      } else {
        if (parseInt(amount) > parseInt(dbBUser.balance)) {
          socket.emit('get-transfer-error-success', {
            message: "Limit exceed."
          });

          return;
        } else {
          if (!dbBUser.holdAmount) {
            dbBUser.holdAmount = parseInt(amount);
          } else {
            dbBUser.holdAmount = parseInt(dbBUser.holdAmount) + parseInt(amount);
          }

          var totalamount = dbBUser.limit - dbBUser.exposure;

          if (parseInt(amount) + parseInt(holdamount) > totalamount) {


            socket.emit('get-transfer-error-success', {
              message: "balance Deposit Failed .!"
            });
            User.update({
              username: request.user.details.username
            }, {
              $set: {
                "holdAmount": 0
              }
            }, function (err, dbUpdatedUser) {
              if (err) {
                logger.debug(err);
              }
            });
            return;
          } else {

            User.update({
              username: dbBUser.username
            }, dbBUser, function (err, updateMessage) {
              if (updateMessage) {
                // // console.log('checkdeposit');
                checkDeposit(io, socket, amount, request);


              }

            });

          }


        }

      }


    });


  });

}

async function checkDeposit(io, socket, Totalamount, request) {
  // return;
  // // console.log(request);
  if (request.user.details.role == 'user') {

    var request12 = require("request");
    User.findOne({
      username: request.user.details.username
    }, async function (err, updatedUser) {
      if (!updatedUser) {
        socket.emit('get-transfer-error-success', {
          message: "Balance Deposit Failed Next Level .!"
        });

      }
      if (!updatedUser) return;

      if (err) logger.error(err);

      // // console.log("14234234325");


      var d = new Date();
      var randomTransfer = d.getTime();
      WebToken.findOne({

      }, function (err, dbToken) {

        var token = dbToken.token;
        var options1 = {
          method: 'POST',
          url: process.env.Casino_Url + '/v1/fund-transfers',
          headers: {
            'postman-token': 'a7e7a003-10f4-347e-27df-e834e39356e6',
            'cache-control': 'no-cache',
            'content-type': 'application/json',
            authorization: 'Bearer ' + token
          },
          body: {
            "type": "CREDIT",
            "referenceId": randomTransfer,
            "playerId": updatedUser._id,
            "amount": Totalamount,
            "currency": "INR",
            lang: 'en_US',
            mode: 'real',
            device: 'mobile',
            country: 'IN',

          },
          json: true
        };

        request12(options1, function (error, response, body1) {
          if (body1 == 'undefined') return;
          if (body1) {
            if (body1.code == 'INVALID_TOKEN') {
              updatewebToken();
            }
          }
          if (error) {
             // console.log(error); return;
             }

          var options2 = {
            method: 'PUT',
            url: process.env.Casino_Url + '/v1/fund-transfers/' + body1.id + '/status',
            headers: {
              'postman-token': 'a7e7a003-10f4-347e-27df-e834e39356e6',
              'cache-control': 'no-cache',
              'content-type': 'application/json',
              authorization: 'Bearer ' + token
            },
            body: {
              "status": "COMPLETED"

            },
            json: true
          };

          request12(options2, function (error, response, body2) {

            if (error) {

              socket.emit('get-transfer-error-success', error);

            } else {
              socket.emit('get-transfer-balance-success', body2);

              if (body2.status == "COMPLETED") {
                User.findOne({
                  username: request.user.details.username
                }, function (err, dbBUser) {

                  if (Totalamount > dbBUser.limit - dbBUser.exposure) {
                    socket.emit('get-transfer-error-success', {
                      message: "Limit exceed .!"
                    });
                    return;
                  }
                  var amount = Totalamount;
                  var limit = parseInt(dbBUser.limit) - parseInt(amount);
                  var balance = parseInt(dbBUser.balance) - parseInt(amount);
                  var Oldlimit = parseInt(dbBUser.limit);
                  var holdAmounts = parseInt(dbBUser.holdAmount) - parseInt(amount);
                  User.update({
                    username: request.user.details.username,
                    role: 'user',
                    deleted: false
                  }, {
                    $set: {
                      limit: limit,
                      balance: balance,
                      holdAmount: holdAmounts
                    }
                  }, function (err, raw) { });
                  var log = new Log();
                  log.username = dbBUser.username;
                  log.action = 'BALANCE';
                  log.subAction = 'BALANCE_WITHDRAWL';
                  log.oldLimit = Oldlimit;
                  log.newLimit = limit;
                  log.description = 'Balance Transfer to Game Wallet updated. Old Limit: ' + Oldlimit + '. New Limit: ' + limit;
                  log.manager = dbBUser.manager;
                  log.eventTypeId = "550";
                  log.time = new Date();
                  log.deleted = false;

                  log.save(function (err, saveId) {

                    if (err) {
                      logger.error('update-user-balance-error: Log entry failed.');
                    } else { }
                  });
                });

                User.update({
                  username: request.user.details.username,
                  role: 'user',
                  deleted: false
                }, {
                  $set: {
                    holdAmount: 0
                  }
                }, function (err, raw) { });

                socket.emit("get-transfer-balance-success", {
                  message: "Balance tarnsfer successfully."
                });
              } else {


                socket.emit("get-transfer-error-success", {
                  message: "Balance Transfer Not Found."
                });


              }
            }
          });

        });
      });


    });

  }
}

module.exports.getHistory = function (io, socket, request) {

  if (!request) return;
  if (!request.user) return;

  if (!request.user.details) return;
  logger.debug("balanceTransfer: " + JSON.stringify(request));


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
    if (dbUser.role == 'user') {


      User.findOne({
        username: dbUser.username
      }, function (err, updatedUser) {


        if (err) logger.error(err);


        var d = new Date();
        var randomTransfer = d.getTime();
        WebToken.findOne({

        }, function (err, dbToken) {

          var token = dbToken.token;
          var options1 = {
            method: 'POST',
            url: process.env.Casino_Url + '/v1/players/' + updatedUser._id + '/service-url',
            headers: {
              'postman-token': 'a7e7a003-10f4-347e-27df-e834e39356e6',
              'cache-control': 'no-cache',
              'content-type': 'application/json',
              authorization: 'Bearer ' + token
            },
            body: {
              "currency": "INR",
              "country": "IN",
              "gender": "M",
              "birthDate": "1986-01-01",
              "lang": "en_US",
              "timeZone": "Asia/Shanghai"

            },
            json: true
          };

          requestUrl(options1, function (error, response, body1) {
            if (error) // console.log(error);
            if (body1 == 'undefined') return;
            if (body1) {
              if (body1.code == 'INVALID_TOKEN') {
                updatewebToken();
              }
            }
            //// console.log(body1);
            if (error) {
              socket.emit('get-history-success', error);
            } else {
              socket.emit('get-history-success', body1);
            }

          });
        });
      });
    }


  });
}


module.exports.balanceWithdraw = function (io, socket, request) {

  //return;
  if (!request) return;
  if (!request.user) return;
  var balance = request.user.balance;
  if (!request.user.details) return;
  logger.debug("balanceWithdraw: " + JSON.stringify(request));


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
    if (dbUser.role == 'user') {

      User.findOne({
        username: dbUser.username
      }, function (err, updatedUser) {


        if (err) logger.error(err);



        var d = new Date();
        var randomTransfer = d.getTime();
        WebToken.findOne({

        }, function (err, dbToken) {

          var token = dbToken.token;
          var options1 = {
            method: 'POST',
            url: process.env.Casino_Url + '/v1/fund-transfers',
            headers: {
              'postman-token': 'a7e7a003-10f4-347e-27df-e834e39356e6',
              'cache-control': 'no-cache',
              'content-type': 'application/json',
              authorization: 'Bearer ' + token
            },
            body: {
              "type": "DEBIT",
              "referenceId": randomTransfer,
              "playerId": updatedUser._id,
              "amount": balance,
              "currency": "INR",
              lang: 'en_US',
              mode: 'real',
              device: 'mobile',
              country: 'IN',

            },
            json: true
          };

          requestUrl(options1, function (error, response, body1) {
            if (body1 == 'undefined') return;
            if (body1) {
              if (body1.code == 'INVALID_TOKEN') {
                updatewebToken();
              }
            }
            if (error) { 
              // console.log(error); return 
            };

            var options2 = {
              method: 'PUT',
              url: ' https://api-int.qtplatform.com/v1/fund-transfers/' + body1.id + '/status',
              headers: {
                'postman-token': 'a7e7a003-10f4-347e-27df-e834e39356e6',
                'cache-control': 'no-cache',
                'content-type': 'application/json',
                authorization: 'Bearer ' + token
              },
              body: {
                "status": "COMPLETED"

              },
              json: true
            };

            requestUrl(options2, function (error, response, body2) {

              if (error) {

                socket.emit('get-withdraw-balance-success', error);
              } else {
                //socket.emit('get-withdraw-balance-success', body2);
                if (body2.status == "COMPLETED") {
                  withdraw(io, socket, updatedUser, body2.amount);
                }

              }
            });
          });
        });
      });
    }


  });
}




module.exports.gameLinkOne = function (io, socket, request) {

  if (!request) return;
  if (!request.user) return;
  if (!request.user.details) return;
  logger.debug("gameLinkOne: " + JSON.stringify(request));
  // console.log("gameLinkOne: " + JSON.stringify(request));
  var gameId = request.gameId;
  // var gameId = "EVO-lightningtable01";

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
    if (dbUser.role == 'user') {

      User.findOne({
        username: dbUser.username
      }, function (err, updatedUser) {
        if (err) logger.error(err);

        WebToken.findOne({

        }, function (err, dbToken) {

          var token = dbToken.token;
          var options1 = {
            method: 'POST',
            url: process.env.Casino_Url + '/v1/games/' + gameId + '/launch-url',
            headers: {
              'postman-token': 'a7e7a003-10f4-347e-27df-e834e39356e6',
              'cache-control': 'no-cache',
              'content-type': 'application/json',
              authorization: 'Bearer ' + token
            },
            body: {
              playerId: updatedUser._id,
              displayName: updatedUser._id,
              walletSessionId: process.env.WalletSession,
              tableId: request.tableId,
              // gameLaunchTarget: 'SELF',
              currency: 'INR',
              country: 'IN',
              gender: 'M',
              birthDate: '1986-01-01',
              lang: 'en_US',
              mode: 'real',
              returnUrl: process.env.Casino_returnUrl,
              device: 'mobile'
            },
            json: true
          };

          requestUrl(options1, function (error, response, body1) {
            // console.log("error" + JSON.stringify(error))
            // console.log("success" + JSON.stringify(body1))
            if (body1 == 'undefined') return;
            if (body1) {
              if (body1.code == 'INVALID_TOKEN') {
                updatewebToken();

              }
            }
            if (error) {

              socket.emit('get-game-one-success', error);
            } else {

              User.update({
                username: dbUser.username
              }, {
                $set: {
                  gameId: request.gameId,
                }
              }, { new: true }, function (err, raw) {
                socket.emit('get-game-one-success', body1);
              });

            }

          });
        });
      });

    }


  });
}



module.exports.allGames = async function (io, socket, request) {

  if (!request) return;
  if (!request.user) return;
  if (!request.user.details) return;
  logger.debug("refreshUserBalance: " + JSON.stringify(request));
  var getSetting = await Setting.findOne();
  var passKey = getSetting.casinopasskey;
  // console.log("2222", passKey);

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
    if (dbUser.role == 'user') {

      User.findOne({
        username: dbUser.username
      }, function (err, updatedUser) {
        if (err) logger.error(err);
        WebToken.findOne({

        }, function (err, dbToken) {

          var token = dbToken.token;
          var options1 = {
            method: 'GET',
            url: process.env.Casino_Url + '/v2/games? size=50&currencies=INR&languages=en_US&includeFields=id,name,provider,images&gameTypes=' + request.gametype,
            headers: {
              'postman-token': 'a7e7a003-10f4-347e-27df-e834e39356e6',
              'cache-control': 'no-cache',
              'content-type': 'application/json',
              authorization: 'Bearer ' + token
            },
            json: true
          };

          requestUrl(options1, function (error, response, body1) {
            // console.log("error" + JSON.stringify(error))
            // // console.log("success" + JSON.stringify(body1))
            if (body1 == 'undefined') return;
            // // console.log(error);
            if (body1) {
              if (body1.code == 'INVALID_TOKEN') {
                updatewebToken();
              }
            }
            if (error) {

              socket.emit('get-allgames-success', error);
            } else {
              socket.emit('get-allgames-success', body1);
            }



          });
        });
      });
    }


  });
}

module.exports.homeGames = async function (io, socket, request) {

  // if (!request) return;
  // // console.log(request)
  logger.debug("refreshUserBalance: " + JSON.stringify(request));
  // // console.log("allGames: " + JSON.stringify(request),process.env);
  // var getSetting = await Setting.findOne();
  //   var passKey = getSetting.casinopasskey;
  //   // console.log("2222",passKey);
  WebToken.findOne({
  }, function (err, dbToken) {
    var token = dbToken.token;
    var options1 = {
      method: 'GET',
      url: process.env.Casino_Url + '/v2/games?size=500&currencies=INR&languages=en_US&includeFields=id,name,provider,category,images&gameTypes=INSTANTWIN,LIVECASINO,TABLEGAME',
      headers: {
        'postman-token': 'a7e7a003-10f4-347e-27df-e834e39356e6',
        'cache-control': 'no-cache',
        'content-type': 'application/json',
        authorization: 'Bearer ' + token
      },
      json: true
    };

    requestUrl(options1, function (error, response, body1) {
      // console.log("error" + JSON.stringify(error))
      // // console.log("success" + JSON.stringify(body1))
      if (body1 == 'undefined') return;
      // // console.log(error);
      if (error) {
        socket.emit('get-homegames-success', error);
      }
      if (body1.code === 'INVALID_TOKEN') {
        updatewebToken();
      }
      if (body1.items) {
        // // console.log(body1.code)
        // } else {
        // updatewebToken();
        var livecasino = [];
        var instantwin = [];
        var tablegame = [];
        var output = [];
        // // console.log(body1.items.length)
        let providers = [];
        for (var i = 0; i < body1.items.length; i++) {
          // // console.log(body1.items[i].category)
          let str = body1.items[i].category;
          let string = str.split("/");
          // // console.log(string[1]);

          if (string[1] === "LIVECASINO") {
            // // console.log(body1.items[i].provider); 
            providers.unshift(body1.items[i].provider)
            livecasino.unshift(body1.items[i])
          } else if (string[1] === "INSTANTWIN") {
            // // console.log(body1.items[i].provider);
            instantwin.unshift(body1.items[i])
          } else {
            tablegame.unshift(body1.items[i])
          }
        }

        let stringArray = providers.map(JSON.stringify);
        let uniqueStringArray = new Set(stringArray);
        providers = Array.from(uniqueStringArray, JSON.parse);
        // // console.log(providers)
        output[0] = livecasino;
        output[1] = instantwin
        output[2] = tablegame;
        output[3] = providers;
        Setting.update({
        }, {
          $set: {
            casinogames: output,
          }
        }, function (err, raw) { 
          // console.log("save in db") 
        });
        socket.emit('get-homegames-success', output);
      }
    });
  });

}

module.exports.gameLink = function (io, socket, request) {

  if (!request) return;
  if (!request.user) return;
  if (!request.user.details) return;
  logger.debug("refreshUserBalance: " + JSON.stringify(request));

  // // console.log(request);

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
    if (dbUser.role == 'user') {

      User.findOne({
        username: dbUser.username
      }, function (err, updatedUser) {
        if (err) logger.error(err);


        WebToken.findOne({

        }, function (err, dbToken) {
          if (err) logger.debug(err);
          var token = dbToken.token;
          var options1 = {
            method: 'POST',
            url: process.env.Casino_Url + '/v1/games/lobby-url',
            headers: {
              'postman-token': 'a7e7a003-10f4-347e-27df-e834e39356e6',
              'cache-control': 'no-cache',
              'content-type': 'application/json',
              authorization: 'Bearer ' + token
            },
            body: {
              playerId: updatedUser._id,
              displayName: updatedUser._id,
              gameLaunchTarget: 'SELF',
              currency: 'INR',
              country: 'IN',
              gender: 'M',
              birthDate: '1986-01-01',
              lang: 'en_US',
              mode: 'real',

              device: 'mobile'
            },
            json: true
          };

          requestUrl(options1, function (error, response, body1) {
            if (body1 == 'undefined') return;
            if (body1) {
              if (body1.code == 'INVALID_TOKEN') {
                updatewebToken();
              }
            }
            if (error) {
              // // console.log(error);
              socket.emit('get-game-status-success', error);
            } else {
              // console.log(body1);
              socket.emit('get-game-status-success', body1);
            }

          });
        });
      });

    }


  });
}


module.exports.gameNpreport = function (io, socket, request) {

  if (!request) return;
  if (!request.user) return;
  if (!request.user.details) return;
  logger.debug("refreshUserBalance: " + JSON.stringify(request));


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
    if (dbUser.role == 'user') {

      User.findOne({
        username: dbUser.username
      }, function (err, updatedUser) {
        if (err) logger.error(err);
        WebToken.findOne({

        }, function (err, dbToken) {

          var token = dbToken.token;
          var options1 = {
            method: 'GET',
            url: ' https://api-int.qtplatform.com/v1/ngr-player?from=2015-10-22T00:00:00&to=2015-10-23T00:00:00&embed=items,summary',
            headers: {
              'postman-token': 'a7e7a003-10f4-347e-27df-e834e39356e6',
              'cache-control': 'no-cache',
              'content-type': 'application/json',
              authorization: 'Bearer ' + token
            },
            json: true
          };

          requestUrl(options1, function (error, response, body1) {
            if (body1 == 'undefined') return;
            // // console.log(error);
            if (body1) {
              if (body1.code == 'INVALID_TOKEN') {
                updatewebToken();
              }
            }
            if (error) {

              socket.emit('get-report-status-success', error);
            } else {
              socket.emit('get-report-status-success', body1);
            }



          });
        });
      });
    }


  });
}