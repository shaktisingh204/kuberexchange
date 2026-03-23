// required modules
var mongoose = require('mongoose');
var logger = require('log4js').getLogger();
const { ObjectId } = require('mongodb');
var requestUrl = require("request");
var jwt = require('jsonwebtoken');
const myEnv = require('dotenv').config();

/////// ----- Used Comman Helpers ---- //////
const Helper = require('../controller/helper')

var Login = mongoose.model('Login');
var User = mongoose.model('User');
var Log = mongoose.model('Log');
var Bet = mongoose.model('Bet');
var Market = mongoose.model('Market');
var Logsettlement = mongoose.model('Logsettlement');
var LogMinus = mongoose.model('LogMinus');
var WebToken = mongoose.model('WebToken');
var requestUrl = require("request");


module.exports.profitLoss = async function (req, res) {
  try {
    console.log(req.body)
    // let decoded = jwt.verify(req.token, myEnv.parsed.SECRET);
    let { userId } = jwt.decode(req.token);
    let dbAdmin = await User.findOne({ _id: userId, token: req.token });
    if (!dbAdmin) return res.send({ success: false, logout: true, message: "Token Invalid. Please login in again." });
    if (dbAdmin.token != req.token) return res.send({ success: false, logout: true, message: "Token Invalid. Please login in again." });

    if (req.body.userId) {
      userId = req.body.userId;
    }
    Log.distinct("marketType", {
      userId: userId,
      eventTypeId: {
        $in: ['v9', 'c9', 'c1', '4', '1', '2']
      },
      subAction: {
        $in: ['AMOUNT_WON', 'AMOUNT_LOST', 'BALANCE_WITHDRAWL', 'BALANCE_DEPOSIT', 'BONUS_WITHDRAWL', 'BONUS_DEPOSIT', 'COMMISSION_WON', 'COMMISSION_LOST']
      },
      createDate: {
        "$gte": req.body.from,
        "$lte": req.body.to
      }

    }, function (err, marketlist) {


      console.log(marketlist)
      var output = {};
      if (marketlist.length == 0) {
        output.user = marketlist;
        output.profit = {};
        res.json(output)

        return;
      }

      var counter = 0;
      var totalLog = 0;
      var totalwon = 0;
      var totalloss = 0;
      output.user = marketlist;
      output.profit = {};
      var len = marketlist.length
      for (var i = 0; i < marketlist.length; i++) {
        var SportsType = 1;
        if (marketlist[i] === "MATCH_ODDS") {
          SportsType = 3;
          len = len + SportsType - 1;
        }
        console.log(marketlist[i]);
        for (var j = 0; j < SportsType; j++) {

          (function (user, index, callback) {

            // console.log(i, j, user);
            index = user;
            var filter = {
              'marketType': user,
              'userId': userId,
              'createDate': {
                "$gte": req.body.from,
                "$lte": req.body.to

              }
            };

            if (user === "MATCH_ODDS") {
              if (j === 0) {
                filter.eventTypeId = 1;
                index = "Soccer";
              } else if (j === 1) {
                filter.eventTypeId = 2;
                index = "Tennis";
              } else {
                filter.eventTypeId = 4;
                index = "Cricket";
              }

            }
            Log.find(filter, function (err, userlog) {

              var profit = 0;
              if (userlog) {

                console.log("total log", user, userlog.length);
                totalLog += userlog.length;

                for (var j = 0; j < userlog.length; j++) {
                  // if (userlog[j].subAction == 'AMOUNT_WON') {
                  //   profit += parseInt(userlog[j].amount);
                  //   totalwon += parseInt(userlog[j].amount);
                  // } else if (userlog[j].subAction == 'AMOUNT_LOST') {
                  //   profit -= parseInt(userlog[j].amount);
                  //   totalloss -= parseInt(userlog[j].amount);
                  // } else {
                  //   // console.log("kkk" + userlog[j].amount)
                  //   profit += parseInt(userlog[j].amount);
                  // }
                  profit += parseFloat(userlog[j].amount);
                }
                callback(profit, index, totalloss, totalwon);
              } else {
                callback(0, index, totalloss, totalwon);
              }
            });


            // callback(100, index, totalloss, totalwon);

          })(marketlist[i], i, function (profit, index, totalloss, totalwon) {
            counter++;
            // console.log(len);
            if (counter == len) {
              output.profit[index] = profit;
              res.json(output)


            } else {
              output.profit[index] = profit;
            }
          });
        }

      }
    });
  } catch (err) {
    res.json({ response: [], success: false, "message": "server response success" });
  }
}


module.exports.typeProfitLoss = async function (req, res) {
  try {
    // console.log("typeProfitLoss",req.token)
    // let decoded = jwt.verify(req.token, myEnv.parsed.SECRET);
    let { userId } = jwt.decode(req.token);
    let dbAdmin = await User.findOne({ _id: userId });
    if (!dbAdmin._id) return res.send({ success: false, logout: true, message: "Token Invalid. Please login in again." });
    if (dbAdmin.token != req.token) return res.send({ success: false, logout: true, message: "Token Invalid. Please login in again." });


    let { search, roletype, pageNumber, sortBy, limit } = req.body;

    var filter = {
      managerId: userId,
      // role: "user",
      ParentId: userId,
      deleted: false,
    };

    if (dbAdmin.role == "master") {
      filter = {
        masterId: userId,
        ParentId: userId,
        // role: "manager",
        deleted: false,
      };
    }

    if (dbAdmin.role == "subadmin") {
      filter = {
        subadminId: userId,
        ParentId: userId,
        // role: "master",
        deleted: false,
      };
    }

    if (dbAdmin.role == "admin") {
      filter = {
        adminId: userId,
        ParentId: userId,
        // role: "subadmin",
        deleted: false,
      };
    }

    if (search) {
      filter.username = { $regex: search.toUpperCase() };
    }

    if (roletype) {
      filter.role = roletype;
    }

    let setlimit = 20;
    if (limit) {
      setlimit = limit;
    }
    let page = pageNumber >= 1 ? pageNumber : 1;
    page = page - 1;
    let setskip = setlimit * page;

    // console.log("typeProfitLoss",filter);


    User.find(filter, { _id: 1 }).exec(function (err, totalUsers) {
      User.find(filter, {}, { skip: setskip, limit: setlimit }).sort({
        username: 1
      }).exec(async function (err, getUser) {
        // console.log(getUser.length);

        var output = {};
        if (getUser.length == 0) {
          output.user = getUser;
          output.users = {};
          output.totalloss = {};
          output.totalwon = {};
          res.json(output)

          return;
        }
        // res.json({ response: users, success: true, "message": "User List Succes" });
        if (getUser) {
          var counter = 0;

          // output.user = getUser;
          output.users = {};
          var len = getUser.length
          for (var i = 0; i < getUser.length; i++) {

            // console.log(getUser[i].username);

            (function (user, index, callback) {
              var totalLog = 0;
              var totalwon = 0;
              var totalloss = 0;
              var myprofit = 0;
              var filterlog = {
                userId: user._id,
                // eventTypeId: {
                //   $in: ['v9', 'c9', 'c1', '4', '1', '2']
                // },
                // subAction: {
                //   $in: ['AMOUNT_WON', 'AMOUNT_LOST', 'BALANCE_WITHDRAWL', 'BALANCE_DEPOSIT', 'BONUS_WITHDRAWL', 'BONUS_DEPOSIT', 'COMMISSION_WON', 'COMMISSION_LOST']
                // },
                // subAction: {
                //   $in: ['AMOUNT_WON', 'AMOUNT_LOST', 'COMMISSION_WON', 'COMMISSION_LOST']
                // },
                createDate: {
                  "$gte": req.body.from,
                  "$lte": req.body.to
                }
              };

              if (req.body.accountType == "1") {
                filterlog.subAction = {
                  $in: ['AMOUNT_WON', 'AMOUNT_LOST', 'COMMISSION_WON', 'COMMISSION_LOST']
                }
              } else {
                filterlog.subAction = {
                  $in: ['BALANCE_WITHDRAWL', 'BALANCE_DEPOSIT', 'BONUS_WITHDRAWL', 'BONUS_DEPOSIT']
                }
              }

              if (req.body.eventTypeId != "") {
                filterlog.eventTypeId = req.body.eventTypeId;
              }

              // console.log("typeProfitLoss",filterlog)

              if (user.role != "user") {
                for (var k = 0; k < user.partnershipsetting.length; k++) {
                  if (user.partnershipsetting[k].sport_id == 4) {
                    var myper = 100 - user.partnershipsetting[k].partnership;
                  }
                }
              } else {
                var myper = 100;
              }

              Log.find(filterlog, function (err, userlog) {

                var profit = 0;
                if (userlog) {

                  // console.log("typeAllProfitLoss total log", userlog.length);
                  // totalLog += userlog.length;

                  for (var j = 0; j < userlog.length; j++) {
                    // if (userlog[j].subAction == 'AMOUNT_WON' || userlog[j].subAction == 'BALANCE_DEPOSIT' || userlog[j].subAction == 'BONUS_DEPOSIT' || userlog[j].subAction == 'COMMISSION_WON') {
                    //   profit += parseInt(userlog[j].amount);
                    //   totalwon += parseInt(userlog[j].amount);
                    // } else if (userlog[j].subAction == 'AMOUNT_LOST' || userlog[j].subAction == 'BALANCE_WITHDRAWL' || userlog[j].subAction == 'BONUS_WITHDRAWL' || userlog[j].subAction == 'COMMISSION_LOST') {
                    //   profit += parseInt(userlog[j].amount);
                    //   totalloss += parseInt(userlog[j].amount);
                    // } else {
                    //   profit += parseInt(userlog[j].amount);
                    // }

                    // console.log("typeProfitLoss",userlog[j].amount);
                    if (user.role == "user") {
                      if (userlog[j].amount > 0) {
                        myprofit += parseFloat((-1 * userlog[j].amount * myper) / 100);
                        profit += parseFloat(userlog[j].amount);
                        totalwon += parseFloat(userlog[j].amount);
                      } else {
                        myprofit += parseFloat((-1 * userlog[j].amount * myper) / 100);
                        profit += parseFloat(userlog[j].amount);
                        totalloss += parseFloat(userlog[j].amount);
                      }
                    } else {
                      if (userlog[j].amount > 0) {
                        myprofit += parseFloat((userlog[j].amount * myper) / 100);
                        profit += parseFloat(userlog[j].amount);
                        totalwon += parseFloat(userlog[j].amount);
                      } else {
                        myprofit += parseFloat((userlog[j].amount * myper) / 100);
                        profit += parseFloat(userlog[j].amount);
                        totalloss += parseFloat(userlog[j].amount);
                      }
                    }

                    // profit += parseFloat(userlog[j].amount);
                  }
                  callback(user, profit, myprofit, index, totalloss, totalwon);
                } else {
                  callback(user, 0, index, myprofit, totalloss, totalwon);
                }
              });

            })(getUser[i], i, function (user, profit, myprofit, index, totalloss, totalwon) {
              counter++;
              // console.log(user.username, totalwon, totalloss, profit, (totalwon + totalloss));

              var data = {
                username: user.username,
                totalwon: parseFloat(totalwon).toFixed(2),
                totalloss: parseFloat(totalloss).toFixed(2),
                profit: parseFloat(profit).toFixed(2),
                myprofit: parseFloat(myprofit).toFixed(2),
                // logbalance: totalwon + totalloss,
                balance: parseFloat(user.balance).toFixed(2),
                creditrefrence: user.creditrefrence,

              }
              if (counter == len) {
                output.users[index] = data;
                // output.totalloss[index] = totalloss;
                // output.totalwon[index] = totalwon;
                // res.json(output)
                res.json({ response: output, totalUsers: totalUsers.length, success: true, "message": "User List Succes" });

              } else {
                output.users[index] = data;
                // output.totalloss[index] = totalloss;
                // output.totalwon[index] = totalwon;
              }
            });
          }
        }
      })
    });
  } catch (e) {
    console.log(e);
    return res.json({ response: [], success: true, "message": "DB error: Application error " });
  }
}

