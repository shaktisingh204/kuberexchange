// required modules
var mongoose = require('mongoose');
var logger = require('log4js').getLogger();
var requestUrl = require("request");
// required models
var Login = mongoose.model('Login');
var Finance = mongoose.model('Finance');
var User = mongoose.model('User');
var Session = mongoose.model('Session');
var WebToken = mongoose.model('WebToken');
var Log = mongoose.model('Log');
var Bet = mongoose.model('Bet');
var Information = mongoose.model('Information');
var Tv = require('../models/tv');
var Chat = mongoose.model('Chat');
var Market = mongoose.model('Market');
var Lock = mongoose.model('Lock');
const Helper = require('./helper');
const jwt = require('jsonwebtoken');
const myEnv = require('dotenv').config();

let jwt_key = "k0uwKPKgQDCtOOydeJXpPw";
let jwt_secret = 'WcU3Nvvtr7GagmTrazL3vg8ClyFEMp317BJq';

const moment = require('moment-timezone');

var currentdate = moment().tz("Asia/Calcutta").format('YYYY-MM-DD');
var current = moment().tz("Asia/Calcutta").format('YYYY-MM-DDTHH:mm:ss');
console.log("Betfair Result", currentdate, current);


///////////  --------- SOCKET ----------- /////////////////


