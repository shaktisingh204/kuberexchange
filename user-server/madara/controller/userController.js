var mongoose = require('mongoose');
var logger = require('log4js').getLogger();
var request1 = require('request');
const { ObjectId } = require('mongodb');
var jwt = require('jsonwebtoken');
const myEnv = require('dotenv').config();

/////// ----- Used Comman Helpers ---- //////
const Helper = require('../controller/helper');



/////// ------ Used Models -----///////
const Site = require('../models/siteModel');
const PaymentMethod = require('../models/paymentmethodModel');
const Payment = require('../models/paymentModel');
const Withdrawal = require('../models/withdrawalModel.js');
const Mysite = require('../models/mysitesModel');
const WithdrawnMethod = require('../models/withdrawnMethodModel');
const Notification = require('../models/notificationModel');
const SubAdmin = require('../models/subadminModel');
const Manager = require('../models/managerModel');
var Finance = mongoose.model('Finance');
var User = mongoose.model('User');
var Session = mongoose.model('Session');
var Log = mongoose.model('Log');
var Setting = mongoose.model('Setting');
var Banner = mongoose.model('Banner');
var Bet = mongoose.model('Bet');
var Tv = require('../models/tv');
var CricketVideo = mongoose.model('CricketVideo');
var Market = mongoose.model('Market');
var Chat = mongoose.model('Chat');

const Razorpay = require('razorpay');
var razorpaykey = process.env.razorpaykey;
var razorpaysecret = process.env.razorpaysecret;


// console.log(razorpaykey, razorpaysecret)

// var instance = new Razorpay({ key_id: 'rzp_live_PJtBK3YRPy64jS', key_secret: 'LmcT6HbJ2P31siFOZHU5lmAK' })
var instance = new Razorpay({ key_id: razorpaykey, key_secret: razorpaysecret })
// var instance = new Razorpay({ key_id: 'rzp_live_q09sl8uLmGjfg5', key_secret: 'K1oW3PYSgFPVQQbvfJMo9i4Y' })

// Required Helper Function
const util = require('./util');
const fs = require("fs");
var request = require('request');

// Message API Key
const api_key = 'e6c032ca-eca9-11ec-9c12-0200cd936042';
// const api_key = '047ed5ed-a6ce-4c14-990d-6e956b6402de';
const ShoutoutClient = require('shoutout-sdk');
const apiKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJqdGkiOiI0NTljMmI4MC1jYWE1LTExZWMtYjcyMy03ZDNlMmQ0ZDQ3MTciLCJzdWIiOiJTSE9VVE9VVF9BUElfVVNFUiIsImlhdCI6MTY1MTU1NzE3MiwiZXhwIjoxOTY3MTc2MzcyLCJzY29wZXMiOnsiYWN0aXZpdGllcyI6WyJyZWFkIiwid3JpdGUiXSwibWVzc2FnZXMiOlsicmVhZCIsIndyaXRlIl0sImNvbnRhY3RzIjpbInJlYWQiLCJ3cml0ZSJdfSwic29fdXNlcl9pZCI6IjY2OTA0Iiwic29fdXNlcl9yb2xlIjoidXNlciIsInNvX3Byb2ZpbGUiOiJhbGwiLCJzb191c2VyX25hbWUiOiIiLCJzb19hcGlrZXkiOiJub25lIn0.Eu7O747baCkA6v0896sVsv39qZvEqpBLQPPyiwof6_k';
const debug = true, verifySSL = false;

const moment = require('moment-timezone');

var currentdate = moment().tz("Asia/Calcutta").format('YYYY-MM-DD');
var current = moment().tz("Asia/Calcutta").format('YYYY-MM-DDTHH:mm:ss');

//////// ------- Used Socket ------ ///////