module.exports.typeAllProfitLoss = async function (req, res) {
  try {
    // console.log("typeAllProfitLoss", req.token)
    // let decoded = jwt.verify(req.token, myEnv.parsed.SECRET);
    let { userId } = jwt.decode(req.token);
    let dbAdmin = await User.findOne({ _id: userId });
    if (!dbAdmin._id) return res.send({ success: false, logout: true, message: "Token Invalid. Please login in again." });
    if (dbAdmin.token != req.token) return res.send({ success: false, logout: true, message: "Token Invalid. Please login in again." });


    let { search, roletype, pageNumber, sortBy, limit } = req.body;

    var filter = {
      managerId: userId,
      // role: "user",
      ParentId: userId,
      deleted: false,
    };

    if (dbAdmin.role == "master") {
      filter = {
        masterId: userId,
        ParentId: userId,
        // role: "manager",
        deleted: false,
      };
    }

    if (dbAdmin.role == "subadmin") {
      filter = {
        subadminId: userId,
        ParentId: userId,
        // role: "master",
        deleted: false,
      };
    }

    if (dbAdmin.role == "admin") {
      filter = {
        adminId: userId,
        ParentId: userId,
        // role: "subadmin",
        deleted: false,
      };
    }

    if (search) {
      filter.username = { $regex: search.toUpperCase() };
    }

    if (roletype) {
      filter.role = roletype;
    }

    let setlimit = 10;
    if (limit) {
      setlimit = limit;
    }
    let page = pageNumber >= 1 ? pageNumber : 1;
    page = page - 1;
    let setskip = setlimit * page;

    // console.log("typeAllProfitLoss",filter);

    // User.distinct("_id", filter, {}).exec(function (err, getUser) {
    User.distinct('_id', filter, async function (err, getUser) {
      // console.log(getUser);
      var output = {};
      var totalCredit = 0;
      var totalBalance = 0;
      var output = {};
      if (!getUser) {
        // output.user = getUser;
        var data = {
          username: dbAdmin.username,
          totalwon: 0,
          totalloss: 0,
          profit: 0,
          myprofit: 0,
          // logbalance: totalwon + totalloss,
          balance: totalBalance,
          creditrefrence: totalCredit,

        }
        res.json(data)
        return;
      }
      // res.json({ response: users, success: true, "message": "User List Succes" });
      if (getUser) {
        // console.log(getUser.length)
        var partnerpercentage = [];
        var userrole = [];
        var username = [];
        for (var i = 0; i < getUser.length; i++) {
          // console.log(getUser[i]);
          var childUsers = await User.findOne({ _id: getUser[i] }, { username: 1, creditrefrence: 1, balance: 1, role: 1, partnershipsetting: 1 });
          // console.log(childUsers.role,childUsers.username);
          if (childUsers.role != "user") {
            for (var k = 0; k < childUsers.partnershipsetting.length; k++) {
              if (childUsers.partnershipsetting[k].sport_id == 4) {
                partnerpercentage[getUser[i]] = childUsers.partnershipsetting[k].partnership;
              }
            }
          } else {
            partnerpercentage[getUser[i]] = 100;
          }
          userrole[getUser[i]] = childUsers.role;
          username[getUser[i]] = childUsers.username;
          // console.log("typeAllProfitLoss partnerpercentage", partnerpercentage);
          totalCredit += childUsers.creditrefrence;
          totalBalance += childUsers.balance;
          //   var userrole = childUsers.role;
          //   var username = childUsers.username;
        }

        // console.log(userrole,username)


        var filterlog = {
          // userId: user._id,
          userId: {
            $in: getUser
          },
          createDate: {
            "$gte": req.body.from,
            "$lte": req.body.to
          }
        };

        if (req.body.accountType == "1") {
          filterlog.subAction = {
            $in: ['AMOUNT_WON', 'AMOUNT_LOST', 'COMMISSION_WON', 'COMMISSION_LOST']
          }
        } else {
          filterlog.subAction = {
            $in: ['BALANCE_WITHDRAWL', 'BALANCE_DEPOSIT', 'BONUS_WITHDRAWL', 'BONUS_DEPOSIT']
          }
        }

        if (req.body.eventTypeId != "") {
          filterlog.eventTypeId = req.body.eventTypeId;
        }

        // console.log("typeAllProfitLoss",filterlog)

        Log.find(filterlog, async function (err, userlog) {

          var profit = 0;
          var myprofit = 0;
          var totalwon = 0;
          var totalloss = 0;

          if (userlog) {
            for (var j = 0; j < userlog.length; j++) {

              // var childUser = await User.findOne({_id: userlog[j].userId}, { role: 1, partnershipsetting: 1 });

              var myper = 100 - partnerpercentage[userlog[j].userId];
              // console.log("typeAllProfitLoss", userlog[j]._id, userlog[j].username,userrole[userlog[j].userId], userlog[j].userId, partnerpercentage[userlog[j].userId], myper);
              if (userrole[userlog[j].userId] == "user") {
                if (userlog[j].amount > 0) {
                  myprofit += parseFloat((-1 * userlog[j].amount * 100) / 100);
                  profit += parseFloat(userlog[j].amount);
                  totalwon += parseFloat(userlog[j].amount);
                } else {
                  myprofit += parseFloat((-1 * userlog[j].amount * 100) / 100);
                  profit += parseFloat(userlog[j].amount);
                  totalloss += parseFloat(userlog[j].amount);
                }
              } else {
                if (userlog[j].amount > 0) {
                  myprofit += parseFloat((userlog[j].amount * myper) / 100);
                  profit += parseFloat(userlog[j].amount);
                  totalwon += parseFloat(userlog[j].amount);
                } else {
                  myprofit += parseFloat((userlog[j].amount * myper) / 100);
                  profit += parseFloat(userlog[j].amount);
                  totalloss += parseFloat(userlog[j].amount);
                }
              }

              // console.log(userlog[j]._id)
            // console.log(userrole[userlog[j].userId], username[userlog[j].userId],myprofit, profit, totalloss, totalwon)
            }
            // callback(user, profit, index, totalloss, totalwon);
            
            var data = {
              username: dbAdmin.username,
              totalwon: parseFloat(totalwon).toFixed(2),
              totalloss: parseFloat(totalloss).toFixed(2),
              profit: parseFloat(profit).toFixed(2),
              myprofit: parseFloat(myprofit).toFixed(2),
              // logbalance: totalwon + totalloss,
              balance: parseFloat(totalBalance).toFixed(2),
              creditrefrence: parseFloat(totalCredit).toFixed(2),

            }
            res.json(data)
          } else {
            var data = {
              username: dbAdmin.username,
              totalwon: 0,
              totalloss: 0,
              profit: 0,
              myprofit: 0,
              // logbalance: totalwon + totalloss,
              balance: totalBalance,
              creditrefrence: totalCredit,

            }
            res.json(data)
            // callback(user, 0, index, totalloss, totalwon);
          }

        });



      }
    });
  } catch (e) {
    // console.log(e);
    return res.json({ response: [], success: true, "message": "DB error: Application error " });
  }
}

/////// ------ End Used Api ----- //////////