module.exports.createUser = function (io, socket, request) {
   // - validate request data
   // console.log(request);

   if (!request) return;
   if (!request.details || !request.details._id || !request.details.key) return;
   if (!request.details.username || !request.details.role) return;
   if (!request.newUser.username || !request.newUser.password || !request.newUser.role) return;
   // console.log(request);

   if (request.newUser.role == 'user') {

      if (request.details.role != 'manager') {
         socket.emit("create-user-success", {
            "message": "Not Authorized.",
            error: true
         });
         return;
      }

      User.findOne({
         username: request.details.username,
         role: {
            $in: ['admin', 'manager', 'master', 'subadmin']
         },
         status: 'active',
         deleted: false,
         hash: request.details.key
      }, async function (err, dbAdmin) {
         // console.log(dbAdmin);
         if (err) logger.error(err);
         if (!dbAdmin) return;

         if (!dbAdmin.validTransPassword(request.details.transpassword)) {
            dbAdmin.loginAttempts += 1;
            logger.error('create-user-success: Invalid Transaction password ' + request.details.username);
            socket.emit('create-user-success', {
               "message": "Invalid Transaction password",
               error: true
            });
            return;
         }

         User.findOne({
            username: request.newUser.username.toUpperCase()
         }, async function (err, usersCheck) {
            if (err) logger.error(err);
            if (usersCheck) {
               logger.error('create-user-success: User already exists');
               socket.emit("create-user-success", {
                  "message": "User already exists",
                  error: true,
                  user: usersCheck
               });
               return;
            }

            var MasterP = await User.findOne({ username: dbAdmin.master }, { partnershipsetting: 1, commissionsetting: 1 })
            var SubadminP = await User.findOne({ username: dbAdmin.subadmin }, { partnershipsetting: 1, commissionsetting: 1 })
            // var AdminP = await User.findOne({username: dbAdmin.admin },{partnershipsetting:1,commissionsetting:1})
            console.log(MasterP, SubadminP)
            var Parentpartnership = [
               {
                  sport_id: 4,
                  sport_name: "cricket",
                  manager: dbAdmin.partnershipsetting[0].partnership,
                  master: MasterP.partnershipsetting[0].partnership - dbAdmin.partnershipsetting[0].partnership,
                  subadmin: SubadminP.partnershipsetting[0].partnership - MasterP.partnershipsetting[0].partnership,
                  admin: 100 - SubadminP.partnershipsetting[0].partnership,
               },
               {
                  sport_id: 1,
                  sport_name: "soccer",
                  manager: dbAdmin.partnershipsetting[1].partnership,
                  master: MasterP.partnershipsetting[1].partnership - dbAdmin.partnershipsetting[1].partnership,
                  subadmin: SubadminP.partnershipsetting[1].partnership - MasterP.partnershipsetting[1].partnership,
                  admin: 100 - SubadminP.partnershipsetting[1].partnership,
               },
               {
                  sport_id: 2,
                  sport_name: "tennis",
                  manager: dbAdmin.partnershipsetting[2].partnership,
                  master: MasterP.partnershipsetting[2].partnership - dbAdmin.partnershipsetting[2].partnership,
                  subadmin: SubadminP.partnershipsetting[2].partnership - MasterP.partnershipsetting[2].partnership,
                  admin: 100 - SubadminP.partnershipsetting[2].partnership,
               },
               {
                  sport_id: 'c9',
                  sport_name: "casino",
                  manager: dbAdmin.partnershipsetting[3].partnership,
                  master: MasterP.partnershipsetting[3].partnership - dbAdmin.partnershipsetting[3].partnership,
                  subadmin: SubadminP.partnershipsetting[3].partnership - MasterP.partnershipsetting[3].partnership,
                  admin: 100 - SubadminP.partnershipsetting[3].partnership,
               }
            ];

            var Parentcommission = [
               {
                  sport_id: 4,
                  sport_name: "cricket",
                  manager: dbAdmin.commissionsetting[0].commission,
                  master: MasterP.commissionsetting[0].commission - dbAdmin.commissionsetting[0].commission,
                  subadmin: SubadminP.commissionsetting[0].commission - MasterP.commissionsetting[0].commission,
                  admin: 100 - SubadminP.commissionsetting[0].commission,
               },
               {
                  sport_id: 1,
                  sport_name: "soccer",
                  manager: dbAdmin.commissionsetting[1].commission,
                  master: MasterP.commissionsetting[1].commission - dbAdmin.commissionsetting[1].commission,
                  subadmin: SubadminP.commissionsetting[1].commission - MasterP.commissionsetting[1].commission,
                  admin: 100 - SubadminP.commissionsetting[1].commission,
               },
               {
                  sport_id: 2,
                  sport_name: "tennis",
                  manager: dbAdmin.commissionsetting[2].commission,
                  master: MasterP.commissionsetting[2].commission - dbAdmin.commissionsetting[2].commission,
                  subadmin: SubadminP.commissionsetting[2].commission - MasterP.commissionsetting[2].commission,
                  admin: 100 - SubadminP.commissionsetting[2].commission,
               },
               {
                  sport_id: 'c9',
                  sport_name: "casino",
                  manager: dbAdmin.commissionsetting[3].commission,
                  master: MasterP.commissionsetting[3].commission - dbAdmin.commissionsetting[3].commission,
                  subadmin: SubadminP.commissionsetting[3].commission - MasterP.commissionsetting[3].commission,
                  admin: 100 - SubadminP.commissionsetting[3].commission,
               }
            ];

            var sportsetting = [
               {
                  sport_id: 4,
                  sport_name: "cricket",
                  min_bet: request.newUser.cricket_min_bet,
                  max_bet: request.newUser.cricket_max_bet,
                  bet_delay: request.newUser.cricket_bet_delay,
               },
               {
                  sport_id: 1,
                  sport_name: "soccer",
                  min_bet: request.newUser.soccer_min_bet,
                  max_bet: request.newUser.soccer_max_bet,
                  bet_delay: request.newUser.soccer_bet_delay,
               },
               {
                  sport_id: 2,
                  sport_name: "tennis",
                  min_bet: request.newUser.tennis_min_bet,
                  max_bet: request.newUser.tennis_max_bet,
                  bet_delay: request.newUser.tennis_bet_delay,
               },
               {
                  sport_id: 'c9',
                  sport_name: "casino",
                  min_bet: 100,
                  max_bet: 50000,
                  bet_delay: 5,
               }
            ];

            //set user details
            var user = new User();
            user.username = request.newUser.username.toUpperCase();
            user.fullname = request.newUser.fullname;
            user.setDefaults();
            user.setPassword(request.newUser.password);
            user.settransPassword(request.newUser.password);
            user.role = request.newUser.role;
            user.status = 'active';
            user.city = request.newUser.city;
            user.mobile = request.newUser.mobile;
            user.exposurelimit = request.newUser.exposurelimit;
            user.creditrefrence = request.newUser.creditrefrence;
            user.manager = dbAdmin.username;
            user.master = dbAdmin.master;
            user.subadmin = dbAdmin.subadmin;
            user.admin = dbAdmin.admin;
            user.ParentUser = dbAdmin.username;
            user.casinobalance = 0;
            user.sportsetting = sportsetting;
            user.Parentpartnership = Parentpartnership;
            user.Parentcommission = Parentcommission;
            user.openingDate = new Date();


            //log end
            user.save(function (err) {
               if (err) {
                  logger.error('create-user-success: DBError in UserDetails');
                  socket.emit("create-user-success", {
                     "message": "Error in saving user details.",
                     error: true
                  });
               } else {
                  //log start
                  var log = new Log();
                  log.username = user.username.toUpperCase();
                  log.action = 'ACCOUNT';
                  log.subAction = 'ACCOUNT_CREATE';
                  log.description = 'New account created.';
                  log.manager = user.manager;
                  log.master = user.master;
                  log.subadmin = user.subadmin;
                  log.admin = user.admin;
                  log.actionBy = dbAdmin.username;
                  log.time = new Date();
                  log.deleted = false;
                  log.save(function (err) {
                     if (err) {
                        logger.error('create-user-error: Log entry failed.');
                     }
                  });
                  // console.log('create-user-success: User account created successfully.');
                  // socket.emit("create-user-success", user);
                  socket.emit("create-user-success", {
                     "message": "User created success",
                     error: false,
                     user: user
                  });
               }
            });
         });
      });
   } else {

      if (request.newUser.role == "subadmin") {
         if (request.details.role != 'admin') {
            socket.emit("create-user-success", {
               "message": "Not Authorized.",
               error: true
            });
            return;
         }
      }

      if (request.newUser.role == "master") {
         if (request.details.role != 'subadmin') {
            socket.emit("create-user-success", {
               "message": "Not Authorized.",
               error: true
            });
            return;
         }
      }
      if (request.newUser.role == "manager") {
         if (request.details.role != 'master') {
            socket.emit("create-user-success", {
               "message": "Not Authorized.",
               error: true
            });
            return;
         }
      }


      // authenticate admin
      User.findOne({
         username: request.details.username.toUpperCase(),
         role: request.details.role,
         status: 'active',
         deleted: false,
         hash: request.details.key
      }, function (err, dbAdmin) {
         if (err) {
            logger.debug(err);
            return;
         }
         if (dbAdmin) {
            // console.log(dbAdmin);
            if (!dbAdmin.validTransPassword(request.details.transpassword)) {
               dbAdmin.loginAttempts += 1;
               logger.error('create-user-success: Invalid Transaction password ' + request.details.username);
               // console.log('create-user-success: Invalid Transaction password');
               socket.emit('create-user-success', {
                  "message": "Invalid Transaction password",
                  error: true
               });
               return;
            }

            User.findOne({
               username: request.newUser.username.toUpperCase()
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
                     error: true,
                     user: userCheck
                  });
                  return;
               } else {

                  var commissionsetting = [
                     {
                        sport_id: 4,
                        sport_name: "cricket",
                        commission: request.newUser.cricket_commission,
                     },
                     {
                        sport_id: 1,
                        sport_name: "soccer",
                        commission: request.newUser.soccer_commission,
                     },
                     {
                        sport_id: 2,
                        sport_name: "tennis",
                        commission: request.newUser.tennis_commission,
                     },
                     {
                        sport_id: "c9",
                        sport_name: "casino",
                        commission: request.newUser.cricket_commission,
                     }
                  ];

                  var partnershipsetting = [
                     {
                        sport_id: 4,
                        sport_name: "cricket",
                        partnership: request.newUser.cricket_partnership,
                     },
                     {
                        sport_id: 1,
                        sport_name: "soccer",
                        partnership: request.newUser.soccer_partnership,
                     },
                     {
                        sport_id: 2,
                        sport_name: "tennis",
                        partnership: request.newUser.tennis_partnership,
                     },
                     {
                        sport_id: "c9",
                        sport_name: "casino",
                        partnership: request.newUser.cricket_partnership,
                     }
                  ];

                  if (request.newUser.role == "manager") {
                     var MasterP = await User.findOne({ username: dbAdmin.username }, { partnershipsetting: 1, commissionsetting: 1 });
                     var SubadminP = await User.findOne({ username: dbAdmin.subadmin }, { partnershipsetting: 1, commissionsetting: 1 });

                     var Parentpartnership = [
                        {
                           sport_id: 4,
                           sport_name: "cricket",
                           Own: request.newUser.cricket_partnership,
                           master: MasterP.partnershipsetting[0].partnership - request.newUser.cricket_partnership,
                           subadmin: SubadminP.partnershipsetting[0].partnership - MasterP.partnershipsetting[0].partnership,
                           admin: 100 - SubadminP.partnershipsetting[0].partnership,
                        },
                        {
                           sport_id: 1,
                           sport_name: "soccer",
                           Own: request.newUser.soccer_partnership,
                           master: MasterP.partnershipsetting[1].partnership - request.newUser.soccer_partnership,
                           subadmin: SubadminP.partnershipsetting[1].partnership - MasterP.partnershipsetting[0].partnership,
                           admin: 100 - SubadminP.partnershipsetting[0].partnership,
                        },
                        {
                           sport_id: 2,
                           sport_name: "tennis",
                           Own: request.newUser.tennis_partnership,
                           master: MasterP.partnershipsetting[2].partnership - request.newUser.tennis_partnership,
                           subadmin: SubadminP.partnershipsetting[2].partnership - MasterP.partnershipsetting[0].partnership,
                           admin: 100 - SubadminP.partnershipsetting[0].partnership,
                        },
                        {
                           sport_id: 'c9',
                           sport_name: "casino",
                           Own: request.newUser.cricket_partnership,
                           master: MasterP.partnershipsetting[3].partnership - request.newUser.cricket_partnership,
                           subadmin: SubadminP.partnershipsetting[3].partnership - MasterP.partnershipsetting[0].partnership,
                           admin: 100 - SubadminP.partnershipsetting[0].partnership,
                        }
                     ];

                     var Parentcommission = [
                        {
                           sport_id: 4,
                           sport_name: "cricket",
                           Own: request.newUser.cricket_commission,
                           master: MasterP.commissionsetting[0].commission - request.newUser.cricket_commission,
                           subadmin: SubadminP.commissionsetting[0].commission - MasterP.commissionsetting[0].commission,
                           admin: 100 - SubadminP.commissionsetting[0].commission,
                        },
                        {
                           sport_id: 1,
                           sport_name: "soccer",
                           Own: request.newUser.soccer_commission,
                           master: MasterP.commissionsetting[1].commission - request.newUser.soccer_commission,
                           subadmin: SubadminP.commissionsetting[1].commissio - MasterP.commissionsetting[0].commission,
                           admin: 100 - SubadminP.commissionsetting[0].commission,
                        },
                        {
                           sport_id: 2,
                           sport_name: "tennis",
                           Own: request.newUser.tennis_commission,
                           master: MasterP.commissionsetting[2].commission - request.newUser.tennis_commission,
                           subadmin: SubadminP.commissionsetting[2].commission - MasterP.commissionsetting[0].commission,
                           admin: 100 - SubadminP.commissionsetting[0].commission,
                        },
                        {
                           sport_id: 'c9',
                           sport_name: "casino",
                           Own: request.newUser.cricket_commission,
                           master: MasterP.commissionsetting[3].commission - request.newUser.cricket_commission,
                           subadmin: SubadminP.commissionsetting[3].commission - MasterP.commissionsetting[0].commission,
                           admin: 100 - SubadminP.commissionsetting[0].commission,
                        }
                     ];

                  } else if (request.newUser.role == "master") {
                     var SubadminP = await User.findOne({ username: dbAdmin.username }, { partnershipsetting: 1, commissionsetting: 1 });

                     var Parentpartnership = [
                        {
                           sport_id: 4,
                           sport_name: "cricket",
                           Own: request.newUser.cricket_partnership,
                           subadmin: SubadminP.partnershipsetting[0].partnership - request.newUser.cricket_partnership,
                           admin: 100 - SubadminP.partnershipsetting[3].partnership,
                        },
                        {
                           sport_id: 1,
                           sport_name: "soccer",
                           Own: request.newUser.soccer_partnership,
                           subadmin: SubadminP.partnershipsetting[1].partnership - request.newUser.soccer_partnership,
                           admin: 100 - SubadminP.partnershipsetting[3].partnership,
                        },
                        {
                           sport_id: 2,
                           sport_name: "tennis",
                           Own: request.newUser.tennis_partnership,
                           subadmin: SubadminP.partnershipsetting[2].partnership - request.newUser.tennis_partnership,
                           admin: 100 - SubadminP.partnershipsetting[3].partnership,
                        },
                        {
                           sport_id: 'c9',
                           sport_name: "casino",
                           Own: request.newUser.cricket_partnership,
                           subadmin: SubadminP.partnershipsetting[3].partnership - request.newUser.cricket_partnership,
                           admin: 100 - SubadminP.partnershipsetting[3].partnership,
                        }
                     ];

                     var Parentcommission = [
                        {
                           sport_id: 4,
                           sport_name: "cricket",
                           Own: request.newUser.cricket_commission,
                           subadmin: SubadminP.commissionsetting[0].commission - request.newUser.cricket_commission,
                           admin: 100 - SubadminP.commissionsetting[0].commission,
                        },
                        {
                           sport_id: 1,
                           sport_name: "soccer",
                           Own: request.newUser.soccer_commission,
                           subadmin: SubadminP.commissionsetting[1].commission - request.newUser.soccer_commission,
                           admin: 100 - SubadminP.commissionsetting[0].commission,
                        },
                        {
                           sport_id: 2,
                           sport_name: "tennis",
                           Own: request.newUser.tennis_commission,
                           subadmin: SubadminP.commissionsetting[2].commission - request.newUser.tennis_commission,
                           admin: 100 - SubadminP.commissionsetting[0].commission,
                        },
                        {
                           sport_id: 'c9',
                           sport_name: "casino",
                           Own: request.newUser.cricket_commission,
                           subadmin: SubadminP.commissionsetting[3].commission - request.newUser.cricket_commission,
                           admin: 100 - SubadminP.commissionsetting[0].commission,
                        }
                     ];

                  } else if (request.newUser.role == "subadmin") {
                     // var AdminP = await User.findOne({username: getUser.admin },{partnershipsetting:1,commissionsetting:1});

                     var Parentpartnership = [
                        {
                           sport_id: 4,
                           sport_name: "cricket",
                           Own: request.newUser.cricket_partnership,
                           admin: 100 - request.newUser.cricket_partnership,
                        },
                        {
                           sport_id: 1,
                           sport_name: "soccer",
                           Own: request.newUser.soccer_partnership,
                           admin: 100 - request.newUser.soccer_partnership,
                        },
                        {
                           sport_id: 2,
                           sport_name: "tennis",
                           Own: request.newUser.tennis_partnership,
                           admin: 100 - request.newUser.tennis_partnership,
                        },
                        {
                           sport_id: 'c9',
                           sport_name: "casino",
                           Own: request.newUser.cricket_partnership,
                           admin: 100 - request.newUser.cricket_partnership,
                        }
                     ];

                     var Parentcommission = [
                        {
                           sport_id: 4,
                           sport_name: "cricket",
                           Own: request.newUser.cricket_commission,
                           admin: 100 - request.newUser.cricket_commission,
                        },
                        {
                           sport_id: 1,
                           sport_name: "soccer",
                           Own: request.newUser.soccer_commission,
                           admin: 100 - request.newUser.soccer_commission,
                        },
                        {
                           sport_id: 2,
                           sport_name: "tennis",
                           Own: request.newUser.tennis_commission,
                           admin: 100 - request.newUser.tennis_commission,
                        },
                        {
                           sport_id: 'c9',
                           sport_name: "casino",
                           Own: request.newUser.cricket_commission,
                           admin: 100 - request.newUser.cricket_commission,
                        }
                     ];

                  }




                  //create new user

                  //set user details
                  var user = new User();
                  user.username = request.newUser.username.toUpperCase();
                  user.fullname = request.newUser.fullname;
                  user.setDefaults();
                  user.setPassword(request.newUser.password);
                  user.settransPassword(request.newUser.password);
                  user.role = request.newUser.role;
                  user.status = 'active';
                  user.city = request.newUser.city;
                  user.mobile = request.newUser.mobile;
                  user.creditrefrence = request.newUser.creditrefrence;
                  user.exposurelimit = 0;
                  if (request.newUser.role == "manager") {
                     user.master = dbAdmin.username;
                     user.subadmin = dbAdmin.subadmin;
                     user.admin = dbAdmin.admin;
                  }
                  if (request.newUser.role == "master") {
                     user.subadmin = dbAdmin.username;
                     user.admin = dbAdmin.admin;
                  }
                  if (request.newUser.role == "subadmin") {
                     user.admin = dbAdmin.username;
                  }
                  user.ParentUser = dbAdmin.username;
                  user.casinobalance = 0;
                  user.commissionsetting = commissionsetting;
                  user.partnershipsetting = partnershipsetting;
                  user.Parentpartnership = Parentpartnership;
                  user.Parentcommission = Parentcommission;
                  user.openingDate = new Date();
                  user.save(function (err) {
                     if (err) {
                        // console.log(err)
                        logger.error('create-user-error: DBError in Users');
                        // console.log('Error in creating record');
                        socket.emit("create-user-success", {
                           "message": "Error in creating record",
                           error: true
                        });
                        return;
                     } else {

                        // Market.distinct('marketId', {
                        //    visible: true,
                        //    'marketBook.status': {
                        //       $in: ['OPEN', 'SUSPENDED']
                        //    }
                        // }, function (err, distinctMarket) {
                        //    if (distinctMarket.length == 0) return;
                        //    for (var m = 0; m < distinctMarket.length; m++) {
                        //       var marketdistinct = distinctMarket[m];
                        //       Market.findOne({
                        //          'marketId': marketdistinct,
                        //       }, {
                        //          managers: 1,
                        //          managerStatus: 1
                        //       }, function (err, chMarket) {

                        //          chMarket.managers.push(userLogin.username.toUpperCase());

                        //          chMarket.save(function (err) { });
                        //       });
                        //    }
                        // });


                        //log start
                        var log = new Log();
                        log.username = dbAdmin.username.toUpperCase();
                        log.action = 'ACCOUNT';
                        log.subAction = 'ACCOUNT_CREATE';
                        log.description = 'New account created.';
                        if (request.newUser.role == "manager") {
                           log.master = user.master;
                           log.subadmin = user.subadmin;
                           log.admin = user.admin;
                        }
                        if (request.newUser.role == "master") {
                           log.subadmin = user.subadmin;
                           log.admin = user.admin;
                        }
                        if (request.newUser.role == "subadmin") {
                           log.admin = user.admin;
                        }
                        log.actionBy = dbAdmin.username;
                        log.time = new Date();
                        log.deleted = false;
                        log.save(function (err) {
                           if (err) {
                              logger.error('create-user-error: Log entry failed.');
                           }
                        });

                        // socket.emit("create-user-success", user);
                        socket.emit("create-user-success", {
                           "message": "User created success",
                           error: false,
                           user: user
                        });

                     }
                  });
               }
            });

         }
      });
   }



}

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
   }, function (err, user) {

      // console.log();

      if (err) logger.debug(err);
      // Check username

      if (!user) {
         logger.error('login-error: User not found ' + request.user.username);
         socket.emit('login-error', {
            "message": "User not found",
            error: true
         });
         return;
      }
      if (user.role == "user") {
         logger.error('login-error: User not found ' + request.user.username);
         socket.emit('login-error', {
            "message": "User not found",
            error: true
         });
         return;
      }
      // Check password
      if (!user.validPassword(request.user.password)) {
         user.loginAttempts += 1;
         logger.error('login-error: Invalid password ' + request.user.username);
         socket.emit('login-error', {
            "message": "Invalid password",
            error: true
         });
         return;
      }
      // Reset login attempts counter
      user.loginAttempts = 0;
      // user.save(function (err, updatedUser) { });

      // Check deleted or blocked account
      if (user.status != 'active') {
         logger.error('login-error: Account is blocked or deleted' + request.user.username);
         socket.emit('login-error', {
            "message": "Account is not accessible anymore. Contact the admin to activate the account.",
            error: true
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
         transctionpasswordstatus: user.transctionpasswordstatus
         // type:user.type,
         // mobile:user.mobile,
         // balance:user.balance,
         // mainbalance:user.mainbalance,
         // exposure:user.exposure,
         // limit:user.limit,

      };
      const token = Helper.generateToken(user._id);
      user.token = token;
      user.save(function (err, updatedUser) { });

      output._id = user._id;
      output.key = user.hash;
      output.apitoken = token;
      output.details = userDetails;
      socket.emit("login-success", {
         output: output
      });
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

module.exports.changePassword = function (io, socket, request) {
   // - validate request data
   // console.log(request);  

   if (!request) return;
   if (!request.details || !request.details._id || !request.details.key) return;
   if (!request.details.username || !request.details.role) return;
   if (!request.targetUser.username || !request.targetUser.password || !request.targetUser.role) return;
   // console.log(request);

   // if (request.targetUser.role == 'user') {
   // console.log("1111",request.details.role);
   if (request.details.role != 'admin' && request.details.role != 'manager' && request.details.role != 'master' && request.details.role != 'subadmin') return;
   // authenticate manager
   console.log("222", request.details.role);
   var output = {};
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
            error: true
         });
         return;
      }

      User.findOne({
         username: request.targetUser.username,
         role: request.targetUser.role,
         deleted: false
      }, function (err, result) {
         // console.log(result);
         if (err) logger.error(err);
         if (!result) {
            socket.emit("update-password-success", {
               "message": "User not found. Please try again.",
               error: true
            });
            return;
         }
         var transstatus = false;
         var TransPass = 0;
         // var login = new User();
         if (result.transctionpasswordstatus == 0) {
            transstatus = true;
            TransPass = Math.floor(100000 + Math.random() * 900000).toString();
            console.log(TransPass, request.targetUser.password);
            result.settransPassword(TransPass);
            // result.transctionpasswordhash = login.transctionpasswordhash;
            // result.transctionpasswordsalt = login.transctionpasswordsalt;
            result.transctionpasswordstatus = 1;
            result.transctionpassword = TransPass;
         }

         result.setPassword(request.targetUser.password);
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
         output.details = userDetails;

         result.save(function (err, updatedLogin) {
            if (err) logger.error(err);

            socket.emit("update-password-success", {
               "message": "Password changed successfully.",
               "transstatus": transstatus,
               "transPass": TransPass,
               "output": output,
               error: false
            });
            Session.remove({
               username: request.targetUser.username
            });
         });
      });
   });
   // }

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
   if (request.details.role != 'admin' && request.details.role != 'manager' && request.details.role != 'master' && request.details.role != 'subadmin') return;
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
            error: true
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
            error: false
         });
         Session.remove({
            username: request.targetUser.username
         });
      });
   });
   // }

}