/// Main Site Login
module.exports.login = function (io, socket, request) {
    // Validate request data
    // console.log(request);
    if (!request) return;
    if (!request.user) return;
    // if(!request.user.username) return;
    if (!request.user.password) return;

    // // console.log(request.user.username.toUpperCase());

    var mobile = "+91" + request.user.username.toString();
    // // console.log(mobile);

    var output = {};
    User.findOne({ $or: [{ username: request.user.username.toUpperCase() }, { mobile: mobile }], role: "user" }, async function (err, user) {
        if (err) console.log(err); logger.debug(err);
        // Check username
        // // console.log(user.role)

        if (!user) {
            logger.error('login-error: User not found ' + request.user.username);
            console.log('login-error: User not found ' + request.user.username);
            socket.emit('login-success', { "message": "User not found", success: false });
            return;
        }
        let checkbyapi = 1;
        // Check password
        if (!user.validPassword(request.user.password)) {
            user.loginAttempts += 1;
            // Block the account if login attemps are greater than 5
            /*if(user.loginAttempts > 5){
              user.status = 'active';
              user.save(function(err, updatedUser){
                if(err) logger.debug(err);
              });
            
              logger.error('login-error: Login attempts exceeded 5. Blocking the account. Invalid password '+request.user.username);
              socket.emit('login-error', {"message":"Invalid password. Invalid login attempts exceeded the limit. Your account is blocked. Please contact admin.", error:true});
              return;
            }
            user.save(function(err, updatedUser){
              if(err) logger.debug(err);
            });*/
            // // console.log(user.username, request.user.password);
            logger.error('login-error: Invalid password ' + request.user.username);
            console.log('login-error: Invalid password ' + request.user.username);
            socket.emit('login-success', { "message": "Invalid password", success: false });
            return;

        } else {
            // Reset login attempts counter
            user.loginAttempts = 0;
            user.save(function (err, updatedUser) { });

            // Check deleted or blocked account
            if (user.status != 'active') {
                logger.error('login-error: Account is blocked or deleted' + request.user.username);
                console.log('login-error: Account is blocked or deleted' + request.user.username);
                socket.emit('login-success', { "message": "Account is not accessible anymore. Contact the admin to activate the account.", success: false });
                return;
            }
            logger.info('login: ' + user.username + ' logged in.');
            // Send user details to client
            User.findOne({ username: user.username, manager: user.manager }, async function (err, userDetails) {
                if (err || !userDetails) {
                    logger.error('login: DBError in finding user details.');
                    return;
                }
                var depositstatus = false;
                var checkD = await Log.findOne({ userId: user._id, subAction: "BALANCE_DEPOSIT", deleted: false }, { _id: 1 });
                if (checkD) {
                    depositstatus = true;
                }
                // 
                // console.log("depositstatus",depositstatus)

                var oldtoken = user.token;
                const token = Helper.generateToken(user._id);
                // // console.log(token);
                User.updateOne({ _id: user._id }, { token: token })
                    .then(users => {
                        output._id = user._id;
                        output.key = user.hash;
                        output.verifytoken = token;
                        output.details = userDetails;
                        output.setting = user.sportsetting;
                        output.depositstatus = depositstatus;
                        console.log("login succes");
                        // io.emit("login-check", { output: oldtoken, success: true });
                        socket.emit("login-success", { output: output, success: true });
                    })
                // Todo: send updated active users to manager and admin
                // Delete existing session and create new one


                Session.findOne({ username: user.username, manager: user.manager }, function (err, session) {
                    if (err) logger.debug(err);
                    //// console.log(session.socket+' '+user.username)
                    //// console.log(session)
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
                    }
                    else {
                        Session.remove({ username: user.username });
                        // Send session updating notification
                        io.to(session.socket).emit('session-expired', { session: session });
                        //io.emit('session-expired',{session:userDetails.username});

                        io.emit('multiple-login', { session: session });

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
            });
        }

    });
};

module.exports.loginWithOtp = async function (io, socket, req) {
    try {
        // console.log("login with otp",req);

        if (!req.phone) return;
        else {

            var DbUser = await User.findOne({ mobile: req.phone, role: "user" }, {});
            if (DbUser) {

                // Check deleted or blocked account
                if (DbUser.status != 'active') {
                    logger.error('login-error: Account is blocked or deleted' + req.phone);
                    socket.emit('login-otp-success', { status: "402", "message": "Account is not accessible anymore. Contact the admin to activate the account.", success: false });
                    return;
                }
            }
            let otp = Math.floor(1000 + Math.random() * 9000);

            if (req.phone == "1234567890") {
                otp = "1234";
            }

            console.log(otp)
            var options = {
                'method': 'GET',
                'url': `https://2factor.in/API/V1/${api_key}/SMS/${req.phone}/${otp}`,
                'headers': {
                    'content-type': 'application/x-www-form-urlencoded'
                }
            };
            request(options, async function (error, response) {
                if (error) {
                    // res.send({ error: err, success: false, message: "Please enter correct phone number." });
                    logger.error('login-error: Invalid password ' + DbUser.username);
                    socket.emit('login-otp-success', { "message": "Please enter correct phone number.", success: false });
                    return;
                }
                else {
                    var output = {};
                    // var DbUser = await User.findOne({ mobile: req.phone, role: "user" }, {});
                    if (DbUser) {

                        // Check deleted or blocked account
                        if (DbUser.status != 'active') {
                            logger.error('login-error: Account is blocked or deleted' + req.phone);
                            socket.emit('login-otp-success', { status: "402", "message": "Account is not accessible anymore. Contact the admin to activate the account.", success: false });
                            return;
                        }

                        var oldtoken = DbUser.token;

                        var depositstatus = false;
                        var checkD = await Log.findOne({ userId: DbUser._id, subAction: "BALANCE_DEPOSIT", deleted: false }, { _id: 1 });
                        if (checkD) {
                            depositstatus = true;
                        }

                        const token = Helper.generateToken(DbUser._id);

                        await User.updateOne({ _id: DbUser._id }, { otp: otp, token: token })
                            .then(users => {
                                output._id = DbUser._id;
                                // output.key = DbUser.hash;
                                output.verifytoken = token;
                                output.depositstatus = depositstatus;
                                output.details = DbUser;
                                console.log("login succes", req.phone, otp);
                                // io.emit("login-check", { output: oldtoken });
                                socket.emit("login-otp-success", { output: output, otp: otp, success: true });
                                return;
                            })
                            .catch(error => {
                                // res.send({ error, data: null, success: false, message: "Failed to send otp" });
                                // console.log(error)
                                logger.error('login-error: Invalid password ' + DbUser.username);
                                socket.emit('login-otp-success', { "message": "Db Error", success: false });
                                return;
                            })
                    } else {

                        socket.emit("login-otp-success", { output: null, otp: otp, success: true });
                        return;
                    }
                }
            });

        }
    }
    catch (error) {
        logger.error('login-error: Invalid password ' + DbUser.username);
        socket.emit('login-otp-success', { "message": "Server Error", success: false });
        return;
    }
}

async function checkDeposit(userId) {

    try {
        var checkD = await Log.findOne({ userId: userId, subAction: "BALANCE_DEPOSIT", deleted: false }, { _id: 1 });
        if (checkD) {
            return true;
        } else {
            return false;
        }
    } catch (error) {
        return false;
    }
}

module.exports.createUser = function (io, socket, request) {
    // - validate request data  
    // console.log(request);

    if (!request) return;
    if (!request.details || !request.details._id || !request.details.username || !request.details.role) return;
    if (!request.newUser.username || !request.newUser.password) return;
    // // console.log(request);

    User.findOne({
        username: request.details.username,
        role: {
            $in: ['admin', 'manager', 'master', 'subadmin']
        },
        status: 'active',
        deleted: false,
    }, async function (err, dbAdmin) {
        // // console.log(dbAdmin);
        if (err) logger.error(err);
        if (!dbAdmin) {
            socket.emit('create-user-success', {
                "message": "Admin Not found",
                success: false
            });
            return
        };

        if (!dbAdmin.validTransPassword(request.details.transpassword)) {
            dbAdmin.loginAttempts += 1;
            logger.error('create-user-success: Invalid Transaction password ' + request.details.username);
            socket.emit('create-user-success', {
                "message": "Invalid Transaction password",
                success: false
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

            if (dbAdmin.role == "manager") {
                // // console.log("manager");
                var MasterP = await User.findOne({ username: dbAdmin.master }, { partnershipsetting: 1, commissionsetting: 1 })
                var SubadminP = await User.findOne({ username: dbAdmin.subadmin }, { partnershipsetting: 1, commissionsetting: 1 })


                for (var k = 0; k < dbAdmin.partnershipsetting.length; k++) {
                    mgrprtnrsp[dbAdmin.partnershipsetting[k].sport_id] = dbAdmin.partnershipsetting[k].partnership;
                    mgrcmsn[dbAdmin.partnershipsetting[k].sport_id] = dbAdmin.commissionsetting[k].commission;
                    if (MasterP) {
                        if (SubadminP) {
                            mstrprtnrsp[dbAdmin.partnershipsetting[k].sport_id] = MasterP.partnershipsetting[k].partnership - dbAdmin.partnershipsetting[k].partnership;
                            mstrcmsn[dbAdmin.partnershipsetting[k].sport_id] = MasterP.commissionsetting[k].commission - dbAdmin.commissionsetting[k].commission;
                            sbadmnprtnrsp[dbAdmin.partnershipsetting[k].sport_id] = SubadminP.partnershipsetting[k].partnership - MasterP.partnershipsetting[k].partnership;
                            sbadmncmsn[dbAdmin.partnershipsetting[k].sport_id] = SubadminP.commissionsetting[k].commission - MasterP.commissionsetting[k].commission;
                            admprtnrsp[dbAdmin.partnershipsetting[k].sport_id] = 100 - SubadminP.partnershipsetting[k].partnership;
                            admcmsn[dbAdmin.partnershipsetting[k].sport_id] = 100 - SubadminP.commissionsetting[k].commission;
                        } else {
                            mstrprtnrsp[dbAdmin.partnershipsetting[k].sport_id] = MasterP.partnershipsetting[k].partnership - dbAdmin.partnershipsetting[k].partnership;
                            mstrcmsn[dbAdmin.partnershipsetting[k].sport_id] = MasterP.commissionsetting[k].commission - dbAdmin.commissionsetting[k].commission;
                            sbadmnprtnrsp[dbAdmin.partnershipsetting[k].sport_id] = 0;
                            sbadmncmsn[dbAdmin.partnershipsetting[k].sport_id] = 0;
                            admprtnrsp[dbAdmin.partnershipsetting[k].sport_id] = 100 - MasterP.partnershipsetting[k].partnership;
                            admcmsn[dbAdmin.partnershipsetting[k].sport_id] = 100 - MasterP.commissionsetting[k].commission;
                        }
                    } else {
                        if (SubadminP) {
                            mstrprtnrsp[dbAdmin.partnershipsetting[k].sport_id] = 0;
                            mstrcmsn[dbAdmin.partnershipsetting[k].sport_id] = 0;
                            sbadmnprtnrsp[dbAdmin.partnershipsetting[k].sport_id] = SubadminP.partnershipsetting[k].partnership - dbAdmin.partnershipsetting[k].partnership;
                            sbadmncmsn[dbAdmin.partnershipsetting[k].sport_id] = SubadminP.commissionsetting[k].commission - dbAdmin.commissionsetting[k].commission;
                            admprtnrsp[dbAdmin.partnershipsetting[k].sport_id] = 100 - SubadminP.partnershipsetting[k].partnership;
                            admcmsn[dbAdmin.partnershipsetting[k].sport_id] = 100 - SubadminP.commissionsetting[k].commission;
                        } else {
                            mstrprtnrsp[dbAdmin.partnershipsetting[k].sport_id] = 0;
                            mstrcmsn[dbAdmin.partnershipsetting[k].sport_id] = 0;
                            sbadmnprtnrsp[dbAdmin.partnershipsetting[k].sport_id] = 0;
                            sbadmncmsn[dbAdmin.partnershipsetting[k].sport_id] = 0;
                            admprtnrsp[dbAdmin.partnershipsetting[k].sport_id] = 100 - dbAdmin.partnershipsetting[k].partnership;
                            admcmsn[dbAdmin.partnershipsetting[k].sport_id] = 100 - dbAdmin.commissionsetting[k].commission;
                        }
                    }
                }
                var managerId = dbAdmin._id;
                var masterId = dbAdmin.masterId;
                var subadminId = dbAdmin.subadminId;
                var adminId = dbAdmin.adminId;
                var manager = dbAdmin.username;
                var master = dbAdmin.master;
                var subadmin = dbAdmin.subadmin;
                var admin = dbAdmin.admin;
            } else {

                // // console.log(dbAdmin.role);
                for (var k = 0; k < dbAdmin.partnershipsetting.length; k++) {
                    mgrprtnrsp[dbAdmin.partnershipsetting[k].sport_id] = 0;
                    mgrcmsn[dbAdmin.partnershipsetting[k].sport_id] = 0;
                    mstrprtnrsp[dbAdmin.partnershipsetting[k].sport_id] = 0;
                    mstrcmsn[dbAdmin.partnershipsetting[k].sport_id] = 0;
                    sbadmnprtnrsp[dbAdmin.partnershipsetting[k].sport_id] = 0;
                    sbadmncmsn[dbAdmin.partnershipsetting[k].sport_id] = 0;
                    admprtnrsp[dbAdmin.partnershipsetting[k].sport_id] = dbAdmin.partnershipsetting[k].partnership;
                    admcmsn[dbAdmin.partnershipsetting[k].sport_id] = dbAdmin.commissionsetting[k].commission;
                }
                // // console.log(admprtnrsp,admcmsn,admprtnrsp['1'],admcmsn['1'])
                var manager = "";
                var master = "";
                var subadmin = "";
                var admin = dbAdmin.username;
                var managerId = "";
                var masterId = "";
                var subadminId = "";
                var adminId = dbAdmin._id;

            }
            // var AdminP = await User.findOne({username: dbAdmin.admin },{partnershipsetting:1,commissionsetting:1})
            // // console.log(MasterP, SubadminP)
            var Parentpartnership = [
                {
                    sport_id: 4, sport_name: "cricket", manager: mgrprtnrsp['4'], master: mstrprtnrsp['4'], subadmin: sbadmnprtnrsp['4'], admin: admprtnrsp['4'],
                },
                {
                    sport_id: 1, sport_name: "soccer", manager: mgrprtnrsp['1'], master: mstrprtnrsp['1'], subadmin: sbadmnprtnrsp['1'], admin: admprtnrsp['1'],
                },
                {
                    sport_id: 2, sport_name: "tennis", manager: mgrprtnrsp['2'], master: mstrprtnrsp['2'], subadmin: sbadmnprtnrsp['2'], admin: admprtnrsp['2'],
                },
                {
                    sport_id: 'c9', sport_name: "casino", manager: mgrprtnrsp['c9'], master: mstrprtnrsp['c9'], subadmin: sbadmnprtnrsp['c9'], admin: admprtnrsp['c9'],
                }
            ];

            var Parentcommission = [
                {
                    sport_id: 4, sport_name: "cricket", manager: mgrcmsn['4'], master: mstrcmsn['4'], subadmin: sbadmncmsn['4'], admin: admcmsn['4'],
                },
                {
                    sport_id: 1, sport_name: "soccer", manager: mgrcmsn['1'], master: mstrcmsn['1'], subadmin: sbadmncmsn['1'], admin: admcmsn['1'],
                },
                {
                    sport_id: 2, sport_name: "tennis", manager: mgrcmsn['2'], master: mstrcmsn['2'], subadmin: sbadmncmsn['2'], admin: admcmsn['2'],
                },
                {
                    sport_id: 'c9', sport_name: "casino", manager: mgrcmsn['c9'], master: mstrcmsn['c9'], subadmin: sbadmncmsn['c9'], admin: admcmsn['c9'],
                }
            ];

            var sportsetting = [
                {
                    sport_id: 4, sport_name: "cricket",
                    min_bet: 100,
                    max_bet: 50000,
                    bet_delay: 5,
                },
                {
                    sport_id: 1, sport_name: "soccer",
                    min_bet: 100,
                    max_bet: 50000,
                    bet_delay: 5,
                },
                {
                    sport_id: 2, sport_name: "tennis",
                    min_bet: 100,
                    max_bet: 50000,
                    bet_delay: 5,
                },
                {
                    sport_id: 'c9', sport_name: "casino", min_bet: 100, max_bet: 50000, bet_delay: 5,
                }
            ];

            // var password = request.newUser.password;
            //set user details
            var user = new User();
            user.username = request.newUser.username.toUpperCase();
            user.fullname = request.newUser.fullname;
            user.setDefaults();
            user.setPassword(request.newUser.password);
            user.settransPassword("1234");
            user.role = "user";
            user.status = 'active';
            user.city = request.newUser.city;
            user.mobile = request.newUser.mobile;
            user.exposurelimit = 100000;
            user.creditrefrence = 100000;
            user.manager = manager;
            user.master = master;
            user.subadmin = subadmin;
            user.admin = admin;
            user.managerId = managerId;
            user.masterId = masterId;
            user.subadminId = subadminId;
            user.adminId = adminId;
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
            user.save(async function (err) {
                if (err) {
                    logger.error('create-user-success: DBError in UserDetails');
                    socket.emit("create-user-success", {
                        "message": "Error in saving user details.",
                        success: false
                    });
                } else {
                    //log start
                    var log = new Log();
                    log.username = user.username.toUpperCase();
                    log.action = 'ACCOUNT';
                    log.subAction = 'ACCOUNT_CREATE';
                    log.description = 'New account created.';
                    log.manager = manager;
                    log.master = master;
                    log.subadmin = subadmin;
                    log.admin = admin;
                    log.actionBy = dbAdmin.username;
                    log.time = new Date();
                    log.datetime = Math.round(+new Date() / 1000);
                    log.deleted = false;
                    log.save(function (err) {
                        if (err) {
                            // console.log(err)
                            logger.error('create-user-error: Log entry failed.');
                        }
                    });
                    // // console.log('create-user-success: User account created successfully.');
                    // socket.emit("create-user-success", user);
                    var output = {};
                    var DbUser = await User.findOne({ mobile: request.newUser.mobile, role: "user" }, {});
                    if (DbUser) {
                        var oldtoken = DbUser.token;

                        const token = Helper.generateToken(DbUser._id);
                        // depositBonus(DbUser._id, 25)
                        await User.updateOne({ _id: DbUser._id }, { token: token })
                            .then(users => {
                                output._id = DbUser._id;
                                output.verifytoken = token;
                                output.details = DbUser;
                                console.log("login succes");
                                // io.emit("login-check", { output: oldtoken });
                                socket.emit("create-user-success", { output: output, "message": "User created success", success: true });
                                return;
                            })
                    }
                    // socket.emit("create-user-success", {
                    //   "message": "User created success",
                    //   success: true,
                    //   user: user
                    // });
                }
            });
        });
    });

}

module.exports.RegisterWithOtp = async function (io, socket, req) {
    try {
        console.log(req);

        if (!req.username) return;
        else {

            var DbUser = await User.findOne({ username: req.username, role: "user" }, {});
            if (DbUser) {
                // console.log(DbUser);
                // Check User already exists
                logger.error('register-otp-success: User already exists');
                socket.emit("register-otp-success", {
                    "message": "User already exists",
                    success: false,
                    user: DbUser
                });
                return;
            }
            let otp = Math.floor(1000 + Math.random() * 9000);

            if (req.username == "1234567890") {
                otp = "1234";
            }

            // console.log(otp)
            var options = {
                'method': 'GET',
                'url': `https://2factor.in/API/V1/${api_key}/SMS/${req.username}/${otp}`,
                'headers': {
                    'content-type': 'application/x-www-form-urlencoded'
                }
            };
            request(options, async function (error, response) {
                if (error) {
                    // res.send({ error: err, success: false, message: "Please enter correct phone number." });
                    // console.log("error",error)
                    logger.error('register-error: Invalid password ' + DbUser.username);
                    socket.emit('register-otp-success', { "message": "Please enter correct phone number.", success: false });
                    return;
                }
                else {
                    // console.log("success",otp)
                    socket.emit("register-otp-success", { output: null, otp: otp, success: true });
                    return;

                }
            });

        }
    }
    catch (error) {
        logger.error('login-error: Invalid password ' + DbUser.username);
        socket.emit('register-otp-success', { "message": "Server Error", success: false });
        return;
    }
}

module.exports.createUserNew = function (io, socket, request) {
    // - validate request data  
    // console.log(request);

    if (!request) return;
    if (!request.details || !request.details._id || !request.details.username || !request.details.role) return;
    if (!request.newUser.username || !request.newUser.password) return;
    // // console.log(request);

    User.findOne({
        username: request.details.username,
        role: {
            $in: ['admin', 'manager', 'master', 'subadmin']
        },
        status: 'active',
        deleted: false,
    }, async function (err, dbAdmin) {
        // // console.log(dbAdmin);
        if (err) logger.error(err);
        if (!dbAdmin) {
            socket.emit('create-user-success', {
                "message": "Admin Not found",
                success: false
            });
            return
        };

        if (!dbAdmin.validTransPassword('835290')) {
            dbAdmin.loginAttempts += 1;
            logger.error('create-newuser-success: Invalid Transaction password ' + request.details.username);
            socket.emit('create-newuser-success', {
                "message": "Invalid Transaction password",
                success: false
            });
            return;
        }

        User.findOne({
            username: request.newUser.username.toUpperCase()
        }, async function (err, usersCheck) {
            if (err) logger.error(err);
            if (usersCheck) {
                logger.error('create-newuser-success: User already exists');
                socket.emit("create-newuser-success", {
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

            if (dbAdmin.role == "manager") {
                // // console.log("manager");
                var MasterP = await User.findOne({ username: dbAdmin.master }, { partnershipsetting: 1, commissionsetting: 1 })
                var SubadminP = await User.findOne({ username: dbAdmin.subadmin }, { partnershipsetting: 1, commissionsetting: 1 })


                for (var k = 0; k < dbAdmin.partnershipsetting.length; k++) {
                    mgrprtnrsp[dbAdmin.partnershipsetting[k].sport_id] = dbAdmin.partnershipsetting[k].partnership;
                    mgrcmsn[dbAdmin.partnershipsetting[k].sport_id] = dbAdmin.commissionsetting[k].commission;
                    if (MasterP) {
                        if (SubadminP) {
                            mstrprtnrsp[dbAdmin.partnershipsetting[k].sport_id] = MasterP.partnershipsetting[k].partnership - dbAdmin.partnershipsetting[k].partnership;
                            mstrcmsn[dbAdmin.partnershipsetting[k].sport_id] = MasterP.commissionsetting[k].commission - dbAdmin.commissionsetting[k].commission;
                            sbadmnprtnrsp[dbAdmin.partnershipsetting[k].sport_id] = SubadminP.partnershipsetting[k].partnership - MasterP.partnershipsetting[k].partnership;
                            sbadmncmsn[dbAdmin.partnershipsetting[k].sport_id] = SubadminP.commissionsetting[k].commission - MasterP.commissionsetting[k].commission;
                            admprtnrsp[dbAdmin.partnershipsetting[k].sport_id] = 100 - SubadminP.partnershipsetting[k].partnership;
                            admcmsn[dbAdmin.partnershipsetting[k].sport_id] = 100 - SubadminP.commissionsetting[k].commission;
                        } else {
                            mstrprtnrsp[dbAdmin.partnershipsetting[k].sport_id] = MasterP.partnershipsetting[k].partnership - dbAdmin.partnershipsetting[k].partnership;
                            mstrcmsn[dbAdmin.partnershipsetting[k].sport_id] = MasterP.commissionsetting[k].commission - dbAdmin.commissionsetting[k].commission;
                            sbadmnprtnrsp[dbAdmin.partnershipsetting[k].sport_id] = 0;
                            sbadmncmsn[dbAdmin.partnershipsetting[k].sport_id] = 0;
                            admprtnrsp[dbAdmin.partnershipsetting[k].sport_id] = 100 - MasterP.partnershipsetting[k].partnership;
                            admcmsn[dbAdmin.partnershipsetting[k].sport_id] = 100 - MasterP.commissionsetting[k].commission;
                        }
                    } else {
                        if (SubadminP) {
                            mstrprtnrsp[dbAdmin.partnershipsetting[k].sport_id] = 0;
                            mstrcmsn[dbAdmin.partnershipsetting[k].sport_id] = 0;
                            sbadmnprtnrsp[dbAdmin.partnershipsetting[k].sport_id] = SubadminP.partnershipsetting[k].partnership - dbAdmin.partnershipsetting[k].partnership;
                            sbadmncmsn[dbAdmin.partnershipsetting[k].sport_id] = SubadminP.commissionsetting[k].commission - dbAdmin.commissionsetting[k].commission;
                            admprtnrsp[dbAdmin.partnershipsetting[k].sport_id] = 100 - SubadminP.partnershipsetting[k].partnership;
                            admcmsn[dbAdmin.partnershipsetting[k].sport_id] = 100 - SubadminP.commissionsetting[k].commission;
                        } else {
                            mstrprtnrsp[dbAdmin.partnershipsetting[k].sport_id] = 0;
                            mstrcmsn[dbAdmin.partnershipsetting[k].sport_id] = 0;
                            sbadmnprtnrsp[dbAdmin.partnershipsetting[k].sport_id] = 0;
                            sbadmncmsn[dbAdmin.partnershipsetting[k].sport_id] = 0;
                            admprtnrsp[dbAdmin.partnershipsetting[k].sport_id] = 100 - dbAdmin.partnershipsetting[k].partnership;
                            admcmsn[dbAdmin.partnershipsetting[k].sport_id] = 100 - dbAdmin.commissionsetting[k].commission;
                        }
                    }
                }
                var managerId = dbAdmin._id;
                var masterId = dbAdmin.masterId;
                var subadminId = dbAdmin.subadminId;
                var adminId = dbAdmin.adminId;
                var manager = dbAdmin.username;
                var master = dbAdmin.master;
                var subadmin = dbAdmin.subadmin;
                var admin = dbAdmin.admin;
            } else {

                // // console.log(dbAdmin.role);
                for (var k = 0; k < dbAdmin.partnershipsetting.length; k++) {
                    mgrprtnrsp[dbAdmin.partnershipsetting[k].sport_id] = 0;
                    mgrcmsn[dbAdmin.partnershipsetting[k].sport_id] = 0;
                    mstrprtnrsp[dbAdmin.partnershipsetting[k].sport_id] = 0;
                    mstrcmsn[dbAdmin.partnershipsetting[k].sport_id] = 0;
                    sbadmnprtnrsp[dbAdmin.partnershipsetting[k].sport_id] = 0;
                    sbadmncmsn[dbAdmin.partnershipsetting[k].sport_id] = 0;
                    admprtnrsp[dbAdmin.partnershipsetting[k].sport_id] = dbAdmin.partnershipsetting[k].partnership;
                    admcmsn[dbAdmin.partnershipsetting[k].sport_id] = dbAdmin.commissionsetting[k].commission;
                }
                // // console.log(admprtnrsp,admcmsn,admprtnrsp['1'],admcmsn['1'])
                var manager = "";
                var master = "";
                var subadmin = "";
                var admin = dbAdmin.username;
                var managerId = "";
                var masterId = "";
                var subadminId = "";
                var adminId = dbAdmin._id;

            }
            // var AdminP = await User.findOne({username: dbAdmin.admin },{partnershipsetting:1,commissionsetting:1})
            // // console.log(MasterP, SubadminP)
            var Parentpartnership = [
                {
                    sport_id: 4, sport_name: "cricket", manager: mgrprtnrsp['4'], master: mstrprtnrsp['4'], subadmin: sbadmnprtnrsp['4'], admin: admprtnrsp['4'],
                },
                {
                    sport_id: 1, sport_name: "soccer", manager: mgrprtnrsp['1'], master: mstrprtnrsp['1'], subadmin: sbadmnprtnrsp['1'], admin: admprtnrsp['1'],
                },
                {
                    sport_id: 2, sport_name: "tennis", manager: mgrprtnrsp['2'], master: mstrprtnrsp['2'], subadmin: sbadmnprtnrsp['2'], admin: admprtnrsp['2'],
                },
                {
                    sport_id: 'c9', sport_name: "casino", manager: mgrprtnrsp['c9'], master: mstrprtnrsp['c9'], subadmin: sbadmnprtnrsp['c9'], admin: admprtnrsp['c9'],
                }
            ];

            var Parentcommission = [
                {
                    sport_id: 4, sport_name: "cricket", manager: mgrcmsn['4'], master: mstrcmsn['4'], subadmin: sbadmncmsn['4'], admin: admcmsn['4'],
                },
                {
                    sport_id: 1, sport_name: "soccer", manager: mgrcmsn['1'], master: mstrcmsn['1'], subadmin: sbadmncmsn['1'], admin: admcmsn['1'],
                },
                {
                    sport_id: 2, sport_name: "tennis", manager: mgrcmsn['2'], master: mstrcmsn['2'], subadmin: sbadmncmsn['2'], admin: admcmsn['2'],
                },
                {
                    sport_id: 'c9', sport_name: "casino", manager: mgrcmsn['c9'], master: mstrcmsn['c9'], subadmin: sbadmncmsn['c9'], admin: admcmsn['c9'],
                }
            ];

            var sportsetting = [
                {
                    sport_id: 4, sport_name: "cricket",
                    min_bet: 100,
                    max_bet: 50000,
                    bet_delay: 5,
                },
                {
                    sport_id: 1, sport_name: "soccer",
                    min_bet: 100,
                    max_bet: 50000,
                    bet_delay: 5,
                },
                {
                    sport_id: 2, sport_name: "tennis",
                    min_bet: 100,
                    max_bet: 50000,
                    bet_delay: 5,
                },
                {
                    sport_id: 'c9', sport_name: "casino", min_bet: 100, max_bet: 50000, bet_delay: 5,
                }
            ];

            // var password = request.newUser.password;
            //set user details
            var user = new User();
            user.username = request.newUser.username.toUpperCase();
            user.fullname = request.newUser.fullname;
            user.setDefaults();
            user.setPassword(request.newUser.password);
            user.settransPassword(request.newUser.password);
            user.role = "user";
            user.status = 'active';
            user.city = request.newUser.city;
            user.mobile = request.newUser.username;
            user.exposurelimit = 100000;
            user.creditrefrence = 100000;
            user.manager = manager;
            user.master = master;
            user.subadmin = subadmin;
            user.admin = admin;
            user.managerId = managerId;
            user.masterId = masterId;
            user.subadminId = subadminId;
            user.adminId = adminId;
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
            user.save(async function (err) {
                if (err) {
                    logger.error('create-newuser-success: DBError in UserDetails');
                    socket.emit("create-newuser-success", {
                        "message": "Error in saving user details.",
                        success: false
                    });
                } else {
                    //log start
                    var log = new Log();
                    log.username = user.username.toUpperCase();
                    log.action = 'ACCOUNT';
                    log.subAction = 'ACCOUNT_CREATE';
                    log.description = 'New account created.';
                    log.manager = manager;
                    log.master = master;
                    log.subadmin = subadmin;
                    log.admin = admin;
                    log.actionBy = dbAdmin.username;
                    log.time = new Date();
                    log.datetime = Math.round(+new Date() / 1000);
                    log.deleted = false;
                    log.save(function (err) {
                        if (err) {
                            // console.log(err)
                            logger.error('create-newuser-error: Log entry failed.');
                        }
                    });
                    // // console.log('create-user-success: User account created successfully.');
                    // socket.emit("create-user-success", user);
                    var output = {};
                    var DbUser = await User.findOne({ username: request.newUser.username, role: "user" }, {});
                    if (DbUser) {
                        var oldtoken = DbUser.token;

                        const token = Helper.generateToken(DbUser._id);
                        // depositBonus(DbUser._id, 25)
                        await User.updateOne({ _id: DbUser._id }, { token: token })
                            .then(users => {
                                output._id = DbUser._id;
                                output.verifytoken = token;
                                output.details = DbUser;
                                // console.log("login succes");
                                // io.emit("login-check", { output: oldtoken });
                                socket.emit("create-newuser-success", { output: output, "message": "User created success", success: true });
                                return;
                            })
                    }
                    // socket.emit("create-user-success", {
                    //   "message": "User created success",
                    //   success: true,
                    //   user: user
                    // });
                }
            });
        });
    });

}

async function depositBonus(userId, amount) {

    // authenticate manager
    const session = await mongoose.startSession({
        readPreference: 'primary',
        readConcern: { level: 'majority' },
        writeConcern: { w: 'majority' },
    });
    try {
        // console.log("depositBonus", userId)
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
                            // console.log("Your balance is low")
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
                                    //// console.log(log);
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
                                                    // console.log("Bonus Balance Deposit")
                                                    //   var userData = await User.findOne({ '_id': dbUser._id },
                                                    //      {
                                                    //         balance: 1, exposure: 1, limit: 1, username: 1
                                                    //      });
                                                    //   return res.json({ response: userData, success: true, "message": "success" });
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
        // console.log(error)
        //    return res.json({ response: error, success: false, "message": "Server Error" });
    }
}

module.exports.updatePasswordchanged = async function (io, socket, req) {
    // Validate request data
    try {
        //   // console.log(req)
        let decoded = jwt.verify(req.token, myEnv.parsed.SECRET);
        let { userId } = jwt.decode(req.token);
        let dbUser = await User.findOne({ _id: userId, token: req.token });
        if (!dbUser) return io.to(socket.id).emit('logout');
        if (dbUser.token != req.token) return io.to(socket.id).emit('logout');
        logger.info("updatePasswordchanged: " + JSON.stringify(req));

        if (dbUser.validPassword(req.password)) {
            var user = new User();
            user.setPassword(req.npassword);
            dbUser.hash = user.hash;
            dbUser.salt = user.salt;
            dbUser.transctionpasswordstatus = 1;
            //   // console.log(dbUser)
            dbUser.save(function (err, updatedLogin) {
                if (err) logger.error(err);
                // // console.log(updatedLogin)
                socket.emit('password-changed-success', { "message": "Current password successfully login again", success: true });
            });
        }
        else {
            socket.emit('password-changed-success', { "message": "Current password incorrect try again", success: false });
        }
    }
    catch (error) {
        // console.log(error);

    };
};

////// ------ Used Api ------ ////////

module.exports.getSetting = async function (req, res) {
    try {
        // console.log("getSetting", req.token)
        // let decoded = jwt.verify(req.token, myEnv.parsed.SECRET);
        //    let { userId } = jwt.decode(req.token);
        //    let dbAdmin = await User.findOne({ _id: userId, token: req.token });
        //    if (!dbAdmin) return res.send({ success: false, logout: true, message: "Token Invalid. Please login in again." });
        //    if (dbAdmin.token != req.token) return res.send({ success: false, logout: true, message: "Token Invalid. Please login in again." });
        //    if (dbAdmin.role != 'user') return res.send({ success: false, logout: true, message: "Token Invalid. Please login in again." });

        Setting.findOne({}, async function (err, docs) {
            if (err) {
                // console.log("DB error: Application error ", err);
                return res.json({ response: [], success: false, "message": "DB error: Application error " });
            }
            else {
                // console.log("Status Changed");
                res.send({ data: docs, success: true, message: "Status Changed sucessfully" });
            }
        })

    } catch (err) {
        // console.log(err)
        res.json({ response: err, success: false, "message": "server response success" });
    }

}

//Add Withdrawal Method
module.exports.updateDeviceId = async (req, res) => {
    try {
        // console.log("updateDeviceId", req.token)
        let decoded = jwt.verify(req.token, myEnv.parsed.SECRET);
        let { userId } = jwt.decode(req.token);
        let dbAdmin = await User.findOne({ _id: userId, token: req.token });
        if (!dbAdmin) return res.send({ success: false, logout: true, message: "Token Invalid. Please login in again." });
        if (dbAdmin.token != req.token) return res.send({ success: false, logout: true, message: "Token Invalid. Please login in again." });

        await User.findOneAndUpdate({ _id: userId }, { deviceId: req.body.deviceId }, { new: true })
            .then(function (dbProduct) {
                res.send({ data: dbProduct, success: true, message: "Device Id updated" });
            })
            .catch(function (err) {
                // If an error occurred, send it to the client
                res.send({ data: {}, success: False, message: "Error in DeviceId update" });
            });

    }
    catch (error) {
        res.send({ error, success: false, message: "Unknown error" });
    }
}

module.exports.getAllBanner = async (req, res) => {
    try {
        //    // // console.log("getAllBanner", req.token)
        //    let decoded = jwt.verify(req.token, myEnv.parsed.SECRET);
        //    let { userId } = jwt.decode(req.token);
        //    let dbAdmin = await User.findOne({ _id: userId, token: req.token });
        //    if (!dbAdmin) return res.send({ success: false, logout: true, message: "Token Invalid. Please login in again." });
        //    if (dbAdmin.token != req.token) return res.send({ success: false, logout: true, message: "Token Invalid. Please login in again." });


        Banner.find({ status: "active" })
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

module.exports.getUserEvenets = async function (req, res) {
    try {
        // console.log("getUserEvenets", req.token)
        let decoded = jwt.verify(req.token, myEnv.parsed.SECRET);
        let { userId } = jwt.decode(req.token);
        let dbAdmin = await User.findOne({ _id: userId, token: req.token });
        if (!dbAdmin) return res.send({ success: false, logout: true, message: "Token Invalid. Please login in again." });
        if (dbAdmin.token != req.token) return res.send({ success: false, logout: true, message: "Token Invalid. Please login in again." });

        User.findOne({ _id: userId, role: dbAdmin.role, }, { availableEventTypes: 1 })
            .then(async data => {
                if (data) {
                    res.json({ response: data, parent: dbAdmin.availableEventTypes, success: true, "message": "server response success" });
                }
                else {
                    res.json({ response: [], success: true, "message": "server response success" });
                }
            })

    } catch (err) {
        // console.log(err)
        res.json({ response: err, success: false, "message": "server response success" });
    }
}

module.exports.HomeGames = async (req, res) => {
    try {
        Setting.findOne({}, { casinogames: 1 }, function (err, games) {
            // // console.log(user);
            res.send({ games, success: true, message: "Games get successfully" });
        });
    }
    catch (error) {
        res.send({ error, success: false, message: "Unknown error" });
    }
}

// Get User Details
module.exports.getUserDetails = async (req, res) => {
    try {
        // // console.log(req.token)
        let decoded = jwt.verify(req.token, myEnv.parsed.SECRET);
        let { userId } = jwt.decode(req.token);
        let dbUser = await User.findOne({ _id: userId, token: req.token });
        if (!dbUser) return res.send({ success: false, logout: true, message: "Token Invalid. Please login in again." });
        if (dbUser.token != req.token) return res.send({ success: false, logout: true, message: "Token Invalid. Please login in again." });

        User.findOne({ _id: userId }, { balance: 1, exposure: 1, bounsBalance: 1 })
            .then(async doc => {
                // console.log("getUserDetails111",doc); 
                var depositstatus = false;
                var checkD = await Log.findOne({ userId: userId, subAction: "BALANCE_DEPOSIT", deleted: false }, { _id: 1 });
                if (checkD) {
                    depositstatus = true;
                }
                // var data = doc;
                // doc.depositstatus = depositstatus;

                // console.log("getUserDetails2222",doc,data,depositstatus);
                res.send({ doc, depositstatus:depositstatus, success: true, message: "User get successfully" });
            })
            .catch(error => {
                res.send({ error, success: false, message: "DB error in getting user" });
            })
    }
    catch (error) {
        // console.log(error);
        res.send({ error, success: false, message: "Unknown error" });
    }
}

// Get Payment Method
module.exports.getPaymentMethod = async (req, res) => {
    try {
        let decoded = jwt.verify(req.token, myEnv.parsed.SECRET);
        let { userId } = jwt.decode(req.token);
        let dbUser = await User.findOne({ _id: userId, token: req.token });
        if (!dbUser) return res.send({ success: false, logout: true, message: "Token Invalid. Please login in again." });
        if (dbUser.token != req.token) return res.send({ success: false, logout: true, message: "Token Invalid. Please login in again." });

        PaymentMethod.find({ typeId: dbUser.adminId, paymenttype: { $ne: "manual" } }).sort({ createdAt: -1 })
            .then(doc => {
                res.send({ doc, success: true, message: "Payment Methods get successfully" });
            })
            .catch(error => {
                res.send({ error, success: false, message: "DB error in getting Peyment Method" });
            })
    }
    catch (error) {
        // console.log(error)
        res.send({ error, success: false, message: "Unknown error" });
    }
}

//Payment Deposit
module.exports.depositPayment = async (req, res) => {
    try {
        console.log("depositPayment", req.body, req.file)
        let decoded = jwt.verify(req.token, myEnv.parsed.SECRET);
        let { userId } = jwt.decode(req.token);
        let dbUser = await User.findOne({ _id: userId, token: req.token });
        if (!dbUser) return res.send({ success: false, logout: true, message: "Token Invalid. Please login in again." });
        if (dbUser.token != req.token) return res.send({ success: false, logout: true, message: "Token Invalid. Please login in again." });
        let max = 1;

        if (req.body.amount < max) return res.send({ success: false, message: `Amount can't be less than ${max}.` });

        // let query;
        let imageName = "";
        if (req.file) {
            imageName = req.file.filename;
        }

        // // console.log("imageName",imageName);
        var characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
        var result = ""
        var charactersLength = characters.length;

        for (var i = 0; i < 10; i++) {
            result += characters.charAt(Math.floor(Math.random() * charactersLength));
        }

        let exposure = parseInt(dbUser.exposure) + parseInt(req.body.amount);

        if (dbUser.deviceId) {
            deviceId = dbUser.deviceId
        }
        else {
            deviceId = ''
        }

        var OrderId = "";
        if (req.body.type == "razorpay") {
            var options = {
                amount: req.body.amount * 100,  // amount in the smallest currency unit
                currency: "INR",
                receipt: "order_zolo_win"
            };
            instance.orders.create(options, function (err, order) {
                // console.log("deposit order", err, order);
                OrderId = order.id;


                // console.log("deposit order", OrderId);

                const payment = new Payment({
                    type: 'Deposit',
                    userId: dbUser._id,
                    orderId: OrderId,
                    amount: req.body.amount,
                    name: dbUser.fullname,
                    username: dbUser.username,
                    paymentType: req.body.type,
                    depositId: req.body.depositId,
                    transactionId: req.body.transactionId,
                    status: 'Pending',
                    image: imageName,
                    managerType: dbUser.ParentRole,
                    managerId: dbUser.ParentId,
                    balance: dbUser.balance,
                    to: "Wallet",
                    refrenceNo: result
                });
                payment.save()
                    .then(async doc => {
                        // Push Notification Start
                        if (deviceId) {

                            let deviceIds = [dbUser.deviceId];
                            let partner = await User.find({ _id: dbUser.ParentId });
                            for (let i = 0; i < partner.length; i++) {
                                if (partner[i].playerId) {
                                    deviceIds.push(partner[i].playerId);
                                }
                            }

                            var datapush = {
                                app_id: "047ed5ed-a6ce-4c14-990d-6e956b6402de",
                                contents: { "en": `${dbUser.fullname} has created a request to deposit amount of ${req.body.amount}` },
                                headings: { "en": "Deposit Payment Request" },
                                big_picture: "https://blog.taskpigeon.co/wp-content/uploads/2017/06/Advanced-Email-Notifications-Task-Pigeon.jpg",
                                url: "",
                                include_player_ids: deviceIds
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
                                    // console.log("Response:");
                                    // // // console.log(JSON.parse(datapush));

                                });
                            });

                            requestpush.on('error', function (e) {
                                // // console.log("ERROR:");

                                // // console.log(e);
                            });

                            requestpush.write(JSON.stringify(datapush));
                            requestpush.end();
                        }
                        // Push Notification End


                        res.send({ doc, success: true, message: "Deposit registered" });
                        // });
                    }).catch(error => {
                        // console.log(error);
                        res.send({ error, success: false, message: "DB error in deposit register" });
                    })
            });
        } else {

            const payment = new Payment({
                type: 'Deposit',
                userId: dbUser._id,
                orderId: OrderId,
                amount: req.body.amount,
                name: dbUser.fullname,
                username: dbUser.username,
                paymentType: req.body.type,
                depositId: req.body.depositId,
                transactionId: req.body.transactionId,
                status: 'Pending',
                image: imageName,
                managerType: dbUser.ParentRole,
                managerId: dbUser.ParentId,
                balance: dbUser.balance,
                to: "Wallet",
                refrenceNo: result
            });
            payment.save()
                .then(async doc => {

                    // Push Notification Start
                    if (deviceId) {

                        let deviceIds = [dbUser.deviceId];
                        let partner = await User.find({ _id: dbUser.ParentId });
                        for (let i = 0; i < partner.length; i++) {
                            if (partner[i].playerId) {
                                deviceIds.push(partner[i].playerId);
                            }
                        }

                        var datapush = {
                            app_id: "047ed5ed-a6ce-4c14-990d-6e956b6402de",
                            contents: { "en": `${dbUser.fullname} has created a request to deposit amount of ${req.body.amount}` },
                            headings: { "en": "Deposit Payment Request" },
                            big_picture: "https://blog.taskpigeon.co/wp-content/uploads/2017/06/Advanced-Email-Notifications-Task-Pigeon.jpg",
                            url: "",
                            include_player_ids: deviceIds
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
                                // console.log("Response:");
                                // // // console.log(JSON.parse(datapush));

                            });
                        });

                        requestpush.on('error', function (e) {
                            // // console.log("ERROR:");

                            // // console.log(e);
                        });

                        requestpush.write(JSON.stringify(datapush));
                        requestpush.end();
                    }
                    // Push Notification End


                    res.send({ doc, success: true, message: "Deposit registered" });
                    // });
                }).catch(error => {
                    // console.log(error);
                    res.send({ error, success: false, message: "DB error in deposit register" });
                })
        }





        // User.updateOne({
        //     '_id': userId
        // }, { balance: dbUser.balance, deviceId: deviceId }, async function (error, updateUser) {




    }
    catch (error) {
        // console.log(error);
        res.send({ error, success: false, message: "Unknown error" });
    }
}

//Add Withdrawal Method
module.exports.withdrawalMethod = async (req, res) => {
    try {
        // console.log(req.body)
        let decoded = jwt.verify(req.token, myEnv.parsed.SECRET);
        let { userId } = jwt.decode(req.token);
        let dbUser = await User.findOne({ _id: userId, token: req.token });
        if (!dbUser) return res.send({ success: false, logout: true, message: "Token Invalid. Please login in again." });
        if (dbUser.token != req.token) return res.send({ success: false, logout: true, message: "Token Invalid. Please login in again." });
        // console.log(userId)
        let status;
        let withdrawn = await Withdrawal.findOne({ userId: userId, type: req.body.type });
        if (!withdrawn) {
            status = true;
        } else {
            status = false;
        }

        let withdrawalType = await WithdrawnMethod.findOne({ _id: new ObjectId(req.body.withdrawlId) });
        let data;
        if (req.body.type == 'bank') {
            data = {
                type: req.body.type,
                userId: userId,
                bankName: req.body.bankName,
                name: req.body.name,
                accnumber: req.body.accnumber,
                ifsc: req.body.ifsc,
                withdrawnMethod: req.body.withdrawlId,
                status: status
            }
        } else {
            data = {
                type: withdrawalType.type,
                userId: userId,
                name: req.body.name,
                upi: req.body.upi,
                withdrawnMethod: req.body.withdrawlId,
                status: status
            }
        }

        const withdrawal = new Withdrawal(data);
        withdrawal.save()
            .then(async doc => {

                await WithdrawnMethod.findOneAndUpdate({ _id: req.body.withdrawlId }, { $push: { withdrawns: doc._id } }, { new: true })
                    .then(function (dbProduct) {
                        // If we were able to successfully update a Product, send it back to the client
                        // console.log(dbProduct);
                        res.send({ doc, success: true, message: "Withdrawal registered" });
                    })
                    .catch(function (err) {
                        // If an error occurred, send it to the client
                        // console.log(err);
                        res.send({ error, success: false, message: "Withdrawal Error" });
                    });


            })
            .catch(error => {
                res.send({ error, success: false, message: "DB error in withdrawal register" });
            })
    }
    catch (error) {
        // console.log(error)
        res.send({ error, success: false, message: "Unknown error" });
    }
}

// Get Withdrawn Method
module.exports.getwithdrawnMethod = async (req, res) => {
    try {
        let decoded = jwt.verify(req.token, myEnv.parsed.SECRET);
        let { userId } = jwt.decode(req.token);
        let dbUser = await User.findOne({ _id: userId, token: req.token });
        if (!dbUser) return res.send({ success: false, logout: true, message: "Token Invalid. Please login in again." });
        if (dbUser.token != req.token) return res.send({ success: false, logout: true, message: "Token Invalid. Please login in again." });


        WithdrawnMethod.
            find({ type: { $ne: "manual" }, status: "active" }).
            populate({ path: 'withdrawns', match: { userId: userId } }).
            exec(function (err, data) {
                if (err) {
                    res.send({ error: err, success: false, message: "Unknown error" });
                }
                else {
                    res.send({ data: data, success: true, message: "Withdrawn Method get successfully" });
                }
            });

    }
    catch (error) {
        res.send({ error, success: false, message: "Unknown error" });
    }
}

//Payment Withdrawal
module.exports.withdrawalPayment = async (req, res) => {
    try {
        // return res.send({ success: false, logout: true, message: "Response Error." });
        // console.log(req.body)
        let decoded = jwt.verify(req.token, myEnv.parsed.SECRET);
        let { userId } = jwt.decode(req.token);
        let dbUser = await User.findOne({ _id: userId, token: req.token, status: "active" });
        if (!dbUser) return res.send({ success: false, logout: true, message: "Token Invalid. Please login in again." });
        if (dbUser.token != req.token) return res.send({ success: false, logout: true, message: "Token Invalid. Please login in again." });
        let max = 1000;
        // if (user.typeId === '62b013cd6d70f31108551e35' || user.typeId === '631195e7d84105a6457fd88e') {
        //     max = 100;
        // }
        // console.log(dbUser.balance)
        if (req.body.amount < max) return res.send({ success: false, message: `Amount can't be less than ${max}.` });
        // if (dbUser.amount >= req.body.amount) return res.send({ success: false, message: `Insuffcient Fund ${dbUser.amount}.` });

        let getWithdrawnMethod = await WithdrawnMethod.findOne({ type: req.body.type });
        // if (getWithdrawnMethod.manager && getWithdrawnMethod.manager.includes(user.typeId)) return res.send({ success: false, message: `${req.body.type} is currently disabled.` });

        let getWithdrawnPayment = await Payment.findOne({ userId: dbUser._id, type: 'Withdrawal', status: "Pending" });
        if (getWithdrawnPayment) return res.send({ success: false, message: `Withdrawal is pending.` });
        console.log(dbUser.balance, dbUser.bounsBalance)
        if (!dbUser.bounsBalance) {
            dbUser.bounsBalance = 0
        }
        var restBalance = dbUser.balance - dbUser.bounsBalance;
        console.log(restBalance, req.body.amount, dbUser.balance, dbUser.bounsBalance)
        if (parseInt(restBalance) <= parseInt(req.body.amount)) return res.send({ success: false, message: "You don't have sufficients funds." });

        let query;
        // let manager;
        // if (user.type == "Manager") {
        //     query = "Admin"
        //     manager = await Manager.findOne({ _id: user.typeId });
        // } else {
        //     query = "Subadmin"
        //     manager = await User.findOne({ _id: user.typeId });
        // }

        var characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
        var result = ""
        var charactersLength = characters.length;

        for (var i = 0; i < 10; i++) {
            result += characters.charAt(Math.floor(Math.random() * charactersLength));
        }

        let balance = parseFloat(dbUser.balance) - parseFloat(req.body.amount);
        let exposure = parseFloat(dbUser.exposure) - parseFloat(req.body.amount);


        // var request = require('request');
        // var options = {
        //     'method': 'GET',
        //     'url': `https://wapi.paisaexch.com/api/balance/${user.username}`,
        //     'headers': {
        //     }
        // };
        // request(options,async function (error, response) {
        //     if (error) {
        //         // console.log(error);
        //         res.send({ error, success: false, message: "Error in withdrawal request" });
        //     } else {
        //         let body = JSON.parse(response.body);

        //         if (body.error == true) {
        //             // console.log(body.error);
        //             res.send({ error: body.error, success: false, message: body.message });
        //         }
        //         else if (body.response.balance < req.body.amount) {
        //             res.send({ error: {}, success: false, message: "User don't have sufficient ammount" });
        //         } else {

        // var request = require('request');
        // var options = {
        //     'method': 'POST',
        //     'url': 'https://wapi.paisaexch.com/api/updatewithdraw',
        //     'headers': {
        //         'cache-control': 'no-cache',
        //         'content-type': 'application/x-www-form-urlencoded',
        //         'postman-token': '15dc1ded-e6b9-d2e2-f73e-1d4ce00f568a'
        //     },
        //     form: {
        //         'username': user.username,
        //         'amount': req.body.amount
        //     }
        // };
        // request(options, async function (error, response) {
        //     let body = JSON.parse(response.body);
        // if (error) {
        //     // console.log(error);
        //     res.send({ error, success: false, message: "Error in withdrawal request" });
        // } else if (body.error == true) {
        //     // console.log(body.error);
        //     res.send({ error: body.error, success: false, message: body.message });
        // } else {

        // Push Notification Start
        if (dbUser.deviceId) {
            let deviceIds = [dbUser.deviceId];
            let partner = await User.find({ _id: dbUser.ParentId });
            for (let i = 0; i < partner.length; i++) {
                if (partner[i].playerId) {
                    deviceIds.push(partner[i].playerId);
                }
            }

            var datapush = {
                app_id: "047ed5ed-a6ce-4c14-990d-6e956b6402de",
                contents: { "en": `${dbUser.fullname} has created a request to withdraw amount of ${req.body.amount}` },
                headings: { "en": "Withdrawal Payment Request" },
                big_picture: "https://blog.taskpigeon.co/wp-content/uploads/2017/06/Advanced-Email-Notifications-Task-Pigeon.jpg",
                url: "",
                include_player_ids: deviceIds
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
                    // console.log("Response:");
                    // // console.log(JSON.parse(datapush));

                });
            });

            requestpush.on('error', function (e) {
                // console.log("ERROR:");

                // console.log(e);
            });

            requestpush.write(JSON.stringify(datapush));
            requestpush.end();
        }
        // Push Notification End

        const payment = new Payment({
            type: 'Withdrawal',
            userId: dbUser._id,
            amount: req.body.amount,
            name: dbUser.fullname,
            username: dbUser.username,
            paymentType: req.body.type,
            paymentId: req.body.paymentId,
            status: 'Pending',
            managerType: dbUser.ParentRole,
            managerId: dbUser.ParentId,
            balance: balance,
            to: "Wallet",
            refrenceNo: result
        });
        payment.save()
            .then(doc => {
                User.updateOne({
                    '_id': userId
                }, { balance: balance, exposure: exposure }, async function (error, updateUser) {
                    res.send({ doc, success: true, message: "Withdrawal registered" });
                });
            })
            .catch(error => {
                // console.log(error);
                res.send({ error, success: false, message: "DB error in withdrawal register" });
            })

        // }
        // });
        // }
        // }
        // });
    }
    catch (error) {
        // console.log(error);
        res.send({ error, success: false, message: "Unknown error" });
    }
}