module.exports.checkLogComplete = function (req, res) {

  // console.log(req.body);

  Log.distinct("marketId", {
    username: username,
    eventTypeId: {
      $in: ['c9', 'c1', '4', '1', '2']
    },
    subAction: {
      $in: ['AMOUNT_WON', 'AMOUNT_LOST', 'RESETTLED_SSN', 'WRONG_RESULT']
    },
    createDate: {
      "$gte": req.body.from,
      "$lte": req.body.to
    }

  }, function (err, marketlist) {


    console.log(marketlist)
    var output = {};
    if (marketlist.length == 0) {
      output.user = marketlist;
      output.profit = {};
      res.json(output)

      return;
    }

    var counter = 0;
    var totalLog = 0;
    var totalwon = 0;
    var totalloss = 0;
    output.user = marketlist;
    output.profit = {};
    var len = marketlist.length
    for (var i = 0; i < marketlist.length; i++) {
      var SportsType = 1;
      if (marketlist[i] === "MATCH_ODDS") {
        SportsType = 3;
        len = len + SportsType - 1;
      }
      console.log(marketlist[i]);
      for (var j = 0; j < SportsType; j++) {

        (function (user, index, callback) {

          // console.log(i, j, user);
          index = user;
          var filter = {
            'marketType': user,
            'username': username,
            'createDate': {
              "$gte": req.body.from,
              "$lte": req.body.to

            }
          };

          if (user === "MATCH_ODDS") {
            if (j === 0) {
              filter.eventTypeId = 1;
              index = "Soccer";
            } else if (j === 1) {
              filter.eventTypeId = 2;
              index = "Tennis";
            } else {
              filter.eventTypeId = 4;
              index = "Cricket";
            }

          }
          Log.find(filter, function (err, userlog) {

            var profit = 0;
            if (userlog) {

              console.log("total log", user, userlog.length);
              totalLog += userlog.length;

              for (var j = 0; j < userlog.length; j++) {
                // if (userlog[j].subAction == 'AMOUNT_WON') {
                //   profit += parseInt(userlog[j].amount);
                //   totalwon += parseInt(userlog[j].amount);
                // } else if (userlog[j].subAction == 'AMOUNT_LOST') {
                //   profit -= parseInt(userlog[j].amount);
                //   totalloss -= parseInt(userlog[j].amount);
                // } else {
                //   // console.log("kkk" + userlog[j].amount)
                //   profit += parseInt(userlog[j].amount);
                // }
                profit += parseFloat(userlog[j].amount);
              }
              callback(profit, index, totalloss, totalwon);
            } else {
              callback(0, index, totalloss, totalwon);
            }
          });


          // callback(100, index, totalloss, totalwon);

        })(marketlist[i], i, function (profit, index, totalloss, totalwon) {
          counter++;
          // console.log(len);
          if (counter == len) {
            output.profit[index] = profit;
            res.json(output)

          } else {
            output.profit[index] = profit;
          }
        });
      }

    }
  });

}

module.exports.amountMinusUnmount = function (io, socket, request) {
  LogMinus.find(request.filter, function (err, dbLog) {
    if (!dbLog) return;
    if (dbLog.length == 0) return;
    var amount = 0;
    for (var i = 0; i < dbLog.length; i++) {
      amount += dbLog[i].amount;
    }
    socket.emit('get-minus-unmount-success', amount);

  });
}

module.exports.amountUnmount = function (io, socket, request) {
  Logsettlement.find(request.filter, function (err, dbLog) {
    if (!dbLog) return;
    if (dbLog.length == 0) return;
    var amount = 0;
    for (var i = 0; i < dbLog.length; i++) {
      amount += dbLog[i].amount;
    }
    socket.emit('get-referal-unmount-success', amount);

  });
}

module.exports.refreshSummary = function (io, socket, request) {

  try {
    if (!request) return;
    if (!request.user) return;
    if (!request.user.details) return;
    if (request.user.details.username != 'OSGCLUB') return;
    return;
    Log.distinct('marketId', {
      subAction: {
        $in: ['AMOUNT_WON', 'AMOUNT_LOST']
      },

      'manager': request.user.details.username

    }, function (err, dbMarket) {
      //console.log(dbMarket)
      if (dbMarket.length > 0) {
        for (var i = 0; i < dbMarket.length; i++) {
          Market.findOne({
            marketId: dbMarket[i]

          }, function (err, market) {
            if (market) {

              Log.find({
                marketId: market.marketId,
                manager: request.user.details.username,
                subAction: {
                  $in: ['AMOUNT_WON', 'AMOUNT_LOST', 'RESETTLED_SSN', 'WRONG_RESULT']
                },

              }, async function (err, userBets) {
                if (!userBets) return;
                var amount = 0;
                let n = 0;
                let lengh = userBets.length;
                while (n < userBets.length) {
                  if (userBets[n].subAction == 'AMOUNT_LOST') {

                    amount += -1 * Math.round(userBets[n].amount);


                  } else if (userBets[n].subAction == 'AMOUNT_WON') {

                    amount += Math.round(userBets[n].amount);

                  } else {

                    //amount += Math.round(userBets[n].amount);
                  }



                  if (lengh - 1 == n) {
                    console.log('market.marketId' + market.marketId)
                    Log.updateOne({
                      marketId: market.marketId,
                      username: request.user.details.username

                    }, {
                      $set: {
                        amount: amount,

                      }
                    }, function (err, raw) {
                      // console.log(raw)
                    });
                  }


                  n++;
                }
              });
            }


          });

        }

      }
    });


    Bet.distinct('marketId', {
      result: {
        $in: ['COMPLETED']
      },
      'eventTypeId': 'c9',
      'manager': request.user.details.username

    }, function (err, dbMarket) {
      //console.log(dbMarket)
      if (dbMarket.length > 0) {
        for (var i = 0; i < dbMarket.length; i++) {
          //calculateCasinoProfit(dbMarket[i], request.user.details.username);

        }

      }
    });
  } catch (e) {
    console.log(e)
  }


}

async function calculateLogProfit(market, manager) {
  try {




  } catch (e) {
    console.log(e)
  }
}

async function calculateCasinoProfit(market, manager) {
  try {


    var profit = 0;
    Bet.find({
      marketId: market,
      manager: manager,
      result: {
        $in: ['COMPLETED']
      },

    }, function (err, userBets) {
      if (!userBets) return;
      userBets.forEach(function (val, bindex) {

        if (-1 * (val.totalPayout - val.stake) > 0) {
          var subAction = "AMOUNT_WON";
          var amount = -1 * Math.round(val.totalPayout - val.stake) * 10;
        } else {
          var subAction = "AMOUNT_LOST";
          var amount = Math.round(val.totalPayout - val.stake) * 10;
        }


        Log.updateOne({
          marketId: market,
          username: manager

        }, {
          $set: {
            amount: amount,
            subAction: subAction
          }
        }, function (err, raw) {
          console.log(raw)
        });


      });
    });

  } catch (e) {
    console.log(e)
  }
}

async function calculateUserRunnerProfit(market, manager) {
  try {
    if (!market || !market.marketBook || !market.marketBook.runners) {

      return;
    }

    var runnerProfit = {};
    var w = null;
    market.marketBook.runners.forEach(async function (r, index) {
      if (r.status == 'WINNER') {
        w = r.selectionId;
      }
      runnerProfit[r.selectionId] = 0;
      if (index == market.marketBook.runners.length - 1) {
        var profit = 0;
        await Bet.find({
          marketId: market.marketId,
          manager: manager,
          result: {
            $in: ['WON', 'LOST']
          },
          deleted: false
        }, function (err, userBets) {
          if (!userBets) return;
          userBets.forEach(function (val, bindex) {
            if (val.type == 'Back') {
              for (var k in runnerProfit) {
                if (k == val.runnerId) {
                  runnerProfit[k] += Math.round((val.rate - 1) * val.stake);
                  profit += Math.round((val.rate - 1) * val.stake);

                } else {
                  runnerProfit[k] -= Math.round(val.stake);
                  profit -= Math.round(val.stake);

                }
              }
            } else {
              for (var k in runnerProfit) {
                if (k == val.runnerId) {

                  runnerProfit[k] -= Math.round((val.rate - 1) * val.stake);

                  profit -= Math.round((val.rate - 1) * val.stake);


                } else {


                  runnerProfit[k] += Math.round(val.stake);

                  profit += Math.round(val.stake);

                }
              }
            }
            if (bindex == userBets.length - 1) {
              if (w != null) {
                if (runnerProfit[w] == null) {
                  runnerProfit[w] = 0;
                }
              }
              console.log('runnerProfit[w]' + runnerProfit[w])
              if (-1 * runnerProfit[w] > 0) {

                var amount = -1 * runnerProfit[w];
              } else {
                if (runnerProfit[w] > 0) {
                  var amount = runnerProfit[w];
                } else {
                  var amount = -1 * runnerProfit[w];
                }

              }


              Log.updateOne({
                marketId: market.marketId,
                username: manager

              }, {
                $set: {
                  amount: amount,

                }
              }, function (err, raw) {
                console.log(raw)
              });



            }
          });
        });
      }
    });
  } catch (e) {
    console.log(e)
  }
}

async function calculateSessionRunnerProfit(market, manager) {
  try {
    if (!market || !market.marketBook) {
      logger.error('Market not found for session runner profit');
      return;
    }

    var runnerProfit = {};
    var w = null;
    if (market.marketBook.status == 'CLOSED') {
      w = market.sessionResult + '';

    }

    await Bet.find({
      marketId: market.marketId,
      result: {
        $in: ['WON', 'LOST']
      },
      deleted: false,
      manager: manager,
    }, function (err, bets) {


      var min = 0,
        max = 0,
        bc = 0;
      for (j = 0; j < bets.length; j++) {
        if (j == 0) {
          min = parseInt(bets[j].selectionName);
          max = parseInt(bets[j].selectionName);
        } else {
          if (parseInt(bets[j].selectionName) > max) max = parseInt(bets[j].selectionName);
          if (parseInt(bets[j].selectionName) < min) min = parseInt(bets[j].selectionName);
        }
      }
      if (market.sessionResult) {
        if (market.sessionResult < min) min = market.sessionResult;
        if (market.sessionResult > max) max = market.sessionResult;
      }
      for (var i = min - 1; i < max + 1; i++) {
        result = i;
        var c2 = 0,
          maxLoss = 0;
        for (var bi1 = 0; bi1 < bets.length; bi1++) {
          c2++;
          b1 = bets[bi1];
          if (b1.type == 'Back') {
            if (result >= parseInt(bets[bi1].selectionName)) {
              maxLoss += Math.round(bets[bi1].rate * bets[bi1].stake);
            } else {
              maxLoss -= bets[bi1].stake;
            }
          } else {
            if (result < parseInt(bets[bi1].selectionName)) {
              maxLoss += bets[bi1].stake;
            } else {
              maxLoss -= Math.round(bets[bi1].rate * bets[bi1].stake);
            }
          }
        }
        runnerProfit[i] = maxLoss;
      }
      if (-1 * runnerProfit[w] > 0) {
        var subAction = "AMOUNT_WON";
        var amount = -1 * runnerProfit[w];
      } else {
        var subAction = "AMOUNT_LOST";
        if (runnerProfit[w] > 0) {
          var amount = runnerProfit[w];
        } else {
          var amount = -1 * runnerProfit[w];
        }

      }

      Log.updateOne({
        marketId: market.marketId,
        username: manager

      }, {
        $set: {
          amount: amount,

        }
      }, function (err, raw) { });

    });
  } catch (e) {
    console.log(e)
  }
}

