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


let jwt_key = "k0uwKPKgQDCtOOydeJXpPw";
let jwt_secret = 'WcU3Nvvtr7GagmTrazL3vg8ClyFEMp317BJq';

const moment = require('moment-timezone');

var currentdate = moment().tz("Asia/Calcutta").format('YYYY-MM-DD');
var current = moment().tz("Asia/Calcutta").format('YYYY-MM-DDTHH:mm:ss');
console.log("User File", currentdate, current);

//////////////// --------------- Score Api----------------//////////

module.exports.superAdminlogin = function (io, socket, request) {
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
      username: request.user.username.toUpperCase(),
      role: { $in: ["superadmin","siteadmin","techadmin"]}
   }, async function (err, user) {

      // console.log(user);

      if (err) logger.debug(err);
      // Check username

      if (!user) {
         logger.error('login-error: User not found ' + request.user.username);
         socket.emit('admin-login-success', {
            "message": "User not found",
            success: false
         });
         return;
      }
      // Check password
      if (!user.validPassword(request.user.password)) {
         user.loginAttempts += 1;
         logger.error('login-error: Invalid password ' + request.user.username);
         socket.emit('admin-login-success', {
            "message": "Invalid password",
            success: false
         });
         return;
      }
      // Reset login attempts counter
      user.loginAttempts = 0;
      // Check deleted or blocked account
      if (user.status != 'active') {
         logger.error('login-error: Account is blocked or deleted' + request.user.username);
         socket.emit('admin-login-success', {
            "message": "Account is not accessible anymore. Contact the admin to activate the account.",
            success: false
         });
         return;
      }
      var oldtoken = user.token;
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
            socket.emit("admin-login-success", { output: output, success: true });
         })


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