// Get Transaction
module.exports.getPayment = async (req, res) => {
    try {
        // // console.log(req.body)
        let decoded = jwt.verify(req.token, myEnv.parsed.SECRET);
        let { userId } = jwt.decode(req.token);
        let dbUser = await User.findOne({ _id: userId, token: req.token });
        if (!dbUser) return res.send({ success: false, logout: true, message: "Token Invalid. Please login in again." });
        if (dbUser.token != req.token) return res.send({ success: false, logout: true, message: "Token Invalid. Please login in again." });

        var todate = new Date(req.body.to);
        todate.setDate(todate.getDate() + 1);
        // // console.log(todate);
        Payment.
            find({ userId: userId, createdAt: { $gte: new Date(req.body.from), $lte: todate } }).
            populate('sites').
            sort({ createdAt: -1 }).
            exec(function (err, data) {
                if (err) return handleError(err);
                res.send({ data: data, success: true, message: "Transaction get successfully" });
                // prints "The author is Ian Fleming"
            });


    }
    catch (error) {
        // console.log(error)
        res.send({ error, success: false, message: "Unknown error" });
    }
}

// Get Transaction By Id
module.exports.gettransactionById = async (req, res) => {
    try {
        let decoded = jwt.verify(req.token, myEnv.parsed.SECRET);
        let { userId } = jwt.decode(req.token);
        let dbUser = await User.findOne({ _id: userId, token: req.token });
        if (!dbUser) return res.send({ success: false, logout: true, message: "Token Invalid. Please login in again." });
        if (dbUser.token != req.token) return res.send({ success: false, logout: true, message: "Token Invalid. Please login in again." });

        Payment.
            findOne({ _id: req.body.id }).
            populate('sites').
            populate('paymentId').
            populate('mysites').
            populate('depositId').
            exec(function (err, data) {
                if (err) return handleError(err);
                res.send({ data: data, success: true, message: "Transaction get successfully" });
                // prints "The author is Ian Fleming"
            });
    }
    catch (error) {
        res.send({ error, success: false, message: "Unknown error" });
    }
}

// Delete Withdrawl Method
module.exports.deleteWithdrawlMethod = async (req, res) => {
    try {
        let decoded = jwt.verify(req.token, myEnv.parsed.SECRET);
        let { userId } = jwt.decode(req.token);
        let dbUser = await User.findOne({ _id: userId, token: req.token });
        if (!dbUser) return res.send({ success: false, logout: true, message: "Token Invalid. Please login in again." });
        if (dbUser.token != req.token) return res.send({ success: false, logout: true, message: "Token Invalid. Please login in again." });

        let pending = await Payment.findOne({ userId: userId, type: 'Withdrawal', status: 'Pending' });

        if (!pending || pending.length == 0) {
            await Withdrawal.deleteOne({ _id: req.body.id })
                .then(result => {
                    // console.log("slot deletemany");
                    res.send({ data: result, success: true, message: "Withdrawal deleted successfully" });
                })
                .catch(error => {
                    res.send({ error, success: false, message: "Error in deleting Withdrawal" });
                })
        } else {
            res.send({ error: {}, success: false, message: "You have pending Withdrawal request" });
        }



    }
    catch (error) {
        // console.log(error)
        res.send({ error, success: false, message: "Unknown error" });
    }
}

module.exports.razorPayStatus = async (req, res) => {
    try {
        let decoded = jwt.verify(req.token, myEnv.parsed.SECRET);
        let { userId } = jwt.decode(req.token);
        let dbUser = await User.findOne({ _id: userId, token: req.token });
        if (!dbUser) return res.send({ success: false, logout: true, message: "Token Invalid. Please login in again." });
        if (dbUser.token != req.token) return res.send({ success: false, logout: true, message: "Token Invalid. Please login in again." });

        Setting.findOne({}, { razorpaystatus: 1 }, function (err, status) {
            // // console.log(user);
            res.send({ status, success: true, message: "Razor Status get successfully" });
        });
    }
    catch (error) {
        res.send({ error, success: false, message: "Unknown error" });
    }
}


/////// ------ END Used Api ---- ///////

// User Zolo Login With Otp
module.exports.loginOtp = async (req, res) => {
    try {
        // console.log(req.body);
        let { phone } = req.body;
        if (!phone) return res.send({ success: false, message: "missing field/'s" });
        else {
            let otp = Math.floor(1000 + Math.random() * 9000);
            var options = {
                'method': 'GET',
                'url': `https://2factor.in/API/V1/${api_key}/SMS/${req.body.phone}/${otp}`,
                'headers': {
                    'content-type': 'application/x-www-form-urlencoded'
                }
            };
            request(options, async function (error, response) {
                // console.log(error);
                if (error) {
                    res.send({ error: error, success: false, message: "Please enter correct phone number." });
                }
                else {
                    // console.log(response)
                    var DbUser = await User.findOne({ mobile: phone, role: "user" }, {});
                    if (DbUser) {
                        var oldtoken = DbUser.token;

                        const token = Helper.generateToken(DbUser._id);

                        User.updateOne({ _id: DbUser._id }, { otp: otp, token: token })
                            .then(user => {
                                res.send({ data: DbUser, otp: otp, verifytoken: token, success: true, message: "Otp Has been sent!" });
                            })
                            .catch(error => {
                                res.send({ error, data: null, success: false, message: "Failed to send otp" });
                            })
                    } else {
                        res.send({ data: null, otp: otp, success: true, message: "Otp Has been sent!" });
                    }
                }
            });

        }
    }
    catch (error) {
        res.send({ error, success: false, message: "unknown error" });
    }
}

// Verify Number
module.exports.verifyNumber = (req, res) => {
    try {
        User.findOne({ phone: req.body.phone, type: req.body.type, typeId: req.body.typeId })
            .then(doc => {
                res.send({ doc, success: true, message: "User get succcessfully" });
            })
            .catch(error => {
                res.send({ error, success: false, message: "DB error in getting user" });
            })
    }
    catch (error) {
        res.send({ error, success: false, message: "Unknown error" });
    }
}

//User Register
module.exports.register = async (req, res) => {
    try {
        let manager;
        if (req.body.type == "Manager") {
            manager = await Manager.findOne({ _id: req.body.typeId });
        } else {
            manager = await SubAdmin.findOne({ _id: req.body.typeId });
        }

        var resultname = manager.username + Math.floor(1000 + Math.random() * 9000);

        User.find({
            type: req.body.type,
            typeId: req.body.typeId,
            $or: [
                { 'phone': req.body.phone },
                { 'username': resultname }
            ]
        }, function (err, docs) {
            //  if(!err) res.send(docs);
            if (err) {
                res.send({ error: err, success: false, message: "DB Error" });
            }
            else if (docs.length > 0) {
                res.send({ error: {}, success: false, message: "User already registered" });
            }
            else {
                let otp = Math.floor(1000 + Math.random() * 9000);

                var options = {
                    'method': 'GET',
                    'url': `https://2factor.in/API/V1/${api_key}/SMS/${req.body.phone}/${otp}`,
                    'headers': {
                        'content-type': 'application/x-www-form-urlencoded'
                    }
                };
                request(options, async function (error, response) {
                    if (error) {
                        res.send({ error: err, success: false, message: "Please enter correct phone number." });
                    }
                    else {

                        let id;
                        if (req.body.type == 'Subadmin') {
                            let subadmin = await SubAdmin.findOne({ _id: req.body.typeId });
                            id = subadmin.paisaexchId;
                        } else {
                            let manager = await Manager.findOne({ _id: req.body.typeId });
                            id = manager.paisaexchId;
                        }

                        var options = {
                            'method': 'POST',
                            'url': 'https://rnapi.paisaexch.com/api/createUser',
                            'headers': {
                                'cache-control': 'no-cache',
                                'content-type': 'application/x-www-form-urlencoded',
                                'postman-token': 'bd01daf8-bf7f-0688-a7c5-5c38ec34c6f8'
                            },
                            form: {
                                'username': resultname,
                                'password': req.body.password,
                                '_id': id,
                                'phone': req.body.phone,
                            }
                        };
                        request(options, async function (error, response) {
                            let body = JSON.parse(response.body);

                            if (error) {
                                res.send({ error, success: false, message: "DB error in user register" });
                            } else if (body.error == true) {
                                res.send({ error, success: false, message: body.message });
                            }
                            else {
                                const user = new User({
                                    name: req.body.name,
                                    username: resultname,
                                    phone: req.body.phone,
                                    password: util.hashPassword(req.body.password),
                                    promo: req.body.promo,
                                    type: req.body.type,
                                    typeId: req.body.typeId,
                                    otp: otp,
                                    status: 'inactive',
                                    paisaexchId: body.response._id,
                                });
                                user.save()
                                    .then(async doc => {


                                        // Push Notification Start
                                        if (manager.playerId) {
                                            let deviceIds = [manager.playerId];
                                            let partner = await SubAdmin.find({ managerId: user.typeId });
                                            for (let i = 0; i < partner.length; i++) {
                                                if (partner[i].playerId) {
                                                    deviceIds.push(partner[i].playerId);
                                                }
                                            }
                                            var datapush = {
                                                app_id: "047ed5ed-a6ce-4c14-990d-6e956b6402de",
                                                contents: { "en": `${req.body.name} has been registered` },
                                                headings: { "en": "New User Registered" },
                                                big_picture: "https://blog.taskpigeon.co/wp-content/uploads/2017/06/Advanced-Email-Notifications-Task-Pigeon.jpg",
                                                url: "",
                                                include_player_ids: deviceIds,
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
                                                    // console.log("Response:");
                                                    // // console.log(JSON.parse(datapush));

                                                });
                                            });

                                            requestpush.on('error', function (e) {
                                                // console.log("ERROR:");

                                                // console.log(e);
                                            });

                                            requestpush.write(JSON.stringify(datapush));
                                            requestpush.end();
                                        }
                                        // Push Notification End

                                        res.send({ doc, success: true, message: "User registered" });
                                    })
                                    .catch(error => {
                                        res.send({ error, success: false, message: "DB error in user register" });
                                    })
                            }

                        });


                    }
                });
            }
        });
    }
    catch (error) {
        // console.log(error);
        res.send({ error, success: false, message: "Unknown error" });
    }
}