module.exports.getLogCredit = function (io, socket, request) {
  if (!request) return;
  if (!request.user) return;
  if (!request.user.details) return;
  //("getLogCredit: " + JSON.stringify(request));

  Log.find(request.filter).exec(function (err, dbLogs) {
    if (err) logger.error(err);
    socket.emit('get-logs-credit', dbLogs);


  });
};

module.exports.updateAmount = function (io, socket, request) {
  if (!request) return;
  if (!request.user) return;
  if (!request.user.details) return;
  //("updateAmount: " + JSON.stringify(request));

  Login.findOne({
    hash: request.user.key,
    username: request.user.details.username,
    role: request.user.details.role,
    deleted: false,
    status: 'active'
  }, function (err, dbUser) {
    if (err) logger.error(err);
    if (!dbUser) {
      logger.error("Invalid Access: " + JSON.stringify(request));
      return;
    }

  });
};

module.exports.getsettlment = function (io, socket, request) {
  if (!request) return;
  if (!request.user) return;
  if (!request.user.details) return;
  //("getsettlment: " + JSON.stringify(request));

  Login.findOne({
    hash: request.user.key,
    username: request.user.details.username,
    role: request.user.details.role,
    deleted: false,
    status: 'active'
  }, function (err, dbUser) {
    if (err) logger.error(err);
    if (!dbUser) {
      logger.error("Invalid Access: " + JSON.stringify(request));
      return;
    }
    if (request.user.details.role == 'user') {
      request.filter['username'] = request.user.details.username;
      request.filter['deleted'] = false;
      Logsettlement.find(request.filter).sort(request.sort).exec(function (err, dbLogs) {
        if (err) logger.error(err);
        socket.emit('get-logsettlement-success', dbLogs);
      });
    }
    if (request.user.details.role == 'manager' || request.user.details.role == 'partner') {
      Logsettlement.find(request.filter).sort(request.sort).exec(function (err, dbLogs) {
        if (err) logger.error(err);
        socket.emit('get-logsettlement-success', dbLogs);
      });
    }
    if (request.user.details.role == 'admin') {
      Logsettlement.find(request.filter).sort(request.sort).exec(function (err, dbLogs) {
        if (err) logger.error(err);
        socket.emit('get-logsettlement-success', dbLogs);
      });
    }
  });
};

module.exports.getLogCommisions = function (io, socket, request) {
  if (!request) return;
  if (!request.user || !request.filter || !request.sort) return;
  if (!request.user.details) return;
  //("getLogCommisions: " + JSON.stringify(request));

  Login.findOne({
    hash: request.user.key,
    username: request.user.details.username,
    role: request.user.details.role,
    deleted: false,
    status: 'active'
  }, function (err, dbUser) {
    if (err) logger.error(err);
    if (!dbUser) {
      logger.error("Invalid Access: " + JSON.stringify(request));
      return;
    }
    if (request.user.details.role == 'user') {
      request.filter['username'] = request.user.details.username;
      request.filter['deleted'] = false;
      Log.find(request.filter).sort(request.sort).exec(function (err, dbLogs) {
        if (err) logger.error(err);
        socket.emit('get-logs-success', dbLogs);
      });
    }
    if (request.user.details.role == 'manager' || request.user.details.role == 'partner' || request.user.details.role == 'subadmin' || request.user.details.role == 'master') {
      Log.find(request.filter).sort(request.sort).exec(function (err, dbLogs) {
        if (err) logger.error(err);
        socket.emit('get-logs-commision-success', dbLogs);
      });
    }
    if (request.user.details.role == 'admin') {
      Log.find(request.filter).sort(request.sort).exec(function (err, dbLogs) {
        if (err) logger.error(err);
        socket.emit('get-logs-commision-success', dbLogs);
      });
    }
  });
};

module.exports.getReferalCommisions = function (io, socket, request) {
  if (!request) return;
  if (!request.user || !request.filter || !request.sort) return;
  if (!request.user.details) return;
  //("getReferalCommisions: " + JSON.stringify(request));

  Login.findOne({
    hash: request.user.key,
    username: request.user.details.username,
    role: request.user.details.role,
    deleted: false,
    status: 'active'
  }, function (err, dbUser) {
    if (err) logger.error(err);
    if (!dbUser) {
      logger.error("Invalid Access: " + JSON.stringify(request));
      return;
    }
    if (request.user.details.role == 'user') {
      request.filter['username'] = request.user.details.username;
      request.filter['deleted'] = false;
      Log.find(request.filter).sort(request.sort).exec(function (err, dbLogs) {
        if (err) logger.error(err);
        socket.emit('get-referal-success', dbLogs);
      });
    }
    if (request.user.details.role == 'manager' || request.user.details.role == 'partner' || request.user.details.role == 'subadmin' || request.user.details.role == 'master') {
      // console.log(request.filter)
      Logsettlement.find(request.filter).sort(request.sort).exec(function (err, dbLogs) {
        if (err) logger.error(err);
        socket.emit('get-referal-commision-success', dbLogs);
      });
    }
    if (request.user.details.role == 'admin') {
      Log.find(request.filter).sort(request.sort).exec(function (err, dbLogs) {
        if (err) logger.error(err);
        socket.emit('get-referal-commision-success', dbLogs);
      });
    }
  });
};

function updateBalance(userk, done) {
  var balance = 0;


  User.find({
    'manager': userk.user.details.username,
    'role': 'user'
  }, {
    username: 1,
    balance: 1,
    limit: 1,
    exposure: 1
  }, function (err, resultUser) {

    if (resultUser.length == 0) return;
    for (var i = 0; i < resultUser.length; i++) {
      (function (userm) {

        Login.findOne({
          username: userk.user.details.username
        }, function (err, result) {

          User.findOne({
            username: userm.username,
            deleted: false
          }, function (err, user) {
            if (err || !user) {
              done(-1);
              return;
            }
            Bet.distinct('marketId', {
              username: userm.username,
              deleted: false,
              result: 'ACTIVE'
            }, function (err, marketIds) {

              //console.log(marketIds)
              if (err) logger.error(err);
              if (!marketIds || marketIds.length < 1) {
                User.update({
                  username: userm.username
                }, {
                  $set: {
                    balance: user.limit,
                    exposure: 0
                  }
                }, function (err, raw) {
                  if (err) logger.error(err);
                });
                done(-1);
                return;
              }
              Market.find({
                managers: user.manager,
                deleted: false,
                marketId: {
                  $in: marketIds
                }
              }, function (err, markets) {
                if (err || !markets || markets.length < 1) {
                  logger.error("updateBalance error: no markets found");
                  done(-1);
                  return;
                }
                var exposure = 0;
                var counter = 0;
                var len = markets.length;
                // console.log("sssssssssssssssssssssssssssssss")
                markets.forEach(function (market, index) {
                  if (market.marketType != 'SESSION') {
                    (function (market, mindex, callback) {
                      Bet.find({
                        marketId: market.marketId,
                        username: user.username,
                        result: 'ACTIVE',
                        deleted: false
                      }, function (err, bets) {


                        if (err || !bets || bets.length < 1) {
                          callback(0, mindex);
                          return;
                        }
                        //calculate runnerProfit for each runner
                        var i = 0,
                          runnerProfit = {},
                          maxLoss = 0;
                        for (i = 0; i < market.marketBook.runners.length; i++) {
                          runnerProfit[market.marketBook.runners[i].selectionId] = 0;
                        }
                        for (i = 0; i < bets.length; i++) {
                          var op = 1;
                          if (bets[i].type == 'Back') op = -1;
                          for (var k in runnerProfit) {
                            if (k == bets[i].runnerId && bets[i].status == 'MATCHED') runnerProfit[k] += ((-1 * op) * Math.round(((bets[i].rate - 1) * bets[i].stake)));
                            else runnerProfit[k] += (op * Math.round(bets[i].stake));
                          }
                        }
                        for (var key in runnerProfit) {
                          if (runnerProfit[key] < 0 && runnerProfit[key] < maxLoss) maxLoss = runnerProfit[key];
                        }
                        //(user.username + " market: " + market.marketName + " exposure: " + maxLoss);
                        callback(maxLoss, mindex);
                        return;
                      });
                    })(market, index, function (e, i) {
                      counter++;
                      if (counter == len) {
                        exposure += e * 1;
                        //  console.log(exposure)
                        //("Total exposure: " + exposure);
                        if (exposure <= 0) user.balance = user.limit + exposure;
                        //logger.info(user.username + " New Balance: " + user.balance);
                        Bet.find({
                          username: user.username,
                          result: 'ACTIVE',
                          deleted: false,
                          eventTypeName: 'wheelSpiner'
                        }, function (err, betspinners) {
                          if (betspinners.length > 0) {
                            var exposurewheel = 0;
                            var counterw = 0;
                            var wheellength = betspinners.length;
                            for (w = 0; w < betspinners.length; w++) {
                              counterw++;
                              if (counterw == wheellength) {
                                exposurewheel += betspinners[w].stake;
                                // console.log(exposurewheel);
                                User.update({
                                  username: user.username
                                }, {
                                  $set: {
                                    balance: user.balance,
                                    exposure: exposure - exposurewheel
                                  }
                                }, function (err, raw) {
                                  done(1);
                                  return;
                                });
                              } else {
                                exposurewheel += betspinners[w].stake;
                              }
                            }
                          } else {
                            User.update({
                              username: user.username
                            }, {
                              $set: {
                                balance: user.balance,
                                exposure: exposure
                              }
                            }, function (err, raw) {
                              done(1);
                              return;
                            });
                          }
                        });

                      } else {
                        exposure += e * 1;
                        // console.log(exposure)
                      }
                    });
                  } else {
                    (function (market, mindex, callback) {
                      Bet.find({
                        marketId: market.marketId,
                        username: user.username,
                        result: 'ACTIVE',
                        deleted: false
                      }, function (err, bets) {
                        if (err || !bets || bets.length < 1) {
                          callback(0);
                          return;
                        }
                        var min = 0,
                          max = 0,
                          i = 0,
                          maxLoss = 0;
                        // Find session runs range
                        for (i = 0; i < bets.length; i++) {
                          if (i == 0) {
                            min = parseInt(bets[i].selectionName);
                            max = parseInt(bets[i].selectionName);
                          } else {
                            if (parseInt(bets[i].selectionName) > max) max = parseInt(bets[i].selectionName);
                            if (parseInt(bets[i].selectionName) < min) min = parseInt(bets[i].selectionName);
                          }
                        }
                        // Calculate maximum loss for all possible results
                        for (var result = min - 1; result < max + 1; result++) {
                          var resultMaxLoss = 0;
                          for (i = 0; i < bets.length; i++) {
                            if (bets[i].type == 'Back') {
                              if (result >= parseInt(bets[i].selectionName)) resultMaxLoss += Math.round(bets[i].rate * bets[i].stake);
                              else resultMaxLoss -= bets[i].stake;
                            } else {
                              if (result < parseInt(bets[i].selectionName)) resultMaxLoss += bets[i].stake;
                              else resultMaxLoss -= Math.round(bets[i].rate * bets[i].stake);
                            }
                          }
                          if (resultMaxLoss < 0 && resultMaxLoss < maxLoss) maxLoss = resultMaxLoss;
                        }
                        //("max loss " + maxLoss);
                        callback(maxLoss, mindex);
                        return;
                      });
                    })(market, index, function (e, i) {
                      counter++;
                      if (counter == len) {
                        exposure += e * 1;
                        //("Total exposure: " + exposure);
                        if (exposure <= 0)
                          user.balance = user.limit + exposure;
                        //("New Balance: " + user.balance);
                        Bet.find({
                          username: user.username,
                          result: 'ACTIVE',
                          deleted: false,
                          eventTypeName: 'wheelSpiner'
                        }, function (err, betspinners) {
                          if (betspinners.length > 0) {
                            var exposurewheel = 0;
                            var counterw = 0;
                            var wheellength = betspinners.length;
                            for (w = 0; w < betspinners.length; w++) {
                              counterw++;
                              if (counterw == wheellength) {
                                exposurewheel += betspinners[w].stake;
                                // console.log(exposurewheel);
                                User.update({
                                  username: user.username
                                }, {
                                  $set: {
                                    balance: user.balance,
                                    exposure: exposure - exposurewheel
                                  }
                                }, function (err, raw) {
                                  done(1);
                                  return;
                                });
                              } else {
                                exposurewheel += betspinners[w].stake;
                              }
                            }
                          } else {
                            User.update({
                              username: user.username
                            }, {
                              $set: {
                                balance: user.balance,
                                exposure: exposure
                              }
                            }, function (err, raw) {
                              done(1);
                              return;
                            });
                          }
                        });
                      } else {
                        exposure += e * 1;
                        // console.log(exposure)
                      }
                    });
                  }
                });
              });
            });


          });

        });
      })(resultUser[i])
    }
  });
}

