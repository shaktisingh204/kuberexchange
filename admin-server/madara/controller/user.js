// required modules
var mongoose = require('mongoose');
var logger = require('log4js').getLogger();
const { ObjectId } = require('mongodb');
var requestUrl = require("request");
var jwt = require('jsonwebtoken');
const myEnv = require('dotenv').config();

/////// ----- Used Comman Helpers ---- //////
const Helper = require('../controller/helper');


// required models
var Login = mongoose.model('Login');
var Finance = mongoose.model('Finance');
var User = mongoose.model('User');
var Session = mongoose.model('Session');
var WebToken = mongoose.model('WebToken');
var Log = mongoose.model('Log');
var Bet = mongoose.model('Bet');
var Information = mongoose.model('Information');
var Setting = mongoose.model('Setting');
const Payment = require('../models/paymentModel');
const Notification = require('../models/notificationModel');
var Tv = require('../models/tv');
var Bonus = mongoose.model('Bonus');
var Banner = mongoose.model('Banner');
var Chat = mongoose.model('Chat');
var CrickData = mongoose.model('CrickData');
var Market = mongoose.model('Market');
var Lock = mongoose.model('Lock');
var Log = mongoose.model('Log');


let jwt_key = "k0uwKPKgQDCtOOydeJXpPw";
let jwt_secret = 'WcU3Nvvtr7GagmTrazL3vg8ClyFEMp317BJq';

const moment = require('moment-timezone');

var currentdate = moment().tz("Asia/Calcutta").format('YYYY-MM-DD');
var current = moment().tz("Asia/Calcutta").format('YYYY-MM-DDTHH:mm:ss');
console.log("User File", currentdate, current);

//////////////// --------------- Score Api----------------//////////
// var request = require('request');
// request('http://172.105.54.97:8085/exchange/casino/Cards3J', function (error, response, body) {

//    if (body != "" && body != undefined && body != null) {
//       console.log("32556158",response.body);  
//    }
// })

//  
// Payment.find({ status: "Pending", type: "Withdrawal" },
//    {
//       _id: 1, username: 1
//    }).then(async dbPayment => {
//       // console.log(dbPayment.length)
//       if (dbPayment.length > 0) {
//          for (var k = 0; k < dbPayment.length; k++) {
//             // console.log(dbPayment[k].username);
//             await Log.find({subAction:"BONUS_DEPOSIT",username:dbPayment[k].username} ,
//                {
//                   _id: 1, username: 1
//                }).then(async dbLog => {
//                   // console.log("logs",dbPayment[k].username,dbLog.length)
//                   if (dbLog.length == 0) {

//                      console.log(dbPayment[k].username)


//                   }
//                })

//          }
//       }
//    })

// User.find({ admin:"ZOLOWIN" },
// {
//    _id: 1, username: 1
// }).then(async dbPayment => {
//    console.log(dbPayment.length)
//    if (dbPayment.length > 0) {
//       for (var k = 0; k < dbPayment.length; k++) {
//          // console.log(dbPayment[k].username);
//          await Log.find({subAction:"BONUS_DEPOSIT",username:dbPayment[k].username,amount:50,deleted:false} ,
//             {
//                _id: 1, username: 1
//             }).then(async dbLog => {
//                // console.log("logs",dbPayment[k].username,dbLog.length)
//                if (dbLog.length > 1) {

//                   console.log(dbLog[0]._id,dbPayment[k].username);
//                   var user = await User.findOne({ username: dbPayment[k].username }, { bounsBalance: 1 });
//                   console.log(user.bounsBalance)

//                   // withdrawBonus(dbPayment[k]._id,50);
//                   Log.updateOne({
//                      '_id': dbLog[0]._id
//                  }, { deleted: true,  }, async function (error, updateUser) {
//                      // res.send({ doc, success: true, message: "Withdrawal registered" });
//                  });



//                }
//             })

//       }
//    }
// })

// withdrawBonus("64cb63763e4ca30e1d2d7b78",50)

async function withdrawBonus(userId, amount) {

   // authenticate manager
   // const session = await mongoose.startSession({
   //     readPreference: 'primary',
   //     readConcern: { level: 'majority' },
   //     writeConcern: { w: 'majority' },
   // });
   try {
      console.log("withdrawBonus", userId)
      //  await session.startTransaction();

      User.findOne({ _id: userId },
         {
            _id: 1, username: 1, balance: 1, manager: 1, master: 1, subadmin: 1, admin: 1, Parentrole: 1, managerId: 1, masterId: 1, subadminId: 1, adminId: 1, ParentId: 1, availableAmount: 1, exposure: 1, limit: 1, manager: 1, ParentUser: 1
         }).then(async dbUser => {
            User.findOne({ _id: dbUser.ParentId, },
               {
                  _id: 1, username: 1, balance: 1, manager: 1, master: 1, subadmin: 1, admin: 1, managerId: 1, masterId: 1, subadminId: 1, adminId: 1, ParentId: 1, Parentrole: 1, ParentUser: 1, availableAmount: 1, exposure: 1, limit: 1
               }).then(async dbMUser => {
                  dbMUser.availableAmount = dbMUser.availableAmount - amount;
                  var date = moment().tz("Asia/Calcutta").format('YYYY-MM-DD');
                  if (dbMUser.availableAmount < 0) {

                     console.log("Your balance is low")
                     //   return res.json({ response: [], success: false, "message": " Your balance is low, please contact upline." });
                  } else {


                     User.updateOne({
                        '_id': dbUser._id
                     }, {
                        $inc: {
                           balance: -1 * amount,
                           bounsBalance: -1 * amount,
                           availableAmount: -1 * amount,
                           limit: -1 * amount
                        }
                     }).then(async (row1) => {

                        User.updateOne({
                           '_id': dbMUser._id
                        }, {
                           $inc: {
                              balance: amount,
                              availableAmount: amount,
                              limit: amount
                           }
                        }).then(async (row) => {

                           var newlimit = parseFloat(dbUser.limit) - parseFloat(amount);
                           var newAvAmount = parseFloat(dbUser.availableAmount) - parseFloat(amount);
                           var oldlimit = dbUser.limit;
                           var oldAvAmount = dbUser.availableAmount;
                           var logSave = new Log();
                           logSave.username = dbUser.username;
                           logSave.userId = dbUser._id;
                           logSave.action = 'BALANCE';
                           logSave.subAction = 'BONUS_WITHDRAWL';
                           logSave.oldLimit = dbUser.limit;
                           logSave.amount = amount;
                           logSave.availableAmount = newAvAmount;
                           logSave.newLimit = newlimit;
                           logSave.mnewLimit = dbMUser.balance;
                           logSave.description = 'Bonus updated. Old Limit: ' + oldlimit + ' . New Limit: ' + newlimit;
                           logSave.manager = dbUser.manager;
                           logSave.master = dbUser.master;
                           logSave.subadmin = dbUser.subadmin;
                           logSave.admin = dbUser.admin;
                           logSave.ParentUser = dbUser.ParentUser;
                           logSave.managerId = dbUser.managerId;
                           logSave.masterId = dbUser.masterId;
                           logSave.subadminId = dbUser.subadminId;
                           logSave.adminId = dbUser.adminId;
                           logSave.ParentId = dbUser.ParentId;
                           logSave.Parentrole = dbUser.Parentrole;
                           logSave.remark = "Welcome bonus";
                           logSave.time = new Date();
                           logSave.datetime = Math.round(+new Date() / 1000);
                           logSave.deleted = false;
                           logSave.createDate = date;
                           logSave.from = dbUser.ParentUser;
                           logSave.to = dbUser.username;
                           //console.log(log);
                           Log.create([logSave]).then(async logsave => {

                              const payment = new Payment({
                                 type: 'Withdraw',
                                 userId: dbUser._id,
                                 orderId: "",
                                 amount: amount,
                                 name: dbUser.fullname,
                                 username: dbUser.username,
                                 paymentType: "Manual",
                                 depositId: "6454b5ef2d96cea5e8edfd56",
                                 status: 'Approved',
                                 image: "",
                                 remarks: "Bunos",
                                 managerType: dbUser.ParentRole,
                                 managerId: dbUser.ParentId,
                                 balance: dbUser.balance + amount,
                                 to: "Wallet",
                                 refrenceNo: ""
                              });
                              payment.save()
                                 .then(async doc => {



                                    var Mnewlimit = parseFloat(dbMUser.limit) + parseFloat(amount);
                                    var MnewAvAmount = parseFloat(dbMUser.availableAmount) + parseFloat(amount);
                                    var Moldlimit = dbMUser.limit;
                                    var MoldAvAmount = dbMUser.availableAmount;
                                    var LogM = new Log();
                                    LogM.username = dbMUser.username;
                                    LogM.userId = dbMUser._id;
                                    LogM.action = 'BALANCE';
                                    LogM.subAction = 'BONUS_DEPOSIT';
                                    LogM.oldLimit = Moldlimit;
                                    LogM.amount = -1 * amount;
                                    LogM.availableAmount = MnewAvAmount;
                                    LogM.newLimit = Mnewlimit;
                                    LogM.description = 'Balance updated. Old Limit: ' + Moldlimit + ' . New Limit: ' + Mnewlimit;
                                    LogM.remark = "Welcome Bonus";
                                    LogM.time = new Date();
                                    LogM.datetime = Math.round(+new Date() / 1000);
                                    LogM.createDate = date;
                                    LogM.deleted = false;
                                    LogM.manager = dbMUser.manager;
                                    LogM.master = dbMUser.master;
                                    LogM.subadmin = dbMUser.subadmin;
                                    LogM.admin = dbMUser.admin;
                                    LogM.ParentUser = dbMUser.ParentUser;
                                    LogM.managerId = dbMUser.managerId;
                                    LogM.masterId = dbMUser.masterId;
                                    LogM.subadminId = dbMUser.subadminId;
                                    LogM.adminId = dbMUser.adminId;
                                    LogM.ParentId = dbMUser.ParentId;
                                    LogM.Parentrole = dbMUser.Parentrole;
                                    LogM.from = dbUser.ParentUser;
                                    LogM.to = dbUser.username;
                                    Log.create([LogM]).then(async logm => {
                                       //  await session.commitTransaction();
                                       //  await session.endSession();
                                       await User.updateOne({ '_id': dbUser._id }, { bounsStatus: 1 });
                                       console.log("Welcome Bonus Balance Deposit")

                                       //   return res.json({ response: userData, success: true, "message": "success" });
                                    }).catch(async error => {
                                       //  await session.abortTransaction();
                                       //  await session.endSession();
                                       logger.error('place-bet-error: DBError', error);
                                       //   return res.json({ response: error, success: false, "message": "Server Error" });
                                    })
                                 });
                           });
                        }).catch(async error => {
                           //   await session.abortTransaction();
                           //   await session.endSession();
                           logger.error('place-bet-error: DBError', error);
                           // return res.json({ response: error, success: false, "message": "Server Error" });
                        })
                     }).catch(async error => {
                        //  await session.abortTransaction();
                        //  await session.endSession();
                        logger.error('place-bet-error: DBError', error);
                        //  return res.json({ response: error, success: false, "message": "Server Error" });
                     })
                  }
               }).catch(async error => {
                  //   await session.abortTransaction();
                  //   await session.endSession();
                  logger.error('place-bet-error: DBError', error);
                  //    return res.json({ response: {}, success: false, "message": "Parent User Not Found" });
               })
         }).catch(async error => {
            // await session.abortTransaction();
            // await session.endSession();
            logger.error('place-bet-error: DBError', error);
            //  return res.json({ response: {}, success: false, "message": "User Not Found" });
         })

   } catch (error) {
      //  await session.abortTransaction();
      //  await session.endSession();
      console.log(error)
      //    return res.json({ response: error, success: false, "message": "Server Error" });
   }
}

// setInterval(function () {
// User.find({ balance:0, admin:"ZOLOWIN",availableAmount:0,bounsStatus:0},
//     {
//         _id: 1 
//     }, { limit: 1 }).then(async dbUser => { 
//       // console.log(dbUser.length);
//       if(dbUser.length > 0){
//          // for (var k = 0; k < dbUser.length; k++) {
//          //    let range = { min:  1000, max: 5000 }
//          //    let delta = range.max - range.min
//          //    const rand = Math.round(range.min + Math.random() * delta)
//          //    console.log(rand);
//          //    setTimeout(() => {
//                // console.log(dbUser[0]._id);
//                depositBonus(dbUser[0]._id,50)
//       //       }, rand)

//       //    }
//       }

//     })
//    }, 2000);

// setInterval(function () {

//    var twohour = moment().tz("Asia/Calcutta").subtract(2, "hours").format('YYYY-MM-DDTHH:mm:ss.000Z');

//    // console.log(twohour)
//    User.find({ openingDate: { $lt: new Date(twohour) }, pushnotification: "0" ,admin:"ZOLOWIN"},
//       {
//          _id: 1, username: 1, mobile: 1
//       }, { limit: 1 }).then(async dbUser => {
//          console.log(dbUser.length);
//          if (dbUser.length > 0) {
//             // for (var k = 0; k < dbUser.length; k++) {
//             //    let range = { min:  1000, max: 5000 }
//             //    let delta = range.max - range.min
//             //    const rand = Math.round(range.min + Math.random() * delta)
//             //    console.log(rand);
//             //    setTimeout(() => {
//             console.log(dbUser[0].username);
//             // depositBonus(dbUser[0]._id,50)
//             //       }, rand)

//             //    }
//          }

//       })
// }, 2000);

// Push Notification Start

// var name = 'Wallet Deposit Request Approved!';
// var message = `Your wallet deposit request has been approved. We have deposited 5000 coins to your wallet. Have fun with ANKUR. `;

// var datapush = {
//    app_id: "047ed5ed-a6ce-4c14-990d-6e956b6402de",
//    contents: { "en": message },
//    headings: { "en": name },
//    big_picture: "https://adminsocket.diamond222.com/uploads/welcome.jpg",
//    chrome_web_image:"https://adminsocket.diamond222.com/uploads/welcome.jpg",
//    large_icon:"https://adminsocket.diamond222.com/uploads/welcome.jpg",
//    url: "",
//    include_player_ids: ['0db04ded-3e98-4388-bf34-6524dc976f8a']
// }; 

// var headers = {
//    "Content-Type": "application/json; charset=utf-8",
//    "Authorization": "Basic MjNhMTlkNWMtYmJmOS00MTA3LWJiNzQtNjI4MjE0N2NjYWU2"
// };

// var options = {
//    host: "onesignal.com",
//    port: 443,
//    path: "/api/v1/notifications",
//    method: "POST",
//    headers: headers
// };


// var https = require('https');
// var requestpush = https.request(options, function (res) {
//    res.on('data', function (datapush) {
//       console.log("Response:");
//       console.log(JSON.parse(datapush));
//       // socket.emit('push-message-success', { 'message': 'push message set successfully' });
//    });
// });

// requestpush.on('error', function (e) {
//    console.log("ERROR:");
//    // socket.emit('push-message-success', { 'message': 'push message set successfully' });
//    console.log(e);
// });

// requestpush.write(JSON.stringify(datapush));
// requestpush.end();

// Push Notification End




async function depositBonus(userId, amount) {

   // authenticate manager
   const session = await mongoose.startSession({
      readPreference: 'primary',
      readConcern: { level: 'majority' },
      writeConcern: { w: 'majority' },
   });
   try {
      console.log("depositBonus", userId)
      await session.startTransaction();

      User.findOne({ _id: userId },
         {
            _id: 1, username: 1, balance: 1, manager: 1, master: 1, subadmin: 1, admin: 1, Parentrole: 1, managerId: 1, masterId: 1, subadminId: 1, adminId: 1, ParentId: 1, availableAmount: 1, exposure: 1, limit: 1, manager: 1, ParentUser: 1
         }).then(async dbUser => {
            User.findOne({ _id: dbUser.ParentId, },
               {
                  _id: 1, username: 1, balance: 1, manager: 1, master: 1, subadmin: 1, admin: 1, managerId: 1, masterId: 1, subadminId: 1, adminId: 1, ParentId: 1, Parentrole: 1, ParentUser: 1, availableAmount: 1, exposure: 1, limit: 1
               }).then(async dbMUser => {
                  dbMUser.availableAmount = dbMUser.availableAmount - amount;
                  var date = moment().tz("Asia/Calcutta").format('YYYY-MM-DD');
                  if (dbMUser.availableAmount < 0) {
                     await session.abortTransaction();
                     await session.endSession();
                     console.log("Your balance is low")
                     //   return res.json({ response: [], success: false, "message": " Your balance is low, please contact upline." });
                  } else {


                     User.updateOne({
                        '_id': dbUser._id
                     }, {
                        $inc: {
                           balance: amount,
                           bounsBalance: amount,
                           availableAmount: amount,
                           limit: amount
                        }
                     }).session(session).then(async (row1) => {

                        User.updateOne({
                           '_id': dbMUser._id
                        }, {
                           $inc: {
                              balance: -1 * amount,
                              availableAmount: -1 * amount,
                              limit: -1 * amount
                           }
                        }).session(session).then(async (row) => {

                           var newlimit = parseFloat(dbUser.limit) + parseFloat(amount);
                           var newAvAmount = parseFloat(dbUser.availableAmount) + parseFloat(amount);
                           var oldlimit = dbUser.limit;
                           var oldAvAmount = dbUser.availableAmount;
                           var logSave = new Log();
                           logSave.username = dbUser.username;
                           logSave.userId = dbUser._id;
                           logSave.action = 'BALANCE';
                           logSave.subAction = 'BONUS_DEPOSIT';
                           logSave.oldLimit = dbUser.limit;
                           logSave.amount = amount;
                           logSave.availableAmount = newAvAmount;
                           logSave.newLimit = newlimit;
                           logSave.mnewLimit = dbMUser.balance;
                           logSave.description = 'Bonus updated. Old Limit: ' + oldlimit + ' . New Limit: ' + newlimit;
                           logSave.manager = dbUser.manager;
                           logSave.master = dbUser.master;
                           logSave.subadmin = dbUser.subadmin;
                           logSave.admin = dbUser.admin;
                           logSave.ParentUser = dbUser.ParentUser;
                           logSave.managerId = dbUser.managerId;
                           logSave.masterId = dbUser.masterId;
                           logSave.subadminId = dbUser.subadminId;
                           logSave.adminId = dbUser.adminId;
                           logSave.ParentId = dbUser.ParentId;
                           logSave.Parentrole = dbUser.Parentrole;
                           logSave.remark = "Registeration bonus";
                           logSave.time = new Date();
                           logSave.datetime = Math.round(+new Date() / 1000);
                           logSave.deleted = false;
                           logSave.createDate = date;
                           logSave.from = dbUser.ParentUser;
                           logSave.to = dbUser.username;
                           //console.log(log);
                           Log.create([logSave], { session }).then(async logsave => {

                              const payment = new Payment({
                                 type: 'Deposit',
                                 userId: dbUser._id,
                                 orderId: "",
                                 amount: amount,
                                 name: dbUser.fullname,
                                 username: dbUser.username,
                                 paymentType: "Manual",
                                 depositId: "6454b5ef2d96cea5e8edfd56",
                                 status: 'Approved',
                                 image: "",
                                 remarks: "Bunos",
                                 managerType: dbUser.ParentRole,
                                 managerId: dbUser.ParentId,
                                 balance: dbUser.balance + amount,
                                 to: "Wallet",
                                 refrenceNo: ""
                              });
                              payment.save()
                                 .then(async doc => {

                                    var Mnewlimit = parseFloat(dbMUser.limit) - parseFloat(amount);
                                    var MnewAvAmount = parseFloat(dbMUser.availableAmount) - parseFloat(amount);
                                    var Moldlimit = dbMUser.limit;
                                    var MoldAvAmount = dbMUser.availableAmount;
                                    var LogM = new Log();
                                    LogM.username = dbMUser.username;
                                    LogM.userId = dbMUser._id;
                                    LogM.action = 'BALANCE';
                                    LogM.subAction = 'BONUS_WITHDRAWL';
                                    LogM.oldLimit = Moldlimit;
                                    LogM.amount = -1 * amount;
                                    LogM.availableAmount = MnewAvAmount;
                                    LogM.newLimit = Mnewlimit;
                                    LogM.description = 'Balance updated. Old Limit: ' + Moldlimit + ' . New Limit: ' + Mnewlimit;
                                    LogM.remark = "Registeration Bonus";
                                    LogM.time = new Date();
                                    LogM.datetime = Math.round(+new Date() / 1000);
                                    LogM.createDate = date;
                                    LogM.deleted = false;
                                    LogM.manager = dbMUser.manager;
                                    LogM.master = dbMUser.master;
                                    LogM.subadmin = dbMUser.subadmin;
                                    LogM.admin = dbMUser.admin;
                                    LogM.ParentUser = dbMUser.ParentUser;
                                    LogM.managerId = dbMUser.managerId;
                                    LogM.masterId = dbMUser.masterId;
                                    LogM.subadminId = dbMUser.subadminId;
                                    LogM.adminId = dbMUser.adminId;
                                    LogM.ParentId = dbMUser.ParentId;
                                    LogM.Parentrole = dbMUser.Parentrole;
                                    LogM.from = dbUser.ParentUser;
                                    LogM.to = dbUser.username;
                                    Log.create([LogM], { session }).then(async logm => {
                                       await session.commitTransaction();
                                       await session.endSession();
                                       console.log("Bonus Balance Deposit")
                                       // var userData = await User.findOne({ '_id': dbUser._id },
                                       //    {
                                       //       balance: 1, exposure: 1, limit: 1, username: 1
                                       //    });
                                       return res.json({ response: userData, success: true, "message": "success" });
                                    }).catch(async error => {
                                       await session.abortTransaction();
                                       await session.endSession();
                                       logger.error('place-bet-error: DBError', error);
                                       //   return res.json({ response: error, success: false, "message": "Server Error" });
                                    })
                                 });
                           });
                        }).catch(async error => {
                           await session.abortTransaction();
                           await session.endSession();
                           logger.error('place-bet-error: DBError', error);
                           // return res.json({ response: error, success: false, "message": "Server Error" });
                        })
                     }).catch(async error => {
                        await session.abortTransaction();
                        await session.endSession();
                        logger.error('place-bet-error: DBError', error);
                        //  return res.json({ response: error, success: false, "message": "Server Error" });
                     })
                  }
               }).catch(async error => {
                  await session.abortTransaction();
                  await session.endSession();
                  logger.error('place-bet-error: DBError', error);
                  //    return res.json({ response: {}, success: false, "message": "Parent User Not Found" });
               })
         }).catch(async error => {
            await session.abortTransaction();
            await session.endSession();
            logger.error('place-bet-error: DBError', error);
            //  return res.json({ response: {}, success: false, "message": "User Not Found" });
         })

   } catch (error) {
      await session.abortTransaction();
      await session.endSession();
      console.log(error)
      //    return res.json({ response: error, success: false, "message": "Server Error" });
   }
}


// setInterval(function () {

//    var twohour = moment().tz("Asia/Calcutta").subtract(2, "hours").format('YYYY-MM-DDTHH:mm:ss.000Z');

//    // console.log(twohour)
//    User.find({ role: 'user', exposure:{$ne : 0}},
//       {
//          _id: 1, username: 1, mobile: 1
//       }, { limit: 1 }).then(async dbUser => {
//          console.log(dbUser.length);
//          if (dbUser.length > 0) {
//             // for (var k = 0; k < dbUser.length; k++) {
//             //    let range = { min:  1000, max: 5000 }
//             //    let delta = range.max - range.min
//             //    const rand = Math.round(range.min + Math.random() * delta)
//             //    console.log(rand);
//                setTimeout(() => {
//             console.log(dbUser[0].username);
//             updateBalance(dbUser[0].username)
//                   }, 2000)

//             //    }
//          }

//       })
// }, 2000);

// updateBalance('DEMOS'); 

async function updateBalance(username) {
   const session = await mongoose.startSession({
      readPreference: 'primary',
      readConcern: { level: 'majority' },
      writeConcern: { w: 'majority' },
   });
   try {
      await session.startTransaction();
      // var username = 'DEMOS';
      var balance = 0;
      console.log('updateBalance', username);
      await User.findOne({
         username: username,
         role: "user",
         deleted: false
      }, async function (err, user) {
         if (err || !user) {
            console.log(err)
            await session.abortTransaction();
            await session.endSession();
            return;
         }
         // console.log(user.username);
         await Bet.distinct('marketId', {
            username: username,
            deleted: false,
            result: 'ACTIVE'
         }, async function (err, marketIds) {
            if (err) logger.error(err);
            console.log(marketIds);
            if (!marketIds || marketIds.length == 0) {
               console.log("qwewqrewr");
               await User.updateOne({ username: username }, {
                  $set: {
                     balance: user.limit,
                     exposure: 0
                  }
               }).session(session).then(async (userone) => {
               }).catch(async error => {
                  console.log(error);
                  await session.commitTransaction();
                  await session.endSession();
                  // done(-1);
                  return;
               });
            } else {
               await Market.find({
                  deleted: false,
                  marketId: {
                     $in: marketIds
                  }
               }, async function (err, markets) {
                  if (err || !markets || markets.length < 1) {
                     logger.error("updateBalance error: no markets found");
                     // done(-1);
                     await User.updateOne({ username: username }, {
                        $set: {
                           balance: user.limit,
                           exposure: 0
                        }
                     }).session(session).then(async (userone) => {
                     }).catch(async error => {
                        console.log(error);
                        await session.commitTransaction();
                        await session.endSession();
                        // done(-1);
                        return;
                     });
                  } else {
                     var exposure = 0;
                     var counter = 0;
                     var len = markets.length;

                     markets.forEach(async function (market, index) {
                        // console.log("markets length",market);

                        if (!market.roundId) {
                           market.roundId = market.marketId;
                        }
                        // console.log(market.marketType,market.roundId);
                        if (market.marketType != 'SESSION') {
                           (async function (market, mindex, callback) {

                              // console.log(user.username,market.eventId,market.marketId,market.roundId)
                              await Bet.find({
                                 eventId: market.eventId,
                                 marketId: market.marketId,
                                 roundId: market.roundId,
                                 username: user.username,
                                 result: 'ACTIVE',
                                 deleted: false
                              }, function (err, bets) {
                                 // console.log(bets.length)
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
                                 logger.info(user.username + " market: " + market.marketName + " exposure: " + maxLoss);
                                 // console.log(user.username + " market: " + market.marketName + " exposure: " + maxLoss);
                                 callback(maxLoss, mindex);
                                 return;
                              });
                           })(market, index, async function (e, i) {
                              counter++;
                              if (counter == len) {
                                 exposure += e * 1;
                                 logger.info("Total exposure: " + exposure);
                                 console.log("Total exposure ODDS bet: " + exposure);
                                 if (exposure <= 0) user.balance = user.limit + exposure;
                                 logger.info(user.username + " New Balance: " + user.balance);
                                 await Bet.find({
                                    username: user.username,
                                    result: 'ACTIVE',
                                    deleted: false,
                                    eventTypeName: 'wheelSpiner'
                                 }, async function (err, betspinners) {
                                    if (betspinners.length > 0) {
                                       var exposurewheel = 0;
                                       var counterw = 0;
                                       var wheellength = betspinners.length;
                                       for (w = 0; w < betspinners.length; w++) {
                                          counterw++;
                                          if (counterw == wheellength) {
                                             exposurewheel += betspinners[w].stake;

                                             await User.updateOne({ username: username }, {
                                                $set: {
                                                   balance: user.balance,
                                                   exposure: exposure - exposurewheel
                                                }
                                             }).session(session).then(async (userone) => {
                                             }).catch(async error => {
                                                console.log(error);
                                                await session.commitTransaction();
                                                await session.endSession();
                                                // done(-1);
                                                return;
                                             });

                                          } else {
                                             exposurewheel += betspinners[w].stake;
                                          }
                                       }
                                    } else {

                                       await User.updateOne({ username: username }, {
                                          $set: {
                                             balance: user.balance,
                                             exposure: exposure
                                          }
                                       }).session(session).then(async (userone) => {
                                       }).catch(async error => {
                                          console.log(error);
                                          await session.commitTransaction();
                                          await session.endSession();
                                          // done(-1);
                                          return;
                                       });
                                    }
                                 });

                              } else {
                                 exposure += e * 1;
                              }
                           });
                        } else {
                           (async function (market, mindex, callback) {
                              // console.log(user.username,market.eventId,market.marketId,market.roundId)
                              await Bet.find({
                                 eventId: market.eventId,
                                 marketId: market.marketId,
                                 roundId: market.roundId,
                                 username: user.username,
                                 result: 'ACTIVE',
                                 deleted: false
                              }, function (err, bets) {
                                 // console.log(bets.length)
                                 if (err || !bets || bets.length < 1) {
                                    callback(0);
                                    return;
                                 }
                                 // console.log(bets.length)
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
                                 logger.info("max loss " + maxLoss);
                                 // console.log(user.username + " market: " + market.marketName + " exposure: " + maxLoss);
                                 callback(maxLoss, mindex);
                                 return;
                              });
                           })(market, index, async function (e, i) {
                              counter++;
                              if (counter == len) {
                                 exposure += e * 1;
                                 logger.info("Total exposure: " + exposure);
                                 console.log("Total exposure session bet: " + exposure);
                                 if (exposure <= 0)
                                    user.balance = user.limit + exposure;
                                 logger.info("New Balance: " + user.balance);
                                 await Bet.find({
                                    username: user.username,
                                    result: 'ACTIVE',
                                    deleted: false,
                                    eventTypeName: 'wheelSpiner'
                                 }, async function (err, betspinners) {
                                    if (betspinners.length > 0) {
                                       var exposurewheel = 0;
                                       var counterw = 0;
                                       var wheellength = betspinners.length;
                                       for (w = 0; w < betspinners.length; w++) {
                                          counterw++;
                                          if (counterw == wheellength) {
                                             exposurewheel += betspinners[w].stake;
                                             //console.log(exposurewheel);

                                             await User.updateOne({ username: username }, {
                                                $set: {
                                                   balance: user.balance,
                                                   exposure: exposure - exposurewheel
                                                }
                                             }).session(session).then(async (userone) => {
                                             }).catch(async error => {
                                                console.log(error);
                                                await session.commitTransaction();
                                                await session.endSession();
                                                // done(-1);
                                                return;
                                             });

                                          } else {
                                             exposurewheel += betspinners[w].stake;
                                          }
                                       }
                                    } else {

                                       await User.updateOne({ username: username }, {
                                          $set: {
                                             balance: user.balance,
                                             exposure: exposure
                                          }
                                       }).session(session).then(async (userone) => {
                                       }).catch(async error => {
                                          console.log(error);
                                          await session.commitTransaction();
                                          await session.endSession();
                                          // done(-1);
                                          return;
                                       });
                                    }
                                 });
                              } else {
                                 exposure += e * 1;
                              }
                           });
                        }
                     });
                  }

               });
            }
         });
      });
   } catch (error) {
      console.log(error)
      await session.abortTransaction();
      await session.endSession();
      return;
   }
}


module.exports.betdata = (req, res) => {
   try {

      // console.log(req.body);
      const data = req.body.events;
      // console.log(data);
      data.forEach(function (value) {
         // console.log(value.id);
         CrickData.find({ id: value.id })
            .then(doc => {
               if (!doc) {
                  const cricData = new CrickData({
                     id: value.id,
                     event_id: value.event_id,
                     event_name: value.event_name,
                     event_timestamp_date: value.event_timestamp_date,
                     has_bookmaker: value.has_bookmaker,
                     has_fancy: value.has_fancy,
                     inplay_stake_limit: value.inplay_stake_limit,
                     inplay_status: value.inplay_status,
                     league_id: value.league_id,
                     league_name: value.league_name,
                     market_id: value.market_id,
                     slug: value.slug,
                     sport_id: value.sport_id,
                     sport_radar_id: value.sport_radar_id,
                     stake_limit: value.stake_limit,
                     tv_url: value.tv_url,
                     score_url: "https://clickbetexch.com/get-scorecard-iframe/" + value.sport_id + "/" + value.event_id + "/" + value.sport_radar_id,
                  })
                  cricData.save((error, doc) => {
                     if (error || !doc) {
                        console.log(error);
                     }
                     else {
                        // console.log("Data added" + value.id);
                     }
                  });
               }
               else {

                  const cricData = {
                     event_id: value.event_id,
                     event_name: value.event_name,
                     event_timestamp_date: value.event_timestamp_date,
                     has_bookmaker: value.has_bookmaker,
                     has_fancy: value.has_fancy,
                     inplay_stake_limit: value.inplay_stake_limit,
                     inplay_status: value.inplay_status,
                     league_id: value.league_id,
                     league_name: value.league_name,
                     market_id: value.market_id,
                     slug: value.slug,
                     sport_id: value.sport_id,
                     sport_radar_id: value.sport_radar_id,
                     stake_limit: value.stake_limit,
                     tv_url: value.tv_url,
                     score_url: "https://clickbetexch.com/get-scorecard-iframe/" + value.sport_id + "/" + value.event_id + "/" + value.sport_radar_id,
                  }
                  CrickData.update({ id: value.id }, cricData, { upsert: true }, (error, doc) => {
                     if (error || !doc) {
                        console.log("nhl DB error : data update error");
                     }
                     else {
                        // console.log("crick data update" + value.id);
                     }
                  })
               }
            })

      })
      res.send({ data: {}, success: true, message: "data saved sucessfully" });

   }
   catch (error) {
      res.send({ error, success: false, message: "Unknown error" });
   }
}

module.exports.getcricketevents = (req, res) => {
   try {
      var d = new Date();
      d.setHours(0, 0, 0, 0);
      var timestamp = Math.floor(d / 1000);
      // console.log(timestamp);

      CrickData.find({ event_timestamp_date: { $gte: timestamp }, sport_radar_id: { $ne: null }, sport_id: 4 }, { event_id: 1, id: 1 })
         .then(doc => {
            res.send({ doc, success: true, message: "all events fetched" });
         })
         .catch(error => {
            console.log(error);
            res.send({ error, success: false, message: "DB error: user events error" });
         })

   }
   catch (error) {
      res.send({ error, success: false, message: "Unknown error" });
   }
}

module.exports.geteventbyId = (req, res) => {
   try {
      // console.log(req.params.eventid);
      CrickData.findOne({ event_id: req.params.eventid }, { score_url: 1 })
         .then(doc => {
            res.send({ doc, success: true, message: " event fetched" });
         })
         .catch(error => {
            console.log(error);
            res.send({ error, success: false, message: "DB error: user events error" });
         })

   }
   catch (error) {
      res.send({ error, success: false, message: "Unknown error" });
   }
}

module.exports.allevents = (req, res) => {
   try {
      var d = new Date();
      d.setHours(0, 0, 0, 0);
      var timestamp = Math.floor(d / 1000);
      // console.log(timestamp);

      CrickData.find({ event_timestamp_date: { $gte: timestamp }, sport_radar_id: { $ne: null } }, { event_id: 1, market_id: 1, sport_id: 1, sport_radar_id: 1, score_url: 1, id: 1 })
         .then(doc => {
            res.send({ doc, success: true, message: "all events fetched" });
         })
         .catch(error => {
            console.log(error);
            res.send({ error, success: false, message: "DB error: user events error" });
         })

   }
   catch (error) {
      res.send({ error, success: false, message: "Unknown error" });
   }
}

module.exports.RazorTransactions = async (req, res) => {
   const session = await mongoose.startSession({
      readPreference: 'primary',
      readConcern: { level: 'majority' },
      writeConcern: { w: 'majority' },
   });
   try {
      await session.startTransaction();
      // console.log(req.body)

      if (req.body.payload.payment.entity) {
         console.log(req.body.payload.payment.entity);
         var RazorResponse = req.body.payload.payment.entity;

         let name;
         let message;
         let balance;
         let exposure;
         // console.log("RazorResponse.order_id",RazorResponse.order_id);
         if (RazorResponse.order_id) {
            await Payment.
               findOne({ orderId: RazorResponse.order_id }).
               populate('sites').
               exec(async function (err, data) {
                  // console.log(err)
                  // console.log(data.userId)

                  let user = await User.findOne({ _id: data.userId });

                  let sitename, siteurl;
                  if (data.sites) {
                     sitename = data.sites.name;
                     siteurl = data.sites.url;
                  }
                  let notificationCount = user.notificationCount + 1;

                  if (RazorResponse.status == "failed") {

                     // console.log("failed",RazorResponse.status)

                     name = 'Wallet Deposit Request Declined!';
                     message = `Your request for the wallet deposit of ${data.amount} coins has been declined. Please check the reason and let us know if you need any further assistance.`;
                     balance = user.balance;
                     exposure = parseInt(user.exposure) - parseInt(data.amount);

                     Payment.updateOne({
                        'orderId': RazorResponse.order_id
                     }, { status: "Decline", remarks: data.remarks, balance: balance, approvedBy: user.ParentUser }, function (err, updateMessage) {

                        const notification = new Notification({
                           userId: data.userId,
                           amount: data.amount,
                           name: name,
                           message: message,
                           remarks: data.remarks,
                           status: "Decline",
                           sitename: sitename,
                           siteurl: siteurl,
                           payment: data._id
                        });
                        notification.save()
                           .then(async doc => {
                              let userdata = await User.findOne({ _id: data.userId });
                              res.send({ response: req.body, success: true, message: "success" });
                              //      io.to(socket.id).emit("transaction-status", { message: "Transaction Updated Successfully", success: true, data: doc });
                              //      io.emit("get-notification", { message: name, success: true, data: doc });
                              //      io.emit("user-notification-count", { message: "Notification Count", success: true, data: userdata.notificationCount, userId: userdata._id });
                           })
                           .catch(error => {
                              return res.json({ response: error, success: false, "message": "Server Error" });
                              //   io.to(socket.id).emit("transaction-status", { message: "Error in update transaction", success: false, data: error });
                           })
                     });


                  } else if (RazorResponse.status == "captured") {

                     // console.log("captured",RazorResponse.status)



                     await User.findOne({ _id: data.userId },
                        {
                           _id: 1, username: 1, bounsStatus: 1, bounsBalance: 1, balance: 1, manager: 1, master: 1, subadmin: 1, admin: 1, Parentrole: 1, managerId: 1, masterId: 1, subadminId: 1, adminId: 1, ParentId: 1, availableAmount: 1, exposure: 1, limit: 1, manager: 1, ParentUser: 1
                        }).then(async dbUser => {
                           await User.findOne({ _id: dbUser.ParentId, },
                              {
                                 _id: 1, username: 1, balance: 1, manager: 1, master: 1, subadmin: 1, admin: 1, managerId: 1, masterId: 1, subadminId: 1, adminId: 1, ParentId: 1, Parentrole: 1, ParentUser: 1, availableAmount: 1, exposure: 1, limit: 1
                              }).then(async dbMUser => {
                                 dbMUser.availableAmount = dbMUser.availableAmount - data.amount;
                                 var date = moment().tz("Asia/Calcutta").format('YYYY-MM-DD');
                                 if (dbMUser.availableAmount < 0) {
                                    await session.abortTransaction();
                                    await session.endSession();
                                    console.log("Your balance is low, please contact upline.")
                                    // return res.json({ response: [], success: false, "message": " Your balance is low, please contact upline." });
                                    //  io.to(socket.id).emit("transaction-status", { message: "Your balance is low, please contact upline", success: false });
                                 } else {

                                    name = 'Wallet Deposit Request Approved!';
                                    message = `Your wallet deposit request has been approved. We have deposited ${data.amount} coins to your wallet. Have fun with ${dbMUser.username}. `;
                                    balance = parseInt(user.balance) + parseInt(data.amount);
                                    exposure = parseInt(user.exposure) - parseInt(data.amount);

                                    console.log("dbUser.bounsStatus", dbUser.bounsStatus)

                                    if (dbUser.bounsStatus == 0) {
                                       console.log(data.amount)
                                       var getBonus = await Bonus.findOne({ minAmount: { $lte: data.amount }, status: "active" }, { bonusValue: 1 }).sort({ minAmount: -1 });
                                       console.log(getBonus)
                                       if (getBonus) {
                                          bounsAmount = getBonus.bonusValue;
                                          depositBonus(dbUser._id, bounsAmount, session);
                                       }
                                    }


                                    await User.updateOne({
                                       '_id': dbUser._id
                                    }, {
                                       $inc: {
                                          balance: data.amount,
                                          availableAmount: data.amount,
                                          limit: data.amount
                                       },
                                       bounsStatus: 1
                                    }).session(session).then(async (row1) => {

                                       await User.updateOne({
                                          '_id': dbMUser._id
                                       }, {
                                          $inc: {
                                             balance: -1 * data.amount,
                                             availableAmount: -1 * data.amount,
                                             limit: -1 * data.amount
                                          }
                                       }).session(session).then(async (row) => {

                                          var newlimit = parseFloat(dbUser.limit) + parseFloat(data.amount);
                                          var newAvAmount = parseFloat(dbUser.availableAmount) + parseFloat(data.amount);
                                          var oldlimit = dbUser.limit;
                                          var oldAvAmount = dbUser.availableAmount;
                                          var logSave = new Log();
                                          logSave.username = dbUser.username;
                                          logSave.userId = dbUser._id;
                                          logSave.action = 'BALANCE';
                                          logSave.subAction = 'BALANCE_DEPOSIT';
                                          logSave.oldLimit = dbUser.limit;
                                          logSave.amount = data.amount;
                                          logSave.availableAmount = newAvAmount;
                                          logSave.newLimit = newlimit;
                                          logSave.mnewLimit = dbMUser.balance;
                                          logSave.description = 'Balance updated. Old Limit: ' + oldlimit + ' . New Limit: ' + newlimit;
                                          logSave.manager = dbUser.manager;
                                          logSave.master = dbUser.master;
                                          logSave.subadmin = dbUser.subadmin;
                                          logSave.admin = dbUser.admin;
                                          logSave.ParentUser = dbUser.ParentUser;
                                          logSave.managerId = dbUser.managerId;
                                          logSave.masterId = dbUser.masterId;
                                          logSave.subadminId = dbUser.subadminId;
                                          logSave.adminId = dbUser.adminId;
                                          logSave.ParentId = dbUser.ParentId;
                                          logSave.Parentrole = dbUser.Parentrole;
                                          logSave.remark = req.remark;
                                          logSave.time = new Date();
                                          logSave.datetime = Math.round(+new Date() / 1000);
                                          logSave.deleted = false;
                                          logSave.createDate = date;
                                          logSave.from = dbUser.ParentUser;
                                          logSave.to = dbUser.username;
                                          //console.log(log);
                                          Log.create([logSave], { session }).then(async logsave => {

                                             var Mnewlimit = parseFloat(dbMUser.limit) - parseFloat(data.amount);
                                             var MnewAvAmount = parseFloat(dbMUser.availableAmount) - parseFloat(data.amount);
                                             var Moldlimit = dbMUser.limit;
                                             var MoldAvAmount = dbMUser.availableAmount;
                                             var LogM = new Log();
                                             LogM.username = dbMUser.username;
                                             LogM.userId = dbMUser._id;
                                             LogM.action = 'BALANCE';
                                             LogM.subAction = 'BALANCE_WITHDRAWL';
                                             LogM.oldLimit = Moldlimit;
                                             LogM.amount = -1 * data.amount;
                                             LogM.availableAmount = MnewAvAmount;
                                             LogM.newLimit = Mnewlimit;
                                             LogM.description = 'Balance updated. Old Limit: ' + Moldlimit + ' . New Limit: ' + Mnewlimit;
                                             LogM.remark = data.remark;
                                             LogM.time = new Date();
                                             LogM.datetime = Math.round(+new Date() / 1000);
                                             LogM.createDate = date;
                                             LogM.deleted = false;
                                             LogM.manager = dbMUser.manager;
                                             LogM.master = dbMUser.master;
                                             LogM.subadmin = dbMUser.subadmin;
                                             LogM.admin = dbMUser.admin;
                                             LogM.ParentUser = dbMUser.ParentUser;
                                             LogM.managerId = dbMUser.managerId;
                                             LogM.masterId = dbMUser.masterId;
                                             LogM.subadminId = dbMUser.subadminId;
                                             LogM.adminId = dbMUser.adminId;
                                             LogM.ParentId = dbMUser.ParentId;
                                             LogM.Parentrole = dbMUser.Parentrole;
                                             LogM.from = dbUser.ParentUser;
                                             LogM.to = dbUser.username;
                                             Log.create([LogM], { session }).then(async logm => {
                                                await session.commitTransaction();
                                                await session.endSession();

                                                Payment.updateOne({
                                                   'orderId': RazorResponse.order_id
                                                }, { status: "Approved", remarks: data.remarks, balance: balance, approvedBy: dbMUser.username }, function (err, updateMessage) {

                                                   const notification = new Notification({
                                                      userId: data.userId,
                                                      amount: data.amount,
                                                      name: name,
                                                      message: message,
                                                      remarks: data.remarks,
                                                      status: "Approved",
                                                      sitename: sitename,
                                                      siteurl: siteurl,
                                                      payment: data._id
                                                   });
                                                   notification.save()
                                                      .then(async doc => {
                                                         let userdata = await User.findOne({ _id: data.userId });

                                                         // Push Notification Start

                                                         var name = 'Wallet Deposit Request Approved!';
                                                         var message = `Your wallet deposit request has been approved. We have deposited ${data.amount} coins to your wallet. Have fun with ${dbMUser.username}. `;

                                                         var datapush = {
                                                            app_id: "047ed5ed-a6ce-4c14-990d-6e956b6402de",
                                                            contents: { "en": message },
                                                            headings: { "en": name },
                                                            big_picture: "https://blog.taskpigeon.co/wp-content/uploads/2017/06/Advanced-Email-Notifications-Task-Pigeon.jpg",
                                                            url: "",
                                                            include_player_ids: [user.deviceId]
                                                         };

                                                         var headers = {
                                                            "Content-Type": "application/json; charset=utf-8",
                                                            "Authorization": "Basic MjNhMTlkNWMtYmJmOS00MTA3LWJiNzQtNjI4MjE0N2NjYWU2"
                                                         };

                                                         var options = {
                                                            host: "onesignal.com",
                                                            port: 443,
                                                            path: "/api/v1/notifications",
                                                            method: "POST",
                                                            headers: headers
                                                         };


                                                         var https = require('https');
                                                         var requestpush = https.request(options, function (res) {
                                                            res.on('data', function (datapush) {
                                                               console.log("Response:");
                                                               // console.log(JSON.parse(datapush));
                                                               // socket.emit('push-message-success', { 'message': 'push message set successfully' });
                                                            });
                                                         });

                                                         requestpush.on('error', function (e) {
                                                            console.log("ERROR:");
                                                            // socket.emit('push-message-success', { 'message': 'push message set successfully' });
                                                            console.log(e);
                                                         });

                                                         requestpush.write(JSON.stringify(datapush));
                                                         requestpush.end();

                                                         // Push Notification End

                                                         res.send({ response: req.body, success: true, message: "success" });
                                                         //      io.to(socket.id).emit("transaction-status", { message: "Transaction Updated Successfully", success: true, data: doc });
                                                         //      io.emit("get-notification", { message: name, success: true, data: doc });
                                                         //      io.emit("user-notification-count", { message: "Notification Count", success: true, data: userdata.notificationCount, userId: userdata._id });
                                                      })
                                                      .catch(error => {
                                                         return res.json({ response: error, success: false, "message": "Server Error" });
                                                         //   io.to(socket.id).emit("transaction-status", { message: "Error in update transaction", success: false, data: error });
                                                      })
                                                });
                                             }).catch(async error => {
                                                await session.abortTransaction();
                                                await session.endSession();
                                                logger.error('place-bet-error: DBError', error);
                                                //   io.to(socket.id).emit("transaction-status", { message: "Error in update transaction", success: false, data: error });
                                                return res.json({ response: error, success: false, "message": "Server Error" });
                                             })
                                          });
                                       }).catch(async error => {
                                          await session.abortTransaction();
                                          await session.endSession();
                                          logger.error('place-bet-error: DBError', error);
                                          // io.to(socket.id).emit("transaction-status", { message: "Error in update transaction", success: false, data: error });
                                          return res.json({ response: error, success: false, "message": "Server Error" });
                                       })
                                    }).catch(async error => {
                                       await session.abortTransaction();
                                       await session.endSession();
                                       logger.error('place-bet-error: DBError', error);
                                       //   io.to(socket.id).emit("transaction-status", { message: "Error in update transaction", success: false, data: error });
                                       return res.json({ response: error, success: false, "message": "Server Error" });
                                    })
                                 }
                              }).catch(async error => {
                                 await session.abortTransaction();
                                 await session.endSession();
                                 logger.error('place-bet-error: DBError', error);
                                 // io.to(socket.id).emit("transaction-status", { message: "Error in update transaction", success: false, data: error });
                                 return res.json({ response: {}, success: false, "message": "Parent User Not Found" });
                              })
                        }).catch(async error => {
                           await session.abortTransaction();
                           await session.endSession();
                           logger.error('place-bet-error: DBError', error);
                           //  io.to(socket.id).emit("transaction-status", { message: "User not Found", success: false, data: error });
                           return res.json({ response: {}, success: false, "message": "User Not Found" });
                        })
                  }
               });
         } else {
            console.log("oreder Id Blank");
            return res.json({ response: [], success: false, "message": "oreder Id Blank" });
            return;
         }
      }

      // res.send({ response: req.body, success: true, message: "success" });
   }
   catch (error) {
      console.log(error)
      res.send({ error, success: false, message: "Unknown error" });
   }
}

module.exports.newRazorTransactions = async (req, res) => {
   const session = await mongoose.startSession({
      readPreference: 'primary',
      readConcern: { level: 'majority' },
      writeConcern: { w: 'majority' },
   });
   try {
      await session.startTransaction();
      // console.log(req.body)

      if (req.body.payload.payment.entity) {
         console.log(req.body.payload.payment.entity);
         var RazorResponse = req.body.payload.payment.entity;

         let name;
         let message;
         let balance;
         let exposure;
         // console.log("RazorResponse.order_id",RazorResponse.order_id);
         if (RazorResponse.order_id) {
            await Payment.
               findOne({ orderId: RazorResponse.order_id }).
               populate('sites').
               exec(async function (err, data) {
                  // console.log(err)
                  // console.log(data.userId)

                  let user = await User.findOne({ _id: data.userId });

                  let sitename, siteurl;
                  if (data.sites) {
                     sitename = data.sites.name;
                     siteurl = data.sites.url;
                  }
                  let notificationCount = user.notificationCount + 1;

                  if (RazorResponse.status == "failed") {

                     // console.log("failed",RazorResponse.status)

                     name = 'Wallet Deposit Request Declined!';
                     message = `Your request for the wallet deposit of ${data.amount} coins has been declined. Please check the reason and let us know if you need any further assistance.`;
                     balance = user.balance;
                     exposure = parseInt(user.exposure) - parseInt(data.amount);

                     Payment.updateOne({
                        'orderId': RazorResponse.order_id
                     }, { status: "Decline", remarks: data.remarks, balance: balance, approvedBy: user.ParentUser }, function (err, updateMessage) {

                        const notification = new Notification({
                           userId: data.userId,
                           amount: data.amount,
                           name: name,
                           message: message,
                           remarks: data.remarks,
                           status: "Decline",
                           sitename: sitename,
                           siteurl: siteurl,
                           payment: data._id
                        });
                        notification.save()
                           .then(async doc => {
                              let userdata = await User.findOne({ _id: data.userId });
                              res.send({ response: req.body, success: true, message: "success" });
                              //      io.to(socket.id).emit("transaction-status", { message: "Transaction Updated Successfully", success: true, data: doc });
                              //      io.emit("get-notification", { message: name, success: true, data: doc });
                              //      io.emit("user-notification-count", { message: "Notification Count", success: true, data: userdata.notificationCount, userId: userdata._id });
                           })
                           .catch(error => {
                              return res.json({ response: error, success: false, "message": "Server Error" });
                              //   io.to(socket.id).emit("transaction-status", { message: "Error in update transaction", success: false, data: error });
                           })
                     });


                  } else if (RazorResponse.status == "captured") {

                     // console.log("captured",RazorResponse.status)



                     await User.findOne({ _id: data.userId },
                        {
                           _id: 1, username: 1, bounsStatus: 1, bounsBalance: 1, balance: 1, manager: 1, master: 1, subadmin: 1, admin: 1, Parentrole: 1, managerId: 1, masterId: 1, subadminId: 1, adminId: 1, ParentId: 1, availableAmount: 1, exposure: 1, limit: 1, manager: 1, ParentUser: 1
                        }).then(async dbUser => {
                           await User.findOne({ _id: dbUser.ParentId, },
                              {
                                 _id: 1, username: 1, balance: 1, manager: 1, master: 1, subadmin: 1, admin: 1, managerId: 1, masterId: 1, subadminId: 1, adminId: 1, ParentId: 1, Parentrole: 1, ParentUser: 1, availableAmount: 1, exposure: 1, limit: 1
                              }).then(async dbMUser => {
                                 dbMUser.availableAmount = dbMUser.availableAmount - data.amount;
                                 var date = moment().tz("Asia/Calcutta").format('YYYY-MM-DD');
                                 if (dbMUser.availableAmount < 0) {
                                    await session.abortTransaction();
                                    await session.endSession();
                                    console.log("Your balance is low, please contact upline.")
                                    // return res.json({ response: [], success: false, "message": " Your balance is low, please contact upline." });
                                    //  io.to(socket.id).emit("transaction-status", { message: "Your balance is low, please contact upline", success: false });
                                 } else {

                                    name = 'Wallet Deposit Request Approved!';
                                    message = `Your wallet deposit request has been approved. We have deposited ${data.amount} coins to your wallet. Have fun with ${dbMUser.username}. `;
                                    balance = parseInt(user.balance) + parseInt(data.amount);
                                    exposure = parseInt(user.exposure) - parseInt(data.amount);

                                    console.log("dbUser.bounsStatus", dbUser.bounsStatus)

                                    if (dbUser.bounsStatus == 0) {
                                       console.log(data.amount)
                                       var getBonus = await Bonus.findOne({ minAmount: { $lte: data.amount }, status: "active" }, { bonusValue: 1 }).sort({ minAmount: -1 });
                                       console.log(getBonus)
                                       if (getBonus) {
                                          bounsAmount = getBonus.bonusValue;
                                          depositBonus(dbUser._id, bounsAmount, session);
                                       }
                                    }


                                    await User.updateOne({
                                       '_id': dbUser._id
                                    }, {
                                       $inc: {
                                          balance: data.amount,
                                          availableAmount: data.amount,
                                          limit: data.amount
                                       },
                                       bounsStatus: 1
                                    }).session(session).then(async (row1) => {

                                       await User.updateOne({
                                          '_id': dbMUser._id
                                       }, {
                                          $inc: {
                                             balance: -1 * data.amount,
                                             availableAmount: -1 * data.amount,
                                             limit: -1 * data.amount
                                          }
                                       }).session(session).then(async (row) => {

                                          var newlimit = parseFloat(dbUser.limit) + parseFloat(data.amount);
                                          var newAvAmount = parseFloat(dbUser.availableAmount) + parseFloat(data.amount);
                                          var oldlimit = dbUser.limit;
                                          var oldAvAmount = dbUser.availableAmount;
                                          var logSave = new Log();
                                          logSave.username = dbUser.username;
                                          logSave.userId = dbUser._id;
                                          logSave.action = 'BALANCE';
                                          logSave.subAction = 'BALANCE_DEPOSIT';
                                          logSave.oldLimit = dbUser.limit;
                                          logSave.amount = data.amount;
                                          logSave.availableAmount = newAvAmount;
                                          logSave.newLimit = newlimit;
                                          logSave.mnewLimit = dbMUser.balance;
                                          logSave.description = 'Balance updated. Old Limit: ' + oldlimit + ' . New Limit: ' + newlimit;
                                          logSave.manager = dbUser.manager;
                                          logSave.master = dbUser.master;
                                          logSave.subadmin = dbUser.subadmin;
                                          logSave.admin = dbUser.admin;
                                          logSave.ParentUser = dbUser.ParentUser;
                                          logSave.managerId = dbUser.managerId;
                                          logSave.masterId = dbUser.masterId;
                                          logSave.subadminId = dbUser.subadminId;
                                          logSave.adminId = dbUser.adminId;
                                          logSave.ParentId = dbUser.ParentId;
                                          logSave.Parentrole = dbUser.Parentrole;
                                          logSave.remark = req.remark;
                                          logSave.time = new Date();
                                          logSave.datetime = Math.round(+new Date() / 1000);
                                          logSave.deleted = false;
                                          logSave.createDate = date;
                                          logSave.from = dbUser.ParentUser;
                                          logSave.to = dbUser.username;
                                          //console.log(log);
                                          Log.create([logSave], { session }).then(async logsave => {

                                             var Mnewlimit = parseFloat(dbMUser.limit) - parseFloat(data.amount);
                                             var MnewAvAmount = parseFloat(dbMUser.availableAmount) - parseFloat(data.amount);
                                             var Moldlimit = dbMUser.limit;
                                             var MoldAvAmount = dbMUser.availableAmount;
                                             var LogM = new Log();
                                             LogM.username = dbMUser.username;
                                             LogM.userId = dbMUser._id;
                                             LogM.action = 'BALANCE';
                                             LogM.subAction = 'BALANCE_WITHDRAWL';
                                             LogM.oldLimit = Moldlimit;
                                             LogM.amount = -1 * data.amount;
                                             LogM.availableAmount = MnewAvAmount;
                                             LogM.newLimit = Mnewlimit;
                                             LogM.description = 'Balance updated. Old Limit: ' + Moldlimit + ' . New Limit: ' + Mnewlimit;
                                             LogM.remark = data.remark;
                                             LogM.time = new Date();
                                             LogM.datetime = Math.round(+new Date() / 1000);
                                             LogM.createDate = date;
                                             LogM.deleted = false;
                                             LogM.manager = dbMUser.manager;
                                             LogM.master = dbMUser.master;
                                             LogM.subadmin = dbMUser.subadmin;
                                             LogM.admin = dbMUser.admin;
                                             LogM.ParentUser = dbMUser.ParentUser;
                                             LogM.managerId = dbMUser.managerId;
                                             LogM.masterId = dbMUser.masterId;
                                             LogM.subadminId = dbMUser.subadminId;
                                             LogM.adminId = dbMUser.adminId;
                                             LogM.ParentId = dbMUser.ParentId;
                                             LogM.Parentrole = dbMUser.Parentrole;
                                             LogM.from = dbUser.ParentUser;
                                             LogM.to = dbUser.username;
                                             Log.create([LogM], { session }).then(async logm => {
                                                await session.commitTransaction();
                                                await session.endSession();

                                                Payment.updateOne({
                                                   'orderId': RazorResponse.order_id
                                                }, { status: "Approved", remarks: data.remarks, balance: balance, approvedBy: dbMUser.username }, function (err, updateMessage) {

                                                   const notification = new Notification({
                                                      userId: data.userId,
                                                      amount: data.amount,
                                                      name: name,
                                                      message: message,
                                                      remarks: data.remarks,
                                                      status: "Approved",
                                                      sitename: sitename,
                                                      siteurl: siteurl,
                                                      payment: data._id
                                                   });
                                                   notification.save()
                                                      .then(async doc => {
                                                         let userdata = await User.findOne({ _id: data.userId });

                                                         // Push Notification Start

                                                         var name = 'Wallet Deposit Request Approved!';
                                                         var message = `Your wallet deposit request has been approved. We have deposited ${data.amount} coins to your wallet. Have fun with ${dbMUser.username}. `;

                                                         var datapush = {
                                                            app_id: "047ed5ed-a6ce-4c14-990d-6e956b6402de",
                                                            contents: { "en": message },
                                                            headings: { "en": name },
                                                            big_picture: "https://blog.taskpigeon.co/wp-content/uploads/2017/06/Advanced-Email-Notifications-Task-Pigeon.jpg",
                                                            url: "",
                                                            include_player_ids: [user.deviceId]
                                                         };

                                                         var headers = {
                                                            "Content-Type": "application/json; charset=utf-8",
                                                            "Authorization": "Basic MjNhMTlkNWMtYmJmOS00MTA3LWJiNzQtNjI4MjE0N2NjYWU2"
                                                         };

                                                         var options = {
                                                            host: "onesignal.com",
                                                            port: 443,
                                                            path: "/api/v1/notifications",
                                                            method: "POST",
                                                            headers: headers
                                                         };


                                                         var https = require('https');
                                                         var requestpush = https.request(options, function (res) {
                                                            res.on('data', function (datapush) {
                                                               console.log("Response:");
                                                               // console.log(JSON.parse(datapush));
                                                               // socket.emit('push-message-success', { 'message': 'push message set successfully' });
                                                            });
                                                         });

                                                         requestpush.on('error', function (e) {
                                                            console.log("ERROR:");
                                                            // socket.emit('push-message-success', { 'message': 'push message set successfully' });
                                                            console.log(e);
                                                         });

                                                         requestpush.write(JSON.stringify(datapush));
                                                         requestpush.end();

                                                         // Push Notification End

                                                         res.send({ response: req.body, success: true, message: "success" });
                                                         //      io.to(socket.id).emit("transaction-status", { message: "Transaction Updated Successfully", success: true, data: doc });
                                                         //      io.emit("get-notification", { message: name, success: true, data: doc });
                                                         //      io.emit("user-notification-count", { message: "Notification Count", success: true, data: userdata.notificationCount, userId: userdata._id });
                                                      })
                                                      .catch(error => {
                                                         return res.json({ response: error, success: false, "message": "Server Error" });
                                                         //   io.to(socket.id).emit("transaction-status", { message: "Error in update transaction", success: false, data: error });
                                                      })
                                                });
                                             }).catch(async error => {
                                                await session.abortTransaction();
                                                await session.endSession();
                                                logger.error('place-bet-error: DBError', error);
                                                //   io.to(socket.id).emit("transaction-status", { message: "Error in update transaction", success: false, data: error });
                                                return res.json({ response: error, success: false, "message": "Server Error" });
                                             })
                                          });
                                       }).catch(async error => {
                                          await session.abortTransaction();
                                          await session.endSession();
                                          logger.error('place-bet-error: DBError', error);
                                          // io.to(socket.id).emit("transaction-status", { message: "Error in update transaction", success: false, data: error });
                                          return res.json({ response: error, success: false, "message": "Server Error" });
                                       })
                                    }).catch(async error => {
                                       await session.abortTransaction();
                                       await session.endSession();
                                       logger.error('place-bet-error: DBError', error);
                                       //   io.to(socket.id).emit("transaction-status", { message: "Error in update transaction", success: false, data: error });
                                       return res.json({ response: error, success: false, "message": "Server Error" });
                                    })
                                 }
                              }).catch(async error => {
                                 await session.abortTransaction();
                                 await session.endSession();
                                 logger.error('place-bet-error: DBError', error);
                                 // io.to(socket.id).emit("transaction-status", { message: "Error in update transaction", success: false, data: error });
                                 return res.json({ response: {}, success: false, "message": "Parent User Not Found" });
                              })
                        }).catch(async error => {
                           await session.abortTransaction();
                           await session.endSession();
                           logger.error('place-bet-error: DBError', error);
                           //  io.to(socket.id).emit("transaction-status", { message: "User not Found", success: false, data: error });
                           return res.json({ response: {}, success: false, "message": "User Not Found" });
                        })
                  }
               });
         } else {
            console.log("oreder Id Blank");
            return res.json({ response: [], success: false, "message": "oreder Id Blank" });
            return;
         }
      }

      // res.send({ response: req.body, success: true, message: "success" });
   }
   catch (error) {
      console.log(error)
      res.send({ error, success: false, message: "Unknown error" });
   }
}

///////////  --------- SOCKET ----------- /////////////////
module.exports.userlogin = function (io, socket, request) {
   // Validate request data
   // console.log(request.user);
   if (!request) return;
   if (!request.user) return;
   if (!request.user.username) return;
   if (!request.user.password) return;

   console.log(request.user);

   // console.log("login: " + JSON.stringify(request),request.user.username.toUpperCase());

   var output = {};
   User.findOne({
      username: request.user.username.toUpperCase()
   }, async function (err, user) {

      // console.log(user);

      if (err) logger.debug(err);
      // Check username

      if (!user) {
         logger.error('login-error: User not found ' + request.user.username);
         socket.emit('login-success', {
            "message": "User not found",
            success: false
         });
         return;
      }
      if (user.role == "user") {
         logger.error('login-error: User not found ' + request.user.username);
         socket.emit('login-success', {
            "message": "User not found",
            success: false
         });
         return;
      }


      // Check password
      if (!user.validPassword(request.user.password)) {
         user.loginAttempts += 1;
         logger.error('login-error: Invalid password ' + request.user.username);
         socket.emit('login-success', {
            "message": "Invalid password",
            success: false
         });
         return;
      }
      // Reset login attempts counter
      user.loginAttempts = 0;
      // user.save(function (err, updatedUser) { });

      // Check deleted or blocked account
      if (user.status != 'active') {
         logger.error('login-error: Account is blocked or deleted' + request.user.username);
         socket.emit('login-success', {
            "message": "Account is not accessible anymore. Contact the admin to activate the account.",
            success: false
         });
         return;
      }
      //('login: ' + user.username + ' logged in.');
      // Send user details to client
      // User.findOne({
      //    username: user.username,
      //    manager: user.manager
      // },{}, function (err, userDetails) {
      //    if (err || !userDetails) {
      //       logger.error('login: DBError in finding user details.');
      //       return;
      //    }

      var oldtoken = user.token;

      if (user.role == "partner") {
         console.log("user.partnerWith", user.partnerWith);
         var ParentUser = await User.findOne({ _id: user.partnerWith }, { _id: 1, hash: 1, token: 1, username: 1, role: 1, manager: 1, admin: 1, master: 1, subadmin: 1, status: 1, commissionsetting: 1, partnershipsetting: 1, ParentUser: 1, transctionpasswordstatus: 1 })

         var userDetails = {
            username: ParentUser.username,
            role: ParentUser.role,
            manager: ParentUser.manager,
            admin: ParentUser.admin,
            master: ParentUser.master,
            subadmin: ParentUser.subadmin,
            status: ParentUser.status,
            commissionsetting: ParentUser.commissionsetting,
            partnershipsetting: ParentUser.partnershipsetting,
            ParentUser: ParentUser.ParentUser,
            availableEventTypes: ParentUser.availableEventTypes,
            transctionpasswordstatus: ParentUser.transctionpasswordstatus
         };
         // const token = Helper.generateToken(user._id);
         // user.token = token;
         // user.save(function (err, updatedUser) { });



         User.updateOne({ _id: user._id }, { token: ParentUser.token })
            .then(users => {
               output._id = ParentUser._id;
               output.key = ParentUser.hash;
               output.apitoken = ParentUser.token;
               output.verifytoken = ParentUser.token;
               output.username = user.username;
               output.role = user.role;
               output.details = userDetails;
               console.log("login succes");
               io.emit("login-check", { output: oldtoken, success: true });
               socket.emit("login-success", { output: output, success: true });
            })

      } else {

         var userDetails = {
            username: user.username,
            role: user.role,
            manager: user.manager,
            admin: user.admin,
            master: user.master,
            subadmin: user.subadmin,
            status: user.status,
            commissionsetting: user.commissionsetting,
            partnershipsetting: user.partnershipsetting,
            ParentUser: user.ParentUser,
            availableEventTypes: user.availableEventTypes,
            transctionpasswordstatus: user.transctionpasswordstatus

         };
         const token = Helper.generateToken(user._id);
         user.token = token;
         console.log(token)
         User.updateOne({ _id: user._id }, { token: token })
            .then(users => {
               output._id = user._id;
               output.key = user.hash;
               output.apitoken = token;
               output.verifytoken = token;
               output.username = user.username;
               output.role = user.role;
               output.details = userDetails;
               console.log("login succes");
               io.emit("login-check", { output: oldtoken, success: true });
               socket.emit("login-success", { output: output, success: true });
            }).catch(async error => {
               console.log(error);
            })

         // user.save(function (err, updatedUser) { });
         // output._id = user._id;
         // output.key = user.hash;
         // output.apitoken = token;
         // output.verifytoken = token;
         // output.username = user.username;
         // output.role = user.role;
         // output.details = userDetails;
      }


      // // console.log(oldtoken)
      // io.emit("login-check", {
      //    output: oldtoken
      // });

      // socket.emit("login-success", {
      //    output: output
      // });
      // Todo: send updated active users to manager and admin
      // Delete existing session and create new one
      Session.findOne({
         username: user.username,
         manager: user.manager
      }, function (err, session) {
         if (err) logger.debug(err);
         if (!session) {
            // Create new session
            var newSession = new Session();
            newSession.socket = socket.id;
            newSession.username = user.username;
            newSession.role = user.role;
            newSession.manager = user.manager;
            newSession.image = userDetails.image;
            newSession.headers = socket.handshake.headers;
            newSession.lastLogin = new Date();
            newSession.online = true;
            newSession.save(function (err, newUpdatedSession) {
               if (err) logger.debug(err);
            });
         } else {
            // Send session updating notification
            io.to(session.socket).emit('session-expired', {
               session: session
            });
            socket.emit('multiple-login', {
               session: session
            });

            // Update session
            session.socket = socket.id;
            session.headers = socket.handshake.headers;
            session.lastLogin = new Date();
            session.save(function (err, updatedSession) {
               if (err) {
                  logger.error(err);
               }
            });
         }
      });
      // });
   });
};

module.exports.createUser = async function (io, socket, req) {
   // - validate request data
   // console.log(request);return;
   try {
      //   console.log(req)
      // let decoded = jwt.verify(req.token, myEnv.parsed.SECRET);
      let { userId } = jwt.decode(req.token);
      let dbAdmin = await User.findOne({ _id: userId, token: req.token });
      if (!dbAdmin) return io.to(socket.id).emit('logout');
      if (dbAdmin.token != req.token) return io.to(socket.id).emit('logout');
      logger.info("createUser: " + JSON.stringify(req));

      if (req.newUser.role == 'user') {

         // if (request.details.role != 'manager') {
         //    socket.emit("create-user-success", {
         //       "message": "Not Authorized.",
         //       success: false
         //    });
         //    return;
         // }
         // console.log(dbAdmin);

         if (!dbAdmin.validTransPassword(req.transpassword)) {
            dbAdmin.loginAttempts += 1;
            logger.error('create-user-success: Invalid Transaction password ' + dbAdmin.username);
            socket.emit('create-user-success', {
               "message": "Invalid Transaction password",
               success: false
            });
            return;
         }

         User.findOne({
            username: req.newUser.username.toUpperCase()
         }, async function (err, usersCheck) {
            if (err) logger.error(err);
            if (usersCheck) {
               logger.error('create-user-success: User already exists');
               socket.emit("create-user-success", {
                  "message": "User already exists",
                  success: false,
                  user: usersCheck
               });
               return;
            }

            var mgrprtnrsp = {};
            var mgrcmsn = {};
            var mstrprtnrsp = {};
            var mstrcmsn = {};
            var sbadmnprtnrsp = {};
            var sbadmncmsn = {};
            var admprtnrsp = {};
            var admcmsn = {};
            var superadmprtnrsp = {};
            var superadmcmsn = {};
            var techadmprtnrsp = {};
            var techadmcmsn = {};

            var managerId = ""; var masterId = ""; var subadminId = ""; var adminId = ""; var superadminId = ""; var techadminId = "";
            var manager = ""; var master = ""; var subadmin = ""; var admin = ""; var superadmin = ""; var techadmin = "";
            var SuperadminP = await User.findOne({ _id: dbAdmin.superadminId }, { partnershipsetting: 1, commissionsetting: 1 }).lean();

            // console.log(dbAdmin.role);
            if (dbAdmin.role == "manager") {
               console.log("manager");
               var adminP = await User.findOne({ _id: dbAdmin.adminId }, { partnershipsetting: 1, commissionsetting: 1 }).lean();
               if (dbAdmin.subadminId != "") {
                  var SubadminP = await User.findOne({ _id: dbAdmin.subadminId }, { partnershipsetting: 1, commissionsetting: 1 }).lean();
               } else {
                  var SubadminP = dbAdmin.subadminId;
               }
               if (dbAdmin.masterId != "") {
                  var MasterP = await User.findOne({ _id: dbAdmin.masterId }, { partnershipsetting: 1, commissionsetting: 1 }).lean();
               } else {
                  var MasterP = dbAdmin.masterId;
               }
               for (var k = 0; k < dbAdmin.partnershipsetting.length; k++) {
                  mgrprtnrsp[dbAdmin.partnershipsetting[k].sport_id] = dbAdmin.partnershipsetting[k].partnership;
                  mgrcmsn[dbAdmin.partnershipsetting[k].sport_id] = dbAdmin.commissionsetting[k].commission;
                  if (MasterP) {
                     if (SubadminP) {
                        mstrprtnrsp[dbAdmin.partnershipsetting[k].sport_id] = MasterP.partnershipsetting[k].partnership - dbAdmin.partnershipsetting[k].partnership;
                        mstrcmsn[dbAdmin.partnershipsetting[k].sport_id] = MasterP.commissionsetting[k].commission - dbAdmin.commissionsetting[k].commission;
                        sbadmnprtnrsp[dbAdmin.partnershipsetting[k].sport_id] = SubadminP.partnershipsetting[k].partnership - MasterP.partnershipsetting[k].partnership;
                        sbadmncmsn[dbAdmin.partnershipsetting[k].sport_id] = SubadminP.commissionsetting[k].commission - MasterP.commissionsetting[k].commission;
                        admprtnrsp[dbAdmin.partnershipsetting[k].sport_id] = adminP.partnershipsetting[k].partnership - SubadminP.partnershipsetting[k].partnership;
                        admcmsn[dbAdmin.partnershipsetting[k].sport_id] = adminP.commissionsetting[k].commission - SubadminP.commissionsetting[k].commission;
                        superadmprtnrsp[dbAdmin.partnershipsetting[k].sport_id] = SuperadminP.partnershipsetting[k].partnership - adminP.partnershipsetting[k].partnership;
                        superadmcmsn[dbAdmin.partnershipsetting[k].sport_id] = SuperadminP.commissionsetting[k].commission - adminP.commissionsetting[k].commission;
                        techadmprtnrsp[dbAdmin.partnershipsetting[k].sport_id] = 100 - SuperadminP.partnershipsetting[k].partnership;
                        techadmcmsn[dbAdmin.partnershipsetting[k].sport_id] = 100 - SuperadminP.commissionsetting[k].commission;
                     } else {
                        mstrprtnrsp[dbAdmin.partnershipsetting[k].sport_id] = MasterP.partnershipsetting[k].partnership - dbAdmin.partnershipsetting[k].partnership;
                        mstrcmsn[dbAdmin.partnershipsetting[k].sport_id] = MasterP.commissionsetting[k].commission - dbAdmin.commissionsetting[k].commission;
                        sbadmnprtnrsp[dbAdmin.partnershipsetting[k].sport_id] = 0;
                        sbadmncmsn[dbAdmin.partnershipsetting[k].sport_id] = 0;
                        admprtnrsp[dbAdmin.partnershipsetting[k].sport_id] = adminP.partnershipsetting[k].partnership - MasterP.partnershipsetting[k].partnership;
                        admcmsn[dbAdmin.partnershipsetting[k].sport_id] = adminP.commissionsetting[k].commission - MasterP.commissionsetting[k].commission;
                        superadmprtnrsp[dbAdmin.partnershipsetting[k].sport_id] = SuperadminP.partnershipsetting[k].partnership - adminP.partnershipsetting[k].partnership;
                        superadmcmsn[dbAdmin.partnershipsetting[k].sport_id] = SuperadminP.commissionsetting[k].commission - adminP.commissionsetting[k].commission;
                        techadmprtnrsp[dbAdmin.partnershipsetting[k].sport_id] = 100 - SuperadminP.partnershipsetting[k].partnership;
                        techadmcmsn[dbAdmin.partnershipsetting[k].sport_id] = 100 - SuperadminP.commissionsetting[k].commission;
                     }
                  } else {
                     if (SubadminP) {
                        mstrprtnrsp[dbAdmin.partnershipsetting[k].sport_id] = 0;
                        mstrcmsn[dbAdmin.partnershipsetting[k].sport_id] = 0;
                        sbadmnprtnrsp[dbAdmin.partnershipsetting[k].sport_id] = SubadminP.partnershipsetting[k].partnership - dbAdmin.partnershipsetting[k].partnership;
                        sbadmncmsn[dbAdmin.partnershipsetting[k].sport_id] = SubadminP.commissionsetting[k].commission - dbAdmin.commissionsetting[k].commission;
                        admprtnrsp[dbAdmin.partnershipsetting[k].sport_id] = adminP.partnershipsetting[k].partnership - SubadminP.partnershipsetting[k].partnership;
                        admcmsn[dbAdmin.partnershipsetting[k].sport_id] = adminP.commissionsetting[k].commission - SubadminP.commissionsetting[k].commission;
                        superadmprtnrsp[dbAdmin.partnershipsetting[k].sport_id] = SuperadminP.partnershipsetting[k].partnership - adminP.partnershipsetting[k].partnership;
                        superadmcmsn[dbAdmin.partnershipsetting[k].sport_id] = SuperadminP.commissionsetting[k].commission - adminP.commissionsetting[k].commission;
                        techadmprtnrsp[dbAdmin.partnershipsetting[k].sport_id] = 100 - SuperadminP.partnershipsetting[k].partnership;
                        techadmcmsn[dbAdmin.partnershipsetting[k].sport_id] = 100 - SuperadminP.commissionsetting[k].commission;
                     } else {
                        mstrprtnrsp[dbAdmin.partnershipsetting[k].sport_id] = 0;
                        mstrcmsn[dbAdmin.partnershipsetting[k].sport_id] = 0;
                        sbadmnprtnrsp[dbAdmin.partnershipsetting[k].sport_id] = 0;
                        sbadmncmsn[dbAdmin.partnershipsetting[k].sport_id] = 0;
                        admprtnrsp[dbAdmin.partnershipsetting[k].sport_id] = adminP.partnershipsetting[k].partnership - dbAdmin.partnershipsetting[k].partnership;
                        admcmsn[dbAdmin.partnershipsetting[k].sport_id] = adminP.commissionsetting[k].commission - dbAdmin.commissionsetting[k].commission;
                        superadmprtnrsp[dbAdmin.partnershipsetting[k].sport_id] = SuperadminP.partnershipsetting[k].partnership - adminP.partnershipsetting[k].partnership;
                        superadmcmsn[dbAdmin.partnershipsetting[k].sport_id] = SuperadminP.commissionsetting[k].commission - adminP.commissionsetting[k].commission;
                        techadmprtnrsp[dbAdmin.partnershipsetting[k].sport_id] = 100 - SuperadminP.partnershipsetting[k].partnership;
                        techadmcmsn[dbAdmin.partnershipsetting[k].sport_id] = 100 - SuperadminP.commissionsetting[k].commission;
                     }
                  }
               }
               managerId = dbAdmin._id;
               manager = dbAdmin.username;
               masterId = dbAdmin.masterId;
               master = dbAdmin.master;
               subadminId = dbAdmin.subadminId;
               subadmin = dbAdmin.subadmin;
               adminId = dbAdmin.adminId;
               admin = dbAdmin.admin;
               superadminId = dbAdmin.superadminId;
               superadmin = dbAdmin.superadmin;
               techadminId = dbAdmin.techadminId;
               techadmin = dbAdmin.techadmin;
            } else if (dbAdmin.role == "master") {
               console.log("master");
               var adminP = await User.findOne({ _id: dbAdmin.adminId }, { partnershipsetting: 1, commissionsetting: 1 }).lean();
               if (dbAdmin.subadminId != "") {
                  var SubadminP = await User.findOne({ _id: dbAdmin.subadminId }, { partnershipsetting: 1, commissionsetting: 1 }).lean();
               } else {
                  var SubadminP = dbAdmin.subadminId;
               }

               for (var k = 0; k < dbAdmin.partnershipsetting.length; k++) {
                  mgrprtnrsp[dbAdmin.partnershipsetting[k].sport_id] = 0;
                  mgrcmsn[dbAdmin.partnershipsetting[k].sport_id] = 0;
                  mstrprtnrsp[dbAdmin.partnershipsetting[k].sport_id] = dbAdmin.partnershipsetting[k].partnership;
                  mstrcmsn[dbAdmin.partnershipsetting[k].sport_id] = dbAdmin.commissionsetting[k].commission;
                  if (SubadminP) {
                     sbadmnprtnrsp[dbAdmin.partnershipsetting[k].sport_id] = SubadminP.partnershipsetting[k].partnership - dbAdmin.partnershipsetting[k].partnership;
                     sbadmncmsn[dbAdmin.partnershipsetting[k].sport_id] = SubadminP.commissionsetting[k].commission - dbAdmin.commissionsetting[k].commission;
                     admprtnrsp[dbAdmin.partnershipsetting[k].sport_id] = adminP.partnershipsetting[k].partnership - SubadminP.partnershipsetting[k].partnership;
                     admcmsn[dbAdmin.partnershipsetting[k].sport_id] = adminP.commissionsetting[k].commission - SubadminP.commissionsetting[k].commission;
                     superadmprtnrsp[dbAdmin.partnershipsetting[k].sport_id] = SuperadminP.partnershipsetting[k].partnership - adminP.partnershipsetting[k].partnership;
                     superadmcmsn[dbAdmin.partnershipsetting[k].sport_id] = SuperadminP.commissionsetting[k].commission - adminP.commissionsetting[k].commission;
                     techadmprtnrsp[dbAdmin.partnershipsetting[k].sport_id] = 100 - SuperadminP.partnershipsetting[k].partnership;
                     techadmcmsn[dbAdmin.partnershipsetting[k].sport_id] = 100 - SuperadminP.commissionsetting[k].commission;
                  } else {
                     sbadmnprtnrsp[dbAdmin.partnershipsetting[k].sport_id] = 0;
                     sbadmncmsn[dbAdmin.partnershipsetting[k].sport_id] = 0;
                     admprtnrsp[dbAdmin.partnershipsetting[k].sport_id] = adminP.partnershipsetting[k].partnership - dbAdmin.partnershipsetting[k].partnership;
                     admcmsn[dbAdmin.partnershipsetting[k].sport_id] = adminP.commissionsetting[k].commission - dbAdmin.commissionsetting[k].commission;
                     superadmprtnrsp[dbAdmin.partnershipsetting[k].sport_id] = SuperadminP.partnershipsetting[k].partnership - adminP.partnershipsetting[k].partnership;
                     superadmcmsn[dbAdmin.partnershipsetting[k].sport_id] = SuperadminP.commissionsetting[k].commission - adminP.commissionsetting[k].commission;
                     techadmprtnrsp[dbAdmin.partnershipsetting[k].sport_id] = 100 - SuperadminP.partnershipsetting[k].partnership;
                     techadmcmsn[dbAdmin.partnershipsetting[k].sport_id] = 100 - SuperadminP.commissionsetting[k].commission;
                  }
               }
               masterId = dbAdmin._id;
               master = dbAdmin.username;
               subadminId = dbAdmin.subadminId;
               subadmin = dbAdmin.subadmin;
               adminId = dbAdmin.adminId;
               admin = dbAdmin.admin;
               superadminId = dbAdmin.superadminId;
               superadmin = dbAdmin.superadmin;
               techadminId = dbAdmin.techadminId;
               techadmin = dbAdmin.techadmin;
            } else if (dbAdmin.role == "subadmin") {
               // console.log("subadmin");
               var adminP = await User.findOne({ _id: dbAdmin.adminId }, { partnershipsetting: 1, commissionsetting: 1 }).lean();
               for (var k = 0; k < dbAdmin.partnershipsetting.length; k++) {
                  mgrprtnrsp[dbAdmin.partnershipsetting[k].sport_id] = 0;
                  mgrcmsn[dbAdmin.partnershipsetting[k].sport_id] = 0;
                  mstrprtnrsp[dbAdmin.partnershipsetting[k].sport_id] = 0;
                  mstrcmsn[dbAdmin.partnershipsetting[k].sport_id] = 0;
                  sbadmnprtnrsp[dbAdmin.partnershipsetting[k].sport_id] = dbAdmin.partnershipsetting[k].partnership;
                  sbadmncmsn[dbAdmin.partnershipsetting[k].sport_id] = dbAdmin.commissionsetting[k].commission;
                  admprtnrsp[dbAdmin.partnershipsetting[k].sport_id] = adminP.partnershipsetting[k].partnership - dbAdmin.partnershipsetting[k].partnership;
                  admcmsn[dbAdmin.partnershipsetting[k].sport_id] = adminP.commissionsetting[k].commission - dbAdmin.commissionsetting[k].commission;
                  superadmprtnrsp[dbAdmin.partnershipsetting[k].sport_id] = SuperadminP.partnershipsetting[k].partnership - adminP.partnershipsetting[k].partnership;
                  superadmcmsn[dbAdmin.partnershipsetting[k].sport_id] = SuperadminP.commissionsetting[k].commission - adminP.commissionsetting[k].commission;
                  techadmprtnrsp[dbAdmin.partnershipsetting[k].sport_id] = 100 - SuperadminP.partnershipsetting[k].partnership;
                  techadmcmsn[dbAdmin.partnershipsetting[k].sport_id] = 100 - SuperadminP.commissionsetting[k].commission;
               }
               subadminId = dbAdmin._id;
               subadmin = dbAdmin.username;
               adminId = dbAdmin.adminId;
               admin = dbAdmin.admin;
               superadminId = dbAdmin.superadminId;
               superadmin = dbAdmin.superadmin;
               techadminId = dbAdmin.techadminId;
               techadmin = dbAdmin.techadmin;
            } else {
               // console.log("admin");
               for (var k = 0; k < dbAdmin.partnershipsetting.length; k++) {
                  mgrprtnrsp[dbAdmin.partnershipsetting[k].sport_id] = 0;
                  mgrcmsn[dbAdmin.partnershipsetting[k].sport_id] = 0;
                  mstrprtnrsp[dbAdmin.partnershipsetting[k].sport_id] = 0;
                  mstrcmsn[dbAdmin.partnershipsetting[k].sport_id] = 0;
                  sbadmnprtnrsp[dbAdmin.partnershipsetting[k].sport_id] = 0;
                  sbadmncmsn[dbAdmin.partnershipsetting[k].sport_id] = 0;
                  admprtnrsp[dbAdmin.partnershipsetting[k].sport_id] = dbAdmin.partnershipsetting[k].partnership;
                  admcmsn[dbAdmin.partnershipsetting[k].sport_id] = dbAdmin.commissionsetting[k].commission;
                  superadmprtnrsp[dbAdmin.partnershipsetting[k].sport_id] = SuperadminP.partnershipsetting[k].partnership - dbAdmin.partnershipsetting[k].partnership;
                  superadmcmsn[dbAdmin.partnershipsetting[k].sport_id] = SuperadminP.commissionsetting[k].commission - dbAdmin.commissionsetting[k].commission;
                  techadmprtnrsp[dbAdmin.partnershipsetting[k].sport_id] = 100 - SuperadminP.partnershipsetting[k].partnership;
                  techadmcmsn[dbAdmin.partnershipsetting[k].sport_id] = 100 - SuperadminP.commissionsetting[k].commission;
               }
               // console.log(admprtnrsp,admcmsn,admprtnrsp['1'],admcmsn['1'])
               adminId = dbAdmin._id;
               admin = dbAdmin.username;
               superadminId = dbAdmin.superadminId;
               superadmin = dbAdmin.superadmin;
               techadminId = dbAdmin.techadminId;
               techadmin = dbAdmin.techadmin;
            }
            // var AdminP = await User.findOne({username: dbAdmin.admin },{partnershipsetting:1,commissionsetting:1})
            // console.log(MasterP, SubadminP)
            var Parentpartnership = [
               {
                  sport_id: 4, sport_name: "cricket", manager: mgrprtnrsp['4'], master: mstrprtnrsp['4'], subadmin: sbadmnprtnrsp['4'], admin: admprtnrsp['4'], superadmin: superadmprtnrsp['4'], techadmin: techadmprtnrsp['4']
               },
               {
                  sport_id: 1, sport_name: "soccer", manager: mgrprtnrsp['1'], master: mstrprtnrsp['1'], subadmin: sbadmnprtnrsp['1'], admin: admprtnrsp['1'], superadmin: superadmprtnrsp['1'], techadmin: techadmprtnrsp['1']
               },
               {
                  sport_id: 2, sport_name: "tennis", manager: mgrprtnrsp['2'], master: mstrprtnrsp['2'], subadmin: sbadmnprtnrsp['2'], admin: admprtnrsp['2'], superadmin: superadmprtnrsp['2'], techadmin: techadmprtnrsp['2']
               },
               {
                  sport_id: 'c9', sport_name: "casino", manager: mgrprtnrsp['c9'], master: mstrprtnrsp['c9'], subadmin: sbadmnprtnrsp['c9'], admin: admprtnrsp['c9'], superadmin: superadmprtnrsp['c9'], techadmin: techadmprtnrsp['c9']
               }
            ];

            var Parentcommission = [
               {
                  sport_id: 4, sport_name: "cricket", manager: mgrcmsn['4'], master: mstrcmsn['4'], subadmin: sbadmncmsn['4'], admin: admcmsn['4'], superadmin: superadmcmsn['4'], techadmin: techadmcmsn['4']
               },
               {
                  sport_id: 1, sport_name: "soccer", manager: mgrcmsn['1'], master: mstrcmsn['1'], subadmin: sbadmncmsn['1'], admin: admcmsn['1'], superadmin: superadmcmsn['2'], techadmin: techadmcmsn['2']
               },
               {
                  sport_id: 2, sport_name: "tennis", manager: mgrcmsn['2'], master: mstrcmsn['2'], subadmin: sbadmncmsn['2'], admin: admcmsn['2'], superadmin: superadmcmsn['1'], techadmin: techadmcmsn['1']
               },
               {
                  sport_id: 'c9', sport_name: "casino", manager: mgrcmsn['c9'], master: mstrcmsn['c9'], subadmin: sbadmncmsn['c9'], admin: admcmsn['c9'], superadmin: superadmcmsn['c9'], techadmin: techadmcmsn['c9']
               }
            ];

            var sportsetting = [
               {
                  sport_id: 4, sport_name: "cricket",
                  min_bet: req.newUser.cricket_min_bet,
                  max_bet: req.newUser.cricket_max_bet,
                  bet_delay: req.newUser.cricket_bet_delay,
               },
               {
                  sport_id: 1, sport_name: "soccer",
                  min_bet: req.newUser.soccer_min_bet,
                  max_bet: req.newUser.soccer_max_bet,
                  bet_delay: req.newUser.soccer_bet_delay,
               },
               {
                  sport_id: 2, sport_name: "tennis",
                  min_bet: req.newUser.tennis_min_bet,
                  max_bet: req.newUser.tennis_max_bet,
                  bet_delay: req.newUser.tennis_bet_delay,
               },
               {
                  sport_id: 'c9', sport_name: "casino", min_bet: 100, max_bet: 50000, bet_delay: 5,
               }
            ];

            //set user details
            var user = new User();
            user.username = req.newUser.username.toUpperCase();
            user.fullname = req.newUser.fullname;
            user.setDefaults();
            user.setPassword(req.newUser.password);
            user.settransPassword(req.newUser.password);
            user.role = req.newUser.role;
            user.status = 'active';
            user.city = req.newUser.city;
            user.mobile = req.newUser.mobile;
            user.exposurelimit = req.newUser.exposurelimit;
            user.creditrefrence = req.newUser.creditrefrence;
            user.manager = manager;
            user.master = master;
            user.subadmin = subadmin;
            user.admin = admin;
            user.superadmin = superadmin;
            user.techadmin = techadmin;
            user.managerId = managerId;
            user.masterId = masterId;
            user.subadminId = subadminId;
            user.adminId = adminId;
            user.superadminId = superadminId;
            user.techadminId = techadminId;
            user.ParentUser = dbAdmin.username;
            user.ParentRole = dbAdmin.role;
            user.ParentId = dbAdmin._id;
            user.casinobalance = 0;
            user.sportsetting = sportsetting;
            user.Parentpartnership = Parentpartnership;
            user.Parentcommission = Parentcommission;
            user.availableEventTypes = dbAdmin.availableEventTypes;
            user.openingDate = new Date();


            //log end
            user.save(function (err) {
               if (err) {
                  logger.error('create-user-success: DBError in UserDetails');
                  console.log(err)
                  socket.emit("create-user-success", {
                     "message": "Error in saving user details.",
                     success: false
                  });
               } else {
                  //log start
                  var log = new Log();
                  log.username = user.username.toUpperCase();
                  log.userId = user._id;
                  log.action = 'ACCOUNT';
                  log.subAction = 'ACCOUNT_CREATE';
                  log.description = 'New account created.';
                  log.manager = manager;
                  log.master = master;
                  log.subadmin = subadmin;
                  log.admin = admin;
                  log.superadmin = superadmin;
                  log.techadmin = techadmin;
                  log.managerId = managerId;
                  log.masterId = masterId;
                  log.subadminId = subadminId;
                  log.adminId = adminId;
                  log.superadminId = superadminId;
                  log.techadminId = techadminId;
                  log.actionBy = dbAdmin.username;
                  log.createdId = dbAdmin._id;
                  log.time = new Date();
                  log.datetime = Math.round(+new Date() / 1000);
                  log.deleted = false;
                  log.save(function (err) {
                     if (err) {
                        console.log(err)
                        logger.error('create-user-error: Log entry failed.');
                     }
                  });
                  // console.log('create-user-success: User account created successfully.');
                  // socket.emit("create-user-success", user);
                  socket.emit("create-user-success", {
                     "message": "User created success",
                     success: true,
                     user: user
                  });
               }
            });
         });

      } else {

         if (req.newUser.role == "superadmin") {
            if (dbAdmin.role != 'techadmin') {
               socket.emit("create-user-success", {
                  "message": "Not Authorized.",
                  success: false
               });
               return;
            }
         }

         if (req.newUser.role == "admin") {
            if (dbAdmin.role != 'superadmin') {
               socket.emit("create-user-success", {
                  "message": "Not Authorized.",
                  success: false
               });
               return;
            }
         }

         if (req.newUser.role == "subadmin") {
            if (dbAdmin.role != 'admin' && dbAdmin.role != 'superadmin') {
               socket.emit("create-user-success", {
                  "message": "Not Authorized.",
                  success: false
               });
               return;
            }
         }

         if (req.newUser.role == "master") {
            if (dbAdmin.role != 'subadmin' && dbAdmin.role != 'admin' && dbAdmin.role != 'superadmin') {
               socket.emit("create-user-success", {
                  "message": "Not Authorized.",
                  success: false
               });
               return;
            }
         }
         if (req.newUser.role == "manager") {
            if (dbAdmin.role != 'master' && dbAdmin.role != 'subadmin' && dbAdmin.role != 'admin' && dbAdmin.role != 'superadmin') {
               socket.emit("create-user-success", {
                  "message": "Not Authorized.",
                  success: false
               });
               return;
            }
         }


         // authenticate admin
         // console.log(dbAdmin);
         if (!dbAdmin.validTransPassword(req.transpassword)) {
            dbAdmin.loginAttempts += 1;
            logger.error('create-user-success: Invalid Transaction password ' + dbAdmin.username);
            // console.log('create-user-success: Invalid Transaction password');
            socket.emit('create-user-success', {
               "message": "Invalid Transaction password",
               success: false
            });
            return;
         }

         User.findOne({
            username: req.newUser.username.toUpperCase()
         }, async function (err, userCheck) {
            if (err) {
               logger.debug(err);
               return;
            }
            if (userCheck) {
               logger.error('create-user-error: User already exists');
               // console.log('User already exists');
               socket.emit("create-user-success", {
                  "message": "User already exists",
                  success: false,
                  user: userCheck
               });
               return;
            } else {

               var commissionsetting = [
                  {
                     sport_id: 4, sport_name: "cricket", commission: req.newUser.cricket_commission
                  },
                  {
                     sport_id: 1, sport_name: "soccer", commission: req.newUser.soccer_commission
                  },
                  {
                     sport_id: 2, sport_name: "tennis", commission: req.newUser.tennis_commission
                  },
                  {
                     sport_id: "c9", sport_name: "casino", commission: req.newUser.cricket_commission
                  }
               ];

               var partnershipsetting = [
                  {
                     sport_id: 4, sport_name: "cricket", partnership: req.newUser.cricket_partnership
                  },
                  {
                     sport_id: 1, sport_name: "soccer", partnership: req.newUser.soccer_partnership
                  },
                  {
                     sport_id: 2, sport_name: "tennis", partnership: req.newUser.tennis_partnership
                  },
                  {
                     sport_id: "c9", sport_name: "casino", partnership: req.newUser.cricket_partnership
                  }
               ];

               var Ownprtnrsp = {};
               var Owncmsn = {};
               var mstrprtnrsp = {};
               var mstrcmsn = {};
               var sbadmnprtnrsp = {};
               var sbadmncmsn = {};
               var admprtnrsp = {};
               var admcmsn = {};
               var superadmprtnrsp = {};
               var superadmcmsn = {};
               var techadmprtnrsp = {};
               var techadmcmsn = {};

               var masterId = ""; var subadminId = ""; var adminId = ""; var superadminId = ""; var techadminId = "";
               var master = ""; var subadmin = ""; var admin = ""; var superadmin = ""; var techadmin = "";

               if (dbAdmin.role == "master") {
                  console.log("master");
                  var SuperadminP = await User.findOne({ _id: dbAdmin.superadminId }, { partnershipsetting: 1, commissionsetting: 1 }).lean();
                  var adminP = await User.findOne({ _id: dbAdmin.adminId }, { partnershipsetting: 1, commissionsetting: 1 }).lean();
                  if (dbAdmin.subadminId != "") {
                     var SubadminP = await User.findOne({ _id: dbAdmin.subadminId }, { partnershipsetting: 1, commissionsetting: 1 }).lean();
                  } else {
                     var SubadminP = dbAdmin.subadminId;
                  }

                  for (var k = 0; k < dbAdmin.partnershipsetting.length; k++) {
                     Ownprtnrsp[dbAdmin.partnershipsetting[k].sport_id] = req.newUser.cricket_partnership;
                     Owncmsn[dbAdmin.partnershipsetting[k].sport_id] = req.newUser.cricket_commission;
                     mstrprtnrsp[dbAdmin.partnershipsetting[k].sport_id] = dbAdmin.partnershipsetting[0].partnership - req.newUser.cricket_partnership;
                     mstrcmsn[dbAdmin.partnershipsetting[k].sport_id] = dbAdmin.commissionsetting[0].commission - req.newUser.cricket_commission;
                     if (SubadminP) {
                        sbadmnprtnrsp[dbAdmin.partnershipsetting[k].sport_id] = SubadminP.partnershipsetting[0].partnership - dbAdmin.partnershipsetting[0].partnership;
                        sbadmncmsn[dbAdmin.partnershipsetting[k].sport_id] = SubadminP.commissionsetting[0].commission - dbAdmin.commissionsetting[0].commission;
                        admprtnrsp[dbAdmin.partnershipsetting[k].sport_id] = adminP.partnershipsetting[0].partnership - SubadminP.partnershipsetting[0].partnership;
                        admcmsn[dbAdmin.partnershipsetting[k].sport_id] = adminP.commissionsetting[0].commission - SubadminP.commissionsetting[0].commission;
                        superadmprtnrsp[dbAdmin.partnershipsetting[k].sport_id] = SuperadminP.partnershipsetting[0].partnership - adminP.partnershipsetting[0].partnership;
                        superadmcmsn[dbAdmin.partnershipsetting[k].sport_id] = SuperadminP.commissionsetting[0].commission - adminP.commissionsetting[0].commission;
                        techadmprtnrsp[dbAdmin.partnershipsetting[k].sport_id] = 100 - SuperadminP.partnershipsetting[0].partnership;
                        techadmcmsn[dbAdmin.partnershipsetting[k].sport_id] = 100 - SuperadminP.commissionsetting[0].commission;
                     } else {
                        sbadmnprtnrsp[dbAdmin.partnershipsetting[k].sport_id] = 0;
                        sbadmncmsn[dbAdmin.partnershipsetting[k].sport_id] = 0;
                        admprtnrsp[dbAdmin.partnershipsetting[k].sport_id] = adminP.partnershipsetting[0].partnership - dbAdmin.partnershipsetting[0].partnership;
                        admcmsn[dbAdmin.partnershipsetting[k].sport_id] = adminP.commissionsetting[0].commission - dbAdmin.commissionsetting[0].commission;
                        superadmprtnrsp[dbAdmin.partnershipsetting[k].sport_id] = SuperadminP.partnershipsetting[0].partnership - adminP.partnershipsetting[0].partnership;
                        superadmcmsn[dbAdmin.partnershipsetting[k].sport_id] = SuperadminP.commissionsetting[0].commission - adminP.commissionsetting[0].commission;
                        techadmprtnrsp[dbAdmin.partnershipsetting[k].sport_id] = 100 - SuperadminP.partnershipsetting[0].partnership;
                        techadmcmsn[dbAdmin.partnershipsetting[k].sport_id] = 100 - SuperadminP.commissionsetting[0].commission;
                     }

                  }
                  masterId = dbAdmin._id;
                  master = dbAdmin.username;
                  subadminId = dbAdmin.subadminId;
                  subadmin = dbAdmin.subadmin;
                  adminId = dbAdmin.adminId;
                  admin = dbAdmin.admin;
                  superadminId = dbAdmin.superadminId;
                  superadmin = dbAdmin.superadmin;
                  techadminId = dbAdmin.techadminId;
                  techadmin = dbAdmin.techadmin;
               } else if (dbAdmin.role == "subadmin") {
                  console.log("subadmin");
                  var adminP = await User.findOne({ _id: dbAdmin.adminId }, { partnershipsetting: 1, commissionsetting: 1 }).lean();
                  var SuperadminP = await User.findOne({ _id: dbAdmin.superadminId }, { partnershipsetting: 1, commissionsetting: 1 }).lean();

                  for (var k = 0; k < dbAdmin.partnershipsetting.length; k++) {
                     Ownprtnrsp[dbAdmin.partnershipsetting[k].sport_id] = req.newUser.cricket_partnership;
                     Owncmsn[dbAdmin.partnershipsetting[k].sport_id] = req.newUser.cricket_commission;
                     mstrprtnrsp[dbAdmin.partnershipsetting[k].sport_id] = 0;
                     mstrcmsn[dbAdmin.partnershipsetting[k].sport_id] = 0;
                     sbadmnprtnrsp[dbAdmin.partnershipsetting[k].sport_id] = dbAdmin.partnershipsetting[0].partnership - req.newUser.cricket_partnership;
                     sbadmncmsn[dbAdmin.partnershipsetting[k].sport_id] = dbAdmin.commissionsetting[0].commission - req.newUser.cricket_commission;
                     admprtnrsp[dbAdmin.partnershipsetting[k].sport_id] = adminP.partnershipsetting[0].partnership - dbAdmin.partnershipsetting[0].partnership;
                     admcmsn[dbAdmin.partnershipsetting[k].sport_id] = adminP.commissionsetting[0].commission - dbAdmin.commissionsetting[0].commission;
                     superadmprtnrsp[dbAdmin.partnershipsetting[k].sport_id] = SuperadminP.partnershipsetting[0].partnership - adminP.partnershipsetting[0].partnership;
                     superadmcmsn[dbAdmin.partnershipsetting[k].sport_id] = SuperadminP.commissionsetting[0].commission - adminP.commissionsetting[0].commission;
                     techadmprtnrsp[dbAdmin.partnershipsetting[k].sport_id] = 100 - SuperadminP.partnershipsetting[0].partnership;
                     techadmcmsn[dbAdmin.partnershipsetting[k].sport_id] = 100 - SuperadminP.commissionsetting[0].commission;
                  }

                  subadminId = dbAdmin._id;
                  subadmin = dbAdmin.username;
                  adminId = dbAdmin.adminId;
                  admin = dbAdmin.admin;
                  superadminId = dbAdmin.superadminId;
                  superadmin = dbAdmin.superadmin;
                  techadminId = dbAdmin.techadminId;
                  techadmin = dbAdmin.techadmin;
               } else if (dbAdmin.role == "admin") {
                  console.log("admin");
                  var SuperadminP = await User.findOne({ _id: dbAdmin.superadminId }, { partnershipsetting: 1, commissionsetting: 1 }).lean();

                  for (var k = 0; k < dbAdmin.partnershipsetting.length; k++) {
                     Ownprtnrsp[dbAdmin.partnershipsetting[k].sport_id] = req.newUser.cricket_partnership;
                     Owncmsn[dbAdmin.partnershipsetting[k].sport_id] = req.newUser.cricket_commission;
                     mstrprtnrsp[dbAdmin.partnershipsetting[k].sport_id] = 0;
                     mstrcmsn[dbAdmin.partnershipsetting[k].sport_id] = 0;
                     sbadmnprtnrsp[dbAdmin.partnershipsetting[k].sport_id] = 0;
                     sbadmncmsn[dbAdmin.partnershipsetting[k].sport_id] = 0;
                     admprtnrsp[dbAdmin.partnershipsetting[k].sport_id] = dbAdmin.partnershipsetting[0].partnership - req.newUser.cricket_partnership;
                     admcmsn[dbAdmin.partnershipsetting[k].sport_id] = dbAdmin.commissionsetting[0].commission - req.newUser.cricket_commission;
                     superadmprtnrsp[dbAdmin.partnershipsetting[k].sport_id] = SuperadminP.partnershipsetting[0].partnership - dbAdmin.partnershipsetting[0].partnership;
                     superadmcmsn[dbAdmin.partnershipsetting[k].sport_id] = SuperadminP.commissionsetting[0].commission - dbAdmin.commissionsetting[0].commission;
                     techadmprtnrsp[dbAdmin.partnershipsetting[k].sport_id] = 100 - SuperadminP.partnershipsetting[0].partnership;
                     techadmcmsn[dbAdmin.partnershipsetting[k].sport_id] = 100 - SuperadminP.commissionsetting[0].commission;
                  }
                  adminId = dbAdmin._id;
                  admin = dbAdmin.username;
                  superadminId = dbAdmin.superadminId;
                  superadmin = dbAdmin.superadmin;
                  techadminId = dbAdmin.techadminId;
                  techadmin = dbAdmin.techadmin;
               } else if (dbAdmin.role == "superadmin") {
                  console.log("superadmin");

                  for (var k = 0; k < dbAdmin.partnershipsetting.length; k++) {
                     Ownprtnrsp[dbAdmin.partnershipsetting[k].sport_id] = req.newUser.cricket_partnership;
                     Owncmsn[dbAdmin.partnershipsetting[k].sport_id] = req.newUser.cricket_commission;
                     mstrprtnrsp[dbAdmin.partnershipsetting[k].sport_id] = 0;
                     mstrcmsn[dbAdmin.partnershipsetting[k].sport_id] = 0;
                     sbadmnprtnrsp[dbAdmin.partnershipsetting[k].sport_id] = 0;
                     sbadmncmsn[dbAdmin.partnershipsetting[k].sport_id] = 0;
                     admprtnrsp[dbAdmin.partnershipsetting[k].sport_id] = 0;
                     admcmsn[dbAdmin.partnershipsetting[k].sport_id] = 0;
                     superadmprtnrsp[dbAdmin.partnershipsetting[k].sport_id] = dbAdmin.partnershipsetting[0].partnership - req.newUser.cricket_partnership;
                     superadmcmsn[dbAdmin.partnershipsetting[k].sport_id] = dbAdmin.commissionsetting[0].commission - req.newUser.cricket_commission;
                     techadmprtnrsp[dbAdmin.partnershipsetting[k].sport_id] = 100 - dbAdmin.partnershipsetting[0].partnership;
                     techadmcmsn[dbAdmin.partnershipsetting[k].sport_id] = 100 - dbAdmin.partnershipsetting[0].partnership;
                  }

                  superadminId = dbAdmin._id;
                  superadmin = dbAdmin.username;
                  techadminId = dbAdmin.techadminId;
                  techadmin = dbAdmin.techadmin;
               } else {
                  console.log("techadmin");
                  for (var k = 0; k < dbAdmin.partnershipsetting.length; k++) {
                     Ownprtnrsp[dbAdmin.partnershipsetting[k].sport_id] = req.newUser.cricket_partnership;
                     Owncmsn[dbAdmin.partnershipsetting[k].sport_id] = req.newUser.cricket_commission;
                     mstrprtnrsp[dbAdmin.partnershipsetting[k].sport_id] = 0;
                     mstrcmsn[dbAdmin.partnershipsetting[k].sport_id] = 0;
                     sbadmnprtnrsp[dbAdmin.partnershipsetting[k].sport_id] = 0;
                     sbadmncmsn[dbAdmin.partnershipsetting[k].sport_id] = 0;
                     admprtnrsp[dbAdmin.partnershipsetting[k].sport_id] = 0;
                     admcmsn[dbAdmin.partnershipsetting[k].sport_id] = 0;
                     superadmprtnrsp[dbAdmin.partnershipsetting[k].sport_id] = 0;
                     superadmcmsn[dbAdmin.partnershipsetting[k].sport_id] = 0;
                     techadmprtnrsp[dbAdmin.partnershipsetting[k].sport_id] = 100 - req.newUser.cricket_partnership;
                     techadmcmsn[dbAdmin.partnershipsetting[k].sport_id] = 100 - req.newUser.cricket_commission;
                  }

                  techadminId = dbAdmin._id;
                  techadmin = dbAdmin.username;
               }

               if (req.newUser.role == "manager") {

                  var Parentpartnership = [
                     {
                        sport_id: 4, sport_name: "cricket", Own: Ownprtnrsp['4'], master: mstrprtnrsp['4'], subadmin: sbadmnprtnrsp['4'], admin: admprtnrsp['4'], superadmin: superadmprtnrsp['4'], techadmin: techadmprtnrsp['4']
                     },
                     {
                        sport_id: 1, sport_name: "soccer", Own: Ownprtnrsp['1'], master: mstrprtnrsp['1'], subadmin: sbadmnprtnrsp['1'], admin: admprtnrsp['1'], superadmin: superadmprtnrsp['1'], techadmin: techadmprtnrsp['1']
                     },
                     {
                        sport_id: 2, sport_name: "tennis", Own: Ownprtnrsp['2'], master: mstrprtnrsp['2'], subadmin: sbadmnprtnrsp['2'], admin: admprtnrsp['2'], superadmin: superadmprtnrsp['2'], techadmin: techadmprtnrsp['2']
                     },
                     {
                        sport_id: 'c9', sport_name: "casino", Own: Ownprtnrsp['c9'], master: mstrprtnrsp['c9'], subadmin: sbadmnprtnrsp['c9'], admin: admprtnrsp['c9'], superadmin: superadmprtnrsp['c9'], techadmin: techadmprtnrsp['c9']
                     }
                  ];

                  var Parentcommission = [
                     {
                        sport_id: 4, sport_name: "cricket", Own: Owncmsn['4'], master: mstrcmsn['4'], subadmin: sbadmncmsn['4'], admin: admcmsn['4'], superadmin: superadmcmsn['4'], techadmin: techadmcmsn['4']
                     },
                     {
                        sport_id: 1, sport_name: "soccer", Own: Owncmsn['1'], master: mstrcmsn['1'], subadmin: sbadmncmsn['1'], admin: admcmsn['1'], superadmin: superadmcmsn['2'], techadmin: techadmcmsn['2']
                     },
                     {
                        sport_id: 2, sport_name: "tennis", Own: Owncmsn['2'], master: mstrcmsn['2'], subadmin: sbadmncmsn['2'], admin: admcmsn['2'], superadmin: superadmcmsn['1'], techadmin: techadmcmsn['1']
                     },
                     {
                        sport_id: 'c9', sport_name: "casino", Own: Owncmsn['c9'], master: mstrcmsn['c9'], subadmin: sbadmncmsn['c9'], admin: admcmsn['c9'], superadmin: superadmcmsn['c9'], techadmin: techadmcmsn['c9']
                     }
                  ];

               } else if (req.newUser.role == "master") {


                  var Parentpartnership = [
                     {
                        sport_id: 4, sport_name: "cricket", Own: Ownprtnrsp['4'], subadmin: sbadmnprtnrsp['4'], admin: admprtnrsp['4'], superadmin: superadmprtnrsp['4'], techadmin: techadmprtnrsp['4']
                     },
                     {
                        sport_id: 1, sport_name: "soccer", Own: Ownprtnrsp['1'], subadmin: sbadmnprtnrsp['1'], admin: admprtnrsp['1'], superadmin: superadmprtnrsp['1'], techadmin: techadmprtnrsp['1']
                     },
                     {
                        sport_id: 2, sport_name: "tennis", Own: Ownprtnrsp['2'], subadmin: sbadmnprtnrsp['2'], admin: admprtnrsp['2'], superadmin: superadmprtnrsp['2'], techadmin: techadmprtnrsp['2']
                     },
                     {
                        sport_id: 'c9', sport_name: "casino", Own: Ownprtnrsp['c9'], subadmin: sbadmnprtnrsp['c9'], admin: admprtnrsp['c9'], superadmin: superadmprtnrsp['c9'], techadmin: techadmprtnrsp['c9']
                     }
                  ];

                  var Parentcommission = [
                     {
                        sport_id: 4, sport_name: "cricket", Own: Owncmsn['4'], subadmin: sbadmncmsn['4'], admin: admcmsn['4'], superadmin: superadmcmsn['4'], techadmin: techadmcmsn['4']
                     },
                     {
                        sport_id: 1, sport_name: "soccer", Own: Owncmsn['1'], subadmin: sbadmncmsn['1'], admin: admcmsn['1'], superadmin: superadmcmsn['2'], techadmin: techadmcmsn['2']
                     },
                     {
                        sport_id: 2, sport_name: "tennis", Own: Owncmsn['2'], subadmin: sbadmncmsn['2'], admin: admcmsn['2'], superadmin: superadmcmsn['1'], techadmin: techadmcmsn['1']
                     },
                     {
                        sport_id: 'c9', sport_name: "casino", Own: Owncmsn['c9'], subadmin: sbadmncmsn['c9'], admin: admcmsn['c9'], superadmin: superadmcmsn['c9'], techadmin: techadmcmsn['c9']
                     }
                  ];

               } else if (req.newUser.role == "subadmin") {

                  var Parentpartnership = [
                     {
                        sport_id: 4, sport_name: "cricket", Own: Ownprtnrsp['4'], admin: admprtnrsp['4'], superadmin: superadmprtnrsp['4'], techadmin: techadmprtnrsp['4']
                     },
                     {
                        sport_id: 1, sport_name: "soccer", Own: Ownprtnrsp['1'], admin: admprtnrsp['1'], superadmin: superadmprtnrsp['1'], techadmin: techadmprtnrsp['1']
                     },
                     {
                        sport_id: 2, sport_name: "tennis", Own: Ownprtnrsp['2'], admin: admprtnrsp['2'], superadmin: superadmprtnrsp['2'], techadmin: techadmprtnrsp['2']
                     },
                     {
                        sport_id: 'c9', sport_name: "casino", Own: Ownprtnrsp['c9'], admin: admprtnrsp['c9'], superadmin: superadmprtnrsp['c9'], techadmin: techadmprtnrsp['c9']
                     }
                  ];

                  var Parentcommission = [
                     {
                        sport_id: 4, sport_name: "cricket", Own: Owncmsn['4'], admin: admcmsn['4'], superadmin: superadmcmsn['4'], techadmin: techadmcmsn['4']
                     },
                     {
                        sport_id: 1, sport_name: "soccer", Own: Owncmsn['1'], admin: admcmsn['1'], superadmin: superadmcmsn['2'], techadmin: techadmcmsn['2']
                     },
                     {
                        sport_id: 2, sport_name: "tennis", Own: Owncmsn['2'], admin: admcmsn['2'], superadmin: superadmcmsn['1'], techadmin: techadmcmsn['1']
                     },
                     {
                        sport_id: 'c9', sport_name: "casino", Own: Owncmsn['c9'], admin: admcmsn['c9'], superadmin: superadmcmsn['c9'], techadmin: techadmcmsn['c9']
                     }
                  ];

               } else if (req.newUser.role == "admin") {

                  var Parentpartnership = [
                     {
                        sport_id: 4, sport_name: "cricket", Own: Ownprtnrsp['4'], superadmin: superadmprtnrsp['4'], techadmin: techadmprtnrsp['4']
                     },
                     {
                        sport_id: 1, sport_name: "soccer", Own: Ownprtnrsp['1'], superadmin: superadmprtnrsp['1'], techadmin: techadmprtnrsp['1']
                     },
                     {
                        sport_id: 2, sport_name: "tennis", Own: Ownprtnrsp['2'], superadmin: superadmprtnrsp['2'], techadmin: techadmprtnrsp['2']
                     },
                     {
                        sport_id: 'c9', sport_name: "casino", Own: Ownprtnrsp['c9'], superadmin: superadmprtnrsp['c9'], techadmin: techadmprtnrsp['c9']
                     }
                  ];

                  var Parentcommission = [
                     {
                        sport_id: 4, sport_name: "cricket", Own: Owncmsn['4'], superadmin: superadmcmsn['4'], techadmin: techadmcmsn['4']
                     },
                     {
                        sport_id: 1, sport_name: "soccer", Own: Owncmsn['1'], superadmin: superadmcmsn['1'], techadmin: techadmcmsn['1']
                     },
                     {
                        sport_id: 2, sport_name: "tennis", Own: Owncmsn['2'], superadmin: superadmcmsn['2'], techadmin: techadmcmsn['2']
                     },
                     {
                        sport_id: 'c9', sport_name: "casino", Own: Owncmsn['c9'], superadmin: superadmcmsn['c9'], techadmin: techadmcmsn['c9']
                     }
                  ];

               } else if (req.newUser.role == "superadmin") {

                  var Parentpartnership = [
                     {
                        sport_id: 4, sport_name: "cricket", Own: Ownprtnrsp['4'], techadmin: techadmprtnrsp['4']
                     },
                     {
                        sport_id: 1, sport_name: "soccer", Own: Ownprtnrsp['1'], techadmin: techadmprtnrsp['1']
                     },
                     {
                        sport_id: 2, sport_name: "tennis", Own: Ownprtnrsp['2'], techadmin: techadmprtnrsp['2']
                     },
                     {
                        sport_id: 'c9', sport_name: "casino", Own: Ownprtnrsp['c9'], techadmin: techadmprtnrsp['c9']
                     }
                  ];

                  var Parentcommission = [
                     {
                        sport_id: 4, sport_name: "cricket", Own: Owncmsn['4'], techadmin: techadmcmsn['4']
                     },
                     {
                        sport_id: 1, sport_name: "soccer", Own: Owncmsn['1'], techadmin: techadmcmsn['1']
                     },
                     {
                        sport_id: 2, sport_name: "tennis", Own: Owncmsn['2'], techadmin: techadmcmsn['2']
                     },
                     {
                        sport_id: 'c9', sport_name: "casino", Own: Owncmsn['c9'], techadmin: techadmcmsn['c9']
                     }
                  ];

               }




               //create new user

               //set user details
               var user = new User();
               user.username = req.newUser.username.toUpperCase();
               user.fullname = req.newUser.fullname;
               user.setDefaults();
               user.setPassword(req.newUser.password);
               user.settransPassword(req.newUser.password);
               user.role = req.newUser.role;
               user.status = 'active';
               user.city = req.newUser.city;
               user.mobile = req.newUser.mobile;
               user.creditrefrence = req.newUser.creditrefrence;
               user.exposurelimit = 0;
               user.master = master;
               user.subadmin = subadmin;
               user.admin = admin;
               user.superadmin = superadmin;
               user.techadmin = techadmin;
               user.masterId = masterId;
               user.subadminId = subadminId;
               user.adminId = adminId;
               user.superadminId = superadminId;
               user.techadminId = techadminId;
               user.ParentUser = dbAdmin.username;
               user.ParentRole = dbAdmin.role;
               user.ParentId = dbAdmin._id;
               user.casinobalance = 0;
               user.commissionsetting = commissionsetting;
               user.partnershipsetting = partnershipsetting;
               user.Parentpartnership = Parentpartnership;
               user.Parentcommission = Parentcommission;
               user.availableEventTypes = dbAdmin.availableEventTypes;
               user.openingDate = new Date();
               user.save(function (err) {
                  if (err) {
                     // console.log(err)
                     logger.error('create-user-error: DBError in Users');
                     // console.log('Error in creating record');
                     socket.emit("create-user-success", {
                        "message": "Error in creating record",
                        success: false
                     });
                     return;
                  } else {

                     //log start
                     var log = new Log();
                     log.username = dbAdmin.username.toUpperCase();
                     log.userId = dbAdmin._id;
                     log.action = 'ACCOUNT';
                     log.subAction = 'ACCOUNT_CREATE';
                     log.description = 'New account created.';
                     log.master = master;
                     log.subadmin = subadmin;
                     log.admin = admin;
                     log.superadmin = superadmin;
                     log.techadmin = techadmin;
                     log.masterId = masterId;
                     log.subadminId = subadminId;
                     log.adminId = adminId;
                     log.superadminId = superadminId;
                     log.techadminId = techadminId;
                     log.actionBy = dbAdmin.username;
                     log.createdId = dbAdmin._id;
                     log.time = new Date();
                     log.datetime = Math.round(+new Date() / 1000);
                     log.deleted = false;
                     log.save(function (err) {
                        if (err) {
                           console.log(err)
                           logger.error('create-user-error: Log entry failed.');
                        }
                     });

                     // socket.emit("create-user-success", user);
                     socket.emit("create-user-success", {
                        "message": "User created success",
                        success: true,
                        user: user
                     });

                  }
               });
            }
         });



      }
   }
   catch (error) {
      console.log(error);
      socket.emit("create-user-success", {
         "message": "Server Response Error",
         success: false,
         user: error
      });

   };


}

module.exports.createPartner = async function (io, socket, req) {
   // - validate request data
   // console.log(request);
   try {
      //   console.log(req)
      // let decoded = jwt.verify(req.token, myEnv.parsed.SECRET);
      let { userId } = jwt.decode(req.token);
      let dbAdmin = await User.findOne({ _id: userId, token: req.token });
      if (!dbAdmin) return io.to(socket.id).emit('logout');
      if (dbAdmin.token != req.token) return io.to(socket.id).emit('logout');
      logger.info("createPartner: " + JSON.stringify(req));
      // console.log(request);

      // authenticate admin
      // console.log(dbAdmin);
      if (!dbAdmin.validTransPassword(req.transpassword)) {
         dbAdmin.loginAttempts += 1;
         logger.error('create-partner-success: Invalid Transaction password ' + dbAdmin.username);
         // console.log('create-user-success: Invalid Transaction password');
         socket.emit('create-partner-success', {
            "message": "Invalid Transaction password",
            success: false
         });
         return;
      }

      User.findOne({
         username: req.newUser.username.toUpperCase()
      }, async function (err, userCheck) {
         if (err) {
            logger.debug(err);
            return;
         }
         if (userCheck) {
            logger.error('create-partner-error: User already exists');
            // console.log('User already exists');
            socket.emit("create-partner-success", {
               "message": "User already exists",
               success: false,
               user: userCheck
            });
            return;
         } else {

            //create new user
            //set user details
            var user = new User();
            user.username = req.newUser.username.toUpperCase();
            user.fullname = req.newUser.fullname;
            user.setDefaults();
            user.setPassword(req.newUser.password);
            // user.settransPassword(dbAdmin.transctionpassword);
            user.role = "partner";
            user.transctionpasswordstatus = 1;
            user.transctionpasswordhash = dbAdmin.transctionpasswordhash;
            user.transctionpasswordsalt = dbAdmin.transctionpasswordsalt;
            user.transctionpassword = dbAdmin.transctionpassword;
            user.status = 'active';
            user.city = dbAdmin.city;
            user.mobile = dbAdmin.mobile;
            user.creditrefrence = dbAdmin.creditrefrence;
            user.exposurelimit = 0;
            user.partnerWith = dbAdmin._id;
            user.casinobalance = 0;
            user.commissionsetting = dbAdmin.commissionsetting;
            user.partnershipsetting = dbAdmin.partnershipsetting;
            user.Parentpartnership = dbAdmin.Parentpartnership;
            user.Parentcommission = dbAdmin.Parentcommission;
            user.availableEventTypes = dbAdmin.availableEventTypes;
            user.openingDate = new Date();
            user.save(function (err) {
               if (err) {
                  // console.log(err)
                  logger.error('create-partner-error: DBError in Users');
                  // console.log('Error in creating record');
                  socket.emit("create-partner-success", {
                     "message": "Error in creating record",
                     success: true
                  });
                  return;
               } else {

                  //log start
                  var log = new Log();
                  log.username = dbAdmin.username.toUpperCase();
                  log.userId = userId;
                  log.action = 'ACCOUNT';
                  log.subAction = 'ACCOUNT_CREATE';
                  log.description = 'New account created.';
                  log.master = dbAdmin.master;
                  log.subadmin = dbAdmin.subadmin;
                  log.admin = dbAdmin.admin;
                  log.masterId = dbAdmin.masterId;
                  log.subadminId = dbAdmin.subadminId;
                  log.adminId = dbAdmin.adminId;
                  log.actionBy = dbAdmin.username;
                  log.createdId = dbAdmin._id;
                  log.time = new Date();
                  log.datetime = Math.round(+new Date() / 1000);
                  log.deleted = false;
                  log.save(function (err) {
                     if (err) {
                        console.log(err)
                        logger.error('create-partner-error: Log entry failed.');
                     }
                  });

                  // socket.emit("create-user-success", user);
                  console.log("success");
                  socket.emit("create-partner-success", {
                     "message": "User created success",
                     success: true,
                     user: user
                  });

               }
            });
         }
      });

   }
   catch (error) {
      console.log(error);

   };

}

module.exports.changePassword = async function (io, socket, req) {
   try {
      console.log(req)
      // let decoded = jwt.verify(req.token, myEnv.parsed.SECRET);
      let { userId } = jwt.decode(req.token);
      let dbAdmin = await User.findOne({ _id: userId, token: req.token });
      if (!dbAdmin) return io.to(socket.id).emit('logout');
      if (dbAdmin.token != req.token) return io.to(socket.id).emit('logout');
      logger.info("createPartner: " + JSON.stringify(req));

      if (dbAdmin.role != 'siteadmin' && dbAdmin.role != 'techadmin' && dbAdmin.role != 'superadmin' && dbAdmin.role != 'admin' && dbAdmin.role != 'manager' && dbAdmin.role != 'master' && dbAdmin.role != 'subadmin') return;
      // authenticate manager
      var output = {};

      if (!dbAdmin.validTransPassword(req.transpassword)) {
         dbAdmin.loginAttempts += 1;
         logger.error('update-password-success: Invalid Transaction password ' + dbAdmin.username);
         socket.emit('update-password-success', {
            "message": "Invalid Transaction password",
            success: false
         });
         return;
      }

      User.findOne({
         _id: req.targetUser.userId,
         role: req.targetUser.role,
         deleted: false
      }, function (err, result) {
         // console.log(result);
         if (err) logger.error(err);
         if (!result) {
            socket.emit("update-password-success", {
               "message": "User not found. Please try again.",
               success: false
            });
            return;
         }
         var transstatus = false;
         var TransPass = 0;
         // var login = new User();
         if (result.transctionpasswordstatus == 0) {
            transstatus = true;
            TransPass = Math.floor(100000 + Math.random() * 900000).toString();
            console.log(TransPass, req.targetUser.password);
            result.settransPassword(TransPass);
            // result.transctionpasswordhash = login.transctionpasswordhash;
            // result.transctionpasswordsalt = login.transctionpasswordsalt;
            result.transctionpasswordstatus = 1;
            result.transctionpassword = TransPass;
         }

         result.setPassword(req.targetUser.password);
         // result.hash = login.hash;
         // result.salt = login.salt;

         var userDetails = {
            username: result.username,
            role: result.role,
            manager: result.manager,
            admin: result.admin,
            master: result.master,
            subadmin: result.subadmin,
            status: result.status,
            commissionsetting: result.commissionsetting,
            partnershipsetting: result.partnershipsetting,
            ParentUser: result.ParentUser,
            transctionpasswordstatus: result.transctionpasswordstatus
         };
         const token = Helper.generateToken(result._id);
         result.token = token;
         output._id = result._id;
         output.key = result.hash;
         output.apitoken = token;
         output.verifytoken = token;
         output.details = userDetails;

         result.save(function (err, updatedLogin) {
            if (err) logger.error(err);

            socket.emit("update-password-success", {
               "message": "Password changed successfully.",
               "transstatus": transstatus,
               "transPass": TransPass,
               "output": output,
               success: true
            });
            Session.remove({
               userId: req.targetUser.userId
            });
         });
      });

   }
   catch (error) {
      console.log(error);
      socket.emit("update-password-success", error);
   };
}

module.exports.changeUserPassword = async function (io, socket, req) {
   try {
      //   console.log(req)
      // let decoded = jwt.verify(req.token, myEnv.parsed.SECRET);
      let { userId } = jwt.decode(req.token);
      let dbAdmin = await User.findOne({ _id: userId, token: req.token });
      if (!dbAdmin) return io.to(socket.id).emit('logout');
      if (dbAdmin.token != req.token) return io.to(socket.id).emit('logout');
      logger.info("createPartner: " + JSON.stringify(req));

      if (dbAdmin.role != 'siteadmin' && dbAdmin.role != 'techadmin' && dbAdmin.role != 'superadmin' && dbAdmin.role != 'admin' && dbAdmin.role != 'manager' && dbAdmin.role != 'master' && dbAdmin.role != 'subadmin') return;
      var output = {};

      if (!dbAdmin.validTransPassword(req.transpassword)) {
         dbAdmin.loginAttempts += 1;
         logger.error('update-password-success: Invalid Transaction password ' + dbAdmin.username);
         socket.emit('update-userpassword-success', {
            "message": "Invalid Transaction password",
            success: false
         });
         return;
      }

      User.findOne({
         _id: req.targetUser.userId,
         role: req.targetUser.role,
         deleted: false
      }, function (err, result) {
         // console.log(result);
         if (err) logger.error(err);
         if (!result) {
            socket.emit("update-userpassword-success", {
               "message": "User not found. Please try again.",
               success: false
            });
            return;
         }
         var transstatus = false;
         var TransPass = 0;
         // var login = new User();
         if (result.transctionpasswordstatus == 0) {
            transstatus = true;
            TransPass = Math.floor(100000 + Math.random() * 900000).toString();
            console.log(TransPass, req.targetUser.password);
            result.settransPassword(TransPass);
            // result.transctionpasswordhash = login.transctionpasswordhash;
            // result.transctionpasswordsalt = login.transctionpasswordsalt;
            result.transctionpasswordstatus = 1;
            result.transctionpassword = TransPass;
         }

         result.setPassword(req.targetUser.password);
         // result.hash = login.hash;
         // result.salt = login.salt;

         var userDetails = {
            username: result.username,
            role: result.role,
            manager: result.manager,
            admin: result.admin,
            master: result.master,
            subadmin: result.subadmin,
            status: result.status,
            commissionsetting: result.commissionsetting,
            partnershipsetting: result.partnershipsetting,
            ParentUser: result.ParentUser,
            transctionpasswordstatus: result.transctionpasswordstatus
         };
         const token = Helper.generateToken(result._id);
         result.token = token;
         result.transctionpasswordstatus = 0;
         result.setPassword(req.targetUser.password);
         result.settransPassword(req.targetUser.password);
         output._id = result._id;
         output.key = result.hash;
         output.apitoken = token;
         output.verifytoken = token;
         output.details = userDetails;

         result.save(function (err, updatedLogin) {
            if (err) logger.error(err);

            socket.emit("update-userpassword-success", {
               "message": "Password changed successfully.",
               "transstatus": transstatus,
               "transPass": TransPass,
               "output": output,
               success: true
            });
            Session.remove({
               userId: req.targetUser.userId
            });
         });
      });

   }
   catch (error) {
      console.log(error);
      socket.emit("update-userpassword-succes", error);
   };

}

module.exports.getUsers = function (io, socket, request) {
   if (!request) return;
   if (!request.user) return;
   if (!request.user.details) return;
   //("getUser: request=" + JSON.stringify(request));
   try {
      getCasinoBalance(io, socket, request);
      if (request.user.details.role == 'partner') {
         if (!request.filter || !request.sort) return;
         User.findOne({
            hash: request.user.key,
            _id: request.user.details._id,
            role: 'partner',
            deleted: false,
            status: 'active'
         }, function (err, dbManager) {
            if (err) logger.error(err);
            if (!dbManager) {
               logger.error("Invalid Access: " + JSON.stringify(request));
               return;
            }
            User.find(request.filter).sort(request.sort).exec(function (err, result) {
               if (err) logger.error(err);
               socket.emit("get-users-success", result);
            });
         });
      }
      if (request.user.details.role == 'manager') {
         try {
            if (!request.filter || !request.sort) return;
            User.findOne({
               hash: request.user.key,
               _id: request.user.details._id,
               role: 'manager',
               deleted: false,
               status: 'active'
            }, function (err, dbManager) {
               if (err) logger.error(err);
               if (!dbManager) {
                  logger.error("Invalid Access: " + JSON.stringify(request));
                  return;
               }
               if (!request.limit) {
                  request.limit = 2000;
               }
               User.find(request.filter).sort(request.sort).limit(request.limit).exec(function (err, result) {
                  if (err) logger.error(err);

                  User.find(request.filter).sort(request.sort).exec(function (err, resultall) {
                     socket.emit("get-users-success", result);
                     socket.emit("get-allusers-success", resultall);
                     if (!result) return;
                     result.forEach((val) => {
                        var _id = val._id;
                        if (val.role == 'user') {

                           WebToken.findOne({
                              deleted: false
                           }, function (err, dbToken) {
                              if (!dbToken) return;
                              var token = dbToken.token;


                              //var res = userl.replace("#",'%23');
                              var options1 = {
                                 method: 'GET',
                                 url: 'https://api.qtplatform.com/v1/wallet/ext/' + _id,
                                 headers: {
                                    'postman-token': 'a7e7a003-10f4-347e-27df-e834e39356e6',
                                    'cache-control': 'no-cache',
                                    'content-type': 'application/json',
                                    authorization: 'Bearer ' + token
                                 },
                                 json: true
                              };

                              requestUrl(options1, function (error, response, body1) {

                                 if (error) return;

                                 User.update({
                                    _id: _id
                                 }, {
                                    $set: {
                                       mainbalance: body1.amount,

                                    }
                                 }, function (err, dbUpdatedUser) {
                                    if (err) {
                                       logger.debug(err);
                                    }

                                 });


                              });


                           });


                        }


                     });

                  });
               });
            });
         } catch (e) {

         }
      }
      if (request.user.details.role == 'admin') {
         if (!request.filter || !request.sort) return;
         User.findOne({
            hash: request.user.key,
            _id: request.user.details._id,
            role: 'admin',
            deleted: false,
            status: 'active'
         }, function (err, dbAdmin) {
            if (err) logger.error(err);
            if (!dbAdmin) {
               logger.error("Invalid Access: " + JSON.stringify(request));
               return;
            }

            //request.filter.push({'username':{$ne:'Sachin1'}});
            User.find(request.filter).sort(request.sort).exec(function (err, result) {
               if (err) logger.error(err);
               //console.log(result.length)
               //var reresult=  result.filter((val)=>{ return val.username!='Sachin1'});
               // var reresult1=  reresult.filter((val)=>{ return val.username!='Magic'});
               socket.emit("get-users-success", result);

            });
         });
      }

      if (request.user.details.role == 'subadmin') {
         if (!request.filter || !request.sort) return;
         User.findOne({
            hash: request.user.key,
            _id: request.user.details._id,
            role: 'subadmin',
            deleted: false,
            status: 'active'
         }, function (err, dbAdmin) {
            if (err) logger.error(err);
            if (!dbAdmin) {
               logger.error("Invalid Access1: " + JSON.stringify(request));
               return;
            }

            //request.filter.push({'username':{$ne:'Sachin1'}});
            User.find(request.filter).sort(request.sort).exec(function (err, result) {
               if (err) logger.error(err);
               //console.log(result.length)
               //var reresult=  result.filter((val)=>{ return val.username!='Sachin1'});
               // var reresult1=  reresult.filter((val)=>{ return val.username!='Magic'});
               socket.emit("get-users-success", result);

            });
         });
      }

      if (request.user.details.role == 'master') {
         if (!request.filter || !request.sort) return;
         User.findOne({
            hash: request.user.key,
            _id: request.user.details._id,
            role: 'master',
            deleted: false,
            status: 'active'
         }, function (err, dbAdmin) {
            if (err) logger.error(err);
            if (!dbAdmin) {
               logger.error("Invalid Access1: " + JSON.stringify(request));
               return;
            }

            //request.filter.push({'username':{$ne:'Sachin1'}});
            User.find(request.filter).sort(request.sort).exec(function (err, result) {
               if (err) logger.error(err);
               //console.log(result.length)
               //var reresult=  result.filter((val)=>{ return val.username!='Sachin1'});
               // var reresult1=  reresult.filter((val)=>{ return val.username!='Magic'});
               socket.emit("get-users-success", result);

            });
         });
      }

      if (request.user.details.role == 'operator') {
         if (!request.filter || !request.sort) return;
         User.findOne({
            hash: request.user.key,
            _id: request.user.details._id,
            role: 'operator',
            deleted: false,
            status: 'active'
         }, function (err, dbAdmin) {
            if (err) logger.error(err);
            if (!dbAdmin) {
               logger.error("Invalid Access: " + JSON.stringify(request));
               return;
            }
            User.find(request.filter).sort(request.sort).exec(function (err, result) {
               if (err) logger.error(err);
               socket.emit("get-users-success", result);
            });
         });
      }
   } catch (e) {
      console.log(e)
   }
}

module.exports.updateMaintenancePage = async function (io, socket, req) {
   // - validate request data
   try {
      //   console.log(req)
      // let decoded = jwt.verify(req.token, myEnv.parsed.SECRET);
      let { userId } = jwt.decode(req.token);
      let dbAdmin = await User.findOne({ _id: userId, token: req.token });
      if (!dbAdmin) return io.to(socket.id).emit('logout');
      if (dbAdmin.token != req.token) return io.to(socket.id).emit('logout');
      logger.info("createUser: " + JSON.stringify(req));

      if (dbAdmin.role == 'superadmin') {

         if (!dbAdmin.validTransPassword(req.transpassword)) {
            logger.error('update-password-success: Invalid Transaction password ' + dbAdmin.username);
            console.log('update-password-success: Invalid Transaction password ' + dbAdmin.username);
            io.emit('maintenance-page-success', {
               "message": "Invalid Transaction password",
               success: false
            });
            return;
         }

         const update = {
            maintenancepage: req.status,
         };

         Setting.updateMany({ _id: "63e4a8f44b6c6f38713c4d6e" },
            update, { new: true }, async function (err, docs) {
               if (err) {
                  console.log("DB error: Application error ", err);
                  io.emit("maintenance-page-success", {
                     "message": "User Under Maintenance Error",
                     status: req.status,
                     success: false,
                  });
                  return;
               }
               else {
                  console.log("Status Changed");
                  io.emit("maintenance-page-success", {
                     "message": "User Under Maintenance Sucess",
                     status: req.status,
                     success: true,
                  });
                  return;
               }
            })

      }
   }
   catch (error) {
      console.log(error);
      socket.emit("update-password-success", error);
   };

}

module.exports.changeTransPassword = function (io, socket, request) {
   // - validate request data
   // console.log(request);

   if (!request) return;
   if (!request.details || !request.details._id || !request.details.key) return;
   if (!request.details.username || !request.details.role) return;
   // console.log(request);

   // if (request.targetUser.role == 'user') {
   // console.log("1111",request.details.role);
   if (request.details.role != 'superadmin' && request.details.role != 'admin' && request.details.role != 'manager' && request.details.role != 'master' && request.details.role != 'subadmin') return;
   // authenticate manager
   console.log("222", request.details.role);
   User.findOne({
      username: request.details.username,
      role: request.details.role,
      status: 'active',
      deleted: false,
      hash: request.details.key
   }, function (err, dbAdmin) {
      // console.log(dbAdmin);
      if (err) logger.error(err);
      if (!dbAdmin) return;

      if (!dbAdmin.validTransPassword(request.details.transpassword)) {
         dbAdmin.loginAttempts += 1;
         logger.error('update-password-success: Invalid Transaction password ' + request.details.username);
         socket.emit('update-password-success', {
            "message": "Invalid Transaction password",
            success: false
         });
         return;
      }

      var TransPass = Math.floor(100000 + Math.random() * 900000).toString();
      var login = new User();
      login.settransPassword(123456);
      dbAdmin.transctionpasswordhash = login.transctionpasswordhash;
      dbAdmin.transctionpasswordsalt = login.transctionpasswordsalt;
      dbAdmin.save(function (err, updatedLogin) {
         if (err) logger.error(err);
         socket.emit("update-password-success", {
            "message": "Password changed successfully.",
            success: true
         });
         Session.remove({
            username: request.targetUser.username
         });
      });
   });
   // }

}

module.exports.getBalance = async function (io, socket, req) {
   try {
      //   console.log(req)
      // let decoded = jwt.verify(req.token, myEnv.parsed.SECRET);
      let { userId } = jwt.decode(req.token);
      let dbAdmin = await User.findOne({ _id: userId, token: req.token });
      if (!dbAdmin) return io.to(socket.id).emit('logout');
      if (dbAdmin.token != req.token) return io.to(socket.id).emit('logout');
      logger.info("createPartner: " + JSON.stringify(req));

      User.findOne({
         _id: req.targetUser.userId,
      }, { balance: 1 }, function (err, user) {
         // console.log(user);
         socket.emit('parentuser-balance-success', user);
      });
   }
   catch (error) {
      console.log(error);
      socket.emit("parentuser-balance-successs", error);
   };
}

module.exports.logout = function (io, socket, request) {
   // Validate request data
   if (request)
      if (request.user)
         if (request.user.details)
            //(request.user.details.username + ' logged out');
            // Todo: send updated activer users to manager and admin

            // Delete Session
            Session.remove({
               socket: socket.id
            }, function (err, data) {
               if (err) logger.error(err);
               socket.emit('logout');
            });
};

////////////// --------- API ------------ ////////////////

module.exports.refreshBalance = async function (request, res) {
   var balance = 0;
   console.log(request.params);
   await User.findOne({
      username: request.params.username.toUpperCase(),
      role: "user",
      deleted: false
   }, async function (err, user) {
      if (err || !user) {
         res.json({ response: [], success: true, "message": "user not found" });
         return;
      }
      // console.log(user.username);
      await Bet.distinct('marketId', {
         username: request.params.username.toUpperCase(),
         deleted: false,
         result: 'ACTIVE'
      }, async function (err, marketIds) {
         if (err) logger.error(err);
         // console.log(marketIds);
         if (!marketIds || marketIds.length == 0) {
            User.update({
               username: request.params.username.toUpperCase()
            }, {
               $set: {
                  balance: user.limit,
                  exposure: 0
               }
            }, function (err, raw) {
               if (err) logger.error(err);
            });
            //  done(-1);
            res.json({ response: 0, success: true, "message": "Success" });
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
               // done(-1);
               User.update({
                  username: request.params.username.toUpperCase()
               }, {
                  $set: {
                     balance: user.limit,
                     exposure: 0
                  }
               }, function (err, raw) {
                  if (err) logger.error(err);
               });
               res.json({ response: 0, success: true, "message": "Success no markets" });
               return;
            }
            var exposure = 0;
            var counter = 0;
            var len = markets.length;

            markets.forEach(async function (market, index) {
               // console.log("markets length",market);

               if (!market.roundId) {
                  market.roundId = market.marketId;
               }
               // console.log(market.marketType,market.roundId);
               if (market.marketType != 'SESSION') {
                  (function (market, mindex, callback) {

                     // console.log(user.username,market.eventId,market.marketId,market.roundId)
                     Bet.find({
                        eventId: market.eventId,
                        marketId: market.marketId,
                        roundId: market.roundId,
                        username: user.username,
                        result: 'ACTIVE',
                        deleted: false
                     }, function (err, bets) {
                        // console.log(bets.length)
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
                        logger.info(user.username + " market: " + market.marketName + " exposure: " + maxLoss);
                        // console.log(user.username + " market: " + market.marketName + " exposure: " + maxLoss);
                        callback(maxLoss, mindex);
                        return;
                     });
                  })(market, index, function (e, i) {
                     counter++;
                     if (counter == len) {
                        exposure += e * 1;
                        logger.info("Total exposure: " + exposure);
                        console.log("Total exposure ODDS bet: " + exposure);
                        if (exposure <= 0) user.balance = user.limit + exposure;
                        logger.info(user.username + " New Balance: " + user.balance);
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

                                    User.update({
                                       username: user.username
                                    }, {
                                       $set: {
                                          balance: user.balance,
                                          exposure: exposure - exposurewheel
                                       }
                                    }, function (err, raw) {
                                       //  done(1);
                                       res.json({ response: exposure, success: true, "message": "Update Succes" });
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
                                 // done(1);
                                 console.log("done")
                                 res.json({ response: exposure, success: true, "message": "Update Succes" });
                                 return;
                              });
                           }
                        });

                     } else {
                        exposure += e * 1;
                     }
                  });
               } else {
                  (function (market, mindex, callback) {
                     // console.log(user.username,market.eventId,market.marketId,market.roundId)
                     Bet.find({
                        eventId: market.eventId,
                        marketId: market.marketId,
                        roundId: market.roundId,
                        username: user.username,
                        result: 'ACTIVE',
                        deleted: false
                     }, function (err, bets) {
                        // console.log(bets.length)
                        if (err || !bets || bets.length < 1) {
                           callback(0);
                           return;
                        }
                        // console.log(bets.length)
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
                        logger.info("max loss " + maxLoss);
                        // console.log(user.username + " market: " + market.marketName + " exposure: " + maxLoss);
                        callback(maxLoss, mindex);
                        return;
                     });
                  })(market, index, function (e, i) {
                     counter++;
                     if (counter == len) {
                        exposure += e * 1;
                        logger.info("Total exposure: " + exposure);
                        console.log("Total exposure session bet: " + exposure);
                        if (exposure <= 0)
                           user.balance = user.limit + exposure;
                        logger.info("New Balance: " + user.balance);
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
                                    //console.log(exposurewheel);
                                    User.update({
                                       username: user.username
                                    }, {
                                       $set: {
                                          balance: user.balance,
                                          exposure: exposure - exposurewheel
                                       }
                                    }, function (err, raw) {
                                       //  done(1);
                                       res.json({ response: exposure, success: true, "message": "Update Succes" });
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
                                 // done(1);
                                 console.log("done")
                                 res.json({ response: exposure, success: true, "message": "Update Succes" });
                                 return;
                              });
                           }
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

module.exports.checkUsername = async function (req, res) {
   try {
      console.log(req.body)
      // let decoded = jwt.verify(req.token, myEnv.parsed.SECRET);
      // let { userId } = jwt.decode(req.token);
      // let dbAdmin = await User.findOne({ _id: userId, token: req.token });
      // if (!dbAdmin) return res.send({ success: false, logout: true, message: "Token Invalid. Please login in again." });
      // if (dbAdmin.token != req.token) return res.send({ success: false, logout: true, message: "Token Invalid. Please login in again." });

      User.findOne({
         username: req.body.username.toUpperCase(),
      }, { username: 1 }, function (err, getUser) {
         if (getUser) {
            res.json({ response: getUser, success: true, "message": "Username Already Taken!" });
         } else {
            res.json({ response: [], success: false, "message": "" });
         }
      });
   } catch (err) {
      res.json({ response: [], success: false, "message": "server response success" });
   }
}

module.exports.casinoReport = function (req, res) {
   try {
      console.log(req.body.filter);
      let { pageNumber, sortBy, limit } = req.body;
      let setlimit = 10;
      if (limit) {
         setlimit = limit;
      }
      let page = pageNumber >= 1 ? pageNumber : 1;
      page = page - 1;
      let setskip = setlimit * page;
      Log.find(req.body.filter, {}, { skip: setskip, limit: setlimit }).sort({
         _id: -1
      }).exec(function (err, dbMarket) {

         res.json({ response: dbMarket, success: true, "message": "server response success" });

      });
   } catch (err) {
      console.log(err)
      res.json({ response: err, success: false, "message": "server response error" });
   }

}

module.exports.getPartnerList = async function (req, res) {
   try {
      console.log(req.body)
      // let decoded = jwt.verify(req.token, myEnv.parsed.SECRET);
      let { userId } = jwt.decode(req.token);
      let dbAdmin = await User.findOne({ _id: userId, token: req.token });
      if (!dbAdmin) return res.send({ success: false, logout: true, message: "Token Invalid. Please login in again." });
      if (dbAdmin.token != req.token) return res.send({ success: false, logout: true, message: "Token Invalid. Please login in again." });
      let { search, pageNumber, limit } = req.body;

      var filter = {
         partnerWith: userId,
         deleted: false,
      };


      if (search) {
         filter.username = { $regex: search.toUpperCase() };
      }

      let setlimit = 10;
      if (limit) {
         setlimit = limit;
      }
      let page = pageNumber >= 1 ? pageNumber : 1;
      page = page - 1;
      let setskip = setlimit * page;
      console.log(filter)
      User.find(filter, { username: 1, role: 1, createdAt: 1 }).sort({
         username: 1
      }).exec(async function (err, getUser) {
         // console.log(getUser.length);
         if (getUser) {
            res.json({ response: getUser, success: true, "message": "User List Succes" });
         } else {
            res.json({ response: [], success: true, "message": "Empty User List " });
         }

      });

   } catch (err) {
      res.json({ response: [], success: false, "message": "server response error" });
   }
}

module.exports.getSummary = async function (req, res) {
   try {
      // console.log(req.token,req.body)
      // let decoded = jwt.verify(req.token, myEnv.parsed.SECRET);
      let { userId } = jwt.decode(req.token);
      let dbAdmin = await User.findOne({ _id: userId, token: req.token });
      if (!dbAdmin._id) return res.send({ success: false, logout: true, message: "Token Invalid. Please login in again." });
      if (dbAdmin.token != req.token) return res.send({ success: false, logout: true, message: "Token Invalid. Please login in again." });

      // console.log(req.body);
      let { pageNumber, limit } = req.body;
      let setlimit = 25;
      if (limit) {
         setlimit = limit;
      }
      let page = pageNumber >= 1 ? pageNumber : 1;
      page = page - 1;
      let setskip = setlimit * page;

      var filter = {
         'userId': userId,

      };

      // if (dbAdmin.role == "master") {
      //    filter = {
      //       'userId': userId,
      //    };
      // }

      // if (dbAdmin.role == "subadmin") {
      //    filter = {
      //       'userId': userId,
      //    };
      // }

      // if (dbAdmin.role == "admin") {
      //    filter = {
      //       'userId': userId,
      //    };
      // }

      if (req.body.username) {
         var searchUser = await User.findOne({ username: req.body.username }, { _id: 1, role: 1 });
         if (searchUser) {
            // if (searchUser.role == "admin") {
            //    filter.adminId = searchUser._id;
            // } else if (searchUser.role == "subadmin") {
            //    filter.subadminId = searchUser._id;
            // } else if (searchUser.role == "master") {
            //    filter.masterId = searchUser._id;
            // } else if (searchUser.role == "manager") {
            //    filter.managerId = searchUser._id;
            // } else {
            filter.userId = searchUser._id;
            // }
         } else {
            filter.userId = userId;
         }
      }

      filter.createDate = { '$gte': req.body.from, '$lte': req.body.to };

      if (req.body.eventTypeId != 0) {
         filter.eventTypeId = req.body.eventTypeId;
      }


      if (req.body.acc_type === "games_report") {
         filter.subAction = {
            $in: ['AMOUNT_WON', 'AMOUNT_LOST']
         };
      } else if (req.body.acc_type === "balance_report") {
         filter.subAction = {
            $in: ['BALANCE_WITHDRAWL', 'BALANCE_DEPOSIT']
         };
      } else {
         filter.subAction = {
            $in: ['AMOUNT_WON', 'AMOUNT_LOST', 'BALANCE_WITHDRAWL', 'BALANCE_DEPOSIT', 'BONUS_WITHDRAWL', 'BONUS_DEPOSIT', 'COMMISSION_WON', 'COMMISSION_LOST']
         };
      }
      console.log("FILTEER", filter);
      Log.find(filter, { _id: 1 }).sort(req.body.sort).exec(function (err, totalLogs) {
         Log.find(filter).sort(req.body.sort).limit(req.body.limit).skip(setskip).exec(function (err, dbLogs) {
            var total =
            {
               dbLogs: dbLogs,
               totalLogs: totalLogs.length,
            }
            res.json(total);
         });
      });
   } catch (e) {
      console.log(e);
      return res.json({ response: [], success: false, "message": "DB error: Application error " });
   }
}


module.exports.getUserList = async function (req, res) {
   try {
      console.log(req.body)
      // let decoded = jwt.verify(req.token, myEnv.parsed.SECRET);
      let { userId } = jwt.decode(req.token);
      let dbAdmin = await User.findOne({ _id: userId, token: req.token });
      if (!dbAdmin._id) return res.send({ success: false, logout: true, message: "Token Invalid. Please login in again." });
      if (dbAdmin.token != req.token) return res.send({ success: false, logout: true, message: "Token Invalid. Please login in again." });


      let { search, pageNumber, sortBy, limit } = req.body;

      var filter = {
         managerId: req.body.userId,
         // role: "user",
         ParentId: req.body.userId,
         deleted: false,
      };

      if (req.body.role == "master") {
         filter = {
            masterId: req.body.userId,
            ParentId: req.body.userId,
            // role: "manager",
            deleted: false,
         };
      }

      if (req.body.role == "subadmin") {
         filter = {
            subadminId: req.body.userId,
            ParentId: req.body.userId,
            // role: "master",
            deleted: false,
         };
      }

      if (req.body.role == "admin") {
         filter = {
            adminId: req.body.userId,
            ParentId: req.body.userId,
            // role: "subadmin",
            deleted: false,
         };
      }

      if (req.body.role == "superadmin") {
         filter = {
            superadminId: req.body.userId,
            ParentId: req.body.userId,
            // role: "subadmin",
            deleted: false,
         };
      }

      if (req.body.role == "techadmin") {
         filter = {
            techadminId: req.body.userId,
            ParentId: req.body.userId,
            // role: "subadmin",
            deleted: false,
         };
      }

      if (req.body.role == "siteadmin") {
         filter = {
            ParentId: req.body.userId,
            // role: "subadmin",
            deleted: false,
         };
      }

      if (search) {
         filter.username = { $regex: search.toUpperCase() };
      }

      let setlimit = 10;
      if (limit) {
         setlimit = limit;
      }
      let page = pageNumber >= 1 ? pageNumber : 1;
      page = page - 1;
      let setskip = setlimit * page;

      // console.log(filter);

      var findUser = await User.findOne({ _id: req.body.userId }, { _id: 1, partnershipsetting: 1, role: 1 });
      // console.log(findUser.role);
      for (var k = 0; k < findUser.partnershipsetting.length; k++) {
         if (findUser.partnershipsetting[k].sport_id == 4) {
            upperpercentage = findUser.partnershipsetting[k].partnership;
         }
      }

      User.find(filter, { _id: 1 }).exec(function (err, totalUsers) {
         User.find(filter, {}, { skip: setskip, limit: setlimit }).sort({
            username: 1
         }).exec(async function (err, getUser) {
            // console.log(getUser.length);

            // res.json({ response: users, success: true, "message": "User List Succes" });
            if (getUser) {

               for (var i = 0; i < getUser.length; i++) {
                  var totalbalance = 0;
                  var ownpercentage = 100;
                  if (getUser[i].role != "user") {
                     for (var k = 0; k < getUser[i].partnershipsetting.length; k++) {
                        if (getUser[i].partnershipsetting[k].sport_id == 4) {
                           ownpercentage = getUser[i].partnershipsetting[k].partnership;
                        }
                     }
                  }
                  var filter1 = {
                     _id: getUser[i]._id,
                  };
                  // console.log("BB6666",i,getUser[i].username,getUser[i].role,getUser[i].limit);
                  if (getUser[i].role == "manager") {
                     totalbalance = getUser[i].limit;
                     filter1 = {
                        managerId: getUser[i]._id,
                     };
                  }

                  if (getUser[i].role == "master") {
                     totalbalance = getUser[i].limit;
                     filter1 = {
                        masterId: getUser[i]._id,
                     };
                  }

                  if (getUser[i].role == "subadmin") {
                     totalbalance = getUser[i].limit;
                     filter1 = {
                        subadminId: getUser[i]._id,
                     };
                  }

                  if (getUser[i].role == "admin") {
                     totalbalance = getUser[i].limit;
                     filter1 = {
                        adminId: getUser[i]._id,
                     };
                  }

                  if (getUser[i].role == "superadmin") {
                     totalbalance = getUser[i].limit;
                     filter1 = {
                        superadminId: getUser[i]._id,
                     };
                  }

                  // console.log(filter1);
                  var total_exposure = 0;
                  // console.log("calculate exposure", filter1, getUser[i].role, getUser[i].username);
                  await getuserexposure(getUser[i].role, getUser[i]._id, function (exposure) {
                     console.log(exposure);
                     total_exposure = exposure;
                  })

                  // console.log("total exposure", getUser[i].username, total_exposure);
                  var ischild = 0;
                  var childUsers = await User.find(filter1, { _id: 1, username: 1, role: 1, limit: 1, availableAmount: 1, exposure: 1 });
                  // console.log(childUsers.length);
                  if (childUsers.length > 0) {
                     ischild = 1;
                     for (var j = 0; j < childUsers.length; j++) {
                        // console.log("BB7777",i,getUser[i].role,getUser[i].username,childUsers[j].username,childUsers[j].role,childUsers[j].limit);

                        if (getUser[i].role == "user") {
                           total_exposure += childUsers[j].exposure;
                        }
                        if (childUsers[j].role == "user") {
                           totalbalance += childUsers[j].limit;
                        } else {
                           totalbalance += childUsers[j].limit;
                        }

                     }
                  }
                  // console.log("ischild",ischild);
                  if (totalbalance > 0 && ischild == 1) {
                     // console.log("BB8888",i,totalbalance,upperpercentage,ownpercentage);
                     if (findUser.role == "master") {
                        upperpercentage = ownpercentage + ownpercentage;
                     }
                     var totalpl = totalbalance - getUser[i].creditrefrence;
                     if (getUser[i].role != "user") {
                        var clientPl = (totalpl * (upperpercentage - ownpercentage)) / 100;
                        // totalbalance = (totalbalance + (-1 * clientPl));
                        // totalbalance = (totalbalance + (-1 * totalpl) + (-1 * clientPl));
                     } else {
                        var clientPl = totalpl;
                     }
                     // console.log("AB8899",i,totalbalance,totalpl,clientPl);
                  } else {
                     clientPl = 0;
                  }

                  // console.log("BB9999",i,totalbalance,clientPl);

                  getUser[i].clientPl = clientPl;
                  getUser[i].totalbalance = totalbalance;
                  getUser[i].totalexposure = total_exposure;
                  // getUser[i].totalUsers = totalUsers;

               }

               res.json({ response: getUser, totalUsers: totalUsers.length, success: true, "message": "User List Succes" });
            } else {
               res.json({ response: [], success: true, "message": "Empty User List " });
            }
         });
      });

   } catch (e) {
      console.log(e);
      return res.json({ response: [], success: true, "message": "DB error: Application error " });
   }
}

module.exports.getBalanceReport = async function (req, res) {
   try {

      console.log("getBalanceReport", req.body);
      // return res.send({ success: true, logout: false, message: "Server Error." });
      // let decoded = jwt.verify(req.token, myEnv.parsed.SECRET);
      let { userId } = jwt.decode(req.token);
      let dbAdmin = await User.findOne({ _id: userId, username: { $ne: "ZOLOWIN" } });
      if (!dbAdmin._id) return res.send({ success: false, logout: true, message: "Token Invalid. Please login in again." });
      if (dbAdmin.token != req.token) return res.send({ success: false, logout: true, message: "Token Invalid. Please login in again." });

      let { search, pageNumber, sortBy, limit } = req.body;

      var filter = {
         managerId: req.body.userId,
         // role: "user",
         ParentId: userId,
         deleted: false,
      };

      if (req.body.role == "master") {
         filter = {
            masterId: req.body.userId,
            // role: "manager",
            ParentId: userId,
            deleted: false,
         };
      }

      if (req.body.role == "subadmin") {
         filter = {
            subadminId: req.body.userId,
            // role: "master",
            ParentId: userId,
            deleted: false,
         };
      }

      if (req.body.role == "admin") {
         filter = {
            adminId: req.body.userId,
            // role: "subadmin",
            ParentId: userId,
            deleted: false,
         };
      }

      if (search) {
         filter.username = { $regex: search.toUpperCase() };
      }

      let setlimit = 10;
      if (limit) {
         setlimit = limit;
      }
      let page = pageNumber >= 1 ? pageNumber : 1;
      page = page - 1;
      let setskip = setlimit * page;

      var findUser = await User.findOne({ _id: req.body.userId }, { _id: 1, partnershipsetting: 1, role: 1 });
      // console.log(findUser.role);

      for (var k = 0; k < findUser.partnershipsetting.length; k++) {
         if (findUser.partnershipsetting[k].sport_id == 4) {
            upperpercentage = findUser.partnershipsetting[k].partnership;
         }
      }



      // console.log(filter);

      User.find(filter, { _id: 1, username: 1, role: 1, creditrefrence: 1, partnershipsetting: 1, ParentUser: 1, limit: 1, exposure: 1, availableAmount: 1, balance: 1 }, async function (err, getUser) {
         // console.log(getUser.length);

         // res.json({ response: users, success: true, "message": "User List Succes" });
         if (getUser) {
            // var totalbalance = 0;
            var clientPl = 0;
            var downlevelbalance = 0;
            var total_exposure = 0;
            var totalexposure = 0;
            var UsersCreditRefrence = 0;
            var UsersAvailBalance = 0;
            for (var i = 0; i < getUser.length; i++) {
               var totalbalance = 0;
               var ownpercentage = 100;
               if (getUser[i].role != "user") {
                  for (var k = 0; k < getUser[i].partnershipsetting.length; k++) {
                     if (getUser[i].partnershipsetting[k].sport_id == 4) {
                        ownpercentage = getUser[i].partnershipsetting[k].partnership;
                     }
                  }
               }
               var filter1 = {
                  _id: getUser[i]._id,
               };
               // console.log("AA6666",i,getUser[i].username,getUser[i].role,getUser[i].creditrefrence,getUser[i].balance,getUser[i].availableAmount);
               if (getUser[i].role == "manager") {
                  totalbalance = getUser[i].limit;
                  filter1 = {
                     managerId: getUser[i]._id,
                  };
               }

               if (getUser[i].role == "master") {
                  totalbalance = getUser[i].limit;
                  filter1 = {
                     masterId: getUser[i]._id,
                  };
               }

               if (getUser[i].role == "subadmin") {
                  totalbalance = getUser[i].limit;
                  filter1 = {
                     subadminId: getUser[i]._id,
                  };
               }
               if (getUser[i].role != "user") {
                  UsersCreditRefrence += parseFloat(getUser[i].creditrefrence);
               }
               UsersAvailBalance += parseFloat(getUser[i].balance);

               // console.log(filter1);

               // console.log("222 calculate exposure", filter1, getUser[i].role, getUser[i].username);
               // await getuserexposure(getUser[i].role, getUser[i]._id, function (exposure) {
               //    // console.log(exposure);
               //    totalexposure = exposure;
               // })

               // console.log("222 total exposure",getUser[i].username,totalexposure);

               // total_exposure += parseFloat(totalexposure);
               total_exposure += parseFloat(getUser[i].exposure);
               var ischild = 0;
               var childUsers = await User.find(filter1, { _id: 1, username: 1, role: 1, creditrefrence: 1, balance: 1, limit: 1, availableAmount: 1, exposure: 1 });
               // console.log(partnerpercentage);
               if (childUsers.length) {
                  ischild = 1;
                  for (var j = 0; j < childUsers.length; j++) {
                     // console.log("AA7777",i,childUsers[j].username,childUsers[j].role,childUsers[j].limit,childUsers[j].availableAmount,childUsers[j].creditrefrence);

                     if (getUser[i].role == "user") {
                        total_exposure += childUsers[j].exposure;
                     }
                     if (childUsers[j].role == "user") {
                        totalbalance += childUsers[j].limit;
                        // total_exposure += childUsers[j].exposure;
                     } else {
                        totalbalance += childUsers[j].limit;
                     }

                     UsersCreditRefrence += parseFloat(childUsers[j].creditrefrence);


                  }
               }

               if (totalbalance > 0 && ischild == 1) {
                  // console.log("AA8888",i,getUser[i].username,downlevelbalance,totalbalance,upperpercentage,ownpercentage,UsersCreditRefrence,UsersAvailBalance,total_exposure);
                  var totalpl = totalbalance - getUser[i].creditrefrence;
                  // console.log("totalpl",totalpl);
                  if (findUser.role == "master") {
                     upperpercentage = ownpercentage + ownpercentage;
                  }
                  if (getUser[i].role != "user") {
                     var userpl = (totalpl * (upperpercentage - ownpercentage)) / 100;
                     clientPl += userpl;
                     // console.log("clientPl",clientPl,userpl);
                     // totalbalance = (totalbalance  + (-1 * userpl));
                     // totalbalance = (totalbalance + (-1 * totalpl) + (-1 * clientPl));
                  } else {
                     clientPl += totalpl;
                  }
                  downlevelbalance += totalbalance;
               } else {
                  clientPl += 0;
                  downlevelbalance += totalbalance;
               }
               // console.log("AA9999",i,getUser[i].username,downlevelbalance,totalbalance,ownpercentage,UsersCreditRefrence,UsersAvailBalance,total_exposure);
            }


            var userData = {
               UpperlevelCreditRef: dbAdmin.creditrefrence,
               TotalMasterBal: dbAdmin.balance + downlevelbalance,
               AvailableBalance: dbAdmin.availableAmount,
               DownLevelOccupyBal: downlevelbalance,
               UpperLevel: dbAdmin.creditrefrence - (dbAdmin.balance + downlevelbalance),
               AvailableBalWPL: dbAdmin.balance,
               DownLevelCreditRef: UsersCreditRefrence,
               DownLevelPL: downlevelbalance - UsersCreditRefrence,
               MyPL: dbAdmin.balance - dbAdmin.availableAmount,
               UsersExposure: total_exposure,
               UsersAvailBalance: UsersAvailBalance,
            }
            //   console.log("Total",userData,UsersBalance,UsersCreditRefrence);
            res.json({ response: userData, success: true, "message": "server response success" });
         } else {
            res.json({ response: [], success: true, "message": "Empty User List " });
         }

      });

   } catch (e) {
      return res.json({ response: [], success: false, "message": "DB error: Application error " });
   }
}

async function getuserexposure(role, userId, _callback) {
   return new Promise((resolve, reject) => {
      var filter = {
         managerId: userId,
         deleted: false,
         result: 'ACTIVE'
      };

      if (role == "master") {
         filter = {
            masterId: userId,
            deleted: false,
            result: 'ACTIVE'
         };
      }

      if (role == "subadmin") {
         filter = {
            subadminId: userId,
            deleted: false,
            result: 'ACTIVE'
         };
      }

      // console.log("getuserexposure",filter,role);

      Bet.distinct('marketId', filter, async function (err, marketIds) {
         //   console.log("ye kya",marketIds)
         if (err) logger.error(err);
         await Market.find({
            deleted: false,
            marketId: {
               $in: marketIds
            }
         }, async function (err, markets) {
            var exposure = 0;
            if (err || !markets || markets.length < 1) {
               // console.log(exposure);
               // return exposure;
               _callback(exposure);
               resolve();
            }

            var counter = 0;
            var len = markets.length;
            await markets.forEach(async function (market, index) {
               // console.log(market.marketId,market.marketType);
               filter.marketId = market.marketId;
               // console.log(filter);
               // if (market.marketType != 'SESSION') {
               if (market.gtype == 'match' && market.gtype == 'match1') {
                  (async function (market, mindex, callback) {
                     await Bet.find(filter, async function (err, bets) {
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
                           var commision = bets[i].managerCommision;
                           if (role == "master") {
                              commision = bets[i].masterCommision;
                           }
                           if (role == "subadmin") {
                              commision = bets[i].subadminCommision;
                           }
                           // console.log(commision);
                           var op = -1;
                           if (bets[i].type == 'Back') op = 1;
                           for (var k in runnerProfit) {
                              // console.log(k,bets[i].runnerId);
                              if (k == bets[i].runnerId && bets[i].status == 'MATCHED') runnerProfit[k] += ((-1 * op) * parseFloat((bets[i].rate - 1) * bets[i].stake) * commision / 100);
                              else runnerProfit[k] += (op * parseFloat(bets[i].stake) * commision / 100);
                           }
                        }
                        // console.log(runnerProfit)
                        for (var key in runnerProfit) {
                           // console.log(runnerProfit[key],maxLoss)
                           if (runnerProfit[key] < 0 && runnerProfit[key] < maxLoss) maxLoss = runnerProfit[key];
                        }
                        // console.log(market.marketId + " market: " + market.marketName + " exposure: " + maxLoss);
                        callback(maxLoss, mindex);
                        return;
                     });
                  })(market, index, function (e, i) {
                     counter++;
                     if (counter == len) {
                        exposure += e * 1;
                        // logger.info("Total exposure: " + exposure);
                        // console.log(exposure);
                        _callback(exposure);
                        // return exposure;
                        resolve();
                        // res.json({ response: exposure, success: true, "message": "User List Succes" });
                     } else {
                        exposure += e * 1;
                     }
                  });
               } else {
                  (async function (market, mindex, callback) {
                     await Bet.find(filter, async function (err, bets) {
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
                              var commision = bets[i].managerCommision;
                              if (role == "master") {
                                 commision = bets[i].masterCommision;
                              }
                              if (role == "subadmin") {
                                 commision = bets[i].subadminCommision;
                              }
                              // console.log(commision);
                              if (bets[i].type == 'Lay') {
                                 if (result >= parseInt(bets[i].selectionName)) resultMaxLoss += parseFloat((bets[i].rate * bets[i].stake) * commision / 100);
                                 else resultMaxLoss -= (bets[i].stake * commision / 100);
                              } else {
                                 if (result < parseInt(bets[i].selectionName)) resultMaxLoss += (bets[i].stake * commision / 100);
                                 else resultMaxLoss -= parseFloat((bets[i].rate * bets[i].stake) * commision / 100);
                              }
                           }
                           if (resultMaxLoss < 0 && resultMaxLoss < maxLoss) maxLoss = resultMaxLoss;
                        }
                        logger.info("max loss " + maxLoss);
                        // console.log(market.marketId + " market: " + market.marketName + " exposure: " + maxLoss);
                        callback(maxLoss, mindex);
                        return;
                     });
                  })(market, index, function (e, i) {
                     counter++;
                     if (counter == len) {
                        exposure += e * 1;
                        logger.info("Total exposure: " + exposure);
                        // console.log(exposure);
                        _callback(exposure);
                        // return exposure;
                        resolve();
                        // res.json({ response: exposure, success: true, "message": "User List Succes" });
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
module.exports.getParentUserList = async function (req, res) {
   try {
      console.log(req.body)
      // let decoded = jwt.verify(req.token, myEnv.parsed.SECRET);
      let { userId } = jwt.decode(req.token);
      let dbAdmin = await User.findOne({ _id: userId, token: req.token });
      if (!dbAdmin) return res.send({ success: false, logout: true, message: "Token Invalid. Please login in again." });
      if (dbAdmin.token != req.token) return res.send({ success: false, logout: true, message: "Token Invalid. Please login in again." });

      let { search, pageNumber, sortBy, limit } = req.body;

      var filter = {
         managerId: req.body.userId,
         deleted: false,
      };

      if (req.body.role == "master") {
         filter = {
            masterId: req.body.userId,
            deleted: false,
         };
      }

      if (req.body.role == "subadmin") {
         filter = {
            subadminId: req.body.userId,
            deleted: false,
         };
      }

      if (req.body.role == "admin") {
         filter = {
            adminId: req.body.userId,
            deleted: false,
         };
      }

      User.find(filter, { username: 1 }).sort({
         username: 1
      }).exec(async function (err, getUser) {
         // console.log(getUser.length);

         // res.json({ response: users, success: true, "message": "User List Succes" });
         if (getUser) {
            res.json({ response: getUser, success: true, "message": "User List Succes" });
         } else {
            res.json({ response: [], success: true, "message": "Empty User List " });
         }

      });

   } catch (e) {
      console.log(e);
      return res.json({ response: [], success: false, "message": "DB error: Application error " });
   }
}

module.exports.updateAutoDeclare = async function (req, res) {
   // - validate request data
   // console.log(req.body);

   if (!req.body) return;
   if (!dbAdmin || !dbAdmin._id || !dbAdmin.key) return;
   if (!dbAdmin.username || !dbAdmin.role) return;
   // console.log(request);

   if (dbAdmin.role != 'siteadmin' && dbAdmin.role != 'techadmin' && dbAdmin.role != 'superadmin' && dbAdmin.role != 'admin' && dbAdmin.role != 'manager' && dbAdmin.role != 'master' && dbAdmin.role != 'subadmin') return;
   // authenticate manager
   User.findOne({
      _id: dbAdmin._id,
      role: dbAdmin.role,
      status: 'active',
      deleted: false,
      hash: dbAdmin.key
   }, function (err, dbAdmin) {
      // console.log(dbAdmin);
      if (err) logger.error(err);
      if (!dbAdmin) return;

      if (!dbAdmin.validTransPassword(dbAdmin.transpassword)) {
         dbAdmin.loginAttempts += 1;
         logger.error('update-password-success: Invalid Transaction password ' + dbAdmin.username);
         // console.log("Invalid Transaction password");
         return res.json({ response: [], success: false, "message": "Invalid Transaction password" });
      }

      const update = {
         autoresult: req.body.status,
      };

      Setting.updateMany({},
         update, { new: true }, async function (err, docs) {
            if (err) {
               console.log("DB error: Application error ", err);
               return res.json({ response: [], success: false, "message": "DB error: Application error " });
            }
            else {
               console.log("Status Changed");
               res.send({ data: docs, success: true, message: "Status Changed sucessfully" });
            }
         })
   });


}

module.exports.updateDeposit = async function (req, res) {

   // authenticate manager
   const session = await mongoose.startSession({
      readPreference: 'primary',
      readConcern: { level: 'majority' },
      writeConcern: { w: 'majority' },
   });
   try {
      console.log("updateDeposit", req.token, req.body)
      // let decoded = jwt.verify(req.token, myEnv.parsed.SECRET);
      let { userId } = jwt.decode(req.token);
      let dbAdmin = await User.findOne({ _id: userId, token: req.token });
      if (!dbAdmin) return res.send({ success: false, logout: true, message: "Token Invalid. Please login in again." });
      if (dbAdmin.token != req.token) return res.send({ success: false, logout: true, message: "Token Invalid. Please login in again." });
      if (dbAdmin.role != 'siteadmin' && dbAdmin.role != 'techadmin' && dbAdmin.role != 'superadmin' && dbAdmin.role != 'admin' && dbAdmin.role != 'manager' && dbAdmin.role != 'master' && dbAdmin.role != 'subadmin') return res.send({ success: false, logout: true, message: "Not Authorised." });
      await session.startTransaction();
      // console.log(dbAdmin);
      if (!dbAdmin.validTransPassword(req.body.transpassword)) {
         dbAdmin.loginAttempts += 1;
         logger.error('update-password-success: Invalid Transaction password ' + dbAdmin.username);
         console.log("Invalid Transaction password");
         await session.abortTransaction();
         await session.endSession();
         return res.json({ response: [], success: false, "message": "Invalid Transaction password" });
      }




      await User.findOne({ _id: req.body.targetUser.userId, role: req.body.targetUser.role },
         {
            _id: 1, username: 1, balance: 1, manager: 1, master: 1, subadmin: 1, admin: 1, Parentrole: 1, managerId: 1, masterId: 1, subadminId: 1, adminId: 1, ParentId: 1, availableAmount: 1, exposure: 1, limit: 1, manager: 1, ParentUser: 1, bounsStatus: 1, bounsBalance: 1,
         }).then(async dbUser => {
            var bounsAmount = 0;
            // if (dbUser.bounsStatus == 0) {
            // console.log(req.body.targetUser.amount)
            // var getBonus = await Bonus.findOne({ minAmount: { "$gte": req.body.targetUser.amount, "$lte": req.body.targetUser.amount }, status: "active" }, { bonusValue: 1 });
            // console.log(getBonus)
            // if (getBonus) {
            //    console.log("getBonus")
            //    bounsAmount = getBonus.bonusValue;
            //    depositBonus(dbUser._id, bounsAmount, session);
            // }
            // }

            await User.findOne({ _id: dbUser.ParentId, },
               {
                  _id: 1, username: 1, balance: 1, manager: 1, master: 1, subadmin: 1, admin: 1, managerId: 1, masterId: 1, subadminId: 1, adminId: 1, ParentId: 1, Parentrole: 1, ParentUser: 1, availableAmount: 1, exposure: 1, limit: 1
               }).then(async dbMUser => {

                  dbMUser.availableAmount = dbMUser.availableAmount - req.body.targetUser.amount;
                  var date = moment().tz("Asia/Calcutta").format('YYYY-MM-DD');
                  if (dbMUser.availableAmount < 0) {
                     await session.abortTransaction();
                     await session.endSession();
                     return res.json({ response: [], success: false, "message": " Your balance is low, please contact upline." });
                  } else {


                     User.updateOne({
                        '_id': dbUser._id
                     }, {
                        $inc: {
                           balance: req.body.targetUser.amount,
                           availableAmount: req.body.targetUser.amount,
                           limit: req.body.targetUser.amount
                        }
                     }).session(session).then(async (row1) => {

                        User.updateOne({
                           '_id': dbMUser._id
                        }, {
                           $inc: {
                              balance: -1 * req.body.targetUser.amount,
                              availableAmount: -1 * req.body.targetUser.amount,
                              limit: -1 * req.body.targetUser.amount
                           }
                        }).session(session).then(async (row) => {

                           var newlimit = parseFloat(dbUser.limit) + parseFloat(req.body.targetUser.amount);
                           var newAvAmount = parseFloat(dbUser.availableAmount) + parseFloat(req.body.targetUser.amount);
                           var oldlimit = dbUser.limit;
                           var oldAvAmount = dbUser.availableAmount;
                           var logSave = new Log();
                           logSave.username = dbUser.username;
                           logSave.userId = dbUser._id;
                           logSave.action = 'BALANCE';
                           logSave.subAction = 'BALANCE_DEPOSIT';
                           logSave.oldLimit = dbUser.limit;
                           logSave.amount = req.body.targetUser.amount;
                           logSave.availableAmount = newAvAmount;
                           logSave.newLimit = newlimit;
                           logSave.mnewLimit = dbMUser.balance;
                           logSave.description = 'Balance updated. Old Limit: ' + oldlimit + ' . New Limit: ' + newlimit;
                           logSave.manager = dbUser.manager;
                           logSave.master = dbUser.master;
                           logSave.subadmin = dbUser.subadmin;
                           logSave.admin = dbUser.admin;
                           logSave.ParentUser = dbUser.ParentUser;
                           logSave.managerId = dbUser.managerId;
                           logSave.masterId = dbUser.masterId;
                           logSave.subadminId = dbUser.subadminId;
                           logSave.adminId = dbUser.adminId;
                           logSave.ParentId = dbUser.ParentId;
                           logSave.Parentrole = dbUser.Parentrole;
                           logSave.remark = req.body.targetUser.remark;
                           logSave.time = new Date();
                           logSave.datetime = Math.round(+new Date() / 1000);
                           logSave.deleted = false;
                           logSave.createDate = date;
                           logSave.from = dbUser.ParentUser;
                           logSave.to = dbUser.username;
                           //console.log(log);
                           Log.create([logSave], { session }).then(async logsave => {

                              const payment = new Payment({
                                 type: 'Deposit',
                                 userId: dbUser._id,
                                 orderId: "",
                                 amount: req.body.targetUser.amount,
                                 name: dbUser.fullname,
                                 username: dbUser.username,
                                 paymentType: "Manual",
                                 depositId: "6454b5ef2d96cea5e8edfd56",
                                 status: 'Approved',
                                 image: "",
                                 managerType: dbUser.ParentRole,
                                 managerId: dbUser.ParentId,
                                 balance: dbUser.balance + req.body.targetUser.amount,
                                 to: "Wallet",
                                 refrenceNo: ""
                              });
                              payment.save()
                                 .then(async doc => {

                                    var Mnewlimit = parseFloat(dbMUser.limit) - parseFloat(req.body.targetUser.amount);
                                    var MnewAvAmount = parseFloat(dbMUser.availableAmount) - parseFloat(req.body.targetUser.amount);
                                    var Moldlimit = dbMUser.limit;
                                    var MoldAvAmount = dbMUser.availableAmount;
                                    var LogM = new Log();
                                    LogM.username = dbMUser.username;
                                    LogM.userId = dbMUser._id;
                                    LogM.action = 'BALANCE';
                                    LogM.subAction = 'BALANCE_WITHDRAWL';
                                    LogM.oldLimit = Moldlimit;
                                    LogM.amount = -1 * req.body.targetUser.amount;
                                    LogM.availableAmount = MnewAvAmount;
                                    LogM.newLimit = Mnewlimit;
                                    LogM.description = 'Balance updated. Old Limit: ' + Moldlimit + ' . New Limit: ' + Mnewlimit;
                                    LogM.remark = req.body.targetUser.remark;
                                    LogM.time = new Date();
                                    LogM.datetime = Math.round(+new Date() / 1000);
                                    LogM.createDate = date;
                                    LogM.deleted = false;
                                    LogM.manager = dbMUser.manager;
                                    LogM.master = dbMUser.master;
                                    LogM.subadmin = dbMUser.subadmin;
                                    LogM.admin = dbMUser.admin;
                                    LogM.ParentUser = dbMUser.ParentUser;
                                    LogM.managerId = dbMUser.managerId;
                                    LogM.masterId = dbMUser.masterId;
                                    LogM.subadminId = dbMUser.subadminId;
                                    LogM.adminId = dbMUser.adminId;
                                    LogM.ParentId = dbMUser.ParentId;
                                    LogM.Parentrole = dbMUser.Parentrole;
                                    LogM.from = dbUser.ParentUser;
                                    LogM.to = dbUser.username;
                                    Log.create([LogM], { session }).then(async logm => {
                                       await session.commitTransaction();
                                       await session.endSession();
                                       var userData = await User.findOne({ '_id': dbUser._id },
                                          {
                                             balance: 1, exposure: 1, limit: 1, username: 1
                                          });
                                       return res.json({ response: userData, success: true, "message": "success" });
                                    }).catch(async error => {
                                       await session.abortTransaction();
                                       await session.endSession();
                                       logger.error('place-bet-error: DBError', error);
                                       return res.json({ response: error, success: false, "message": "Server Error" });
                                    })
                                 })
                           });
                        }).catch(async error => {
                           await session.abortTransaction();
                           await session.endSession();
                           logger.error('place-bet-error: DBError', error);
                           return res.json({ response: error, success: false, "message": "Server Error" });
                        })
                     }).catch(async error => {
                        await session.abortTransaction();
                        await session.endSession();
                        logger.error('place-bet-error: DBError', error);
                        return res.json({ response: error, success: false, "message": "Server Error" });
                     })
                  }
               }).catch(async error => {
                  await session.abortTransaction();
                  await session.endSession();
                  logger.error('place-bet-error: DBError', error);
                  return res.json({ response: {}, success: false, "message": "Parent User Not Found" });
               })
         }).catch(async error => {
            await session.abortTransaction();
            await session.endSession();
            logger.error('place-bet-error: DBError', error);
            return res.json({ response: {}, success: false, "message": "User Not Found" });
         })

   } catch (error) {
      await session.abortTransaction();
      await session.endSession();
      console.log(error)
      return res.json({ response: error, success: false, "message": "Server Error" });
   }
}

async function depositBonus(userId, amount, session) {

   // authenticate manager
   // const session = await mongoose.startSession({
   //     readPreference: 'primary',
   //     readConcern: { level: 'majority' },
   //     writeConcern: { w: 'majority' },
   // });
   try {
      console.log("depositBonus", userId)
      //  await session.startTransaction();

      User.findOne({ _id: userId },
         {
            _id: 1, username: 1, balance: 1, manager: 1, master: 1, subadmin: 1, admin: 1, Parentrole: 1, managerId: 1, masterId: 1, subadminId: 1, adminId: 1, ParentId: 1, availableAmount: 1, exposure: 1, limit: 1, manager: 1, ParentUser: 1
         }).then(async dbUser => {
            User.findOne({ _id: dbUser.ParentId, },
               {
                  _id: 1, username: 1, balance: 1, manager: 1, master: 1, subadmin: 1, admin: 1, managerId: 1, masterId: 1, subadminId: 1, adminId: 1, ParentId: 1, Parentrole: 1, ParentUser: 1, availableAmount: 1, exposure: 1, limit: 1
               }).then(async dbMUser => {
                  dbMUser.availableAmount = dbMUser.availableAmount - amount;
                  var date = moment().tz("Asia/Calcutta").format('YYYY-MM-DD');
                  if (dbMUser.availableAmount < 0) {
                     await session.abortTransaction();
                     await session.endSession();
                     console.log("Your balance is low")
                     //   return res.json({ response: [], success: false, "message": " Your balance is low, please contact upline." });
                  } else {


                     User.updateOne({
                        '_id': dbUser._id
                     }, {
                        $inc: {
                           balance: amount,
                           bounsBalance: amount,
                           availableAmount: amount,
                           limit: amount
                        }
                     }).then(async (row1) => {

                        User.updateOne({
                           '_id': dbMUser._id
                        }, {
                           $inc: {
                              balance: -1 * amount,
                              availableAmount: -1 * amount,
                              limit: -1 * amount
                           }
                        }).then(async (row) => {

                           var newlimit = parseFloat(dbUser.limit) + parseFloat(amount);
                           var newAvAmount = parseFloat(dbUser.availableAmount) + parseFloat(amount);
                           var oldlimit = dbUser.limit;
                           var oldAvAmount = dbUser.availableAmount;
                           var logSave = new Log();
                           logSave.username = dbUser.username;
                           logSave.userId = dbUser._id;
                           logSave.action = 'BALANCE';
                           logSave.subAction = 'BONUS_DEPOSIT';
                           logSave.oldLimit = dbUser.limit;
                           logSave.amount = amount;
                           logSave.availableAmount = newAvAmount;
                           logSave.newLimit = newlimit;
                           logSave.mnewLimit = dbMUser.balance;
                           logSave.description = 'Bonus updated. Old Limit: ' + oldlimit + ' . New Limit: ' + newlimit;
                           logSave.manager = dbUser.manager;
                           logSave.master = dbUser.master;
                           logSave.subadmin = dbUser.subadmin;
                           logSave.admin = dbUser.admin;
                           logSave.ParentUser = dbUser.ParentUser;
                           logSave.managerId = dbUser.managerId;
                           logSave.masterId = dbUser.masterId;
                           logSave.subadminId = dbUser.subadminId;
                           logSave.adminId = dbUser.adminId;
                           logSave.ParentId = dbUser.ParentId;
                           logSave.Parentrole = dbUser.Parentrole;
                           logSave.remark = "Welcome bonus";
                           logSave.time = new Date();
                           logSave.datetime = Math.round(+new Date() / 1000);
                           logSave.deleted = false;
                           logSave.createDate = date;
                           logSave.from = dbUser.ParentUser;
                           logSave.to = dbUser.username;
                           //console.log(log);
                           Log.create([logSave]).then(async logsave => {

                              const payment = new Payment({
                                 type: 'Deposit',
                                 userId: dbUser._id,
                                 orderId: "",
                                 amount: amount,
                                 name: dbUser.fullname,
                                 username: dbUser.username,
                                 paymentType: "Manual",
                                 depositId: "6454b5ef2d96cea5e8edfd56",
                                 status: 'Approved',
                                 image: "",
                                 remarks: "Bunos",
                                 managerType: dbUser.ParentRole,
                                 managerId: dbUser.ParentId,
                                 balance: dbUser.balance + amount,
                                 to: "Wallet",
                                 refrenceNo: ""
                              });
                              payment.save()
                                 .then(async doc => {



                                    var Mnewlimit = parseFloat(dbMUser.limit) - parseFloat(amount);
                                    var MnewAvAmount = parseFloat(dbMUser.availableAmount) - parseFloat(amount);
                                    var Moldlimit = dbMUser.limit;
                                    var MoldAvAmount = dbMUser.availableAmount;
                                    var LogM = new Log();
                                    LogM.username = dbMUser.username;
                                    LogM.userId = dbMUser._id;
                                    LogM.action = 'BALANCE';
                                    LogM.subAction = 'BONUS_WITHDRAWL';
                                    LogM.oldLimit = Moldlimit;
                                    LogM.amount = -1 * amount;
                                    LogM.availableAmount = MnewAvAmount;
                                    LogM.newLimit = Mnewlimit;
                                    LogM.description = 'Balance updated. Old Limit: ' + Moldlimit + ' . New Limit: ' + Mnewlimit;
                                    LogM.remark = "Welcome Bonus";
                                    LogM.time = new Date();
                                    LogM.datetime = Math.round(+new Date() / 1000);
                                    LogM.createDate = date;
                                    LogM.deleted = false;
                                    LogM.manager = dbMUser.manager;
                                    LogM.master = dbMUser.master;
                                    LogM.subadmin = dbMUser.subadmin;
                                    LogM.admin = dbMUser.admin;
                                    LogM.ParentUser = dbMUser.ParentUser;
                                    LogM.managerId = dbMUser.managerId;
                                    LogM.masterId = dbMUser.masterId;
                                    LogM.subadminId = dbMUser.subadminId;
                                    LogM.adminId = dbMUser.adminId;
                                    LogM.ParentId = dbMUser.ParentId;
                                    LogM.Parentrole = dbMUser.Parentrole;
                                    LogM.from = dbUser.ParentUser;
                                    LogM.to = dbUser.username;
                                    Log.create([LogM]).then(async logm => {
                                       //  await session.commitTransaction();
                                       //  await session.endSession();
                                       await User.updateOne({ '_id': dbUser._id }, { bounsStatus: 1 });
                                       console.log("Welcome Bonus Balance Deposit")

                                       //   return res.json({ response: userData, success: true, "message": "success" });
                                    }).catch(async error => {
                                       //  await session.abortTransaction();
                                       //  await session.endSession();
                                       logger.error('place-bet-error: DBError', error);
                                       //   return res.json({ response: error, success: false, "message": "Server Error" });
                                    })
                                 });
                           });
                        }).catch(async error => {
                           //   await session.abortTransaction();
                           //   await session.endSession();
                           logger.error('place-bet-error: DBError', error);
                           // return res.json({ response: error, success: false, "message": "Server Error" });
                        })
                     }).catch(async error => {
                        //  await session.abortTransaction();
                        //  await session.endSession();
                        logger.error('place-bet-error: DBError', error);
                        //  return res.json({ response: error, success: false, "message": "Server Error" });
                     })
                  }
               }).catch(async error => {
                  //   await session.abortTransaction();
                  //   await session.endSession();
                  logger.error('place-bet-error: DBError', error);
                  //    return res.json({ response: {}, success: false, "message": "Parent User Not Found" });
               })
         }).catch(async error => {
            // await session.abortTransaction();
            // await session.endSession();
            logger.error('place-bet-error: DBError', error);
            //  return res.json({ response: {}, success: false, "message": "User Not Found" });
         })

   } catch (error) {
      //  await session.abortTransaction();
      //  await session.endSession();
      console.log(error)
      //    return res.json({ response: error, success: false, "message": "Server Error" });
   }
}

module.exports.updateWithdraw = async function (req, res) {
   const session = await mongoose.startSession({
      readPreference: 'primary',
      readConcern: { level: 'majority' },
      writeConcern: { w: 'majority' },
   });

   try {
      console.log("updateWithdraw", req.token)
      // let decoded = jwt.verify(req.token, myEnv.parsed.SECRET);
      let { userId } = jwt.decode(req.token);
      let dbAdmin = await User.findOne({ _id: userId, token: req.token });
      if (!dbAdmin) return res.send({ success: false, logout: true, message: "Token Invalid. Please login in again." });
      if (dbAdmin.token != req.token) return res.send({ success: false, logout: true, message: "Token Invalid. Please login in again." });
      if (dbAdmin.role != 'siteadmin' && dbAdmin.role != 'techadmin' && dbAdmin.role != 'superadmin' && dbAdmin.role != 'admin' && dbAdmin.role != 'manager' && dbAdmin.role != 'master' && dbAdmin.role != 'subadmin') return res.send({ success: false, logout: true, message: "Not Authorised." });

      await session.startTransaction();

      if (!dbAdmin.validTransPassword(req.body.transpassword)) {
         dbAdmin.loginAttempts += 1;
         logger.error('update-password-success: Invalid Transaction password ' + dbAdmin.username);
         console.log("Invalid Transaction password");
         await session.abortTransaction();
         await session.endSession();
         return res.json({ response: [], success: false, "message": "Invalid Transaction password" });
      }

      User.findOne({ _id: req.body.targetUser.userId, role: req.body.targetUser.role },
         {
            _id: 1, username: 1, balance: 1, bounsStatus: 1, bounsBalance: 1, manager: 1, master: 1, subadmin: 1, admin: 1, managerId: 1, masterId: 1, subadminId: 1, adminId: 1, ParentId: 1, Parentrole: 1, availableAmount: 1, exposure: 1, limit: 1, manager: 1, ParentUser: 1
         }).then(async dbUser => {
            if (req.body.targetUser.amount > dbUser.balance - dbUser.bounsBalance) {
               await session.abortTransaction();
               await session.endSession();
               return res.json({ response: [], success: false, "message": "Your balance is low, please contact upline." });
            } else {
               User.findOne({ _id: dbUser.ParentId, },
                  {
                     _id: 1, username: 1, balance: 1, manager: 1, master: 1, subadmin: 1, admin: 1, managerId: 1, masterId: 1, subadminId: 1, adminId: 1, ParentId: 1, Parentrole: 1, ParentUser: 1, availableAmount: 1, exposure: 1, limit: 1
                  }).then(async dbMUser => {
                     var date = moment().tz("Asia/Calcutta").format('YYYY-MM-DD');
                     User.updateOne({
                        '_id': dbMUser._id
                     }, {
                        $inc: {
                           balance: req.body.targetUser.amount,
                           availableAmount: req.body.targetUser.amount,
                           limit: req.body.targetUser.amount
                        }
                     }).session(session).then(async (row) => {
                        User.updateOne({
                           '_id': dbUser._id
                        }, {
                           $inc: {
                              balance: -1 * req.body.targetUser.amount,
                              availableAmount: -1 * req.body.targetUser.amount,
                              limit: -1 * req.body.targetUser.amount
                           }
                        }).session(session).then(async (row1) => {
                           var newlimit = parseFloat(dbUser.limit) - parseFloat(req.body.targetUser.amount);
                           var newAvAmount = parseFloat(dbUser.availableAmount) - parseFloat(req.body.targetUser.amount);
                           var oldlimit = dbUser.limit;
                           var logSave = new Log();
                           logSave.username = dbUser.username;
                           logSave.userId = dbUser._id;
                           logSave.action = 'BALANCE';
                           logSave.subAction = 'BALANCE_WITHDRAWL';
                           logSave.amount = -1 * req.body.targetUser.amount;
                           logSave.availableAmount = newAvAmount;
                           logSave.oldLimit = dbUser.limit;
                           logSave.newLimit = newlimit;
                           logSave.mnewLimit = dbMUser.balance;
                           logSave.description = 'Balance updated. Old Limit: ' + oldlimit + ' . New Limit: ' + newlimit;
                           logSave.manager = dbUser.manager;
                           logSave.master = dbUser.master;
                           logSave.subadmin = dbUser.subadmin;
                           logSave.admin = dbUser.admin;
                           logSave.ParentUser = dbUser.ParentUser;
                           logSave.managerId = dbUser.managerId;
                           logSave.masterId = dbUser.masterId;
                           logSave.subadminId = dbUser.subadminId;
                           logSave.admiIdn = dbUser.adminId;
                           logSave.ParentId = dbUser.ParentId;
                           logSave.Parentrole = dbUser.Parentrole;
                           logSave.remark = req.body.targetUser.remark;
                           logSave.time = new Date();
                           logSave.datetime = Math.round(+new Date() / 1000);
                           logSave.deleted = false;
                           logSave.createDate = date;
                           logSave.from = dbUser.ParentUser;
                           logSave.to = dbUser.username;
                           //console.log(log);
                           Log.create([logSave], { session }).then(async logsave => {
                              const payment = new Payment({
                                 type: 'Withdrawal',
                                 userId: dbUser._id,
                                 amount: req.body.targetUser.amount,
                                 name: dbUser.fullname,
                                 username: dbUser.username,
                                 paymentType: "Manual",
                                 paymentId: "6454b7892d96cea5e8edfd58",
                                 status: 'Approved',
                                 managerType: dbUser.ParentRole,
                                 managerId: dbUser.ParentId,
                                 balance: dbUser.balance - req.body.targetUser.amount,
                                 to: "Wallet",
                                 refrenceNo: ""
                              });
                              payment.save()
                                 .then(async doc => {

                                    var Mnewlimit = parseFloat(dbMUser.limit) + parseFloat(req.body.targetUser.amount);
                                    var MnewAvAmount = parseFloat(dbMUser.availableAmount) + parseFloat(req.body.targetUser.amount);
                                    var Moldlimit = dbMUser.limit;
                                    var LogM = new Log();
                                    LogM.username = dbMUser.username;
                                    LogM.userId = dbMUser._id;
                                    LogM.action = 'BALANCE';
                                    LogM.subAction = 'BALANCE_DEPOSIT';
                                    LogM.oldLimit = Moldlimit;
                                    LogM.amount = req.body.targetUser.amount;
                                    LogM.availableAmount = MnewAvAmount;
                                    LogM.newLimit = Mnewlimit;
                                    LogM.description = 'Balance updated. Old Limit: ' + Moldlimit + ' . New Limit: ' + Mnewlimit;
                                    LogM.remark = req.body.targetUser.remark;
                                    LogM.time = new Date();
                                    LogM.datetime = Math.round(+new Date() / 1000);
                                    LogM.createDate = date;
                                    LogM.deleted = false;
                                    LogM.manager = dbMUser.manager;
                                    LogM.master = dbMUser.master;
                                    LogM.subadmin = dbMUser.subadmin;
                                    LogM.admin = dbMUser.admin;
                                    LogM.ParentUser = dbMUser.ParentUser;
                                    LogM.managerId = dbMUser.managerId;
                                    LogM.masterId = dbMUser.masterId;
                                    LogM.subadminId = dbMUser.subadminId;
                                    LogM.adminId = dbMUser.adminId;
                                    LogM.ParentId = dbMUser.ParentId;
                                    LogM.Parentrole = dbMUser.Parentrole;
                                    LogM.from = dbUser.ParentUser;
                                    LogM.to = dbUser.username;
                                    Log.create([LogM], { session }).then(async logm => {
                                       await session.commitTransaction();
                                       await session.endSession();
                                       var userData = await User.findOne({ '_id': dbUser._id },
                                          {
                                             balance: 1, exposure: 1, limit: 1, username: 1
                                          });
                                       return res.json({ response: userData, success: true, "message": "success" });
                                    }).catch(async error => {
                                       await session.abortTransaction();
                                       await session.endSession();
                                       logger.error('place-bet-error: DBError', error);
                                       return res.json({ response: error, success: false, "message": "Server Error" });
                                    })
                                 });
                           });
                        }).catch(async error => {
                           await session.abortTransaction();
                           await session.endSession();
                           logger.error('place-bet-error: DBError', error);
                           return res.json({ response: error, success: false, "message": "Server Error" });
                        })
                     }).catch(async error => {
                        await session.abortTransaction();
                        await session.endSession();
                        logger.error('place-bet-error: DBError', error);
                        return res.json({ response: error, success: false, "message": "Server Error" });
                     })
                  }).catch(async error => {
                     await session.abortTransaction();
                     await session.endSession();
                     logger.error('place-bet-error: DBError', error);
                     return res.json({ response: {}, success: false, "message": "Parent User Not Found" });
                  })
            }
         }).catch(async error => {
            await session.abortTransaction();
            await session.endSession();
            logger.error('place-bet-error: DBError', error);
            return res.json({ response: {}, success: false, "message": "User Not Found" });
         })

   } catch (error) {
      await session.abortTransaction();
      await session.endSession();
      console.log(e)
      return res.json({ response: error, success: false, "message": "Server Error" });
   }
}

module.exports.getParentLockStatus = async function (req, res) {
   try {
      console.log("getLockUserList", req.token)
      // let decoded = jwt.verify(req.token, myEnv.parsed.SECRET);
      let { userId } = jwt.decode(req.token);
      let dbAdmin = await User.findOne({ _id: userId, token: req.token });
      if (!dbAdmin) return res.send({ success: false, logout: true, message: "Token Invalid. Please login in again." });
      if (dbAdmin.token != req.token) return res.send({ success: false, logout: true, message: "Token Invalid. Please login in again." });
      let max = 500;
      let { eventId, bettype } = req.body;

      Lock.findOne({ "eventId": eventId, bettype: bettype }, { userBlocks: 1 })
         .then(async data => {
            var status = false;
            // console.log(data)
            if (data) {
               let lockusers = data.userBlocks;
               if (lockusers.includes(dbAdmin.masterId)) {
                  status = true;
               }
               if (lockusers.includes(dbAdmin.subadminId)) {
                  status = true;
               }
               if (lockusers.includes(dbAdmin.adminId)) {
                  status = true;
               }
               res.json({ response: status, success: true, "message": "server response success" });
            }
            else {

               res.json({ response: status, success: true, "message": "server response success" });
            }
         })
   } catch (err) {
      // console.log(err)
      res.json({ response: err, success: false, "message": "server response success" });
   }
}

module.exports.getLockStatus = async function (req, res) {
   try {
      console.log("getLockUserList", req.token)
      // let decoded = jwt.verify(req.token, myEnv.parsed.SECRET);
      let { userId } = jwt.decode(req.token);
      let dbAdmin = await User.findOne({ _id: userId, token: req.token });
      if (!dbAdmin) return res.send({ success: false, logout: true, message: "Token Invalid. Please login in again." });
      if (dbAdmin.token != req.token) return res.send({ success: false, logout: true, message: "Token Invalid. Please login in again." });
      let max = 500;

      let { eventId, bettype } = req.body;

      Lock.findOne({ "eventId": eventId, bettype: bettype }, { userBlocks: 1 })
         .then(async data => {
            var status = false;
            // console.log(data)
            if (data) {
               let lockusers = data.userBlocks;
               if (lockusers.includes(userId)) {
                  status = true;
               }
               res.json({ response: status, success: true, "message": "server response success" });
            }
            else {
               res.json({ response: status, success: true, "message": "server response success" });
            }
         })
   } catch (err) {
      // console.log(err)
      res.json({ response: err, success: false, "message": "server response success" });
   }
}

module.exports.getLockUserList = async function (req, res) {
   try {
      console.log("getLockUserList", req.token)
      // let decoded = jwt.verify(req.token, myEnv.parsed.SECRET);
      let { userId } = jwt.decode(req.token);
      let dbAdmin = await User.findOne({ _id: userId, token: req.token });
      if (!dbAdmin) return res.send({ success: false, logout: true, message: "Token Invalid. Please login in again." });
      if (dbAdmin.token != req.token) return res.send({ success: false, logout: true, message: "Token Invalid. Please login in again." });

      let { eventId, bettype } = req.body;
      User.find({ ParentId: userId }, { _id: 1, username: 1 }).sort({
         username: 1
      }).exec(async function (err, getUsers) {

         if (getUsers) {

            var lockusers = [];
            var Users = await Lock.findOne({ "eventId": eventId, bettype: bettype }, { userBlocks: 1 });
            if (Users) {
               lockusers = Users.userBlocks;
            }
            console.log(lockusers)
            for (var i = 0; i < getUsers.length; i++) {
               console.log(getUsers[i]._id, userId);
               var getuserId = getUsers[i]._id.toString();
               var status = false;
               // if (lockusers.includes(getuserId) || lockusers.includes(userId)) {
               if (lockusers.includes(getuserId)) {
                  console.log(getuserId)
                  status = true;
               }
               getUsers[i].status = status;
            }
            res.json({ response: getUsers, success: true, "message": "User List Succes" });
         } else {
            res.json({ response: [], success: true, "message": "Empty User List " });
         }
      });
   } catch (err) {
      console.log(err)
      res.json({ response: err, success: false, "message": "server response success" });
   }
}

module.exports.updateExposure = async function (req, res) {
   try {
      console.log("updateExposure", req.token)
      // let decoded = jwt.verify(req.token, myEnv.parsed.SECRET);
      let { userId } = jwt.decode(req.token);
      let dbAdmin = await User.findOne({ _id: userId, token: req.token });
      if (!dbAdmin) return res.send({ success: false, logout: true, message: "Token Invalid. Please login in again." });
      if (dbAdmin.token != req.token) return res.send({ success: false, logout: true, message: "Token Invalid. Please login in again." });

      if (dbAdmin.role != 'siteadmin' && dbAdmin.role != 'techadmin' && dbAdmin.role != 'superadmin' && dbAdmin.role != 'admin' && dbAdmin.role != 'manager' && dbAdmin.role != 'master' && dbAdmin.role != 'subadmin') return res.send({ success: false, logout: true, message: "Token Invalid. Please login in again." });
      // authenticate manager

      if (!dbAdmin.validTransPassword(req.body.transpassword)) {
         dbAdmin.loginAttempts += 1;
         logger.error('update-password-success: Invalid Transaction password ' + dbAdmin.username);
         return res.json({ response: [], success: false, "message": "Invalid Transaction password " });
      }

      const update = {
         exposurelimit: req.body.targetUser.exposure,
      };

      User.findOneAndUpdate({ _id: req.body.targetUser.userId, role: req.body.targetUser.role, },
         update, function (err, docs) {
            if (err) {
               console.log("DB error: Application error ", err);
               return res.json({ response: [], success: false, "message": "DB error: Application error " });
            }
            else {

               var logSave = new Log();
               logSave.username = docs.username;
               logSave.userId = req.body.targetUser.userId;
               logSave.action = 'EXPOSURE_LIMIT';
               logSave.subAction = 'EXPOSURE_LIMIT';
               logSave.oldLimit = req.body.targetUser.oldexposure;
               logSave.newLimit = req.body.targetUser.exposure;
               logSave.description = 'Exposure limit updated. Old Limit: ' + req.body.targetUser.oldexposure + ' . New Limit: ' + req.body.targetUser.exposure;
               logSave.remark = req.body.targetUser.remark;
               logSave.manager = docs.manager;
               logSave.master = docs.master;
               logSave.subadmin = docs.subadmin;
               logSave.admin = docs.admin;
               logSave.managerId = docs.managerId;
               logSave.masterId = docs.masterId;
               logSave.subadminId = docs.subadminId;
               logSave.adminId = docs.adminId;
               logSave.actionBy = dbAdmin.username;
               logSave.createdId = dbAdmin._id;
               logSave.time = new Date();
               logSave.datetime = Math.round(+new Date() / 1000);
               logSave.deleted = false;
               //console.log(log);
               logSave.save(function (err) {
                  if (err) { }
                  res.send({ data: docs, success: true, message: "Exposure limit updated sucessfully" });
               });


            }
         })

   } catch (err) {
      console.log(err)
      res.json({ response: err, success: false, "message": "server response success" });
   }

}

module.exports.updateCredit = async function (req, res) {
   try {
      console.log("updateCredit", req.token)
      // let decoded = jwt.verify(req.token, myEnv.parsed.SECRET);
      let { userId } = jwt.decode(req.token);
      let dbAdmin = await User.findOne({ _id: userId, token: req.token });
      if (!dbAdmin) return res.send({ success: false, logout: true, message: "Token Invalid. Please login in again." });
      if (dbAdmin.token != req.token) return res.send({ success: false, logout: true, message: "Token Invalid. Please login in again." });

      if (dbAdmin.role != 'siteadmin' && dbAdmin.role != 'techadmin' && dbAdmin.role != 'superadmin' && dbAdmin.role != 'admin' && dbAdmin.role != 'manager' && dbAdmin.role != 'master' && dbAdmin.role != 'subadmin') return res.send({ success: false, logout: true, message: "Token Invalid. Please login in again." });

      if (!dbAdmin.validTransPassword(req.body.transpassword)) {
         dbAdmin.loginAttempts += 1;
         logger.error('update-password-success: Invalid Transaction password ' + dbAdmin.username);
         return res.json({ response: [], success: false, "message": "Invalid Transaction password " });
      }

      const update = {
         creditrefrence: req.body.targetUser.credit,
      };

      User.findOneAndUpdate({ _id: req.body.targetUser.userId, role: req.body.targetUser.role, },
         update, function (err, docs) {
            if (err) {
               console.log("DB error: Application error ", err);
               return res.json({ response: [], success: false, "message": "DB error: Application error " });
            }
            else {

               var logSave = new Log();
               logSave.username = docs.username;
               logSave.userId = req.body.targetUser.userId;
               logSave.action = 'CREDIT_REFRENCE';
               logSave.subAction = 'CREDIT_REFRENCE';
               logSave.oldLimit = req.body.targetUser.oldcredit;
               logSave.newLimit = req.body.targetUser.credit;
               logSave.description = 'Credit refrence updated. Old Limit: ' + req.body.targetUser.oldcredit + ' . New Limit: ' + req.body.targetUser.credit;
               logSave.remark = req.body.targetUser.remark;
               logSave.manager = docs.manager;
               logSave.master = docs.master;
               logSave.subadmin = docs.subadmin;
               logSave.admin = docs.admin;
               logSave.managerId = docs.managerId;
               logSave.masterId = docs.masterId;
               logSave.subadminId = docs.subadminId;
               logSave.adminId = docs.adminId;
               logSave.actionBy = dbAdmin.username;
               logSave.createdId = dbAdmin._id;
               logSave.time = new Date();
               logSave.datetime = Math.round(+new Date() / 1000);
               logSave.deleted = false;
               //console.log(log);
               logSave.save(function (err) {
                  if (err) { }

                  res.send({ data: docs, success: true, message: "Credit refrence updated sucessfully" });
               });


            }
         })

   } catch (err) {
      console.log(err)
      res.json({ response: err, success: false, "message": "server response success" });
   }

}

module.exports.getUserEvenets = async function (req, res) {
   try {
      console.log("getUserEvenets", req.token)
      // let decoded = jwt.verify(req.token, myEnv.parsed.SECRET);
      let { userId } = jwt.decode(req.token);
      let dbAdmin = await User.findOne({ _id: userId, token: req.token });
      if (!dbAdmin) return res.send({ success: false, logout: true, message: "Token Invalid. Please login in again." });
      if (dbAdmin.token != req.token) return res.send({ success: false, logout: true, message: "Token Invalid. Please login in again." });
      // if (dbAdmin.role != 'siteadmin' && dbAdmin.role != 'techadmin' && dbAdmin.role != 'superadmin' && dbAdmin.role != 'admin' && dbAdmin.role != 'manager' && dbAdmin.role != 'master' && dbAdmin.role != 'subadmin') return res.send({ success: false, logout: true, message: "Token Invalid. Please login in again." });

      User.findOne({ _id: req.body.targetUser.userId, role: req.body.targetUser.role, }, { availableEventTypes: 1 })
         .then(async data => {
            if (data) {
               res.json({ response: data, parent: dbAdmin.availableEventTypes, success: true, "message": "server response success" });
            }
            else {
               res.json({ response: [], success: true, "message": "server response success" });
            }
         })

   } catch (err) {
      console.log(err)
      res.json({ response: err, success: false, "message": "server response success" });
   }
}

module.exports.updateStatus = async function (req, res) {
   try {
      // console.log("updateStatus", req.token,req.body)
      // let decoded = jwt.verify(req.token, myEnv.parsed.SECRET);
      let { userId } = jwt.decode(req.token);
      let dbAdmin = await User.findOne({ _id: userId, token: req.token });
      if (!dbAdmin) return res.send({ success: false, logout: true, message: "Token Invalid. Please login in again." });
      if (dbAdmin.token != req.token) return res.send({ success: false, logout: true, message: "Token Invalid. Please login in again." });

      if (dbAdmin.role != 'siteadmin' && dbAdmin.role != 'techadmin' && dbAdmin.role != 'superadmin' && dbAdmin.role != 'admin' && dbAdmin.role != 'manager' && dbAdmin.role != 'master' && dbAdmin.role != 'subadmin') return res.send({ success: false, logout: true, message: "Token Invalid. Please login in again." });

      if (!dbAdmin.validTransPassword(req.body.transpassword)) {
         dbAdmin.loginAttempts += 1;
         logger.error('update-password-success: Invalid Transaction password ' + dbAdmin.username);
         // console.log("Invalid Transaction password");
         return res.json({ response: [], success: false, "message": "Invalid Transaction password" });
      }

      var filter = {
         managerId: req.body.targetUser.userId,
      };

      if (req.body.targetUser.role == "master") {
         filter = {
            masterId: req.body.targetUser.userId,
         };
      }

      if (req.body.targetUser.role == "subadmin") {
         filter = {
            subadminId: req.body.targetUser.userId,
         };
      }

      if (req.body.targetUser.role == "admin") {
         filter = {
            adminId: req.body.targetUser.userId,
         };
      }

      const update = {
         status: req.body.targetUser.status,
         token: ""
      };

      User.findOneAndUpdate({ _id: req.body.targetUser.userId, role: req.body.targetUser.role, },
         update, async function (err, docs) {
            if (err) {
               console.log("DB error: Application error ", err);
               return res.json({ response: [], success: false, "message": "DB error: Application error " });
            }
            else {
               await User.updateMany(filter, update, function (errk, raw) {
                  console.log("Status Changed");
                  res.send({ data: docs, success: true, message: "Status Changed sucessfully" });
               })
            }
         })


   } catch (err) {
      console.log(err)
      res.json({ response: err, success: false, "message": "server response success" });
   }
}

module.exports.updateBetStatus = async function (req, res) {
   try {
      console.log("updateBetStatus", req.token)
      // let decoded = jwt.verify(req.token, myEnv.parsed.SECRET);
      let { userId } = jwt.decode(req.token);
      let dbAdmin = await User.findOne({ _id: userId, token: req.token });
      if (!dbAdmin) return res.send({ success: false, logout: true, message: "Token Invalid. Please login in again." });
      if (dbAdmin.token != req.token) return res.send({ success: false, logout: true, message: "Token Invalid. Please login in again." });
      if (dbAdmin.role != 'siteadmin' && dbAdmin.role != 'techadmin' && dbAdmin.role != 'superadmin' && dbAdmin.role != 'admin' && dbAdmin.role != 'manager' && dbAdmin.role != 'master' && dbAdmin.role != 'subadmin') return res.send({ success: false, logout: true, message: "Token Invalid. Please login in again." });

      if (!dbAdmin.validTransPassword(req.body.transpassword)) {
         dbAdmin.loginAttempts += 1;
         logger.error('update-password-success: Invalid Transaction password ' + dbAdmin.username);
         // console.log("Invalid Transaction password");
         return res.json({ response: [], success: false, "message": "Invalid Transaction password" });
      }

      var filter = {
         managerId: req.body.targetUser.userId,
      };

      if (req.body.targetUser.role == "master") {
         filter = {
            masterId: req.body.targetUser.userId,
         };
      }

      if (req.body.targetUser.role == "subadmin") {
         filter = {
            subadminId: req.body.targetUser.userId,
         };
      }

      if (req.body.targetUser.role == "admin") {
         filter = {
            adminId: req.body.targetUser.userId,
         };
      }

      const update = {
         betStatus: req.body.targetUser.status,
      };

      User.findOneAndUpdate({ _id: req.body.targetUser.userId, role: req.body.targetUser.role },
         update, async function (err, docs) {
            if (err) {
               console.log("DB error: Application error ", err);
               return res.json({ response: [], success: false, "message": "DB error: Application error " });
            }
            else {
               await User.updateMany(filter, update, function (errk, raw) {
                  console.log("Status Changed bet status");
                  res.send({ data: docs, success: true, message: "Status Changed sucessfully" });
               });
            }
         })

   } catch (err) {
      console.log(err)
      res.json({ response: err, success: false, "message": "server response success" });
   }

}

module.exports.updateSportEvents = async function (req, res) {
   try {
      console.log("updateSportEvents", req.token)
      // let decoded = jwt.verify(req.token, myEnv.parsed.SECRET);
      let { userId } = jwt.decode(req.token);
      let dbAdmin = await User.findOne({ _id: userId, token: req.token });
      if (!dbAdmin) return res.send({ success: false, logout: true, message: "Token Invalid. Please login in again." });
      if (dbAdmin.token != req.token) return res.send({ success: false, logout: true, message: "Token Invalid. Please login in again." });
      if (dbAdmin.role != 'siteadmin' && dbAdmin.role != 'techadmin' && dbAdmin.role != 'superadmin' && dbAdmin.role != 'admin' && dbAdmin.role != 'manager' && dbAdmin.role != 'master' && dbAdmin.role != 'subadmin') return res.send({ success: false, logout: true, message: "Token Invalid. Please login in again." });

      if (!dbAdmin.validTransPassword(req.body.transpassword)) {
         dbAdmin.loginAttempts += 1;
         logger.error('update-password-success: Invalid Transaction password ' + dbAdmin.username);
         // console.log("Invalid Transaction password");
         return res.json({ response: [], success: false, "message": "Invalid Transaction password" });
      }

      let avalEvents = [];
      if (req.body.status.cricket) {
         avalEvents.push(req.body.status.cricket)
      }
      if (req.body.status.soccer) {
         avalEvents.push(req.body.status.soccer)
      }
      if (req.body.status.tennis) {
         avalEvents.push(req.body.status.tennis)
      }
      if (req.body.status.casino) {
         avalEvents.push(req.body.status.casino)
      }
      if (req.body.status.live_casino) {
         avalEvents.push(req.body.status.live_casino)
      }

      // console.log(avalEvents);

      var filter = {
         managerId: req.body.targetUser.userId,
      };

      if (req.body.targetUser.role == "master") {
         filter = {
            masterId: req.body.targetUser.userId,
         };
      }

      if (req.body.targetUser.role == "subadmin") {
         filter = {
            subadminId: req.body.targetUser.userId,
         };
      }

      if (req.body.targetUser.role == "admin") {
         filter = {
            adminId: req.body.targetUser.userId,
         };
      }

      const update = {
         availableEventTypes: avalEvents,
      };

      User.findOneAndUpdate({ _id: req.body.targetUser.userId, role: req.body.targetUser.role },
         update, async function (err, docs) {
            if (err) {
               console.log("DB error: Application error ", err);
               return res.json({ response: [], success: false, "message": "DB error: Application error " });
            }
            else {
               await User.updateMany(filter, update, function (errk, raw) {
                  console.log("Status Changed bet status");
                  res.send({ data: docs, success: true, message: "Status Changed sucessfully" });
               });
            }
         })

   } catch (err) {
      console.log(err)
      res.json({ response: err, success: false, "message": "server response success" });
   }

}

module.exports.getSetting = async function (req, res) {
   try {
      console.log("getSetting", req.token)
      // let decoded = jwt.verify(req.token, myEnv.parsed.SECRET);
      let { userId } = jwt.decode(req.token);
      let dbAdmin = await User.findOne({ _id: userId, token: req.token });
      if (!dbAdmin) return res.send({ success: false, logout: true, message: "Token Invalid. Please login in again." });
      if (dbAdmin.token != req.token) return res.send({ success: false, logout: true, message: "Token Invalid. Please login in again." });
      if (dbAdmin.role != 'siteadmin' && dbAdmin.role != 'techadmin' && dbAdmin.role != 'superadmin' && dbAdmin.role != 'admin' && dbAdmin.role != 'manager' && dbAdmin.role != 'master' && dbAdmin.role != 'subadmin') return res.send({ success: false, logout: true, message: "Token Invalid. Please login in again." });

      Setting.findOne({}, async function (err, docs) {
         if (err) {
            console.log("DB error: Application error ", err);
            return res.json({ response: [], success: false, "message": "DB error: Application error " });
         }
         else {
            console.log("Status Changed");
            res.send({ data: docs, success: true, message: "Status Changed sucessfully" });
         }
      })

   } catch (err) {
      console.log(err)
      res.json({ response: err, success: false, "message": "server response success" });
   }

}

module.exports.generalReport = async function (req, res) {
   try {
      console.log("generalReport", req.token)
      // let decoded = jwt.verify(req.token, myEnv.parsed.SECRET);
      let { userId } = jwt.decode(req.token);
      let dbAdmin = await User.findOne({ _id: userId, token: req.token });
      if (!dbAdmin) return res.send({ success: false, logout: true, message: "Token Invalid. Please login in again." });
      if (dbAdmin.token != req.token) return res.send({ success: false, logout: true, message: "Token Invalid. Please login in again." });
      if (dbAdmin.role != 'siteadmin' && dbAdmin.role != 'techadmin' && dbAdmin.role != 'superadmin' && dbAdmin.role != 'admin' && dbAdmin.role != 'manager' && dbAdmin.role != 'master' && dbAdmin.role != 'subadmin') return res.send({ success: false, logout: true, message: "Token Invalid. Please login in again." });

      // console.log(req.body);
      let { pageNumber, sortBy, limit } = req.body;

      var filter = {
         "$or": [{ "managerId": dbAdmin._id }, { "_id": dbAdmin._id }],
         "role": "user"
      };

      if (dbAdmin.role == "master") {
         filter = {
            "$or": [{ "masterId": dbAdmin._id }, { "_id": dbAdmin._id }],
            "role": "manager"
         };
      }

      if (dbAdmin.role == "subadmin") {
         filter = {
            "$or": [{ "subadminId": dbAdmin._id }, { "_id": dbAdmin._id }],
            "role": "master"
         };
      }

      if (dbAdmin.role == "admin") {
         filter = {
            "$or": [{ "adminId": dbAdmin._id }, { "_id": dbAdmin._id }],
            "role": "subadmin"
         };
      }

      let setlimit = 10;
      if (limit) {
         setlimit = limit;
      }
      let page = pageNumber >= 1 ? pageNumber : 1;
      page = page - 1;
      let setskip = setlimit * page;

      // console.log(filter);
      User.find(filter, { username: 1, balance: 1, casinobalance: 1, role: 1, creditrefrence: 1, manager: 1 }, { skip: setskip, limit: setlimit }).sort({
         username: 1
      }).exec(function (err, dbMarket) {
         res.json({ response: dbMarket, success: true, "message": "server response success" });
      });
   } catch (err) {
      console.log(err)
      res.json({ response: err, success: false, "message": "server response success" });
   }
}

module.exports.updateSetting = async function (req, res) {
   try {
      console.log("getSetting", req.token)
      // let decoded = jwt.verify(req.token, myEnv.parsed.SECRET);
      let { userId } = jwt.decode(req.token);
      let dbAdmin = await User.findOne({ _id: userId, token: req.token });
      if (!dbAdmin) return res.send({ success: false, logout: true, message: "Token Invalid. Please login in again." });
      if (dbAdmin.token != req.token) return res.send({ success: false, logout: true, message: "Token Invalid. Please login in again." });
      if (dbAdmin.role != 'siteadmin' && dbAdmin.role != 'techadmin' && dbAdmin.role != 'superadmin' && dbAdmin.role != 'admin' && dbAdmin.role != 'manager' && dbAdmin.role != 'master' && dbAdmin.role != 'subadmin') return res.send({ success: false, logout: true, message: "Token Invalid. Please login in again." });

      if (!dbAdmin.validTransPassword(req.body.transpassword)) {
         dbAdmin.loginAttempts += 1;
         logger.error('update-password-success: Invalid Transaction password ' + dbAdmin.username);
         // console.log("Invalid Transaction password");
         return res.json({ response: [], success: false, "message": "Invalid Transaction password" });
      }

      const update = {
         fancyMinLimit: req.body.setting.fancyMinLimit,
         fancyMaxLimit: req.body.setting.fancyMaxLimit,
         oddsMinLimit: req.body.setting.oddsMinLimit,
         oddsMaxLimit: req.body.setting.oddsMaxLimit,
         bookmakerMinLimit: req.body.setting.bookmakerMinLimit,
         bookmakerMaxLimit: req.body.setting.bookmakerMaxLimit,
         fancyBetDelay: req.body.setting.fancyBetDelay,
         oddsBetDelay: req.body.setting.oddsBetDelay,
         bookmakerBetDelay: req.body.setting.bookmakerBetDelay,
         casinourl: req.body.setting.casinourl,
         casinousername: req.body.setting.casinousername,
         casinopassword: req.body.setting.casinopassword,
         casinopasskey: req.body.setting.casinopasskey,
         razorpaystatus: req.body.setting.razorpaystatus,
      };

      Setting.updateMany({},
         update, { new: true }, async function (err, docs) {
            if (err) {
               console.log("DB error: Application error ", err);
               return res.json({ response: [], success: false, "message": "DB error: Application error " });
            }
            else {
               console.log("Status Changed");
               res.send({ data: docs, success: true, message: "Status Changed sucessfully" });
            }
         })

   } catch (err) {
      console.log(err)
      res.json({ response: err, success: false, "message": "server response success" });
   }

}



module.exports.HomeGames = async (req, res) => {
   try {
      Setting.findOne({}, { casinogames: 1 }, function (err, games) {
         // console.log(user);
         res.send({ games, success: true, message: "Games get successfully" });
      });
   }
   catch (error) {
      res.send({ error, success: false, message: "Unknown error" });
   }
}


/////----Bonus-----/////

module.exports.getAllBonus = async (req, res) => {
   try {
      console.log("updateCredit", req.token)
      // let decoded = jwt.verify(req.token, myEnv.parsed.SECRET);
      let { userId } = jwt.decode(req.token);
      let dbAdmin = await User.findOne({ _id: userId, token: req.token });
      if (!dbAdmin) return res.send({ success: false, logout: true, message: "Token Invalid. Please login in again." });
      if (dbAdmin.token != req.token) return res.send({ success: false, logout: true, message: "Token Invalid. Please login in again." });


      Bonus.find({})
         .then(doc => {
            res.send({ doc, success: true, message: "bonus get successfully" });
         })
         .catch(error => {
            res.send({ error, success: false, message: "DB error in getting bonus" });
         })
   }
   catch (error) {
      res.send({ error, success: false, message: "Unknown error" });
   }
}

module.exports.getBonusById = async (req, res) => {
   try {
      console.log("updateCredit", req.token)
      // let decoded = jwt.verify(req.token, myEnv.parsed.SECRET);
      let { userId } = jwt.decode(req.token);
      let dbAdmin = await User.findOne({ _id: userId, token: req.token });
      if (!dbAdmin) return res.send({ success: false, logout: true, message: "Token Invalid. Please login in again." });
      if (dbAdmin.token != req.token) return res.send({ success: false, logout: true, message: "Token Invalid. Please login in again." });


      Bonus.find({ _id: req.body.bonusId })
         .then(doc => {
            res.send({ doc, success: true, message: "bonus get successfully" });
         })
         .catch(error => {
            res.send({ error, success: false, message: "DB error in getting bonus" });
         })
   }
   catch (error) {
      res.send({ error, success: false, message: "Unknown error" });
   }
}

module.exports.addBonus = async (req, res) => {
   try {
      // console.log("addBonus", req.token,req.body)
      // let decoded = jwt.verify(req.token, myEnv.parsed.SECRET);
      let { userId } = jwt.decode(req.token);
      let dbAdmin = await User.findOne({ _id: userId, token: req.token });
      if (!dbAdmin) return res.send({ success: false, logout: true, message: "Token Invalid. Please login in again." });
      if (dbAdmin.token != req.token) return res.send({ success: false, logout: true, message: "Token Invalid. Please login in again." });


      const bonus = new Bonus({
         userId: userId,
         bonusType: req.body.bonusType,
         bonusName: req.body.bonusName,
         bonusCode: req.body.bonusCode,
         bonusValue: req.body.bonusValue,
         minAmount: req.body.minAmount,
         openDate: req.body.openDate,
         endDate: req.body.endDate,
         status: req.body.status
      });
      bonus.save()
         .then(doc => {
            res.send({ doc, success: true, message: "bonus added" });
         })
         .catch(error => {
            console.log(error)
            res.send({ error, success: false, message: "DB error in bonus" });
         })
   }
   catch (error) {
      console.log(error)
      res.send({ error, success: false, message: "Unknown error" });
   }
}

module.exports.updateBonus = async (req, res) => {
   try {
      console.log("updateBonus", req.token)
      // let decoded = jwt.verify(req.token, myEnv.parsed.SECRET);
      let { userId } = jwt.decode(req.token);
      let dbAdmin = await User.findOne({ _id: userId, token: req.token });
      if (!dbAdmin) return res.send({ success: false, logout: true, message: "Token Invalid. Please login in again." });
      if (dbAdmin.token != req.token) return res.send({ success: false, logout: true, message: "Token Invalid. Please login in again." });


      Bonus.updateOne({ _id: req.body.bonusId }, {
         userId: userId,
         bonusType: req.body.bonusType,
         bonusName: req.body.bonusName,
         bonusCode: req.body.bonusCode,
         bonusValue: req.body.bonusValue,
         minAmount: req.body.minAmount,
         openDate: req.body.openDate,
         endDate: req.body.endDate,
         status: req.body.status
      })
         .then(user => {
            return res.send({ data: user, success: true, message: "Bonus has been updated successfully" });
         })
         .catch(error => {
            return res.send({ error: error, success: false, message: "Bonus has been updeted successfully" });
         })
   }
   catch (error) {
      res.send({ error, success: false, message: "Unknown error" });
   }
}

module.exports.updateBonusStatus = async (req, res) => {
   try {
      console.log("updateCredit", req.token)
      // let decoded = jwt.verify(req.token, myEnv.parsed.SECRET);
      let { userId } = jwt.decode(req.token);
      let dbAdmin = await User.findOne({ _id: userId, token: req.token });
      if (!dbAdmin) return res.send({ success: false, logout: true, message: "Token Invalid. Please login in again." });
      if (dbAdmin.token != req.token) return res.send({ success: false, logout: true, message: "Token Invalid. Please login in again." });


      Bonus.updateOne({ _id: req.body.bonusId }, { status: req.body.status })
         .then(user => {
            return res.send({ data: user, success: true, message: "Bonus has been updated successfully" });
         })
         .catch(error => {
            return res.send({ error: error, success: false, message: "Bonus has been updeted successfully" });
         })
   }
   catch (error) {
      res.send({ error, success: false, message: "Unknown error" });
   }
}

// Delete Bonus
module.exports.deleteBonus = async (req, res) => {
   try {
      let { userId } = jwt.decode(req.token);
      let dbAdmin = await User.findOne({ _id: userId, token: req.token });
      if (!dbAdmin._id) return res.send({ error, success: false, logout: true, message: "Please login in again." });
      if (dbAdmin.token != req.token) return res.send({ success: false, logout: true, message: "Token Invalid. Please login in again." });

      await Bonus.deleteOne({ _id: req.body.bonusId })
         .then(result => {
            res.send({ data: result, success: true, message: "Bonus deleted successfully" });
         })
         .catch(error => {
            res.send({ error, success: false, message: "Error in deleting Bonus" });
         })

   }
   catch (error) {
      res.send({ error, success: false, message: "Unknown error" });
   }
}


///////----- End Bonus ---- //////

/////----Banner-----/////

module.exports.getAllBanner = async (req, res) => {
   try {
      // console.log("getAllBanner", req.token)
      // let decoded = jwt.verify(req.token, myEnv.parsed.SECRET);
      let { userId } = jwt.decode(req.token);
      let dbAdmin = await User.findOne({ _id: userId, token: req.token });
      if (!dbAdmin) return res.send({ success: false, logout: true, message: "Token Invalid. Please login in again." });
      if (dbAdmin.token != req.token) return res.send({ success: false, logout: true, message: "Token Invalid. Please login in again." });


      Banner.find({})
         .then(doc => {
            res.send({ doc, success: true, message: "banner get successfully" });
         })
         .catch(error => {
            res.send({ error, success: false, message: "DB error in getting banner" });
         })
   }
   catch (error) {
      res.send({ error, success: false, message: "Unknown error" });
   }
}

module.exports.getBannerById = async (req, res) => {
   try {
      // console.log("getBannerById", req.token)
      // let decoded = jwt.verify(req.token, myEnv.parsed.SECRET);
      let { userId } = jwt.decode(req.token);
      let dbAdmin = await User.findOne({ _id: userId, token: req.token });
      if (!dbAdmin) return res.send({ success: false, logout: true, message: "Token Invalid. Please login in again." });
      if (dbAdmin.token != req.token) return res.send({ success: false, logout: true, message: "Token Invalid. Please login in again." });


      Banner.find({ _id: req.body.bannerId })
         .then(doc => {
            res.send({ doc, success: true, message: "banner get successfully" });
         })
         .catch(error => {
            res.send({ error, success: false, message: "DB error in getting banner" });
         })
   }
   catch (error) {
      res.send({ error, success: false, message: "Unknown error" });
   }
}

module.exports.addBanner = async (req, res) => {
   try {
      // console.log("addBanner", req.token,req.body,req.file)
      // let decoded = jwt.verify(req.token, myEnv.parsed.SECRET);
      let { userId } = jwt.decode(req.token);
      let dbAdmin = await User.findOne({ _id: userId, token: req.token });
      if (!dbAdmin) return res.send({ success: false, logout: true, message: "Token Invalid. Please login in again." });
      if (dbAdmin.token != req.token) return res.send({ success: false, logout: true, message: "Token Invalid. Please login in again." });


      const banner = new Banner({
         userId: userId,
         bannerName: req.body.bannerName,
         bannerImage: req.file.filename,
         status: req.body.status
      });
      banner.save()
         .then(doc => {
            res.send({ doc, success: true, message: "banner added" });
         })
         .catch(error => {
            console.log(error)
            res.send({ error, success: false, message: "DB error in banner" });
         })
   }
   catch (error) {
      console.log(error)
      res.send({ error, success: false, message: "Unknown error" });
   }
}

module.exports.updateBanner = async (req, res) => {
   try {
      // console.log("updateBanner", req.token,req.body)
      // let decoded = jwt.verify(req.token, myEnv.parsed.SECRET);
      let { userId } = jwt.decode(req.token);
      let dbAdmin = await User.findOne({ _id: userId, token: req.token });
      if (!dbAdmin) return res.send({ success: false, logout: true, message: "Token Invalid. Please login in again." });
      if (dbAdmin.token != req.token) return res.send({ success: false, logout: true, message: "Token Invalid. Please login in again." });
      var imageName = "";
      if (req.body.bannerImage != "") {
         imageName = req.body.bannerImage;
      } else {
         imageName = req.file.filename;
      }

      Banner.updateOne({ _id: req.body.bannerId }, {
         userId: req.body.userId,
         bannerName: req.body.bannerName,
         bannerImage: imageName,
         status: req.body.status
      })
         .then(user => {
            return res.send({ data: user, success: true, message: "Banner has been updated successfully" });
         })
         .catch(error => {
            return res.send({ error: error, success: false, message: "Banner has been updeted successfully" });
         })
   }
   catch (error) {
      res.send({ error, success: false, message: "Unknown error" });
   }
}

module.exports.updateBannerStatus = async (req, res) => {
   try {
      // console.log("updateCredit", req.token)
      // let decoded = jwt.verify(req.token, myEnv.parsed.SECRET);
      let { userId } = jwt.decode(req.token);
      let dbAdmin = await User.findOne({ _id: userId, token: req.token });
      if (!dbAdmin) return res.send({ success: false, logout: true, message: "Token Invalid. Please login in again." });
      if (dbAdmin.token != req.token) return res.send({ success: false, logout: true, message: "Token Invalid. Please login in again." });


      Banner.updateOne({ _id: req.body.bannerId }, { status: req.body.status })
         .then(user => {
            return res.send({ data: user, success: true, message: "Banner has been updated successfully" });
         })
         .catch(error => {
            return res.send({ error: error, success: false, message: "Banner has been updeted successfully" });
         })
   }
   catch (error) {
      res.send({ error, success: false, message: "Unknown error" });
   }
}

// Delete Banner
module.exports.deleteBanner = async (req, res) => {
   try {
      let { userId } = jwt.decode(req.token);
      let dbAdmin = await User.findOne({ _id: userId, token: req.token });
      if (!dbAdmin) return res.send({ error, success: false, logout: true, message: "Please login in again." });
      if (dbAdmin.token != req.token) return res.send({ success: false, logout: true, message: "Token Invalid. Please login in again." });

      await Banner.deleteOne({ _id: req.body.bannerId })
         .then(result => {
            res.send({ data: result, success: true, message: "Banner deleted successfully" });
         })
         .catch(error => {
            res.send({ error, success: false, message: "Error in deleting Banner" });
         })

   }
   catch (error) {
      res.send({ error, success: false, message: "Unknown error" });
   }
}

///////----- End Banner ---- //////

//// --- old fn ---////
module.exports.getUser = function (io, socket, request) {
   if (!request) return;
   if (!request.user) return;
   //("getUser: request=" + JSON.stringify(request));

   if (request.user.details.role == 'user') {
      User.findOne({
         _id: request.user.details._id
      }, function (err, dbUser) {
         if (err) logger.error(err);
         socket.emit('get-user-success', dbUser);
      });
   }


   if (request.user.details.role == 'partner') {
      if (!request.filter) request['filter'] = {
         _id: request.user.details._id,
         role: 'partner',
         deleted: false
      };
      if (!request.filter) return;
      User.findOne(request.filter, function (err, user) {
         if (err) logger.error(err);
         socket.emit('get-user-success', user);
      });
   }

   if (request.user.details.role == 'subadmin') {
      if (!request.filter) request['filter'] = {
         _id: request.user.details._id,
         role: 'subadmin',
         deleted: false
      };
      if (!request.filter) return;
      User.findOne(request.filter, function (err, user) {
         if (err) logger.error(err);
         socket.emit('get-user-success', user);
      });
   }

   if (request.user.details.role == 'master') {
      if (!request.filter) request['filter'] = {
         _id: request.user.details._id,
         role: 'master',
         deleted: false
      };
      if (!request.filter) return;
      User.findOne(request.filter, function (err, user) {
         if (err) logger.error(err);
         socket.emit('get-user-success', user);
      });
   }


   if (request.user.details.role == 'manager') {
      if (!request.filter) request['filter'] = {
         _id: request.user.details._id,
         role: 'manager',
         deleted: false
      };
      if (!request.filter) return;
      User.findOne(request.filter, function (err, user) {
         if (err) logger.error(err);
         socket.emit('get-user-success', user);
      });
   }
   if (request.user.details.role == 'admin') {
      if (!request.filter) request['filter'] = {
         _id: request.user.details._id,
         role: 'admin',
         deleted: false
      };
      if (!request.filter) return;
      User.findOne(request.filter, function (err, user) {
         if (err) logger.error(err);
         // console.log(user)
         socket.emit('get-user-success', user);
      });
   }
}
//// --- old fn ---////

module.exports.oldupdateMaintenancePage = async function (req, res) {
   // - validate request data
   // console.log(req.body);

   if (!req.body) return;
   if (!dbAdmin || !dbAdmin._id || !dbAdmin.key) return;
   if (!dbAdmin.username || !dbAdmin.role) return;
   // console.log(request);

   if (dbAdmin.role != 'siteadmin' && dbAdmin.role != 'techadmin' && dbAdmin.role != 'superadmin' && dbAdmin.role != 'admin' && dbAdmin.role != 'manager' && dbAdmin.role != 'master' && dbAdmin.role != 'subadmin') return;
   // authenticate manager
   User.findOne({
      _id: dbAdmin._id,
      role: dbAdmin.role,
      status: 'active',
      deleted: false,
      hash: dbAdmin.key
   }, function (err, dbAdmin) {
      // console.log(dbAdmin);
      if (err) logger.error(err);
      if (!dbAdmin) return;

      if (!dbAdmin.validTransPassword(dbAdmin.transpassword)) {
         dbAdmin.loginAttempts += 1;
         logger.error('update-password-success: Invalid Transaction password ' + dbAdmin.username);
         // console.log("Invalid Transaction password");
         return res.json({ response: [], success: false, "message": "Invalid Transaction password" });
      }

      const update = {
         maintenancepage: req.body.status,
      };

      Setting.updateMany({ _id: "63e4a8f44b6c6f38713c4d6e" },
         update, { new: true }, async function (err, docs) {
            if (err) {
               console.log("DB error: Application error ", err);
               return res.json({ response: [], success: false, "message": "DB error: Application error " });
            }
            else {
               console.log("Status Changed");
               res.send({ data: docs, success: true, message: "Status Changed sucessfully" });
            }
         })
   });


}

module.exports.oldgetBalanceReport = async function (req, res) {
   try {

      // console.log("asfsdfasgsdg",req.body);
      if (!req.body) return;
      if (!dbAdmin || !dbAdmin._id) return;
      if (!req.body.username || !req.body.role) return;
      if (dbAdmin.role != 'siteadmin' && dbAdmin.role != 'techadmin' && dbAdmin.role != 'superadmin' && dbAdmin.role != 'admin' && dbAdmin.role != 'manager' && dbAdmin.role != 'master' && dbAdmin.role != 'subadmin') return;


      await User.findOne({ username: req.body.username, role: req.body.role, deleted: false },
         { _id: 1, username: 1, creditrefrence: 1, availableAmount: 1, partnershipsetting: 1, balance: 1 }, function (err, dbAdmin) {
            if (err) logger.error(err);
            // console.log(dbAdmin);

            // console.log("ADMIN",dbAdmin.username);  
            var role = "user";
            var filter = {
               manager: req.body.username,
            };

            if (req.body.role == "master") {
               role = "manager";
               filter = {
                  master: req.body.username,
               };
            }

            if (req.body.role == "subadmin") {
               role = "master";
               filter = {
                  subadmin: req.body.username,
               };
            }

            if (req.body.role == "admin") {
               role = "subadmin";
               filter = {
                  admin: req.body.username,
               };
            }


            // console.log(filter,role)
            User.find(filter, { _id: 1, username: 1, role: 1, creditrefrence: 1, partnershipsetting: 1, ParentUser: 1, limit: 1, exposure: 1, availableAmount: 1, balance: 1 }, async function (err, AllUsers) {

               var UsersBalance = 0;
               var UsersCreditRefrence = 0;
               var UsersAvailBalance = 0;
               var UsersExposure = 0;
               if (AllUsers) {

                  for (var i = 0; i < AllUsers.length; i++) {

                     var total_exposure = 0;
                     if (AllUsers[i].role == role) {
                        // console.log("calculate exposure", role, AllUsers[i].role, AllUsers[i].username);
                        if (role == "user") {
                           total_exposure += AllUsers[i].exposure;
                        } else {
                           await getuserexposure(AllUsers[i].role, AllUsers[i].username, function (exposure) {
                              // console.log(exposure);
                              total_exposure = exposure;
                           })
                        }
                     }

                     // var exposure = (AllUsers[i].exposure * partnerpercentage) / 100;
                     console.log("SUBUSERS", i, AllUsers[i].username, AllUsers[i].availableAmount, AllUsers[i].limit, AllUsers[i].creditrefrence, total_exposure);
                     if (AllUsers[i].role == "user") {
                        UsersBalance += parseFloat(AllUsers[i].limit);
                     } else {
                        UsersBalance += parseFloat(AllUsers[i].availableAmount);
                     }
                     UsersExposure += parseFloat(total_exposure);
                     if (req.body.username == AllUsers[i].ParentUser) {
                        UsersCreditRefrence += parseFloat(AllUsers[i].creditrefrence);
                        UsersAvailBalance += parseFloat(AllUsers[i].balance);
                     }


                  }


                  var ownpercentage = 100;
                  console.log("BB888", UsersCreditRefrence, UsersBalance);
                  var totalpl = UsersBalance - UsersCreditRefrence;
                  if (dbAdmin.role != "user") {
                     for (var k = 0; k < dbAdmin.partnershipsetting.length; k++) {
                        if (dbAdmin.partnershipsetting[k].sport_id == 4) {
                           var ownpercentage = dbAdmin.partnershipsetting[k].partnership;
                        }
                     }
                     var clientPl = -1 * (totalpl * ownpercentage) / 100;
                     // UsersBalance = (UsersBalance + totalpl - clientPl);
                     UsersBalance = (UsersBalance + (-1 * totalpl) - (-1 * clientPl));

                  } else {
                     var clientPl = totalpl;
                  }

                  console.log("BB999", UsersBalance, totalpl, clientPl);


                  // totalbalance += 1000;
                  // getUser[i].clientPl = clientPl;
                  // getUser[i].totalbalance = (UsersBalance + totalpl + clientPl);

                  var userData = {
                     UpperlevelCreditRef: dbAdmin.creditrefrence,
                     TotalMasterBal: dbAdmin.balance + UsersBalance,
                     AvailableBalance: dbAdmin.availableAmount,
                     DownLevelOccupyBal: UsersBalance,
                     UpperLevel: dbAdmin.creditrefrence - (dbAdmin.balance + UsersBalance),
                     AvailableBalWPL: dbAdmin.balance,
                     DownLevelCreditRef: UsersCreditRefrence,
                     DownLevelPL: UsersBalance - UsersCreditRefrence,
                     MyPL: dbAdmin.balance - dbAdmin.availableAmount,
                     UsersExposure: UsersExposure,
                     UsersAvailBalance: UsersAvailBalance,
                  }
                  //   console.log("Total",userData,UsersBalance,UsersCreditRefrence);
                  res.json({ response: userData, success: true, "message": "server response success" });
               }

            });


         });
   } catch (err) {
      console.log(err)
      res.json({ response: err, success: false, "message": "server response error" });
   }

}

// module.exports.getuserexposure = async function (req, res) {

///////////----------------- old functons -----------------/////////

module.exports.stopBet = function (io, socket, request) {
   if (!request) return;
   if (!request.user) return;


   User.findOne({
      _id: request.user.details._id,
   }, function (err, dbAdmin) {
      socket.emit("stop-bet-active-success", { status: dbAdmin.betStop });
   });

}

module.exports.stopBetSttaus = function (io, socket, request) {
   if (!request) return;
   if (!request.user) return;
   console.log(request.betStop + 'request.betStop')
   User.updateMany({
      role: { $in: ['admin', 'operator'] },

   }, {
      $set: {
         betStop: request.betStop,
      }
   }, function (errk, raw) {
   });

   Login.updateMany({
      role: 'user',

   }, {
      $set: {
         betStop: request.betStop,
      }
   }, function (errk, raw) {
      socket.emit("stop-bet-success", { message: 'success' });
   });

}

var userInfo = {};
module.exports.getmasterdownlineList = function (io, socket, request) {
   if (!request) return;
   if (!request.user) return;
   if (!request.user.details) return;
   ////("getmasterdownlineList: request=" + JSON.stringify(request));
   try {
      //console.log(request.manager.role)
      if (request.user.details.role == 'master') {


         if (request.manager.role == 'manager') {
            User.findOne({
               hash: request.user.key,
               _id: request.user.details._id,
               role: 'master',
               deleted: false,
               status: 'active'
            }, function (err, dbAdmin) {
               if (err) logger.error(err);
               if (!dbAdmin) {
                  logger.error("Invalid Access1: " + JSON.stringify(request));
                  return;
               }

               //request.filter.push({'username':{$ne:'Sachin1'}});
               User.find({
                  'role': 'user',
                  manager: request.manager.username
               }).exec(function (err, result) {
                  // console.log(result)
                  if (err) logger.error(err);
                  if (result.length > 0) {
                     var arr = [];
                     socket.emit("get-masterdownline-list-success", result);


                  }


               });
            });
         }

      }
   } catch (e) {
      console.log(e)
   }
}

module.exports.getsubadmindownlineList = function (io, socket, request) {
   if (!request) return;
   if (!request.user) return;
   if (!request.user.details) return;
   // logger.info("getsubadmindownlineList: request=" + JSON.stringify(request));
   try {

      if (request.user.details.role == 'subadmin') {
         if (request.manager.role == 'manager') {
            User.findOne({
               hash: request.user.key,
               _id: request.user.details._id,
               role: 'subadmin',
               deleted: false,
               status: 'active'
            }, function (err, dbAdmin) {
               if (err) logger.error(err);
               if (!dbAdmin) {
                  logger.error("Invalid Access1: " + JSON.stringify(request));
                  return;
               }

               //request.filter.push({'username':{$ne:'Sachin1'}});
               User.find({
                  'role': 'user',
                  manager: request.manager.username
               }).exec(function (err, result) {
                  // console.log(result)
                  if (err) logger.error(err);
                  if (result.length > 0) {
                     var arr = [];
                     socket.emit("get-subadmindownline-list-success", result);


                  }


               });
            });
         }

         if (request.manager.role == 'master') {
            User.findOne({
               hash: request.user.key,
               _id: request.user.details._id,
               role: 'subadmin',
               deleted: false,
               status: 'active'
            }, function (err, dbAdmin) {
               if (err) logger.error(err);
               if (!dbAdmin) {
                  logger.error("Invalid Access1: " + JSON.stringify(request));
                  return;
               }

               //request.filter.push({'username':{$ne:'Sachin1'}});
               User.find({
                  'role': 'manager',
                  master: request.manager.username
               }).exec(function (err, result) {
                  // console.log(result)
                  if (err) logger.error(err);
                  if (result.length > 0) {
                     var arr = [];
                     result.forEach((val, index) => {
                        User.find({
                           'manager': val.username,
                           role: 'user',
                           deleted: false
                        }).exec(function (err, resultU) {
                           result[index].totalexposure = 0;
                           result[index].totalbalance = 0;
                           if (resultU.length > 0) {
                              resultU.forEach((value) => {
                                 result[index].totalexposure += -1 * value.exposure;
                                 if (value.mainbalance) {

                                    result[index].totalbalance += value.limit + value.mainbalance;
                                 } else {
                                    result[index].totalbalance += value.limit;

                                 }
                              })
                           }
                           socket.emit("get-subadmindownline-list-success", result);

                        });
                     })

                  }


               });
            });
         }

      }


      if (request.user.details.role == 'master') {
         if (request.manager.role == 'manager') {
            User.findOne({
               hash: request.user.key,
               _id: request.user.details._id,
               role: 'master',
               deleted: false,
               status: 'active'
            }, function (err, dbAdmin) {
               if (err) logger.error(err);
               if (!dbAdmin) {
                  logger.error("Invalid Access1: " + JSON.stringify(request));
                  return;
               }

               //request.filter.push({'username':{$ne:'Sachin1'}});
               User.find({
                  'role': 'user',
                  manager: request.manager.username
               }).exec(function (err, result) {
                  // console.log(result)
                  if (err) logger.error(err);
                  if (result.length > 0) {
                     var arr = [];
                     socket.emit("get-subadmindownline-list-success", result);


                  }


               });
            });
         }

         if (request.manager.role == 'master') {
            User.findOne({
               hash: request.user.key,
               _id: request.user.details._id,
               role: 'subadmin',
               deleted: false,
               status: 'active'
            }, function (err, dbAdmin) {
               if (err) logger.error(err);
               if (!dbAdmin) {
                  logger.error("Invalid Access1: " + JSON.stringify(request));
                  return;
               }

               //request.filter.push({'username':{$ne:'Sachin1'}});
               User.find({
                  'role': 'manager',
                  master: request.manager.username
               }).exec(function (err, result) {
                  //  console.log(result)
                  if (err) logger.error(err);
                  if (result.length > 0) {
                     var arr = [];
                     result.forEach((val, index) => {
                        User.find({
                           'manager': val.username,
                           deleted: false
                        }).exec(function (err, resultU) {
                           result[index].totalexposure = 0;
                           result[index].totalbalance = 0;
                           if (resultU.length > 0) {
                              resultU.forEach((value) => {
                                 result[index].totalexposure += -1 * value.exposure;
                                 if (value.mainbalance) {

                                    result[index].totalbalance += value.limit + value.mainbalance;
                                 } else {
                                    result[index].totalbalance += value.limit;

                                 }
                              })
                           }
                           socket.emit("get-subadmindownline-list-success", result);

                        });
                     })

                  }


               });
            });
         }

      }
   } catch (e) {
      console.log(e)
   }
}

module.exports.getadmindownlineList = function (io, socket, request) {
   if (!request) return;
   if (!request.user) return;
   if (!request.user.details) return;
   //logger.info("getadmindownlineList: request=" + JSON.stringify(request));
   try {
      // console.log(request.manager.role)
      if (request.user.details.role == 'admin') {
         if (request.manager.role == 'manager') {
            User.findOne({
               hash: request.user.key,
               _id: request.user.details._id,
               role: 'admin',
               deleted: false,
               status: 'active'
            }, function (err, dbAdmin) {
               if (err) logger.error(err);
               if (!dbAdmin) {
                  logger.error("Invalid Access1: " + JSON.stringify(request));
                  return;
               }

               //request.filter.push({'username':{$ne:'Sachin1'}});
               User.find({
                  'role': 'user',
                  manager: request.manager.username
               }).sort({ username: -1 }).exec(function (err, result) {
                  // console.log(result)
                  if (err) logger.error(err);
                  if (result.length > 0) {
                     var arr = [];
                     socket.emit("get-admindownline-list-success", result);


                  }


               });
            });
         }

         if (request.manager.role == 'master') {
            User.findOne({
               hash: request.user.key,
               _id: request.user.details._id,
               role: 'admin',
               deleted: false,
               status: 'active'
            }, function (err, dbAdmin) {
               if (err) logger.error(err);
               if (!dbAdmin) {
                  logger.error("Invalid Access1: " + JSON.stringify(request));
                  return;
               }

               //request.filter.push({'username':{$ne:'Sachin1'}});
               User.find({
                  'role': 'manager',

                  master: request.manager.username
               }).exec(function (err, result) {
                  // console.log(result)
                  if (err) logger.error(err);
                  if (result.length > 0) {
                     var arr = [];
                     result.forEach((val, index) => {
                        User.find({
                           'manager': val.username,
                           deleted: false,
                           role: 'user'
                        }).sort({ username: -1 }).exec(function (err, resultU) {
                           result[index].totalexposure = 0;
                           result[index].totalbalance = 0;
                           if (resultU.length > 0) {
                              resultU.forEach((value) => {
                                 result[index].totalexposure += -1 * value.exposure;
                                 if (value.mainbalance) {

                                    result[index].totalbalance += value.limit + value.mainbalance;
                                 } else {
                                    result[index].totalbalance += value.limit;

                                 }
                              })
                           }
                           socket.emit("get-admindownline-list-success", result);

                        });
                     })

                  }


               });
            });
         }


         if (request.manager.role == 'subadmin') {
            User.findOne({
               hash: request.user.key,
               _id: request.user.details._id,
               role: 'admin',
               deleted: false,
               status: 'active'
            }, function (err, dbAdmin) {
               if (err) logger.error(err);
               if (!dbAdmin) {
                  logger.error("Invalid Access1: " + JSON.stringify(request));
                  return;
               }

               //request.filter.push({'username':{$ne:'Sachin1'}});
               User.find({
                  'role': 'master',
                  subadmin: request.manager.username
               }).exec(function (err, result) {
                  if (err) logger.error(err);
                  if (result.length > 0) {
                     var arr = [];
                     result.forEach((val, index) => {
                        User.find({
                           'master': val.username,
                           role: { $ne: 'partner' },
                           deleted: false
                        }).sort({ username: -1 }).exec(function (err, resultU) {
                           result[index].totalexposure = 0;
                           result[index].totalbalance = 0;
                           if (resultU.length > 0) {
                              resultU.forEach((value) => {
                                 result[index].totalexposure += -1 * value.exposure;
                                 if (value.mainbalance) {

                                    result[index].totalbalance += value.limit + value.mainbalance;
                                 } else {
                                    result[index].totalbalance += value.limit;

                                 }
                              })
                           }
                           // console.log(result)
                           socket.emit("get-admindownline-list-success", result);

                        });
                     })

                  }


               });
            });
         }
      }


   } catch (e) {
      console.log(e)
   }
}

function getCasinoBalance(io, socket, request) {
   if (request.user.details.role == 'manager') {
      var filter = {
         role: 'user',
         'manager': request.user.details.username,
         deleted: false,
         'status': 'active'
      }
   } else if (request.user.details.role == 'master') {
      var filter = {
         role: 'user',
         'master': request.user.details.username,
         deleted: false,
         'status': 'active'
      }
   } else if (request.user.details.role == 'subadmin') {
      var filter = {
         role: 'user',
         'subadmin': request.user.details.username,
         deleted: false,
         'status': 'active'
      }
   } else {
      var filter = {
         role: 'user',
         deleted: false,
         'status': 'active'
      }
   }
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

module.exports.userReport = function (io, socket, request) {
   if (!request) return;
   if (!request.user) return;
   if (!request.user.details) return;
   //logger.info("userReport: " + JSON.stringify(request));
   User.findOne({
      _id: request.user.details._id,
      hash: request.user.key
   }, {
      role: 1,
      username: 1
   }, function (err, dbUser) {
      if (err) logger.error(err);
      console.log('step1')
      if (!dbUser) return;
      if (request.user.details.role == 'admin') {

         var output = {};
         Bet.distinct('subadmin', {
            'marketId': request.marketId,

         },
            function (err, valCount) {
               output.users = valCount;
               output.profitLoss = {};
               var counter = 0;
               if (!valCount) return;
               var len = valCount.length;
               for (var j = 0; j < valCount.length; j++) {
                  (function (user, index, callback) {
                     var profit = 0;
                     Log.find({
                        username: user,
                        marketId: request.marketId,

                     }, function (err, dbBet) {
                        if (!dbBet) return;

                        var lengthval = dbBet.length;

                        for (var i = 0; i < dbBet.length; i++) {
                           // console.log(dbBet[i])
                           if (dbBet[i].subAction == 'AMOUNT_WON') {
                              profit += dbBet[i].amount;
                           } else {
                              profit -= dbBet[i].amount;
                           }
                           if (lengthval - 1 == i) {
                              callback(user, profit, index);
                           }

                        }

                     });

                  })(valCount[j], j, function (user, profit, index) {
                     //  console.log(valCount[index])
                     counter++;
                     //.log(event)
                     if (counter == len) {
                        output.profitLoss[valCount[index]] = profit;
                        socket.emit('user-report-success', output);


                     } else {
                        output.profitLoss[valCount[index]] = profit;
                     }
                  })

               }

            })

      }

      if (request.user.details.role == 'subadmin') {

         var output = {};
         Bet.distinct('master', {
            'marketId': request.marketId,

         },
            function (err, valCount) {
               output.users = valCount;
               output.profitLoss = {};
               var counter = 0;
               if (!valCount) return;
               var len = valCount.length;
               for (var j = 0; j < valCount.length; j++) {
                  (function (user, index, callback) {
                     var profit = 0;
                     Log.find({
                        username: user,
                        marketId: request.marketId,

                     }, function (err, dbBet) {
                        if (!dbBet) return;

                        var lengthval = dbBet.length;

                        for (var i = 0; i < dbBet.length; i++) {

                           if (dbBet[i].subAction == 'AMOUNT_WON') {
                              profit += dbBet[i].amount;
                           } else {
                              profit -= dbBet[i].amount;
                           }
                           if (lengthval - 1 == i) {
                              callback(user, profit, index);
                           }

                        }

                     });

                  })(valCount[j], j, function (user, profit, index) {
                     counter++;
                     //.log(event)
                     if (counter == len) {
                        output.profitLoss[valCount[index]] = profit;
                        socket.emit('user-report-success', output);


                     } else {
                        output.profitLoss[valCount[index]] = profit;
                     }
                  })

               }

            })

      }

      if (request.user.details.role == 'master') {

         var output = {};
         Bet.distinct('manager', {
            'marketId': request.marketId,
            master: request.user.details.username
         },
            function (err, valCount) {
               output.users = valCount;
               output.profitLoss = {};
               var counter = 0;
               if (!valCount) return;
               var len = valCount.length;
               for (var j = 0; j < valCount.length; j++) {
                  (function (user, index, callback) {
                     var profit = 0;
                     Log.find({
                        manager: user,
                        marketId: request.marketId,

                     }, function (err, dbBet) {
                        if (!dbBet) return;

                        var lengthval = dbBet.length;

                        for (var i = 0; i < dbBet.length; i++) {
                           // console.log(dbBet[i])
                           if (dbBet[i].subAction == 'AMOUNT_WON') {
                              profit -= dbBet[i].amount;
                           } else {
                              profit += dbBet[i].amount;
                           }
                           if (lengthval - 1 == i) {
                              callback(user, profit, index);
                           }

                        }

                     });

                  })(valCount[j], j, function (user, profit, index) {
                     // console.log(valCount[index])
                     counter++;
                     //.log(event)
                     if (counter == len) {
                        output.profitLoss[valCount[index]] = profit;
                        socket.emit('user-report-success', output);


                     } else {
                        output.profitLoss[valCount[index]] = profit;
                     }
                  })

               }

            })

      }

      if (request.user.details.role == 'manager') {

         var output = {};
         Bet.distinct('username', {
            'marketId': request.marketId,
            manager: request.user.details.username
         },
            function (err, valCount) {
               output.users = valCount;
               output.profitLoss = {};
               var counter = 0;
               if (!valCount) return;
               var len = valCount.length;
               for (var j = 0; j < valCount.length; j++) {
                  (function (user, index, callback) {
                     var profit = 0;
                     Log.find({
                        username: user,
                        marketId: request.marketId,
                        action: { $ne: 'COMMISION' }
                     }, function (err, dbBet) {
                        if (!dbBet) return;

                        var lengthval = dbBet.length;
                        // console.log(dbBet)
                        for (var i = 0; i < dbBet.length; i++) {

                           if (dbBet[i].subAction == 'AMOUNT_WON') {

                              profit = dbBet[i].amount;
                           } else {
                              profit = dbBet[i].amount;
                           }
                           if (lengthval - 1 == i) {
                              callback(user, profit, index);
                           }

                        }

                     });

                  })(valCount[j], j, function (user, profit, index) {
                     //console.log(valCount[index])
                     counter++;
                     //.log(event)
                     if (counter == len) {
                        output.profitLoss[valCount[index]] = profit;
                        socket.emit('user-report-success', output);


                     } else {
                        output.profitLoss[valCount[index]] = profit;
                     }
                  })

               }

            })

      }
   });
}

module.exports.getUserBalance = function (io, socket, request) {
   if (!request) return;
   if (!request.user) return;
   if (!request.user.details) return;
   //logger.info("getUserBalance: " + JSON.stringify(request));
   User.findOne({
      _id: request.user.details._id,
      hash: request.user.key
   }, {
      role: 1,
      username: 1
   }, function (err, dbUser) {
      if (err) logger.error(err);
      if (!dbUser) return;
      if (dbUser.role == 'manager') {
         User.find({
            manager: request.user.details.username,
            deleted: false,
            'status': 'active',
            role: 'user'
         }, {
            balance: 1,
            limit: 1,
            exposure: 1,
            creditLimit: 1,
            mainbalance: 1
         }, function (err, dbUserCrdeit) {
            User.findOne({
               _id: request.user.details._id,
               deleted: false,
               'status': 'active',
               role: 'manager'
            }, {
               balance: 1,
               limit: 1,
               exposure: 1,
               creditLimit: 1,
            }, function (err, dbManagerCrdeit) {

               //console.log('dbUserCrdeit'+dbUserCrdeit.length)
               if (!dbUserCrdeit) return;
               var balance = 0;
               var limit = 0;
               var exposure = 0;
               var casonio = 0;
               for (var i = 0; i < dbUserCrdeit.length > 0; i++) {
                  balance = balance + dbUserCrdeit[i].balance;
                  if (dbUserCrdeit[i].limit) {
                     limit = limit + dbUserCrdeit[i].limit;
                  }

                  exposure = exposure + dbUserCrdeit[i].exposure;
                  casonio = casonio + dbUserCrdeit[i].mainbalance;
               }
               var balanceArr = {
                  'balance': balance,
                  'limit': limit,
                  'exposure': exposure,
                  'casino': casonio,
                  'mbalance': dbManagerCrdeit.limit,
                  'mCredit': dbManagerCrdeit.creditLimit

               }

               socket.emit('get-users-balance', balanceArr);
            });
         });
      }


      if (dbUser.role == 'partner') {
         User.find({
            manager: request.user.details.manager,
            deleted: false,
            'status': 'active',
            role: 'user'
         }, {
            balance: 1,
            limit: 1,
            exposure: 1,
            creditLimit: 1,
            mainbalance: 1
         }, function (err, dbUserCrdeit) {
            User.findOne({
               username: request.user.details.manager,
               deleted: false,
               'status': 'active',
               role: 'manager'
            }, {
               balance: 1,
               limit: 1,
               exposure: 1,
               creditLimit: 1,
            }, function (err, dbManagerCrdeit) {

               // console.log('dbUserCrdeit'+dbUserCrdeit.length)
               if (!dbUserCrdeit) return;
               var balance = 0;
               var limit = 0;
               var exposure = 0;
               var casonio = 0;
               for (var i = 0; i < dbUserCrdeit.length > 0; i++) {
                  balance = balance + dbUserCrdeit[i].balance;
                  limit = limit + dbUserCrdeit[i].limit;
                  exposure = exposure + dbUserCrdeit[i].exposure;
                  casonio = casonio + dbUserCrdeit[i].mainbalance;
               }
               var balanceArr = {
                  'balance': balance,
                  'limit': limit,
                  'exposure': exposure,
                  'casino': casonio,
                  'mbalance': dbManagerCrdeit.limit,
                  'mCredit': dbManagerCrdeit.creditLimit

               }

               socket.emit('get-users-balance', balanceArr);
            });
         });
      }


      if (dbUser.role == 'admin') {
         User.find({
            manager: request.targetUser.username,
            deleted: false,
            'status': 'active',
            role: 'user'
         }, {
            balance: 1,
            limit: 1,
            exposure: 1,
            creditLimit: 1,
            mainbalance: 1
         }, function (err, dbUserCrdeit) {
            //console.log('dbUserCrdeit'+dbUserCrdeit.length)
            if (!dbUserCrdeit) return;
            var balance = 0;
            var limit = 0;
            var exposure = 0;
            var casonio = 0;
            for (var i = 0; i < dbUserCrdeit.length > 0; i++) {
               balance = balance + dbUserCrdeit[i].balance;
               limit = limit + dbUserCrdeit[i].limit;
               exposure = exposure + dbUserCrdeit[i].exposure;
               casonio = casonio + dbUserCrdeit[i].mainbalance;
            }
            var balanceArr = {
               'balance': balance,
               'limit': limit,
               'exposure': exposure,
               'casino': casonio,
            }

            socket.emit('get-users-balance', balanceArr);
         });
      }


   });

}

module.exports.updateShare = function (io, socket, request) {
   if (!request) return;
   if (!request.user) return;
   if (!request.user.details) return;
   //logger.info("updateShare: " + JSON.stringify(request));
   User.findOne({
      _id: request.user.details._id,
      hash: request.user.key
   }, {
      role: 1,
      username: 1
   }, function (err, dbUser) {

      if (err) logger.error(err);
      if (!dbUser) return;
      //if (dbUser.role == 'user') return;

      User.update({
         username: request.targetUser.username
      }, {
         $set: {
            'sharing': request.targetUser.sharing,
            'type': 'SHARING'
         }


      }, function (err, dbUserCrdeit) {

         socket.emit('update-sharing-success', {
            message: 'sharing  updated.'
         });
      });
   });

}

module.exports.oldupdateCredit = function (io, socket, request) {
   if (!request) return;
   if (!request.user) return;
   if (!request.user.details) return;
   //logger.info("updateCredit: " + JSON.stringify(request));
   User.findOne({
      _id: request.user.details._id,
      hash: request.user.key
   }, {
      role: 1,
      username: 1
   }, function (err, dbUser) {

      if (err) logger.error(err);
      if (!dbUser) return;
      if (dbUser.role == 'user') return;

      User.findOne({
         username: request.targetUser.username
      }, {
         creditLimit: 1,
         username: 1,

      }, function (err, dbUserCrdeit) {
         if (!dbUserCrdeit) return;

         if (dbUserCrdeit.creditLimit) {
            var creditLimit = parseInt(request.creditLimit);
         } else {
            var creditLimit = parseInt(request.creditLimit);
         }

         User.update({
            username: request.targetUser.username
         }, {
            $set: {
               creditLimit: creditLimit,
            }
         }, function (err, dbUpdatedUser) {

            socket.emit('update-credit-success', {
               message: 'Credit  updated.'
            });
         });
      });
   });

}

module.exports.updatewhatsapp = function (io, socket, request) {

   if (!request) return;
   if (!request.user) return;
   logger.debug("updatewhatsapp: " + JSON.stringify(request));

   User.findOne({
      _id: request.user.details._id,
      deleted: false,
      status: 'active',
      role: request.user.details.role
   }, function (err, dbUser) {
      if (err) {
         logger.error(err);
         return;
      }
      if (!dbUser) {
         logger.error("Invalid username for given role " + JSON.stringify(dbUser));
         return;
      }

      if (dbUser.role == 'manager') {

         User.updateMany({
            manager: request.user.details.username
         }, {
            $set: {
               whatsapp: request.whatsapp,


            }
         }, function (err, dbUpdatedUser) {
            if (err) {
               logger.debug(err);
            }
            socket.emit('update-link-success', {
               message: 'User record updated successfully.'
            });
         });

         User.update({
            _id: request.user.details._id
         }, {
            $set: {
               whatsapp: request.whatsapp,


            }
         }, function (err, dbUpdatedUser) {
            if (err) {
               logger.debug(err);
            }

         });


      }

   });
}

module.exports.updatetelegram = function (io, socket, request) {

   if (!request) return;
   if (!request.user) return;
   // logger.debug("updatetelegram: "+JSON.stringify(request));

   User.findOne({
      _id: request.user.details._id,
      deleted: false,
      status: 'active',
      role: request.user.details.role
   }, function (err, dbUser) {
      if (err) {
         logger.error(err);
         return;
      }
      if (!dbUser) {
         logger.error("Invalid username for given role " + JSON.stringify(dbUser));
         return;
      }

      if (dbUser.role == 'manager') {

         User.updateMany({
            manager: request.user.details.username
         }, {
            $set: {
               telegram: request.telegram,


            }
         }, function (err, dbUpdatedUser) {
            if (err) {
               logger.debug(err);
            }
            console.log("aaThe HRW said that on September 8 ")
            socket.emit('update-link-success', {
               message: 'User record updated successfully.'
            });
         });

         User.update({
            _id: request.user.details._id
         }, {
            $set: {
               telegram: request.telegram,


            }
         }, function (err, dbUpdatedUser) {
            if (err) {
               logger.debug(err);
            }

         });


      }

   });
}

module.exports.updateUsersBalance = function (io, socket, request) {
   console.log(request);
   if (!request) return;
   if (!request.user) return;
   if (!request.user.details) return;
   //logger.info("updateUsersBalance: " + JSON.stringify(request));
   User.findOne({
      _id: request.user.details._id,
      hash: request.user.key
   }, {
      role: 1,
      username: 1
   }, function (err, dbUser) {

      var today = new Date();
      if (today.getDate() <= 9) {
         var acdate = '0' + today.getDate();
      }
      else {
         var acdate = today.getDate();
      }

      if ((today.getMonth() + 1) <= 9) {
         var acmonth = '0' + (today.getMonth() + 1);
      }
      else {
         var acmonth = (today.getMonth() + 1);
      }

      var date = today.getFullYear() + '-' + acmonth + '-' + acdate;
      if (err) logger.error(err);
      if (!dbUser) return;
      if (dbUser.role != 'admin') return;

      User.findOne({
         username: request.username,
         role: 'user',
         deleted: false
      }, function (err, dbOldTragetUser) {
         var balance;
         var limit;
         // console.log(dbOldTragetUser)
         if (request.subAction == 'BALANCE_DEPOSIT') {
            balance = parseInt(dbOldTragetUser.balance) + parseInt(request.amount);
            limit = parseInt(dbOldTragetUser.limit) + parseInt(request.amount);
         } else if (request.subAction == 'BALANCE_WITHDRAWL') {
            balance = parseInt(dbOldTragetUser.balance) - parseInt(request.amount);
            limit = parseInt(dbOldTragetUser.limit) - parseInt(request.amount);
         } else {
            return;
         }

         User.update({
            username: request.username,
            role: 'user',
            deleted: false
         }, {
            $set: {
               limit: limit,
               balance: balance
            }
         }, function (err, raw) {

            var log = new Log();
            log.createdAt = date;
            log.username = dbOldTragetUser.username;
            log.action = 'BALANCE';
            log.subAction = request.subAction;
            log.oldLimit = dbOldTragetUser.limit;
            log.newLimit = limit;
            log.remark = request.remark;
            log.description = 'Balance updated. Old Limit: ' + dbOldTragetUser.limit + '. New Limit: ' + limit;
            log.manager = dbOldTragetUser.username;
            log.relation = dbOldTragetUser.username;
            log.time = new Date();
            log.datetime = Math.round(+new Date() / 1000);
            log.deleted = false;
            //console.log(log);
            log.save(function (err) {
               if (err) {
                  logger.error('update-user-balance-error: Log entry failed.');
               }
            });
            //log end
            socket.emit('update-success', {
               "message": "balance updated."
            });
         });

      });

   });


}

module.exports.getUserInfo = function (io, socket, request) {

   if (!request) return;
   if (!request.user) return;
   // console.log(request);
   //logger.info("getUserInfo: request=" + JSON.stringify(request));

   if (request.user.details.role == 'admin') {


      Information.find(request.filter, function (err, info) {


         socket.emit('get-user-info-success', info);
      });

   }
}

module.exports.oldupdateWithdraw = function (io, socket, request) {

   if (!request) return;
   if (!request.user) return;
   //console.log(request);
   // logger.info("updateWithdraw: request=" + JSON.stringify(request));

   if (request.user.details.role == 'manager' || request.user.details.role == 'partner') {


      Finance.update({
         _id: request.l._id
      }, {
         $set: {
            status: request.status,
         }
      }, function (err, dbUpdatedUser) {


         socket.emit('update-withdraw-success', {
            "message": "Status Update Success."
         });
      });

   }
}

module.exports.addFinance = function (io, socket, request) {

   if (!request) return;
   if (!request.user) return;
   // logger.info("addFinance: request=" + JSON.stringify(request));

   if (request.user.details.role == 'user') {

      var finance = new Finance();
      finance.username = request.user.details.username;
      finance.action = request.action;
      finance.amount = request.amount;
      finance.note = request.user.details.note;
      finance.manager = request.user.details.manager;
      finance.mobile = request.mobile;
      finance.bank = request.bank;
      finance.ifsc = request.ifsc;
      finance.holdername = request.holdername;
      finance.time = new Date();
      finance.account = request.account;
      finance.status = 'Pending';
      finance.deleted = false;
      finance.save(function (err, up) {
         if (err) logger.debug(err);
      });

      socket.emit('add-finance-success', {
         'message': 'Your request have been submitted'
      });
   }
}

module.exports.getFinance = function (io, socket, request) {

   if (!request) return;
   if (!request.user) return;
   //logger.info("getFinance: request=" + JSON.stringify(request));

   if (request.user.details.role == 'user') {

      Finance.find(request.filter, function (err, data) {
         if (err) logger.error(err);
         // console.log(data);

         socket.emit('get-finance-success', data);
      });
   }

   if (request.user.details.role == 'manager') {

      Finance.find(request.filter, function (err, data) {
         if (err) logger.error(err);
         console.log(data);

         socket.emit('get-finance-success', data);
      });
   }

   if (request.user.details.role == 'partner') {

      Finance.find(request.filter, function (err, data) {
         if (err) logger.error(err);
         console.log(data);

         socket.emit('get-finance-success', data);
      });
   }
}

module.exports.getManager = function (io, socket, request) {

   if (!request) return;
   if (!request.user) return;
   // logger.info("getManager: request=" + JSON.stringify(request));

   if (request.user.details.role == 'user') {

      User.findOne({
         username: request.user.details.manager
      }, function (err, dbUser) {
         if (err) logger.error(err);
         console.log(dbUser);

         socket.emit('get-manager-success', dbUser);
      });
   }
}

module.exports.updateManager = function (io, socket, request) {

   if (!request) return;
   if (!request.user) return;
   console.log(request);
   //("updateManager: request=" + JSON.stringify(request));

   if (request.user.details.role == 'admin') {


      User.update({
         username: request.updatedUser.username
      }, {
         $set: {
            version: request.updatedUser.version,
            applink: request.updatedUser.applink
         }
      }, function (err, dbUpdatedUser) {

         socket.emit('update-user-success', {
            "message": "User Update Success."
         });
      });

   }
}

module.exports.getReheshUser = function (io, socket, request) {

   if (!request) return;
   if (!request.user) return;
   //("getUser: request=" + JSON.stringify(request));

   if (request.user.details.role == 'user') {

      User.findOne({
         _id: request.user.details._id
      }, function (err, dbUser) {
         if (err) logger.error(err);
         console.log(dbUser);
         socket.emit('get-user-wheel-success', dbUser);
      });
   }
   if (request.user.details.role == 'partner') {
      if (!request.filter) request['filter'] = {
         _id: request.user.details._id,
         role: 'partner',
         deleted: false
      };
      if (!request.filter) return;
      User.findOne(request.filter, function (err, user) {
         if (err) logger.error(err);
         socket.emit('get-user-success', user);
      });
   }
   if (request.user.details.role == 'manager') {
      if (!request.filter) request['filter'] = {
         _id: request.user.details._id,
         role: 'manager',
         deleted: false
      };
      if (!request.filter) return;
      User.findOne(request.filter, function (err, user) {
         if (err) logger.error(err);
         socket.emit('get-user-success', user);
      });
   }
   if (request.user.details.role == 'admin') {
      if (!request.filter) request['filter'] = {
         _id: request.user.details._id,
         role: 'admin',
         deleted: false
      };
      if (!request.filter) return;
      User.findOne(request.filter, function (err, user) {
         if (err) logger.error(err);
         socket.emit('get-user-success', user);
      });
   }
}

module.exports.getUserPermission = function (io, socket, request) {
   // Validate request data
   if (!request.user) return;
   User.findOne({
      username: request.user.details.manager
   }, function (err, user) {
      if (err) return;
      var arr = user.availableEventTypes;


      socket.emit('get-user-permission-success', arr.indexOf("20"));
   });
};

module.exports.loginStatus = function (io, socket, request, access) {
   // validate request data

   if (!request || !access) return;
   if (!request.user) return;
   if (!request.user.details) return;
   if (!request.user.details.username) return;
   if (!request.user.details.manager) return;

   //("loginStatus: " + JSON.stringify(request));

   // Check for valid user
   var roles = [access.role];
   if (access.role2) roles.unshift(access.role2)
   User.findOne({
      _id: request.user._id,
      role: {
         $in: roles
      },
      hash: request.user.key,
      status: 'active',
      deleted: false
   }, function (err, user) {
      if (err) logger.debug(err);
      if (!user) {
         socket.emit('get-user-details-error', {
            message: 'Invalid user.',
            success: false
         });
         return;
      }
      // Check for existing session
      Session.findOne({
         _id: request.user.details._id,
         manager: request.user.details.manager,
         role: request.user.details.role
      }, function (err, userSession) {
         if (err) logger.debug(err);
         if (userSession) {
            if (userSession.headers['user-agent'] == socket.handshake.headers['user-agent']) {
               userSession.socket = socket.id;
               userSession.online = true;
               userSession.save(function (err) {
                  if (err) logger.error(err);
               });
               User.findOne({
                  _id: request.user.details._id,
                  manager: request.user.details.manager
               }, function (err, userDetails) {
                  if (err) logger.debug(err);
                  if (!userDetails) {
                     socket.emit('get-user-details-error', {
                        message: 'Invalid user.',
                        success: false
                     });
                     return;
                  } else {
                     socket.emit("get-user-details-success", {
                        userDetails: userDetails
                     });
                  }
               });
            } else {
               io.self.to(userSession.socket).emit('session-expired', {
                  session: userSession
               });
               userSession.socket = socket.id;
               userSession.headers = socket.handshake.headers;
               userSession.online = true;
               userSession.lastLogin = new Date();
               userSession.save(function (err, updatedSession) { });
               logger.warn(request.user.details.username + ' is trying to login from multiple places.');
               socket.emit('multiple-login', {
                  session: userSession
               });
               return;
            }
         } else {
            logger.warn(request.user.details.username + ' no session found. Requesting to login again.');
            socket.emit('session-expired', {
               session: userSession
            });
            return;
         }
      });
      //('login-status: ' + request.user.details.username + ' reconnected.');
   });
};

module.exports.getTvs = function (io, socket, request) {
   // Validate request data
   if (request)
      Tv.findOne({
         name: "api"
      }, function (err, tv) {
         console.log(tv);
         socket.emit('get-tv-success', tv);
      });
};

module.exports.updatePassword = function (io, socket, request) {
   if (!request) return;

   if (!request.user || !request.password) return;
   if (request.password == '') return;

   //("updatePassword: " + JSON.stringify(request));
   User.findOne({
      _id: request.user.details._id,
      role: request.user.details.role,
      hash: request.user.key,
      deleted: false,
      status: 'active'
   }, function (err, dbUser) {
      if (err) logger.debug(err);
      if (!dbUser) {
         logger.error("Invalid Access: " + JSON.stringify(request));
         socket.emit('logout');
         return;
      }
      if (!request.targetUser) {
         var login = new User();
         login.setPassword(request.password);
         dbUser.hash = login.hash;
         dbUser.salt = login.salt;
         dbUser.save(function (err, updatedLogin) {
            if (err) logger.error(err);
            socket.emit("update-password-success", {
               "message": "Password changed successfully.",
               success: true
            });
            Session.remove({
               _id: request.user.details._id
            }, function (err, data) {
               socket.emit('logout');
            });
         });
      } else {

         if (request.user.details.role == 'admin' && request.targetUser.role == 'subadmin') {
            if (request.targetUser.role != 'subadmin') return;
            User.findOne({
               username: request.targetUser.username,
               role: request.targetUser.role,
               deleted: false
            }, function (err, result) {
               console.log(result);
               if (err) logger.error(err);
               if (!result) {
                  socket.emit("update-password-error", {
                     "message": "User not found. Please try again.",
                     success: false
                  });
                  return;
               }
               var login = new User();
               login.setPassword(request.password);
               result.hash = login.hash;
               result.salt = login.salt;
               result.save(function (err, updatedLogin) {
                  if (err) logger.error(err);
                  socket.emit("update-password-success", {
                     "message": "Password changed successfully.",
                     success: true
                  });
                  Session.remove({
                     username: request.targetUser.username
                  });
               });
            });

         }

         if (request.user.details.role == 'admin' && request.targetUser.role == 'user') {
            if (request.targetUser.role != 'user') return;
            User.findOne({
               username: request.targetUser.username,
               role: request.targetUser.role,
               deleted: false
            }, function (err, result) {
               console.log(result);
               if (err) logger.error(err);
               if (!result) {
                  socket.emit("update-password-error", {
                     "message": "User not found. Please try again.",
                     success: false
                  });
                  return;
               }
               var login = new User();
               login.setPassword(request.password);
               result.hash = login.hash;
               result.salt = login.salt;
               result.save(function (err, updatedLogin) {
                  if (err) logger.error(err);
                  socket.emit("update-password-success", {
                     "message": "Password changed successfully.",
                     success: true
                  });
                  Session.remove({
                     username: request.targetUser.username
                  });
               });
            });

         }

         if (request.user.details.role == 'admin' && request.targetUser.role == 'master') {
            if (request.targetUser.role != 'master') return;
            User.findOne({
               username: request.targetUser.username,
               role: request.targetUser.role,
               deleted: false
            }, function (err, result) {
               console.log(result);
               if (err) logger.error(err);
               if (!result) {
                  socket.emit("update-password-error", {
                     "message": "User not found. Please try again.",
                     success: false
                  });
                  return;
               }
               var login = new User();
               login.setPassword(request.password);
               result.hash = login.hash;
               result.salt = login.salt;
               result.save(function (err, updatedLogin) {
                  if (err) logger.error(err);
                  socket.emit("update-password-success", {
                     "message": "Password changed successfully.",
                     success: true
                  });
                  Session.remove({
                     username: request.targetUser.username
                  });
               });
            });

         }

         if (request.user.details.role == 'admin' && request.targetUser.role == 'manager') {
            if (request.targetUser.role != 'manager') return;
            User.findOne({
               username: request.targetUser.username,
               role: request.targetUser.role,
               deleted: false
            }, function (err, result) {
               console.log(result);
               if (err) logger.error(err);
               if (!result) {
                  socket.emit("update-password-error", {
                     "message": "User not found. Please try again.",
                     success: false
                  });
                  return;
               }
               var login = new User();
               login.setPassword(request.password);
               result.hash = login.hash;
               result.salt = login.salt;
               result.save(function (err, updatedLogin) {
                  if (err) logger.error(err);
                  socket.emit("update-password-success", {
                     "message": "Password changed successfully.",
                     success: true
                  });
                  Session.remove({
                     username: request.targetUser.username
                  });
               });
            });

         }

         if (request.user.details.role == 'subadmin' && request.targetUser.role == 'manager' || request.targetUser.role == 'user') {
            if (request.targetUser.role != 'manager' && request.targetUser.role != 'user') return;
            User.findOne({
               username: request.targetUser.username,
               role: request.targetUser.role,
               deleted: false
            }, function (err, result) {
               console.log(result);
               if (err) logger.error(err);
               if (!result) {
                  socket.emit("update-password-error", {
                     "message": "User not found. Please try again.",
                     success: false
                  });
                  return;
               }
               var login = new User();
               login.setPassword(request.password);
               result.hash = login.hash;
               result.salt = login.salt;
               result.save(function (err, updatedLogin) {
                  if (err) logger.error(err);
                  socket.emit("update-password-success", {
                     "message": "Password changed successfully.",
                     success: true
                  });
                  Session.remove({
                     username: request.targetUser.username
                  });
               });
            });

         }

         if (request.user.details.role == 'master') {
            if (request.targetUser.role != 'manager' && request.targetUser.role != 'user') return;
            User.findOne({
               username: request.targetUser.username,
               role: request.targetUser.role,
               deleted: false
            }, function (err, result) {
               if (err) logger.error(err);
               if (!result) {
                  socket.emit("update-password-error", {
                     "message": "User not found. Please try again.",
                     success: false
                  });
                  return;
               }
               var login = new User();
               login.setPassword(request.password);
               result.hash = login.hash;
               result.salt = login.salt;
               result.save(function (err, updatedLogin) {
                  if (err) logger.error(err);
                  socket.emit("update-password-success", {
                     "message": "Password changed successfully.",
                     success: true
                  });
                  Session.remove({
                     username: request.targetUser.username
                  });
               });
            });

         }

         if (request.user.details.role == 'subadmin') {
            if (request.targetUser.role != 'master') return;
            User.findOne({
               username: request.targetUser.username,
               role: request.targetUser.role,
               deleted: false
            }, function (err, result) {
               if (err) logger.error(err);
               if (!result) {
                  socket.emit("update-password-error", {
                     "message": "User not found. Please try again.",
                     success: false
                  });
                  return;
               }
               var login = new User();
               login.setPassword(request.password);
               result.hash = login.hash;
               result.salt = login.salt;
               result.save(function (err, updatedLogin) {
                  if (err) logger.error(err);
                  socket.emit("update-password-success", {
                     "message": "Password changed successfully.",
                     success: true
                  });
                  Session.remove({
                     username: request.targetUser.username
                  });
               });
            });

         }


         if (request.user.details.role == 'admin') {
            if (request.targetUser.role == 'admin') return;
            User.findOne({
               username: request.targetUser.username,
               role: request.targetUser.role,
               deleted: false
            }, function (err, result) {
               if (err) logger.error(err);
               if (!result) {
                  socket.emit("update-password-error", {
                     "message": "User not found. Please try again.",
                     success: false
                  });
                  return;
               }
               var login = new User();
               login.setPassword(request.password);
               result.hash = login.hash;
               result.salt = login.salt;
               result.save(function (err, updatedLogin) {
                  if (err) logger.error(err);
                  socket.emit("update-password-success", {
                     "message": "Password changed successfully.",
                     success: true
                  });
                  Session.remove({
                     username: request.targetUser.username
                  });
               });
            });

         }
         if (request.user.details.role == 'manager') {
            if (request.targetUser.role != 'user' && request.targetUser.role != 'partner') return;
            User.findOne({
               hash: request.user.key,
               _id: request.user.details._id,
               role: 'manager',
               deleted: false,
               status: 'active'
            }, function (err, dbAdmin) {
               if (err) logger.error(err);
               if (!dbAdmin) {
                  logger.error("Invalid Access: " + JSON.stringify(request));
                  return;
               }
               User.findOne({
                  username: request.targetUser.username,
                  role: request.targetUser.role,
                  deleted: false
               }, function (err, result) {
                  if (err) logger.error(err);
                  if (!result) {
                     socket.emit("update-password-error", {
                        "message": "Password change failed.",
                        success: false
                     });
                     return;
                  }
                  var login = new User();
                  login.setPassword(request.password);
                  result.hash = login.hash;
                  result.salt = login.salt;
                  result.save(function (err, updatedLogin) {
                     if (err) logger.error(err);
                     socket.emit("update-password-success", {
                        "message": "Password changed successfully.",
                        success: true
                     });
                     Session.remove({
                        username: request.targetUser.username
                     });
                  });
               });

            });
         }

         if (request.user.details.role == 'partner') {
            if (request.targetUser.role != 'user') return;
            User.findOne({
               hash: request.user.key,
               _id: request.user.details._id,
               role: 'partner',
               deleted: false,
               status: 'active'
            }, function (err, dbAdmin) {
               if (err) logger.error(err);
               if (!dbAdmin) {
                  logger.error("Invalid Access: " + JSON.stringify(request));
                  return;
               }
               User.findOne({
                  username: request.targetUser.username,
                  role: request.targetUser.role,
                  deleted: false
               }, function (err, result) {
                  if (err) logger.error(err);
                  if (!result) {
                     socket.emit("update-password-error", {
                        "message": "Password change failed.",
                        success: false
                     });
                     return;
                  }
                  var login = new User();
                  login.setPassword(request.password);
                  result.hash = login.hash;
                  result.salt = login.salt;
                  result.save(function (err, updatedLogin) {
                     if (err) logger.error(err);
                     socket.emit("update-password-success", {
                        "message": "Password changed successfully.",
                        success: true
                     });
                     Session.remove({
                        username: request.targetUser.username
                     });
                  });
               });

            });
         }


      }
   });

};

function createManagerClub(username, password, _id, sharing) {

   var request = require('request');
   var options = {
      'method': 'POST',
      'url': 'https://acepunt.kushubmedia.com/admin/subadminRegister',
      'headers': {
         'Content-Type': 'application/json'
      },
      body: JSON.stringify({
         "username": username,
         "password": password,
         "paisaId": _id,
         "sharing": sharing
      })

   };
   request(options, function (error, response) {
      if (error) throw new Error(error);
      console.log(response.body);
   });

}

module.exports.getChatUsers = function (io, socket, request) {
   if (!request) return;
   if (!request.user) return;
   if (!request.user.details) return;
   //("getChatUsers: request=" + JSON.stringify(request));


   if (request.user.details.role == 'manager') {

      if (!request.filter || !request.sort) return;
      // console.log(request.filter)
      User.findOne({
         hash: request.user.key,
         _id: request.user.details._id,
         role: 'manager',
         deleted: false,
         status: 'active'
      }, function (err, dbManager) {
         if (err) logger.error(err);
         if (!dbManager) {
            logger.error("Invalid Access: " + JSON.stringify(request));
            return;
         }
         var output = {};
         User.find(request.filter).sort(request.sort).exec(function (err, result) {
            if (err) logger.error(err);
            if (!result) return;

            var counter = 0;
            output.users = result;
            output.msg = {};
            output.msgcount = {};
            //Todo: optimize. use single query using $in
            var len = result.length;

            for (var i = 0; i < result.length; i++) {
               (function (user, index, callback) {

                  Chat.find({
                     user: user.username,
                     manager: user.manager,
                     visiblebymanager: false,
                  }).sort({
                     'time': 1
                  }).exec(function (err, chatmsg) {

                     Chat.find({
                        user: user.username,
                        manager: user.manager,

                     }).sort({
                        'time': 1
                     }).exec(function (err, chatmsgs) {

                        if (!chatmsgs) {
                           var lastItem = [];
                        } else {
                           var lastItem = chatmsgs[chatmsgs.length - 1];
                        }


                        callback(chatmsg, lastItem, index);
                     });
                  });
               })(result[i], i, function (msg, lastItem, index) {
                  counter++;
                  if (counter == len) {
                     output.msg[result[index].username] = lastItem;
                     output.msgcount[result[index].username] = msg;
                     socket.emit('get-user-chatlist-success', output);
                     //console.log(output)
                  } else {
                     output.msg[result[index].username] = lastItem;
                     output.msgcount[result[index].username] = msg;
                  }
               });
            }

         });
      });
   }

   if (request.user.details.role == 'partner') {
      if (!request.filter || !request.sort) return;
      User.findOne({
         hash: request.user.key,
         _id: request.user.details._id,
         role: 'partner',
         deleted: false,
         status: 'active'
      }, function (err, dbManager) {
         if (err) logger.error(err);
         if (!dbManager) {
            logger.error("Invalid Access: " + JSON.stringify(request));
            return;
         }
         var output = {};
         User.find(request.filter).sort(request.sort).exec(function (err, result) {
            if (err) logger.error(err);
            if (!result) return;

            var counter = 0;
            output.users = result;
            output.msg = {};
            output.msgcount = {};
            //Todo: optimize. use single query using $in
            var len = result.length;

            for (var i = 0; i < result.length; i++) {
               (function (user, index, callback) {

                  Chat.find({
                     user: user.username,
                     manager: user.manager,
                     visiblebymanager: false,
                  }).sort({
                     'time': 1
                  }).exec(function (err, chatmsg) {

                     Chat.find({
                        user: user.username,
                        manager: user.manager,

                     }).sort({
                        'time': 1
                     }).exec(function (err, chatmsgs) {

                        if (!chatmsgs) {
                           var lastItem = [];
                        } else {
                           var lastItem = chatmsgs[chatmsgs.length - 1];
                        }


                        callback(chatmsg, lastItem, index);
                     });
                  });
               })(result[i], i, function (msg, lastItem, index) {
                  counter++;
                  if (counter == len) {
                     output.msg[result[index].username] = lastItem;
                     output.msgcount[result[index].username] = msg;
                     socket.emit('get-user-chatlist-success', output);
                  } else {
                     output.msg[result[index].username] = lastItem;
                     output.msgcount[result[index].username] = msg;
                  }
               });
            }

         });
      });
   }

}

module.exports.getUserLists = function (io, socket, request) {
   if (!request) return;
   if (!request.user) return;
   if (!request.user.details) return;
   //("getUserLists: request=" + JSON.stringify(request));
   try {
      getCasinoBalance(io, socket, request);

      if (request.user.details.role == 'master') {
         if (!request.filter || !request.sort) return;
         User.findOne({
            hash: request.user.key,
            _id: request.user.details._id,
            role: 'master',
            deleted: false,
            status: 'active'
         }, function (err, dbAdmin) {
            if (err) logger.error(err);
            if (!dbAdmin) {
               logger.error("Invalid Access1: " + JSON.stringify(request));
               return;
            }

            //request.filter.push({'username':{$ne:'Sachin1'}});
            User.find(request.filter).sort(request.sort).exec(function (err, result) {
               if (err) logger.error(err);
               if (result.length > 0) {
                  var arr = [];
                  result.forEach((val, index) => {
                     User.find({
                        'manager': val.username,
                        deleted: false,

                        role: 'user'
                     }).exec(function (err, resultU) {
                        result[index].totalexposure = 0;
                        result[index].totalbalance = 0;
                        if (resultU.length > 0) {
                           resultU.forEach((value) => {
                              result[index].totalexposure += -1 * value.exposure;
                              if (value.mainbalance) {

                                 result[index].totalbalance += value.limit + value.mainbalance;
                              } else {
                                 result[index].totalbalance += value.limit;

                              }

                           })
                        }

                        socket.emit("get-users-list-success", result);

                     });
                  })

               }


            });
         });
      }

      if (request.user.details.role == 'subadmin') {
         if (!request.filter || !request.sort) return;
         User.findOne({
            hash: request.user.key,
            _id: request.user.details._id,
            role: 'subadmin',
            deleted: false,
            status: 'active'
         }, function (err, dbAdmin) {
            if (err) logger.error(err);
            if (!dbAdmin) {
               logger.error("Invalid Access1: " + JSON.stringify(request));
               return;
            }

            //request.filter.push({'username':{$ne:'Sachin1'}});
            User.find(request.filter).sort(request.sort).exec(function (err, result) {
               if (err) logger.error(err);
               if (result.length > 0) {
                  var arr = [];
                  result.forEach((val, index) => {
                     User.find({
                        'master': val.username,
                        role: { $ne: 'partner' },
                        deleted: false
                     }).exec(function (err, resultU) {
                        result[index].totalexposure = 0;
                        result[index].totalbalance = 0;
                        if (resultU.length > 0) {
                           resultU.forEach((value) => {
                              result[index].totalexposure += -1 * value.exposure;
                              if (value.mainbalance) {

                                 result[index].totalbalance += value.limit + value.mainbalance;
                              } else {
                                 result[index].totalbalance += value.limit;

                              }
                           })
                        }
                        socket.emit("get-users-list-success", result);

                     });
                  })

               }


            });
         });
      }


      if (request.user.details.role == 'admin') {


         if (!request.filter) return;
         User.findOne({
            hash: request.user.key,
            _id: request.user.details._id,
            role: 'admin',

         }, function (err, dbAdmin) {
            console.log('step2')
            if (err) logger.error(err);
            if (!dbAdmin) {
               logger.error("Invalid Access1: " + JSON.stringify(request));
               return;
            }
            console.log('step3')

            //request.filter.push({'username':{$ne:'Sachin1'}});
            User.find(request.filter).sort(request.sort).exec(function (err, result) {
               console.log('step4')

               if (err) logger.error(err);
               if (result.length > 0) {
                  console.log('step5')
                  var arr = [];
                  result.forEach((val, index) => {
                     User.find({
                        'subadmin': val.username,
                        role: { $ne: 'partner' },
                        deleted: false
                     }).exec(function (err, resultU) {
                        result[index].totalexposure = 0;
                        result[index].totalbalance = 0;
                        if (resultU.length > 0) {
                           resultU.forEach((value) => {
                              result[index].totalexposure += -1 * value.exposure;
                              if (value.mainbalance) {

                                 result[index].totalbalance += value.limit + value.mainbalance;
                              } else {
                                 result[index].totalbalance += value.limit;

                              }
                           })
                        }
                        console.log("ssssss")
                        socket.emit("get-users-list-success", result);

                     });
                  })

               }


            });
         });
      }


   } catch (e) {
      console.log(e)
   }
}

module.exports.getUsersList = function (io, socket, request) {
   if (!request) return;
   if (!request.user) return;
   if (!request.user.details) return;
   //("getUser: request=" + JSON.stringify(request));
   try {

      if (request.user.details.role == 'admin') {
         if (!request.filter || !request.sort) return;
         User.findOne({
            hash: request.user.key,
            _id: request.user.details._id,
            role: 'admin',
            deleted: false,
            status: 'active'
         }, function (err, dbAdmin) {
            if (err) logger.error(err);
            if (!dbAdmin) {
               logger.error("Invalid Access: " + JSON.stringify(request));
               return;
            }
            User.find(request.filter).sort(request.sort).limit(request.limit).exec(function (err, result) {
               if (err) logger.error(err);
               socket.emit("get-userslist-success", result);

            });
         });
      }


   } catch (e) {
      console.log(e)
   }
}

module.exports.getManagerUsers = function (io, socket, request) {
   if (!request) return;
   if (!request.user) return;
   if (!request.user.details) return;
   //("getManagerUsers: request=" + JSON.stringify(request));


   if (request.user.details.role == 'subadmin' || request.user.details.role == 'master' || request.user.details.role == 'admin') {

      // console.log("bbbbbbbbbbbbbbbbbbbbbb");
      User.find(request.filter).sort(request.sort).exec(function (err, result) {
         if (err) logger.error(err);
         console.log(result);
         socket.emit("get-managerusers-success", result);
         //socket.emit("get-users-success", result);
      });

   }


}

module.exports.getUserCount = function (io, socket, request) {
   if (!request) return;
   if (!request.user) return;
   if (!request.user.details) return;
   //("getUserCount: request=" + JSON.stringify(request));

   User.findOne({
      _id: request.user.details._id,
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
         result = {
            user: 0,
            manager: 0,
            partner: 0,
            joinedToday: 0,
            joinedThisMonth: 0,
            blockedManagers: 0
         };
         User.count({
            role: 'manager',
            deleted: false,
            status: 'active'
         }).exec(function (err, managerCount) {
            if (err) logger.error(err);
            result['manager'] = managerCount;
            User.count({
               role: 'partner',
               deleted: false,
               status: 'active'
            }).exec(function (err, partnerCount) {
               if (err) logger.error(err);
               result['partner'] = partnerCount;
               User.count({
                  role: 'user',
                  deleted: false,
                  status: 'active'
               }).exec(function (err, userCount) {
                  if (err) logger.error(err);
                  result['user'] = userCount;
                  User.count({
                     deleted: false,
                     status: 'active',
                     openingDate: {
                        $gte: (new Date((new Date()).getTime() - (1 * 24 * 60 * 60 * 1000)))
                     }
                  }).exec(function (err, joinedTodayCount) {
                     if (err) logger.error(err);
                     result['joinedToday'] = joinedTodayCount;
                     User.count({
                        deleted: false,
                        status: 'active',
                        openingDate: {
                           $gte: (new Date((new Date()).getTime() - (30 * 24 * 60 * 60 * 1000)))
                        }
                     }).exec(function (err, joinedThisMonth) {
                        if (err) logger.error(err);
                        result['joinedThisMonth'] = joinedThisMonth;
                        User.count({
                           deleted: false,
                           status: 'blocked'
                        }).exec(function (err, blockedManagers) {
                           if (err) logger.error(err);
                           result['blockedManagers'] = blockedManagers;
                           socket.emit('get-user-count-success', result);
                        });
                     });
                  });
               });
            });
         });
      }

      if (dbUser.roleSub == 'master') {
         result = {
            user: 0,
            manager: 0,
            partner: 0,
            joinedToday: 0,
            joinedThisMonth: 0,
            blockedManagers: 0
         };
         User.count({
            role: 'manager',
            deleted: false,
            status: 'active',
            master: request.user.details.username
         }).exec(function (err, managerCount) {
            if (err) logger.error(err);
            result['manager'] = managerCount;
            User.count({
               role: 'partner',
               deleted: false,
               status: 'active',
               manager: request.user.details.username
            }).exec(function (err, partnerCount) {
               if (err) logger.error(err);
               result['partner'] = partnerCount;
               User.count({
                  role: 'user',
                  deleted: false,
                  status: 'active',
                  'admin': request.user.details.username
               }).exec(function (err, userCount) {
                  if (err) logger.error(err);
                  result['user'] = userCount;
                  User.count({
                     deleted: false,
                     status: 'active',
                     'admin': request.user.details.username,
                     openingDate: {
                        $gte: (new Date((new Date()).getTime() - (1 * 24 * 60 * 60 * 1000)))
                     }
                  }).exec(function (err, joinedTodayCount) {
                     if (err) logger.error(err);
                     result['joinedToday'] = joinedTodayCount;
                     User.count({
                        deleted: false,
                        status: 'active',
                        'admin': request.user.details.username,
                        openingDate: {
                           $gte: (new Date((new Date()).getTime() - (30 * 24 * 60 * 60 * 1000)))
                        }
                     }).exec(function (err, joinedThisMonth) {
                        if (err) logger.error(err);
                        result['joinedThisMonth'] = joinedThisMonth;
                        User.count({
                           deleted: false,
                           status: 'blocked',
                           'admin': request.user.details.username
                        }).exec(function (err, blockedManagers) {
                           if (err) logger.error(err);
                           result['blockedManagers'] = blockedManagers;
                           socket.emit('get-user-count-success', result);
                        });
                     });
                  });
               });
            });
         });
      }

      if (dbUser.roleSub == 'subadmin') {
         result = {
            user: 0,
            manager: 0,
            partner: 0,
            joinedToday: 0,
            joinedThisMonth: 0,
            blockedManagers: 0
         };
         User.count({
            role: 'manager',
            deleted: false,
            status: 'active',
            manager: request.user.details.username
         }).exec(function (err, managerCount) {
            if (err) logger.error(err);
            result['manager'] = managerCount;
            User.count({
               role: 'partner',
               deleted: false,
               status: 'active',
               manager: request.user.details.username
            }).exec(function (err, partnerCount) {
               if (err) logger.error(err);
               result['partner'] = partnerCount;
               User.count({
                  role: 'user',
                  deleted: false,
                  status: 'active',
                  'admin': request.user.details.username
               }).exec(function (err, userCount) {
                  if (err) logger.error(err);
                  result['user'] = userCount;
                  User.count({
                     deleted: false,
                     status: 'active',
                     'admin': request.user.details.username,
                     openingDate: {
                        $gte: (new Date((new Date()).getTime() - (1 * 24 * 60 * 60 * 1000)))
                     }
                  }).exec(function (err, joinedTodayCount) {
                     if (err) logger.error(err);
                     result['joinedToday'] = joinedTodayCount;
                     User.count({
                        deleted: false,
                        status: 'active',
                        'admin': request.user.details.username,
                        openingDate: {
                           $gte: (new Date((new Date()).getTime() - (30 * 24 * 60 * 60 * 1000)))
                        }
                     }).exec(function (err, joinedThisMonth) {
                        if (err) logger.error(err);
                        result['joinedThisMonth'] = joinedThisMonth;
                        User.count({
                           deleted: false,
                           status: 'blocked',
                           'admin': request.user.details.username
                        }).exec(function (err, blockedManagers) {
                           if (err) logger.error(err);
                           result['blockedManagers'] = blockedManagers;
                           socket.emit('get-user-count-success', result);
                        });
                     });
                  });
               });
            });
         });
      }
      if (dbUser.role == 'operator') {
         result = {
            user: 0,
            manager: 0,
            partner: 0,
            joinedToday: 0,
            joinedThisMonth: 0,
            blockedManagers: 0
         };
         User.count({
            role: 'manager',
            deleted: false,
            status: 'active'
         }).exec(function (err, managerCount) {
            if (err) logger.error(err);
            result['manager'] = managerCount;
            User.count({
               role: 'partner',
               deleted: false,
               status: 'active'
            }).exec(function (err, partnerCount) {
               if (err) logger.error(err);
               result['partner'] = partnerCount;
               User.count({
                  role: 'user',
                  deleted: false,
                  status: 'active'
               }).exec(function (err, userCount) {
                  if (err) logger.error(err);
                  result['user'] = userCount;
                  User.count({
                     deleted: false,
                     status: 'active',
                     openingDate: {
                        $gte: (new Date((new Date()).getTime() - (1 * 24 * 60 * 60 * 1000)))
                     }
                  }).exec(function (err, joinedTodayCount) {
                     if (err) logger.error(err);
                     result['joinedToday'] = joinedTodayCount;
                     User.count({
                        deleted: false,
                        status: 'active',
                        openingDate: {
                           $gte: (new Date((new Date()).getTime() - (30 * 24 * 60 * 60 * 1000)))
                        }
                     }).exec(function (err, joinedThisMonth) {
                        if (err) logger.error(err);
                        result['joinedThisMonth'] = joinedThisMonth;
                        User.count({
                           deleted: false,
                           status: 'blocked'
                        }).exec(function (err, blockedManagers) {
                           if (err) logger.error(err);
                           result['blockedManagers'] = blockedManagers;
                           socket.emit('get-user-count-success', result);
                        });
                     });
                  });
               });
            });
         });
      }
   });
}

module.exports.updateUserStatus = function (io, socket, request) {
   //console.log(request);
   if (!request) return;
   if (!request.user) return;
   logger.debug("updateUserStatus: " + JSON.stringify(request));

   User.findOne({
      _id: request.user.details._id,
      deleted: false,
      status: 'active',
      role: request.user.details.role
   }, function (err, dbUser) {
      if (err) {
         logger.error(err);
         return;
      }
      if (!dbUser) {
         logger.error("Invalid username for given role " + JSON.stringify(dbUser));
         return;
      }


      if (dbUser.role == 'admin') {

         if (request.updatedUser.role == 'user') {
            User.update({
               username: request.updatedUser.username,
               role: request.updatedUser.role
            }, {
               $set: {
                  status: request.updatedUser.status,

               }
            }, function (err, dbUpdatedUser) {
               if (err) {
                  logger.debug(err);
               }
               socket.emit('update-user-success', {
                  message: 'User record updated successfully.'
               });
            });
         }


         //check for additional permissions
      }

      if (dbUser.role == 'manager') {

         if (request.updatedUser.role == 'user') {
            User.update({
               username: request.updatedUser.username,
               role: request.updatedUser.role
            }, {
               $set: {
                  status: request.updatedUser.status,
                  paid: request.updatedUser.status
               }
            }, function (err, dbUpdatedUser) {
               if (err) {
                  logger.debug(err);
               }
               socket.emit('update-user-success', {
                  message: 'User record updated successfully.'
               });
            });
         }


         //check for additional permissions
      }

   });
}

module.exports.updateSharing = function (io, socket, request) {
   console.log(request);
   if (!request) return;
   if (!request.user || !request.updatedUser) return;
   logger.debug("updateSharing: " + JSON.stringify(request));

   User.findOne({
      _id: request.user.details._id,
      deleted: false,
      status: 'active',
      role: request.user.details.role
   }, function (err, dbUser) {
      if (err) {
         logger.error(err);
         return;
      }
      if (!dbUser) {
         logger.error("Invalid username for given role " + JSON.stringify(dbUser));
         return;
      }


      User.update({
         username: request.updatedUser.username,
         role: request.updatedUser.role
      }, {
         $set: {
            commision: request.updatedUser.sharing
         }
      }, function (err, dbUpdatedUser) {
         if (err) {
            logger.debug(err);
         }
         socket.emit('update-user-success', {
            message: 'User record updated successfully.'
         });
      });


   });
}

module.exports.updateUserStatus = function (io, socket, request) {
   console.log(request);
   if (!request) return;
   if (!request.user || !request.updatedUser) return;
   logger.debug("updateUserStatus: " + JSON.stringify(request));

   User.findOne({
      _id: request.user.details._id,
      deleted: false,
      status: 'active',
      role: request.user.details.role
   }, function (err, dbUser) {
      if (err) {
         logger.error(err);
         return;
      }
      if (!dbUser) {
         logger.error("Invalid username for given role " + JSON.stringify(dbUser));
         return;
      }

      if (dbUser.role == 'manager') {
         if (request.updatedUser.role == 'user') {
            User.update({
               username: request.updatedUser.username,
               role: request.updatedUser.role
            }, {
               $set: {
                  paid: request.updatedUser.paid,


               }
            }, function (err, dbUpdatedUser) {
               if (err) {
                  logger.debug(err);
               }
               socket.emit('update-user-success', {
                  message: 'User record updated successfully.'
               });
            });
         }

      }

   });
}

module.exports.updateUser = function (io, socket, request) {

   if (!request) return;
   if (!request.user || !request.updatedUser) return;
   logger.debug("updateUser: " + JSON.stringify(request));

   User.findOne({
      _id: request.user.details._id,
      deleted: false,
      status: 'active',
      role: request.user.details.role
   }, function (err, dbUser) {
      if (err) {
         logger.error(err);
         return;
      }
      if (!dbUser) {
         logger.error("Invalid username for given role " + JSON.stringify(dbUser));
         return;
      }

      if (dbUser.role == 'master') {
         if (request.updatedUser.role == 'manager' || request.updatedUser.role == 'user') {

            User.update({
               username: request.updatedUser.username,
               role: request.updatedUser.role,
            }, {
               $set: {
                  amount: request.updatedUser.rentalamount,
                  type: request.updatedUser.type,
                  status: request.updatedUser.status,
                  image: request.updatedUser.image,
                  availableEventTypes: request.updatedUser.availableEventTypes,
                  sessionAccess: request.updatedUser.sessionAccess,
                  partnerPermissions: request.updatedUser.partnerPermissions,
                  partnerLimit: request.updatedUser.partnerLimit,
                  userLimit: request.updatedUser.userLimit,
                  creditoldLimit: request.updatedUser.creditoldLimit,
                  creditLimit: request.updatedUser.creditLimit

               }
            }, function (err, dbUpdatedUser) {
               if (err) {
                  logger.debug(err);
               }
               socket.emit('update-user-success', {
                  message: 'User record updated successfully.'
               });
            });

            Login.update({
               username: request.updatedUser.username,
               role: request.updatedUser.role
            }, {
               $set: {
                  status: request.updatedUser.status
               }
            }, function (err, dbUpdatedUser) {
               if (err) {
                  logger.debug(err);
               }

            });
         }
      }

      if (dbUser.role == 'subadmin') {
         if (request.updatedUser.role == 'master' || request.updatedUser.role == 'manager' || request.updatedUser.role == 'user') {

            User.update({
               username: request.updatedUser.username,
               role: request.updatedUser.role
            }, {
               $set: {
                  amount: request.updatedUser.rentalamount,
                  type: request.updatedUser.type,
                  commision: request.updatedUser.commision,
                  status: request.updatedUser.status,
                  image: request.updatedUser.image,
                  availableEventTypes: request.updatedUser.availableEventTypes,
                  sessionAccess: request.updatedUser.sessionAccess,
                  managerLimit: request.updatedUser.managerLimit,
                  creditoldLimit: request.updatedUser.creditoldLimit,
                  creditLimit: request.updatedUser.creditLimit
               }
            }, function (err, dbUpdatedUser) {
               if (err) {
                  logger.debug(err);
               }
               socket.emit('update-user-success', {
                  message: 'User record updated successfully.'
               });
            });

            Login.update({
               username: request.updatedUser.username,
               role: request.updatedUser.role
            }, {
               $set: {
                  status: request.updatedUser.status
               }
            }, function (err, dbUpdatedUser) {
               if (err) {
                  logger.debug(err);
               }

            });
         }
      }


      if (dbUser.role == 'admin') {
         if (request.updatedUser.role == 'user' || request.updatedUser.role == 'manager' || request.updatedUser.role == 'master' || request.updatedUser.role == 'subadmin') {

            User.update({
               username: request.updatedUser.username,
               role: request.updatedUser.role
            }, {
               $set: {
                  amount: request.updatedUser.rentalamount,
                  type: request.updatedUser.type,
                  commision: request.updatedUser.commision,
                  status: request.updatedUser.status,
                  image: request.updatedUser.image,
                  availableEventTypes: request.updatedUser.availableEventTypes,
                  sessionAccess: request.updatedUser.sessionAccess,
                  managerLimit: request.updatedUser.managerLimit,
                  creditoldLimit: request.updatedUser.creditoldLimit,
                  creditLimit: request.updatedUser.creditLimit
               }
            }, function (err, dbUpdatedUser) {
               if (err) {
                  logger.debug(err);
               }
               socket.emit('update-user-success', {
                  message: 'User record updated successfully.'
               });
            });

            Login.update({
               username: request.updatedUser.username,
               role: request.updatedUser.role
            }, {
               $set: {
                  status: request.updatedUser.status
               }
            }, function (err, dbUpdatedUser) {
               if (err) {
                  logger.debug(err);
               }

            });
         }
      }

      if (dbUser.role == 'admin') {
         if (request.updatedUser.role == 'admin') {
            User.update({
               username: dbUser.username,
               role: request.updatedUser.role
            }, {
               $set: {
                  image: request.updatedUser.image
               }
            }, function (err, dbUpdatedUser) {
               if (err) {
                  logger.debug(err);
               }
               socket.emit('update-user-success', {
                  message: 'User record updated successfully.'
               });
            });
         } else {
            Login.update({
               username: request.updatedUser.username,
               role: request.updatedUser.role
            }, {
               $set: {
                  status: request.updatedUser.status,
                  loginAttempts: 0
               }
            }, function (err, dbUpdatedLogin) {
               if (err) {
                  logger.debug(err);
                  return;
               }
               User.update({
                  username: request.updatedUser.username,
                  role: request.updatedUser.role
               }, {
                  $set: {
                     status: request.updatedUser.status,
                     image: request.updatedUser.image,
                     availableEventTypes: request.updatedUser.availableEventTypes,
                     sessionAccess: request.updatedUser.sessionAccess,
                     masterLimit: request.updatedUser.masterLimit
                  }
               }, function (err, dbUpdatedUser) {
                  if (err) {
                     logger.debug(err);
                  }
                  socket.emit('update-user-success', {
                     message: 'User record updated successfully.'
                  });
               });
            });
         }
      }


      if (dbUser.role == 'manager') {
         if (request.updatedUser.role == 'manager') {
            User.update({
               username: dbUser.username,
               role: request.updatedUser.role
            }, {
               $set: {
                  image: request.updatedUser.image
               }
            }, function (err, dbUpdatedUser) {
               if (err) {
                  logger.debug(err);
               }
               socket.emit('update-user-success', {
                  message: 'User record updated successfully.'
               });
            });
         }
         if (request.updatedUser.role == 'partner') {
            Login.update({
               username: request.updatedUser.username,
               role: request.updatedUser.role
            }, {
               $set: {
                  status: request.updatedUser.status,
                  loginAttempts: 0
               }
            }, function (err, dbUpdatedLogin) {
               if (err) {
                  logger.debug(err);
                  return;
               }
               User.update({
                  username: request.updatedUser.username,
                  role: request.updatedUser.role
               }, {
                  $set: {
                     status: request.updatedUser.status,
                     image: request.updatedUser.image,
                     partnerPermissions: request.updatedUser.partnerPermissions
                  }
               }, function (err, dbUpdatedUser) {
                  console.log(err);
                  if (err) {
                     logger.debug(err);
                  }
                  socket.emit('update-user-success', {
                     message: 'User record updated successfully.'
                  });
               });
            });
         }
         if (request.updatedUser.role == 'user') {
            Login.update({
               username: request.updatedUser.username,
               role: request.updatedUser.role
            }, {
               $set: {
                  status: request.updatedUser.status,
                  loginAttempts: 0
               }
            }, function (err, dbUpdatedLogin) {
               if (err) {
                  logger.debug(err);
                  return;
               }
               User.update({
                  username: request.updatedUser.username,
                  role: request.updatedUser.role
               }, {
                  $set: {
                     status: request.updatedUser.status,
                     image: request.updatedUser.image
                  }
               }, function (err, dbUpdatedUser) {
                  if (err) {
                     logger.debug(err);
                  }
                  socket.emit('update-userall-success', {
                     message: 'User record updated successfully.'
                  });
               });
            });
         }
      }
      if (dbUser.role == 'partner') {

         if (request.updatedUser.role == 'manager') {
            User.update({
               username: dbUser.username,
               role: request.updatedUser.role
            }, {
               $set: {
                  image: request.updatedUser.image
               }
            }, function (err, dbUpdatedUser) {
               if (err) {
                  logger.debug(err);
               }
               socket.emit('update-user-success', {
                  message: 'User record updated successfully.'
               });
            });
         }
         if (request.updatedUser.role == 'partner') {
            Login.update({
               username: request.updatedUser.username,
               role: request.updatedUser.role
            }, {
               $set: {
                  status: request.updatedUser.status,
                  loginAttempts: 0
               }
            }, function (err, dbUpdatedLogin) {
               if (err) {
                  logger.debug(err);
                  return;
               }
               User.update({
                  username: request.updatedUser.username,
                  role: request.updatedUser.role
               }, {
                  $set: {
                     status: request.updatedUser.status,
                     image: request.updatedUser.image,
                     partnerPermissions: request.updatedUser.partnerPermissions
                  }
               }, function (err, dbUpdatedUser) {
                  console.log(err);
                  if (err) {
                     logger.debug(err);
                  }
                  socket.emit('update-user-success', {
                     message: 'User record updated successfully.'
                  });
               });
            });
         }
         if (request.updatedUser.role == 'user') {
            Login.update({
               username: request.updatedUser.username,
               role: request.updatedUser.role
            }, {
               $set: {
                  status: request.updatedUser.status,
                  loginAttempts: 0
               }
            }, function (err, dbUpdatedLogin) {
               if (err) {
                  logger.debug(err);
                  return;
               }
               User.update({
                  username: request.updatedUser.username,
                  role: request.updatedUser.role
               }, {
                  $set: {
                     status: request.updatedUser.status,
                     image: request.updatedUser.image
                  }
               }, function (err, dbUpdatedUser) {
                  if (err) {
                     logger.debug(err);
                  }
                  socket.emit('update-user-success', {
                     message: 'User record updated successfully.'
                  });
               });
            });
         }
         //check for additional permissions
      }
      if (dbUser.role == 'user') {
         User.update({
            username: request.updatedUser.username,
            role: 'user',
            deleted: false,
            status: 'active'
         }, {
            $set: {
               image: request.updatedUser.image
            }
         }, function (err, dbUpdatedUser) {
            if (err) logger.error(err);
            socket.emit('update-user-success', {
               message: 'User record updated successfully.'
            });
            Bet.update({
               username: request.updatedUser.username
            }, {
               $set: {
                  image: request.updatedUser.image
               }
            }, {
               multi: true
            }, function (err, result) {
               if (err) logger.error(err);
            });
            Session.update({
               username: request.updatedUser.username
            }, {
               $set: {
                  image: request.updatedUser.image
               }
            }, function (err, result) {
               if (err) logger.error(err);
            });
         });
      }
   });
}

module.exports.updateUserBalance = async function (io, socket, request) {
   console.log(request)
   if (!request) return;
   if (!request.details || !request.targetUser) return;

   //("updateUserBalance: " + JSON.stringify(request));
   User.findOne({
      username: request.details.username,
      hash: request.details.key
   }, {
      role: 1,
      username: 1,
      balance: 1,
   }, async function (err, dbUser) {
      if (err) logger.error(err);
      if (!dbUser) return;
      if (dbUser.role != 'admin' && dbUser.role != 'manager' && dbUser.role != 'partner' && dbUser.role != 'subadmin' && dbUser.role != 'master') return;
      if (dbUser.role == 'manager') {
         //const session = await User.startSession();
         //await session.startTransaction();
         try {
            //const opts = {
            //   session
            //};
            if (dbUser.mbalance != null) {
               User.findOne({
                  username: request.targetUser.username,
                  role: 'user',
                  deleted: false
               }, function (err, dbOldTragetUser) {


                  User.findOne({
                     username: dbUser.username,
                     role: 'manager',
                     deleted: false
                  }, async function (err, mnaagerBalaance) {
                     if (!mnaagerBalaance) return;
                     if (request.targetUser.action == 'DEPOSIT') {
                        var balance = dbOldTragetUser.balance + request.targetUser.amount;
                        var limit = dbOldTragetUser.limit + request.targetUser.amount;
                        var mbalance = mnaagerBalaance.limit - request.targetUser.amount;
                        if (balance == request.targetUser.balance && limit == request.targetUser.limit) {

                        } else {

                           socket.emit("update-user-balance-error", {
                              message: "Unexpected error occur please try again.!"
                           });
                           return;

                        }


                     } else if (request.targetUser.action == 'WITHDRAW') {

                        if (request.targetUser.amount > dbOldTragetUser.limit - dbOldTragetUser.exposure) {
                           socket.emit("update-user-balance-error", {
                              message: "Unexpected error occur please try again.!"
                           });
                           return;
                        }


                        var balance = dbOldTragetUser.balance - request.targetUser.amount;
                        var limit = dbOldTragetUser.limit - request.targetUser.amount;
                        var mbalance = mnaagerBalaance.limit + request.targetUser.amount;
                        if (balance == request.targetUser.balance && limit == request.targetUser.limit) {

                        } else {
                           socket.emit("update-user-balance-error", {
                              message: "Unexpected error occur please try again.!"
                           });
                           return;

                        }
                     } else {
                        socket.emit("update-user-balance-error", {
                           message: "Update your app please contact upline."
                        });
                        return;
                     }
                     if (err) logger.error(err);
                     socket.emit("update-user-balance-error", {
                        message: "Balance " + request.targetUser.action + " successfully.!"
                     });
                     await User.updateOne({
                        username: request.targetUser.username,
                        role: 'user',
                        deleted: false
                     }, {
                        $set: {
                           limit: limit,
                           balance: balance
                        },

                     }, async function (err, raw) {
                        if (err) logger.error(err);

                        socket.emit("update-user-balance-success", request.targetUser);
                        //log start
                        /* const sessionadmin = await User.startSession();
                         sessionadmin.startTransaction();
 
                         const optks = {
                            sessionadmin
                         };*/

                        await User.updateOne({
                           username: request.details.username,
                           role: 'manager',
                           deleted: false
                        }, {
                           $set: {
                              limit: mbalance,
                              balance: mbalance
                           },

                        }, function (err, raw1) {
                           if (err) logger.error(err);
                           //update part
                           //update manager balance after deposit
                           User.find({
                              manager: request.details.username,
                              role: 'partner',
                              deleted: false
                           }, function (err, mpartner) {
                              for (var i = 0; i < mpartner.length; i++) {
                                 User.update({
                                    username: mpartner[i].username,
                                    role: 'partner',
                                    deleted: false
                                 }, {
                                    $set: {
                                       limit: mbalance
                                    }
                                 }, function (err, raw) {

                                 });

                              }

                           });

                           var today = new Date();
                           if (today.getDate() <= 9) {
                              var acdate = '0' + today.getDate();
                           }
                           else {
                              var acdate = today.getDate();
                           }

                           if ((today.getMonth() + 1) <= 9) {
                              var acmonth = '0' + (today.getMonth() + 1);
                           }
                           else {
                              var acmonth = (today.getMonth() + 1);
                           }

                           var date = today.getFullYear() + '-' + acmonth + '-' + acdate;

                           //end

                           var log = new Log();
                           log.createdAt = date;
                           log.username = dbOldTragetUser.username;
                           log.action = 'BALANCE';
                           if (dbOldTragetUser.limit < request.targetUser.limit) {
                              log.subAction = 'BALANCE_DEPOSIT';
                              log.actionBy = "deposit by  " + dbUser.username;

                           } else {
                              log.subAction = 'BALANCE_WITHDRAWL';
                              log.actionBy = "withdraw by  " + dbUser.username;
                           }
                           log.mnewLimit = mbalance;
                           log.amount = request.targetUser.amount;
                           log.oldLimit = dbOldTragetUser.limit;
                           log.newLimit = request.targetUser.limit;
                           log.description = request.targetUser.username + ' Balance updated. Old Limit: ' + dbOldTragetUser.limit + '. New Limit: ' + request.targetUser.limit;
                           log.manager = dbUser.username;
                           log.remark = request.targetUser.remark;
                           log.relation = dbUser.username;
                           log.time = new Date();
                           log.deleted = false;
                           //console.log(log);
                           log.save(function (err) {
                              if (err) {
                                 logger.error('update-user-balance-error: Log entry failed.');
                              }
                           });

                           User.findOne({
                              username: request.details.username,
                              role: 'manager',
                              deleted: false
                           }, function (err, dbmanager) {
                              socket.emit("update-manager-balance-success", dbmanager);

                              var logm = new Log();
                              logm.createdAt = date;
                              logm.username = dbmanager.username;
                              logm.action = 'BALANCE';
                              if (log.subAction == 'BALANCE_WITHDRAWL') {
                                 logm.subAction = 'BALANCE_DEPOSIT';
                                 logm.actionBy = "withdraw from  " + request.targetUser.username;
                                 var newlimitm = dbmanager.limit - request.targetUser.amount;
                              } else {
                                 logm.subAction = 'BALANCE_WITHDRAWL';
                                 var newlimitm = dbmanager.limit + request.targetUser.amount;
                                 logm.actionBy = "deposit to  " + request.targetUser.username;
                              }
                              logm.mnewLimit = mbalance;
                              logm.amount = request.targetUser.amount;
                              logm.oldLimit = newlimitm;
                              logm.newLimit = dbmanager.limit;
                              logm.description = request.targetUser.username + ' Balance updated. Old Limit: ' + newlimitm + '. New Limit: ' + dbmanager.limit;
                              logm.manager = dbUser.username;
                              logm.remark = request.targetUser.remark;
                              logm.relation = dbUser.username;
                              logm.time = new Date();
                              logm.deleted = false;
                              console.log(logm);
                              logm.save(function (err) {
                                 if (err) {
                                    logger.error('update-user-balance-error: Log entry failed.');
                                 }
                              });
                           });

                        });


                        //log end
                     });
                  });
               });
            }
            /*await session.commitTransaction();
            await session.endSession();
            await sessionadmin.commitTransaction();
            sessionadmin.endSession();
            return true;*/

         } catch (e) {
            /*await session.abortTransaction();
            await session.endSession();
            await sessionadmin.abortTransaction();
            sessionadmin.endSession();
            throw error;*/

         }

      }
      if (dbUser.role == 'partner') {
         if (request.targetUser.mbalance != null) {
            User.findOne({
               username: request.targetUser.username,
               role: 'user',
               deleted: false
            }, function (err, dbOldTragetUser) {
               User.findOne({
                  username: dbUser.username,
                  role: 'partner',
                  deleted: false
               }, function (err, mnaagerBalaance) {
                  if (request.targetUser.action == 'DEPOSIT') {
                     var balance = dbOldTragetUser.balance + request.targetUser.amount;
                     var limit = dbOldTragetUser.limit + request.targetUser.amount;
                     var mbalance = mnaagerBalaance.limit - request.targetUser.amount;
                     if (balance == request.targetUser.balance && limit == request.targetUser.limit) {

                     } else {
                        socket.emit("update-user-balance-error", {
                           message: "Unexpected error occur please try again.!"
                        });
                        return;

                     }


                  } else if (request.targetUser.action == 'WITHDRAW') {
                     if (request.targetUser.amount > dbOldTragetUser.limit - dbOldTragetUser.exposure) {
                        socket.emit("update-user-balance-error", {
                           message: "Unexpected error occur please try again.!"
                        });
                        return;
                     }
                     var balance = dbOldTragetUser.balance - request.targetUser.amount;
                     var limit = dbOldTragetUser.limit - request.targetUser.amount;
                     var mbalance = mnaagerBalaance.limit + request.targetUser.amount;
                     if (balance == request.targetUser.balance && limit == request.targetUser.limit) {

                     } else {
                        socket.emit("update-user-balance-error", {
                           message: "Unexpected error occur please try again.!"
                        });
                        return;

                     }
                  } else {
                     socket.emit("update-user-balance-error", {
                        message: "Update your app please contact upline."
                     });
                     return;
                  }

                  //socket.emit("update-user-balance-error-success", {message:"Balance "+request.targetUser.action+" successfully.!"});
                  if (err) logger.error(err);
                  User.update({
                     username: request.targetUser.username,
                     role: 'user',
                     deleted: false
                  }, {
                     $set: {
                        limit: limit,
                        balance: balance
                     }
                  }, function (err, raw) {
                     if (err) logger.error(err);

                     //socket.emit("update-user-balance-success", request.targetUser);
                     //log start


                     User.update({
                        username: request.details.manager,
                        role: 'manager',
                        deleted: false
                     }, {
                        $set: {
                           limit: mbalance
                        }
                     }, function (err, raw1) {
                        //console.log(request.user.details.manager);
                        //console.log(request.targetUser.mbalance);

                        if (err) logger.error(err);
                        //update part
                        //update manager balance after deposit
                        User.find({
                           manager: request.details.manager,
                           role: 'partner',
                           deleted: false
                        }, function (err, mpartner) {
                           for (var i = 0; i < mpartner.length; i++) {
                              User.update({
                                 username: mpartner[i].username,
                                 role: 'partner',
                                 deleted: false
                              }, {
                                 $set: {
                                    limit: mbalance
                                 }
                              }, function (err, raw) {
                                 console.log(raw);
                              });

                           }

                        });

                        //end

                        User.findOne({
                           username: request.details.username,
                           role: 'partner',
                           deleted: false
                        }, function (err, dbmanager) {
                           //socket.emit("update-manager-balance-success",dbmanager);
                        });


                     });

                     var today = new Date();
                     if (today.getDate() <= 9) {
                        var acdate = '0' + today.getDate();
                     }
                     else {
                        var acdate = today.getDate();
                     }

                     if ((today.getMonth() + 1) <= 9) {
                        var acmonth = '0' + (today.getMonth() + 1);
                     }
                     else {
                        var acmonth = (today.getMonth() + 1);
                     }

                     var date = today.getFullYear() + '-' + acmonth + '-' + acdate;
                     var log = new Log();
                     log.createdAt = date;
                     log.username = dbOldTragetUser.username;
                     log.action = 'BALANCE';
                     if (dbOldTragetUser.limit < request.targetUser.limit) {
                        log.subAction = 'BALANCE_DEPOSIT';
                     } else {
                        log.subAction = 'BALANCE_WITHDRAWL';
                     }
                     log.amount = dbUser.mbalance;
                     log.mnewLimit = dbUser.mbalance;
                     log.oldLimit = dbOldTragetUser.limit;
                     log.newLimit = request.targetUser.limit;
                     log.description = 'Balance updated. Old Limit: ' + dbOldTragetUser.limit + '. New Limit: ' + request.targetUser.limit;
                     log.manager = dbUser.username;
                     log.relation = request.details.manager;
                     log.time = new Date();
                     log.deleted = false;
                     // console.log(log);
                     log.save(function (err) {
                        if (err) {
                           logger.error('update-user-balance-error: Log entry failed.');
                        }
                     });
                     //log end
                  });
               });
            });
         }
      }

      if (dbUser.role == 'subadmin') {
         /*  const session = await User.startSession();
           await session.startTransaction();*/
         try {
            /* const opts = {
                session
             };*/
            if (request.targetUser.mbalance != null) {
               User.findOne({
                  username: request.targetUser.username,
                  role: 'master',
                  deleted: false
               }, function (err, dbOldTragetUser) {


                  User.findOne({
                     username: dbUser.username,
                     role: 'subadmin',
                     deleted: false
                  }, async function (err, mnaagerBalaance) {
                     if (request.targetUser.action == 'DEPOSIT') {
                        if (request.targetUser.amount > mnaagerBalaance.limit) {
                           socket.emit("update-user-balance-error", {
                              message: "balance low!"
                           });
                           return;
                        }
                        var limit = dbOldTragetUser.limit + request.targetUser.amount;


                        var mbalance = mnaagerBalaance.limit - request.targetUser.amount;
                        if (limit == request.targetUser.limit) {

                        } else {

                           socket.emit("update-user-balance-error", {
                              message: "Unexpected error occur please try again.!"
                           });
                           return;

                        }


                     } else if (request.targetUser.action == 'WITHDRAW') {
                        if (request.targetUser.amount > dbOldTragetUser.limit) {
                           socket.emit("update-user-balance-error", {
                              message: "balance greater than amount!"
                           });
                           return;
                        }
                        if (request.targetUser.amount > dbOldTragetUser.limit - dbOldTragetUser.exposure) {
                           socket.emit("update-user-balance-error", {
                              message: "Unexpected error occur please try again.!"
                           });
                           return;
                        }


                        var balance = dbOldTragetUser.balance - request.targetUser.amount;
                        var limit = dbOldTragetUser.limit - request.targetUser.amount;
                        var mbalance = mnaagerBalaance.limit + request.targetUser.amount;
                        if (limit == request.targetUser.limit) {

                        } else {
                           socket.emit("update-user-balance-error", {
                              message: "Unexpected error occur please try again.!"
                           });
                           return;

                        }
                     } else {
                        socket.emit("update-user-balance-error", {
                           message: "Update your app please contact upline."
                        });
                        return;
                     }
                     if (err) logger.error(err);
                     socket.emit("update-user-balance-error", {
                        message: "Balance " + request.targetUser.action + " successfully.!"
                     });
                     await User.updateOne({
                        username: request.targetUser.username,
                        role: 'master',
                        deleted: false
                     }, {
                        $set: {
                           limit: limit,
                           balance: limit,
                        },

                     }, async function (err, raw) {
                        if (err) logger.error(err);

                        socket.emit("update-user-balance-success", request.targetUser);
                        //log start
                        /* const sessionadmin = await User.startSession();
                         sessionadmin.startTransaction();
 
                         const optks = {
                            sessionadmin
                         };*/

                        await User.updateOne({
                           username: request.details.username,
                           role: 'subadmin',
                           deleted: false
                        }, {
                           $set: {
                              limit: mbalance,
                              balance: mbalance
                           },

                        }, function (err, raw1) {
                           if (err) logger.error(err);


                           User.findOne({
                              username: request.details.username,
                              role: 'subadmin',
                              deleted: false
                           }, function (err, dbmanager) {
                              socket.emit("update-manager-balance-success", dbmanager);
                           });


                        });

                        var today = new Date();
                        if (today.getDate() <= 9) {
                           var acdate = '0' + today.getDate();
                        }
                        else {
                           var acdate = today.getDate();
                        }

                        if ((today.getMonth() + 1) <= 9) {
                           var acmonth = '0' + (today.getMonth() + 1);
                        }
                        else {
                           var acmonth = (today.getMonth() + 1);
                        }

                        var date = today.getFullYear() + '-' + acmonth + '-' + acdate;
                        var log = new Log();
                        log.createdAt = date;
                        log.username = dbOldTragetUser.username;
                        log.action = 'BALANCE';
                        if (dbOldTragetUser.limit < request.targetUser.limit) {
                           log.subAction = 'BALANCE_DEPOSIT';
                           log.actionBy = "deposit by  " + dbUser.username;
                           log.description = 'Balance Deposit from ' + mnaagerBalaance.username;
                           log.newLimit = dbOldTragetUser.limit + request.targetUser.amount;
                        } else {
                           log.subAction = 'BALANCE_WITHDRAWL';
                           log.actionBy = "withdraw by  " + dbUser.username;
                           log.description = 'Balance Withdraw t0 ' + mnaagerBalaance.username;
                           log.newLimit = dbOldTragetUser.limit - request.targetUser.amount;
                        }
                        log.amount = request.targetUser.amount;
                        log.oldLimit = dbOldTragetUser.limit;

                        log.subadmin = dbUser.username;
                        log.remark = request.targetUser.remark;
                        log.relation = dbUser.username;
                        log.time = new Date();
                        log.deleted = false;
                        //console.log(log);
                        log.save(function (err) {
                           if (err) {
                              logger.error('update-user-balance-error: Log entry failed.');
                           }
                        });


                        var logs = new Log();
                        logs.username = mnaagerBalaance.username;
                        logs.createdAt = date;
                        logs.action = 'BALANCE';
                        if (log.subAction == 'BALANCE_WITHDRAWL') {
                           logs.subAction = 'BALANCE_DEPOSIT';
                           logs.actionBy = "withdraw from  " + request.targetUser.username;
                           logs.amount = request.targetUser.amount;
                           logs.oldLimit = mnaagerBalaance.limit;
                           logs.newLimit = mnaagerBalaance.limit + request.targetUser.amount;
                           logs.description = 'Balance Withdraw from ' + dbOldTragetUser.username;

                        } else {
                           logs.subAction = 'BALANCE_WITHDRAWL';
                           logs.actionBy = "deposit to  " + request.targetUser.username;
                           logs.amount = request.targetUser.amount;
                           logs.oldLimit = mnaagerBalaance.limit;
                           logs.newLimit = mnaagerBalaance.limit - request.targetUser.amount;
                           logs.description = 'Balance Deposit to ' + dbOldTragetUser.username;

                        }
                        logs.subadmin = dbUser.username;
                        logs.remark = request.targetUser.remark;
                        logs.relation = request.targetUser.username;
                        logs.time = new Date();
                        logs.deleted = false;
                        //console.log(log);
                        logs.save(function (err) {
                           if (err) {
                              logger.error('update-user-balance-error: Log entry failed.');
                           }
                        });
                        //log end
                     });
                  });
               });
            }
            /* await session.commitTransaction();
             await session.endSession();
             await sessionadmin.commitTransaction();
             sessionadmin.endSession();
             return true;*/

         } catch (e) {
            /* await session.abortTransaction();
             await session.endSession();
             await sessionadmin.abortTransaction();
             sessionadmin.endSession();
             throw error;*/
         }


      }


      if (dbUser.role == 'master') {
         /*const session = await User.startSession();
         await session.startTransaction();*/

         try {
            /*const opts = {
               session
            };*/
            if (dbUser.mbalance != null) {
               User.findOne({
                  username: request.targetUser.username,
                  role: 'manager',
                  deleted: false
               }, function (err, dbOldTragetUser) {


                  User.findOne({
                     username: dbUser.username,
                     role: 'master',
                     deleted: false
                  }, async function (err, mnaagerBalaance) {
                     if (request.targetUser.action == 'DEPOSIT') {
                        if (request.targetUser.amount > mnaagerBalaance.limit) {
                           socket.emit("update-user-balance-error", {
                              message: "balance low!"
                           });
                           return;
                        }

                        var limit = dbOldTragetUser.limit + request.targetUser.amount;
                        var mbalance = mnaagerBalaance.limit - request.targetUser.amount;
                        if (limit == request.targetUser.limit) {

                        } else {

                           socket.emit("update-user-balance-error", {
                              message: "Unexpected error occur please try again.!"
                           });
                           return;

                        }


                     } else if (request.targetUser.action == 'WITHDRAW') {
                        if (request.targetUser.amount > dbOldTragetUser.limit) {
                           socket.emit("update-user-balance-error", {
                              message: "balance greater than amount!"
                           });
                           return;
                        }
                        if (request.targetUser.amount > dbOldTragetUser.limit - dbOldTragetUser.exposure) {
                           socket.emit("update-user-balance-error", {
                              message: "Unexpected error occur please try again.!"
                           });
                           return;
                        }


                        var limit = dbOldTragetUser.limit - request.targetUser.amount;
                        var mbalance = mnaagerBalaance.limit + request.targetUser.amount;
                        if (limit == request.targetUser.limit) {

                        } else {
                           socket.emit("update-user-balance-error", {
                              message: "Unexpected error occur please try again.!"
                           });
                           return;

                        }
                     } else {
                        socket.emit("update-user-balance-error", {
                           message: "Update your app please contact upline."
                        });
                        return;
                     }
                     if (err) logger.error(err);
                     socket.emit("update-user-balance-error", {
                        message: "Balance " + request.targetUser.action + " successfully.!"
                     });
                     await User.updateOne({
                        username: request.targetUser.username,
                        role: 'manager',
                        deleted: false
                     }, {
                        $set: {
                           limit: limit,
                           balance: limit,
                        },

                     }, async function (err, raw) {
                        if (err) logger.error(err);

                        socket.emit("update-user-balance-success", request.targetUser);
                        //log start

                        /* const sessionadmin = await User.startSession();
                         sessionadmin.startTransaction();
 
                         const optks = {
                            sessionadmin
                         };*/
                        await User.updateOne({
                           username: request.details.username,
                           role: 'master',
                           deleted: false
                        }, {
                           $set: {
                              limit: mbalance,
                              balance: mbalance
                           },

                        }, function (err, raw1) {
                           if (err) logger.error(err);


                           User.findOne({
                              username: request.details.username,
                              role: 'master',
                              deleted: false
                           }, function (err, dbmanager) {
                              socket.emit("update-manager-balance-success", dbmanager);
                           });


                        });
                        var today = new Date();
                        if (today.getDate() <= 9) {
                           var acdate = '0' + today.getDate();
                        }
                        else {
                           var acdate = today.getDate();
                        }

                        if ((today.getMonth() + 1) <= 9) {
                           var acmonth = '0' + (today.getMonth() + 1);
                        }
                        else {
                           var acmonth = (today.getMonth() + 1);
                        }

                        var date = today.getFullYear() + '-' + acmonth + '-' + acdate;


                        var log = new Log();
                        log.createdAt = date;
                        log.username = dbOldTragetUser.username;
                        log.action = 'BALANCE';
                        if (dbOldTragetUser.limit < request.targetUser.limit) {
                           log.subAction = 'BALANCE_DEPOSIT';
                           log.actionBy = "deposit by  " + dbUser.username;
                        } else {
                           log.subAction = 'BALANCE_WITHDRAWL';
                           log.actionBy = "withdraw by  " + dbUser.username;
                        }
                        log.amount = request.targetUser.amount;
                        log.oldLimit = dbOldTragetUser.limit;
                        log.newLimit = request.targetUser.limit;
                        log.description = 'Balance updated. Old Limit: ' + dbOldTragetUser.limit + '. New Limit: ' + request.targetUser.limit;
                        log.master = dbUser.username;
                        log.remark = " " + request.targetUser.remark;
                        log.relation = dbUser.username;

                        log.time = new Date();
                        log.deleted = false;
                        //console.log(log);
                        log.save(function (err) {
                           if (err) {
                              logger.error('update-user-balance-error: Log entry failed.');
                           }
                        });


                        var logs = new Log();
                        logs.username = mnaagerBalaance.username;
                        logs.createdAt = date;
                        logs.action = 'BALANCE';
                        if (log.subAction == 'BALANCE_WITHDRAWL') {
                           logs.subAction = 'BALANCE_DEPOSIT';
                           logs.actionBy = "withdraw from  " + request.targetUser.username;
                           logs.amount = request.targetUser.amount;
                           logs.oldLimit = mnaagerBalaance.limit;
                           logs.newLimit = mnaagerBalaance.limit + request.targetUser.amount;
                           logs.description = 'Balance Withdraw from ' + dbOldTragetUser.username;
                           logs.remark = " " + request.targetUser.remark;

                        } else {
                           logs.subAction = 'BALANCE_WITHDRAWL';
                           logs.actionBy = "deposit to  " + request.targetUser.username;
                           logs.amount = request.targetUser.amount;
                           logs.mnewLimit = request.targetUser.amount;
                           logs.oldLimit = mnaagerBalaance.limit;
                           logs.newLimit = mnaagerBalaance.limit - request.targetUser.amount;
                           logs.description = 'Balance Deposit to ' + dbOldTragetUser.username;

                        }
                        logs.master = dbUser.username;
                        logs.remark = request.targetUser.remark;
                        logs.relation = request.targetUser.username;
                        logs.time = new Date();
                        logs.deleted = false;
                        //console.log(log);
                        logs.save(function (err) {
                           if (err) {
                              logger.error('update-user-balance-error: Log entry failed.');
                           }
                        });
                        //log end
                     });
                  });
               });
            }
            /*await session.commitTransaction();
            await session.endSession();
            await sessionadmin.commitTransaction();
            sessionadmin.endSession();
            return true;*/

         } catch (e) {
            /* await session.abortTransaction();
             await session.endSession();
             await sessionadmin.abortTransaction();
             sessionadmin.endSession();
             throw error;*/
         }

      }


      if (dbUser.role == 'admin') {
         if (request.targetUser.role == 'subadmin') {
            /* const session = await User.startSession();
             await session.startTransaction();*/
            try {
               /* const opts = {
                   session
                };*/
               var time = new Date().getTime();
               User.findOne({
                  role: 'admin',
                  'username': 'OSGADMIN',

               }, function (err, dbAdmin) {




                  //return;
                  User.findOne({
                     username: request.targetUser.username,
                     role: 'subadmin',
                     deleted: false
                  }, async function (err, dbOldTragetUser) {
                     if (dbOldTragetUser.limit < request.targetUser.limit) {
                        if (request.targetUser.amount > dbAdmin.limit) {
                           socket.emit("update-user-balance-error-success", {
                              message: "balance low!"
                           });
                           return;
                        }
                     }

                     if (err) logger.error(err);
                     await User.updateOne({
                        username: request.targetUser.username,
                        role: 'subadmin',
                        deleted: false
                     }, {
                        $set: {
                           limit: request.targetUser.limit,
                           balance: request.targetUser.limit

                        },

                     }, async function (err, raw) {
                        console.log(raw)
                        if (err) logger.error(err);

                        //end
                        socket.emit("update-user-balance-success", {
                           message: 'balance update'
                        });
                        //log start

                        var today = new Date();
                        if (today.getDate() <= 9) {
                           var acdate = '0' + today.getDate();
                        }
                        else {
                           var acdate = today.getDate();
                        }

                        if ((today.getMonth() + 1) <= 9) {
                           var acmonth = '0' + (today.getMonth() + 1);
                        }
                        else {
                           var acmonth = (today.getMonth() + 1);
                        }

                        var date = today.getFullYear() + '-' + acmonth + '-' + acdate;
                        var log = new Log();
                        log.createdAt = date;
                        log.username = dbOldTragetUser.username;
                        log.action = 'BALANCE';
                        if (dbOldTragetUser.limit < request.targetUser.limit) {
                           log.subAction = 'BALANCE_DEPOSIT';
                           log.actionBy = "deposit by :  " + request.user.details.admin;
                        } else {
                           log.subAction = 'BALANCE_WITHDRAWL';
                           log.actionBy = "withdraw by:  " + request.user.details.admin;
                        }
                        log.amount = request.targetUser.amount;
                        log.oldLimit = dbOldTragetUser.limit;
                        log.newLimit = request.targetUser.limit;
                        log.description = 'Balance updated. Old Limit: ' + dbOldTragetUser.limit + '. New Limit: ' + request.targetUser.limit;
                        log.admin = request.user.details.admin;
                        log.time = new Date();
                        log.deleted = false;
                        // console.log(log);
                        log.save(function (err) {
                           if (err) {
                              logger.error('update-user-balance-error: Log entry failed.');
                           }
                        });

                        var oldLimit = dbAdmin.limit;
                        var logs = new Log();
                        logs.createdAt = date;
                        logs.username = 'admin';
                        logs.action = 'BALANCE';
                        logs.amount = request.targetUser.amount;
                        if (log.subAction == 'BALANCE_WITHDRAWL') {
                           logs.subAction = 'BALANCE_DEPOSIT';
                           dbAdmin.actionBy = "withdraw from :  " + request.targetUser.username;
                           dbAdmin.limit = dbAdmin.limit + request.targetUser.amount;
                           dbAdmin.balance = dbAdmin.balance + request.targetUser.amount;
                           logs.description = 'Balance withdraw from ' + dbOldTragetUser.username;
                        } else {
                           logs.subAction = 'BALANCE_WITHDRAWL';
                           dbAdmin.actionBy = "deposit to :  " + request.targetUser.username;
                           dbAdmin.limit = dbAdmin.limit - request.targetUser.amount;
                           dbAdmin.balance = dbAdmin.balance - request.targetUser.amount;

                           logs.description = 'Balance deposit to ' + dbOldTragetUser.username;

                        }
                        logs.oldLimit = oldLimit;
                        logs.newLimit = dbAdmin.limit;

                        logs.relation = request.targetUser.username;
                        logs.time = new Date();
                        logs.deleted = false;
                        // console.log(log);
                        logs.save(function (err) {
                           if (err) {
                              logger.error('update-user-balance-error: Log entry failed.');
                           }
                        });

                        /* const sessionadmin = await User.startSession();
                         sessionadmin.startTransaction();
 
                         const optks = {
                            sessionadmin
                         };*/
                        await User.updateMany({
                           'role': 'admin'
                        }, {
                           $set: {
                              limit: dbAdmin.limit,
                              balance: dbAdmin.limit
                           },
                           times: time
                        });
                        /* User.updateMany({
                            'role': 'admin'
                         }, {
                            $set: {
                               'limit': dbAdmin.limit,
                               'balance': dbAdmin.limit
                            }
                         }, function (err, raw) {
 
                         });*/
                        //log end


                        //log for admin n manager deposit

                     });
                  });
               });

               /* await session.commitTransaction();
                await session.endSession();
                await sessionadmin.commitTransaction();
                sessionadmin.endSession();
                return true;*/
            } catch (e) {
               /*await session.abortTransaction();
               await session.endSession();
               await sessionadmin.abortTransaction();
               sessionadmin.endSession();
               throw error;*/

            }

         }

      }

      if (dbUser.role == 'admin') {
         /*const session = await User.startSession();
         await session.startTransaction();*/
         try {
            /* const opts = {
                session
             };*/
            if (request.targetUser.role == 'user') {
               User.findOne({
                  role: 'manager',
                  deleted: false,
                  username: request.targetUser.manager
               }, async function (err, dbAdmin) {

                  if (request.targetUser.amount > dbAdmin.limit) {
                     socket.emit("update-user-balance-error", {
                        message: "balance low!"
                     });
                     return;
                  }
                  User.findOne({
                     username: request.targetUser.username,
                     role: 'user',
                     deleted: false
                  }, async function (err, dbOldTragetUser) {
                     if (dbOldTragetUser.limit < request.targetUser.limit) {
                        var balancelimit = dbOldTragetUser.limit + request.targetUser.amount;
                        var balanceb = dbOldTragetUser.limit + request.targetUser.amount;
                     } else {
                        var balancelimit = dbOldTragetUser.limit - request.targetUser.amount;
                        var balanceb = dbOldTragetUser.limit - request.targetUser.amount;

                     }
                     if (err) logger.error(err);
                     await User.updateOne({
                        username: request.targetUser.username,
                        role: 'user',
                        deleted: false
                     }, {
                        $set: {
                           limit: balancelimit,
                           balance: balanceb
                        },

                     }, async function (err, raw) {
                        if (err) logger.error(err);

                        //end
                        socket.emit("update-user-balance-success", {
                           message: 'balance update success'
                        });
                        //log start
                        var today = new Date();
                        if (today.getDate() <= 9) {
                           var acdate = '0' + today.getDate();
                        }
                        else {
                           var acdate = today.getDate();
                        }

                        if ((today.getMonth() + 1) <= 9) {
                           var acmonth = '0' + (today.getMonth() + 1);
                        }
                        else {
                           var acmonth = (today.getMonth() + 1);
                        }

                        var date = today.getFullYear() + '-' + acmonth + '-' + acdate;


                        var log = new Log();
                        log.createdAt = date;
                        log.username = dbOldTragetUser.username;
                        log.action = 'BALANCE';
                        if (dbOldTragetUser.limit < request.targetUser.limit) {
                           log.subAction = 'BALANCE_DEPOSIT';
                           log.actionBy = "deposit by:  " + request.targetUser.manager;
                        } else {
                           log.subAction = 'BALANCE_WITHDRAWL';
                           log.actionBy = "withdraw by:  " + request.targetUser.manager;
                        }
                        log.amount = request.targetUser.amount;
                        log.oldLimit = dbOldTragetUser.limit;
                        log.newLimit = request.targetUser.limit;
                        log.description = 'Balance updated. Old Limit: ' + dbOldTragetUser.limit + '. New Limit: ' + request.targetUser.limit;
                        log.admin = request.user.details.admin;
                        log.time = new Date();
                        log.deleted = false;
                        // console.log(log);
                        log.save(function (err) {
                           if (err) {
                              logger.error('update-user-balance-error: Log entry failed.');
                           }
                        });

                        var oldLimit = dbAdmin.limit;
                        var logs = new Log();
                        logs.username = dbAdmin.username;
                        logs.createdAt = date;
                        logs.action = 'BALANCE';
                        logs.amount = request.targetUser.amount;
                        if (log.subAction == 'BALANCE_WITHDRAWL') {
                           logs.subAction = 'BALANCE_DEPOSIT';
                           logs.actionBy = "withdraw from:  " + request.targetUser.username;
                           dbAdmin.limit = dbAdmin.limit + request.targetUser.amount;
                           dbAdmin.balance = dbAdmin.balance + request.targetUser.amount;
                           logs.description = 'Balance withdraw from ' + dbOldTragetUser.username;
                        } else {
                           logs.subAction = 'BALANCE_WITHDRAWL';
                           logs.actionBy = "depsoit to:  " + request.targetUser.username;
                           dbAdmin.limit = dbAdmin.limit - request.targetUser.amount;
                           dbAdmin.balance = dbAdmin.balance - request.targetUser.amount;

                           logs.description = 'Balance deposit to ' + dbOldTragetUser.username;

                        }
                        logs.oldLimit = oldLimit;
                        logs.newLimit = dbAdmin.limit;

                        logs.time = new Date();
                        logs.deleted = false;
                        // console.log(log);
                        logs.save(function (err) {
                           if (err) {
                              logger.error('update-user-balance-error: Log entry failed.');
                           }
                        });
                        /* const sessionadmin = await User.startSession();
                         sessionadmin.startTransaction();
 
                         const optks = {
                            sessionadmin
                         };*/

                        await User.updateOne({
                           'username': dbAdmin.username
                        }, {
                           $set: {
                              'limit': dbAdmin.limit,
                              'balance': dbAdmin.limit
                           },

                        }, function (err, raw) {

                        });
                        //log end


                        //log for admin n manager deposit
                     });
                  });
               });
            }

            /*await session.commitTransaction();
            await session.endSession();
            await sessionadmin.commitTransaction();
            sessionadmin.endSession();
            return true;*/

         } catch (e) {
            /* await session.abortTransaction();
             await session.endSession();
             await sessionadmin.abortTransaction();
             sessionadmin.endSession();
             throw error;*/
         }

      }


   });
}

module.exports.updatenasterDownlineBalance = function (io, socket, request) {
   if (!request) return;
   if (!request.user || !request.targetUser) return;
   if (!request.user.details) return;
   //("updatenasterDownlineBalance: " + JSON.stringify(request));
   User.findOne({
      _id: request.user.details._id,
      hash: request.user.key
   }, {
      role: 1,
      username: 1
   }, function (err, dbUser) {
      if (err) logger.error(err);
      if (!dbUser) return;
      if (dbUser.role != 'master') return;
      User.findOne({
         username: request.targetUser.username,
      }, {
         role: 1,
         username: 1
      }, function (err, dbRole) {
         if (!dbRole) return;
         if (dbRole.role == 'user') {
            if (request.targetUser.mbalance != null) {
               User.findOne({
                  username: request.targetUser.username,
                  role: 'user',
                  deleted: false
               }, function (err, dbOldTragetUser) {


                  User.findOne({
                     username: request.targetUser.manager,
                     role: 'manager',
                     deleted: false
                  }, function (err, mnaagerBalaance) {
                     if (request.targetUser.action == 'DEPOSIT') {
                        if (request.targetUser.amount > mnaagerBalaance.limit) {
                           socket.emit("update-user-balance-error-success", {
                              message: "balance low!"
                           });
                           return;
                        }
                        var limit = dbOldTragetUser.limit + request.targetUser.amount;


                        var mbalance = mnaagerBalaance.limit - request.targetUser.amount;
                        if (limit == request.targetUser.limit) {

                        } else {

                           socket.emit("update-user-balance-error-success", {
                              message: "Unexpected error occur please try again.!"
                           });
                           return;

                        }


                     } else if (request.targetUser.action == 'WITHDRAW') {
                        if (request.targetUser.amount > dbOldTragetUser.limit) {
                           socket.emit("update-user-balance-error-success", {
                              message: "balance greater than amount!"
                           });
                           return;
                        }
                        if (request.targetUser.amount > dbOldTragetUser.limit - dbOldTragetUser.exposure) {
                           socket.emit("update-user-balance-error-success", {
                              message: "Unexpected error occur please try again.!"
                           });
                           return;
                        }


                        var balance = dbOldTragetUser.balance - request.targetUser.amount;
                        var limit = dbOldTragetUser.limit - request.targetUser.amount;
                        var mbalance = mnaagerBalaance.limit + request.targetUser.amount;
                        if (limit == request.targetUser.limit) {

                        } else {
                           socket.emit("update-user-balance-error-success", {
                              message: "Unexpected error occur please try again.!"
                           });
                           return;

                        }
                     } else {
                        socket.emit("update-user-balance-error-success", {
                           message: "Update your app please contact upline."
                        });
                        return;
                     }
                     if (err) logger.error(err);
                     socket.emit("update-user-balance-error-success", {
                        message: "Balance " + request.targetUser.action + " successfully.!"
                     });
                     User.update({
                        username: request.targetUser.username,
                        role: 'user',
                        deleted: false
                     }, {
                        $set: {
                           limit: limit,
                           balance: balance,
                        }
                     }, function (err, raw) {
                        if (err) logger.error(err);

                        socket.emit("update-user-balance-success", request.targetUser);
                        //log start


                        User.update({
                           username: request.targetUser.manager,
                           role: 'manager',
                           deleted: false
                        }, {
                           $set: {
                              limit: mbalance,
                              balance: mbalance
                           }
                        }, function (err, raw1) {
                           if (err) logger.error(err);


                           User.findOne({
                              username: request.targetUser.manager,
                              role: 'manager',
                              deleted: false
                           }, function (err, dbmanager) {
                              socket.emit("update-manager-balance-success", dbmanager);
                           });


                        });
                        var log = new Log();
                        log.username = dbOldTragetUser.username;
                        log.action = 'BALANCE';
                        if (dbOldTragetUser.limit < request.targetUser.limit) {
                           log.subAction = 'BALANCE_DEPOSIT';
                           log.description = 'Balance Deposit from ' + mnaagerBalaance.username;
                           log.newLimit = dbOldTragetUser.limit + request.targetUser.amount;
                        } else {
                           log.subAction = 'BALANCE_WITHDRAWL';
                           log.description = 'Balance Withdraw t0 ' + mnaagerBalaance.username;
                           log.newLimit = dbOldTragetUser.limit - request.targetUser.amount;
                        }
                        log.amount = request.targetUser.amount;
                        log.oldLimit = dbOldTragetUser.limit;

                        log.manager = request.targetUser.manager;
                        log.remark = request.targetUser.remark;
                        log.relation = request.targetUser.manager;
                        log.time = new Date();
                        log.deleted = false;
                        //console.log(log);
                        log.save(function (err) {
                           if (err) {
                              logger.error('update-user-balance-error: Log entry failed.');
                           }
                        });


                        var logs = new Log();
                        logs.username = mnaagerBalaance.username;
                        logs.action = 'BALANCE';
                        if (log.subAction == 'BALANCE_WITHDRAWL') {
                           logs.subAction = 'BALANCE_DEPOSIT';
                           logs.amount = request.targetUser.amount;
                           logs.oldLimit = mnaagerBalaance.limit;
                           logs.newLimit = mnaagerBalaance.limit + request.targetUser.amount;
                           logs.description = 'Balance Withdraw from ' + dbOldTragetUser.username;

                        } else {
                           logs.subAction = 'BALANCE_WITHDRAWL';
                           logs.amount = request.targetUser.amount;
                           logs.oldLimit = mnaagerBalaance.limit;
                           logs.newLimit = mnaagerBalaance.limit - request.targetUser.amount;
                           logs.description = 'Balance Deposit to ' + dbOldTragetUser.username;

                        }
                        //logs.subadmin = dbUser.username;
                        logs.remark = request.targetUser.remark;
                        logs.relation = request.targetUser.username;
                        logs.time = new Date();
                        logs.deleted = false;
                        //console.log(log);
                        logs.save(function (err) {
                           if (err) {
                              logger.error('update-user-balance-error: Log entry failed.');
                           }
                        });
                        //log end
                     });
                  });
               });
            }

         }
      });

   });
}

module.exports.updatesubadminDownlineBalance = function (io, socket, request) {
   if (!request) return;
   if (!request.user || !request.targetUser) return;
   if (!request.user.details) return;
   //("updatesubadminDownlineBalance: " + JSON.stringify(request));
   User.findOne({
      _id: request.user.details._id,
      hash: request.user.key
   }, {
      role: 1,
      username: 1
   }, function (err, dbUser) {
      if (err) logger.error(err);
      if (!dbUser) return;
      if (dbUser.role != 'subadmin') return;
      User.findOne({
         username: request.targetUser.username,
      }, {
         role: 1,
         username: 1
      }, function (err, dbRole) {
         if (!dbRole) return;


         if (dbRole.role == 'manager') {
            if (request.targetUser.mbalance != null) {
               User.findOne({
                  username: request.targetUser.username,
                  role: 'manager',
                  deleted: false
               }, function (err, dbOldTragetUser) {


                  User.findOne({
                     username: request.targetUser.master,
                     role: 'master',
                     deleted: false
                  }, function (err, mnaagerBalaance) {
                     if (request.targetUser.action == 'DEPOSIT') {
                        if (request.targetUser.amount > mnaagerBalaance.limit) {
                           socket.emit("update-user-balance-error-success", {
                              message: "balance low!"
                           });
                           return;
                        }
                        var limit = dbOldTragetUser.limit + request.targetUser.amount;


                        var mbalance = mnaagerBalaance.limit - request.targetUser.amount;
                        if (limit == request.targetUser.limit) {

                        } else {

                           socket.emit("update-user-balance-error-success", {
                              message: "Unexpected error occur please try again.!"
                           });
                           return;

                        }


                     } else if (request.targetUser.action == 'WITHDRAW') {
                        if (request.targetUser.amount > dbOldTragetUser.limit) {
                           socket.emit("update-user-balance-error-success", {
                              message: "balance greater than amount!"
                           });
                           return;
                        }
                        if (request.targetUser.amount > dbOldTragetUser.limit - dbOldTragetUser.exposure) {
                           socket.emit("update-user-balance-error-success", {
                              message: "Unexpected error occur please try again.!"
                           });
                           return;
                        }


                        var balance = dbOldTragetUser.balance - request.targetUser.amount;
                        var limit = dbOldTragetUser.limit - request.targetUser.amount;
                        var mbalance = mnaagerBalaance.limit + request.targetUser.amount;
                        if (limit == request.targetUser.limit) {

                        } else {
                           socket.emit("update-user-balance-error-success", {
                              message: "Unexpected error occur please try again.!"
                           });
                           return;

                        }
                     } else {
                        socket.emit("update-user-balance-error-success", {
                           message: "Update your app please contact upline."
                        });
                        return;
                     }
                     if (err) logger.error(err);
                     socket.emit("update-user-balance-error-success", {
                        message: "Balance " + request.targetUser.action + " successfully.!"
                     });
                     User.update({
                        username: request.targetUser.username,
                        role: 'manager',
                        deleted: false
                     }, {
                        $set: {
                           limit: limit,
                           balance: limit,
                        }
                     }, function (err, raw) {
                        if (err) logger.error(err);

                        socket.emit("update-user-balance-success", request.targetUser);
                        //log start


                        User.update({
                           username: request.targetUser.master,
                           role: 'master',
                           deleted: false
                        }, {
                           $set: {
                              limit: mbalance,
                              balance: mbalance
                           }
                        }, function (err, raw1) {
                           if (err) logger.error(err);


                           User.findOne({
                              username: request.targetUser.master,
                              role: 'master',
                              deleted: false
                           }, function (err, dbmanager) {
                              socket.emit("update-manager-balance-success", dbmanager);
                           });


                        });
                        var log = new Log();
                        log.username = dbOldTragetUser.username;
                        log.action = 'BALANCE';
                        if (dbOldTragetUser.limit < request.targetUser.limit) {
                           log.subAction = 'BALANCE_DEPOSIT';
                           log.description = 'Balance Deposit from ' + mnaagerBalaance.username;
                           log.newLimit = dbOldTragetUser.limit + request.targetUser.amount;
                        } else {
                           log.subAction = 'BALANCE_WITHDRAWL';
                           log.description = 'Balance Withdraw t0 ' + mnaagerBalaance.username;
                           log.newLimit = dbOldTragetUser.limit - request.targetUser.amount;
                        }
                        log.amount = request.targetUser.amount;
                        log.oldLimit = dbOldTragetUser.limit;

                        log.master = request.targetUser.master;
                        log.remark = request.targetUser.remark;
                        log.relation = request.targetUser.master;
                        log.time = new Date();
                        log.deleted = false;
                        //console.log(log);
                        log.save(function (err) {
                           if (err) {
                              logger.error('update-user-balance-error: Log entry failed.');
                           }
                        });


                        var logs = new Log();
                        logs.username = mnaagerBalaance.username;
                        logs.action = 'BALANCE';
                        if (log.subAction == 'BALANCE_WITHDRAWL') {
                           logs.subAction = 'BALANCE_DEPOSIT';
                           logs.amount = request.targetUser.amount;
                           logs.oldLimit = mnaagerBalaance.limit;
                           logs.newLimit = mnaagerBalaance.limit + request.targetUser.amount;
                           logs.description = 'Balance Withdraw from ' + dbOldTragetUser.username;

                        } else {
                           logs.subAction = 'BALANCE_WITHDRAWL';
                           logs.amount = request.targetUser.amount;
                           logs.oldLimit = mnaagerBalaance.limit;
                           logs.newLimit = mnaagerBalaance.limit - request.targetUser.amount;
                           logs.description = 'Balance Deposit to ' + dbOldTragetUser.username;

                        }
                        //logs.subadmin = dbUser.username;
                        logs.remark = request.targetUser.remark;
                        logs.relation = request.targetUser.username;
                        logs.time = new Date();
                        logs.deleted = false;
                        //console.log(log);
                        logs.save(function (err) {
                           if (err) {
                              logger.error('update-user-balance-error: Log entry failed.');
                           }
                        });
                        //log end
                     });
                  });
               });
            }

         }


         if (dbRole.role == 'user') {
            if (request.targetUser.mbalance != null) {
               User.findOne({
                  username: request.targetUser.username,
                  role: 'user',
                  deleted: false
               }, function (err, dbOldTragetUser) {


                  User.findOne({
                     username: request.targetUser.manager,
                     role: 'manager',
                     deleted: false
                  }, function (err, mnaagerBalaance) {
                     if (request.targetUser.action == 'DEPOSIT') {
                        if (request.targetUser.amount > mnaagerBalaance.limit) {
                           socket.emit("update-user-balance-error-success", {
                              message: "balance low!"
                           });
                           return;
                        }
                        var limit = dbOldTragetUser.limit + request.targetUser.amount;


                        var mbalance = mnaagerBalaance.limit - request.targetUser.amount;
                        if (limit == request.targetUser.limit) {

                        } else {

                           socket.emit("update-user-balance-error-success", {
                              message: "Unexpected error occur please try again.!"
                           });
                           return;

                        }


                     } else if (request.targetUser.action == 'WITHDRAW') {
                        if (request.targetUser.amount > dbOldTragetUser.limit) {
                           socket.emit("update-user-balance-error-success", {
                              message: "balance greater than amount!"
                           });
                           return;
                        }
                        if (request.targetUser.amount > dbOldTragetUser.limit - dbOldTragetUser.exposure) {
                           socket.emit("update-user-balance-error-success", {
                              message: "Unexpected error occur please try again.!"
                           });
                           return;
                        }


                        var balance = dbOldTragetUser.balance - request.targetUser.amount;
                        var limit = dbOldTragetUser.limit - request.targetUser.amount;
                        var mbalance = mnaagerBalaance.limit + request.targetUser.amount;
                        if (limit == request.targetUser.limit) {

                        } else {
                           socket.emit("update-user-balance-error-success", {
                              message: "Unexpected error occur please try again.!"
                           });
                           return;

                        }
                     } else {
                        socket.emit("update-user-balance-error-success", {
                           message: "Update your app please contact upline."
                        });
                        return;
                     }
                     if (err) logger.error(err);
                     socket.emit("update-user-balance-error-success", {
                        message: "Balance " + request.targetUser.action + " successfully.!"
                     });
                     User.update({
                        username: request.targetUser.username,
                        role: 'user',
                        deleted: false
                     }, {
                        $set: {
                           limit: limit,
                           balance: balance,
                        }
                     }, function (err, raw) {
                        if (err) logger.error(err);

                        socket.emit("update-user-balance-success", request.targetUser);
                        //log start


                        User.update({
                           username: request.targetUser.manager,
                           role: 'manager',
                           deleted: false
                        }, {
                           $set: {
                              limit: mbalance,
                              balance: mbalance
                           }
                        }, function (err, raw1) {
                           if (err) logger.error(err);


                           User.findOne({
                              username: request.targetUser.manager,
                              role: 'manager',
                              deleted: false
                           }, function (err, dbmanager) {
                              socket.emit("update-manager-balance-success", dbmanager);
                           });


                        });
                        var log = new Log();
                        log.username = dbOldTragetUser.username;
                        log.action = 'BALANCE';
                        if (dbOldTragetUser.limit < request.targetUser.limit) {
                           log.subAction = 'BALANCE_DEPOSIT';
                           log.description = 'Balance Deposit from ' + mnaagerBalaance.username;
                           log.newLimit = dbOldTragetUser.limit + request.targetUser.amount;
                        } else {
                           log.subAction = 'BALANCE_WITHDRAWL';
                           log.description = 'Balance Withdraw t0 ' + mnaagerBalaance.username;
                           log.newLimit = dbOldTragetUser.limit - request.targetUser.amount;
                        }
                        log.amount = request.targetUser.amount;
                        log.oldLimit = dbOldTragetUser.limit;

                        log.manager = request.targetUser.manager;
                        log.remark = request.targetUser.remark;
                        log.relation = request.targetUser.manager;
                        log.time = new Date();
                        log.deleted = false;
                        //console.log(log);
                        log.save(function (err) {
                           if (err) {
                              logger.error('update-user-balance-error: Log entry failed.');
                           }
                        });


                        var logs = new Log();
                        logs.username = mnaagerBalaance.username;
                        logs.action = 'BALANCE';
                        if (log.subAction == 'BALANCE_WITHDRAWL') {
                           logs.subAction = 'BALANCE_DEPOSIT';
                           logs.amount = request.targetUser.amount;
                           logs.oldLimit = mnaagerBalaance.limit;
                           logs.newLimit = mnaagerBalaance.limit + request.targetUser.amount;
                           logs.description = 'Balance Withdraw from ' + dbOldTragetUser.username;

                        } else {
                           logs.subAction = 'BALANCE_WITHDRAWL';
                           logs.amount = request.targetUser.amount;
                           logs.oldLimit = mnaagerBalaance.limit;
                           logs.newLimit = mnaagerBalaance.limit - request.targetUser.amount;
                           logs.description = 'Balance Deposit to ' + dbOldTragetUser.username;

                        }
                        //logs.subadmin = dbUser.username;
                        logs.remark = request.targetUser.remark;
                        logs.relation = request.targetUser.username;
                        logs.time = new Date();
                        logs.deleted = false;
                        //console.log(log);
                        logs.save(function (err) {
                           if (err) {
                              logger.error('update-user-balance-error: Log entry failed.');
                           }
                        });
                        //log end
                     });
                  });
               });
            }

         }
      });

   });
}

module.exports.updateDownlineBalance = function (io, socket, request) {
   if (!request) return;
   if (!request.user || !request.targetUser) return;
   if (!request.user.details) return;
   //("updateDownlineBalance: " + JSON.stringify(request));
   User.findOne({
      _id: request.user.details._id,
      hash: request.user.key
   }, {
      role: 1,
      username: 1
   }, function (err, dbUser) {
      if (err) logger.error(err);
      if (!dbUser) return;
      if (dbUser.role != 'admin') return;
      User.findOne({
         username: request.targetUser.username,
      }, {
         role: 1,
         username: 1
      }, function (err, dbRole) {
         if (!dbRole) return;

         if (dbRole.role == 'master') {
            if (request.targetUser.mbalance != null) {
               User.findOne({
                  username: request.targetUser.username,
                  role: 'master',
                  deleted: false
               }, function (err, dbOldTragetUser) {


                  User.findOne({
                     username: request.targetUser.subadmin,
                     role: 'subadmin',
                     deleted: false
                  }, function (err, mnaagerBalaance) {
                     if (request.targetUser.action == 'DEPOSIT') {
                        if (request.targetUser.amount > mnaagerBalaance.limit) {
                           socket.emit("update-user-balance-error-success", {
                              message: "balance low!"
                           });
                           return;
                        }
                        var limit = dbOldTragetUser.limit + request.targetUser.amount;


                        var mbalance = mnaagerBalaance.limit - request.targetUser.amount;
                        if (limit == request.targetUser.limit) {

                        } else {

                           socket.emit("update-user-balance-error-success", {
                              message: "Unexpected error occur please try again.!"
                           });
                           return;

                        }


                     } else if (request.targetUser.action == 'WITHDRAW') {
                        if (request.targetUser.amount > dbOldTragetUser.limit) {
                           socket.emit("update-user-balance-error-success", {
                              message: "balance greater than amount!"
                           });
                           return;
                        }
                        if (request.targetUser.amount > dbOldTragetUser.limit - dbOldTragetUser.exposure) {
                           socket.emit("update-user-balance-error-success", {
                              message: "Unexpected error occur please try again.!"
                           });
                           return;
                        }


                        var balance = dbOldTragetUser.balance - request.targetUser.amount;
                        var limit = dbOldTragetUser.limit - request.targetUser.amount;
                        var mbalance = mnaagerBalaance.limit + request.targetUser.amount;
                        if (limit == request.targetUser.limit) {

                        } else {
                           socket.emit("update-user-balance-error-success", {
                              message: "Unexpected error occur please try again.!"
                           });
                           return;

                        }
                     } else {
                        socket.emit("update-user-balance-error-success", {
                           message: "Update your app please contact upline."
                        });
                        return;
                     }
                     if (err) logger.error(err);
                     socket.emit("update-user-balance-error-success", {
                        message: "Balance " + request.targetUser.action + " successfully.!"
                     });
                     User.update({
                        username: request.targetUser.username,
                        role: 'master',
                        deleted: false
                     }, {
                        $set: {
                           limit: limit,
                           balance: limit,
                        }
                     }, function (err, raw) {
                        if (err) logger.error(err);

                        socket.emit("update-user-balance-success", request.targetUser);
                        //log start


                        User.update({
                           username: request.targetUser.subadmin,
                           role: 'subadmin',
                           deleted: false
                        }, {
                           $set: {
                              limit: mbalance,
                              balance: mbalance
                           }
                        }, function (err, raw1) {
                           if (err) logger.error(err);


                           User.findOne({
                              username: request.targetUser.subadmin,
                              role: 'subadmin',
                              deleted: false
                           }, function (err, dbmanager) {
                              socket.emit("update-manager-balance-success", dbmanager);
                           });


                        });
                        var log = new Log();
                        log.username = dbOldTragetUser.username;
                        log.action = 'BALANCE';
                        if (dbOldTragetUser.limit < request.targetUser.limit) {
                           log.subAction = 'BALANCE_DEPOSIT';
                           log.description = 'Balance Deposit from ' + mnaagerBalaance.username;
                           log.newLimit = dbOldTragetUser.limit + request.targetUser.amount;
                        } else {
                           log.subAction = 'BALANCE_WITHDRAWL';
                           log.description = 'Balance Withdraw t0 ' + mnaagerBalaance.username;
                           log.newLimit = dbOldTragetUser.limit - request.targetUser.amount;
                        }
                        log.amount = request.targetUser.amount;
                        log.oldLimit = dbOldTragetUser.limit;

                        log.subadmin = dbUser.username;
                        log.remark = request.targetUser.remark;
                        log.relation = request.targetUser.subadmin;
                        log.time = new Date();
                        log.deleted = false;
                        //console.log(log);
                        log.save(function (err) {
                           if (err) {
                              logger.error('update-user-balance-error: Log entry failed.');
                           }
                        });


                        var logs = new Log();
                        logs.username = mnaagerBalaance.username;
                        logs.action = 'BALANCE';
                        if (log.subAction == 'BALANCE_WITHDRAWL') {
                           logs.subAction = 'BALANCE_DEPOSIT';
                           logs.amount = request.targetUser.amount;
                           logs.oldLimit = mnaagerBalaance.limit;
                           logs.newLimit = mnaagerBalaance.limit + request.targetUser.amount;
                           logs.description = 'Balance Withdraw from ' + dbOldTragetUser.username;

                        } else {
                           logs.subAction = 'BALANCE_WITHDRAWL';
                           logs.amount = request.targetUser.amount;
                           logs.oldLimit = mnaagerBalaance.limit;
                           logs.newLimit = mnaagerBalaance.limit - request.targetUser.amount;
                           logs.description = 'Balance Deposit to ' + dbOldTragetUser.username;

                        }
                        //logs.subadmin = dbUser.username;
                        logs.remark = request.targetUser.remark;
                        logs.relation = request.targetUser.username;
                        logs.time = new Date();
                        logs.deleted = false;
                        //console.log(log);
                        logs.save(function (err) {
                           if (err) {
                              logger.error('update-user-balance-error: Log entry failed.');
                           }
                        });
                        //log end
                     });
                  });
               });
            }

         }


         if (dbRole.role == 'manager') {
            if (request.targetUser.mbalance != null) {
               User.findOne({
                  username: request.targetUser.username,
                  role: 'manager',
                  deleted: false
               }, function (err, dbOldTragetUser) {


                  User.findOne({
                     username: request.targetUser.master,
                     role: 'master',
                     deleted: false
                  }, function (err, mnaagerBalaance) {
                     if (request.targetUser.action == 'DEPOSIT') {
                        if (request.targetUser.amount > mnaagerBalaance.limit) {
                           socket.emit("update-user-balance-error-success", {
                              message: "balance low!"
                           });
                           return;
                        }
                        var limit = dbOldTragetUser.limit + request.targetUser.amount;


                        var mbalance = mnaagerBalaance.limit - request.targetUser.amount;
                        if (limit == request.targetUser.limit) {

                        } else {

                           socket.emit("update-user-balance-error-success", {
                              message: "Unexpected error occur please try again.!"
                           });
                           return;

                        }


                     } else if (request.targetUser.action == 'WITHDRAW') {
                        if (request.targetUser.amount > dbOldTragetUser.limit) {
                           socket.emit("update-user-balance-error-success", {
                              message: "balance greater than amount!"
                           });
                           return;
                        }
                        if (request.targetUser.amount > dbOldTragetUser.limit - dbOldTragetUser.exposure) {
                           socket.emit("update-user-balance-error-success", {
                              message: "Unexpected error occur please try again.!"
                           });
                           return;
                        }


                        var balance = dbOldTragetUser.balance - request.targetUser.amount;
                        var limit = dbOldTragetUser.limit - request.targetUser.amount;
                        var mbalance = mnaagerBalaance.limit + request.targetUser.amount;
                        if (limit == request.targetUser.limit) {

                        } else {
                           socket.emit("update-user-balance-error-success", {
                              message: "Unexpected error occur please try again.!"
                           });
                           return;

                        }
                     } else {
                        socket.emit("update-user-balance-error-success", {
                           message: "Update your app please contact upline."
                        });
                        return;
                     }
                     if (err) logger.error(err);
                     socket.emit("update-user-balance-error-success", {
                        message: "Balance " + request.targetUser.action + " successfully.!"
                     });
                     User.update({
                        username: request.targetUser.username,
                        role: 'manager',
                        deleted: false
                     }, {
                        $set: {
                           limit: limit,
                           balance: limit,
                        }
                     }, function (err, raw) {
                        if (err) logger.error(err);

                        socket.emit("update-user-balance-success", request.targetUser);
                        //log start


                        User.update({
                           username: request.targetUser.master,
                           role: 'master',
                           deleted: false
                        }, {
                           $set: {
                              limit: mbalance,
                              balance: mbalance
                           }
                        }, function (err, raw1) {
                           if (err) logger.error(err);


                           User.findOne({
                              username: request.targetUser.master,
                              role: 'master',
                              deleted: false
                           }, function (err, dbmanager) {
                              socket.emit("update-manager-balance-success", dbmanager);
                           });


                        });
                        var log = new Log();
                        log.username = dbOldTragetUser.username;
                        log.action = 'BALANCE';
                        if (dbOldTragetUser.limit < request.targetUser.limit) {
                           log.subAction = 'BALANCE_DEPOSIT';
                           log.description = 'Balance Deposit from ' + mnaagerBalaance.username;
                           log.newLimit = dbOldTragetUser.limit + request.targetUser.amount;
                        } else {
                           log.subAction = 'BALANCE_WITHDRAWL';
                           log.description = 'Balance Withdraw t0 ' + mnaagerBalaance.username;
                           log.newLimit = dbOldTragetUser.limit - request.targetUser.amount;
                        }
                        log.amount = request.targetUser.amount;
                        log.oldLimit = dbOldTragetUser.limit;

                        log.master = request.targetUser.master;
                        log.remark = request.targetUser.remark;
                        log.relation = request.targetUser.master;
                        log.time = new Date();
                        log.deleted = false;
                        //console.log(log);
                        log.save(function (err) {
                           if (err) {
                              logger.error('update-user-balance-error: Log entry failed.');
                           }
                        });


                        var logs = new Log();
                        logs.username = mnaagerBalaance.username;
                        logs.action = 'BALANCE';
                        if (log.subAction == 'BALANCE_WITHDRAWL') {
                           logs.subAction = 'BALANCE_DEPOSIT';
                           logs.amount = request.targetUser.amount;
                           logs.oldLimit = mnaagerBalaance.limit;
                           logs.newLimit = mnaagerBalaance.limit + request.targetUser.amount;
                           logs.description = 'Balance Withdraw from ' + dbOldTragetUser.username;

                        } else {
                           logs.subAction = 'BALANCE_WITHDRAWL';
                           logs.amount = request.targetUser.amount;
                           logs.oldLimit = mnaagerBalaance.limit;
                           logs.newLimit = mnaagerBalaance.limit - request.targetUser.amount;
                           logs.description = 'Balance Deposit to ' + dbOldTragetUser.username;

                        }
                        //logs.subadmin = dbUser.username;
                        logs.remark = request.targetUser.remark;
                        logs.relation = request.targetUser.username;
                        logs.time = new Date();
                        logs.deleted = false;
                        //console.log(log);
                        logs.save(function (err) {
                           if (err) {
                              logger.error('update-user-balance-error: Log entry failed.');
                           }
                        });
                        //log end
                     });
                  });
               });
            }

         }


         if (dbRole.role == 'user') {
            if (request.targetUser.mbalance != null) {
               User.findOne({
                  username: request.targetUser.username,
                  role: 'user',
                  deleted: false
               }, function (err, dbOldTragetUser) {


                  User.findOne({
                     username: request.targetUser.manager,
                     role: 'manager',
                     deleted: false
                  }, function (err, mnaagerBalaance) {
                     if (request.targetUser.action == 'DEPOSIT') {
                        if (request.targetUser.amount > mnaagerBalaance.limit) {
                           socket.emit("update-user-balance-error-success", {
                              message: "balance low!"
                           });
                           return;
                        }
                        var limit = dbOldTragetUser.limit + request.targetUser.amount;


                        var mbalance = mnaagerBalaance.limit - request.targetUser.amount;
                        if (limit == request.targetUser.limit) {

                        } else {

                           socket.emit("update-user-balance-error-success", {
                              message: "Unexpected error occur please try again.!"
                           });
                           return;

                        }


                     } else if (request.targetUser.action == 'WITHDRAW') {
                        if (request.targetUser.amount > dbOldTragetUser.limit) {
                           socket.emit("update-user-balance-error-success", {
                              message: "balance greater than amount!"
                           });
                           return;
                        }
                        if (request.targetUser.amount > dbOldTragetUser.limit - dbOldTragetUser.exposure) {
                           socket.emit("update-user-balance-error-success", {
                              message: "Unexpected error occur please try again.!"
                           });
                           return;
                        }


                        var balance = dbOldTragetUser.balance - request.targetUser.amount;
                        var limit = dbOldTragetUser.limit - request.targetUser.amount;
                        var mbalance = mnaagerBalaance.limit + request.targetUser.amount;
                        if (limit == request.targetUser.limit) {

                        } else {
                           socket.emit("update-user-balance-error-success", {
                              message: "Unexpected error occur please try again.!"
                           });
                           return;

                        }
                     } else {
                        socket.emit("update-user-balance-error-success", {
                           message: "Update your app please contact upline."
                        });
                        return;
                     }
                     if (err) logger.error(err);
                     socket.emit("update-user-balance-error-success", {
                        message: "Balance " + request.targetUser.action + " successfully.!"
                     });
                     User.update({
                        username: request.targetUser.username,
                        role: 'user',
                        deleted: false
                     }, {
                        $set: {
                           limit: limit,
                           balance: balance,
                        }
                     }, function (err, raw) {
                        if (err) logger.error(err);

                        socket.emit("update-user-balance-success", request.targetUser);
                        //log start


                        User.update({
                           username: request.targetUser.manager,
                           role: 'manager',
                           deleted: false
                        }, {
                           $set: {
                              limit: mbalance,
                              balance: mbalance
                           }
                        }, function (err, raw1) {
                           if (err) logger.error(err);


                           User.findOne({
                              username: request.targetUser.manager,
                              role: 'manager',
                              deleted: false
                           }, function (err, dbmanager) {
                              socket.emit("update-manager-balance-success", dbmanager);
                           });


                        });
                        var log = new Log();
                        log.username = dbOldTragetUser.username;
                        log.action = 'BALANCE';
                        if (dbOldTragetUser.limit < request.targetUser.limit) {
                           log.subAction = 'BALANCE_DEPOSIT';
                           log.description = 'Balance Deposit from ' + mnaagerBalaance.username;
                           log.newLimit = dbOldTragetUser.limit + request.targetUser.amount;
                        } else {
                           log.subAction = 'BALANCE_WITHDRAWL';
                           log.description = 'Balance Withdraw t0 ' + mnaagerBalaance.username;
                           log.newLimit = dbOldTragetUser.limit - request.targetUser.amount;
                        }
                        log.amount = request.targetUser.amount;
                        log.oldLimit = dbOldTragetUser.limit;

                        log.manager = request.targetUser.manager;
                        log.remark = request.targetUser.remark;
                        log.relation = request.targetUser.manager;
                        log.time = new Date();
                        log.deleted = false;
                        //console.log(log);
                        log.save(function (err) {
                           if (err) {
                              logger.error('update-user-balance-error: Log entry failed.');
                           }
                        });


                        var logs = new Log();
                        logs.username = mnaagerBalaance.username;
                        logs.action = 'BALANCE';
                        if (log.subAction == 'BALANCE_WITHDRAWL') {
                           logs.subAction = 'BALANCE_DEPOSIT';
                           logs.amount = request.targetUser.amount;
                           logs.oldLimit = mnaagerBalaance.limit;
                           logs.newLimit = mnaagerBalaance.limit + request.targetUser.amount;
                           logs.description = 'Balance Withdraw from ' + dbOldTragetUser.username;

                        } else {
                           logs.subAction = 'BALANCE_WITHDRAWL';
                           logs.amount = request.targetUser.amount;
                           logs.oldLimit = mnaagerBalaance.limit;
                           logs.newLimit = mnaagerBalaance.limit - request.targetUser.amount;
                           logs.description = 'Balance Deposit to ' + dbOldTragetUser.username;

                        }
                        //logs.subadmin = dbUser.username;
                        logs.remark = request.targetUser.remark;
                        logs.relation = request.targetUser.username;
                        logs.time = new Date();
                        logs.deleted = false;
                        //console.log(log);
                        logs.save(function (err) {
                           if (err) {
                              logger.error('update-user-balance-error: Log entry failed.');
                           }
                        });
                        //log end
                     });
                  });
               });
            }

         }
      });

   });
}

module.exports.updateAdminUserBalance = function (io, socket, request) {
   if (!request) return;
   if (!request.user || !request.targetUser) return;
   if (!request.user.details) return;
   //("updateAdminUserBalance: " + JSON.stringify(request));
   User.findOne({
      _id: request.user.details._id,
      hash: request.user.key
   }, {
      role: 1,
      username: 1
   }, function (err, dbUser) {
      if (err) logger.error(err);
      if (!dbUser) return;
      if (dbUser.role != 'admin') return;


      if (dbUser.role == 'admin') {

         //console.log(request);
         User.findOne({
            username: request.targetUser.username,
            role: 'user',
            deleted: false
         }, function (err, dbOldTragetUser) {
            if (err) logger.error(err);


            User.findOne({
               username: request.targetUser.manager,
               role: 'manager',
               deleted: false
            }, function (err, dbManager) {

               if (request.targetUser.bstatus == "DEPOSIT") {
                  if (request.targetUser.amount > dbManager.limit) {
                     socket.emit("update-user-success", {
                        'message': 'Balance Limit Exceed.'
                     });
                     return;
                  } else {

                  }

                  User.update({
                     username: request.targetUser.username,
                     role: 'user',
                     deleted: false
                  }, {
                     $set: {
                        limit: dbOldTragetUser.limit + request.targetUser.amount,
                        balance: dbOldTragetUser.balance + request.targetUser.amount
                     }
                  }, function (err, raw) {
                     if (err) logger.error(err);

                  });


                  User.update({
                     username: request.targetUser.manager,
                     role: 'manager',
                     deleted: false
                  }, {
                     $set: {
                        limit: dbManager.limit - request.targetUser.amount
                     }
                  }, function (err, raw) {

                  });

                  var today = new Date();
                  if (today.getDate() <= 9) {
                     var acdate = '0' + today.getDate();
                  }
                  else {
                     var acdate = today.getDate();
                  }

                  if ((today.getMonth() + 1) <= 9) {
                     var acmonth = '0' + (today.getMonth() + 1);
                  }
                  else {
                     var acmonth = (today.getMonth() + 1);
                  }

                  var date = today.getFullYear() + '-' + acmonth + '-' + acdate;

                  //log start
                  var log = new Log();
                  log.createdAt = date;
                  log.username = dbOldTragetUser.username;
                  log.action = 'BALANCE';
                  if (dbOldTragetUser.limit < request.targetUser.limit) {
                     log.subAction = 'BALANCE_DEPOSIT';
                  } else {
                     log.subAction = 'BALANCE_WITHDRAWL';
                  }
                  log.oldLimit = dbOldTragetUser.limit;
                  log.newLimit = request.targetUser.limit;
                  log.description = 'Balance updated. Old Limit: ' + dbOldTragetUser.limit + '. New Limit: ' + request.targetUser.limit;
                  if (request.user.details.roleSub) {
                     log.manager = request.user.details.username;
                  } else {
                     log.manager = request.targetUser.manager;
                  }


                  log.relation = dbOldTragetUser.username;
                  log.time = new Date();
                  log.deleted = false;
                  // console.log(log);
                  log.save(function (err) {
                     if (err) {
                        logger.error('update-user-balance-error: Log entry failed.');
                     }
                  });
                  //log end

                  socket.emit("update-user-success", {
                     'message': 'Balance Update successfully.'
                  });


               }


               if (request.targetUser.bstatus == "WITHDRAW") {
                  if (request.targetUser.amount > dbOldTragetUser.balance) {
                     socket.emit("update-user-success", {
                        'message': 'Balance Limit Exceed.'
                     });
                     return;
                  } else {

                  }

                  User.update({
                     username: request.targetUser.username,
                     role: 'user',
                     deleted: false
                  }, {
                     $set: {
                        limit: dbOldTragetUser.limit - request.targetUser.amount,
                        balance: dbOldTragetUser.balance - request.targetUser.amount
                     }
                  }, function (err, raw) {
                     if (err) logger.error(err);

                  });


                  User.update({
                     username: request.targetUser.manager,
                     role: 'manager',
                     deleted: false
                  }, {
                     $set: {
                        limit: dbManager.limit + request.targetUser.amount
                     }
                  }, function (err, raw) {

                  });
                  var today = new Date();
                  if (today.getDate() <= 9) {
                     var acdate = '0' + today.getDate();
                  }
                  else {
                     var acdate = today.getDate();
                  }

                  if ((today.getMonth() + 1) <= 9) {
                     var acmonth = '0' + (today.getMonth() + 1);
                  }
                  else {
                     var acmonth = (today.getMonth() + 1);
                  }

                  var date = today.getFullYear() + '-' + acmonth + '-' + acdate;

                  //log start
                  var log = new Log();
                  log.createdAt = date;
                  log.username = dbOldTragetUser.username;
                  log.action = 'BALANCE';
                  if (dbOldTragetUser.limit < request.targetUser.limit) {
                     log.subAction = 'BALANCE_DEPOSIT';
                  } else {
                     log.subAction = 'BALANCE_WITHDRAWL';
                  }
                  log.oldLimit = dbOldTragetUser.limit;
                  log.newLimit = request.targetUser.limit;
                  log.description = 'Balance updated. Old Limit: ' + dbOldTragetUser.limit + '. New Limit: ' + request.targetUser.limit;
                  if (request.user.details.roleSub) {
                     log.manager = request.user.details.username;
                  } else {
                     log.manager = request.targetUser.manager;
                  }
                  log.relation = dbOldTragetUser.username;
                  log.time = new Date();
                  log.deleted = false;
                  // console.log(log);
                  log.save(function (err) {
                     if (err) {
                        logger.error('update-user-balance-error: Log entry failed.');
                     }
                  });
                  //log end

                  socket.emit("update-user-success", {
                     'message': 'Balance Update successfully.'
                  });


               }

            });


            //log for admin n manager deposit

         });

      }

   });
}

module.exports.deleteUser = function (io, socket, request) {
   if (!request) return;
   if (!request.user || !request.targetUser) return;
   //("deleteUser: " + JSON.stringify(request));

   if (request.user.details.role == 'manager') {
      if (request.targetUser.role != 'user' && request.targetUser.role != 'partner') return;
      User.findOne({
         hash: request.user.key,
         _id: request.user.details._id,
         role: 'manager',
         deleted: false,
         status: 'active'
      }, function (err, dbAdmin) {
         if (err) logger.error(err);
         if (!dbAdmin) {
            logger.error("Invalid Access: " + JSON.stringify(request));
            return;
         }
         User.findOne({
            username: request.targetUser.username,
            role: request.targetUser.role
         }, function (err, muser) {
            console.log("lmit" + muser.limit);
            if (muser.limit != 0) {
               socket.emit('update-user-success', {
                  "message": "User not allowed deletion. please clear all user balance"
               });
               return;
            }
            User.update({
               username: request.targetUser.username,
               role: request.targetUser.role
            }, {
               $set: {
                  status: 'inactive',
                  deleted: true
               }
            }, function (err, raw) {
               if (err) logger.error(err);
               Login.update({
                  username: request.targetUser.username,
                  role: request.targetUser.role
               }, {
                  $set: {
                     status: 'inactive',
                     deleted: true
                  }
               }, function (err, raw) {
                  if (err) logger.error(err);
                  //log start
                  var log = new Log();
                  log.username = request.targetUser.username;
                  log.action = 'ACCOUNT';
                  log.subAction = 'ACCOUNT_DELETED';
                  log.description = 'Account deleted.';
                  log.manager = request.user.details.username;
                  log.time = new Date();
                  log.deleted = false;
                  log.save(function (err) {
                     if (err) {
                        logger.error('delete-user-error: Log entry failed.');
                     }
                  });
                  //log end
                  socket.emit("delete-user-success", request.targetUser);
                  User.findOne({
                     _id: request.user.details._id,
                     deleted: false
                  }, function (err, m) {
                     if (err) logger.error(err);
                     if (m) {
                        if (request.targetUser.role == 'user') {
                           Bet.update({
                              username: request.targetUser.username
                           }, {
                              $set: {
                                 deleted: true
                              }
                           }, {
                              multi: true
                           }, function (err, raw) {
                              if (err) logger.error(err);
                           });
                           if (m.userCount) m.userCount = m.userCount * 1 - 1;
                        }
                        if (request.targetUser.role == 'partner') {
                           if (m.partnerCount) m.partnerCount = m.partnerCount * 1 - 1;
                        }
                        m.save(function (err) {
                           if (err) logger.error(err);
                        });
                     }
                  });
               });
            });
         });
      });
   }

   if (request.user.details.role == 'partner') {
      if (request.targetUser.role != 'user') return;
      User.findOne({
         hash: request.user.key,
         _id: request.user.details._id,
         role: 'partner',
         deleted: false,
         status: 'active'
      }, function (err, dbAdmin) {
         if (err) logger.error(err);
         if (!dbAdmin) {
            logger.error("Invalid Access for partner: " + JSON.stringify(request));
            return;
         }
         User.findOne({
            username: request.targetUser.username,
            role: request.targetUser.role
         }, function (err, muser) {
            if (muser.limit != 0) socket.emit('update-user-success', {
               "message": "User not allowed deletion. please clear all user balance"
            });
            return;
            User.update({
               username: request.targetUser.username,
               role: request.targetUser.role
            }, {
               $set: {
                  status: 'inactive',
                  deleted: true
               }
            }, function (err, raw) {
               if (err) logger.error(err);
               Login.update({
                  username: request.targetUser.username,
                  role: request.targetUser.role
               }, {
                  $set: {
                     status: 'inactive',
                     deleted: true
                  }
               }, function (err, raw) {
                  if (err) logger.error(err);
                  //log start
                  var log = new Log();
                  log.username = request.targetUser.username;
                  log.action = 'ACCOUNT';
                  log.subAction = 'ACCOUNT_DELETED';
                  log.description = 'Account deleted.';
                  log.manager = request.user.details.username;
                  log.time = new Date();
                  log.deleted = false;
                  log.save(function (err) {
                     if (err) {
                        logger.error('delete-user-error: Log entry failed.');
                     }
                  });
                  //log end
                  socket.emit("delete-user-success", request.targetUser);
                  User.findOne({
                     _id: request.user.details._id,
                     deleted: false
                  }, function (err, m) {
                     if (err) logger.error(err);
                     if (m) {
                        if (request.targetUser.role == 'user') {
                           Bet.update({
                              username: request.targetUser.username
                           }, {
                              $set: {
                                 deleted: true
                              }
                           }, {
                              multi: true
                           }, function (err, raw) {
                              if (err) logger.error(err);
                           });
                           if (m.userCount) m.userCount = m.userCount * 1 - 1;
                        }
                        if (request.targetUser.role == 'partner') {
                           if (m.partnerCount) m.partnerCount = m.partnerCount * 1 - 1;
                        }
                        m.save(function (err) {
                           if (err) logger.error(err);
                        });
                     }
                  });
               });
            });
         });
      });
   }
   if (request.user.details.role == 'admin') {
      if (request.targetUser.role != 'manager' && request.targetUser.role != 'operator') return;
      User.findOne({
         hash: request.user.key,
         _id: request.user.details._id,
         role: 'admin',
         deleted: false,
         status: 'active'
      }, function (err, dbAdmin) {
         if (err) logger.error(err);
         if (!dbAdmin) {
            logger.error("Invalid Access: " + JSON.stringify(request));
            return;
         }
         // Delete all users under the managers
         if (request.targetUser.role == 'operator') {

            Login.update({
               username: request.targetUser.username
            }, {
               $set: {
                  status: 'inactive',
                  deleted: true
               }
            }, {
               multi: true
            }, function (err, raw) {

            });

            User.update({
               username: request.targetUser.username
            }, {
               $set: {
                  status: 'inactive',
                  deleted: true
               }
            }, {
               multi: true
            }, function (err, raw) {

            });

         }

         Login.update({
            manager: request.targetUser.username
         }, {
            $set: {
               status: 'inactive',
               deleted: true
            }
         }, {
            multi: true
         }, function (err, raw) {
            if (err) logger.error(err);
            User.update({
               manager: request.targetUser.username
            }, {
               $set: {
                  status: 'inactive',
                  deleted: true
               }
            }, {
               multi: true
            }, function (err, raw) {
               if (err) logger.error(err);
               Bet.update({
                  manager: request.targetUser.username
               }, {
                  $set: {
                     deleted: true
                  }
               }, {
                  multi: true
               }, function (err, raw) {
                  if (err) logger.error(err);
                  Login.update({
                     username: request.targetUser.username,
                     role: 'manager'
                  }, {
                     $set: {
                        status: 'inactive',
                        deleted: true
                     }
                  }, function (err, raw) {
                     if (err) logger.error(err);
                     User.update({
                        username: request.targetUser.username,
                        role: 'manager'
                     }, {
                        $set: {
                           status: 'inactive',
                           deleted: true
                        }
                     }, function (err, raw) {
                        if (err) logger.error(err);
                        socket.emit("delete-user-success", request.targetUser);
                     });
                  });
               });
            });
         });
      });

   }
}

module.exports.updateMatchFees = function (io, socket, request) {
   if (!request) return;
   if (!request.user) return;
   if (!request.user.details) return;
   logger.debug("updateMatchFees: " + JSON.stringify(request));

   User.findOne({
      _id: request.user.details._id,
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
         User.update({
            username: dbUser.username,
            deleted: false,
            role: 'manager'
         }, {
            $set: {
               matchFees: request.matchFees
            }
         }, function (err, raw) {
            if (err) logger.error(err);
            User.update({
               manager: dbUser.username,
               deleted: false,
               role: 'user'
            }, {
               $set: {
                  matchFees: request.matchFees
               }
            }, {
               multi: true
            }, function (err, raw) {
               if (err) logger.error(err);
               socket.emit("update-match-fees-success", {
                  "message": "Match fees updated successfully",
                  success: true
               });
            });
         });
      }
   });
}

module.exports.updateMatchCommisions = function (io, socket, request) {
   if (!request) return;
   if (!request.user) return;
   if (!request.user.details) return;
   logger.debug("updateMatchCommisions: " + JSON.stringify(request));

   User.findOne({
      _id: request.user.details._id,
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
         console.log(request.commisionloss)
         if (request.commisionloss > 3) {
            socket.emit("update-match-fees-success", {
               "message": "maximum commision 3%",
               success: true
            });
            return;

         } else if (request.rfcommisionloss > 3) {
            socket.emit("update-match-fees-success", {
               "message": "maximum  referal commision 3%",
               success: true
            });
            return;
         } else {
            if (!request.commisionloss) {
               request.commisionloss = 0;
            }
            if (parseInt(request.rfcommisionloss) + parseInt(request.commisionloss) > 3) {

               socket.emit("update-match-fees-success", {
                  "message": "maximum both referal and user commision 3%",
                  success: true
               });
               return;
            }

            User.update({
               username: request.targetUser.username,
               deleted: false,
               role: 'user'
            }, {
               $set: {
                  commision: request.commision,
                  commisionloss: request.commisionloss,
                  matchFees: request.matchFees,
                  rfcommisionloss: request.rfcommisionloss
               }
            }, function (err, raw) {
               if (err) logger.error(err);
               socket.emit("update-match-fees-success", {
                  "message": "Match commision updated successfully",
                  success: true
               });
            });
         }

      }


      if (dbUser.role == 'partner') {
         console.log(request.commisionloss)
         if (request.commisionloss > 3) {
            socket.emit("update-match-fees-success", {
               "message": "maximum commision 3%",
               success: true
            });
            return;

         } else if (request.rfcommisionloss > 3) {
            socket.emit("update-match-fees-success", {
               "message": "maximum  referal commision 3%",
               success: true
            });
            return;
         } else {
            if (!request.commisionloss) {
               request.commisionloss = 0;
            }
            if (parseInt(request.rfcommisionloss) + parseInt(request.commisionloss) > 3) {

               socket.emit("update-match-fees-success", {
                  "message": "maximum both referal and user commision 3%",
                  success: true
               });
               return;
            }

            User.update({
               username: request.targetUser.username,
               deleted: false,
               role: 'user'
            }, {
               $set: {
                  commision: request.commision,
                  commisionloss: request.commisionloss,
                  rfcommisionloss: request.rfcommisionloss
               }
            }, function (err, raw) {
               if (err) logger.error(err);
               socket.emit("update-match-fees-success", {
                  "message": "Match commision updated successfully",
                  success: true
               });
            });
         }

      }
   });
}

module.exports.updateReferal = function (io, socket, request) {
   if (!request) return;
   if (!request.user) return;
   if (!request.user.details) return;
   logger.debug("updateReferal: " + JSON.stringify(request));

   User.findOne({
      _id: request.user.details._id,
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

         User.update({
            username: request.targetUser.username,
            deleted: false,
            role: 'user'
         }, {
            $set: {
               referal: request.referal
            }
         }, function (err, raw) {
            if (err) logger.error(err);
            socket.emit("update-referal-success", {
               "message": "Referal updated successfully",
               success: true
            });
         });


      }

      if (dbUser.role == 'partner') {

         User.update({
            username: request.targetUser.username,
            deleted: false,
            role: 'user'
         }, {
            $set: {
               referal: request.referal
            }
         }, function (err, raw) {
            if (err) logger.error(err);
            socket.emit("update-referal-success", {
               "message": "Referal updated successfully",
               success: true
            });
         });


      }
   });
}