// Verify OTP
module.exports.verifyOtp = (req, res) => {
    try {
        User.findOne({ phone: req.body.phone, type: req.body.type, typeId: req.body.typeId })
            .then(doc => {
                if (doc.otp == req.body.otp) {
                    var options = {
                        'method': 'POST',
                        'url': 'https://rnapi.paisaexch.com/api/updateUserStatus',
                        'headers': {
                            'Content-Type': 'application/json'
                        },
                        body: JSON.stringify({
                            "username": doc.username,
                            "status": "active"
                        })

                    };
                    request(options, function (error, response) {
                        if (error) throw new Error(error);
                        // console.log(response.body);
                    });

                    User.updateOne({ _id: doc._id }, { status: "active" })
                        .then(user => {
                            // console.log('Status Updated');
                        })
                        .catch(error => {
                            // console.log('Error In Status Update');
                        })
                    return res.send({ data: doc, success: true, message: "Otp has been verified successfully" });
                }
                else {
                    res.send({ data: {}, success: false, message: "Please enter correct otp" });
                }
            })
            .catch(error => {
                res.send({ error, success: false, message: "DB error in getting user" });
            })
    }
    catch (error) {
        res.send({ error, success: false, message: "Unknown error" });
    }
}

module.exports.updateStatus = (req, res) => {
    try {
        User.updateOne({ username: req.body.username }, { status: req.body.status })
            .then(user => {
                return res.send({ data: user, success: true, message: "Otp has been verified successfully" });
            })
            .catch(error => {
                return res.send({ error: error, success: false, message: "Otp has been verified successfully" });
            })
    }
    catch (error) {
        res.send({ error, success: false, message: "Unknown error" });
    }
}

// User Login
// module.exports.login = (req, res) => {
//     try {
//         let { phone, password } = req.body;
//         if (!phone || !password) return res.send({ success: false, message: "missing field/'s" });

//         else {
//             User.findOne({ phone: phone })
//                 .then(doc => {
//                     if (!doc) return res.send({ data: {}, success: false, message: "No such user found" });

//                     if (doc.status == 'inactive') return res.send({ data: {}, success: false, message: "Please login with otp to verify number" });

//                     if (!util.comparePassword(doc.password, password)) {
//                         return res.send({ data: {}, success: false, message: "Incorrect password" });
//                     }
//                     else {
//                         const token = util.Helper.generateToken(doc._id);

//                         User.updateOne({
//                             '_id': doc._id
//                         }, { token: token }, function (err, updateMessage) {

//                         });

//                         const data = { doc, token }
//                         res.send({ data, success: true, message: "user login success" });
//                     }
//                 })
//                 .catch(error => {
//                     res.send({ error, success: false, message: "DB error" });
//                 })
//         }
//     }
//     catch (error) {
//         res.send({ error, success: false, message: "unknown error" });
//     }
// }

// User Login with Username
module.exports.userlogin = (req, res) => {
    try {
        let { username, password } = req.body;
        if (!username || !password) return res.send({ success: false, message: "missing field/'s" });

        else {
            User.findOne({ username: username })
                .then(doc => {
                    if (!doc) return res.send({ data: {}, success: false, message: "No such user found" });

                    if (!util.comparePassword(doc.password, password)) {
                        return res.send({ data: {}, success: false, message: "Incorrect password" });
                    }
                    else {
                        const token = util.Helper.generateToken(doc._id);

                        User.updateOne({
                            '_id': doc._id
                        }, { token: token }, function (err, updateMessage) {

                        });

                        const data = { doc, token }
                        res.send({ data, success: true, message: "user login success" });
                    }
                })
                .catch(error => {
                    res.send({ error, success: false, message: "DB error" });
                })
        }
    }
    catch (error) {
        res.send({ error, success: false, message: "unknown error" });
    }
}

// Verify login OTP
module.exports.verifyloginOtp = (req, res) => {
    try {
        User.findOne({ phone: req.body.phone, type: req.body.type, typeId: req.body.typeId })
            .then(doc => {
                if (doc.otp == req.body.otp) {
                    User.updateOne({ _id: doc._id }, { status: "active" })
                        .then(user => {
                            // console.log('Status Updated');
                        })
                        .catch(error => {
                            // console.log('Error In Status Update');
                        })
                    const token = util.Helper.generateToken(doc._id);

                    const data = { doc, token }
                    res.send({ data, success: true, message: "user login success" });
                }
                else {
                    res.send({ data: {}, success: false, message: "Please enter correct otp" });
                }
            })
            .catch(error => {
                res.send({ error, success: false, message: "DB error in getting user" });
            })
    }
    catch (error) {
        res.send({ error, success: false, message: "Unknown error" });
    }
}

// Get Sites
module.exports.getSite = async (req, res) => {
    try {
        let decoded = jwt.verify(req.params.token, myEnv.parsed.SECRET);
        let { userId } = jwt.decode(req.params.token);
        let user = await User.findOne({ _id: userId });
        if (!user._id) return res.send({ success: false, message: "Token Invalid. Please login in again." });
        if (user.token != req.params.token) return res.send({ success: false, message: "Token Invalid. Please login in again." });

        let query;
        if (user.type == "Manager") {
            query = { type: "Admin", status: 'active' }
        } else {
            query = { type: "Subadmin", typeId: user.typeId, status: 'active' }
        }

        Site.find(query)
            .then(doc => {
                res.send({ doc, success: true, message: "Sites get successfully" });
            })
            .catch(error => {
                res.send({ error, success: false, message: "DB error in getting sites" });
            })
    }
    catch (error) {
        // console.log(error);
        res.send({ error, success: false, message: "Unknown error" });
    }
}

