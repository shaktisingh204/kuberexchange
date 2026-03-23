var request = require('request');
var mongoose = require('mongoose');
var db = require('../madara/models/db');
var logger = require('log4js').getLogger();
var Login = mongoose.model('Login');
var User = mongoose.model('User');

var Event = mongoose.model('Event');
var Market = mongoose.model('Market');
var Bet = mongoose.model('Bet');
var Log = mongoose.model('Log');


startTransaction();
async function startTransaction()
{
const session = await mongoose.startSession();
  //session.startTransaction();
  console.log('step1')
try
{
  
const transactionOptions = {
    readPreference: 'primary',
    readConcern: { level: 'local' },
    writeConcern: { w: 'majority' }
  };
  await session.withTransaction(async () => {
const A = await User.findOneAndUpdate({ username: 'TEST' }, { $inc: { balance: Nan ,limit:1} }, session);
 // console.log(A)
                                var log =new Log(session);
                                 log.descriptionArr= [];
                                 log.activeStatus= false;
                                 log.username= "TEST";
                                 log.action= "BALANCE";
                                 log.subAction= "BALANCE_DEPOSIT";
                                 log.oldLimit= A.limit;
                                 log.newLimit= A.limit+1;
                                 log.amount= '1';
                                 log.description= "";
                                 log.remark= "Balance Deposit by AGENT";
                                 log.manager= "AGENT";
                                 log.relation= "AGENT";
                                 log.datetime= "2022-12-06";
                                 log.time=new Date();
    
                                 log.deleted= false;

                                 console.log(log)
                                 
                                 log.save(async function (err) {
                                      
                                    if (err) {
                                         console.log(err)
                                   await session.commitTransaction();
                                       //logger.error('close-market: Log entry failed for ' + user.username);
                                    }

                                 });

      if(A.balance<0)
      {
    console.log('Insufficient funds: ' + (A.balance));
      }
       }, transactionOptions);
}
catch(e)
{
   console.log(e)
await session.abortTransaction();
    session.endSession();
}
finally 
{
 
  await session.endSession(); 
  console.log('endSession')
}
}
 


  User.findOne({
      'username':'TEST'
      },async  function (err, dbUser) {
    
     
      
        });


function updateBalance(user, done) {
   try {
      var balance = 0;
      var request = {};
      request.user = {};
      request.user.details = user;
      if (request.user.details.username != user.username) return;
      
      Login.findOne({
         username: request.user.details.username,

         deleted: false
      }, function (err, result) {
         if (err || !result || result.username != request.user.details.username) {
            done(-1);
            return;
         } else {
            
            User.findOne({
               username: request.user.details.username,
               deleted: false
            }, function (err, user) {
               if (err || !user) {
                  done(-1);
                  return;
               }
               Bet.distinct('marketId', {
                  username: user.username,
                  deleted: false,
                  result: 'ACTIVE'
               }, function (err, marketIds) {
                      
                  //  console.log(marketIds)
                  if (err) logger.error(err);
                  if (!marketIds || marketIds.length < 1) {
                     User.update({
                        username: user.username
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
                                       if (k == bets[i].runnerId && bets[i].status == 'MATCHED') runnerProfit[k] += ((-1 * op) * parseFloat(((bets[i].rate - 1) * bets[i].stake)));
                                       else runnerProfit[k] += (op * parseFloat(bets[i].stake));
                                    }
                                 }
                                 for (var key in runnerProfit) {
                                    if (runnerProfit[key] < 0 && runnerProfit[key] < maxLoss) maxLoss = runnerProfit[key];
                                 }
                                 // logger.info(user.username + " market: " + market.marketName + " exposure: " + maxLoss);
                                 callback(maxLoss, mindex);
                                 return;
                              });
                           })(market, index, function (e, i) {
                              counter++;
                                //console.log('len'+len);
                                // console.log('counter'+counter)
                              if (counter == len) {
                                 exposure += e * 1;
                                 logger.info("Total exposure: " + exposure);
                                 if (exposure <= 0) user.balance = user.limit + exposure;
                                // console.log(user.username + " New Balancek: " + user.balance);
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
                              } else {
                                 exposure += e * 1;
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
                                          if (result >= parseInt(bets[i].selectionName)) resultMaxLoss += parseFloat(bets[i].rate * bets[i].stake);
                                          else resultMaxLoss -= bets[i].stake;
                                       } else {
                                          if (result < parseInt(bets[i].selectionName)) resultMaxLoss += bets[i].stake;
                                          else resultMaxLoss -= parseFloat(bets[i].rate * bets[i].stake);
                                       }
                                    }
                                    if (resultMaxLoss < 0 && resultMaxLoss < maxLoss) maxLoss = resultMaxLoss;
                                 }
                                 logger.info("max loss " + maxLoss);
                                 callback(maxLoss, mindex);
                                 return;
                              });
                           })(market, index, function (e, i) {
                              counter++;
                           //   console.log("market: " + market.marketName);

                                
                              if (counter == len) {
                                 exposure += e * 1;
                                 logger.info("Total exposure: " + exposure);
                                 if (exposure <= 0)
                                    user.balance = user.limit + exposure;
                                 //console.log("New Balancef: " + user.balance);

                                  
                                 User.update({
                                    _id: user._id
                                 }, {
                                    $set: {
                                       balance: user.balance,
                                       exposure: exposure
                                    }
                                 }, function (err, raw) {
                                    if (err) logger.error(err);
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
   } catch (err) {
      if (err) logger.error(err);
   }
}