module.exports.createAdmin = async function (io, socket, req) {
   // - validate request data
   console.log("createAdmin",req);
   try {
      //   console.log(req)
      // let decoded = jwt.verify(req.token, myEnv.parsed.SECRET);
      let { userId } = jwt.decode(req.token);
      let dbAdmin = await User.findOne({ _id: userId, token: req.token });
      if (!dbAdmin) return io.to(socket.id).emit('logout');
      if (dbAdmin.token != req.token) return io.to(socket.id).emit('logout');
      logger.info("createAdmin: " + JSON.stringify(req));
      // console.log(request);

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

            //create new user
            //set user details
            var user = new User();
            user.username = req.newUser.username.toUpperCase();
            user.fullname = req.newUser.fullname;
            user.setDefaults();
            user.setPassword(req.newUser.password);
            user.settransPassword(req.newUser.password);
            user.role = req.newUser.role;
            user.transctionpasswordstatus = 0;
            user.status = 'active';
            user.city = dbAdmin.city;
            user.mobile = dbAdmin.mobile;
            user.creditrefrence = dbAdmin.creditrefrence;
            user.exposurelimit = 0;
            user.ParentUser = dbAdmin.username;
            user.ParentRole = dbAdmin.role;
            user.ParentId = dbAdmin._id;
            user.casinobalance = 0;
            user.balance = 100000000;
            user.limit = 100000000;
            user.availableAmount = 100000000;
            user.commissionsetting = dbAdmin.commissionsetting;
            user.partnershipsetting = dbAdmin.partnershipsetting;
            user.Parentpartnership = dbAdmin.Parentpartnership;
            user.Parentcommission = dbAdmin.Parentcommission;
            user.availableEventTypes = dbAdmin.availableEventTypes;
            user.openingDate = new Date();
            user.save(function (err) {
               if (err) {
                  // console.log(err)
                  logger.error('create-user-error: DBError in Users');
                  // console.log('Error in creating record');
                  socket.emit("create-user-success", {
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
                        logger.error('create-user-error: Log entry failed.');
                     }
                  });

                  // socket.emit("create-user-success", user);
                  console.log("success");
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
   catch (error) {
      console.log(error);

   };

}

module.exports.getAdminList = async function (req, res) {
   try {
      console.log(req.body)
      // let decoded = jwt.verify(req.token, myEnv.parsed.SECRET);
      let { userId } = jwt.decode(req.token);
      let dbAdmin = await User.findOne({ _id: userId, token: req.token });
      if (!dbAdmin) return res.send({ success: false, logout: true, message: "Token Invalid. Please login in again." });
      if (dbAdmin.token != req.token) return res.send({ success: false, logout: true, message: "Token Invalid. Please login in again." });

      let { search, pageNumber, sortBy, limit } = req.body;

      var filter = {
         role: "techadmin",
         deleted: false,
      };

      User.find(filter, {}).sort({
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

module.exports.adminDeposit = async function (req, res) {

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
      if (dbAdmin.role != 'superadmin') return res.send({ success: false, logout: true, message: "Not Authorised." });
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




      await User.findOne({ _id: req.body.targetUser.userId, role: "admin" },
         {
            _id: 1, username: 1, balance: 1, manager: 1, master: 1, subadmin: 1, admin: 1, Parentrole: 1, managerId: 1, masterId: 1, subadminId: 1, adminId: 1, ParentId: 1, availableAmount: 1, exposure: 1, limit: 1, manager: 1, ParentUser: 1, bounsStatus: 1, bounsBalance: 1,
         }).then(async dbUser => {

            User.updateOne({
               '_id': dbUser._id
            }, {
               $inc: {
                  balance: req.body.targetUser.amount,
                  availableAmount: req.body.targetUser.amount,
                  limit: req.body.targetUser.amount
               }
            }).session(session).then(async (row1) => {
               var date = moment().tz("Asia/Calcutta").format('YYYY-MM-DD');
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
               logSave.mnewLimit = 0;
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
                  await session.commitTransaction();
                  await session.endSession();
                  var userData = await User.findOne({ '_id': dbUser._id },
                     {
                        balance: 1, exposure: 1, limit: 1, username: 1
                     });
                  return res.json({ response: userData, success: true, "message": "success" });
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
            return res.json({ response: {}, success: false, "message": "User Not Found" });
         })

   } catch (error) {
      await session.abortTransaction();
      await session.endSession();
      console.log(error)
      return res.json({ response: error, success: false, "message": "Server Error" });
   }
}

module.exports.adminWithdraw = async function (req, res) {
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
      if (dbAdmin.role != 'superadmin') return res.send({ success: false, logout: true, message: "Not Authorised." });

      await session.startTransaction();

      if (!dbAdmin.validTransPassword(req.body.transpassword)) {
         dbAdmin.loginAttempts += 1;
         logger.error('update-password-success: Invalid Transaction password ' + dbAdmin.username);
         console.log("Invalid Transaction password");
         await session.abortTransaction();
         await session.endSession();
         return res.json({ response: [], success: false, "message": "Invalid Transaction password" });
      }

      User.findOne({ _id: req.body.targetUser.userId, role: "admin" },
         {
            _id: 1, username: 1, balance: 1, bounsStatus: 1, bounsBalance: 1, manager: 1, master: 1, subadmin: 1, admin: 1, managerId: 1, masterId: 1, subadminId: 1, adminId: 1, ParentId: 1, Parentrole: 1, availableAmount: 1, exposure: 1, limit: 1, manager: 1, ParentUser: 1
         }).then(async dbUser => {
            if (req.body.targetUser.amount > dbUser.balance) {
               await session.abortTransaction();
               await session.endSession();
               return res.json({ response: [], success: false, "message": "Your balance is low, please contact upline." });
            } else {
               var date = moment().tz("Asia/Calcutta").format('YYYY-MM-DD');
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
                     await session.commitTransaction();
                     await session.endSession();
                     var userData = await User.findOne({ '_id': dbUser._id },
                        {
                           balance: 1, exposure: 1, limit: 1, username: 1
                        });
                     return res.json({ response: userData, success: true, "message": "success" });
                  });
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
            return res.json({ response: {}, success: false, "message": "User Not Found" });
         })

   } catch (error) {
      await session.abortTransaction();
      await session.endSession();
      console.log(e)
      return res.json({ response: error, success: false, "message": "Server Error" });
   }
}

module.exports.getEventMarket = async function (req, res) {
   try {
      console.log(req.body.filter)
      //   let decoded = jwt.verify(req.token, myEnv.parsed.SECRET);
      let { userId } = jwt.decode(req.token);
      let dbAdmin = await User.findOne({ _id: userId, token: req.token });
      if (!dbAdmin) return res.send({ success: false, logout: true, message: "Token Invalid. Please login in again." });
      if (dbAdmin.token != req.token) return res.send({ success: false, logout: true, message: "Token Invalid. Please login in again." });
      var ddd = new Date();
      ddd.setDate(ddd.getDate() - 2);
      // console.log((ddd.toISOString()))
      Market.find(req.body.filter, {
      }).sort({
         $natural: -1
      }).exec(function (err, dbMarket) {
         // console.log(dbMarket.length,i)
         if (dbMarket.length == 0) {
            console.log('remove All');
            res.json({ response: [], success: true, "message": "server response success" });
         } else {
            res.json({ response: dbMarket, success: true, "message": "server response success" });
         }
      });
   } catch (err) {
      res.json({ response: [], success: false, "message": "server response success" });
   }
}

module.exports.getMarketBets = async function (req, res) {
   try {
      // console.log(req.body)
      //   let decoded = jwt.verify(req.token, myEnv.parsed.SECRET);
      let { userId } = jwt.decode(req.token);
      let dbAdmin = await User.findOne({ _id: userId, token: req.token });
      if (!dbAdmin) return res.send({ success: false, logout: true, message: "Token Invalid. Please login in again." });
      if (dbAdmin.token != req.token) return res.send({ success: false, logout: true, message: "Token Invalid. Please login in again." });
      Bet.find({
         'marketId': req.body.marketId,
         deleted: false
      }).sort({
         $natural: -1
      }).exec(function (err, dbMarket) {
         if (dbMarket.length == 0) {
            console.log('remove All');
            res.json({ response: [], success: true, "message": "server response success" });
         } else {
            res.json({ response: dbMarket, success: true, "message": "server response success" });
         }
      });
   } catch (err) {
      res.json({ response: [], success: false, "message": "server response success" });
   }
}

module.exports.getOneMarket = async function (req, res) {
   try {
      // console.log(req.body)
      //   let decoded = jwt.verify(req.token, myEnv.parsed.SECRET);
      let { userId } = jwt.decode(req.token);
      let dbAdmin = await User.findOne({ _id: userId, token: req.token });
      if (!dbAdmin) return res.send({ success: false, logout: true, message: "Token Invalid. Please login in again." });
      if (dbAdmin.token != req.token) return res.send({ success: false, logout: true, message: "Token Invalid. Please login in again." });

      Market.findOne({
         'marketId': req.body.marketId,
      }, function (err, dbMarket) {
         if (dbMarket.length == 0) {
            console.log('remove All');
            res.json({ response: [], success: true, "message": "server response success" });
         } else {
            res.json({ response: dbMarket, success: true, "message": "server response success" });
         }
      });
   } catch (err) {
      res.json({ response: [], success: false, "message": "server response success" });
   }
}

module.exports.getMarketAnalasis = async function (req, res) {
   try {
      console.log(req.body)
      //   let decoded = jwt.verify(req.token, myEnv.parsed.SECRET);
      let { userId } = jwt.decode(req.token);
      let dbAdmin = await User.findOne({ _id: userId, token: req.token });
      if (!dbAdmin) return res.send({ success: false, logout: true, message: "Token Invalid. Please login in again." });
      if (dbAdmin.token != req.token) return res.send({ success: false, logout: true, message: "Token Invalid. Please login in again." });

      Bet.distinct("marketId", {
         status: 'MATCHED',
         'result': 'ACTIVE',
         'eventTypeId': {
            $nin: ['c1']
          },
         deleted: false
      }, function (err, marketUnique) {
         // console.log("getMarketAnalasis",marketUnique);
         if (marketUnique.length == 0) {
            res.json({ response: [], success: true, "message": "no bet" });
         } else {

            Market.find({
               "marketId": {
                  $in: marketUnique
               },
               $or: [{ visible: false }, { 'marketbook.status': "CLOSED" },{ marketType: 'Special' },],
               // visible: false
               // 'marketbook.status': "CLOSED"
            }).sort({
               $natural: -1
            }).exec(function (err, market) {
               if (market.length == 0) {
                  res.json({ response: [], success: true, "message": "no market" });
               } else {
                  res.json({ response: market, success: true, "message": "server response success" });
               }
            });
         }
      });
   } catch (err) {
      res.json({ response: [], success: false, "message": "server response success" });
   }
}

module.exports.getPendingMarketAnalasis = async function (req, res) {
   try {
      // console.log(req.body)
      //   let decoded = jwt.verify(req.token, myEnv.parsed.SECRET);
      let { userId } = jwt.decode(req.token);
      let dbAdmin = await User.findOne({ _id: userId, token: req.token });
      if (!dbAdmin) return res.send({ success: false, logout: true, message: "Token Invalid. Please login in again." });
      if (dbAdmin.token != req.token) return res.send({ success: false, logout: true, message: "Token Invalid. Please login in again." });

      Bet.distinct("marketId", {
         status: 'MATCHED',
         'result': 'ACTIVE',
         'eventTypeId': {
            $nin: ['c1']
          },
         deleted: false
      }, function (err, marketUnique) {
         // console.log(marketUnique);
         if (marketUnique.length == 0) {
            res.json({ response: [], success: true, "message": "no bet" });
         } else {

            Market.find({
               "marketId": {
                  $in: marketUnique
               },
               // $or: [{ visible: false }, { 'marketbook.status': "CLOSED" },{ marketType: 'Special' },],
               // visible: false
               // 'marketbook.status': "CLOSED"
            }).sort({
               $natural: -1
            }).exec(function (err, market) {
               if (market.length == 0) {
                  res.json({ response: [], success: true, "message": "no market" });
               } else {
                  res.json({ response: market, success: true, "message": "server response success" });
               }
            });
         }
      });
   } catch (err) {
      res.json({ response: [], success: false, "message": "server response success" });
   }
}

module.exports.getPendingMarketResult = async function (req, res) {
   try {
      // console.log(req.body)
      //   let decoded = jwt.verify(req.token, myEnv.parsed.SECRET);
      // let { userId } = jwt.decode(req.token);
      // let dbAdmin = await User.findOne({ _id: userId, token: req.token });
      // if (!dbAdmin) return res.send({ success: false, logout: true, message: "Token Invalid. Please login in again." });
      // if (dbAdmin.token != req.token) return res.send({ success: false, logout: true, message: "Token Invalid. Please login in again." });

      Bet.distinct("marketId", {
         status: 'MATCHED',
         'result': 'ACTIVE',
         'eventTypeId': {
            $nin: ['c1','c9','v9']
          },
         deleted: false
      }, function (err, marketUnique) {
         // console.log(marketUnique);
         var AllMarkets = [];
         if (marketUnique.length == 0) {
            res.json({ response: [], success: true, "message": "no bet" });
         } else {
            Market.distinct("marketId",{
               "marketId": {
                  $in: marketUnique
               },
               $or: [{ visible: false }, { 'marketbook.status': "CLOSED" },{ marketType: 'Special' },],
               userlog:0,
               adminlog:0,
               // visible: false
               // 'marketbook.status': "CLOSED"
            },function (err, market) {
               if (market.length == 0) {
                  res.json({ response: [], success: true, "message": "no market" });
               } else {
                  res.json({ response: market, success: true, "message": "server response success" });
               }
            });
            // res.json({ response: marketUnique, success: true, "message": "server response success" });
         }
      });
   } catch (err) {
      res.json({ response: [], success: false, "message": "server response success" });
   }
}

module.exports.deleteBets = async function (io, socket, req) {
   try {
      let { userId } = jwt.decode(req.token);
      let dbAdmin = await User.findOne({ _id: userId, token: req.token });
      if (!dbAdmin) return res.send({ success: false, logout: true, message: "Token Invalid. Please login in again." });
      if (dbAdmin.token != req.token) return res.send({ success: false, logout: true, message: "Token Invalid. Please login in again." });
      req.username = dbAdmin.username;
      console.log(req)
      Bet.find({ _id: { $in: req.bets }, result: 'ACTIVE' }, function (err, dbBetList) {
         if (err) logger.error(err);
         if (!dbBetList) return;
         Bet.updateMany({ _id: { $in: req.bets }, result: 'ACTIVE' }, { $set: { deleted: true, deleteRequest: req, result: "DELETED" } }, { multi: true }, function (err, raw) {
            if (err) logger.error(err);
            socket.emit('delete-bets-success', req.bets);


            for (var i = 0; i < dbBetList.length; i++) {
               (function (bet) {
                  User.findOne({ username: bet.username }, function (err, user) {
                     if (err) logger.error(err);
                     if (user) {
                        User.findOne({ username: bet.username }, function (err, details) {
                           var temp = {};
                           temp['key'] = user.hash;
                           temp['_id'] = user._id;
                           temp['details'] = details;
                           updateBalance({ user: temp, bet: bet }, function (error) {
                              Session.findOne({ username: bet.username }, function (err, dbSession) {
                                 if (err) logger.error(err);
                                 if (dbSession) {
                                    io.user.emit('RVeDr66xWzOVLhV5AABIDcd7pwimDyfKiPvTAAAh5b52ccd84fa96dd59b65e54f', { socket: dbSession.socket, emitString: "refresh-event-page", emitData: { marketId: bet.eventId } });
                                 }
                              });
                           });
                        });
                     }
                  });
               })(dbBetList[i]);
            }
         });
      });

   }
   catch (e) {
      // console.log(e)
      socket.emit('delete-bets-error', e);

   }

}

async function updateBalance(request, done) {
   var balance = 0;
   // console.log(request);
   await User.findOne({
      username: request.user.details.username,
      hash: request.user.key,
      deleted: false
   }, async function (err, result) {
      if (err || !result || result.username != request.user.details.username) {
         done(-1);
         return;
      } else {
         await User.findOne({
            username: request.user.details.username,
            deleted: false
         }, async function (err, user) {
            if (err || !user) {
               done(-1);
               return;
            }
            console.log(user.username);
            await Bet.distinct('marketId', {
               username: request.user.details.username,
               deleted: false,
               result: 'ACTIVE'
            }, async function (err, marketIds) {
               if (err) logger.error(err);
               // console.log(marketIds);
               if (!marketIds || marketIds.length == 0) {
                  User.update({
                     username: request.user.details.username
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

module.exports.getCompetitions = async function (req, res) {
   try {
      // console.log(req.body.filter);
      let { userId } = jwt.decode(req.token);
      let dbAdmin = await User.findOne({ _id: userId, token: req.token });
      if (!dbAdmin) return res.send({ success: false, logout: true, message: "Token Invalid. Please login in again." });
      if (dbAdmin.token != req.token) return res.send({ success: false, logout: true, message: "Token Invalid. Please login in again." });

      var request = require('request');
      var options = {
         'method': 'POST',
         'url': 'http://178.62.77.178:3006/api/get-Competition',
         'headers': {
            'Content-Type': 'application/json'
         },
         body: JSON.stringify({
            "filter": req.body.filter
          })

      };
      request(options, function (error, response) {
         if (error) throw new Error(error);
         // console.log(response.body);
         res.json(JSON.parse(response.body));
      });
   } catch (err) {
      res.json(err);
   }
}

module.exports.getEvents = async function (req, res) {
   try {
      // console.log(req.body.filter);
      let { userId } = jwt.decode(req.token);
      let dbAdmin = await User.findOne({ _id: userId, token: req.token });
      if (!dbAdmin) return res.send({ success: false, logout: true, message: "Token Invalid. Please login in again." });
      if (dbAdmin.token != req.token) return res.send({ success: false, logout: true, message: "Token Invalid. Please login in again." });

      var request = require('request');
      var options = {
         'method': 'POST',
         'url': 'http://178.62.77.178:3006/api/get-event',
         'headers': {
            'Content-Type': 'application/json'
         },
         body: JSON.stringify({
            "filter": req.body.filter
          })

      };
      request(options, function (error, response) {
         if (error) throw new Error(error);
         // console.log(response.body);
         res.json(JSON.parse(response.body));
      });
   } catch (err) {
      res.json(err);
   }
}