module.exports.userlogin = function (io, socket, request) {
    // Validate request data
    if (!request) return;
    if (!request.user) return;
    if (!request.user.username) return;
    if (!request.user.password) return;

    // console.log(request.user);

    // // console.log("login: " + JSON.stringify(request),request.user.username.toUpperCase());

    var output = {};
    User.findOne({
        username: request.user.username.toUpperCase()
    }, function (err, user) {

        // // console.log();

        if (err) logger.debug(err);
        // Check username
        if (!user) {
            logger.error('login-error: User not found ' + request.user.username);
            socket.emit('login-error', {
                "message": "User not found",
                success: false
            });
            return;
        }
        // Check password
        if (!user.validPassword(request.user.password)) {
            user.loginAttempts += 1;
            logger.error('login-error: Invalid password ' + request.user.username);
            socket.emit('login-error', {
                "message": "Invalid password",
                success: false
            });
            return;
        }
        // Reset login attempts counter
        user.loginAttempts = 0;
        //  user.save(function (err, updatedUser) { });

        // Check deleted or blocked account
        if (user.status != 'active') {
            logger.error('login-error: Account is blocked or deleted' + request.user.username);
            socket.emit('login-error', {
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

        var userDetails = {
            username: user.username,
            role: user.role,
            manager: user.manager,
            admin: user.admin,
            master: user.master,
            subadmin: user.subadmin,
            status: user.status,
            // type:user.type,
            // mobile:user.mobile,
            // balance:user.balance,
            // mainbalance:user.mainbalance,
            // exposure:user.exposure,
            // limit:user.limit,

        };

        var oldtoken = user.token;
        const token = Helper.Helper.generateToken(user._id);
        user.token = token;
        user.save(function (err, updatedUser) { });
        output._id = user._id;
        output.key = user.hash;
        output.apitoken = token;
        output.verifytoken = token;
        output.details = userDetails;
        // console.log(user.token);

        // io.emit("login-check", {
        //     output: oldtoken
        // });
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

function updateUsers() {
    var request = require('request');
    var options = {
        'method': 'GET',
        'url': 'https://acepunt.kushubmedia.com/admin/getUsers/eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiI2MjMwM2JjNmVmZDYyNWMwZmU5YjU4MjEiLCJpYXQiOjE2NTgyOTM3OTAsImV4cCI6MTY1ODg5ODU5MH0.VF1JhnXZE4PfZ7cL_gaenRZ2vWKc6zQ27xo65_abaXY',
        'headers': {
        }
    };
    request(options, async function (error, response) {
        if (error) throw new Error(error);

        var users = JSON.parse(response.body);
        users = users.doc;
        // console.log(users.length, users[0].username);
        let n = 0;
        while (n < users.length) {

            await User.update({ username: users[n].username },
                {
                    $set: {
                        mobile: users[n].phone,
                    }
                }, function (err, dbUpdatedUser) {
                    // console.log(n, users[n].username, users[n].phone);

                });

            n++;
        }

    });

}
// updateUsers();
module.exports.getChatUsers = function (io, socket, request) {
    if (!request) return;
    if (!request.user) return;
    if (!request.user.details) return;
    //logger.info("getChatUsers: request="+JSON.stringify(request));


    if (request.user.details.role == 'manager') {
        if (!request.filter || !request.sort) return;
        User.findOne({ hash: request.user.key, username: request.user.details.username, role: 'manager', deleted: false, status: 'active' }, function (err, dbManager) {
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
                            if (!chatmsg) {
                                var lastItem = [];
                            }
                            else {
                                var lastItem = chatmsg[chatmsg.length - 1];
                            }

                            callback(chatmsg, lastItem, index);
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

module.exports.updateWithdraw = function (io, socket, request) {

    if (!request) return;
    if (!request.user) return;
    //// console.log(request);
    //logger.info("updateWithdraw: request="+JSON.stringify(request));

    if (request.user.details.role == 'manager' || request.user.details.role == 'partner') {


        Finance.update({ _id: request.l._id },
            {
                $set: {
                    status: request.status,
                }
            }, function (err, dbUpdatedUser) {


                socket.emit('update-withdraw-success', { "message": "Status Update Success." });
            });

    }
}

module.exports.addFinance = function (io, socket, request) {

    if (!request) return;
    if (!request.user) return;
    // logger.info("addFinance: request="+JSON.stringify(request));

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

        socket.emit('add-finance-success', { 'message': 'Your request have been submitted' });
    }
}

module.exports.getFinance = function (io, socket, request) {

    if (!request) return;
    if (!request.user) return;
    // logger.info("getFinance: request="+JSON.stringify(request));

    if (request.user.details.role == 'user') {

        Finance.find(request.filter, function (err, data) {
            if (err) logger.error(err);
            //// console.log(data);

            socket.emit('get-finance-success', data);
        });
    }

    if (request.user.details.role == 'manager') {

        Finance.find(request.filter, function (err, data) {
            if (err) logger.error(err);
            // // console.log(data);

            socket.emit('get-finance-success', data);
        });
    }

    if (request.user.details.role == 'partner') {

        Finance.find(request.filter, function (err, data) {
            if (err) logger.error(err);
            //// console.log(data);

            socket.emit('get-finance-success', data);
        });
    }
}

module.exports.getManager = function (io, socket, request) {

    if (!request) return;
    if (!request.user) return;
    // logger.info("getManager: request="+JSON.stringify(request));

    if (request.user.details.role == 'user') {

        User.findOne({ username: request.user.details.manager }, function (err, dbUser) {
            if (err) logger.error(err);
            // // console.log(dbUser);

            socket.emit('get-manager-success', dbUser);
        });
    }
}

module.exports.updateManager = function (io, socket, request) {

    if (!request) return;
    if (!request.user) return;
    //// console.log(request);
    logger.info("updateManager: request=" + JSON.stringify(request));

    if (request.user.details.role == 'admin') {


        User.update({ username: request.updatedUser.username },
            {
                $set: {
                    version: request.updatedUser.version,
                    applink: request.updatedUser.applink
                }
            }, function (err, dbUpdatedUser) {
                //// console.log(dbUpdatedUser);
                // // console.log('hhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhh');

                socket.emit('update-user-success', { "message": "User Update Success." });
            });

    }
}

module.exports.getReheshUser = function (io, socket, request) {

    if (!request) return;
    if (!request.user) return;
    //logger.info("getUser: request="+JSON.stringify(request));

    if (request.user.details.role == 'user') {

        User.findOne({ username: request.user.details.username }, function (err, dbUser) {
            if (err) logger.error(err);
            //// console.log(dbUser);
            socket.emit('get-user-wheel-success', dbUser);
        });
    }
    if (request.user.details.role == 'partner') {
        if (!request.filter) request['filter'] = { username: request.user.details.username, role: 'partner', deleted: false };
        if (!request.filter) return;
        User.findOne(request.filter, function (err, user) {
            if (err) logger.error(err);
            socket.emit('get-user-success', user);
        });
    }
    if (request.user.details.role == 'manager') {
        if (!request.filter) request['filter'] = { username: request.user.details.username, role: 'manager', deleted: false };
        if (!request.filter) return;
        User.findOne(request.filter, function (err, user) {
            if (err) logger.error(err);
            socket.emit('get-user-success', user);
        });
    }
    if (request.user.details.role == 'admin') {
        if (!request.filter) request['filter'] = { username: request.user.details.username, role: 'admin', deleted: false };
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
    User.findOne({ username: request.user.details.manager }, function (err, user) {

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

    // logger.info("loginStatus: "+JSON.stringify(request));

    // Check for valid user
    var roles = [access.role];
    if (access.role2) roles.unshift(access.role2)
    User.findOne({ _id: request.user._id, role: { $in: roles }, hash: request.user.key, status: 'active', deleted: false }, function (err, user) {
        if (err) logger.debug(err);
        if (!user) {
            socket.emit('get-user-details-error', { message: 'Invalid user.', success: false });
            return;
        }
        // Check for existing session
        Session.findOne({ username: request.user.details.username, manager: request.user.details.manager, role: request.user.details.role }, function (err, userSession) {
            if (err) logger.debug(err);
            if (userSession) {
                if (userSession.headers['user-agent'] == socket.handshake.headers['user-agent']) {
                    userSession.socket = socket.id;
                    userSession.online = true;
                    userSession.save(function (err) {
                        if (err) logger.error(err);
                    });
                    User.findOne({ username: request.user.details.username, manager: request.user.details.manager }, function (err, userDetails) {
                        if (err) logger.debug(err);
                        if (!userDetails) {
                            socket.emit('get-user-details-error', { message: 'Invalid user.', success: false });
                            return;
                        }
                        else {
                            socket.emit("get-user-details-success", { userDetails: userDetails });
                        }
                    });
                }
                else {
                    io.self.to(userSession.socket).emit('session-expired', { session: userSession });
                    userSession.socket = socket.id;
                    userSession.headers = socket.handshake.headers;
                    userSession.online = true;
                    userSession.lastLogin = new Date();
                    userSession.save(function (err, updatedSession) { });
                    logger.warn(request.user.details.username + ' is trying to login from multiple places.');
                    socket.emit('multiple-login', { session: userSession });
                    return;
                }
            }
            else {
                logger.warn(request.user.details.username + ' no session found. Requesting to login again.');
                socket.emit('session-expired', { session: userSession });
                return;
            }
        });
        logger.info('login-status: ' + request.user.details.username + ' reconnected.');
    });
};

module.exports.getTvs = function (io, socket, request) {
    // Validate request data
    if (request)
        Tv.findOne({ name: "api" }, function (err, tv) {
            // // console.log(tv);
            socket.emit('get-tv-success', tv);
        });
};

module.exports.getMatchVideo = async function (io, socket, request) {
    try {

        // // console.log('shghjasghfhgashgfasgsaf');
        let n = Math.floor(Math.random() * Math.floor(6));
        // // console.log(n);
        CricketVideo.find({
            'TeamID': request.teamid,
            'OpponentID': request.opponentid,
        }, {}, { limit: 1, skip: n }, async function (err, dbMarket) {
            socket.emit('get-match-video-success', { data: dbMarket });
        });
    }
    catch (e) {
        socket.emit('get-match-video-error', { message: 'Invalid user.', success: false });
    }
}

module.exports.getVirtualCricket = async function (io, socket, request) {
    try {
        // // console.log('shghjasghfhgashgfasgsaf');
        Market.findOne({
            'eventTypeId': "v9",
            'marketType': 'virtualcricket',
            'marketBook.status': { $ne: 'CLOSED' }
        }, { marketName: 1, marketId: 1, Team1id: 1, Team2id: 1, Team1name: 1, Team2name: 1, Team1run: 1, Team2run: 1, Team1wicket: 1, Team2wicket: 1 }, { limit: 1 }, async function (err, dbMarket) {
            socket.emit('get-virtual-video-success', { data: dbMarket });
        });
    }
    catch (e) {
        // console.log(e);
        socket.emit('get-virtual-video-error', { message: 'Invalid user.', success: false });
    }
}

// User Login With Otp
module.exports.loginOtp = function (io, socket, request) {
    // Validate request data
    if (!request) return;
    if (!request.user) return;
    if (!request.user.phone) return;
    // if(!request.user.password) return;

    var mobile = "+91" + request.user.phone.toString();
    // console.log(mobile);

    User.findOne({ mobile: mobile, manager: request.user.manager })
        .then(doc => {

            if (doc) {
                let otp = Math.floor(1000 + Math.random() * 9000);
                var options = {
                    'method': 'GET',
                    'url': `https://2factor.in/API/V1/${api_key}/SMS/${mobile}/${otp}`,
                    'headers': {
                        'content-type': 'application/x-www-form-urlencoded'
                    }
                };
                request1(options, async function (error, response) {
                    if (error) {
                        // res.send({ error: err, success: false, message: "Please enter correct phone number." });
                        logger.error('login-error: Please enter correct phone number. ' + mobile);
                        socket.emit('login-error', { "message": "Please enter correct phone number.", success: false });
                        return;
                    }
                    else {

                        User.updateOne({ _id: doc._id }, { otp: otp })
                            .then(user => {
                                // res.send({ data: user, success: true, message: "Otp Has been sent!" });
                                socket.emit('loginotp-success', { "message": "Otp Has been sent!" });
                            })
                    }
                });
            } else {
                logger.error('login-error: User Not Found. ' + mobile);
            }
        })
        .catch(error => {
            logger.error(error);
            logger.error('login-error: User not found ' + request.user.phone);
            socket.emit('login-error', { "message": "User not found", success: false });
            return;
        })


}

// Verify login OTP
module.exports.verifyloginOtp = function (io, socket, request) {
    // Validate request data
    if (!request) return;
    if (!request.user) return;
    if (!request.user.phone) return;
    if (!request.user.otp) return;

    var mobile = "+91" + request.user.phone.toString();
    // console.log(mobile);
    var output = {};
    User.findOne({ mobile: mobile, manager: request.user.manager })
        .then(user => {
            if (user.otp == request.user.otp) {
                User.updateOne({ username: user.username, manager: user.manager }, { status: "active" })
                    .then(doc => {

                        // Check deleted or blocked account
                        if (user.status != 'active') {
                            logger.error('login-error: Account is blocked or deleted' + mobile);
                            socket.emit('login-error', { "message": "Account is not accessible anymore. Contact the admin to activate the account.", success: false });
                            return;
                        }
                        logger.info('login: ' + user.username + ' logged in.');
                        // Send user details to client
                        User.findOne({ username: user.username, manager: user.manager }, function (err, userDetails) {
                            if (err || !userDetails) {
                                logger.error('login: DBError in finding user details.');
                                return;
                            }

                            const token = Helper.generateToken(user._id);
                            // console.log(token);
                            User.updateOne({ _id: user._id }, { token: token })
                                .then(users => {
                                    output._id = user._id;
                                    output.key = user.hash;
                                    output.verifytoken = token;
                                    output.details = userDetails;
                                    socket.emit("login-success", { output: output });
                                })


                            // output._id = user._id;
                            // output.key = user.hash;
                            // output.details = userDetails;
                            // socket.emit("login-verifyotp-success", { output: output });
                            // Todo: send updated active users to manager and admin
                            // Delete existing session and create new one


                            Session.findOne({ username: user.username, manager: user.manager }, function (err, session) {
                                if (err) logger.debug(err);
                                //// console.log(session.socket+' '+user.username)
                                //// console.log(session)
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
                                }
                                else {
                                    Session.remove({ username: user.username });
                                    // Send session updating notification
                                    io.to(session.socket).emit('session-expired', { session: session });
                                    //io.emit('session-expired',{session:userDetails.username});

                                    io.emit('multiple-login', { session: session });

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
                        });
                    })
            }
            else {
                logger.error('login-error: Otp Not Matched! ' + request.user.otp);
                socket.emit('login-error', { "message": "Otp Not Matched!", success: false });
                return;
            }
        })
        .catch(error => {
            logger.error('login-error: User not found ' + request.user.phone);
            socket.emit('login-error', { "message": "User not found", success: false });
            return;
        })

}

module.exports.loginverify = function (io, socket, request) {
    // Validate request data

    if (!request) return;
    if (!request.user.token) return;

    var output = {};
    User.findOne({ token: request.user.token }, function (err, user) {
        if (err) logger.debug(err);
        // Check username
        if (!user) {
            //logger.error('login-error: User not found '+request.user.username);
            socket.emit('login-error', { "message": "User not found", success: false });
            return;
        }

        // Reset login attempts counter
        user.loginAttempts = 0;
        user.save(function (err, updatedUser) { });

        // Check deleted or blocked account

        //logger.info('login: '+user.username+' logged in.');
        // Send user details to client
        User.findOne({ username: user.username }, function (err, userDetails) {
            if (err || !userDetails) {
                logger.error('login: DBError in finding user details.');
                return;
            }

            const token = Helper.generateToken(user._id);
            // console.log(token);
            User.updateOne({ _id: user._id }, { token: token })
                .then(users => {
                    output._id = user._id;
                    output.key = user.hash;
                    output.token = token;
                    output.details = userDetails;
                    socket.emit("login-success", { output: output });
                })


            // output._id = userDetails._id;
            // output.key = userDetails.hash;
            // output.details = user;
            // socket.emit("login-success", { output: output });
            // Todo: send updated active users to manager and admin
            // Delete existing session and create new one


            Session.findOne({ username: user.username, manager: user.manager }, function (err, session) {
                if (err) logger.debug(err);
                //// console.log(session.socket+' '+user.username)
                //  // console.log(session)
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
                }
                else {
                    Session.remove({ username: user.username });
                    // Send session updating notification
                    io.to(session.socket).emit('session-expired', { session: session });
                    //io.emit('session-expired',{session:userDetails.username});

                    io.emit('multiple-login', { session: session });

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
        });
    });
};

module.exports.logout = function (io, socket, request) {
    // Validate request data
    if (request)
        if (request.user)
            if (request.user.details)
                logger.info(request.user.details.username + ' logged out');
    // Todo: send updated activer users to manager and admin

    // Delete Session
    // Session.remove({ socket: socket.id }, function (err, data) {
    //     if (err) logger.error(err);
    // socket.emit('logout');
    // });
};

module.exports.updatePassword = function (io, socket, request) {

    // // console.log(request);
    if (!request) return;
    if (!request.user || !request.password) return;
    if (request.password == '') return;

    // logger.info("updatePassword: "+JSON.stringify(request));
    User.findOne({ username: request.user.details.username, role: request.user.details.role, hash: request.user.key, deleted: false, status: 'active' }, function (err, dbUser) {
        if (err) logger.debug(err);
        if (!dbUser) {
            // // console.log("Invalid Access");
            logger.error("Invalid Access: " + JSON.stringify(request));
            socket.emit('logout');
            return;
        }
        if (!request.targetUser) {
            var user = new User();
            user.setPassword(request.password);
            dbUser.hash = user.hash;
            dbUser.salt = user.salt;
            dbUser.transctionpasswordstatus = 1;
            dbUser.save(function (err, updatedLogin) {
                if (err) logger.error(err);

                // // console.log("password changed");
                socket.emit("update-password-success", { "message": "Password changed successfully.", success: true });
                Session.remove({ username: request.user.details.username }, function (err, data) {
                    socket.emit('logout');
                });
            });
        }
        else {
            if (request.user.details.role == 'admin') {
                if (request.targetUser.role == 'admin') return;
                User.findOne({ username: request.targetUser.username, role: request.targetUser.role, deleted: false }, function (err, result) {
                    if (err) logger.error(err);
                    if (!result) {
                        socket.emit("update-password-error", { "message": "User not found. Please try again.", success: false });
                        return;
                    }
                    var user = new User();
                    user.setPassword(request.password);
                    result.hash = user.hash;
                    result.salt = user.salt;
                    result.save(function (err, updatedLogin) {
                        if (err) logger.error(err);
                        socket.emit("update-password-success", { "message": "Password changed successfully.", success: true });
                        Session.remove({ username: request.targetUser.username });
                    });
                });

            }
            if (request.user.details.role == 'manager') {
                if (request.targetUser.role != 'user' && request.targetUser.role != 'partner') return;
                User.findOne({ hash: request.user.key, username: request.user.details.username, role: 'manager', deleted: false, status: 'active' }, function (err, dbAdmin) {
                    if (err) logger.error(err);
                    if (!dbAdmin) {
                        logger.error("Invalid Access: " + JSON.stringify(request));
                        return;
                    }
                    User.findOne({ username: request.targetUser.username, role: request.targetUser.role, deleted: false }, function (err, result) {
                        if (err) logger.error(err);
                        if (!result) {
                            socket.emit("update-password-error", { "message": "Password change failed.", success: false });
                            return;
                        }
                        var user = new User();
                        user.setPassword(request.password);
                        result.hash = user.hash;
                        result.salt = user.salt;
                        result.save(function (err, updatedLogin) {
                            if (err) logger.error(err);
                            socket.emit("update-password-success", { "message": "Password changed successfully.", success: true });
                            Session.remove({ username: request.targetUser.username });
                        });
                    });

                });
            }

            if (request.user.details.role == 'partner') {
                if (request.targetUser.role != 'user') return;
                User.findOne({ hash: request.user.key, username: request.user.details.username, role: 'partner', deleted: false, status: 'active' }, function (err, dbAdmin) {
                    if (err) logger.error(err);
                    if (!dbAdmin) {
                        logger.error("Invalid Access: " + JSON.stringify(request));
                        return;
                    }
                    User.findOne({ username: request.targetUser.username, role: request.targetUser.role, deleted: false }, function (err, result) {
                        if (err) logger.error(err);
                        if (!result) {
                            socket.emit("update-password-error", { "message": "Password change failed.", success: false });
                            return;
                        }
                        var user = new User();
                        user.setPassword(request.password);
                        result.hash = user.hash;
                        result.salt = user.salt;
                        result.save(function (err, updatedLogin) {
                            if (err) logger.error(err);
                            socket.emit("update-password-success", { "message": "Password changed successfully.", success: true });
                            Session.remove({ username: request.targetUser.username });
                        });
                    });

                });
            }


        }
    });

};

// module.exports.oldcreateUser = function (io, socket, request) {
//   // - validate request data
//   //// console.log(request.newUser.role);
//   if (!request) return;
//   if (!request.user || !request.newUser) return;
//   if (!request.user.details || !request.user._id || !request.user.key) return;
//   if (!request.user.details.username || !request.user.details.role) return;
//   if (!request.newUser.username || !request.newUser.password || !request.newUser.role) return;

//   // logger.info('createUser: '+JSON.stringify(request));

//   // - check for permissions
//   if (request.newUser.role == 'operator') {
//     if (request.user.details.role != 'admin') return;
//     // authenticate admin
//     User.findOne({ username: request.user.details.username, role: 'admin', status: 'active', deleted: false, hash: request.user.key }, function (err, dbAdmin) {
//       if (err) logger.error(err);
//       if (dbAdmin) {
//         // create manager
//         // check if manager already exists
//         User.findOne({ username: request.newUser.username }, function (err, userCheck) {
//           if (err) logger.error(err);
//           if (userCheck) {
//             logger.error('create-user-error: User already exists');
//             socket.emit("create-user-error", { "message": "User already exists", success: false, user: userCheck });
//             return;
//           }
//           //create new user
//           var userLogin = new User();
//           userUser.username = request.newUser.username;
//           userUser.role = 'operator';
//           userUser.setPassword(request.newUser.password);
//           userUser.status = 'inactive';
//           userUser.manager = dbAdmin.username;
//           userUser.deleted = false;

//           //set user details
//           var user = new User();
//           user.username = userUser.username;
//           user.setDefaults();
//           user.role = 'operator';
//           user.manager = dbAdmin.username;
//           user.openingDate = new Date();

//           userUser.save(function (err) {
//             if (err) {
//               logger.error('create-user-error: DBError in Users');
//               socket.emit("create-user-error", { "message": "Error in creating record", success: false });
//               return;
//             }
//             else {
//               //log start
//               var log = new Log();
//               log.username = userUser.username;
//               log.action = 'ACCOUNT';
//               log.subAction = 'ACCOUNT_CREATE';
//               log.description = 'New account created.';
//               log.manager = userUser.manager;
//               log.time = new Date();
//               log.deleted = false;
//               log.save(function (err) { if (err) { logger.error('create-user-error: Log entry failed.'); } });
//               //log end
//               user.save(function (err) {
//                 if (err) {
//                   logger.error('create-user-error: DBError in UserDetails');
//                   socket.emit("create-user-error", { "message": "Error in saving user details.", success: false });
//                 }
//                 else {
//                   logger.info('create-user-success: Manager account created successfully.');
//                   socket.emit("create-user-success", user);
//                 }
//               });
//             }
//           });
//         });
//       }
//     });
//   }
//   if (request.newUser.role == 'manager') {
//     if (request.user.details.role != 'admin') return;
//     // authenticate admin
//     User.findOne({ username: request.user.details.username, role: 'admin', status: 'active', deleted: false, hash: request.user.key }, function (err, dbAdmin) {
//       if (err) {
//         logger.debug(err);
//         return;
//       }
//       if (dbAdmin) {
//         // create manager
//         // check if manager already exists
//         User.findOne({ username: request.newUser.username }, function (err, userCheck) {
//           if (err) {
//             logger.debug(err);
//             return;
//           }
//           if (userCheck) {
//             logger.error('create-user-error: User already exists');
//             socket.emit("create-user-error", { "message": "User already exists", success: false, user: userCheck });
//             return;
//           }
//           else {
//             //create new user
//             var userLogin = new User();
//             userUser.username = request.newUser.username;
//             userUser.role = 'manager';
//             userUser.type = request.newUser.type;
//             userUser.setPassword(request.newUser.password);
//             userUser.status = 'inactive';
//             userUser.manager = dbAdmin.username;
//             userUser.deleted = false;

//             //set user details
//             var user = new User();
//             user.username = userUser.username;
//             user.setDefaults();
//             user.role = 'manager';
//             user.type = request.newUser.type;
//             user.manager = dbAdmin.username;
//             user.sharing = request.newUser.share;
//             user.openingDate = new Date();

//             userUser.save(function (err) {
//               if (err) {
//                 logger.error('create-user-error: DBError in Users');
//                 socket.emit("create-user-error", { "message": "Error in creating record", success: false });
//                 return;
//               }
//               else {
//                 //log start
//                 var log = new Log();
//                 log.username = userUser.username;
//                 log.action = 'ACCOUNT';
//                 log.subAction = 'ACCOUNT_CREATE';
//                 log.description = 'New account created.';
//                 log.manager = userUser.manager;
//                 log.time = new Date();
//                 log.deleted = false;
//                 log.save(function (err) { if (err) { logger.error('create-user-error: Log entry failed.'); } });
//                 //log end
//                 user.save(function (err) {
//                   if (err) {
//                     logger.error('create-user-error: DBError in UserDetails');
//                     socket.emit("create-user-error", { "message": "Error in saving user details.", success: false });
//                   }
//                   else {
//                     logger.info('create-user-success: Manager account created successfully.');
//                     socket.emit("create-user-success", user);
//                   }
//                 });
//               }
//             });
//           }
//         });
//       }
//     });
//   }
//   if (request.newUser.role == 'partner') {
//     if (request.user.details.role != 'admin' && request.user.details.role != 'manager') return;
//     // authenticate manager
//     User.findOne({ username: request.user.details.username, role: 'manager', status: 'active', deleted: false }, function (err, dbAdmin) {
//       if (err) {
//         logger.debug(err);
//         return;
//       }
//       if (dbAdmin) {
//         // create manager
//         // check if manager already exists
//         User.findOne({ username: request.newUser.username }, function (err, userCheck) {
//           if (err) {
//             logger.debug(err);
//             return;
//           }
//           if (userCheck) {
//             logger.error('create-user-error: User already exists');
//             socket.emit("create-user-error", { "message": "User already exists", success: false, user: userCheck });
//             return;
//           }
//           dbAdmin.partnerCount += 1;
//           if (dbAdmin.userCount > dbAdmin.partnetLimit) {
//             logger.error('create-user-error: Out of user quota.');
//             socket.emit("create-user-error", { "message": "You reached maximum number of partners under you. Please increase your partner quota.", success: false });
//             return;
//           }
//           dbAdmin.save(function (err) {
//             if (err) logger.error(err);
//           });

//           //create new user
//           var userLogin = new User();
//           userUser.username = request.newUser.username;
//           userUser.role = 'partner';
//           userUser.setPassword(request.newUser.password);
//           userUser.status = 'inactive';
//           userUser.manager = dbAdmin.username;
//           userUser.deleted = false;

//           //set user details
//           var user = new User();
//           user.username = userUser.username;
//           user.setDefaults();
//           user.role = 'partner';
//           user.limit = request.user.details.limit;
//           user.manager = dbAdmin.username;
//           user.openingDate = new Date();

//           userUser.save(function (err) {
//             if (err) {
//               logger.error('create-user-error: DBError in Users');
//               socket.emit("create-user-error", { "message": "Error in creating record", success: false });
//               return;
//             }
//             else {
//               //log start
//               var log = new Log();
//               log.username = userUser.username;
//               log.action = 'ACCOUNT';
//               log.subAction = 'ACCOUNT_CREATE';
//               log.description = 'New account created.';
//               log.manager = userUser.manager;
//               log.time = new Date();
//               log.deleted = false;
//               log.save(function (err) { if (err) { logger.error('create-user-error: Log entry failed.'); } });
//               //log end
//               user.save(function (err) {
//                 if (err) {
//                   logger.error('create-user-error: DBError in UserDetails');
//                   socket.emit("create-user-error", { "message": "Error in saving user details.", success: false });
//                 }
//                 else {
//                   logger.info('create-user-success: User account created successfully.');
//                   socket.emit("create-user-success", user);
//                 }
//               });
//             }
//           });
//         });
//       }
//     });
//   }
//   if (request.newUser.role == 'user') {
//     if (request.user.details.role != 'admin' && request.user.details.role != 'manager' && request.user.details.role != 'partner') return;
//     // authenticate manager
//     User.findOne({ username: request.user.details.username, role: { $in: ['admin', 'manager', 'partner'] }, status: 'active', deleted: false }, function (err, dbAdmin) {
//       if (err) logger.error(err);
//       if (!dbAdmin) return;
//       if (dbAdmin.role == 'partner') {
//         User.findOne({ username: request.user.details.manager, role: 'manager', status: 'active', deleted: false }, function (err, dbManager) {
//           if (err) logger.error(err);
//           if (!dbManager) return;
//           User.findOne({ username: request.newUser.username }, function (err, userCheck) {
//             if (err) logger.error(err);
//             if (userCheck) {
//               logger.error('create-user-error: User already exists');
//               socket.emit("create-user-error", { "message": "User already exists", success: false, user: userCheck });
//               return;
//             }
//             dbManager.userCount += 1;
//             if (dbManager.userCount > dbManager.userLimit) {
//               logger.error('create-user-error: Out of user quota.');
//               socket.emit("create-user-error", { "message": "You reached maximum number of users under you. Please increase your user quota.", success: false });
//               return;
//             }
//             dbManager.save(function (err) {
//               if (err) logger.error(err);
//             });
//             //create new user
//             var userLogin = new User();
//             userUser.username = request.newUser.username;
//             userUser.role = 'user';
//             userUser.setPassword(request.newUser.password);
//             userUser.status = 'active';
//             userUser.manager = dbManager.username;
//             userUser.deleted = false;

//             //set user details
//             var user = new User();
//             user.username = userUser.username;
//             user.setDefaults();
//             user.matchFees = request.newUser.fees;
//             user.role = 'user';
//             user.status = 'active';
//             user.manager = dbManager.username;
//             user.note = request.newUser.note;
//             if (request.newUser.limit) {
//               user.exposure = request.newUser.exposure;
//               user.limit = request.newUser.limit;
//               user.balance = request.newUser.balance;

//             }

//             user.commision = request.newUser.commision;
//             user.openingDate = new Date();
//             if (request.newUser.limit) {
//               //save log
//               var logSave = new Log();
//               logSave.username = userUser.username;
//               logSave.action = 'BALANCE';
//               logSave.subAction = 'BALANCE_DEPOSIT';
//               logSave.amount = request.newUser.balance;
//               logSave.oldLimit = 0;
//               logSave.newLimit = request.newUser.balance;
//               logSave.mnewLimit = request.newUser.balance;
//               logSave.description = 'Balance updated. Old Limit: 0  . New Limit: ' + request.newUser.balance;
//               logSave.manager = dbManager.username;
//               logSave.relation = dbManager.username;
//               logSave.time = new Date();
//               logSave.deleted = false;
//               //// console.log(log);
//               logSave.save(function (err) { if (err) { logger.error('update-user-balance-error: Log entry failed.'); } });
//             }




//             userUser.save(function (err) {
//               if (err) {
//                 logger.error('create-user-error: DBError in Users');
//                 socket.emit("create-user-error", { "message": "Error in creating record", success: false });
//                 return;
//               }
//               else {
//                 //log start
//                 var log = new Log();
//                 log.username = userUser.username;
//                 log.action = 'ACCOUNT';
//                 log.subAction = 'ACCOUNT_CREATE';
//                 log.description = 'New account created.';
//                 log.manager = request.user.details.username;
//                 log.time = new Date();
//                 log.deleted = false;
//                 log.save(function (err) { if (err) { logger.error('create-user-error: Log entry failed.'); } });
//                 //log end
//                 user.save(function (err) {
//                   if (err) {
//                     logger.error('create-user-error: DBError in UserDetails');
//                     socket.emit("create-user-error", { "message": "Error in saving user details.", success: false });
//                   }
//                   else {
//                     logger.info('create-user-success: User account created successfully.');
//                     socket.emit("create-user-success", user);
//                   }
//                 });
//               }
//             });
//           });

//         });
//       }
//       else {
//         User.findOne({ username: request.newUser.username }, function (err, userCheck) {
//           if (err) logger.error(err);
//           if (userCheck) {
//             logger.error('create-user-error: User already exists');
//             socket.emit("create-user-error", { "message": "User already exists", success: false, user: userCheck });
//             return;
//           }
//           dbAdmin.userCount += 1;
//           if (dbAdmin.userCount > dbAdmin.userLimit) {
//             logger.error('create-user-error: Out of user quota.');
//             socket.emit("create-user-error", { "message": "You reached maximum number of users under you. Please increase your user quota.", success: false });
//             return;
//           }
//           dbAdmin.save(function (err) {
//             if (err) logger.error(err);
//           });
//           //create new user
//           var userLogin = new User();
//           userUser.username = request.newUser.username;
//           userUser.role = 'user';
//           userUser.setPassword(request.newUser.password);
//           userUser.status = 'active';
//           userUser.manager = dbAdmin.username;
//           userUser.deleted = false;

//           //set user details
//           var user = new User();
//           user.username = userUser.username;
//           user.setDefaults();
//           user.matchFees = request.newUser.fees;
//           user.role = 'user';
//           user.status = 'active';
//           user.manager = dbAdmin.username;
//           user.note = request.newUser.note;
//           if (request.newUser.limit) {
//             user.exposure = request.newUser.exposure;
//             user.limit = request.newUser.limit;
//             user.balance = request.newUser.balance;
//           }

//           user.commision = request.newUser.commision;
//           user.openingDate = new Date();

//           if (request.newUser.limit) {
//             //save log
//             var logSave = new Log();
//             logSave.username = userUser.username;
//             logSave.action = 'BALANCE';
//             logSave.subAction = 'BALANCE_DEPOSIT';
//             logSave.oldLimit = 0;
//             logSave.newLimit = request.newUser.balance;
//             logSave.mnewLimit = request.newUser.balance;
//             logSave.description = 'Balance updated. Old Limit: 0 . New Limit: ' + request.newUser.balance;
//             logSave.manager = dbAdmin.username;
//             logSave.relation = dbAdmin.username;
//             logSave.time = new Date();
//             logSave.deleted = false;
//             //// console.log(log);
//             logSave.save(function (err) { if (err) { logger.error('update-user-balance-error: Log entry failed.'); } });
//           }

//           userUser.save(function (err) {
//             if (err) {
//               logger.error('create-user-error: DBError in Users');
//               socket.emit("create-user-error", { "message": "Error in creating record", success: false });
//               return;
//             }
//             else {
//               //log start
//               var log = new Log();
//               log.username = userUser.username;
//               log.action = 'ACCOUNT';
//               log.subAction = 'ACCOUNT_CREATE';
//               log.description = 'New account created.';
//               log.manager = userUser.manager;
//               log.time = new Date();
//               log.deleted = false;
//               log.save(function (err) { if (err) { logger.error('create-user-error: Log entry failed.'); } });
//               //log end
//               user.save(function (err) {
//                 if (err) {
//                   logger.error('create-user-error: DBError in UserDetails');
//                   socket.emit("create-user-error", { "message": "Error in saving user details.", success: false });
//                 }
//                 else {
//                   logger.info('create-user-success: User account created successfully.');
//                   socket.emit("create-user-success", user);
//                 }
//               });
//             }
//           });
//         });
//       }
//     });
//   }
// }




module.exports.getBalance = function (io, socket, request) {
    if (!request) return;
    if (!request.user) return;
    // logger.info("getUser: request="+JSON.stringify(request));

    // // console.log(request.user);
    if (request.user.details.role == "manager") {
        User.findOne({ username: request.user.details.username, role: 'manager', deleted: false }, function (err, user) {
            if (err) logger.error(err);
            socket.emit('update-manager-balance-success', user);
        });
    }
    else {
        User.findOne({ username: request.user.details.username, role: 'partner', deleted: false }, function (err, user) {
            if (err) logger.error(err);
            socket.emit('update-manager-balance-success', user);
        });
    }



}



module.exports.getUser = function (io, socket, request) {
    // // console.log("getUser: request="+JSON.stringify(request));
    if (!request) return;
    if (!request.user) return;
    // logger.info("getUser: request="+JSON.stringify(request));
    // // console.log("getUser: request="+JSON.stringify(request));

    User.findOne({ username: request.user.details.username, role: request.user.details.role, hash: request.user.key, token: request.user.token, deleted: false, status: 'active' }, function (err, dbUser) {
        if (err) logger.debug(err);
        if (!dbUser) {
            logger.error("Invalid Access getUser: " + JSON.stringify(request));
            io.to(socket.id).emit('logout');
            return;
        }

        if (request.user.details.role == 'user') {
            User.findOne({ username: request.user.details.username }, function (err, dbUser) {
                if (err) logger.error(err);
                socket.emit('get-user-success', dbUser);
            });
        }
        if (request.user.details.role == 'partner') {
            if (!request.filter) request['filter'] = { username: request.user.details.username, role: 'partner', deleted: false };
            if (!request.filter) return;
            User.findOne(request.filter, function (err, user) {
                if (err) logger.error(err);
                socket.emit('get-user-success', user);
            });
        }
        if (request.user.details.role == 'manager') {
            if (!request.filter) request['filter'] = { username: request.user.details.username, role: 'manager', deleted: false };
            if (!request.filter) return;
            User.findOne(request.filter, function (err, user) {
                if (err) logger.error(err);
                socket.emit('get-user-success', user);
            });
        }
        if (request.user.details.role == 'admin') {
            if (!request.filter) request['filter'] = { username: request.user.details.username, role: 'admin', deleted: false };
            if (!request.filter) return;
            User.findOne(request.filter, function (err, user) {
                if (err) logger.error(err);
                socket.emit('get-user-success', user);
            });
        }
    });
}

module.exports.getUsers = function (io, socket, request) {
    if (!request) return;
    if (!request.user) return;
    if (!request.user.details) return;
    // logger.info("getUser: request="+JSON.stringify(request));

    if (request.user.details.role == 'partner') {
        if (!request.filter || !request.sort) return;
        User.findOne({ hash: request.user.key, username: request.user.details.username, role: 'partner', deleted: false, status: 'active' }, function (err, dbManager) {
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
        if (!request.filter || !request.sort) return;
        User.findOne({ hash: request.user.key, username: request.user.details.username, role: 'manager', deleted: false, status: 'active' }, function (err, dbManager) {
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
    if (request.user.details.role == 'admin') {
        if (!request.filter || !request.sort) return;
        User.findOne({ hash: request.user.key, username: request.user.details.username, role: 'admin', deleted: false, status: 'active' }, function (err, dbAdmin) {
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

    if (request.user.details.role == 'operator') {
        if (!request.filter || !request.sort) return;
        User.findOne({ hash: request.user.key, username: request.user.details.username, role: 'operator', deleted: false, status: 'active' }, function (err, dbAdmin) {
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
}

module.exports.getUserCount = function (io, socket, request) {
    if (!request) return;
    if (!request.user) return;
    if (!request.user.details) return;
    // logger.info("getUserCount: request="+JSON.stringify(request));

    User.findOne({ username: request.user.details.username, role: request.user.details.role, hash: request.user.key, deleted: false }, function (err, dbUser) {
        if (err) logger.debug(err);
        if (!dbUser) {
            logger.error("Invalid Access: " + JSON.stringify(request));
            socket.emit('logout');
            return;
        }
        if (dbUser.role == 'admin') {
            result = { user: 0, manager: 0, partner: 0, joinedToday: 0, joinedThisMonth: 0, blockedManagers: 0 };
            User.count({ role: 'manager', deleted: false, status: 'active' }).exec(function (err, managerCount) {
                if (err) logger.error(err);
                result['manager'] = managerCount;
                User.count({ role: 'partner', deleted: false, status: 'active' }).exec(function (err, partnerCount) {
                    if (err) logger.error(err);
                    result['partner'] = partnerCount;
                    User.count({ role: 'user', deleted: false, status: 'active' }).exec(function (err, userCount) {
                        if (err) logger.error(err);
                        result['user'] = userCount;
                        User.count({ deleted: false, status: 'active', openingDate: { $gte: (new Date((new Date()).getTime() - (1 * 24 * 60 * 60 * 1000))) } }).exec(function (err, joinedTodayCount) {
                            if (err) logger.error(err);
                            result['joinedToday'] = joinedTodayCount;
                            User.count({ deleted: false, status: 'active', openingDate: { $gte: (new Date((new Date()).getTime() - (30 * 24 * 60 * 60 * 1000))) } }).exec(function (err, joinedThisMonth) {
                                if (err) logger.error(err);
                                result['joinedThisMonth'] = joinedThisMonth;
                                User.count({ deleted: false, status: 'blocked' }).exec(function (err, blockedManagers) {
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
            result = { user: 0, manager: 0, partner: 0, joinedToday: 0, joinedThisMonth: 0, blockedManagers: 0 };
            User.count({ role: 'manager', deleted: false, status: 'active' }).exec(function (err, managerCount) {
                if (err) logger.error(err);
                result['manager'] = managerCount;
                User.count({ role: 'partner', deleted: false, status: 'active' }).exec(function (err, partnerCount) {
                    if (err) logger.error(err);
                    result['partner'] = partnerCount;
                    User.count({ role: 'user', deleted: false, status: 'active' }).exec(function (err, userCount) {
                        if (err) logger.error(err);
                        result['user'] = userCount;
                        User.count({ deleted: false, status: 'active', openingDate: { $gte: (new Date((new Date()).getTime() - (1 * 24 * 60 * 60 * 1000))) } }).exec(function (err, joinedTodayCount) {
                            if (err) logger.error(err);
                            result['joinedToday'] = joinedTodayCount;
                            User.count({ deleted: false, status: 'active', openingDate: { $gte: (new Date((new Date()).getTime() - (30 * 24 * 60 * 60 * 1000))) } }).exec(function (err, joinedThisMonth) {
                                if (err) logger.error(err);
                                result['joinedThisMonth'] = joinedThisMonth;
                                User.count({ deleted: false, status: 'blocked' }).exec(function (err, blockedManagers) {
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

module.exports.updateSharing = function (io, socket, request) {
    // // console.log(request);
    if (!request) return;
    if (!request.user || !request.updatedUser) return;
    logger.debug("updateSharing: " + JSON.stringify(request));

    User.findOne({ username: request.user.details.username, deleted: false, status: 'active', role: request.user.details.role }, function (err, dbUser) {
        if (err) {
            logger.error(err);
            return;
        }
        if (!dbUser) {
            logger.error("Invalid username for given role " + JSON.stringify(dbUser));
            return;
        }


        if (dbUser.role == 'admin') {

            if (request.updatedUser.role == 'manager') {
                User.update({ username: request.updatedUser.username, role: request.updatedUser.role },
                    {
                        $set: {
                            sharing: request.updatedUser.sharing
                        }
                    }, function (err, dbUpdatedUser) {
                        if (err) {
                            logger.debug(err);
                        }
                        socket.emit('update-user-success', { message: 'User record updated successfully.' });
                    });
            }


            //check for additional permissions
        }

    });
}

module.exports.updateUser = function (io, socket, request) {
    //// console.log(request);
    if (!request) return;
    if (!request.user || !request.updatedUser) return;
    logger.debug("updateUser: " + JSON.stringify(request));

    User.findOne({ username: request.user.details.username, deleted: false, status: 'active', role: request.user.details.role }, function (err, dbUser) {
        if (err) {
            logger.error(err);
            return;
        }
        if (!dbUser) {
            logger.error("Invalid username for given role " + JSON.stringify(dbUser));
            return;
        }
        if (dbUser.role == 'admin') {
            if (request.updatedUser.role == 'admin') {
                User.update({ username: dbUser.username, role: request.updatedUser.role },
                    {
                        $set: {
                            image: request.updatedUser.image
                        }
                    }, function (err, dbUpdatedUser) {
                        if (err) {
                            logger.debug(err);
                        }
                        socket.emit('update-user-success', { message: 'User record updated successfully.' });
                    });
            }
            else {
                User.update({ username: request.updatedUser.username, role: request.updatedUser.role }, { $set: { status: request.updatedUser.status, loginAttempts: 0 } }, function (err, dbUpdatedLogin) {
                    if (err) {
                        logger.debug(err);
                        return;
                    }
                    User.update({ username: request.updatedUser.username, role: request.updatedUser.role },
                        {
                            $set: {
                                status: request.updatedUser.status,
                                image: request.updatedUser.image,
                                availableEventTypes: request.updatedUser.availableEventTypes,
                                sessionAccess: request.updatedUser.sessionAccess,
                                partnerPermissions: request.updatedUser.partnerPermissions,
                                partnerLimit: request.updatedUser.partnerLimit,
                                userLimit: request.updatedUser.userLimit
                            }
                        }, function (err, dbUpdatedUser) {
                            if (err) {
                                logger.debug(err);
                            }
                            socket.emit('update-user-success', { message: 'User record updated successfully.' });
                        });
                });
            }
        }
        if (dbUser.role == 'manager') {
            if (request.updatedUser.role == 'manager') {
                User.update({ username: dbUser.username, role: request.updatedUser.role },
                    {
                        $set: {
                            image: request.updatedUser.image
                        }
                    }, function (err, dbUpdatedUser) {
                        if (err) {
                            logger.debug(err);
                        }
                        socket.emit('update-user-success', { message: 'User record updated successfully.' });
                    });
            }
            if (request.updatedUser.role == 'partner') {
                User.update({ username: request.updatedUser.username, role: request.updatedUser.role }, { $set: { status: request.updatedUser.status, loginAttempts: 0 } }, function (err, dbUpdatedLogin) {
                    if (err) {
                        logger.debug(err);
                        return;
                    }
                    User.update({ username: request.updatedUser.username, role: request.updatedUser.role },
                        {
                            $set: {
                                status: request.updatedUser.status,
                                image: request.updatedUser.image,
                                partnerPermissions: request.updatedUser.partnerPermissions
                            }
                        }, function (err, dbUpdatedUser) {
                            // console.log(err);
                            if (err) {
                                logger.debug(err);
                            }
                            socket.emit('update-user-success', { message: 'User record updated successfully.' });
                        });
                });
            }
            if (request.updatedUser.role == 'user') {
                User.update({ username: request.updatedUser.username, role: request.updatedUser.role }, { $set: { status: request.updatedUser.status, loginAttempts: 0 } }, function (err, dbUpdatedLogin) {
                    if (err) {
                        logger.debug(err);
                        return;
                    }
                    User.update({ username: request.updatedUser.username, role: request.updatedUser.role },
                        {
                            $set: {
                                status: request.updatedUser.status,
                                image: request.updatedUser.image
                            }
                        }, function (err, dbUpdatedUser) {
                            if (err) {
                                logger.debug(err);
                            }
                            socket.emit('update-user-success', { message: 'User record updated successfully.' });
                        });
                });
            }
        }
        if (dbUser.role == 'partner') {

            if (request.updatedUser.role == 'manager') {
                User.update({ username: dbUser.username, role: request.updatedUser.role },
                    {
                        $set: {
                            image: request.updatedUser.image
                        }
                    }, function (err, dbUpdatedUser) {
                        if (err) {
                            logger.debug(err);
                        }
                        socket.emit('update-user-success', { message: 'User record updated successfully.' });
                    });
            }
            if (request.updatedUser.role == 'partner') {
                User.update({ username: request.updatedUser.username, role: request.updatedUser.role }, { $set: { status: request.updatedUser.status, loginAttempts: 0 } }, function (err, dbUpdatedLogin) {
                    if (err) {
                        logger.debug(err);
                        return;
                    }
                    User.update({ username: request.updatedUser.username, role: request.updatedUser.role },
                        {
                            $set: {
                                status: request.updatedUser.status,
                                image: request.updatedUser.image,
                                partnerPermissions: request.updatedUser.partnerPermissions
                            }
                        }, function (err, dbUpdatedUser) {
                            // console.log(err);
                            if (err) {
                                logger.debug(err);
                            }
                            socket.emit('update-user-success', { message: 'User record updated successfully.' });
                        });
                });
            }
            if (request.updatedUser.role == 'user') {
                User.update({ username: request.updatedUser.username, role: request.updatedUser.role }, { $set: { status: request.updatedUser.status, loginAttempts: 0 } }, function (err, dbUpdatedLogin) {
                    if (err) {
                        logger.debug(err);
                        return;
                    }
                    User.update({ username: request.updatedUser.username, role: request.updatedUser.role },
                        {
                            $set: {
                                status: request.updatedUser.status,
                                image: request.updatedUser.image
                            }
                        }, function (err, dbUpdatedUser) {
                            if (err) {
                                logger.debug(err);
                            }
                            socket.emit('update-user-success', { message: 'User record updated successfully.' });
                        });
                });
            }
            //check for additional permissions
        }
        if (dbUser.role == 'user') {
            User.update({ username: request.updatedUser.username, role: 'user', deleted: false, status: 'active' }, { $set: { image: request.updatedUser.image } }, function (err, dbUpdatedUser) {
                if (err) logger.error(err);
                socket.emit('update-user-success', { message: 'User record updated successfully.' });
                Bet.update({ username: request.updatedUser.username }, { $set: { image: request.updatedUser.image } }, { multi: true }, function (err, result) {
                    if (err) logger.error(err);
                });
                Session.update({ username: request.updatedUser.username }, { $set: { image: request.updatedUser.image } }, function (err, result) {
                    if (err) logger.error(err);
                });
            });
        }
    });
}

module.exports.updateUserBalance = function (io, socket, request) {
    if (!request) return;
    if (!request.user || !request.targetUser) return;
    if (!request.user.details) return;
    // logger.info("updateUserBalance: "+JSON.stringify(request));
    User.findOne({ username: request.user.details.username, hash: request.user.key }, { role: 1, username: 1 }, function (err, dbUser) {
        if (err) logger.error(err);
        if (!dbUser) return;
        if (dbUser.role != 'admin' && dbUser.role != 'manager' && dbUser.role != 'partner') return;
        if (dbUser.role == 'manager') {



            if (request.targetUser.mbalance != null) {
                User.findOne({ username: request.targetUser.username, role: 'user', deleted: false }, function (err, dbOldTragetUser) {
                    User.findOne({ username: dbUser.username, role: 'manager', deleted: false }, function (err, mnaagerBalaance) {
                        if (request.targetUser.action == 'DEPOSIT') {
                            var balance = dbOldTragetUser.balance + request.targetUser.amount;
                            var limit = dbOldTragetUser.limit + request.targetUser.amount;
                            var mbalance = mnaagerBalaance.limit - request.targetUser.amount;
                            if (balance == request.targetUser.balance && limit == request.targetUser.limit) {

                            }
                            else {

                                socket.emit("update-user-balance-error-success", { message: "Unexpected error occur please try again.!" });
                                return;

                            }


                        }
                        else if (request.targetUser.action == 'WITHDRAW') {
                            var balance = dbOldTragetUser.balance - request.targetUser.amount;
                            var limit = dbOldTragetUser.limit - request.targetUser.amount;
                            var mbalance = mnaagerBalaance.limit + request.targetUser.amount;
                            if (balance == request.targetUser.balance && limit == request.targetUser.limit) {

                            }
                            else {
                                socket.emit("update-user-balance-error-success", { message: "Unexpected error occur please try again.!" });
                                return;

                            }
                        }
                        else {
                            socket.emit("update-user-balance-error-success", { message: "Update your app please contact upline." });
                            return;
                        }
                        if (err) logger.error(err);
                        socket.emit("update-user-balance-error-success", { message: "Balance " + request.targetUser.action + " successfully.!" });
                        User.update({ username: request.targetUser.username, role: 'user', deleted: false }, { $set: { limit: limit, balance: balance } }, function (err, raw) {
                            if (err) logger.error(err);

                            socket.emit("update-user-balance-success", request.targetUser);
                            //log start


                            User.update({ username: request.user.details.username, role: 'manager', deleted: false }, { $set: { limit: mbalance } }, function (err, raw1) {
                                if (err) logger.error(err);
                                //update part
                                //update manager balance after deposit
                                User.find({ manager: request.user.details.username, role: 'partner', deleted: false }, function (err, mpartner) {
                                    for (var i = 0; i < mpartner.length; i++) {
                                        User.update({ username: mpartner[i].username, role: 'partner', deleted: false }, { $set: { limit: mbalance } }, function (err, raw) {

                                        });

                                    }

                                });

                                //end

                                User.findOne({ username: request.user.details.username, role: 'manager', deleted: false }, function (err, dbmanager) {
                                    socket.emit("update-manager-balance-success", dbmanager);
                                });


                            });
                            var log = new Log();
                            log.username = dbOldTragetUser.username;
                            log.action = 'BALANCE';
                            if (dbOldTragetUser.limit < request.targetUser.limit) {
                                log.subAction = 'BALANCE_DEPOSIT';
                            }
                            else {
                                log.subAction = 'BALANCE_WITHDRAWL';
                            }
                            log.mnewLimit = mbalance;
                            log.oldLimit = dbOldTragetUser.limit;
                            log.newLimit = request.targetUser.limit;
                            log.description = 'Balance updated. Old Limit: ' + dbOldTragetUser.limit + '. New Limit: ' + request.targetUser.limit;
                            log.manager = dbUser.username;
                            log.relation = dbUser.username;
                            log.time = new Date();
                            log.deleted = false;
                            //// console.log(log);
                            log.save(function (err) { if (err) { logger.error('update-user-balance-error: Log entry failed.'); } });
                            //log end
                        });
                    });
                });
            }

        }
        if (dbUser.role == 'partner') {
            if (request.targetUser.mbalance != null) {
                User.findOne({ username: request.targetUser.username, role: 'user', deleted: false }, function (err, dbOldTragetUser) {
                    User.findOne({ username: dbUser.username, role: 'partner', deleted: false }, function (err, mnaagerBalaance) {
                        if (request.targetUser.action == 'DEPOSIT') {
                            var balance = dbOldTragetUser.balance + request.targetUser.amount;
                            var limit = dbOldTragetUser.limit + request.targetUser.amount;
                            var mbalance = mnaagerBalaance.limit - request.targetUser.amount;
                            if (balance == request.targetUser.balance && limit == request.targetUser.limit) {

                            }
                            else {
                                socket.emit("update-user-balance-error-success", { message: "Unexpected error occur please try again.!" });
                                return;

                            }


                        }
                        else if (request.targetUser.action == 'WITHDRAW') {
                            var balance = dbOldTragetUser.balance - request.targetUser.amount;
                            var limit = dbOldTragetUser.limit - request.targetUser.amount;
                            var mbalance = mnaagerBalaance.limit + request.targetUser.amount;
                            if (balance == request.targetUser.balance && limit == request.targetUser.limit) {

                            }
                            else {
                                socket.emit("update-user-balance-error-success", { message: "Unexpected error occur please try again.!" });
                                return;

                            }
                        }
                        else {
                            socket.emit("update-user-balance-error-success", { message: "Update your app please contact upline." });
                            return;
                        }

                        //socket.emit("update-user-balance-error-success", {message:"Balance "+request.targetUser.action+" successfully.!"});
                        if (err) logger.error(err);
                        User.update({ username: request.targetUser.username, role: 'user', deleted: false }, { $set: { limit: limit, balance: balance } }, function (err, raw) {
                            if (err) logger.error(err);

                            //socket.emit("update-user-balance-success", request.targetUser);
                            //log start


                            User.update({ username: request.user.details.manager, role: 'manager', deleted: false }, { $set: { limit: mbalance } }, function (err, raw1) {
                                //// console.log(request.user.details.manager);
                                //// console.log(request.targetUser.mbalance);

                                if (err) logger.error(err);
                                //update part
                                //update manager balance after deposit
                                User.find({ manager: request.user.details.manager, role: 'partner', deleted: false }, function (err, mpartner) {
                                    for (var i = 0; i < mpartner.length; i++) {
                                        User.update({ username: mpartner[i].username, role: 'partner', deleted: false }, { $set: { limit: mbalance } }, function (err, raw) {
                                            // console.log(raw);
                                        });

                                    }

                                });

                                //end

                                User.findOne({ username: request.user.details.username, role: 'partner', deleted: false }, function (err, dbmanager) {
                                    //socket.emit("update-manager-balance-success",dbmanager);
                                });


                            });
                            var log = new Log();
                            log.username = dbOldTragetUser.username;
                            log.action = 'BALANCE';
                            if (dbOldTragetUser.limit < request.targetUser.limit) {
                                log.subAction = 'BALANCE_DEPOSIT';
                            }
                            else {
                                log.subAction = 'BALANCE_WITHDRAWL';
                            }
                            log.mnewLimit = request.targetUser.mbalance;
                            log.oldLimit = dbOldTragetUser.limit;
                            log.newLimit = request.targetUser.limit;
                            log.description = 'Balance updated. Old Limit: ' + dbOldTragetUser.limit + '. New Limit: ' + request.targetUser.limit;
                            log.manager = dbUser.username;
                            log.relation = request.user.details.manager;
                            log.time = new Date();
                            log.deleted = false;
                            // // console.log(log);
                            log.save(function (err) { if (err) { logger.error('update-user-balance-error: Log entry failed.'); } });
                            //log end
                        });
                    });
                });
            }
        }

        /*if(dbUser.role=='manager')
        {
     
          if(request.targetUser.mbalance!=null)
          {
         User.findOne({username:request.targetUser.username, role:'user', deleted:false}, function(err, dbOldTragetUser){
           if(err) logger.error(err);
           User.update({username:request.targetUser.username, role:'user', deleted:false}, {$set:{limit:request.targetUser.limit, balance:request.targetUser.balance}}, function(err, raw){
             if(err) logger.error(err);
            
             socket.emit("update-user-balance-success", request.targetUser);
             //log start
     
          
           User.update({username:request.user.details.username, role:'manager', deleted:false}, {$set:{limit:request.targetUser.mbalance}}, function(err, raw1){
              if(err) logger.error(err);
             //update part
             //update manager balance after deposit
           User.find({manager:request.user.details.username, role:'partner', deleted:false}, function(err, mpartner){
               for(var i=0;i<mpartner.length;i++)
               {
             User.update({username:mpartner[i].username, role:'partner', deleted:false}, {$set:{limit:request.targetUser.mbalance}}, function(err, raw){  	
               
                });
            
               }
             
               });
             
          //end
           
            User.findOne({username:request.user.details.username, role:'manager', deleted:false}, function(err, dbmanager){
              socket.emit("update-manager-balance-success",dbmanager);
              });
           
         
              });
             var log = new Log();
             log.username = dbOldTragetUser.username;
             log.action = 'BALANCE';
             if(dbOldTragetUser.limit < request.targetUser.limit){
               log.subAction = 'BALANCE_DEPOSIT';
             }
             else{
               log.subAction = 'BALANCE_WITHDRAWL';
             }
             log.mnewLimit=request.targetUser.mbalance;
             log.description = 'Balance updated. Old Limit: '+dbOldTragetUser.limit+'. New Limit: '+request.targetUser.limit;
             log.manager = dbUser.username;
             log.relation=dbUser.username;
             log.time = new Date();
             log.deleted = false;
             //// console.log(log);
             log.save(function(err){if(err){logger.error('update-user-balance-error: Log entry failed.');}});
             //log end
           });
         });
       }
        }
        if(dbUser.role=='partner')
        {
         if(request.targetUser.mbalance!=null)
          {
         User.findOne({username:request.targetUser.username, role:'user', deleted:false}, function(err, dbOldTragetUser){
           if(err) logger.error(err);
           User.update({username:request.targetUser.username, role:'user', deleted:false}, {$set:{limit:request.targetUser.limit, balance:request.targetUser.balance}}, function(err, raw){
             if(err) logger.error(err);
            
             socket.emit("update-user-balance-success", request.targetUser);
             //log start
     
          
           User.update({username:request.user.details.manager, role:'manager', deleted:false}, {$set:{limit:request.targetUser.mbalance}}, function(err, raw1){
              //// console.log(request.user.details.manager);
              //// console.log(request.targetUser.mbalance);
              
              if(err) logger.error(err);
             //update part
             //update manager balance after deposit
           User.find({manager:request.user.details.manager, role:'partner', deleted:false}, function(err, mpartner){
               for(var i=0;i<mpartner.length;i++)
               {
             User.update({username:mpartner[i].username, role:'partner', deleted:false}, {$set:{limit:request.targetUser.mbalance}}, function(err, raw){   
               // console.log(raw);
                });
             
               }
             
               });
             
          //end
           
            User.findOne({username:request.user.details.username, role:'partner', deleted:false}, function(err, dbmanager){
              socket.emit("update-manager-balance-success",dbmanager);
              });
           
         
              });
             var log = new Log();
             log.username = dbOldTragetUser.username;
             log.action = 'BALANCE';
             if(dbOldTragetUser.limit < request.targetUser.limit){
               log.subAction = 'BALANCE_DEPOSIT';
             }
             else{
               log.subAction = 'BALANCE_WITHDRAWL';
             }
             log.mnewLimit=request.targetUser.mbalance;
             log.description = 'Balance updated. Old Limit: '+dbOldTragetUser.limit+'. New Limit: '+request.targetUser.limit;
             log.manager = dbUser.username;
             log.relation=request.user.details.manager;
             log.time = new Date();
             log.deleted = false;
            // // console.log(log);
             log.save(function(err){if(err){logger.error('update-user-balance-error: Log entry failed.');}});
             //log end
           });
         });
       }
        }*/



        if (dbUser.role == 'admin') {

            //// console.log(request);
            User.findOne({ username: request.targetUser.username, role: 'manager', deleted: false }, function (err, dbOldTragetUser) {
                if (err) logger.error(err);
                User.update({ username: request.targetUser.username, role: 'manager', deleted: false }, { $set: { limit: request.targetUser.limit } }, function (err, raw) {
                    if (err) logger.error(err);
                    //// console.log(request.targetUser.limit);
                    //update balance for partner
                    User.find({ manager: request.targetUser.username, role: 'partner', deleted: false }, function (err, mpartner) {
                        for (var i = 0; i < mpartner.length; i++) {
                            User.update({ username: mpartner[i].username, role: 'partner', deleted: false }, { $set: { limit: request.targetUser.limit } }, function (err, raw) {
                                // console.log(raw);
                            });
                        }

                    });
                    //end
                    socket.emit("update-user-balance-success", request.targetUser);
                    //log start
                    var log = new Log();
                    log.username = dbOldTragetUser.username;
                    log.action = 'BALANCE';
                    if (dbOldTragetUser.limit < request.targetUser.limit) {
                        log.subAction = 'BALANCE_DEPOSIT';
                    }
                    else {
                        log.subAction = 'BALANCE_WITHDRAWL';
                    }
                    log.oldLimit = dbOldTragetUser.limit;
                    log.newLimit = request.targetUser.limit;
                    log.description = 'Balance updated. Old Limit: ' + dbOldTragetUser.limit + '. New Limit: ' + request.targetUser.limit;
                    log.manager = 'admin';
                    log.relation = dbOldTragetUser.username;
                    log.time = new Date();
                    log.deleted = false;
                    // // console.log(log);
                    log.save(function (err) { if (err) { logger.error('update-user-balance-error: Log entry failed.'); } });
                    //log end


                    //log for admin n manager deposit
                });
            });

        }

    });
}

module.exports.deleteUser = function (io, socket, request) {
    if (!request) return;
    if (!request.user || !request.targetUser) return;
    // logger.info("deleteUser: "+JSON.stringify(request));

    if (request.user.details.role == 'manager') {
        if (request.targetUser.role != 'user' && request.targetUser.role != 'partner') return;
        User.findOne({ hash: request.user.key, username: request.user.details.username, role: 'manager', deleted: false, status: 'active' }, function (err, dbAdmin) {
            if (err) logger.error(err);
            if (!dbAdmin) {
                logger.error("Invalid Access: " + JSON.stringify(request));
                return;
            }
            User.update({ username: request.targetUser.username, role: request.targetUser.role }, { $set: { status: 'inactive', deleted: true } }, function (err, raw) {
                if (err) logger.error(err);
                User.update({ username: request.targetUser.username, role: request.targetUser.role }, { $set: { status: 'inactive', deleted: true } }, function (err, raw) {
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
                    log.save(function (err) { if (err) { logger.error('delete-user-error: Log entry failed.'); } });
                    //log end
                    socket.emit("delete-user-success", request.targetUser);
                    User.findOne({ username: request.user.details.username, deleted: false }, function (err, m) {
                        if (err) logger.error(err);
                        if (m) {
                            if (request.targetUser.role == 'user') {
                                Bet.update({ username: request.targetUser.username }, { $set: { deleted: true } }, { multi: true }, function (err, raw) {
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
    }

    if (request.user.details.role == 'partner') {
        if (request.targetUser.role != 'user') return;
        User.findOne({ hash: request.user.key, username: request.user.details.username, role: 'partner', deleted: false, status: 'active' }, function (err, dbAdmin) {
            if (err) logger.error(err);
            if (!dbAdmin) {
                logger.error("Invalid Access for partner: " + JSON.stringify(request));
                return;
            }
            User.update({ username: request.targetUser.username, role: request.targetUser.role }, { $set: { status: 'inactive', deleted: true } }, function (err, raw) {
                if (err) logger.error(err);
                User.update({ username: request.targetUser.username, role: request.targetUser.role }, { $set: { status: 'inactive', deleted: true } }, function (err, raw) {
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
                    log.save(function (err) { if (err) { logger.error('delete-user-error: Log entry failed.'); } });
                    //log end
                    socket.emit("delete-user-success", request.targetUser);
                    User.findOne({ username: request.user.details.username, deleted: false }, function (err, m) {
                        if (err) logger.error(err);
                        if (m) {
                            if (request.targetUser.role == 'user') {
                                Bet.update({ username: request.targetUser.username }, { $set: { deleted: true } }, { multi: true }, function (err, raw) {
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
    }
    if (request.user.details.role == 'admin') {
        if (request.targetUser.role != 'manager' && request.targetUser.role != 'operator') return;
        User.findOne({ hash: request.user.key, username: request.user.details.username, role: 'admin', deleted: false, status: 'active' }, function (err, dbAdmin) {
            if (err) logger.error(err);
            if (!dbAdmin) {
                logger.error("Invalid Access: " + JSON.stringify(request));
                return;
            }
            // Delete all users under the managers
            if (request.targetUser.role == 'operator') {

                User.update({ username: request.targetUser.username }, { $set: { status: 'inactive', deleted: true } }, { multi: true }, function (err, raw) {

                });

                User.update({ username: request.targetUser.username }, { $set: { status: 'inactive', deleted: true } }, { multi: true }, function (err, raw) {

                });

            }

            User.update({ manager: request.targetUser.username }, { $set: { status: 'inactive', deleted: true } }, { multi: true }, function (err, raw) {
                if (err) logger.error(err);
                User.update({ manager: request.targetUser.username }, { $set: { status: 'inactive', deleted: true } }, { multi: true }, function (err, raw) {
                    if (err) logger.error(err);
                    Bet.update({ manager: request.targetUser.username }, { $set: { deleted: true } }, { multi: true }, function (err, raw) {
                        if (err) logger.error(err);
                        User.update({ username: request.targetUser.username, role: 'manager' }, { $set: { status: 'inactive', deleted: true } }, function (err, raw) {
                            if (err) logger.error(err);
                            User.update({ username: request.targetUser.username, role: 'manager' }, { $set: { status: 'inactive', deleted: true } }, function (err, raw) {
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

    User.findOne({ username: request.user.details.username, role: request.user.details.role, hash: request.user.key, deleted: false }, function (err, dbUser) {
        if (err) logger.debug(err);
        if (!dbUser) {
            logger.error("Invalid Access: " + JSON.stringify(request));
            socket.emit('logout');
            return;
        }
        if (dbUser.role == 'manager') {
            User.update({ username: dbUser.username, deleted: false, role: 'manager' }, { $set: { matchFees: request.matchFees } }, function (err, raw) {
                if (err) logger.error(err);
                User.update({ manager: dbUser.username, deleted: false, role: 'user' }, { $set: { matchFees: request.matchFees } }, { multi: true }, function (err, raw) {
                    if (err) logger.error(err);
                    socket.emit("update-match-fees-success", { "message": "Match fees updated successfully", success: true });
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

    User.findOne({ username: request.user.details.username, role: request.user.details.role, hash: request.user.key, deleted: false }, function (err, dbUser) {
        if (err) logger.debug(err);
        if (!dbUser) {
            logger.error("Invalid Access: " + JSON.stringify(request));
            socket.emit('logout');
            return;
        }
        if (dbUser.role == 'manager') {
            User.update({ username: request.targetUser.username, deleted: false, role: 'user' }, { $set: { commision: request.matchFees, commisionloss: request.commisionloss } }, function (err, raw) {
                if (err) logger.error(err);
                socket.emit("update-match-fees-success", { "message": "Match fees updated successfully", success: true });
            });
        }
    });
}





// Forgot Password
module.exports.forgotPassword = (req, res) => {
    try {
        let { phone } = req.body;
        if (!phone) return res.send({ success: false, message: "missing field/'s" });

        else {

            User.findOne({ phone: phone, type: req.body.type, typeId: req.body.typeId })
                .then(doc => {

                    let otp = Math.floor(1000 + Math.random() * 9000);
                    var options = {
                        'method': 'GET',
                        'url': `https://2factor.in/API/V1/${api_key}/SMS/${req.body.phone}/${otp}`,
                        'headers': {
                            'content-type': 'application/x-www-form-urlencoded'
                        }
                    };
                    request(options, async function (error, response) {
                        if (error) {
                            res.send({ error: err, success: false, message: "Please enter correct phone number." });
                        }
                        else {
                            // console.log(response.body);

                            User.updateOne({ _id: doc._id }, { otp: otp })
                                .then(user => {
                                    res.send({ data: user, success: true, message: "Otp Has been sent!" });
                                })
                                .catch(error => {
                                    res.send({ error, data: {}, success: false, message: "Failed to send otp" });
                                })

                        }
                    });

                })
                .catch(error => {
                    res.send({ error, success: false, message: "DB error" });
                })
        }
    }
    catch (error) {
        res.send({ error, success: false, message: "unknown error" });
    }
}

// Update Password
module.exports.updatePassword = (req, res) => {
    try {
        let { phone, password } = req.body;
        if (!phone, !password) return res.send({ success: false, message: "missing field/'s" });

        else {
            User.findOne({ phone: req.body.phone, type: req.body.type, typeId: req.body.typeId })
                .then(doc => {
                    if (doc.otp == req.body.otp) {
                        User.updateOne({ phone: phone, type: req.body.type, typeId: req.body.typeId }, { password: util.hashPassword(password) })
                            .then(user => {
                                res.send({ data: user, success: true, message: "Password has been updated successfully" });
                            })
                            .catch(error => {
                                res.send({ error, data: {}, success: false, message: "Failed to update password" });
                            })

                    }
                    else {
                        res.send({ data: {}, success: false, message: "Please enter correct otp" });
                    }
                });
        }
    }
    catch (error) {
        res.send({ error, success: false, message: "unknown error" });
    }
}

//Create My Sites
module.exports.createMysites = async (req, res) => {
    try {
        let decoded = jwt.verify(req.params.token, myEnv.parsed.SECRET);
        let { userId } = jwt.decode(req.params.token);
        let user = await User.findOne({ _id: userId });
        if (!user._id) return res.send({ success: false, message: "Token Invalid. Please login in again." });
        if (user.token != req.params.token) return res.send({ success: false, message: "Token Invalid. Please login in again." });
        // if (req.body.paymentType == 'wallet' && parseInt(user.wallet) < parseInt(req.body.amount)) return res.send({ success: false, message: "You don't have sufficients funds." });
        let max = 500;
        if (user.typeId === '62b013cd6d70f31108551e35' || user.typeId === '631195e7d84105a6457fd88e') {
            max = 100;
        }
        if (req.body.amount < max) return res.send({ success: false, message: `Amount can't be less than ${max}.` });

        let query;
        let manager;
        if (user.type == "Manager") {
            query = "Admin"
            manager = await Manager.findOne({ _id: user.typeId });
        } else {
            query = "Subadmin"
            manager = await SubAdmin.findOne({ _id: user.typeId });
        }




        // Push Notification Start
        if (manager.playerId) {
            let deviceIds = [manager.playerId];
            let partner = await SubAdmin.find({ managerId: user.typeId });
            for (let i = 0; i < partner.length; i++) {
                if (partner[i].playerId) {
                    deviceIds.push(partner[i].playerId);
                }
            }

            var datapush = {
                app_id: "047ed5ed-a6ce-4c14-990d-6e956b6402de",
                contents: { "en": `${user.name} has created a request to create Id` },
                headings: { "en": "Create Id Request" },
                big_picture: "https://blog.taskpigeon.co/wp-content/uploads/2017/06/Advanced-Email-Notifications-Task-Pigeon.jpg",
                url: "",
                include_player_ids: deviceIds,
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
                    // console.log("Response:");
                    // // console.log(JSON.parse(datapush));

                });
            });

            requestpush.on('error', function (e) {
                // console.log("ERROR:");

                // console.log(e);
            });

            requestpush.write(JSON.stringify(datapush));
            requestpush.end();
        }
        // Push Notification End


        let imageName = [];
        let time = new Date().getTime();
        var base64Data;
        let image;
        if (req.body.imagetype) {
            // console.log(req.body.imagetype);
            let mimetype = req.body.imagetype.split("/").pop();
            // console.log(mimetype);
            if (mimetype == 'jpeg') {
                base64Data = req.body.image.replace(/^data:image\/jpeg;base64,/, "");
                image = `${time}.jpeg`;
            } else if (mimetype == 'jpg') {
                base64Data = req.body.image.replace(/^data:image\/jpg;base64,/, "");
                image = `${time}.jpg`;
            } else {
                base64Data = req.body.image.replace(/^data:image\/png;base64,/, "");
                image = `${time}.png`;
            }
        } else {
            base64Data = req.body.image.replace(/^data:image\/png;base64,/, "");
            image = `${time}.png`;
        }

        require("fs").writeFile(`uploads/screenshot/${image}`, base64Data, 'base64', function (err) {
            // // console.log(err);
        });
        imageName.push(image);

        var characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
        var result = ""
        var charactersLength = characters.length;

        for (var i = 0; i < 10; i++) {
            result += characters.charAt(Math.floor(Math.random() * charactersLength));
        }

        let balance, exposure;
        if (req.body.paymentType == 'wallet') {
            balance = parseInt(user.wallet) - parseInt(req.body.amount);
            exposure = parseInt(user.exposure) + parseInt(req.body.amount);
        } else {
            balance = parseInt(user.wallet);
            exposure = parseInt(user.exposure);
        }

        if (req.body.paymentType == 'wallet') {

            var request = require('request');
            var options = {
                'method': 'GET',
                'url': `https://wapi.paisaexch.com/api/balance/${user.username}`,
                'headers': {
                }
            };
            request(options, function (error, response) {
                if (error) {
                    res.send({ error, success: false, message: "Error in Creating site" });
                } else {
                    let body = JSON.parse(response.body);

                    if (body.error == true) {
                        res.send({ error, success: false, message: body.message });
                    }
                    else if (body.response.balance < req.body.amount) {
                        res.send({ error, success: false, message: "User don't have sufficient ammount" });
                    } else {

                        var request = require('request');
                        var options = {
                            'method': 'POST',
                            'url': 'https://wapi.paisaexch.com/api/updatewithdraw',
                            'headers': {
                                'cache-control': 'no-cache',
                                'content-type': 'application/x-www-form-urlencoded',
                                'postman-token': '15dc1ded-e6b9-d2e2-f73e-1d4ce00f568a'
                            },
                            form: {
                                'username': user.username,
                                'amount': req.body.amount
                            }
                        };
                        request(options, function (error, response) {
                            let body = JSON.parse(response.body);
                            if (error) {
                                res.send({ error, success: false, message: "Error in creating site" });
                            } else if (body.error == true) {
                                res.send({ error, success: false, message: body.message });
                            } else {

                                const mysite = new Mysite({
                                    userId: userId,
                                    type: user.type,
                                    typeId: user.typeId,
                                    username: req.body.username,
                                    status: "Pending",
                                    sites: req.body.sites,
                                    balance: req.body.amount,
                                    name: user.username,
                                    image: imageName,
                                });
                                mysite.save()
                                    .then(doc => {

                                        const payment = new Payment({
                                            type: 'Deposit',
                                            userId: userId,
                                            amount: req.body.amount,
                                            name: user.name,
                                            username: user.username,
                                            paymentType: req.body.paymentType,
                                            depositId: req.body.depositId,
                                            status: 'Pending',
                                            image: imageName,
                                            managerType: user.type,
                                            managerId: user.typeId,
                                            balance: balance,
                                            to: "Id",
                                            sites: req.body.sites,
                                            mysites: doc._id,
                                            refrenceNo: result,
                                            idReq: 1
                                        });
                                        payment.save()
                                            .then(doc1 => {
                                                User.updateOne({
                                                    '_id': userId
                                                }, { wallet: balance, exposure: exposure }, async function (error, updateUser) {
                                                    res.send({ doc, success: true, message: "My sites created" });
                                                });
                                            })
                                            .catch(error => {
                                                res.send({ error, success: false, message: "DB error in deposit register" });
                                            })

                                    })
                                    .catch(error => {
                                        res.send({ error, success: false, message: "DB error in creating sites" });
                                    })

                            }
                        });
                    }
                }
            });


        } else {

            const mysite = new Mysite({
                userId: userId,
                type: user.type,
                typeId: user.typeId,
                username: req.body.username,
                status: "Pending",
                sites: req.body.sites,
                balance: req.body.amount,
                name: user.username,
                image: imageName,
            });
            mysite.save()
                .then(doc => {

                    const payment = new Payment({
                        type: 'Deposit',
                        userId: userId,
                        amount: req.body.amount,
                        name: user.name,
                        username: user.username,
                        paymentType: req.body.paymentType,
                        depositId: req.body.depositId,
                        status: 'Pending',
                        image: imageName,
                        managerType: user.type,
                        managerId: user.typeId,
                        balance: balance,
                        to: "Id",
                        sites: req.body.sites,
                        mysites: doc._id,
                        refrenceNo: result,
                        idReq: 1
                    });
                    payment.save()
                        .then(doc1 => {
                            User.updateOne({
                                '_id': userId
                            }, { wallet: balance, exposure: exposure }, async function (error, updateUser) {
                                res.send({ doc, success: true, message: "My sites created" });
                            });
                        })
                        .catch(error => {
                            res.send({ error, success: false, message: "DB error in deposit register" });
                        })
                })
                .catch(error => {
                    res.send({ error, success: false, message: "DB error in creating sites" });
                })

        }


    }
    catch (error) {
        // console.log(error)
        res.send({ error, success: false, message: "Unknown error" });
    }
}

// Get My Sites
module.exports.getMysites = async (req, res) => {
    try {
        let decoded = jwt.verify(req.params.token, myEnv.parsed.SECRET);
        let { userId } = jwt.decode(req.params.token);
        let user = await User.findOne({ _id: userId });
        if (!user._id) return res.send({ success: false, message: "Token Invalid. Please login in again." });
        if (user.token != req.params.token) return res.send({ success: false, message: "Token Invalid. Please login in again." });

        Mysite.
            find({ userId: userId, status: 'Approved' }).
            populate('sites').
            sort({ createdAt: -1 }).
            exec(function (err, data) {
                if (err) return handleError(err);
                res.send({ data: data, success: true, message: "My Sites get successfully" });
                // prints "The author is Ian Fleming"
            });


    }
    catch (error) {
        res.send({ error, success: false, message: "Unknown error" });
    }
}


// Make Withdrawn Preffered
module.exports.prefferdWithdrawn = async (req, res) => {
    try {
        let decoded = jwt.verify(req.params.token, myEnv.parsed.SECRET);
        let { userId } = jwt.decode(req.params.token);
        let user = await User.findOne({ _id: userId });
        if (!user._id) return res.send({ success: false, message: "Token Invalid. Please login in again." });
        if (user.token != req.params.token) return res.send({ success: false, message: "Token Invalid. Please login in again." });

        let withdrawn = await Withdrawal.findOne({ _id: req.body.id });

        await Withdrawal.updateMany({ userId: userId, type: withdrawn.type }, { status: false }, { new: true })
            .then(async function (dbProduct) {
                await Withdrawal.findOneAndUpdate({ _id: req.body.id }, { status: true }, { new: true })
                    .then(function (dbProduct) {
                        res.send({ data: dbProduct, success: true, message: "Withdrawn Method preffered successfully" });
                    })
                    .catch(function (err) {
                        res.send({ error: err, success: false, message: "Error in making withdrawn preffered" });
                    });

            })
            .catch(function (err) {
                res.send({ error: err, success: false, message: "Error in making withdrawn preffered" });
            });

    }
    catch (error) {
        res.send({ error, success: false, message: "Unknown error" });
    }
}

// Get Preffered Withdrawl
module.exports.getPrefferedWithdrawl = async (req, res) => {
    try {

        let decoded = jwt.verify(req.params.token, myEnv.parsed.SECRET);
        let { userId } = jwt.decode(req.params.token);
        let user = await User.findOne({ _id: userId });
        if (!user._id) return res.send({ success: false, message: "Token Invalid. Please login in again." });
        if (user.token != req.params.token) return res.send({ success: false, message: "Token Invalid. Please login in again." });

        const users = await WithdrawnMethod.find({}).select("-withdrawns");

        const requiredMediaByName = (name) => {
            return users.find(data => data.type === name && data.manager.includes(ObjectId(user.typeId)));
        };

        const withdrawals = await Withdrawal.find({ userId: userId });
        var doc = [];
        var team;

        team = withdrawals;
        for (let i = 0; i < withdrawals.length; i++) {
            var obj = team[i];
            var obj2 = { activestatus: requiredMediaByName(team[i].type) === undefined ? true : false };
            Object.assign(obj, obj2);
            doc.push(obj);
        }
        res.send({ doc, success: true, message: "Withdrawal Method get successfully" });
        // Withdrawal.find({ userId: userId })
        //     .then(doc => {
        //         res.send({ doc, success: true, message: "Withdrawl Preffered get successfully" });
        //     })
        //     .catch(error => {
        //         res.send({ error, success: false, message: "DB error in getting withdrawal preffered" });
        //     })
    }
    catch (error) {
        // console.log(error);
        res.send({ error, success: false, message: "Unknown error" });
    }
}

// Get Sites By Id
module.exports.getsitesById = async (req, res) => {
    try {

        let decoded = jwt.verify(req.params.token, myEnv.parsed.SECRET);
        let { userId } = jwt.decode(req.params.token);
        let user = await User.findOne({ _id: userId });
        if (!user._id) return res.send({ success: false, message: "Token Invalid. Please login in again." });
        if (user.token != req.params.token) return res.send({ success: false, message: "Token Invalid. Please login in again." });

        Site.findOne({ _id: req.body.id })
            .then(doc => {
                res.send({ doc, success: true, message: "Site get successfully" });
            })
            .catch(error => {
                res.send({ error, success: false, message: "DB error in getting Site" });
            })
    }
    catch (error) {
        res.send({ error, success: false, message: "Unknown error" });
    }
}

// Get Notification
module.exports.getNotification = async (req, res) => {
    try {
        // // console.log(req.token)
        // let decoded = jwt.verify(req.params.token, myEnv.parsed.SECRET);
        let { userId } = jwt.decode(req.token);
        let user = await User.findOne({ _id: userId });
        if (!user._id) return res.send({ success: false, message: "Token Invalid. Please login in again." });
        if (user.token != req.token) return res.send({ success: false, message: "Token Invalid. Please login in again." });

        User.updateOne({
            '_id': userId
        }, { notificationCount: 0 }, async function (error, updateUser) {

            Notification.
                find({ userId: userId }).
                populate('payment').
                populate('sites').
                sort({ createdAt: -1 }).
                exec(function (err, data) {
                    if (err) return res.send({ error: err, success: false, message: "DB error in getting notification" });

                    res.send({ data: data, success: true, message: "Notification get successfully" });
                });
        });

    }
    catch (error) {
        res.send({ error, success: false, message: "Unknown error" });
    }
}

// Get Mysites Transaction
module.exports.getmysiteTransaction = async (req, res) => {
    try {

        let decoded = jwt.verify(req.params.token, myEnv.parsed.SECRET);
        let { userId } = jwt.decode(req.params.token);
        let user = await User.findOne({ _id: userId });
        if (!user._id) return res.send({ success: false, message: "Token Invalid. Please login in again." });
        if (user.token != req.params.token) return res.send({ success: false, message: "Token Invalid. Please login in again." });

        // console.log(req.body.mysiteId);
        Payment.find({ mysites: req.body.mysiteId, userId: userId })
            .then(doc => {
                res.send({ doc, success: true, message: "Mysite transaction get successfully" });
            })
            .catch(error => {
                res.send({ error, success: false, message: "DB error in getting Mysite transaction" });
            })
    }
    catch (error) {
        res.send({ error, success: false, message: "Unknown error" });
    }
}

//Deposit in  My Sites
module.exports.depositInsite = async (req, res) => {
    try {
        let decoded = jwt.verify(req.params.token, myEnv.parsed.SECRET);
        let { userId } = jwt.decode(req.params.token);
        let user = await User.findOne({ _id: userId });
        if (!user._id || user.status === 'inactive') return res.send({ success: false, message: "Token Invalid. Please login in again." });
        if (user.token != req.params.token) return res.send({ success: false, message: "Token Invalid. Please login in again." });
        // if (req.body.paymentType == 'wallet') return res.send({ success: false, message: "You don't have sufficients funds." });
        let max = 500;
        if (user.typeId === '62b013cd6d70f31108551e35' || user.typeId === '631195e7d84105a6457fd88e') {
            max = 100;
        }
        if (req.body.amount < max) return res.send({ success: false, message: `Amount can't be less than ${max}.` });

        let query;
        let manager;
        if (user.type == "Manager") {
            query = "Admin"
            manager = await Manager.findOne({ _id: user.typeId });
        } else {
            query = "Subadmin"
            manager = await SubAdmin.findOne({ _id: user.typeId });
        }

        let imageName = [];
        let time = new Date().getTime();
        var base64Data;
        let image;
        if (req.body.imagetype) {
            // console.log(req.body.imagetype);
            let mimetype = req.body.imagetype.split("/").pop();
            // console.log(mimetype);
            if (mimetype == 'jpeg') {
                base64Data = req.body.image.replace(/^data:image\/jpeg;base64,/, "");
                image = `${time}.jpeg`;
            } else if (mimetype == 'jpg') {
                base64Data = req.body.image.replace(/^data:image\/jpg;base64,/, "");
                image = `${time}.jpg`;
            } else {
                base64Data = req.body.image.replace(/^data:image\/png;base64,/, "");
                image = `${time}.png`;
            }
        } else {
            base64Data = req.body.image.replace(/^data:image\/png;base64,/, "");
            image = `${time}.png`;
        }

        require("fs").writeFile(`uploads/screenshot/${image}`, base64Data, 'base64', function (err) {
            // // console.log(err);
        });
        imageName.push(image);

        var characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
        var result = ""
        var charactersLength = characters.length;

        for (var i = 0; i < 10; i++) {
            result += characters.charAt(Math.floor(Math.random() * charactersLength));
        }

        let balance, exposure;
        if (req.body.paymentType == 'wallet') {
            balance = parseInt(user.wallet) - parseInt(req.body.amount);
            exposure = parseInt(user.exposure) + parseInt(req.body.amount);
        } else {
            balance = parseInt(user.wallet);
            exposure = parseInt(user.exposure);
        }

        let mysite = await Mysite.findOne({ _id: req.body.mysiteId });


        var request = require('request');
        var options = {
            'method': 'GET',
            'url': `https://wapi.paisaexch.com/api/balance/${user.username}`,
            'headers': {
            }
        };
        request(options, async function (error, response) {
            if (error) {
                res.send({ error, success: false, message: "Error in deposite to site" });
            } else {
                let body = JSON.parse(response.body);

                if (body.error == true) {
                    res.send({ error, success: false, message: body.message });
                }
                else if (req.body.paymentType == 'wallet' && body.response.balance < req.body.amount) {
                    res.send({ error, success: false, message: "User don't have sufficient ammount" });
                } else {

                    if (req.body.paymentType == 'wallet') {
                        var request = require('request');
                        var options = {
                            'method': 'POST',
                            'url': 'https://wapi.paisaexch.com/api/updatewithdraw',
                            'headers': {
                                'cache-control': 'no-cache',
                                'content-type': 'application/x-www-form-urlencoded',
                                'postman-token': '15dc1ded-e6b9-d2e2-f73e-1d4ce00f568a'
                            },
                            form: {
                                'username': user.username,
                                'amount': req.body.amount
                            }
                        };
                        request(options, async function (error, response) {
                            let body = JSON.parse(response.body);
                            if (error) {
                                res.send({ error, success: false, message: "Error in deposite to site" });
                            } else if (body.error == true) {
                                res.send({ error, success: false, message: body.message });
                            } else {

                                // Push Notification Start
                                if (manager.playerId) {
                                    let deviceIds = [manager.playerId];
                                    let partner = await SubAdmin.find({ managerId: user.typeId });
                                    for (let i = 0; i < partner.length; i++) {
                                        if (partner[i].playerId) {
                                            deviceIds.push(partner[i].playerId);
                                        }
                                    }
                                    var datapush = {
                                        app_id: "047ed5ed-a6ce-4c14-990d-6e956b6402de",
                                        contents: { "en": `${user.name} has created a request to deposit amount of ${req.body.amount}` },
                                        headings: { "en": "Deposit Payment In Id Request" },
                                        big_picture: "https://blog.taskpigeon.co/wp-content/uploads/2017/06/Advanced-Email-Notifications-Task-Pigeon.jpg",
                                        url: "",
                                        include_player_ids: deviceIds,
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
                                            // console.log("Response:");
                                            // // console.log(JSON.parse(datapush));

                                        });
                                    });

                                    requestpush.on('error', function (e) {
                                        // console.log("ERROR:");

                                        // console.log(e);
                                    });

                                    requestpush.write(JSON.stringify(datapush));
                                    requestpush.end();
                                }
                                // Push Notification End

                                const payment = new Payment({
                                    type: 'Deposit',
                                    userId: userId,
                                    amount: req.body.amount,
                                    name: user.name,
                                    username: user.username,
                                    paymentType: req.body.paymentType,
                                    status: 'Pending',
                                    image: imageName,
                                    managerType: user.type,
                                    managerId: user.typeId,
                                    balance: balance,
                                    to: "Id",
                                    sites: mysite.sites,
                                    mysites: req.body.mysiteId,
                                    refrenceNo: result
                                });
                                payment.save()
                                    .then(doc1 => {
                                        User.updateOne({
                                            '_id': userId
                                        }, { wallet: balance, exposure: exposure }, async function (error, updateUser) {
                                            res.send({ doc1, success: true, message: "Deposit to Id Submitted" });
                                        });
                                    })
                                    .catch(error => {
                                        // console.log(error);
                                        res.send({ error, success: false, message: "DB error in id deposit" });
                                    })

                            }
                        });
                    } else {
                        // Push Notification Start
                        if (manager.playerId) {
                            let deviceIds = [manager.playerId];
                            let partner = await SubAdmin.find({ managerId: user.typeId });
                            for (let i = 0; i < partner.length; i++) {
                                if (partner[i].playerId) {
                                    deviceIds.push(partner[i].playerId);
                                }
                            }
                            var datapush = {
                                app_id: "047ed5ed-a6ce-4c14-990d-6e956b6402de",
                                contents: { "en": `${user.name} has created a request to deposit amount of ${req.body.amount}` },
                                headings: { "en": "Deposit Payment In Id Request" },
                                big_picture: "https://blog.taskpigeon.co/wp-content/uploads/2017/06/Advanced-Email-Notifications-Task-Pigeon.jpg",
                                url: "",
                                include_player_ids: deviceIds,
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
                                    // console.log("Response:");
                                    // // console.log(JSON.parse(datapush));

                                });
                            });

                            requestpush.on('error', function (e) {
                                // console.log("ERROR:");

                                // console.log(e);
                            });

                            requestpush.write(JSON.stringify(datapush));
                            requestpush.end();
                        }
                        // Push Notification End

                        const payment = new Payment({
                            type: 'Deposit',
                            userId: userId,
                            amount: req.body.amount,
                            name: user.name,
                            username: user.username,
                            paymentType: req.body.paymentType,
                            status: 'Pending',
                            image: imageName,
                            managerType: user.type,
                            managerId: user.typeId,
                            balance: balance,
                            to: "Id",
                            sites: mysite.sites,
                            mysites: req.body.mysiteId,
                            refrenceNo: result
                        });
                        payment.save()
                            .then(doc1 => {
                                User.updateOne({
                                    '_id': userId
                                }, { wallet: balance, exposure: exposure }, async function (error, updateUser) {
                                    res.send({ doc1, success: true, message: "Deposit to Id Submitted" });
                                });
                            })
                            .catch(error => {
                                // console.log(error);
                                res.send({ error, success: false, message: "DB error in id deposit" });
                            })
                    }

                }
            }
        });
    }
    catch (error) {
        // console.log(error);
        res.send({ error, success: false, message: "Unknown error" });
    }
}

//Withdrawal form My Sites
module.exports.withdrawalInsites = async (req, res) => {
    try {
        let decoded = jwt.verify(req.params.token, myEnv.parsed.SECRET);
        let { userId } = jwt.decode(req.params.token);
        let user = await User.findOne({ _id: userId });
        if (!user._id || user.status === 'inactive') return res.send({ success: false, message: "Token Invalid. Please login in again." });
        let max = 500;
        if (user.typeId === '62b013cd6d70f31108551e35' || user.typeId === '631195e7d84105a6457fd88e') {
            max = 100;
        }
        if (req.body.amount < max) return res.send({ success: false, message: `Amount can't be less than ${max}.` });
        // if (user.wallet < req.body.amount) return res.send({ success: false, message: "You don't have sufficients funds." });

        let query;
        let manager;
        if (user.type == "Manager") {
            query = "Admin"
            manager = await Manager.findOne({ _id: user.typeId });
        } else {
            query = "Subadmin"
            manager = await SubAdmin.findOne({ _id: user.typeId });
        }

        var characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
        var result = ""
        var charactersLength = characters.length;

        for (var i = 0; i < 10; i++) {
            result += characters.charAt(Math.floor(Math.random() * charactersLength));
        }

        let balance = parseInt(user.wallet);
        let exposure = parseInt(user.exposure);

        let mysite = await Mysite.findOne({ _id: req.body.mysiteId });

        let paymentdata;

        if (req.body.type === 'Wallet') {
            paymentdata = {
                type: 'Withdrawal',
                userId: user._id,
                amount: req.body.amount,
                name: user.name,
                username: user.username,
                paymentType: req.body.type,
                status: 'Pending',
                managerType: user.type,
                managerId: user.typeId,
                balance: balance,
                to: "Id",
                sites: mysite.sites,
                mysites: req.body.mysiteId,
                refrenceNo: result
            }
        } else {
            paymentdata = {
                type: 'Withdrawal',
                userId: user._id,
                amount: req.body.amount,
                name: user.name,
                username: user.username,
                paymentType: req.body.type,
                paymentId: req.body.paymentId,
                status: 'Pending',
                managerType: user.type,
                managerId: user.typeId,
                balance: balance,
                to: "Id",
                sites: mysite.sites,
                mysites: req.body.mysiteId,
                refrenceNo: result

            }
        }

        const payment = new Payment(paymentdata);
        payment.save()
            .then(async doc => {


                // Push Notification Start
                if (manager.playerId) {
                    let deviceIds = [manager.playerId];
                    let partner = await SubAdmin.find({ managerId: user.typeId });
                    for (let i = 0; i < partner.length; i++) {
                        if (partner[i].playerId) {
                            deviceIds.push(partner[i].playerId);
                        }
                    }
                    var datapush = {
                        app_id: "047ed5ed-a6ce-4c14-990d-6e956b6402de",
                        contents: { "en": `${user.name} has created a request to withdrawal amount of ${req.body.amount}` },
                        headings: { "en": "Withdrawal Payment From Id Request" },
                        big_picture: "https://blog.taskpigeon.co/wp-content/uploads/2017/06/Advanced-Email-Notifications-Task-Pigeon.jpg",
                        url: "",
                        include_player_ids: deviceIds,
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
                            // console.log("Response:");
                            // // console.log(JSON.parse(datapush));

                        });
                    });

                    requestpush.on('error', function (e) {
                        // console.log("ERROR:");

                        // console.log(e);
                    });

                    requestpush.write(JSON.stringify(datapush));
                    requestpush.end();
                }
                // Push Notification End

                User.updateOne({
                    '_id': userId
                }, { wallet: balance, exposure: exposure }, async function (error, updateUser) {
                    res.send({ doc, success: true, message: "Withdrawal registered" });
                });
            })
            .catch(error => {
                // console.log(error);
                res.send({ error, success: false, message: "DB error in withdrawal register" });
            })
    }
    catch (error) {
        // console.log(error);
        res.send({ error, success: false, message: "Unknown error" });
    }
}

// Get Pending Transaction
module.exports.getpendingPayment = async (req, res) => {
    try {
        let decoded = jwt.verify(req.params.token, myEnv.parsed.SECRET);
        let { userId } = jwt.decode(req.params.token);
        let user = await User.findOne({ _id: userId });
        if (!user._id) return res.send({ success: false, message: "Token Invalid. Please login in again." });
        if (user.token != req.params.token) return res.send({ success: false, message: "Token Invalid. Please login in again." });

        Payment.
            find({ userId: userId, status: 'Pending' }).
            populate('sites').
            sort({ createdAt: -1 }).
            exec(function (err, data) {
                if (err) return handleError(err);
                res.send({ data: data, success: true, message: "Transaction get successfully" });
                // prints "The author is Ian Fleming"
            });


    }
    catch (error) {
        res.send({ error, success: false, message: "Unknown error" });
    }
}

// Get My Sites By Id
module.exports.getMysitesByID = async (req, res) => {
    try {
        let decoded = jwt.verify(req.params.token, myEnv.parsed.SECRET);
        let { userId } = jwt.decode(req.params.token);
        let user = await User.findOne({ _id: userId });
        if (!user._id) return res.send({ success: false, message: "Token Invalid. Please login in again." });
        if (user.token != req.params.token) return res.send({ success: false, message: "Token Invalid. Please login in again." });

        Mysite.
            findOne({ userId: userId, status: 'Approved', _id: req.body.id }).
            populate('sites').
            sort({ createdAt: -1 }).
            exec(function (err, data) {
                if (err) return handleError(err);
                res.send({ data: data, success: true, message: "My Sites get successfully" });
                // prints "The author is Ian Fleming"
            });


    }
    catch (error) {
        res.send({ error, success: false, message: "Unknown error" });
    }
}

//Add Withdrawal Method
module.exports.updatewithdrawalMethod = async (req, res) => {
    try {
        let decoded = jwt.verify(req.params.token, myEnv.parsed.SECRET);
        let { userId } = jwt.decode(req.params.token);
        let user = await User.findOne({ _id: userId });
        if (!user._id) return res.send({ success: false, message: "Token Invalid. Please login in again." });
        if (user.token != req.params.token) return res.send({ success: false, message: "Token Invalid. Please login in again." });


        let data;
        if (req.body.type == 'bank') {
            data = {
                type: req.body.type,
                userId: userId,
                bankName: req.body.bankName,
                name: req.body.name,
                accnumber: req.body.accnumber,
                ifsc: req.body.ifsc,
                withdrawnMethod: req.body.withdrawlId
            }
        } else {
            data = {
                type: req.body.type,
                userId: userId,
                name: req.body.name,
                upi: req.body.upi,
                withdrawnMethod: req.body.withdrawlId
            }
        }

        let pending = await Payment.findOne({ userId: userId, type: 'Withdrawal', status: 'Pending' });

        if (pending.length == 0) {
            await Withdrawal.findOneAndUpdate({ _id: req.body.Id }, { data }, { new: true })
                .then(function (dbProduct) {
                    // If we were able to successfully update a Product, send it back to the client
                    res.send({ data: dbProduct, success: true, message: "Withdrawal updated" });
                })
                .catch(function (err) {
                    // If an error occurred, send it to the client
                    res.send({ data: {}, success: False, message: "Error in Withdrawal update" });
                });
        } else {
            res.send({ error: {}, success: false, message: "You have pending Withdrawal request" });
        }


    }
    catch (error) {
        res.send({ error, success: false, message: "Unknown error" });
    }
}

//Cancel Withdrawal Request
module.exports.cancelWithdrawl = async (req, res) => {
    try {

        let decoded = jwt.verify(req.params.token, myEnv.parsed.SECRET);
        let { userId } = jwt.decode(req.params.token);
        let user = await User.findOne({ _id: userId });
        if (!user._id) return res.send({ success: false, message: "Token Invalid. Please login in again." });
        if (user.token != req.params.token) return res.send({ success: false, message: "Token Invalid. Please login in again." });

        let paymentData = await Payment.findOne({ _id: req.body.id });

        if (paymentData.status !== 'Pending' || paymentData.isProcessing === true) {
            res.send({ data: {}, success: False, message: `You can't cancel your request after your request has been ${paymentData.status}` });
        }
        else {

            await Payment.findOneAndUpdate({ _id: req.body.id }, { status: 'Decline', remarks: 'User decline the request.' }, { new: true })
                .then(function (dbProduct) {

                    let exposure;

                    if (dbProduct.to == 'Wallet') {
                        let balance = parseInt(user.wallet) + parseInt(dbProduct.amount)
                        exposure = parseInt(user.exposure) - parseInt(dbProduct.amount);
                        var request = require('request');
                        var options = {
                            'method': 'POST',
                            'url': 'https://wapi.paisaexch.com/api/updatedeposit',
                            'headers': {
                                'cache-control': 'no-cache',
                                'content-type': 'application/x-www-form-urlencoded',
                                'postman-token': '15dc1ded-e6b9-d2e2-f73e-1d4ce00f568a'
                            },
                            form: {
                                'username': user.username,
                                'amount': dbProduct.amount,
                                'status': 'Decline'
                            }
                        };
                        request(options, function (error, response) {
                            let body = JSON.parse(response.body);
                            if (error) {
                                res.send({ data: {}, success: False, message: "Error in cancelling Withdrawal request" });
                            } else if (body.error == true) {
                                res.send({ data: {}, success: False, message: "Error in cancelling Withdrawal request" });
                            } else {
                                User.updateOne({
                                    '_id': userId
                                }, { wallet: balance, exposure: exposure }, async function (error, updateUser) {
                                    res.send({ data: dbProduct, success: true, message: "Withdrawal request cancelled" });
                                });
                            }
                        });
                    } else {
                        exposure = parseInt(user.exposure);
                        User.updateOne({
                            '_id': userId
                        }, { exposure: exposure }, async function (error, updateUser) {
                            res.send({ data: dbProduct, success: true, message: "Withdrawal request cancelled" });
                        });
                    }


                })
                .catch(function (err) {
                    // If an error occurred, send it to the client
                    res.send({ data: {}, success: False, message: "Error in cancelling Withdrawal request" });
                });

        }


    }
    catch (error) {
        res.send({ error, success: false, message: "Unknown error" });
    }
}


// User Login
module.exports.getUserByToken = async (req, res) => {
    try {

        User.findOne({ username: req.params.token })
            .then(doc => {
                if (!doc) return res.send({ data: {}, success: false, message: "No such user found" });

                if (doc.status == 'inactive') return res.send({ data: {}, success: false, message: "Please login with otp to verify number" });


                const token = util.Helper.generateToken(doc._id);

                User.updateOne({
                    '_id': doc._id
                }, { token: token }, function (err, updateMessage) {

                });

                const data = { doc, token }
                res.send({ data, success: true, message: "user login success" });

            })
            .catch(error => {
                res.send({ error, success: false, message: "DB error" });
            })

    }
    catch (error) {
        res.send({ error, success: false, message: "unknown error" });
    }
}



//User Register
module.exports.getManager = async (req, res) => {
    try {
        let decoded = jwt.verify(req.params.token, myEnv.parsed.SECRET);
        let { userId } = jwt.decode(req.params.token);
        let user = await User.findOne({ _id: userId });
        if (!user._id) return res.send({ success: false, message: "Token Invalid. Please login in again." });
        if (user.token != req.params.token) return res.send({ success: false, message: "Token Invalid. Please login in again." });

        let manager = await SubAdmin.findOne({ _id: req.body.typeId }, { username: 1 });
        res.send({ data: manager, success: true, message: "Manager Get Success" });
    }
    catch (error) {
        res.send({ error, success: false, message: "Unknown error" });
    }
}