module.exports.getBalance = function (io, socket, request) {

   // console.log(request);
   if (!request) return;
   if (!request.details) return;
   // ("getUser: request=" + JSON.stringify(request));

   User.findOne({
      username: request.details.username,
      role: request.details.role,
      deleted: false,
      hash: request.details.key
   }, { _id: 1 }, function (err, dbAdmin) {
      if (err) logger.error(err);
      // console.log(dbAdmin);
      User.findOne({
         username: request.targetUser.username,
      }, { balance: 1 }, function (err, user) {
         // console.log(user);
         socket.emit('parentuser-balance-success', user);
      });

   });

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

module.exports.generalReport = function (req, res) {
   try {
      // console.log(req.body);
      let { pageNumber, sortBy, limit } = req.body;

      var filter = {
         "$or": [{ "manager": req.body.details.username }, { "username": req.body.details.username }],
         "role": "user"
      };

      if (req.body.details.role == "master") {
         filter = {
            "$or": [{ "master": req.body.details.username }, { "username": req.body.details.username }],
            "role": "manager"
         };
      }

      if (req.body.details.role == "subadmin") {
         filter = {
            "$or": [{ "subadmin": req.body.details.username }, { "username": req.body.details.username }],
            "role": "master"
         };
      }

      if (req.body.details.role == "admin") {
         filter = {
            "$or": [{ "admin": req.body.details.username }, { "username": req.body.details.username }],
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
      User.find(filter, { username: 1, balance: 1, casinobalance: 1, role: 1, creditrefrence: 1, manager: 1 }, { skip: setskip, limit: setlimit }).sort({
         username: 1
      }).exec(function (err, dbMarket) {

         res.json({ response: dbMarket, error: false, "message": "server response success" });

      });
   } catch (err) {
      console.log(err)
      res.json({ response: err, error: true, "message": "server response error" });
   }

}

module.exports.casinoReport = function (req, res) {
   try {
      // console.log(req.body.filter);
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

         res.json({ response: dbMarket, error: false, "message": "server response success" });

      });
   } catch (err) {
      console.log(err)
      res.json({ response: err, error: true, "message": "server response error" });
   }

}

module.exports.updateCredit = async function (req, res) {
   // - validate request data
   // console.log(req.body);

   if (!req.body) return;
   if (!req.body.details || !req.body.details._id || !req.body.details.key) return;
   if (!req.body.details.username || !req.body.details.role) return;
   if (!req.body.targetUser.username || !req.body.targetUser.credit || !req.body.targetUser.role) return;
   // console.log(request);

   if (req.body.details.role != 'admin' && req.body.details.role != 'manager' && req.body.details.role != 'master' && req.body.details.role != 'subadmin') return;
   // authenticate manager
   User.findOne({
      username: req.body.details.username,
      role: req.body.details.role,
      status: 'active',
      deleted: false,
      hash: req.body.details.key
   }, function (err, dbAdmin) {
      // console.log(dbAdmin);
      if (err) logger.error(err);
      if (!dbAdmin) return;

      if (!dbAdmin.validTransPassword(req.body.details.transpassword)) {
         dbAdmin.loginAttempts += 1;
         logger.error('update-password-success: Invalid Transaction password ' + req.body.details.username);
         return res.json({ response: [], error: true, "message": "Invalid Transaction password " });
      }

      const update = {
         creditrefrence: req.body.targetUser.credit,
      };

      User.findOneAndUpdate({ username: req.body.targetUser.username, role: req.body.targetUser.role, },
         update, function (err, docs) {
            if (err) {
               console.log("DB error: Application error ", err);
               return res.json({ response: [], error: true, "message": "DB error: Application error " });
            }
            else {

               var logSave = new Log();
               logSave.username = req.body.targetUser.username;
               logSave.action = 'CREDIT_REFRENCE';
               logSave.subAction = 'CREDIT_REFRENCE';
               logSave.oldLimit = req.body.targetUser.oldcredit;
               logSave.newLimit = req.body.targetUser.credit;
               logSave.description = 'Credit refrence updated. Old Limit: ' + req.body.targetUser.oldcredit + ' . New Limit: ' + req.body.targetUser.credit;
               logSave.manager = req.body.details.username;
               logSave.remark = req.body.targetUser.remark;
               logSave.actionBy = req.body.details.username;
               logSave.time = new Date();
               logSave.deleted = false;
               //console.log(log);
               logSave.save(function (err) {
                  if (err) { }

                  res.send({ data: docs, error: false, message: "Credit refrence updated sucessfully" });
               });


            }
         })
   });


}

module.exports.updateExposure = async function (req, res) {
   // - validate request data
   console.log(req.body);

   if (!req.body) return;
   if (!req.body.details || !req.body.details._id || !req.body.details.key) return;
   if (!req.body.details.username || !req.body.details.role) return;
   if (!req.body.targetUser.username || !req.body.targetUser.exposure || !req.body.targetUser.role) return;
   // console.log(request);

   if (req.body.details.role != 'admin' && req.body.details.role != 'manager' && req.body.details.role != 'master' && req.body.details.role != 'subadmin') return;
   // authenticate manager
   User.findOne({
      username: req.body.details.username,
      role: req.body.details.role,
      status: 'active',
      deleted: false,
      hash: req.body.details.key
   }, function (err, dbAdmin) {
      // console.log(dbAdmin);
      if (err) logger.error(err);
      if (!dbAdmin) return;

      if (!dbAdmin.validTransPassword(req.body.details.transpassword)) {
         dbAdmin.loginAttempts += 1;
         logger.error('update-password-success: Invalid Transaction password ' + req.body.details.username);
         return res.json({ response: [], error: true, "message": "Invalid Transaction password " });
      }

      const update = {
         exposurelimit: req.body.targetUser.exposure,
      };

      User.findOneAndUpdate({ username: req.body.targetUser.username, role: req.body.targetUser.role, },
         update, function (err, docs) {
            if (err) {
               console.log("DB error: Application error ", err);
               return res.json({ response: [], error: true, "message": "DB error: Application error " });
            }
            else {

               var logSave = new Log();
               logSave.username = req.body.targetUser.username;
               logSave.action = 'EXPOSURE_LIMIT';
               logSave.subAction = 'EXPOSURE_LIMIT';
               logSave.oldLimit = req.body.targetUser.oldexposure;
               logSave.newLimit = req.body.targetUser.exposure;
               logSave.description = 'Exposure limit updated. Old Limit: ' + req.body.targetUser.oldexposure + ' . New Limit: ' + req.body.targetUser.exposure;
               logSave.manager = req.body.details.username;
               logSave.remark = req.body.targetUser.remark;
               logSave.actionBy = req.body.details.username;
               logSave.time = new Date();
               logSave.deleted = false;
               //console.log(log);
               logSave.save(function (err) {
                  if (err) { }

                  res.send({ data: docs, error: false, message: "Exposure limit updated sucessfully" });
               });


            }
         })
   });


}

module.exports.updateStatus = async function (req, res) {
   // - validate request data
   // console.log(req.body);

   if (!req.body) return;
   if (!req.body.details || !req.body.details._id || !req.body.details.key) return;
   if (!req.body.details.username || !req.body.details.role) return;
   if (!req.body.targetUser.username || !req.body.targetUser.status || !req.body.targetUser.role) return;
   // console.log(request);

   if (req.body.details.role != 'admin' && req.body.details.role != 'manager' && req.body.details.role != 'master' && req.body.details.role != 'subadmin') return;
   // authenticate manager
   User.findOne({
      username: req.body.details.username,
      role: req.body.details.role,
      status: 'active',
      deleted: false,
      hash: req.body.details.key
   }, function (err, dbAdmin) {
      // console.log(dbAdmin);
      if (err) logger.error(err);
      if (!dbAdmin) return;

      if (!dbAdmin.validTransPassword(req.body.details.transpassword)) {
         dbAdmin.loginAttempts += 1;
         logger.error('update-password-success: Invalid Transaction password ' + req.body.details.username);
         // console.log("Invalid Transaction password");
         return res.json({ response: [], error: true, "message": "Invalid Transaction password" });
      }

      const update = {
         status: req.body.targetUser.status,
      };

      User.findOneAndUpdate({ username: req.body.targetUser.username, role: req.body.targetUser.role, },
         update, function (err, docs) {
            if (err) {
               console.log("DB error: Application error ", err);
               return res.json({ response: [], error: true, "message": "DB error: Application error " });
            }
            else {
               // console.log("Status Changed password");
               res.send({ data: docs, error: false, message: "Status Changed sucessfully" });

            }
         })
   });


}

module.exports.getLockStatus = async function (req, res) {
   try {
      // console.log(req.body);
      let { eventId, details, bettype } = req.body;

      Lock.findOne({ "eventId": eventId, bettype: bettype }, { userBlocks: 1 })
         .then(async data => {
            var status = false;
            // console.log(data)
            if (data) {
               let lockusers = data.userBlocks;
               if (lockusers.includes(details.username)) {
                  status = true;
               }
               res.json({ response: status, error: false, "message": "server response success" });
            }
            else {

               res.json({ response: status, error: false, "message": "server response success" });
            }
         })
   } catch (err) {
      // console.log(err)
      res.json({ response: err, error: true, "message": "server response success" });
   }
}

module.exports.getParentLockStatus = async function (req, res) {
   try {
      // console.log(req.body);
      let { eventId, details, bettype } = req.body;

      Lock.findOne({ "eventId": eventId, bettype: bettype }, { userBlocks: 1 })
         .then(async data => {
            var status = false;
            // console.log(data)
            if (data) {
               let lockusers = data.userBlocks;
               if (lockusers.includes(details.master)) {
                  status = true;
               }
               if (lockusers.includes(details.subadmin)) {
                  status = true;
               }
               if (lockusers.includes(details.admin)) {
                  status = true;
               }
               res.json({ response: status, error: false, "message": "server response success" });
            }
            else {

               res.json({ response: status, error: false, "message": "server response success" });
            }
         })
   } catch (err) {
      // console.log(err)
      res.json({ response: err, error: true, "message": "server response success" });
   }
}

module.exports.getLockUserList = async function (req, res) {
   try {
      // console.log(req.body);
      if (!req.body) return;
      if (!req.body.details) return;
      let { details, eventId, bettype } = req.body;
      User.find({ ParentUser: details.username }, { username: 1 }).sort({
         username: 1
      }).exec(async function (err, getUser) {

         if (getUser) {

            var lockusers = [];
            var Users = await Lock.findOne({ "eventId": eventId, bettype: bettype }, { userBlocks: 1 });
            if (Users) {
               lockusers = Users.userBlocks;
            }
            // console.log(lockusers)
            for (var i = 0; i < getUser.length; i++) {
               // console.log(getUser[i].username);
               var status = false;
               if (lockusers.includes(getUser[i].username) || lockusers.includes(details.username)) {
                  status = true;
               }
               getUser[i].status = status;
            }
            res.json({ response: getUser, error: false, "message": "User List Succes" });
         } else {
            res.json({ response: [], error: false, "message": "Empty User List " });
         }
      });
   } catch (err) {
      console.log(err)
      res.json({ response: err, error: true, "message": "server response success" });
   }
}

module.exports.getUserList = async function (req, res) {
   try {

      // console.log(req.body);
      if (!req.body) return;
      if (!req.body.details || !req.body.details._id) return;

      let { search, pageNumber, sortBy, limit } = req.body;

      User.findOne({
         username: req.body.details.username,
         role: req.body.details.role,
         status: 'active',
         deleted: false,
         // hash: req.body.details.key
      },async function (err, dbAdmin) {
         // console.log(dbAdmin);
         if (err) logger.error(err);
         if (!dbAdmin) return;

         var filter = {
            manager: req.body.username,
            role: "user",
            deleted: false,
         };

         if (req.body.role == "master") {
            filter = {
               master: req.body.username,
               role: "manager",
               deleted: false,
            };
         }

         if (req.body.role == "subadmin") {
            filter = {
               subadmin: req.body.username,
               role: "master",
               deleted: false,
            };
         }

         if (req.body.role == "admin") {
            filter = {
               admin: req.body.username,
               role: "subadmin",
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

         var findUser = await User.findOne({username:req.body.username}, { _id: 1, partnershipsetting: 1, role:1 });
         // console.log(findUser.role);
            for (var k = 0; k < findUser.partnershipsetting.length; k++) {
               if (findUser.partnershipsetting[k].sport_id == 4) {
                  upperpercentage = findUser.partnershipsetting[k].partnership;
               }
            }


         User.find(filter, {}, { skip: setskip, limit: setlimit }).sort({
            username: 1
         }).exec(async function (err, getUser) {
            // console.log(getUser.length);

            // res.json({ response: users, error: false, "message": "User List Succes" });
            if (getUser) {

               for (var i = 0; i < getUser.length; i++) {
                  var totalbalance = 0;
                  var ownpercentage = 100;
                  if(getUser[i].role != "user"){
                     for (var k = 0; k < getUser[i].partnershipsetting.length; k++) {
                        if (getUser[i].partnershipsetting[k].sport_id == 4) {
                           ownpercentage = getUser[i].partnershipsetting[k].partnership;
                        }
                     }
                  }
                  var filter1 = {
                     username: getUser[i].username,
                  };
                  console.log("BB6666",i,getUser[i].username,getUser[i].role,getUser[i].availableAmount);
                  if (getUser[i].role == "manager") {
                     totalbalance = getUser[i].availableAmount;
                     filter1 = {
                        manager: getUser[i].username,
                     };
                  }

                  if (getUser[i].role == "master") {
                     totalbalance = getUser[i].availableAmount;
                     filter1 = {
                        master: getUser[i].username,
                     };
                  }

                  if (getUser[i].role == "subadmin") {
                     totalbalance = getUser[i].availableAmount;
                     filter1 = {
                        subadmin: getUser[i].username,
                     };
                  }

                  // console.log(filter1);
                  var total_exposure = 0;
                  // console.log("calculate exposure", filter1, getUser[i].role, getUser[i].username);
                   await getuserexposure(getUser[i].role,getUser[i].username, function (exposure) {
                        // console.log(exposure);
                        total_exposure = exposure;
                  })

                  // console.log("total exposure",getUser[i].username,total_exposure);
                  var ischild = 0;
                  var childUsers = await User.find(filter1, { _id: 1, username: 1,role:1, limit: 1,availableAmount:1, exposure: 1 });
                  // console.log(childUsers.length);
                  if (childUsers.length > 0) {
                     ischild = 1;
                     for (var j = 0; j < childUsers.length; j++) {
                        console.log("BB7777",i,getUser[i].role,getUser[i].username,childUsers[j].username,childUsers[j].role,childUsers[j].limit);
                        
                        if(getUser[i].role == "user"){
                           total_exposure += childUsers[j].exposure;
                        }
                        if(childUsers[j].role == "user"){
                           totalbalance += childUsers[j].limit;
                        }else{
                           totalbalance += childUsers[j].availableAmount;
                        }
                        
                     }
                  }
                  // console.log("ischild",ischild);
                     if(totalbalance > 0 && ischild == 1){
                        console.log("BB8888",i,totalbalance,upperpercentage,ownpercentage);
                        if(findUser.role == "master"){
                           upperpercentage = ownpercentage + ownpercentage;
                        }
                        var totalpl = totalbalance - getUser[i].creditrefrence;
                        if(getUser[i].role != "user"){
                           var clientPl = (totalpl * (upperpercentage - ownpercentage))/100;
                           totalbalance = (totalbalance + (-1 * totalpl) + (-1 * clientPl));
                        }else{
                           var clientPl = totalpl;
                        }
                        console.log("AB8899",i,totalbalance,totalpl,clientPl);
                     }else{
                        clientPl = 0;
                     }

                     // console.log("BB9999",i,totalbalance,clientPl);

                  getUser[i].clientPl = clientPl;
                  getUser[i].totalbalance = totalbalance;
                  getUser[i].totalexposure = total_exposure;
                  
               }

               res.json({ response: getUser, error: false, "message": "User List Succes" });
            } else {
               res.json({ response: [], error: true, "message": "Empty User List " });
            }

         });
      });
   } catch (e) {
      return res.json({ response: [], error: true, "message": "DB error: Application error " });
   }
}

module.exports.updateDeposit = async function (req, res) {
   try {

      // console.log(req.body);

      if (!req.body) return;
      if (!req.body.details || !req.body.details._id || !req.body.details.key) return;
      if (!req.body.details.username || !req.body.details.role) return;
      if (!req.body.targetUser.username || !req.body.targetUser.amount || !req.body.targetUser.role) return;
      // console.log(request);

      if (req.body.details.role != 'admin' && req.body.details.role != 'manager' && req.body.details.role != 'master' && req.body.details.role != 'subadmin') return;
      // authenticate manager
      User.findOne({
         username: req.body.details.username,
         role: req.body.details.role,
         status: 'active',
         deleted: false,
         hash: req.body.details.key
      }, function (err, dbAdmin) {
         // console.log(dbAdmin);
         if (err) logger.error(err);
         if (!dbAdmin) return;

         if (!dbAdmin.validTransPassword(req.body.details.transpassword)) {
            dbAdmin.loginAttempts += 1;
            logger.error('update-password-success: Invalid Transaction password ' + req.body.details.username);
            console.log("Invalid Transaction password");
            return res.json({ response: [], error: true, "message": "Invalid Transaction password" });
         }

         User.findOne({ username: req.body.targetUser.username.toUpperCase(), role: req.body.targetUser.role },
            {
               username: 1, balance: 1, availableAmount: 1, exposure: 1, limit: 1, manager: 1, ParentUser: 1
            }, function (err, dbUser) {
               if (!dbUser) return;
               User.findOne({ username: dbUser.ParentUser, },
                  {
                     username: 1, balance: 1, availableAmount: 1, exposure: 1, limit: 1
                  }, function (err, dbMUser) {
                     if (!dbMUser) {
                        return res.json({ response: [], error: true, "message": "user not found" });
                     } else {
                        dbMUser.availableAmount = dbMUser.availableAmount - req.body.targetUser.amount;
                        var date = moment().tz("Asia/Calcutta").format('YYYY-MM-DD');
                        if (dbMUser.availableAmount < 0) {
                           return res.json({ response: [], error: true, "message": " Your balance is low, please contact upline." });
                        } else {
                           User.findOneAndUpdate({
                              'username': req.body.targetUser.username.toUpperCase()
                           }, {
                              $inc: {
                                 balance: req.body.targetUser.amount,
                                 availableAmount: req.body.targetUser.amount,
                                 limit: req.body.targetUser.amount
                              }
                           }, async function (err, row1) {

                              User.findOneAndUpdate({
                                 'username': dbUser.ParentUser
                              }, {
                                 $inc: {
                                    balance: -1 * req.body.targetUser.amount,
                                    availableAmount: -1 * req.body.targetUser.amount,
                                    limit: -1 * req.body.targetUser.amount
                                 }
                              }, { new: true }, async function (err, row) {
                                 if (err) console.log(err)
                                 // console.log(row)
                                 var newlimit = parseFloat(dbUser.limit) + parseFloat(req.body.targetUser.amount);
                                 var newAvAmount = parseFloat(dbUser.availableAmount) + parseFloat(req.body.targetUser.amount);
                                 var oldlimit = dbUser.limit;
                                 var oldAvAmount = dbUser.availableAmount;
                                 var logSave = new Log();
                                 logSave.username = dbUser.username;
                                 logSave.action = 'BALANCE';
                                 logSave.subAction = 'BALANCE_DEPOSIT';
                                 logSave.oldLimit = dbUser.balance;
                                 logSave.amount = req.body.targetUser.amount;
                                 logSave.availableAmount = newAvAmount;
                                 logSave.newLimit = newlimit;
                                 logSave.mnewLimit = row.balance;
                                 logSave.description = 'Balance updated. Old Limit: ' + oldlimit + ' . New Limit: ' + newlimit;
                                 logSave.manager = dbUser.ParentUser;
                                 logSave.remark = req.body.targetUser.remark;
                                 logSave.time = new Date();
                                 logSave.deleted = false;
                                 logSave.createDate = date;
                                 logSave.from = dbUser.ParentUser;
                                 logSave.to = dbUser.username;
                                 //console.log(log);
                                 logSave.save(function (err) {
                                    if (err) { console.log(err) }

                                    var Moldlimit = parseFloat(row.limit) + parseFloat(req.body.targetUser.amount);
                                    var MoldAvAmount = parseFloat(row.availableAmount) + parseFloat(req.body.targetUser.amount);
                                    var Mnewlimit = row.limit;
                                    var MnewAvAmount = row.availableAmount;
                                    var LogM = new Log();
                                    LogM.username = dbUser.ParentUser;
                                    LogM.action = 'BALANCE';
                                    LogM.subAction = 'BALANCE_WITHDRAWL';
                                    LogM.oldLimit = Moldlimit;
                                    LogM.amount = -1 * req.body.targetUser.amount;
                                    LogM.availableAmount = MnewAvAmount;
                                    LogM.newLimit = Mnewlimit;
                                    LogM.description = 'Balance updated. Old Limit: ' + Moldlimit + ' . New Limit: ' + Mnewlimit;
                                    LogM.remark = req.body.targetUser.remark;
                                    LogM.time = new Date();
                                    LogM.createDate = date;
                                    LogM.deleted = false;
                                    LogM.from = dbUser.ParentUser;
                                    LogM.to = dbUser.username;
                                    LogM.save(function (err) { });

                                 });
                              });

                              // User.findOneAndUpdate({
                              //    'username': dbUser.ParentUser
                              // }, {
                              //    $inc: {
                              //       balance: -1 * req.body.targetUser.amount,
                              //       limit: -1 * req.body.targetUser.amount
                              //    }
                              // }, async function (err, row) { });
                              var userData = await User.findOne({ 'username': req.body.targetUser.username.toUpperCase() },
                                 {
                                    balance: 1, exposure: 1, limit: 1, username: 1
                                 });
                              return res.json({ response: userData, error: false, "message": "success" });
                           })
                        }
                     }
                  });
            });
      });
   } catch (e) {
      console.log(e)
   }
}

module.exports.updateWithdraw = async function (req, res) {
   try {
      // console.log(req.body)
      if (!req.body) return;
      if (!req.body.details || !req.body.details._id || !req.body.details.key) return;
      if (!req.body.details.username || !req.body.details.role) return;
      if (!req.body.targetUser.username || !req.body.targetUser.amount || !req.body.targetUser.role) return;
      // console.log(request);

      if (req.body.details.role != 'admin' && req.body.details.role != 'manager' && req.body.details.role != 'master' && req.body.details.role != 'subadmin') return;
      // authenticate manager
      User.findOne({
         username: req.body.details.username,
         role: req.body.details.role,
         status: 'active',
         deleted: false,
         hash: req.body.details.key
      }, function (err, dbAdmin) {
         // console.log(dbAdmin);
         if (err) logger.error(err);
         if (!dbAdmin) return;

         if (!dbAdmin.validTransPassword(req.body.details.transpassword)) {
            dbAdmin.loginAttempts += 1;
            logger.error('update-password-success: Invalid Transaction password ' + req.body.details.username);
            console.log("Invalid Transaction password");
            return res.json({ response: [], error: true, "message": "Invalid Transaction password" });
         }

         User.findOne({ username: req.body.targetUser.username.toUpperCase(), role: req.body.targetUser.role },
            {
               username: 1, balance: 1, availableAmount: 1, exposure: 1, limit: 1, manager: 1, ParentUser: 1
            }, async function (err, dbUser) {
               if (!dbUser) {
                  return resServer.json({ response: [], error: true, "message": "user not found" });
               } else {
                  if (req.body.targetUser.amount > dbUser.balance) {
                     return res.json({ response: [], error: true, "message": "Your balance is low, please contact upline." });
                  } else {
                     var date = moment().tz("Asia/Calcutta").format('YYYY-MM-DD');

                     User.findOneAndUpdate({
                        'username': dbUser.ParentUser
                     }, {
                        $inc: {
                           balance: req.body.targetUser.amount,
                           availableAmount: req.body.targetUser.amount,
                           limit: req.body.targetUser.amount
                        }
                     }, async function (err, row) {

                        User.findOneAndUpdate({
                           'username': req.body.targetUser.username.toUpperCase()
                        }, {
                           $inc: {
                              balance: -1 * req.body.targetUser.amount,
                              availableAmount: -1 * req.body.targetUser.amount,
                              limit: -1 * req.body.targetUser.amount
                           }
                        }, { new: true }, async function (err, row1) {
                           var newlimit = parseFloat(dbUser.limit) - parseFloat(req.body.targetUser.amount);
                           var newAvAmount = parseFloat(dbUser.availableAmount) - parseFloat(req.body.targetUser.amount);
                           var oldlimit = dbUser.limit;
                           var logSave = new Log();
                           logSave.username = dbUser.username;
                           logSave.action = 'BALANCE';
                           logSave.subAction = 'BALANCE_WITHDRAWL';
                           logSave.amount = -1 * req.body.targetUser.amount;
                           logSave.availableAmount = newAvAmount;
                           logSave.oldLimit = dbUser.balance;
                           logSave.newLimit = newlimit;
                           logSave.mnewLimit = row.balance;
                           logSave.description = 'Balance updated. Old Limit: ' + oldlimit + ' . New Limit: ' + newlimit;
                           logSave.manager = dbUser.ParentUser;
                           logSave.remark = req.body.targetUser.remark;
                           logSave.time = new Date();
                           logSave.deleted = false;
                           logSave.createDate = date;
                           logSave.from = dbUser.ParentUser;
                           logSave.to = dbUser.username;
                           //console.log(log);
                           logSave.save(function (err) {
                              if (err) { }

                              var Mnewlimit = parseFloat(row.limit) + parseFloat(req.body.targetUser.amount);
                              var MnewAvAmount = parseFloat(row.availableAmount) + parseFloat(req.body.targetUser.amount);
                              var Moldlimit = row.limit;
                              var LogM = new Log();
                              LogM.username = dbUser.ParentUser;
                              LogM.action = 'BALANCE';
                              LogM.subAction = 'BALANCE_DEPOSIT';
                              LogM.oldLimit = Moldlimit;
                              LogM.amount = req.body.targetUser.amount;
                              LogM.availableAmount = MnewAvAmount;
                              LogM.newLimit = Mnewlimit;
                              LogM.description = 'Balance updated. Old Limit: ' + Moldlimit + ' . New Limit: ' + Mnewlimit;
                              LogM.remark = req.body.targetUser.remark;
                              LogM.time = new Date();
                              LogM.createDate = date;
                              LogM.deleted = false;
                              LogM.from = dbUser.ParentUser;
                              LogM.to = dbUser.username;
                              LogM.save(function (err) { });

                           });
                           var userData = await User.findOne({ 'username': req.body.targetUser.username.toUpperCase() },
                              {
                                 balance: 1, exposure: 1, limit: 1, username: 1
                              });
                           return res.json({ response: userData, error: false, "message": "success" });
                        });
                     })
                  }

               }
            });
      });
   } catch (e) {

   }
}

module.exports.getBalanceReport = async function (req, res) {
   try {

      // console.log(req.body);
      if (!req.body) return;
      if (!req.body.details || !req.body.details._id) return;

      let { search, pageNumber, sortBy, limit } = req.body;

      User.findOne({
         username: req.body.details.username,
         role: req.body.details.role,
         status: 'active',
         deleted: false,
         // hash: req.body.details.key
      }, async function (err, dbAdmin) {
         // console.log(dbAdmin);
         if (err) logger.error(err);
         if (!dbAdmin) return;

         var filter = {
            manager: req.body.username,
            role: "user",
            deleted: false,
         };

         if (req.body.role == "master") {
            filter = {
               master: req.body.username,
               role: "manager",
               deleted: false,
            };
         }

         if (req.body.role == "subadmin") {
            filter = {
               subadmin: req.body.username,
               role: "master",
               deleted: false,
            };
         }

         if (req.body.role == "admin") {
            filter = {
               admin: req.body.username,
               role: "subadmin",
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

         var findUser = await User.findOne({username:req.body.username}, { _id: 1, partnershipsetting: 1, role:1 });
         // console.log(findUser.role);
         
            for (var k = 0; k < findUser.partnershipsetting.length; k++) {
               if (findUser.partnershipsetting[k].sport_id == 4) {
                  upperpercentage = findUser.partnershipsetting[k].partnership;
               }
            }



         // console.log(filter);

         User.find(filter, { _id: 1, username: 1, role: 1, creditrefrence: 1, partnershipsetting: 1, ParentUser: 1, limit: 1, exposure: 1, availableAmount: 1, balance: 1 },async function (err, getUser) {
            // console.log(getUser.length);

            // res.json({ response: users, error: false, "message": "User List Succes" });
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
                  if(getUser[i].role != "user"){
                     for (var k = 0; k < getUser[i].partnershipsetting.length; k++) {
                        if (getUser[i].partnershipsetting[k].sport_id == 4) {
                           ownpercentage = getUser[i].partnershipsetting[k].partnership;
                        }
                     }
                  }
                  var filter1 = {
                     username: getUser[i].username,
                  };
                  // console.log("AA6666",i,getUser[i].username,getUser[i].role,getUser[i].creditrefrence,getUser[i].balance,getUser[i].availableAmount);
                  if (getUser[i].role == "manager") {
                     totalbalance = getUser[i].availableAmount;
                     filter1 = {
                        manager: getUser[i].username,
                     };
                  }

                  if (getUser[i].role == "master") {
                     totalbalance = getUser[i].availableAmount;
                     filter1 = {
                        master: getUser[i].username,
                     };
                  }

                  if (getUser[i].role == "subadmin") {
                     totalbalance = getUser[i].availableAmount;
                     filter1 = {
                        subadmin: getUser[i].username,
                     };
                  }

                  UsersCreditRefrence += parseFloat(getUser[i].creditrefrence);
                  UsersAvailBalance += parseFloat(getUser[i].balance);

                  // console.log(filter1);
                  
                  // console.log("222 calculate exposure", filter1, getUser[i].role, getUser[i].username);
                   await getuserexposure(getUser[i].role,getUser[i].username, function (exposure) {
                        // console.log(exposure);
                        totalexposure = exposure;
                  })

                  // console.log("222 total exposure",getUser[i].username,totalexposure);

                  total_exposure += parseFloat(totalexposure);
                  var ischild = 0;
                  var childUsers = await User.find(filter1, { _id: 1, username: 1,role:1,creditrefrence:1,balance:1, limit: 1,availableAmount:1, exposure: 1 });
                  // console.log(partnerpercentage);
                  if (childUsers.length) {  
                     ischild = 1;
                     for (var j = 0; j < childUsers.length; j++) {
                        // console.log("AA7777",i,childUsers[j].username,childUsers[j].role,childUsers[j].limit,childUsers[j].availableAmount);
                        
                        if(getUser[i].role == "user"){
                           total_exposure += childUsers[j].exposure;
                        }
                        if(childUsers[j].role == "user"){
                           totalbalance += childUsers[j].limit;
                           // total_exposure += childUsers[j].exposure;
                        }else{
                           totalbalance += childUsers[j].availableAmount;
                        }

                        // UsersCreditRefrence += parseFloat(childUsers[j].creditrefrence);
                        
                        
                     }
                  }
                  
                  if(totalbalance > 0 && ischild == 1){
                     // console.log("AA8888",i,getUser[i].username,downlevelbalance,totalbalance,upperpercentage,ownpercentage,UsersCreditRefrence,UsersAvailBalance,total_exposure);
                     var totalpl = totalbalance - getUser[i].creditrefrence;
                     // console.log("totalpl",totalpl);
                     if(findUser.role == "master"){
                        upperpercentage = ownpercentage + ownpercentage;
                     }
                     if(getUser[i].role != "user"){
                        var userpl = (totalpl * (upperpercentage - ownpercentage))/100;
                        clientPl += userpl;
                        // console.log("clientPl",clientPl,userpl);
                        totalbalance = (totalbalance + (-1 * totalpl) + (-1 * userpl));
                     }else{
                        clientPl += totalpl;
                     }
                     downlevelbalance += totalbalance;
                  }else{
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
               res.json({ response: userData, error: false, "message": "server response success" });
            } else {
               res.json({ response: [], error: true, "message": "Empty User List " });
            }

         });
      });
   } catch (e) {
      return res.json({ response: [], error: true, "message": "DB error: Application error " });
   }
}

module.exports.oldgetBalanceReport = async function (req, res) {
   try {

      // console.log("asfsdfasgsdg",req.body);
      if (!req.body) return;
      if (!req.body.details || !req.body.details._id) return;
      if (!req.body.username || !req.body.role) return;
      if (req.body.details.role != 'admin' && req.body.details.role != 'manager' && req.body.details.role != 'master' && req.body.details.role != 'subadmin') return;


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
            User.find(filter, { _id: 1, username: 1, role: 1, creditrefrence: 1, partnershipsetting: 1, ParentUser: 1, limit: 1, exposure: 1, availableAmount: 1, balance: 1 },async function (err, AllUsers) {

               var UsersBalance = 0;
               var UsersCreditRefrence = 0;
               var UsersAvailBalance = 0;
               var UsersExposure = 0;
               if (AllUsers) {

                  for (var i = 0; i < AllUsers.length; i++) {

                     var total_exposure = 0;
                     if (AllUsers[i].role == role) {
                     // console.log("calculate exposure", role, AllUsers[i].role, AllUsers[i].username);
                     if(role == "user"){
                        total_exposure += AllUsers[i].exposure;
                     }else{
                        await getuserexposure(AllUsers[i].role,AllUsers[i].username, function (exposure) {
                           // console.log(exposure);
                           total_exposure = exposure;
                     })
                     }   
                     }

                     // var exposure = (AllUsers[i].exposure * partnerpercentage) / 100;
                     console.log("SUBUSERS",i,AllUsers[i].username,AllUsers[i].availableAmount,AllUsers[i].limit,AllUsers[i].creditrefrence,total_exposure);
                     if (AllUsers[i].role == "user") {
                        UsersBalance += parseFloat(AllUsers[i].limit);
                     }else{
                           UsersBalance += parseFloat(AllUsers[i].availableAmount);
                     }
                     UsersExposure += parseFloat(total_exposure);
                     if (req.body.username == AllUsers[i].ParentUser) {
                        UsersCreditRefrence += parseFloat(AllUsers[i].creditrefrence);
                        UsersAvailBalance += parseFloat(AllUsers[i].balance);
                     }

                     
                  }


                  var ownpercentage = 100;
                  console.log("BB888",UsersCreditRefrence,UsersBalance);
                  var totalpl = UsersBalance - UsersCreditRefrence;
                  if(dbAdmin.role != "user"){
                     for (var k = 0; k < dbAdmin.partnershipsetting.length; k++) {
                        if (dbAdmin.partnershipsetting[k].sport_id == 4) {
                           var ownpercentage = dbAdmin.partnershipsetting[k].partnership;
                        }
                     }
                     var clientPl = -1 * (totalpl * ownpercentage)/100;
                     // UsersBalance = (UsersBalance + totalpl - clientPl);
                     UsersBalance = (UsersBalance + (-1 * totalpl) - (-1 * clientPl));
                    
                  }else{
                     var clientPl = totalpl;
                  }

                  console.log("BB999",UsersBalance,totalpl,clientPl);
                  
                  
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
                  res.json({ response: userData, error: false, "message": "server response success" });
               }

            });


         });
   } catch (err) {
      console.log(err)
      res.json({ response: err, error: true, "message": "server response error" });
   }

}

// module.exports.getuserexposure = async function (req, res) {
async function getuserexposure(role, username, _callback) {
   return new Promise((resolve,reject)=>{
      var filter = {
         manager: username,
         deleted: false,
         result: 'ACTIVE'
      };

      if (role == "master") {
         filter = {
            master: username, 
            deleted: false,
            result: 'ACTIVE'
         };
      }

      if (role == "subadmin") {
         filter = {
            subadmin: username,
            deleted: false,
            result: 'ACTIVE'
         };
      }

      // console.log(filter);

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
               if (market.marketType != 'SESSION') {
                  (async function (market, mindex, callback) {
                     await Bet.find(filter,async function (err, bets) {
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
                        // res.json({ response: exposure, error: false, "message": "User List Succes" });
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
                        // res.json({ response: exposure, error: false, "message": "User List Succes" });
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

///////////----------------- old functons -----------------/////////



module.exports.stopBet = function (io, socket, request) {
   if (!request) return;
   if (!request.user) return;


   User.findOne({
      username: request.user.details.username,
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
               username: request.user.details.username,
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
               username: request.user.details.username,
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
               username: request.user.details.username,
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
               username: request.user.details.username,
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
               username: request.user.details.username,
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
               username: request.user.details.username,
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
               username: request.user.details.username,
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
               username: request.user.details.username,
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
      username: request.user.details.username,
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
      username: request.user.details.username,
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
               username: request.user.details.username,
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
      username: request.user.details.username,
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
      username: request.user.details.username,
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
      username: request.user.details.username,
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
            username: request.user.details.username
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
      username: request.user.details.username,
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
            username: request.user.details.username
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
      username: request.user.details.username,
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
         username: request.user.details.username
      }, function (err, dbUser) {
         if (err) logger.error(err);
         console.log(dbUser);
         socket.emit('get-user-wheel-success', dbUser);
      });
   }
   if (request.user.details.role == 'partner') {
      if (!request.filter) request['filter'] = {
         username: request.user.details.username,
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
         username: request.user.details.username,
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
         username: request.user.details.username,
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
            error: true
         });
         return;
      }
      // Check for existing session
      Session.findOne({
         username: request.user.details.username,
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
                  username: request.user.details.username,
                  manager: request.user.details.manager
               }, function (err, userDetails) {
                  if (err) logger.debug(err);
                  if (!userDetails) {
                     socket.emit('get-user-details-error', {
                        message: 'Invalid user.',
                        error: true
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
      username: request.user.details.username,
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
               error: false
            });
            Session.remove({
               username: request.user.details.username
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
                     error: true
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
                     error: false
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
                     error: true
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
                     error: false
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
                     error: true
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
                     error: false
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
                     error: true
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
                     error: false
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
                     error: true
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
                     error: false
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
                     error: true
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
                     error: false
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
                     error: true
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
                     error: false
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
                     error: true
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
                     error: false
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
               username: request.user.details.username,
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
                        error: true
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
                        error: false
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
               username: request.user.details.username,
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
                        error: true
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
                        error: false
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

module.exports.getUser = function (io, socket, request) {
   if (!request) return;
   if (!request.user) return;
   //("getUser: request=" + JSON.stringify(request));

   if (request.user.details.role == 'user') {
      User.findOne({
         username: request.user.details.username
      }, function (err, dbUser) {
         if (err) logger.error(err);
         socket.emit('get-user-success', dbUser);
      });
   }


   if (request.user.details.role == 'partner') {
      if (!request.filter) request['filter'] = {
         username: request.user.details.username,
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
         username: request.user.details.username,
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
         username: request.user.details.username,
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
         username: request.user.details.username,
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
         username: request.user.details.username,
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
            username: request.user.details.username,
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
            username: request.user.details.username,
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
            username: request.user.details.username,
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
            username: request.user.details.username,
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
            username: request.user.details.username,
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
      username: request.user.details.username,
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
      username: request.user.details.username,
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
      username: request.user.details.username,
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
      username: request.user.details.username,
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
         //session.startTransaction();
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
            session.endSession();
            await sessionadmin.commitTransaction();
            sessionadmin.endSession();
            return true;*/

         } catch (e) {
            /*await session.abortTransaction();
            session.endSession();
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
           session.startTransaction();*/
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
             session.endSession();
             await sessionadmin.commitTransaction();
             sessionadmin.endSession();
             return true;*/

         } catch (e) {
            /* await session.abortTransaction();
             session.endSession();
             await sessionadmin.abortTransaction();
             sessionadmin.endSession();
             throw error;*/
         }


      }


      if (dbUser.role == 'master') {
         /*const session = await User.startSession();
         session.startTransaction();*/

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
            session.endSession();
            await sessionadmin.commitTransaction();
            sessionadmin.endSession();
            return true;*/

         } catch (e) {
            /* await session.abortTransaction();
             session.endSession();
             await sessionadmin.abortTransaction();
             sessionadmin.endSession();
             throw error;*/
         }

      }


      if (dbUser.role == 'admin') {
         if (request.targetUser.role == 'subadmin') {
            /* const session = await User.startSession();
             session.startTransaction();*/
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
                session.endSession();
                await sessionadmin.commitTransaction();
                sessionadmin.endSession();
                return true;*/
            } catch (e) {
               /*await session.abortTransaction();
               session.endSession();
               await sessionadmin.abortTransaction();
               sessionadmin.endSession();
               throw error;*/

            }

         }

      }

      if (dbUser.role == 'admin') {
         /*const session = await User.startSession();
         session.startTransaction();*/
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
            session.endSession();
            await sessionadmin.commitTransaction();
            sessionadmin.endSession();
            return true;*/

         } catch (e) {
            /* await session.abortTransaction();
             session.endSession();
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
      username: request.user.details.username,
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
      username: request.user.details.username,
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
      username: request.user.details.username,
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
      username: request.user.details.username,
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
         username: request.user.details.username,
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
                     username: request.user.details.username,
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
         username: request.user.details.username,
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
                     username: request.user.details.username,
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
                  error: false
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
         console.log(request.commisionloss)
         if (request.commisionloss > 3) {
            socket.emit("update-match-fees-success", {
               "message": "maximum commision 3%",
               error: false
            });
            return;

         } else if (request.rfcommisionloss > 3) {
            socket.emit("update-match-fees-success", {
               "message": "maximum  referal commision 3%",
               error: false
            });
            return;
         } else {
            if (!request.commisionloss) {
               request.commisionloss = 0;
            }
            if (parseInt(request.rfcommisionloss) + parseInt(request.commisionloss) > 3) {

               socket.emit("update-match-fees-success", {
                  "message": "maximum both referal and user commision 3%",
                  error: false
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
                  error: false
               });
            });
         }

      }


      if (dbUser.role == 'partner') {
         console.log(request.commisionloss)
         if (request.commisionloss > 3) {
            socket.emit("update-match-fees-success", {
               "message": "maximum commision 3%",
               error: false
            });
            return;

         } else if (request.rfcommisionloss > 3) {
            socket.emit("update-match-fees-success", {
               "message": "maximum  referal commision 3%",
               error: false
            });
            return;
         } else {
            if (!request.commisionloss) {
               request.commisionloss = 0;
            }
            if (parseInt(request.rfcommisionloss) + parseInt(request.commisionloss) > 3) {

               socket.emit("update-match-fees-success", {
                  "message": "maximum both referal and user commision 3%",
                  error: false
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
                  error: false
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
               error: false
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
               error: false
            });
         });


      }
   });
}