function getCasinoBalance(user) {
  if (user.details.role == 'manager') {
    var filter = {
      role: 'user',
      'manager': user.details.username,
      deleted: false,
      'status': 'active'
    }
  } else if (user.details.role == 'master') {
    var filter = {
      role: 'user',
      'master': user.details.username,
      deleted: false,
      'status': 'active'
    }
  } else if (user.details.role == 'subadmin') {
    var filter = {
      role: 'user',
      'subadmin': user.details.username,
      deleted: false,
      'status': 'active'
    }
  } else {
    var filter = {
      role: 'user',
      deleted: false,
      'manager': user.details.manager,
      'status': 'active'
    }
  }
  var amount = 0;
  User.find(filter).exec(function (err, userall) {

    userall.forEach((val) => {

      var d = new Date()
      var randomTransfer = d.getTime();

      WebToken.findOne({

      }, function (err, dbToken) {
        var token = dbToken.token;

        var res = val._id;

        var options1 = {
          method: 'GET',
          url: 'https://api.qtplatform.com/v1/wallet/ext/' + res,
          headers: {
            'postman-token': 'a7e7a003-10f4-347e-27df-e834e39356e6',
            'cache-control': 'no-cache',
            'content-type': 'application/json',
            authorization: 'Bearer ' + token
          },
          json: true
        };

        requestUrl(options1, function (errorHandler, response, body1) {

          if (body1 == 'undefined') return;
          var resp = body1;

          if (body1) {

            amount += body1.amount * 10;
            // console.log(body1.amount)
            User.update({
              username: val.username
            }, {
              $set: {
                mainbalance: body1.amount * 10,

              }
            }, function (err, dbUpdatedUser) {
              if (err) {
                logger.debug(err);
              }

            });
          }


        });
      });
    });
  })
}
module.exports.getLogs = function (io, socket, request) {
  if (!request) return;
  if (!request.user || !request.filter || !request.sort) return;
  if (!request.user.details) return;
  //("getLogs: " + JSON.stringify(request));

  Login.findOne({
    hash: request.user.key,
    username: request.user.details.username,
    role: request.user.details.role,
    deleted: false,
    status: 'active'
  }, function (err, dbUser) {
    if (err) logger.error(err);
    if (!dbUser) {
      logger.error("Invalid Access: " + JSON.stringify(request));
      return;
    }
    if (request.user.details.role == 'user') {
      request.filter['username'] = request.user.details.username;
      request.filter['deleted'] = false;
      Log.find(request.filter).sort(request.sort).exec(function (err, dbLogs) {
        if (err) logger.error(err);
        socket.emit('get-logs-success', dbLogs);
      });
    }
    if (request.user.details.role == 'manager' || request.user.details.role == 'partner' || request.user.details.role == 'subadmin' || request.user.details.role == 'master') {
      getCasinoBalance(request.user);
      updateBalance({
        user: request.user
      }, function (error) { });
      Log.find(request.filter).sort(request.sort).exec(function (err, dbLogs) {

        if (err) logger.error(err);
        socket.emit('get-logs-success', dbLogs);
      });
    }
    if (request.user.details.role == 'admin') {
      Log.find(request.filter).sort(request.sort).exec(function (err, dbLogs) {
        if (err) logger.error(err);
        socket.emit('get-logs-success', dbLogs);
      });
    }
  });
};

module.exports.getLogsfilter = function (io, socket, request) {
  if (!request) return;
  //console.log(request.from);
  if (!request.user) return;
  if (!request.user.details) return;
  //("getLogs: " + JSON.stringify(request));

  Login.findOne({
    hash: request.user.key,
    username: request.user.details.username,
    role: request.user.details.role,
    deleted: false,
    status: 'active'
  }, function (err, dbUser) {
    if (err) logger.error(err);
    if (!dbUser) {
      logger.error("Invalid Access: " + JSON.stringify(request));
      return;
    }

    if (request.user.details.role == 'manager') {
      Log.find({
        relation: request.user.details.username,
        action: {
          $in: ['BALANCE', 'AMOUNT']
        },
        deleted: false,
        "time": {
          "$gte": new Date(request.from + "T00:59:00.000Z"),
          "$lte": new Date(request.to + "T23:59:00.000Z")
        }
      }).exec(function (err, dbLogs) {
        if (err) logger.error(err);
        if (err) logger.error(err);
        socket.emit('get-logs-success', dbLogs);
      });
    }

    if (request.user.details.role == 'partner') {
      Log.find({
        relation: request.user.details.manager,
        action: {
          $in: ['BALANCE', 'AMOUNT']
        },
        deleted: false,
        "time": {
          "$gte": new Date(request.from + "T00:59:00.000Z"),
          "$lte": new Date(request.to + "T23:59:00.000Z")
        }
      }).exec(function (err, dbLogs) {
        if (err) logger.error(err);
        if (err) logger.error(err);
        socket.emit('get-logs-success', dbLogs);
      });
    }
    if (request.user.details.role == 'admin') {

      Log.find({
        username: 'admin',
        subAction: {
          $in: ['BALANCE_WITHDRAWL', 'BALANCE_DEPOSIT']
        },
        deleted: false,
        "time": {
          "$gte": new Date(request.from + "T00:59:00.000Z"),
          "$lte": new Date(request.to + "T23:59:00.000Z")
        }
      }).exec(function (err, dbLogs) {
        if (err) logger.error(err);
        //   console.log(dbLogs)
        socket.emit('get-logs-success', dbLogs);
      });
    }

    if (request.user.details.role == 'master' || request.user.details.role == 'subadmin') {

      Log.find({
        username: request.user.details.username,
        subAction: {
          $in: ['BALANCE_WITHDRAWL', 'BALANCE_DEPOSIT']
        },
        deleted: false,
        "time": {
          "$gte": new Date(request.from + "T00:59:00.000Z"),
          "$lte": new Date(request.to + "T23:59:00.000Z")
        }
      }).exec(function (err, dbLogs) {
        if (err) logger.error(err);
        // console.log(dbLogs)
        socket.emit('get-logs-success', dbLogs);
      });
    }
  });
};

module.exports.getManagerCommision = function (io, socket, request) {
  if (!request) return;
  //console.log(request.from);
  if (!request.user) return;
  if (!request.user.details) return;
  //("getManagerCommision: " + JSON.stringify(request));

  Login.findOne({
    hash: request.user.key,
    username: request.user.details.username,
    role: request.user.details.role,
    deleted: false,
    status: 'active'
  }, function (err, dbUser) {
    if (err) logger.error(err);
    if (!dbUser) {
      logger.error("Invalid Access: " + JSON.stringify(request));
      return;
    }

    if (request.user.details.role == 'manager' || request.user.details.role == 'partner') {
      Log.find({
        manager: request.user.details.username,
        commision: 'MATCH_COMM',
        deleted: false,
        "time": {
          $gte: (new Date((new Date()).getTime() - (request.days * 24 * 60 * 60 * 1000)))
        }
      }).exec(function (err, dbLogs) {
        if (err) logger.error(err);

        if (dbLogs) {


          socket.emit('get-commision-success', dbLogs);
        } else {
          socket.emit('get-commision-success', 0);
        }

      });
    }

  });
};

