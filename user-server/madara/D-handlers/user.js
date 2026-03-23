// required modules
var mongoose = require('mongoose');
var logger = require('log4js').getLogger();

// required models
// var User = mongoose.model('Login');
var Finance = mongoose.model('Finance');
var User = mongoose.model('User');
var Session = mongoose.model('Session');
var Log = mongoose.model('Log');
var Setting = mongoose.model('Setting');
var Bet = mongoose.model('Bet');
var Tv = require('../models/tv');
var CricketVideo = mongoose.model('CricketVideo');
var Market = mongoose.model('Market');
var Chat = mongoose.model('Chat');
var jwt = require('jsonwebtoken');
var request1 = require('request');
const Helper = require('./helper');
const myEnv = require('dotenv').config();
var userInfo = {};


module.exports.login = function (io, socket, request) {
  // Validate request data
  if (!request) return;
  if (!request.user) return;
  // if(!request.user.username) return;
  if (!request.user.password) return;

  // console.log(request.user.username.toUpperCase());

  var mobile = "+91" + request.user.username.toString();
  // console.log(mobile);

  var output = {};
  User.findOne({ $or: [{ username: request.user.username.toUpperCase() }, { mobile: mobile }], role: "user" }, function (err, user) {
    if (err) console.log(err); logger.debug(err);
    // Check username
    // console.log(user.role)

    if (!user) {
      logger.error('login-error: User not found ' + request.user.username);
      socket.emit('login-error', { "message": "User not found", error: true });
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

      // console.log(user.username, request.user.password);

      checkbyapi = 0;

      var apirequest = require('request');
      var options = {
        'method': 'POST',
        'url': 'https://acepunt.kushubmedia.com/user/userlogin',
        'headers': {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          "username": user.username,
          "password": request.user.password
        })

      };
      apirequest(options, function (error, response) {
        if (error) throw new Error(error);
        var getuser = JSON.parse(response.body);
        // console.log("asdasfsdfdsfsdgadsg",getuser);
        if (getuser.success == true) {

          user.loginAttempts = 0;
          user.save(function (err, updatedUser) { });

          // Check deleted or blocked account
          if (user.status != 'active') {
            logger.error('login-error: Account is blocked or deleted' + request.user.username);
            socket.emit('login-error', { "message": "Account is not accessible anymore. Contact the admin to activate the account.", error: true });
            return;
          }
          logger.info('login: ' + user.username + ' logged in.');
          // Send user details to client
          User.findOne({ username: user.username, manager: user.manager }, function (err, userDetails) {
            if (err || !userDetails) {
              logger.error('login: DBError in finding user details.');
              return;
            }

            var oldtoken = user.token;

            const token = generateToken(user._id);
            // console.log(token);
            User.updateOne({ _id: user._id }, { token: token })
              .then(users => {
                output._id = user._id;
                output.key = user.hash;
                output.verifytoken = token;
                output.details = userDetails;
                console.log("login succes");

                socket.emit("login-success", { output: output });
                io.emit("login-check", { output: oldtoken });
              })

            // Todo: send updated active users to manager and admin
            // Delete existing session and create new one


            Session.findOne({ username: user.username, manager: user.manager }, function (err, session) {
              if (err) logger.debug(err);
              //console.log(session.socket+' '+user.username)
              //console.log(session)
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
        } else {
          logger.error('login-error: Invalid password ' + request.user.username);
          socket.emit('login-error', { "message": "Invalid password", error: true });
          return;
        }
      });

    } else {
      // Reset login attempts counter
      user.loginAttempts = 0;
      user.save(function (err, updatedUser) { });

      // Check deleted or blocked account
      if (user.status != 'active') {
        logger.error('login-error: Account is blocked or deleted' + request.user.username);
        socket.emit('login-error', { "message": "Account is not accessible anymore. Contact the admin to activate the account.", error: true });
        return;
      }
      logger.info('login: ' + user.username + ' logged in.');
      // Send user details to client
      User.findOne({ username: user.username, manager: user.manager }, function (err, userDetails) {
        if (err || !userDetails) {
          logger.error('login: DBError in finding user details.');
          return;
        }

        var oldtoken = user.token;
        const token = generateToken(user._id);
        // console.log(token);
        User.updateOne({ _id: user._id }, { token: token })
          .then(users => {
            output._id = user._id;
            output.key = user.hash;
            output.verifytoken = token;
            output.details = userDetails;
            output.setting = user.sportsetting;
            console.log("login succes");
            io.emit("login-check", { output: oldtoken });
            socket.emit("login-success", { output: output });
          })
        // Todo: send updated active users to manager and admin
        // Delete existing session and create new one


        Session.findOne({ username: user.username, manager: user.manager }, function (err, session) {
          if (err) logger.debug(err);
          //console.log(session.socket+' '+user.username)
          //console.log(session)
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
    console.log(req);

    if (!req.phone) return;
    else {
      let otp = Math.floor(1000 + Math.random() * 9000);
      // var options = {
      //     'method': 'GET',
      //     'url': `https://2factor.in/API/V1/${api_key}/SMS/${req.phone}/${otp}`,
      //     'headers': {
      //         'content-type': 'application/x-www-form-urlencoded'
      //     }
      // };
      // request(options, async function (error, response) {
      //     if (error) {
      //         res.send({ error: err, success: false, message: "Please enter correct phone number." });
      // logger.error('login-error: Invalid password ' + DbUser.username);
      //       socket.emit('login-otp-success', { "message": "Please enter correct phone number.", error: true });
      //       return;
      //     }
      //     else {
      var output = {};
      var DbUser = await User.findOne({ mobile: req.phone, role: "user" }, {});
      if (DbUser) {
        var oldtoken = DbUser.token;

        const token = generateToken(DbUser._id);

        await User.updateOne({ _id: DbUser._id }, { otp: otp, token: token })
          .then(users => {
            output._id = DbUser._id;
            // output.key = DbUser.hash;
            output.verifytoken = token;
            output.details = DbUser;
            console.log("login succes");
            io.emit("login-check", { output: oldtoken });
            socket.emit("login-otp-success", { output: output, otp: otp, success: true });
            return;
          })
          .catch(error => {
            // res.send({ error, data: null, success: false, message: "Failed to send otp" });
            console.log(error)
            logger.error('login-error: Invalid password ' + DbUser.username);
            socket.emit('login-otp-success', { "message": "Db Error", success: false });
            return;
          })
      } else {
        socket.emit("login-otp-success", { output: null, otp: otp, success: true });
        return;
      }
      //     }
      // });

    }
  }
  catch (error) {
    logger.error('login-error: Invalid password ' + DbUser.username);
    socket.emit('login-otp-success', { "message": "Server Error", success: false });
    return;
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

module.exports.createUser = function (io, socket, request) {
  // - validate request data  
  console.log(request);

  if (!request) return;
  if (!request.details || !request.details._id || !request.details.username || !request.details.role) return;
  if (!request.newUser.username || !request.newUser.password) return;
  // console.log(request);

  User.findOne({
    username: request.details.username,
    role: {
      $in: ['admin', 'manager', 'master', 'subadmin']
    },
    status: 'active',
    deleted: false,
  }, async function (err, dbAdmin) {
    // console.log(dbAdmin);
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

      // console.log(dbAdmin.role);
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
      // console.log(admprtnrsp,admcmsn,admprtnrsp['1'],admcmsn['1'])
      var manager = "";
      var master = "";
      var subadmin = "";
      var admin = dbAdmin.username;

      // var AdminP = await User.findOne({username: dbAdmin.admin },{partnershipsetting:1,commissionsetting:1})
      // console.log(MasterP, SubadminP)
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

      //set user details
      var user = new User();
      user.username = request.newUser.username.toUpperCase();
      user.fullname = request.newUser.fullname;
      user.setDefaults();
      user.setPassword("777501");
      user.settransPassword("8699");
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
      user.ParentUser = dbAdmin.username;
      user.ParentRole = dbAdmin.role;
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
              console.log(err)
              logger.error('create-user-error: Log entry failed.');
            }
          });
          // console.log('create-user-success: User account created successfully.');
          // socket.emit("create-user-success", user);
          var output = {};
          var DbUser = await User.findOne({ mobile: request.newUser.mobile, role: "user" }, {});
          if (DbUser) {
            var oldtoken = DbUser.token;

            const token = generateToken(DbUser._id);

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

module.exports.userlogin = function (io, socket, request) {
  // Validate request data
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
    //  user.save(function (err, updatedUser) { });

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
      // type:user.type,
      // mobile:user.mobile,
      // balance:user.balance,
      // mainbalance:user.mainbalance,
      // exposure:user.exposure,
      // limit:user.limit,

    };

    var oldtoken = user.token;
    const token = Helper.generateToken(user._id);
    user.token = token;
    user.save(function (err, updatedUser) { });
    output._id = user._id;
    output.key = user.hash;
    output.apitoken = token;
    output.verifytoken = token;
    output.details = userDetails;
    console.log(user.token);

    io.emit("login-check", {
      output: oldtoken
    });
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
    console.log(users.length, users[0].username);
    let n = 0;
    while (n < users.length) {

      await User.update({ username: users[n].username },
        {
          $set: {
            mobile: users[n].phone,
          }
        }, function (err, dbUpdatedUser) {
          console.log(n, users[n].username, users[n].phone);

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
  //console.log(request);
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
      //console.log(data);

      socket.emit('get-finance-success', data);
    });
  }

  if (request.user.details.role == 'manager') {

    Finance.find(request.filter, function (err, data) {
      if (err) logger.error(err);
      // console.log(data);

      socket.emit('get-finance-success', data);
    });
  }

  if (request.user.details.role == 'partner') {

    Finance.find(request.filter, function (err, data) {
      if (err) logger.error(err);
      //console.log(data);

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
      // console.log(dbUser);

      socket.emit('get-manager-success', dbUser);
    });
  }
}

module.exports.updateManager = function (io, socket, request) {

  if (!request) return;
  if (!request.user) return;
  //console.log(request);
  logger.info("updateManager: request=" + JSON.stringify(request));

  if (request.user.details.role == 'admin') {


    User.update({ username: request.updatedUser.username },
      {
        $set: {
          version: request.updatedUser.version,
          applink: request.updatedUser.applink
        }
      }, function (err, dbUpdatedUser) {
        //console.log(dbUpdatedUser);
        // console.log('hhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhh');

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
      //console.log(dbUser);
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
      socket.emit('get-user-details-error', { message: 'Invalid user.', error: true });
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
              socket.emit('get-user-details-error', { message: 'Invalid user.', error: true });
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
      // console.log(tv);
      socket.emit('get-tv-success', tv);
    });
};

module.exports.getMatchVideo = async function (io, socket, request) {
  try {

    // console.log('shghjasghfhgashgfasgsaf');
    let n = Math.floor(Math.random() * Math.floor(6));
    // console.log(n);
    CricketVideo.find({
      'TeamID': request.teamid,
      'OpponentID': request.opponentid,
    }, {}, { limit: 1, skip: n }, async function (err, dbMarket) {
      socket.emit('get-match-video-success', { data: dbMarket });
    });
  }
  catch (e) {
    socket.emit('get-match-video-error', { message: 'Invalid user.', error: true });
  }
}

module.exports.getVirtualCricket = async function (io, socket, request) {
  try {
    // console.log('shghjasghfhgashgfasgsaf');
    Market.findOne({
      'eventTypeId': "v9",
      'marketType': 'virtualcricket',
      'marketBook.status': { $ne: 'CLOSED' }
    }, { marketName: 1, marketId: 1, Team1id: 1, Team2id: 1, Team1name: 1, Team2name: 1, Team1run: 1, Team2run: 1, Team1wicket: 1, Team2wicket: 1 }, { limit: 1 }, async function (err, dbMarket) {
      socket.emit('get-virtual-video-success', { data: dbMarket });
    });
  }
  catch (e) {
    console.log(e);
    socket.emit('get-virtual-video-error', { message: 'Invalid user.', error: true });
  }
}

module.exports.updatePasswordchanged = function (io, socket, request) {
  // Validate request data
  if (!request) return;
  if (!request.user) return;
  if (!request.password) return;
  // console.log(request);
  User.findOne({ username: request.user.details.username }, function (err, dbUser) {
    if (err) logger.debug(err);
    // Check username
    if (!dbUser) {
      logger.error('login-error: User not found ' + request.user.username);
      socket.emit('password-changed-success', { "message": "User not found", error: true });
      return;
    }
    if (dbUser.validPassword(request.password)) {
      var user = new User();
      user.setPassword(request.npassword);
      dbUser.hash = user.hash;
      dbUser.salt = user.salt;
      dbUser.transctionpasswordstatus = 1;
      dbUser.save(function (err, updatedLogin) {
        socket.emit('password-changed-success', { "message": "Current password successfully login again", error: false });

      });
    }
    else {
      socket.emit('password-changed-success', { "message": "Current password incorrect try again", error: true });

    }

  });
};

function generateToken(id) {
  const token = jwt.sign(
    {
      userId: id,
    },
    myEnv.parsed.SECRET,
    { expiresIn: "7d" }
  );
  return token;
}



const api_key = 'e6c032ca-eca9-11ec-9c12-0200cd936042';

// User Login With Otp
module.exports.loginOtp = function (io, socket, request) {
  // Validate request data
  if (!request) return;
  if (!request.user) return;
  if (!request.user.phone) return;
  // if(!request.user.password) return;

  var mobile = "+91" + request.user.phone.toString();
  console.log(mobile);

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
            socket.emit('login-error', { "message": "Please enter correct phone number.", error: true });
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
      socket.emit('login-error', { "message": "User not found", error: true });
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
  console.log(mobile);
  var output = {};
  User.findOne({ mobile: mobile, manager: request.user.manager })
    .then(user => {
      if (user.otp == request.user.otp) {
        User.updateOne({ username: user.username, manager: user.manager }, { status: "active" })
          .then(doc => {

            // Check deleted or blocked account
            if (user.status != 'active') {
              logger.error('login-error: Account is blocked or deleted' + mobile);
              socket.emit('login-error', { "message": "Account is not accessible anymore. Contact the admin to activate the account.", error: true });
              return;
            }
            logger.info('login: ' + user.username + ' logged in.');
            // Send user details to client
            User.findOne({ username: user.username, manager: user.manager }, function (err, userDetails) {
              if (err || !userDetails) {
                logger.error('login: DBError in finding user details.');
                return;
              }

              const token = generateToken(user._id);
              console.log(token);
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
                //console.log(session.socket+' '+user.username)
                //console.log(session)
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
        socket.emit('login-error', { "message": "Otp Not Matched!", error: true });
        return;
      }
    })
    .catch(error => {
      logger.error('login-error: User not found ' + request.user.phone);
      socket.emit('login-error', { "message": "User not found", error: true });
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
      socket.emit('login-error', { "message": "User not found", error: true });
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

      const token = generateToken(user._id);
      console.log(token);
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
        //console.log(session.socket+' '+user.username)
        //  console.log(session)
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
  Session.remove({ socket: socket.id }, function (err, data) {
    if (err) logger.error(err);
    socket.emit('logout');
  });
};

module.exports.updatePassword = function (io, socket, request) {

  // console.log(request);
  if (!request) return;
  if (!request.user || !request.password) return;
  if (request.password == '') return;

  // logger.info("updatePassword: "+JSON.stringify(request));
  User.findOne({ username: request.user.details.username, role: request.user.details.role, hash: request.user.key, deleted: false, status: 'active' }, function (err, dbUser) {
    if (err) logger.debug(err);
    if (!dbUser) {
      // console.log("Invalid Access");
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

        // console.log("password changed");
        socket.emit("update-password-success", { "message": "Password changed successfully.", error: false });
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
            socket.emit("update-password-error", { "message": "User not found. Please try again.", error: true });
            return;
          }
          var user = new User();
          user.setPassword(request.password);
          result.hash = user.hash;
          result.salt = user.salt;
          result.save(function (err, updatedLogin) {
            if (err) logger.error(err);
            socket.emit("update-password-success", { "message": "Password changed successfully.", error: false });
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
              socket.emit("update-password-error", { "message": "Password change failed.", error: true });
              return;
            }
            var user = new User();
            user.setPassword(request.password);
            result.hash = user.hash;
            result.salt = user.salt;
            result.save(function (err, updatedLogin) {
              if (err) logger.error(err);
              socket.emit("update-password-success", { "message": "Password changed successfully.", error: false });
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
              socket.emit("update-password-error", { "message": "Password change failed.", error: true });
              return;
            }
            var user = new User();
            user.setPassword(request.password);
            result.hash = user.hash;
            result.salt = user.salt;
            result.save(function (err, updatedLogin) {
              if (err) logger.error(err);
              socket.emit("update-password-success", { "message": "Password changed successfully.", error: false });
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
//   //console.log(request.newUser.role);
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
//             socket.emit("create-user-error", { "message": "User already exists", error: true, user: userCheck });
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
//               socket.emit("create-user-error", { "message": "Error in creating record", error: true });
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
//                   socket.emit("create-user-error", { "message": "Error in saving user details.", error: true });
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
//             socket.emit("create-user-error", { "message": "User already exists", error: true, user: userCheck });
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
//                 socket.emit("create-user-error", { "message": "Error in creating record", error: true });
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
//                     socket.emit("create-user-error", { "message": "Error in saving user details.", error: true });
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
//             socket.emit("create-user-error", { "message": "User already exists", error: true, user: userCheck });
//             return;
//           }
//           dbAdmin.partnerCount += 1;
//           if (dbAdmin.userCount > dbAdmin.partnetLimit) {
//             logger.error('create-user-error: Out of user quota.');
//             socket.emit("create-user-error", { "message": "You reached maximum number of partners under you. Please increase your partner quota.", error: true });
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
//               socket.emit("create-user-error", { "message": "Error in creating record", error: true });
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
//                   socket.emit("create-user-error", { "message": "Error in saving user details.", error: true });
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
//               socket.emit("create-user-error", { "message": "User already exists", error: true, user: userCheck });
//               return;
//             }
//             dbManager.userCount += 1;
//             if (dbManager.userCount > dbManager.userLimit) {
//               logger.error('create-user-error: Out of user quota.');
//               socket.emit("create-user-error", { "message": "You reached maximum number of users under you. Please increase your user quota.", error: true });
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
//               //console.log(log);
//               logSave.save(function (err) { if (err) { logger.error('update-user-balance-error: Log entry failed.'); } });
//             }




//             userUser.save(function (err) {
//               if (err) {
//                 logger.error('create-user-error: DBError in Users');
//                 socket.emit("create-user-error", { "message": "Error in creating record", error: true });
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
//                     socket.emit("create-user-error", { "message": "Error in saving user details.", error: true });
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
//             socket.emit("create-user-error", { "message": "User already exists", error: true, user: userCheck });
//             return;
//           }
//           dbAdmin.userCount += 1;
//           if (dbAdmin.userCount > dbAdmin.userLimit) {
//             logger.error('create-user-error: Out of user quota.');
//             socket.emit("create-user-error", { "message": "You reached maximum number of users under you. Please increase your user quota.", error: true });
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
//             //console.log(log);
//             logSave.save(function (err) { if (err) { logger.error('update-user-balance-error: Log entry failed.'); } });
//           }

//           userUser.save(function (err) {
//             if (err) {
//               logger.error('create-user-error: DBError in Users');
//               socket.emit("create-user-error", { "message": "Error in creating record", error: true });
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
//                   socket.emit("create-user-error", { "message": "Error in saving user details.", error: true });
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

  // console.log(request.user);
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
  // console.log("getUser: request="+JSON.stringify(request));
  if (!request) return;
  if (!request.user) return;
  // logger.info("getUser: request="+JSON.stringify(request));
  // console.log("getUser: request="+JSON.stringify(request));

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
  // console.log(request);
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
  //console.log(request);
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
              console.log(err);
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
              console.log(err);
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
              //console.log(log);
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
                //console.log(request.user.details.manager);
                //console.log(request.targetUser.mbalance);

                if (err) logger.error(err);
                //update part
                //update manager balance after deposit
                User.find({ manager: request.user.details.manager, role: 'partner', deleted: false }, function (err, mpartner) {
                  for (var i = 0; i < mpartner.length; i++) {
                    User.update({ username: mpartner[i].username, role: 'partner', deleted: false }, { $set: { limit: mbalance } }, function (err, raw) {
                      console.log(raw);
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
              // console.log(log);
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
         //console.log(log);
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
          //console.log(request.user.details.manager);
          //console.log(request.targetUser.mbalance);
          
          if(err) logger.error(err);
         //update part
         //update manager balance after deposit
       User.find({manager:request.user.details.manager, role:'partner', deleted:false}, function(err, mpartner){
           for(var i=0;i<mpartner.length;i++)
           {
         User.update({username:mpartner[i].username, role:'partner', deleted:false}, {$set:{limit:request.targetUser.mbalance}}, function(err, raw){   
           console.log(raw);
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
        // console.log(log);
         log.save(function(err){if(err){logger.error('update-user-balance-error: Log entry failed.');}});
         //log end
       });
     });
   }
    }*/



    if (dbUser.role == 'admin') {

      //console.log(request);
      User.findOne({ username: request.targetUser.username, role: 'manager', deleted: false }, function (err, dbOldTragetUser) {
        if (err) logger.error(err);
        User.update({ username: request.targetUser.username, role: 'manager', deleted: false }, { $set: { limit: request.targetUser.limit } }, function (err, raw) {
          if (err) logger.error(err);
          //console.log(request.targetUser.limit);
          //update balance for partner
          User.find({ manager: request.targetUser.username, role: 'partner', deleted: false }, function (err, mpartner) {
            for (var i = 0; i < mpartner.length; i++) {
              User.update({ username: mpartner[i].username, role: 'partner', deleted: false }, { $set: { limit: request.targetUser.limit } }, function (err, raw) {
                console.log(raw);
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
          // console.log(log);
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
          socket.emit("update-match-fees-success", { "message": "Match fees updated successfully", error: false });
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
        socket.emit("update-match-fees-success", { "message": "Match fees updated successfully", error: false });
      });
    }
  });
}