module.exports.summaryPagination = function (io, socket, request) {
  if (!request) return;
  if (!request.user || !request.filter || !request.sort) return;
  if (!request.user.details) return;
  //("summaryPagination: " + JSON.stringify(request));

  Login.findOne({
    hash: request.user.key,
    username: request.user.details.username,
    role: request.user.details.role,
    deleted: false,
    status: 'active'
  }, function (err, dbUser) {
    if (err) logger.error(err);
    if (!dbUser) {
      logger.error("Invalid Access: " + JSON.stringify(request));
      return;
    }

    Log.find(request.filter, {}).sort(request.sort).limit(request.limit).skip(request.skip).exec(function (err, dbLogs) {
      socket.emit('get-summarypagination-success', {
        dbLogs: dbLogs
      });

    });
  });

}

module.exports.getSummary = function (io, socket, request) {
  if (!request) return;
  if (!request.user || !request.filter || !request.sort) return;
  if (!request.user.details) return;
  //("getSummary: " + JSON.stringify(request));

  Login.findOne({
    hash: request.user.key,
    username: request.user.details.username,
    role: request.user.details.role,
    deleted: false,
    status: 'active'
  }, function (err, dbUser) {
    if (err) logger.error(err);
    if (!dbUser) {
      logger.error("Invalid Access: " + JSON.stringify(request));
      return;
    }

    if (request.user.details.role == 'admin') {

      if (request.dayStatus == 0) {
        Log.find(request.filter).sort(request.sort).limit(request.limit).skip(request.skip).exec(function (err, dbLogs) {
          Logsettlement.find({
            createdAt: request.filter.createdAt
          }, {
            amount: 1
          }).sort(request.sort).exec(function (err, dbLogsettlemntComms) {
            Log.find({
              $or: [{
                action: 'COMMISION'
              }, {
                subAction: 'MATCH_FEE'
              }],
              createdAt: request.filter.createdAt
            }, {
              amount: 1,
              subAction: 1
            }).sort(request.sort).exec(function (err, dbLogComms) {

              var totalProfit = 0;
              var totalCommision = 0;
              var totalsCommision = 0;
              Log.find(request.filter, {
                subAction: 1,
                amount: 1
              }).sort(request.sort).exec(function (err, dbLogAlls) {
                if (dbLogAlls.length > 0) {
                  for (var i = 0; i < dbLogAlls.length; i++) {

                    if (dbLogAlls[i].subAction == 'AMOUNT_WON') {
                      totalProfit += dbLogAlls[i].amount;
                    } else if (dbLogAlls[i].subAction == 'AMOUNT_LOST') {
                      if (dbLogAlls[i].amount) {
                        totalProfit -= dbLogAlls[i].amount;
                      } else {
                        totalProfit += dbLogAlls[i].amount;
                      }

                    } else {

                    }
                  }
                }
                if (request.filter.eventTypeId != 'c9' && request.filter.eventTypeId != '4321' && request.filter.eventTypeId != '3') {

                  if (dbLogsettlemntComms.length > 0) {
                    for (var i = 0; i < dbLogsettlemntComms.length; i++) {

                      if (dbLogsettlemntComms[i].amount) {
                        totalsCommision -= dbLogsettlemntComms[i].amount;
                      }


                    }
                  }

                  if (dbLogComms.length > 0) {
                    for (var i = 0; i < dbLogComms.length; i++) {

                      if (dbLogComms[i].amount) {
                        if (dbLogComms[i].subAction == 'MATCH_FEE') {
                          totalCommision += -1 * dbLogComms[i].amount;
                        } else {
                          totalCommision -= dbLogComms[i].amount;
                        }

                      }


                    }
                  }

                }

                if (err) logger.error(err);
                socket.emit('get-summarylogs-success', {
                  totalCount: dbLogAlls.length,
                  dbLogs: dbLogs,
                  totalProfit: totalProfit,
                  totalCommision: Math.round(totalCommision) + Math.round(totalsCommision)
                });
              });
            });

          });
        });
      } else {
        Log.find(request.filter, {}).sort(request.sort).limit(request.limit).skip(request.skip).exec(function (err, dbLogs) {
          Logsettlement.find({
            createdAt: {
              $gte: request.from,
              $lte: request.to
            }


          }, {
            amount: 1
          }).sort(request.sort).exec(function (err, dbLogsettlemntComms) {
            Log.find({
              $or: [{
                action: 'COMMISION'
              }, {
                subAction: 'MATCH_FEE'
              }],

              createdAt: {
                $gte: request.from,
                $lte: request.to
              }


            }, {
              amount: 1,
              subAction: 1
            }).sort(request.sort).exec(function (err, dbLogComms) {

              var totalProfit = 0;
              var totalCommision = 0;
              var totalsCommision = 0;
              Log.find(request.filter, {
                subAction: 1,
                amount: 1
              }).sort(request.sort).exec(function (err, dbLogAlls) {
                if (dbLogAlls) {
                  if (dbLogAlls.length > 0) {
                    for (var i = 0; i < dbLogAlls.length; i++) {

                      if (dbLogAlls[i].subAction == 'AMOUNT_WON') {
                        totalProfit += dbLogAlls[i].amount;
                      } else if (dbLogAlls[i].subAction == 'AMOUNT_LOST') {
                        if (dbLogAlls[i].amount) {
                          totalProfit -= dbLogAlls[i].amount;
                        } else {
                          totalProfit += dbLogAlls[i].amount;
                        }

                      } else {

                      }
                    }
                  }
                }

                if (request.filter.eventTypeId != 'c9' && request.filter.eventTypeId != '4321' && request.filter.eventTypeId != '3') {

                  if (dbLogsettlemntComms.length > 0) {
                    for (var i = 0; i < dbLogsettlemntComms.length; i++) {

                      if (dbLogsettlemntComms[i].amount) {
                        totalsCommision -= dbLogsettlemntComms[i].amount;
                      }


                    }
                  }

                  if (dbLogComms.length > 0) {
                    for (var i = 0; i < dbLogComms.length; i++) {

                      if (dbLogComms[i].amount) {
                        if (dbLogComms[i].subAction == 'MATCH_FEE') {
                          totalCommision += -1 * dbLogComms[i].amount;
                        } else {
                          totalCommision -= dbLogComms[i].amount;
                        }

                      }


                    }
                  }

                }

                if (err) logger.error(err);
                socket.emit('get-summarylogs-success', {
                  totalCount: dbLogAlls.length,
                  dbLogs: dbLogs,
                  totalProfit: totalProfit,
                  totalCommision: Math.round(totalCommision) + Math.round(totalsCommision)
                });
              });
            });

          });
        });
      }


    }

    if (request.user.details.role == 'manager') {

      if (request.dayStatus == 0) {
        Log.find(request.filter).sort(request.sort).limit(request.limit).skip(request.skip).exec(function (err, dbLogs) {
          if (request.filter.eventTypeId) {
            var eventTypeId = [request.filter.eventTypeId];
          } else {
            var eventTypeId = ['4', '2', '1'];
          }
          Logsettlement.find({
            createdAt: request.filter.createdAt,
            manager: request.user.details.username,
            eventTypeId: {
              $in: eventTypeId
            },
          }, {
            amount: 1
          }).sort(request.sort).exec(function (err, dbLogsettlemntComms) {


            Log.find({
              $or: [{
                action: 'COMMISION'
              }, {
                subAction: 'MATCH_FEE'
              }],
              eventTypeId: {
                $in: eventTypeId
              },
              createdAt: request.filter.createdAt,
              manager: request.user.details.username
            }, {
              amount: 1,
              subAction: 1
            }).sort(request.sort).exec(function (err, dbLogComms) {

              var totalProfit = 0;
              var totalCommision = 0;
              var totalsCommision = 0;
              Log.find(request.filter, {
                subAction: 1,
                amount: 1
              }).sort(request.sort).exec(function (err, dbLogAlls) {
                if (dbLogAlls.length > 0) {
                  for (var i = 0; i < dbLogAlls.length; i++) {

                    if (dbLogAlls[i].subAction == 'AMOUNT_WON') {
                      totalProfit += dbLogAlls[i].amount;
                    } else if (dbLogAlls[i].subAction == 'AMOUNT_LOST') {
                      totalProfit -= dbLogAlls[i].amount;
                      if (dbLogAlls[i].amount) {
                        if (dbLogAlls[i].amount > 0) {
                          //totalProfit -= dbLogAlls[i].amount;
                        } else {
                          //totalProfit += dbLogAlls[i].amount;
                        }

                      }

                    } else {

                    }
                  }
                }
                if (request.filter.eventTypeId != 'c9' && request.filter.eventTypeId != '4321' && request.filter.eventTypeId != '3') {

                  if (dbLogsettlemntComms.length > 0) {
                    for (var i = 0; i < dbLogsettlemntComms.length; i++) {

                      if (dbLogsettlemntComms[i].amount) {
                        totalsCommision -= dbLogsettlemntComms[i].amount;
                      }


                    }
                  }

                  if (dbLogComms.length > 0) {
                    for (var i = 0; i < dbLogComms.length; i++) {

                      if (dbLogComms[i].amount) {
                        if (dbLogComms[i].subAction == 'MATCH_FEE') {
                          totalCommision += 1 * dbLogComms[i].amount;
                        } else {
                          totalCommision -= dbLogComms[i].amount;
                        }

                      }


                    }
                  }

                }

                var totalDeposit = 0;
                var totalWithdraw = 0;
                Log.find({
                  createdAt: request.filter.createdAt,
                  username: request.user.details.username,
                  subAction: {
                    $in: ['BALANCE_WITHDRAWL', 'BALANCE_DEPOSIT']
                  }
                }, {
                  subAction: 1,
                  amount: 1
                }).exec(function (err, totalDepositw) {

                  if (totalDepositw.length > 0) {
                    for (var k = 0; k < totalDepositw.length; k++) {
                      if (totalDepositw[k].subAction == 'BALANCE_WITHDRAWL') {
                        totalWithdraw += totalDepositw[k].amount;
                      } else {
                        totalDeposit += totalDepositw[k].amount;
                      }
                    }
                  }
                  if (err) logger.error(err);
                  socket.emit('get-summarylogs-success', {
                    totalCount: dbLogAlls.length,
                    dbLogs: dbLogs,
                    totalProfit: totalProfit,
                    totalWithdraw: totalWithdraw,
                    totalDeposit: totalDeposit,
                    totalCommision: Math.round(totalCommision) + Math.round(totalsCommision)
                  });
                });
              });
            });

          });
        });
      } else {
        Log.find(request.filter, {}).sort(request.sort).limit(request.limit).skip(request.skip).exec(function (err, dbLogs) {
          if (request.filter.eventTypeId) {
            var eventTypeId = [request.filter.eventTypeId];
          } else {
            var eventTypeId = ['4', '2', '1'];
          }


          Logsettlement.find({
            relation: request.user.details.username,
            eventTypeId: {
              $in: eventTypeId
            },
            createdAt: {
              $gte: request.from,
              $lte: request.to
            }


          }, {
            amount: 1
          }).sort(request.sort).exec(function (err, dbLogsettlemntComms) {
            //  console.log('request.filter.eventTypeId'+request.filter.eventTypeId)

            Log.find({
              subAction: 'MATCH_FEE',
              eventTypeId: {
                $in: eventTypeId
              },
              manager: request.user.details.username,
              createdAt: {
                $gte: request.from,
                $lte: request.to
              }


            }, {
              amount: 1,
              subAction: 1
            }).sort(request.sort).exec(function (err, dbMatchfees) {
              // console.log(eventTypeId)
              Log.find({
                action: 'COMMISION',
                eventTypeId: {
                  $in: eventTypeId
                },
                manager: request.user.details.username,
                createdAt: {
                  $gte: request.from,
                  $lte: request.to
                }


              }, {
                amount: 1,
                subAction: 1
              }).sort(request.sort).exec(function (err, dbLogComms) {

                var totalProfit = 0;
                var totalCommision = 0;
                var totalsCommision = 0;
                Log.find(request.filter, {
                  subAction: 1,
                  amount: 1
                }).sort(request.sort).exec(function (err, dbLogAlls) {
                  if (dbLogAlls.length > 0) {
                    for (var i = 0; i < dbLogAlls.length; i++) {

                      if (dbLogAlls[i].subAction == 'AMOUNT_WON') {
                        totalProfit += dbLogAlls[i].amount;
                      } else if (dbLogAlls[i].subAction == 'AMOUNT_LOST') {
                        totalProfit -= dbLogAlls[i].amount;
                        if (dbLogAlls[i].amount) {
                          if (dbLogAlls[i].amount > 0) {
                            //totalProfit -= dbLogAlls[i].amount;
                          } else {
                            // totalProfit += dbLogAlls[i].amount;
                          }
                        }

                      } else {

                      }
                    }
                  }
                  if (request.filter.eventTypeId != 'c9' && request.filter.eventTypeId != '4321' && request.filter.eventTypeId != '3') {

                    if (dbLogsettlemntComms.length > 0) {
                      for (var i = 0; i < dbLogsettlemntComms.length; i++) {

                        if (dbLogsettlemntComms[i].amount) {
                          totalsCommision -= dbLogsettlemntComms[i].amount;
                        }


                      }
                    }

                    if (dbLogComms.length > 0) {
                      for (var i = 0; i < dbLogComms.length; i++) {

                        if (dbLogComms[i].amount) {
                          if (dbLogComms[i].amount > 0) {
                            totalCommision += dbLogComms[i].amount;
                          }
                          else {
                            totalCommision -= dbLogComms[i].amount;
                          }



                        }


                      }
                    }
                    var totalFee = 0;
                    if (dbMatchfees.length > 0) {
                      for (var i = 0; i < dbMatchfees.length; i++) {

                        if (dbMatchfees[i].amount) {
                          if (dbMatchfees[i].subAction == 'MATCH_FEE') {
                            totalFee += 1 * dbMatchfees[i].amount;
                          } else {
                            totalFee -= dbMatchfees[i].amount;
                          }

                        }


                      }
                    }




                  }
                  var totalDeposit = 0;
                  var totalWithdraw = 0;
                  Log.find({
                    createdAt: {
                      $gte: request.from,
                      $lte: request.to
                    },
                    username: request.user.details.username,
                    subAction: {
                      $in: ['BALANCE_WITHDRAWL', 'BALANCE_DEPOSIT']
                    }
                  }, {
                    subAction: 1,
                    amount: 1
                  }).exec(function (err, totalDepositw) {

                    if (totalDepositw.length > 0) {
                      for (var k = 0; k < totalDepositw.length; k++) {
                        if (totalDepositw[k].subAction == 'BALANCE_WITHDRAWL') {
                          totalWithdraw += totalDepositw[k].amount;
                        } else {
                          totalDeposit += totalDepositw[k].amount;
                        }
                      }
                    }

                    if (err) logger.error(err);
                    //console.log('totalCommision' + totalCommision)
                    //console.log('totalsCommision' + totalsCommision);
                    //console.log('totalFee' + totalFee);
                    socket.emit('get-summarylogs-success', {
                      totalCount: dbLogAlls.length,
                      dbLogs: dbLogs,
                      totalProfit: totalProfit,
                      totalDeposit: totalDeposit,
                      totalWithdraw: totalWithdraw,
                      totalCommision: Math.round(-1 * totalCommision) + Math.round(totalsCommision) + Math.round(totalFee)
                    });
                    console.log('totalProfit' + totalProfit)
                  });
                });
              });
            });

          });
        });
      }


    }

    if (request.user.details.role == 'partner') {

      if (request.dayStatus == 0) {
        Log.find(request.filter).sort(request.sort).limit(request.limit).skip(request.skip).exec(function (err, dbLogs) {
          if (request.filter.eventTypeId) {
            var eventTypeId = [request.filter.eventTypeId];
          } else {
            var eventTypeId = ['4', '2', '1'];
          }
          Logsettlement.find({
            createdAt: request.filter.createdAt,
            manager: request.user.details.manager,
            eventTypeId: {
              $in: eventTypeId
            },
          }, {
            amount: 1
          }).sort(request.sort).exec(function (err, dbLogsettlemntComms) {


            Log.find({
              $or: [{
                action: 'COMMISION'
              }, {
                subAction: 'MATCH_FEE'
              }],
              eventTypeId: {
                $in: eventTypeId
              },
              createdAt: request.filter.createdAt,
              manager: request.user.details.manager
            }, {
              amount: 1,
              subAction: 1
            }).sort(request.sort).exec(function (err, dbLogComms) {

              var totalProfit = 0;
              var totalCommision = 0;
              var totalsCommision = 0;
              Log.find(request.filter, {
                subAction: 1,
                amount: 1
              }).sort(request.sort).exec(function (err, dbLogAlls) {
                if (dbLogAlls.length > 0) {
                  for (var i = 0; i < dbLogAlls.length; i++) {

                    if (dbLogAlls[i].subAction == 'AMOUNT_WON') {
                      totalProfit += dbLogAlls[i].amount;
                    } else if (dbLogAlls[i].subAction == 'AMOUNT_LOST') {
                      totalProfit -= dbLogAlls[i].amount;
                      if (dbLogAlls[i].amount) {
                        if (dbLogAlls[i].amount > 0) {
                          //totalProfit -= dbLogAlls[i].amount;
                        } else {
                          //totalProfit += dbLogAlls[i].amount;
                        }

                      }

                    } else {

                    }
                  }
                }
                if (request.filter.eventTypeId != 'c9' && request.filter.eventTypeId != '4321' && request.filter.eventTypeId != '3') {

                  if (dbLogsettlemntComms.length > 0) {
                    for (var i = 0; i < dbLogsettlemntComms.length; i++) {

                      if (dbLogsettlemntComms[i].amount) {
                        totalsCommision -= dbLogsettlemntComms[i].amount;
                      }


                    }
                  }

                  if (dbLogComms.length > 0) {
                    for (var i = 0; i < dbLogComms.length; i++) {

                      if (dbLogComms[i].amount) {
                        if (dbLogComms[i].subAction == 'MATCH_FEE') {
                          totalCommision += 1 * dbLogComms[i].amount;
                        } else {
                          totalCommision -= dbLogComms[i].amount;
                        }

                      }


                    }
                  }

                }

                var totalDeposit = 0;
                var totalWithdraw = 0;
                Log.find({
                  createdAt: request.filter.createdAt,
                  username: request.user.details.manager,
                  subAction: {
                    $in: ['BALANCE_WITHDRAWL', 'BALANCE_DEPOSIT']
                  }
                }, {
                  subAction: 1,
                  amount: 1
                }).exec(function (err, totalDepositw) {

                  if (totalDepositw.length > 0) {
                    for (var k = 0; k < totalDepositw.length; k++) {
                      if (totalDepositw[k].subAction == 'BALANCE_WITHDRAWL') {
                        totalWithdraw += totalDepositw[k].amount;
                      } else {
                        totalDeposit += totalDepositw[k].amount;
                      }
                    }
                  }
                  if (err) logger.error(err);
                  socket.emit('get-summarylogs-success', {
                    totalCount: dbLogAlls.length,
                    dbLogs: dbLogs,
                    totalProfit: totalProfit,
                    totalWithdraw: totalWithdraw,
                    totalDeposit: totalDeposit,
                    totalCommision: Math.round(totalCommision) + Math.round(totalsCommision)
                  });
                });
              });
            });

          });
        });
      } else {
        Log.find(request.filter, {}).sort(request.sort).limit(request.limit).skip(request.skip).exec(function (err, dbLogs) {
          if (request.filter.eventTypeId) {
            var eventTypeId = [request.filter.eventTypeId];
          } else {
            var eventTypeId = ['4', '2', '1'];
          }


          Logsettlement.find({
            relation: request.user.details.manager,
            eventTypeId: {
              $in: eventTypeId
            },
            createdAt: {
              $gte: request.from,
              $lte: request.to
            }


          }, {
            amount: 1
          }).sort(request.sort).exec(function (err, dbLogsettlemntComms) {
            //  console.log('request.filter.eventTypeId'+request.filter.eventTypeId)

            Log.find({
              subAction: 'MATCH_FEE',
              eventTypeId: {
                $in: eventTypeId
              },
              manager: request.user.details.manager,
              createdAt: {
                $gte: request.from,
                $lte: request.to
              }


            }, {
              amount: 1,
              subAction: 1
            }).sort(request.sort).exec(function (err, dbMatchfees) {
              // console.log(eventTypeId)
              Log.find({
                action: 'COMMISION',
                eventTypeId: {
                  $in: eventTypeId
                },
                manager: request.user.details.manager,
                createdAt: {
                  $gte: request.from,
                  $lte: request.to
                }


              }, {
                amount: 1,
                subAction: 1
              }).sort(request.sort).exec(function (err, dbLogComms) {

                var totalProfit = 0;
                var totalCommision = 0;
                var totalsCommision = 0;
                Log.find(request.filter, {
                  subAction: 1,
                  amount: 1
                }).sort(request.sort).exec(function (err, dbLogAlls) {
                  if (dbLogAlls.length > 0) {
                    for (var i = 0; i < dbLogAlls.length; i++) {

                      if (dbLogAlls[i].subAction == 'AMOUNT_WON') {
                        totalProfit += dbLogAlls[i].amount;
                      } else if (dbLogAlls[i].subAction == 'AMOUNT_LOST') {
                        totalProfit -= dbLogAlls[i].amount;
                        if (dbLogAlls[i].amount) {
                          if (dbLogAlls[i].amount > 0) {
                            //totalProfit -= dbLogAlls[i].amount;
                          } else {
                            // totalProfit += dbLogAlls[i].amount;
                          }
                        }

                      } else {

                      }
                    }
                  }
                  if (request.filter.eventTypeId != 'c9' && request.filter.eventTypeId != '4321' && request.filter.eventTypeId != '3') {

                    if (dbLogsettlemntComms.length > 0) {
                      for (var i = 0; i < dbLogsettlemntComms.length; i++) {

                        if (dbLogsettlemntComms[i].amount) {
                          totalsCommision -= dbLogsettlemntComms[i].amount;
                        }


                      }
                    }

                    if (dbLogComms.length > 0) {
                      for (var i = 0; i < dbLogComms.length; i++) {

                        if (dbLogComms[i].amount) {
                          if (dbLogComms[i].amount > 0) {
                            totalCommision += dbLogComms[i].amount;
                          }
                          else {
                            totalCommision -= dbLogComms[i].amount;
                          }



                        }


                      }
                    }
                    var totalFee = 0;
                    if (dbMatchfees.length > 0) {
                      for (var i = 0; i < dbMatchfees.length; i++) {

                        if (dbMatchfees[i].amount) {
                          if (dbMatchfees[i].subAction == 'MATCH_FEE') {
                            totalFee += 1 * dbMatchfees[i].amount;
                          } else {
                            totalFee -= dbMatchfees[i].amount;
                          }

                        }


                      }
                    }




                  }
                  var totalDeposit = 0;
                  var totalWithdraw = 0;
                  Log.find({
                    createdAt: {
                      $gte: request.from,
                      $lte: request.to
                    },
                    username: request.user.details.username,
                    subAction: {
                      $in: ['BALANCE_WITHDRAWL', 'BALANCE_DEPOSIT']
                    }
                  }, {
                    subAction: 1,
                    amount: 1
                  }).exec(function (err, totalDepositw) {

                    if (totalDepositw.length > 0) {
                      for (var k = 0; k < totalDepositw.length; k++) {
                        if (totalDepositw[k].subAction == 'BALANCE_WITHDRAWL') {
                          totalWithdraw += totalDepositw[k].amount;
                        } else {
                          totalDeposit += totalDepositw[k].amount;
                        }
                      }
                    }

                    if (err) logger.error(err);
                    //console.log('totalCommision' + totalCommision)
                    //console.log('totalsCommision' + totalsCommision);
                    //console.log('totalFee' + totalFee);
                    socket.emit('get-summarylogs-success', {
                      totalCount: dbLogAlls.length,
                      dbLogs: dbLogs,
                      totalProfit: totalProfit,
                      totalDeposit: totalDeposit,
                      totalWithdraw: totalWithdraw,
                      totalCommision: Math.round(-1 * totalCommision) + Math.round(totalsCommision) + Math.round(totalFee)
                    });
                    console.log('totalProfit' + totalProfit)
                  });
                });
              });
            });

          });
        });
      }


    }



    if (request.user.details.role == 'subadmin') {
      // console.log(request.filter.time)
      //console.log('time:request.filter.time' + request.filter.time)
      Log.find(request.filter).sort(request.sort).exec(function (err, dbLogs) {
        Logsettlement.find({
          subadmin: request.user.details.username,
          time: request.filter.time
        }).sort(request.sort).exec(function (err, dbLogsettlemntComms) {
          Log.find({
            'subadmin': request.user.details.username,
            $or: [{
              action: 'COMMISION'
            }, {
              subAction: 'MATCH_FEE'
            }],
            time: request.filter.time
          }).sort(request.sort).exec(function (err, dbLogComms) {

            var totalProfit = 0;
            var totalCommision = 0;
            var totalsCommision = 0;
            Log.find(request.filter, {
              subAction: 1,
              amount: 1
            }).sort(request.sort).exec(function (err, dbLogAlls) {
              if (dbLogAlls.length > 0) {
                for (var i = 0; i < dbLogAlls.length; i++) {

                  if (dbLogAlls[i].subAction == 'AMOUNT_WON') {
                    totalProfit += dbLogAlls[i].amount;
                  } else if (dbLogAlls[i].subAction == 'AMOUNT_LOST') {
                    if (dbLogAlls[i].amount) {
                      totalProfit -= dbLogAlls[i].amount;
                    } else {
                      totalProfit += dbLogAlls[i].amount;
                    }

                  } else {

                  }
                }
              }
              if (request.filter.eventTypeId != 'c9' && request.filter.eventTypeId != '4321' && request.filter.eventTypeId != '3') {

                if (dbLogsettlemntComms.length > 0) {
                  for (var i = 0; i < dbLogsettlemntComms.length; i++) {

                    if (dbLogsettlemntComms[i].amount) {
                      totalsCommision -= dbLogsettlemntComms[i].amount;
                    }


                  }
                }

                if (dbLogComms.length > 0) {
                  for (var i = 0; i < dbLogComms.length; i++) {

                    if (dbLogComms[i].amount) {
                      if (dbLogComms[i].subAction == 'MATCH_FEE') {
                        totalCommision += -1 * dbLogComms[i].amount;
                      } else {
                        totalCommision -= dbLogComms[i].amount;
                      }

                    }


                  }
                }

              }

              if (err) logger.error(err);
              socket.emit('get-summarylogs-success', {
                dbLogs: dbLogs,
                totalProfit: totalProfit,
                totalCommision: Math.round(totalCommision) + Math.round(totalsCommision)
              });
            });
          });
        });
      });
    }



    if (request.user.details.role == 'master') {
      // console.log(request.filter.time)
      // console.log('time:request.filter.time' + request.filter.time)
      Log.find(request.filter).sort(request.sort).exec(function (err, dbLogs) {
        Logsettlement.find({
          subadmin: request.user.details.username,
          createdAt: request.filter.createdAt
        }).sort(request.sort).exec(function (err, dbLogsettlemntComms) {
          Log.find({
            'master': request.user.details.username,
            $or: [{
              action: 'COMMISION'
            }, {
              subAction: 'MATCH_FEE'
            }],
            createdAt: request.filter.createdAt
          }).sort(request.sort).exec(function (err, dbLogComms) {

            var totalProfit = 0;
            var totalCommision = 0;
            var totalsCommision = 0;
            Log.find(request.filter, {
              subAction: 1,
              amount: 1
            }).sort(request.sort).exec(function (err, dbLogAlls) {
              if (dbLogAlls.length > 0) {
                for (var i = 0; i < dbLogAlls.length; i++) {

                  if (dbLogAlls[i].subAction == 'AMOUNT_WON') {
                    totalProfit += dbLogAlls[i].amount;
                  } else if (dbLogAlls[i].subAction == 'AMOUNT_LOST') {
                    if (dbLogAlls[i].amount) {
                      totalProfit -= dbLogAlls[i].amount;
                    } else {
                      totalProfit += dbLogAlls[i].amount;
                    }

                  } else {

                  }
                }
              }
              if (request.filter.eventTypeId != 'c9' && request.filter.eventTypeId != '4321' && request.filter.eventTypeId != '3') {

                if (dbLogsettlemntComms.length > 0) {
                  for (var i = 0; i < dbLogsettlemntComms.length; i++) {

                    if (dbLogsettlemntComms[i].amount) {
                      totalsCommision -= dbLogsettlemntComms[i].amount;
                    }


                  }
                }

                if (dbLogComms.length > 0) {
                  for (var i = 0; i < dbLogComms.length; i++) {

                    if (dbLogComms[i].amount) {
                      if (dbLogComms[i].subAction == 'MATCH_FEE') {
                        totalCommision += -1 * dbLogComms[i].amount;
                      } else {
                        totalCommision -= dbLogComms[i].amount;
                      }

                    }


                  }
                }

              }

              if (err) logger.error(err);
              socket.emit('get-summarylogs-success', {
                dbLogs: dbLogs,
                totalProfit: totalProfit,
                totalCommision: Math.round(totalCommision) + Math.round(totalsCommision)
              });
            });
          });
        });
      });
    }



  });
};