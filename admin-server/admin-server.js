var express = require('express');
var device = require('express-device');
var http = require('http');
var cors = require('cors');
var path = require('path');
var multer = require('multer');
const jwt = require('jsonwebtoken');
const myEnv = require('dotenv').config();
var db = require('./madara/models/db');
var request = require('request');
var mongoose = require('mongoose');
var bodyParser = require('body-parser');
var port = 6003;

var logger = require('log4js').configure({ // Logger
  disableClustering: true,
  appenders: {
    app: {
      type: 'console'
    }
  },
  categories: {
    default: {
      appenders: ['app'],
      level: 'error'
    }
  }
}).getLogger();

const Helper = require("./madara/controller/helper");

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, './uploads/');
  },

  filename: function (req, file, cb) {
    cb(null, file.fieldname + '-' + Date.now() + path.extname(file.originalname));
  }
});
var upload = multer({ storage: storage, limits: { fileSize: 25 * 2048 * 2048, fieldSize: 25 * 2048 * 2048 } })
// var app                 =   express();
var app = express()
  , server = require('http').createServer(app)
  , io = require('socket.io')(server, {
    transports: ['polling'],
    cors: {
      origin: "*",
      methods: ["GET", "POST"]
    }
  });

app.use(device.capture());
app.use(cors());
app.use(express.static(path.join(__dirname, 'orochimaru')));
app.set('port', port);
// app.get('*', function (req, res) { res.send('<h1>Hello world Manager</h1>'); });

var socketHandler = require('./madara/controller/socketController');
var index = 0;

// required models
var User = mongoose.model('User');
var Bet = mongoose.model('Bet');
var Market = mongoose.model('Market');
var Casinotrans = mongoose.model('Casinotrans');

// const subadminHandler = require('./madara/controller/subadminController');
const subadminRoutes = require('./madara/router/subadminRoute');
const userRoutes = require('./madara/router/userRoute');
const adminRoutes = require('./madara/router/adminRoute');
const managerRoutes = require('./madara/router/managerRoute');




////////------ Casino App Apis ---------/////////////
// router.post('/api/loginOtp', upload.none(), subadminHandler.loginOtp);

// var Lock = mongoose.model('Lock');
// var Login = mongoose.model('Login');
// var EventType = mongoose.model('EventType');
// var Competition = mongoose.model('Competition');
// var Event = mongoose.model('Event');

// required controllers
var userHndl = require('./madara/controller/user');
var superadminHndl = require('./madara/controller/superadmin');
var rollbackHndl = require('./madara/controller/statement');
var marketHndl = require('./madara/controller/market');
var messageHndl = require('./madara/controller/message');
var logHndl = require('./madara/controller/log');
var betHndl = require('./madara/controller/bet');
var broadcastHndl = require('./madara/controller/broadcast');
var gameallHndl = require('./madara/controller/game-all');



// var sessionHndl = require('./madara/controller/session');
// var eventHndl = require('./madara/controller/event');
// var betHndl = require('./madara/controller/bet');
// var broadcastHndl = require('./madara/controller/broadcast');
// var marketteenpatiHndl = require('./madara/controller/teenpatimarket');
// var gameallHndl = require('./madara/controller/game-all');
// var othersportsHndl = require('./madara/controller/othersports');
// var casinoHndl = require('./madara/controller/casinotransfer.js');


var Log = mongoose.model('Log');
var Logsettlement = mongoose.model('Logsettlement');
// app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json({
  limit: "50mb"
})); // support json encoded bodies
app.use(bodyParser.urlencoded({
  limit: "50mb",
  extended: false,
  parameterLimit: 50000
})); // support encoded bodies

// app.use(express.urlencoded({ extended: false }));
// app.use(express.json({ rejectUnauthorized: false }));

app.use(function (req, res, next) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.setHeader('Access-Control-Allow-Credentials', true);
  next();
});

app.use('/uploads', express.static('uploads'));

app.use('/api/subadmin', subadminRoutes);
app.use('/api/user', userRoutes);

/////////////////-------Other score Api---------//////////////
app.post('/api/betdata', userHndl.betdata);
app.get('/api/allevents', userHndl.allevents);
app.get('/api/getcricketevents', userHndl.getcricketevents);
app.post('/webhook/transactions', userHndl.RazorTransactions);
app.post('/webhook/newtransactions', userHndl.newRazorTransactions);

//////////////////--------- UserHandler ---------///////////////

app.get('/api/refreshBalance/:username', userHndl.refreshBalance);

app.get('/api/getOpenBetClosedMarket', betHndl.getOpenBetClosedMarket);

app.post('/api/setBetResult', betHndl.setBetResult);

app.get('/api/getPendingMarketResult', superadminHndl.getPendingMarketResult);


app.post('/api/getAdminList', upload.any(), Helper.verifyToken, (req, res, next) => {
  // console.log(req)
  jwt.verify(req.token, myEnv.parsed.SECRET, (err, authData) => {
    if (err) {
      res.sendStatus(403);
    } else {
      superadminHndl.getAdminList(req, res, next);
    }
  });
});

app.post('/api/adminDeposit', upload.any(), Helper.verifyToken, (req, res, next) => {
  // console.log(req)
  jwt.verify(req.token, myEnv.parsed.SECRET, (err, authData) => {
    if (err) {
      res.sendStatus(403);
    } else {
      superadminHndl.adminDeposit(req, res, next);
    }
  });
});

app.post('/api/adminWithdraw', upload.any(), Helper.verifyToken, (req, res, next) => {
  // console.log(req)
  jwt.verify(req.token, myEnv.parsed.SECRET, (err, authData) => {
    if (err) {
      res.sendStatus(403);
    } else {
      superadminHndl.adminWithdraw(req, res, next);
    }
  });
});


app.post('/api/getEventMarket', upload.any(), Helper.verifyToken, (req, res, next) => {
  // console.log("userbetlock",req)
  jwt.verify(req.token, myEnv.parsed.SECRET, (err, authData) => {
    if (err) {
      res.sendStatus(403);
    } else {
      superadminHndl.getEventMarket(req, res, next);
    }
  });
});

app.post('/api/getMarketBets', upload.any(), Helper.verifyToken, (req, res, next) => {
  // console.log("userbetlock",req)
  jwt.verify(req.token, myEnv.parsed.SECRET, (err, authData) => {
    if (err) {
      res.sendStatus(403);
    } else {
      superadminHndl.getMarketBets(req, res, next);
    }
  });
});

app.post('/api/getOneMarket', upload.any(), Helper.verifyToken, (req, res, next) => {
  // console.log("userbetlock",req)
  jwt.verify(req.token, myEnv.parsed.SECRET, (err, authData) => {
    if (err) {
      res.sendStatus(403);
    } else {
      superadminHndl.getOneMarket(req, res, next);
    }
  });
});

app.post('/api/getMarketAnalasis', upload.any(), Helper.verifyToken, (req, res, next) => {
  // console.log("userbetlock",req)
  jwt.verify(req.token, myEnv.parsed.SECRET, (err, authData) => {
    if (err) {
      res.sendStatus(403);
    } else {
      superadminHndl.getMarketAnalasis(req, res, next);
    }
  });
});

app.post('/api/getPendingMarketAnalasis', upload.any(), Helper.verifyToken, (req, res, next) => {
  // console.log("userbetlock",req)
  jwt.verify(req.token, myEnv.parsed.SECRET, (err, authData) => {
    if (err) {
      res.sendStatus(403);
    } else {
      superadminHndl.getPendingMarketAnalasis(req, res, next);
    }
  });
});

app.post('/api/deleteBet', upload.any(), Helper.verifyToken, (req, res, next) => {
  // console.log("userbetlock",req)
  jwt.verify(req.token, myEnv.parsed.SECRET, (err, authData) => {
    if (err) {
      res.sendStatus(403);
    } else {
      superadminHndl.deleteBet(req, res, next);
    }
  });
});

app.post('/api/getCompetitions', upload.any(), Helper.verifyToken, (req, res, next) => {
  // console.log("userbetlock",req)
  jwt.verify(req.token, myEnv.parsed.SECRET, (err, authData) => {
    if (err) {
      res.sendStatus(403);
    } else {
      superadminHndl.getCompetitions(req, res, next);
    }
  });
});

app.post('/api/getEvents', upload.any(), Helper.verifyToken, (req, res, next) => {
  // console.log("userbetlock",req)
  jwt.verify(req.token, myEnv.parsed.SECRET, (err, authData) => {
    if (err) {
      res.sendStatus(403);
    } else {
      superadminHndl.getEvents(req, res, next);
    }
  });
});



app.post('/api/getUserList', upload.any(), Helper.verifyToken, (req, res, next) => {
  // console.log(req)
  jwt.verify(req.token, myEnv.parsed.SECRET, (err, authData) => {
    if (err) {
      res.sendStatus(403);
    } else {
      userHndl.getUserList(req, res, next);
      // if (req.body.role == "siteadmin") {
      //   superadminHndl.getAdminList(req, res, next);
      
      // }else{
      //   userHndl.getUserList(req, res, next);
      // }
    }
  });
});

// app.post('/api/getAdminList', upload.any(), Helper.verifyToken, (req, res, next) => {
//   // console.log(req)
//   jwt.verify(req.token, myEnv.parsed.SECRET, (err, authData) => {
//     if (err) {
//       res.sendStatus(403);
//     } else {
//       superadminHndl.getAdminList(req, res, next);
//     }
//   });
// });


// app.post('/api/getBalanceReport', userHndl.getBalanceReport);
app.post('/api/getBalanceReport', upload.any(), Helper.verifyToken, (req, res, next) => {
  // console.log(req)
  jwt.verify(req.token, myEnv.parsed.SECRET, (err, authData) => {
    if (err) {
      res.sendStatus(403);
    } else {
      userHndl.getBalanceReport(req, res, next);
    }
  });
});

app.post('/api/getSummary', upload.any(), Helper.verifyToken, (req, res, next) => {
  // console.log(req)
  jwt.verify(req.token, myEnv.parsed.SECRET, (err, authData) => {
    if (err) {
      res.sendStatus(403);
    } else {
      userHndl.getSummary(req, res, next);
    }
  });
});

// app.post('/api/getParentUserList', userHndl.getParentUserList);
app.post('/api/getParentUserList', upload.any(), Helper.verifyToken, (req, res, next) => {
  // console.log(req)
  jwt.verify(req.token, myEnv.parsed.SECRET, (err, authData) => {
    if (err) {
      res.sendStatus(403);
    } else {
      userHndl.getParentUserList(req, res, next);
    }
  });
});

// app.post('/api/searchUser', userHndl.searchUser);
app.post('/api/checkUsername', upload.any(), Helper.verifyToken, (req, res, next) => {
  // console.log(req)
  jwt.verify(req.token, myEnv.parsed.SECRET, (err, authData) => {
    if (err) {
      res.sendStatus(403);
    } else {
      userHndl.checkUsername(req, res, next);
    }
  });
});

// app.post('/api/getlockuserlist', userHndl.getLockUserList);
app.post('/api/getlockuserlist', upload.any(), Helper.verifyToken, (req, res, next) => {
  // console.log(req)
  jwt.verify(req.token, myEnv.parsed.SECRET, (err, authData) => {
    if (err) {
      res.sendStatus(403);
    } else {
      userHndl.getLockUserList(req, res, next);
    }
  });
});

// app.post('/api/getlockstatus', userHndl.getLockStatus);
app.post('/api/getlockstatus', upload.any(), Helper.verifyToken, (req, res, next) => {
  // console.log(req)
  jwt.verify(req.token, myEnv.parsed.SECRET, (err, authData) => {
    if (err) {
      res.sendStatus(403);
    } else {
      userHndl.getLockStatus(req, res, next);
    }
  });
});

// app.post('/api/getparentlockstatus', userHndl.getParentLockStatus);
app.post('/api/getparentlockstatus', upload.any(), Helper.verifyToken, (req, res, next) => {
  // console.log(req)
  jwt.verify(req.token, myEnv.parsed.SECRET, (err, authData) => {
    if (err) {
      res.sendStatus(403);
    } else {
      userHndl.getParentLockStatus(req, res, next);
    }
  });
});

// app.post('/api/updatedeposit', userHndl.updateDeposit);
app.post('/api/updatedeposit', upload.any(), Helper.verifyToken, (req, res, next) => {
  // console.log(req)
  jwt.verify(req.token, myEnv.parsed.SECRET, (err, authData) => {
    if (err) {
      res.sendStatus(403);
    } else {
      userHndl.updateDeposit(req, res, next);
    }
  });
});

// app.post('/api/updatewithdraw', userHndl.updateWithdraw);
app.post('/api/updatewithdraw', upload.any(), Helper.verifyToken, (req, res, next) => {
  // console.log(req)
  jwt.verify(req.token, myEnv.parsed.SECRET, (err, authData) => {
    if (err) {
      res.sendStatus(403);
    } else {
      userHndl.updateWithdraw(req, res, next);
    }
  });
});

// app.post('/api/updateexposure', userHndl.updateExposure);
app.post('/api/updateexposure', upload.any(), Helper.verifyToken, (req, res, next) => {
  // console.log(req)
  jwt.verify(req.token, myEnv.parsed.SECRET, (err, authData) => {
    if (err) {
      res.sendStatus(403);
    } else {
      userHndl.updateExposure(req, res, next);
    }
  });
});

// app.post('/api/updatecredit', userHndl.updateCredit);
app.post('/api/updatecredit', upload.any(), Helper.verifyToken, (req, res, next) => {
  // console.log(req)
  jwt.verify(req.token, myEnv.parsed.SECRET, (err, authData) => {
    if (err) {
      res.sendStatus(403);
    } else {
      userHndl.updateCredit(req, res, next);
    }
  });
});

// app.post('/api/updatestatus', userHndl.updateStatus);
app.post('/api/updatestatus', upload.any(), Helper.verifyToken, (req, res, next) => {
  // console.log(req)
  jwt.verify(req.token, myEnv.parsed.SECRET, (err, authData) => {
    if (err) {
      res.sendStatus(403);
    } else {
      userHndl.updateStatus(req, res, next);
    }
  });
});

// app.post('/api/getSetting', userHndl.getSetting);
app.post('/api/getSetting', upload.any(), Helper.verifyToken, (req, res, next) => {
  // console.log(req)
  jwt.verify(req.token, myEnv.parsed.SECRET, (err, authData) => {
    if (err) {
      res.sendStatus(403);
    } else {
      userHndl.getSetting(req, res, next);
    }
  });
});

// app.post('/api/updateSetting', userHndl.updateSetting);
app.post('/api/updateSetting', upload.any(), Helper.verifyToken, (req, res, next) => {
  // console.log(req)
  jwt.verify(req.token, myEnv.parsed.SECRET, (err, authData) => {
    if (err) {
      res.sendStatus(403);
    } else {
      userHndl.updateSetting(req, res, next);
    }
  });
});

// app.post('/api/generalreport', userHndl.generalReport);
app.post('/api/generalreport', upload.any(), Helper.verifyToken, (req, res, next) => {
  // console.log(req)
  jwt.verify(req.token, myEnv.parsed.SECRET, (err, authData) => {
    if (err) {
      res.sendStatus(403);
    } else {
      userHndl.generalReport(req, res, next);
    }
  });
});

// app.post('/api/updateBetStatus', userHndl.updateBetStatus);
app.post('/api/updateBetStatus', upload.any(), Helper.verifyToken, (req, res, next) => {
  // console.log(req)
  jwt.verify(req.token, myEnv.parsed.SECRET, (err, authData) => {
    if (err) {
      res.sendStatus(403);
    } else {
      userHndl.updateBetStatus(req, res, next);
    }
  });
});

// app.post('/api/updateSportEvents', userHndl.updateSportEvents);
app.post('/api/updateSportEvents', upload.any(), Helper.verifyToken, (req, res, next) => {
  // console.log(req)
  jwt.verify(req.token, myEnv.parsed.SECRET, (err, authData) => {
    if (err) {
      res.sendStatus(403);
    } else {
      userHndl.updateSportEvents(req, res, next);
    }
  });
});

// app.post('/api/getUserEvenets', userHndl.getUserEvenets);
app.post('/api/getUserEvenets', upload.any(), Helper.verifyToken, (req, res, next) => {
  // console.log(req)
  jwt.verify(req.token, myEnv.parsed.SECRET, (err, authData) => {
    if (err) {
      res.sendStatus(403);
    } else {
      userHndl.getUserEvenets(req, res, next);
    }
  });
});

// app.post('/api/getParentUserList', userHndl.getParentUserList);
app.post('/api/getParentUserList', upload.any(), Helper.verifyToken, (req, res, next) => {
  // console.log(req)
  jwt.verify(req.token, myEnv.parsed.SECRET, (err, authData) => {
    if (err) {
      res.sendStatus(403);
    } else {
      userHndl.getParentUserList(req, res, next);
    }
  });
});

// app.post('/api/getPartnerList', userHndl.getPartnerList);
app.post('/api/getPartnerList', upload.any(), Helper.verifyToken, (req, res, next) => {
  // console.log(req)
  jwt.verify(req.token, myEnv.parsed.SECRET, (err, authData) => {
    if (err) {
      res.sendStatus(403);
    } else {
      userHndl.getPartnerList(req, res, next);
    }
  });
});


// app.post('/api/updateAutoDeclare', userHndl.updateAutoDeclare);
// app.post('/api/updateMaintenancePage', userHndl.updateMaintenancePage);
// app.post('/api/getuserexposure', userHndl.getuserexposure);
// app.post('/api/casinoreport', userHndl.casinoReport);

//////////////--------- Bonus ----------////////////////
// app.post('/api/getAllBonus', userHndl.getAllBonus);
app.post('/api/getAllBonus', upload.any(), Helper.verifyToken, (req, res, next) => {
  // console.log(req)
  jwt.verify(req.token, myEnv.parsed.SECRET, (err, authData) => {
    if (err) {
      res.sendStatus(403);
    } else {
      userHndl.getAllBonus(req, res, next);
    }
  });
});

// app.post('/api/getBonusById', userHndl.getBonusById);
app.post('/api/getBonusById', upload.any(), Helper.verifyToken, (req, res, next) => {
  // console.log(req)
  jwt.verify(req.token, myEnv.parsed.SECRET, (err, authData) => {
    if (err) {
      res.sendStatus(403);
    } else {
      userHndl.getBonusById(req, res, next);
    }
  });
});

// app.post('/api/addBonus', userHndl.addBonus);
app.post('/api/addBonus', upload.any(), Helper.verifyToken, (req, res, next) => {
  // console.log(req)
  jwt.verify(req.token, myEnv.parsed.SECRET, (err, authData) => {
    if (err) {
      res.sendStatus(403);
    } else {
      userHndl.addBonus(req, res, next);
    }
  });
});

// app.post('/api/updateBonus', userHndl.updateBonus);
app.post('/api/updateBonus', upload.any(), Helper.verifyToken, (req, res, next) => {
  // console.log(req)
  jwt.verify(req.token, myEnv.parsed.SECRET, (err, authData) => {
    if (err) {
      res.sendStatus(403);
    } else {
      userHndl.updateBonus(req, res, next);
    }
  });
});

// app.post('/api/updateBonusStatus', userHndl.updateBonusStatus);
app.post('/api/updateBonusStatus', upload.any(), Helper.verifyToken, (req, res, next) => {
  // console.log(req)
  jwt.verify(req.token, myEnv.parsed.SECRET, (err, authData) => {
    if (err) {
      res.sendStatus(403);
    } else {
      userHndl.updateBonusStatus(req, res, next);
    }
  });
});

app.post('/api/deleteBonus', upload.any(), Helper.verifyToken, (req, res, next) => {
  // console.log(req)
  jwt.verify(req.token, myEnv.parsed.SECRET, (err, authData) => {
    if (err) {
      res.sendStatus(403);
    } else {
      userHndl.deleteBonus(req, res, next);
    }
  });
});

// app.post('/api/deleteBonus', userHndl.deleteBonus);

//////////////--------- Bonus ----------////////////////

app.post('/api/getAllBanner', upload.any(), Helper.verifyToken, (req, res, next) => {
  // console.log(req)
  jwt.verify(req.token, myEnv.parsed.SECRET, (err, authData) => {
    if (err) {
      res.sendStatus(403);
    } else {
      userHndl.getAllBanner(req, res, next);
    }
  });
});


app.post('/api/getBannerById', upload.any(), Helper.verifyToken, (req, res, next) => {
  // console.log(req)
  jwt.verify(req.token, myEnv.parsed.SECRET, (err, authData) => {
    if (err) {
      res.sendStatus(403);
    } else {
      userHndl.getBannerById(req, res, next);
    }
  });
});


app.post('/api/addBanner', upload.single("image"), Helper.verifyToken, (req, res, next) => {
  // console.log(req)
  jwt.verify(req.token, myEnv.parsed.SECRET, (err, authData) => {
    if (err) {
      res.sendStatus(403);
    } else {
      userHndl.addBanner(req, res, next);
    }
  });
});


app.post('/api/updateBanner', upload.single("image"), Helper.verifyToken, (req, res, next) => {
  // console.log(req)
  jwt.verify(req.token, myEnv.parsed.SECRET, (err, authData) => {
    if (err) {
      res.sendStatus(403);
    } else {
      userHndl.updateBanner(req, res, next);
    }
  });
});

app.post('/api/updateBannerStatus', upload.any(), Helper.verifyToken, (req, res, next) => {
  // console.log(req)
  jwt.verify(req.token, myEnv.parsed.SECRET, (err, authData) => {
    if (err) {
      res.sendStatus(403);
    } else {
      userHndl.updateBannerStatus(req, res, next);
    }
  });
});

// app.post('/api/deleteBanner', userHndl.deleteBanner);
app.post('/api/deleteBanner', upload.any(), Helper.verifyToken, (req, res, next) => {
  // console.log(req)
  jwt.verify(req.token, myEnv.parsed.SECRET, (err, authData) => {
    if (err) {
      res.sendStatus(403);
    } else {
      userHndl.deleteBanner(req, res, next);
    }
  });
});


////////////////-------- MarketHandler ----------//////////////
// app.post('/api/getMarketBet', marketHndl.getMarketBet);
app.post('/api/getMarketBet', upload.any(), Helper.verifyToken, (req, res, next) => {
  // console.log(req)
  jwt.verify(req.token, myEnv.parsed.SECRET, (err, authData) => {
    if (err) {
      res.sendStatus(403);
    } else {
      marketHndl.getMarketBet(req, res, next);
    }
  });
});
// app.post('/api/getIncompleteMarkets', marketHndl.getIncompleteMarkets);
app.post('/api/getIncompleteMarkets', upload.any(), Helper.verifyToken, (req, res, next) => {
  // console.log(req)
  jwt.verify(req.token, myEnv.parsed.SECRET, (err, authData) => {
    if (err) {
      res.sendStatus(403);
    } else {
      marketHndl.getIncompleteMarkets(req, res, next);
    }
  });
});

// app.post('/api/getClosedMarkets', marketHndl.getClosedMarkets);
app.post('/api/getClosedMarkets', upload.any(), Helper.verifyToken, (req, res, next) => {
  // console.log(req)
  jwt.verify(req.token, myEnv.parsed.SECRET, (err, authData) => {
    if (err) {
      res.sendStatus(403);
    } else {
      marketHndl.getClosedMarkets(req, res, next);
    }
  });
});
// app.post('/api/getOpenMarkets', marketHndl.getOpenMarkets);
app.post('/api/getOpenMarkets', upload.any(), Helper.verifyToken, (req, res, next) => {
  // console.log(req)
  jwt.verify(req.token, myEnv.parsed.SECRET, (err, authData) => {
    if (err) {
      res.sendStatus(403);
    } else {
      marketHndl.getOpenMarkets(req, res, next);
    }
  });
});
// app.post('/api/getOtherMarkets', marketHndl.getOtherMarkets);
app.post('/api/getOtherMarkets', upload.any(), Helper.verifyToken, (req, res, next) => {
  // console.log(req)
  jwt.verify(req.token, myEnv.parsed.SECRET, (err, authData) => {
    if (err) {
      res.sendStatus(403);
    } else {
      marketHndl.getOtherMarkets(req, res, next);
    }
  });
});

// app.post('/api/getMarketAnalysis', marketHndl.getMarketAnalysis);
app.post('/api/getMarketAnalysis', upload.any(), Helper.verifyToken, (req, res, next) => {
  // console.log(req)
  jwt.verify(req.token, myEnv.parsed.SECRET, (err, authData) => {
    if (err) {
      res.sendStatus(403);
    } else {
      marketHndl.getMarketAnalysis(req, res, next);
    }
  });
});

// app.post('/api/userbetlock', marketHndl.userBetLock);
app.post('/api/userbetlock', upload.any(), Helper.verifyToken, (req, res, next) => {
  // console.log("userbetlock",req)
  jwt.verify(req.token, myEnv.parsed.SECRET, (err, authData) => {
    if (err) {
      res.sendStatus(403);
    } else {
      marketHndl.userBetLock(req, res, next);
    }
  });
});
// app.post('/api/userremovebetlock', marketHndl.userRemoveBetLock);
app.post('/api/userremovebetlock', upload.any(), Helper.verifyToken, (req, res, next) => {
  // console.log("userbetlock",req)
  jwt.verify(req.token, myEnv.parsed.SECRET, (err, authData) => {
    if (err) {
      res.sendStatus(403);
    } else {
      marketHndl.userRemoveBetLock(req, res, next);
    }
  });
});
// app.post('/api/userfancylock', marketHndl.userFancyLock);
app.post('/api/userfancylock', upload.any(), Helper.verifyToken, (req, res, next) => {
  // console.log("userbetlock",req)
  jwt.verify(req.token, myEnv.parsed.SECRET, (err, authData) => {
    if (err) {
      res.sendStatus(403);
    } else {
      marketHndl.userFancyLock(req, res, next);
    }
  });
});

// app.post('/api/userremovefancylock', marketHndl.userRemoveFancyLock);
app.post('/api/userremovefancylock', upload.any(), Helper.verifyToken, (req, res, next) => {
  // console.log("userbetlock",req)
  jwt.verify(req.token, myEnv.parsed.SECRET, (err, authData) => {
    if (err) {
      res.sendStatus(403);
    } else {
      marketHndl.userRemoveFancyLock(req, res, next);
    }
  });
});

// app.post('/api/getCasinoReport', marketHndl.getCasinoReport);
app.post('/api/getCasinoReport', upload.any(), Helper.verifyToken, (req, res, next) => {
  // console.log("userbetlock",req)
  jwt.verify(req.token, myEnv.parsed.SECRET, (err, authData) => {
    if (err) {
      res.sendStatus(403);
    } else {
      marketHndl.getCasinoReport(req, res, next);
    }
  });
});

app.post('/api/removeMarket', upload.any(), Helper.verifyToken, (req, res, next) => {
  // console.log("userbetlock",req)
  jwt.verify(req.token, myEnv.parsed.SECRET, (err, authData) => {
    if (err) {
      res.sendStatus(403);
    } else {
      marketHndl.removeMarket(req, res, next);
    }
  });
});

app.post('/api/getManagerHomeMarket', upload.any(), Helper.verifyToken, (req, res, next) => {
  // console.log("userbetlock",req)
  jwt.verify(req.token, myEnv.parsed.SECRET, (err, authData) => {
    if (err) {
      res.sendStatus(403);
    } else {
      marketHndl.getManagerHomeMarket(req, res, next);
    }
  });
});


// app.post('/api/getManagerHomeMarket', function (req, res) {
//   try {
//     var filter = {
//       visible: true ,marketType:{$in:['MATCH_ODDS']},  'marketBook.status': { $ne: 'CLOSED' } 
//     }
//     Market.find(filter).exec(function (err, dbMarketAll) {
//       Bet.distinct('marketId', {
//         managerId: req.body.userId,
//         result: 'ACTIVE',
//         deleted: false
//       }).exec(function (err, dbBet) {

//         Market.find({
//           marketId: {
//             $in: dbBet
//           }
//         }).exec(function (err, dbMarket) {
//           var market = {
//             dbMarket: dbMarketAll,
//             totalMarket: dbMarketAll.length,
//             totalBetMarket: dbMarket.length
//           }
//           res.json(market);

//         });
//       });
//     });
//   } catch (e) {

//   }
// });

// app.get('/api/gamedetails/:roundId', marketHndl.gameDetails);
// app.post('/api/declareMarket', marketHndl.declareMarket);
// app.post('/api/getMarketIdUserbets', marketHndl.getMarketIdUserbets);

////////////----------- RollbackHandler ---------//////////////////

app.post('/api/unsetfancymarket', rollbackHndl.unsetfancymarket);
app.post('/api/setfancymarket', rollbackHndl.setfancymarket);
app.post('/api/unsetbookmakermarket', rollbackHndl.unsetbookmakermarket);
app.post('/api/setbookmakermarket', rollbackHndl.setbookmakermarket);
app.post('/api/unsetmatchoddsmarket', rollbackHndl.unsetmatchoddsmarket);
app.post('/api/setmatchoddsmarket', rollbackHndl.setmatchoddsmarket);

///////////////----------- LogHandler -------------/////////////////

// app.post('/api/typeProfitLoss', logHndl.typeProfitLoss);

app.post('/api/typeProfitLoss', upload.any(), Helper.verifyToken, (req, res, next) => {
  // console.log("userbetlock",req)
  jwt.verify(req.token, myEnv.parsed.SECRET, (err, authData) => {
    if (err) {
      res.sendStatus(403);
    } else {
      logHndl.typeProfitLoss(req, res, next);
    }
  });
});

app.post('/api/typeAllProfitLoss', upload.any(), Helper.verifyToken, (req, res, next) => {
  // console.log("userbetlock",req)
  jwt.verify(req.token, myEnv.parsed.SECRET, (err, authData) => {
    if (err) {
      res.sendStatus(403);
    } else {
      logHndl.typeAllProfitLoss(req, res, next);
    }
  });
});

app.post('/api/profitloss', upload.any(), Helper.verifyToken, (req, res, next) => {
  // console.log("userbetlock",req)
  jwt.verify(req.token, myEnv.parsed.SECRET, (err, authData) => {
    if (err) {
      res.sendStatus(403);
    } else {
      logHndl.profitLoss(req, res, next);
    }
  });
});

///////////////------------ MessageHandler ----------//////////////
// app.post('/api/getMessage', messageHndl.getMessage);
app.post('/api/getMessage', upload.any(), Helper.verifyToken, (req, res, next) => {
  // console.log("userbetlock",req)
  jwt.verify(req.token, myEnv.parsed.SECRET, (err, authData) => {
    if (err) {
      res.sendStatus(403);
    } else {
      messageHndl.getMessage(req, res, next);
    }
  });
});

// app.post('/api/createMessage', messageHndl.createMessage);
app.post('/api/createMessage', upload.any(), Helper.verifyToken, (req, res, next) => {
  // console.log("userbetlock",req)
  jwt.verify(req.token, myEnv.parsed.SECRET, (err, authData) => {
    if (err) {
      res.sendStatus(403);
    } else {
      messageHndl.createMessage(req, res, next);
    }
  });
});

app.post('/api/getLogDifference', upload.any(), Helper.verifyToken, (req, res, next) => {
  // console.log("userbetlock",req)
  jwt.verify(req.token, myEnv.parsed.SECRET, (err, authData) => {
    if (err) {
      res.sendStatus(403);
    } else {
      // messageHndl.createMessage(req, res, next); 
      // console.log(req.token,req.body)

      Log.distinct("username", {
        'subAction': {
          $nin: ['ACCOUNT_CREATE', 'CREDIT_REFRENCE', 'EXPOSURE_LIMIT']
        },
        $or: [{ adminId: req.body.adminId }, { admin: req.body.adminName }],
      }, function (err, userlist) {

        // console.log(userlist)
        var output = {};
        if (userlist.length == 0) {
          output.user = userlist;
          output.profit = {};
          res.json(output)

          return;
        }

        var counter = 0;
        var totalLog = 0;
        var totalwon = 0;
        var totalloss = 0;
        output.user = userlist;
        output.profit = {};
        output.UserBalance = {};
        output.marketfault = {};
        output.balancefault = {};
        var len = userlist.length
        for (var i = 0; i < userlist.length; i++) {
          (function (user, index, callback) {

            Log.find({
              'username': user,
              'subAction': {
                $nin: ['ACCOUNT_CREATE', 'CREDIT_REFRENCE', 'EXPOSURE_LIMIT']
              },
              $or: [{ adminId: req.body.adminId }, { admin: req.body.adminName }],
            }).sort({
              _id: 1
            }).exec(async function (err, userlog) {
              var userBalance = await User.findOne({ username: userlist[index] }, { balance: 1, role: 1 })
              var profit = 0;
              var NewBalance = 0;
              if (userlog) {
                totalLog += userlog.length;

                for (var j = 0; j < userlog.length; j++) {
                  // console.log("Log",user , userlog[j].subAction, userlog[j].oldLimit, userlog[j].newLimit, userlog[j].amount);
                  NewBalance += parseInt(userlog[j].amount);
                  // if (userlog[j].subAction == 'AMOUNT_WON') {
                  //   profit += parseInt(userlog[j].amount);
                  //   totalwon += parseInt(userlog[j].amount);
                  // } else if (userlog[j].subAction == 'AMOUNT_LOST') {
                  //   profit += parseInt(userlog[j].amount);
                  //   totalloss += parseInt(userlog[j].amount);
                  // } else if (userlog[j].subAction == 'COMMISSION_WON') {
                  //   profit += parseInt(userlog[j].amount);
                  //   totalwon += parseInt(userlog[j].amount);
                  // } else if (userlog[j].subAction == 'COMMISSION_LOST') {
                  //   profit += parseInt(userlog[j].amount);
                  //   totalloss += parseInt(userlog[j].amount);
                  // }


                  profit += parseInt(userlog[j].amount);
                  totalloss += parseInt(userlog[j].amount);

                  var limitdiff = userlog[j].newLimit - userlog[j].oldLimit;
                  limitdiff = parseFloat(limitdiff).toFixed(2)
                  // console.log("Difference1111", user, userlog[j].marketId, limitdiff, parseFloat(userlog[j].amount).toFixed(2));
                  if (limitdiff != parseFloat(userlog[j].amount).toFixed(2)) {
                    console.log("Difference1111", user, userlog[j].marketId, limitdiff, parseFloat(userlog[j].amount).toFixed(2));
                    output.marketfault[userlist[index]] = userlog[j].marketId;
                  }
                  newlllmit = parseFloat(userlog[j].newLimit).toFixed(2);
                  // var didhd = function (NewBalance, newlllmit) { return Math.abs(NewBalance - newlllmit); }
                  // console.log(didhd)
                  if (NewBalance != parseFloat(userlog[j].newLimit).toFixed(2)) {
                    console.log("Difference2222", user, userlog[j].marketId, limitdiff, parseFloat(userlog[j].amount).toFixed(2), NewBalance, userlog[j].newLimit);
                    output.balancefault[userlist[index]] = userlog[j].marketId;
                  }
                }

                // console.log(user, NewBalance)

                callback(profit, index, totalloss, totalwon, NewBalance, userBalance.balance, userBalance.role);


              } else {
                callback(0, index, totalloss, totalwon, 0);
              }

            });

          })(userlist[i], i, function (profit, index, totalloss, totalwon, NewBalance, UserBalance, UserRole) {
            counter++;
            var lastBalance = (UserBalance - NewBalance);
            // console.log(userlist[index],UserBalance, NewBalance, lastBalance)
            if (counter == len) {
              output.profit[userlist[index]] = profit;
              output.UserBalance[userlist[index]] = { UserBalance, NewBalance, lastBalance, UserRole };
              res.json(output)

            } else {
              output.UserBalance[userlist[index]] = { UserBalance, NewBalance, lastBalance, UserRole };
              output.profit[userlist[index]] = profit;
            }
          });

        }
      });
    }
  });
});

app.post('/api/getUserLogDifference', (req, res) => {
  // console.log("userbetlock",req)
  // jwt.verify(req.token,myEnv.parsed.SECRET,(err,authData)=>{  
  //     if(err){  
  //         res.sendStatus(403);  
  //     }else{  
  // messageHndl.createMessage(req, res, next); 
  // console.log(req.token,req.body)

  Log.distinct("username", {
    'subAction': {
      $nin: ['ACCOUNT_CREATE', 'CREDIT_REFRENCE', 'EXPOSURE_LIMIT']
    },
    $or: [{ userId: req.body.userId }, { username: req.body.username }],
  }, function (err, userlist) {

    console.log(userlist)
    var output = {};
    if (userlist.length == 0) {
      output.user = userlist;
      output.profit = {};
      res.json(output)
      return;
    }

    var counter = 0;
    var totalLog = 0;
    var totalwon = 0;
    var totalloss = 0;
    output.user = userlist;
    output.profit = {};
    output.UserBalance = {};
    output.marketfault = {};
    output.balancefault = {};
    var len = userlist.length
    for (var i = 0; i < userlist.length; i++) {
      (function (user, index, callback) {

        Log.find({
          'username': user,
          'subAction': {
            $nin: ['ACCOUNT_CREATE', 'CREDIT_REFRENCE', 'EXPOSURE_LIMIT']
          },
          $or: [{ userId: req.body.userId }, { username: req.body.username }],
        }).sort({
          _id: 1
        }).exec(async function (err, userlog) {
          var userBalance = await User.findOne({ username: userlist[index] }, { balance: 1, role: 1, creditrefrence: 1 })
          var profit = 0;
          var NewBalance = 0;
          if (userBalance.role == "admin") {
            NewBalance = userBalance.creditrefrence;
          }
          if (userlog) {
            totalLog += userlog.length;

            for (var j = 0; j < userlog.length; j++) {
              // console.log("Log",user , userlog[j].subAction, userlog[j].oldLimit, userlog[j].newLimit, userlog[j].amount);
              NewBalance += parseFloat(userlog[j].amount);
              // if (userlog[j].subAction == 'AMOUNT_WON') {
              //   profit += parseInt(userlog[j].amount);
              //   totalwon += parseInt(userlog[j].amount);
              // } else if (userlog[j].subAction == 'AMOUNT_LOST') {
              //   profit += parseInt(userlog[j].amount);
              //   totalloss += parseInt(userlog[j].amount);
              // } else if (userlog[j].subAction == 'COMMISSION_WON') {
              //   profit += parseInt(userlog[j].amount);
              //   totalwon += parseInt(userlog[j].amount);
              // } else if (userlog[j].subAction == 'COMMISSION_LOST') {
              //   profit += parseInt(userlog[j].amount);
              //   totalloss += parseInt(userlog[j].amount);
              // } else if (userlog[j].subAction == 'BALANCE_DEPOSIT') {
              //   profit += parseInt(userlog[j].amount);
              //   totalwon += parseInt(userlog[j].amount);
              // } else if (userlog[j].subAction == 'BALANCE_WITHDRAWL') {
              //   profit += parseInt(userlog[j].amount);
              //   totalloss += parseInt(userlog[j].amount);
              // } else if (userlog[j].subAction == 'BONUS_DEPOSIT') {
              //   profit += parseInt(userlog[j].amount);
              //   totalwon += parseInt(userlog[j].amount);
              // } else if (userlog[j].subAction == 'BONUS_WITHDRAWL') {
              //   profit += parseInt(userlog[j].amount);
              //   totalloss += parseInt(userlog[j].amount);
              // }

              profit += parseFloat(userlog[j].amount);
              totalloss += parseFloat(userlog[j].amount);

              var limitdiff = userlog[j].newLimit - userlog[j].oldLimit;
              limitdiff = parseFloat(limitdiff).toFixed(2)
              // console.log("Difference1111", user, userlog[j].marketId, limitdiff, parseFloat(userlog[j].amount).toFixed(2));
              if (limitdiff != parseFloat(userlog[j].amount).toFixed(2)) {
                console.log("Difference1111", user, userlog[j].marketId, limitdiff, parseFloat(userlog[j].amount).toFixed(2));
                output.marketfault[userlist[index]] = userlog[j].marketId;
              }
              newlllmit = parseFloat(userlog[j].newLimit).toFixed(2);
              // var didhd = function (NewBalance, newlllmit) { return Math.abs(NewBalance - newlllmit); }
              // console.log(didhd)
              if (NewBalance != parseFloat(userlog[j].newLimit).toFixed(2)) {
                if (NewBalance > parseFloat(userlog[j].newLimit).toFixed(2)) {
                  console.log("Difference Loss", user, userlog[j].marketId, limitdiff, parseFloat(userlog[j].amount).toFixed(2), NewBalance, userlog[j].newLimit);
                }

                if (NewBalance < parseFloat(userlog[j].newLimit).toFixed(2)) {
                  console.log("Difference Profit", user, userlog[j].marketId, limitdiff, parseFloat(userlog[j].amount).toFixed(2), NewBalance, userlog[j].newLimit);
                }

                output.balancefault[userlist[index]] = userlog[j].marketId;
              }
            }

            // console.log(user, NewBalance)

            callback(profit, index, totalloss, totalwon, NewBalance, userBalance.balance, userBalance.role);


          } else {
            callback(0, index, totalloss, totalwon, 0);
          }

        });

      })(userlist[i], i, function (profit, index, totalloss, totalwon, NewBalance, UserBalance, UserRole) {
        counter++;
        var lastBalance = (UserBalance - NewBalance);
        console.log(userlist[index], UserBalance, NewBalance, lastBalance)
        if (counter == len) {
          output.profit[userlist[index]] = profit;
          output.UserBalance[userlist[index]] = { UserBalance, NewBalance, lastBalance, UserRole };
          res.json(output)

        } else {
          output.UserBalance[userlist[index]] = { UserBalance, NewBalance, lastBalance, UserRole };
          output.profit[userlist[index]] = profit;
        }
      });

    }
  });
  //     }  
  // });  
});

app.post('/api/getCasinoPending', (req, res) => {
  // console.log("userbetlock",req)


  Bet.distinct("marketId", {
    'admin': req.body.username,
    deleted: false,
    // status:{$ne:"FAILED"}
    status: "PENDING"
  }, async function (err, userbet) {
    console.log(userbet.length)
    var allmarkets = [];
    for (var i = 0; i < userbet.length; i++) {
      var marketLog = await Log.find({ marketId: userbet[i] }, { _id: 1 }).lean();
      if (marketLog.length < req.body.number) {
        // console.log(userbet[i], marketLog.length);
        allmarkets.push(userbet[i])
      }
    }
    res.json(allmarkets);
  });
});

app.post('/api/getLiveCasinoPending', (req, res) => {
  // console.log("userbetlock",req)


  Bet.distinct("marketId", {
    'admin': req.body.username,
    deleted: false,
    createDate: req.body.date,
    status: "COMPLETED"
  }, async function (err, userbet) {
    console.log(userbet.length)
    var allmarkets = [];
    for (var i = 0; i < userbet.length; i++) {
      var marketLog = await Log.find({ marketId: userbet[i] }, { _id: 1 }).lean();
      if (marketLog.length < req.body.number) {
        // console.log(userbet[i], marketLog.length);
        allmarkets.push(userbet[i])
      }
    }
    res.json(allmarkets);
  });
});

app.post('/api/updateCasinoMarket', async (req, res) => {
  // console.log("userbetlock",req)
  var marketLog = await Log.find({ marketId: req.body.marketId }, { _id: 1 }).lean();
  console.log(marketLog.length);
  if (marketLog.length < 2) {
    Casinotrans.updateOne({
      roundId: req.body.marketId,
      txntype: 'CREDIT',
    }, {
      $set: {
        Userlog: 0
      }
    }, { new: true }, async function (err, row) {
      if (err) console.log(err); logger.error(err);
      console.log("update");
      Market.updateOne({
        marketId: req.body.marketId,
        userlog: 1,
        adminlog: 1,
      }, {
        $set: {
          managerlog: 0,
          masterlog: 0,
          subadminlog: 0,
          adminlog: 0
        }
      }, { new: true }, async function (err, row) {
        if (err) console.log(err); logger.error(err);
        console.log("update");
        res.json(req.body.marketId);
      });
    });


  }
});


////////////////----------- Static Apis---------------/////////////


// app.post('/api/removeMarket', function (req, res) {
//   Market.find({"marketBook.status":"CLOSED"}, { eventId: 1, marketId: 1, roundId: 1 }, function (err, dbMarket) {
//     var i = 1;
//     dbMarket.forEach(async function (market, index) {
//       // console.log("adsafasf",market.marketId)
//       await Bet.find({
//         eventId: market.eventId,  
//         marketId: market.marketId,
//         deleted: false
//       }, async function (err, bets) {

//         if (bets.length == 0) {
//           console.log("NO bet", market.marketId, bets.length);
//           await Market.remove({
//             eventId: market.eventId,
//             marketId: market.marketId,
//           }, function (err, data) {
//             console.log('remove', market.marketId);

//           });
//           // return;
//         }
//       })

//       // console.log(dbMarket.length,i)
//       if(dbMarket.length == i){
//         console.log('remove All');
//         res.json('sucess'); 
//       }
//       i++;
//     })
//   })
// });







// var sessionHndl = require('./madara/controller/session');
// var eventHndl = require('./madara/controller/event');
// var messageHndl = require('./madara/controller/message');
// var marketteenpatiHndl = require('./madara/controller/teenpatimarket');
// var othersportsHndl = require('./madara/controller/othersports');
// var chatHndl = require('./madara/controller/chat');





// var server              =   http.createServer(app);
// var socketIO           	=   require('socket.io')(server, {path: '/Dcd7pwimDyfKiPvTadgGH/socket.io'});
// var userSocket          =   require('socket.io-client')('http://localhost:3003', {transports: ["websocket"], path: '/Dcd7pwimDyfKiPvTAAAh/socket.io'});
// var adminSocket       	=   require('socket.io-client')('http://localhost:3000', {transports: ["websocket"], path: '/RVeDr66xWzOVLhV5AABI/socket.io'});
// logger.level            =   'error';
// var io 									= 	{self:socketIO, user:userSocket, admin:adminSocket};

// Market Pulse
//setInterval(function(){broadcastHndl.marketPulse(io);broadcastHndl.wheelMarketPulse(io,'manager','manager');}, 10000);
//setInterval(function(){broadcastHndl.chatsuccess(io);},resultteenpatPulse 6000);marketteenpatPulse
//setInterval(function(){broadcastHndl.homePulse(io);broadcastHndl.resultteenpatPulse(io)}, 6000);
//setInterval(function(){broadcastHndl.marketOneDayPulse(io);broadcastHndl.wheelMarketPulse(io,'manager','manager');}, 1000); 

setInterval(function () {
  broadcastHndl.eventPulse(io);
  //  broadcastHndl.virtualMarketPulse(io,'user');
  // broadcastHndl.updateMarketVirtual(io);
  // broadcastHndl.updateMarketVirtual(io);  // spinner update.
  // broadcastHndl.singleeventPulse(io,request);
  // broadcastHndl.marketOneDayPulse(io);
  // broadcastHndl.wheelMarketPulse(io, 'user', 'osg');
  // broadcastHndl.marketteenpatPulse(io);
}, 800);

setInterval(() => { socketHandler.subadminTransactions(io); }, 10000);

// User requests
var connectionCount = 0;

io.on('connection', function (socket) {
  connectionCount += 1;
  console.log("new connection: " + connectionCount);
  console.log('socket.id', socket.id);
  //setInterval(function(){broadcastHndl.marketteenpatPulse(socket);}, 1000);
  socket.emit('get-login-status', { 'socket.id': socket.id });
  socket.on('RVeDr66xWzOVLhV5AABIDcd7pwimDyfKiPvTAAAh5b52ccd84fa96dd59b65e54f', (request) => {
    logger.info("local communication: " + JSON.stringify(request));
    if (!request) return;
    if (!request.socket || !request.emitString) return;
    io.to(request.socket).emit(request.emitString, request.emitData);
  });


  /////////////////////--------- userhandler ----------------//////////////////
  /// A1
  socket.on('create-user', (request) => {
    // console.log(request);
    if (request.newUser.role == 'techadmin') {
      superadminHndl.createAdmin(io, socket, request);
    }else{
      userHndl.createUser(io, socket, request);
    }

  });
  /// A2
  socket.on('create-partner', (request) => { userHndl.createPartner(io, socket, request); });

  socket.on('create-admin', (request) => { superadminHndl.createAdmin(io, socket, request); });
  /// A3
  socket.on('login', (request) => { userHndl.userlogin(io, socket, request); });

  socket.on('admin-login', (request) => { superadminHndl.superAdminlogin(io, socket, request); });

  socket.on('delete-bets', (request) => { superadminHndl.deleteBets(io, socket, request); });
  /// A4
  // socket.on('get-user', (request) => { userHndl.getUser(io, socket, request); });  ///// Uses
  /// A5
  // socket.on('get-users', (request) => { userHndl.getUsers(io, socket, request); }); ///// Uses
  /// A6
  socket.on('update-password', (request) => { userHndl.changePassword(io, socket, request); });
  /// A7
  socket.on('update-userpassword', (request) => { userHndl.changeUserPassword(io, socket, request); });
  /// A8
  socket.on('get-parentuser-balance', (request) => { userHndl.getBalance(io, socket, request); });

  socket.on('update-maintenance-page', (request) => { userHndl.updateMaintenancePage(io, socket, request); });

  // socket.on('logout', (request) => { userHndl.logout(io, socket, request); });
  // socket.on('login-status', (request) => { userHndl.loginStatus(io, socket, request, { role: 'manager', role2: 'partner' }) });
  // socket.on('get-tv-api', (request) => { userHndl.getTvs(io, socket, request); });
  // socket.on('get-chatusers', (request) => { userHndl.getChatUsers(io, socket, request); });
  // socket.on('update-user', (request) => { userHndl.updateUser(io, socket, request); });
  // socket.on('update-user-status', (request) => { userHndl.updateUserStatus(io, socket, request); });
  // socket.on('update-user-balance', (request) => { userHndl.updateUserBalance(io, socket, request); });
  // socket.on('update-transpassword', (request) => { userHndl.changeTransPassword(io, socket, request); });
  // socket.on('delete-user', (request) => { userHndl.deleteUser(io, socket, request); });
  // socket.on('update-match-fees', (request) => { userHndl.updateMatchFees(io, socket, request); });
  // socket.on('update-credit', (request) => { userHndl.updateCredit(io, socket, request); });
  // socket.on('get-user-balance', (request) => { userHndl.getUserBalance(io, socket, request); });
  // socket.on('update-sharing', (request) => { userHndl.updateShare(io, socket, request); });
  // socket.on('update-match-commision', (request) => { userHndl.updateMatchCommisions(io, socket, request); });
  // socket.on('update-referal', (request) => { userHndl.updateReferal(io, socket, request); });
  // socket.on('user-report', (request) => { userHndl.userReport(io, socket, request); });
  // socket.on('update-whatsapp', (request) => { userHndl.updatewhatsapp(io, socket, request); });
  // socket.on('update-telegram', (request) => { userHndl.updatetelegram(io, socket, request); });
  // socket.on('get-withdraw', (request) => { userHndl.getFinance(io, socket, request); });
  // socket.on('update-withdraw', (request) => { userHndl.updateWithdraw(io, socket, request); });

  /////////////////------------------- marketHandler -------------------//////////////////
  /// B1
  socket.on('get-user-book', (request) => { marketHndl.getUserBook(io, socket, request); });
  /// B2
  socket.on('get-casino-book', (request) => { marketHndl.getCasinoBook(io, socket, request); });
  /// B3
  socket.on('get-bookermaker-book', (request) => { marketHndl.getUserBookmakerBook(io, socket, request); });
  /// B4
  socket.on('get-markets', (request) => { marketHndl.getMarkets(io, socket, request); });

  //   socket.on('get-omarkets', (request) => { marketHndl.getoMarkets(io, socket, request); });
  //   socket.on('get-openmarkets', (request) => { marketHndl.getopenMarkets(io, socket, request); });
  //   socket.on('get-markethomes', (request) => { marketHndl.getMarketHomes(io, socket, request); });
  //   socket.on('get-summary', (request) => { marketHndl.getManagerSummary(io, socket, request); });
  //   socket.on('get-summary-filter', (request) => { marketHndl.getManagerSummaryfilter(io, socket, request); });
  socket.on('update-market', (request) => { marketHndl.updateMarket(io, socket, request); });
  socket.on('create-market', (request) => { marketHndl.createMarket(io, socket, request); });
  socket.on('set-session-result', (request) => { marketHndl.setSessionResult(io, socket, request); });
  socket.on('set-toss-result', (request) => { marketHndl.setTossnResult(io, socket, request); });
  //   socket.on('get-match-fees-profit', (request) => { marketHndl.getMatchFeesProfit(io, socket, request); });
  //   socket.on('get-market-summary', (request) => { marketHndl.getMarketSummary(io, socket, request); });
  //   socket.on('get-market-analasis', (request) => { marketHndl.getMarketAnalasis(io, socket, request); });
  //   socket.on('get-marketLine', (request) => { marketHndl.getMarketLine(io, socket, request); });
  //   socket.on('get-market-fancy', (request) => { marketHndl.getMarketFancy(io, socket, request); });
  //   socket.on('update-market-line', (request) => { marketHndl.updateMarketLine(io, socket, request); });
  //   socket.on('update-userline', (request) => { marketHndl.userLine(io, socket, request); });


  /////////////////////------------ betHandler -----------------//////////////////////////
  /// C1
  socket.on('get-userbets', (request) => { betHndl.getUserBets(io, socket, request); });
  /// C2
  socket.on('get-current-bets', (request) => { betHndl.getCurrentBets(io, socket, request); });
  /// C3
  socket.on('get-filter-userbets', (request) => { betHndl.getFilterUserBets(io, socket, request); });
  /// C4
  socket.on('get-runner-profit', (request) => { betHndl.getRunnerProfit(io, socket, request); });



  // socket.on('get-bets', (request) => { betHndl.getBets(io, socket, request); });
  // socket.on('get-marketid-userbets', (request) => { betHndl.getMarketIdUserBets(io, socket, request); });
  // socket.on('delete-bet', (request) => { betHndl.deleteBet(io, socket, request); });
  // socket.on('get-runner-home-profit', (request) => { betHndl.getRunnerHomeProfit(io, socket, request); });
  // socket.on('refresh-balance', (request) => { betHndl.refreshBalance(io, socket, request); });
  // socket.on('getuser-profitloss', (request) => { betHndl.getuserProfitLossSummary(io, socket, request); });
  // socket.on('getuser-filterprofitloss', (request) => { betHndl.getuserFilterProfitLossSummary(io, socket, request); });

  ///////////////////--------------- gameHandler ----------------///////////////////////
  /// D1
  socket.on('get-game-one', (request) => { gameallHndl.gameLinkOne(io, socket, request); });  //

  // socket.on('get-history', (request) => { gameallHndl.getHistory(io, socket, request); });
  // socket.on('get-game-report', (request) => { gameallHndl.gameReport(io, socket, request); });
  // socket.on('get-user-report', (request) => { gameallHndl.getUserReport(io, socket, request); });


  ///////////////----------------- broadcastHandler -------------------///////////////////
  /// E1
  socket.on('add-to-room', (request) => { broadcastHndl.addToRoom(io, socket, request); });
  /// E2
  socket.on('remove-from-room', (request) => { broadcastHndl.removeFromRoom(io, socket, request); });

  socket.on('updateTransaction', (request) => { console.log(request); socketHandler.subadmintransactionUpdate(io, socket, request); });

  /////////////////////--------------------- logHandler -----------------///////////////////////////
  /// F1
  // socket.on('get-minus-unmount', (request) => { logHndl.amountMinusUnmount(io, socket, request); });
  /// F2
  // socket.on('get-referal-unmount', (request) => { logHndl.amountUnmount(io, socket, request); });

  // socket.on('get-logs-filter', (request) => { logHndl.getLogsfilter(io, socket, request); });
  // socket.on('get-logs-credit', (request) => { logHndl.getLogCredit(io, socket, request); });
  // socket.on('get-logs-commision', (request) => { logHndl.getLogCommisions(io, socket, request); });
  // socket.on('get-referal-commision', (request) => { logHndl.getReferalCommisions(io, socket, request); });
  // socket.on('get-logs', (request) => { logHndl.getLogs(io, socket, request); });
  // socket.on('refresh-summary', (request) => { console.log('kk'); logHndl.refreshSummary(io, socket, request); });
  // socket.on('get-summarylog', (request) => { logHndl.getSummary(io, socket, request); });
  // socket.on('get-summary-pagination', (request) => { logHndl.summaryPagination(io, socket, request); });
  // socket.on('get-manager-commision', (request) => { logHndl.getManagerCommision(io, socket, request); });

  //////////////////////////--------- eventHandler ------------------- ////////////////////////

  // socket.on('get-sorted-event-ids', (request) => { eventHndl.getSortedEventIds(io, socket, request); });

  ///////////////------------------------- messageHandler -------------//////////////////////

  // socket.on('get-message', (request) => { messageHndl.getMessage(io, socket, request); });
  // socket.on('get-messages', (request) => { messageHndl.getMessages(io, socket, request); });
  // socket.on('create-message', (request) => { messageHndl.createMessage(io, socket, request); });
  // socket.on('update-message', (request) => { messageHndl.updateMessage(io, socket, request); });
  // socket.on('set-chat-push-message', (request) => { messageHndl.pushIndividualMessage(io, socket, request); });
  // socket.on('set-push-token', (request) => { messageHndl.setPushToken(io, socket, request); });


  ///////////////--------------------------- teenpatiHandler ---------------/////////////////////
  // socket.on('get-teen-pati-markets', (request) => { marketteenpatiHndl.getpatiMarkets(io, socket, request); });
  // socket.on('get-teen-pati-bets', (request) => { marketteenpatiHndl.getpatiBets(io, socket, request); });
  // socket.on('get-teen-pati-bets-auto', (request) => { marketteenpatiHndl.getpatiBetsAuto(io, socket, request); });
  // socket.on('get-teen-pati-results', (request) => { marketteenpatiHndl.getpatiResult(io, socket, request); });
  // socket.on('get-teenpati-summary', (request) => { marketteenpatiHndl.getManagerTeenPatiSummary(io, socket, request); });

  //spinner
  // socket.on('get-wheel-market-result', (request) => { othersportsHndl.getWheelMarketResult(io, socket, request); });
  // socket.on('get-wheel-bets', (request) => { othersportsHndl.getWheelBet(io, socket, request); });
  // socket.on('get-wheel-market-view-all', (request) => { othersportsHndl.getWheelMarketViewAll(io, socket, request); });
  // socket.on('get-wheel-bets-user', (request) => { othersportsHndl.getWheelBetUser(io, socket, request); });
  // socket.on('get-runner-wheel-profit', (request) => { othersportsHndl.getRunnerWheelProfit(io, socket, request); });
  // socket.on('get-wheel-spinner-active', (request) => { othersportsHndl.getWheelUserPermission(io, socket, request); });
  // socket.on('update-wheel-spinner', (request) => { othersportsHndl.updateWheelUserPermission(io, socket, request); });

  //sessionHandler
  // socket.on('get-sessions', (request) => { sessionHndl.getSessions(io, socket, request); });
  // socket.on('get-session-count', (request) => { sessionHndl.getSessionCount(io, socket, request); });
  // socket.on('remove-sessions', (request) => { sessionHndl.removeSessions(io, socket, request); });
  // socket.on('disconnect', () => { sessionHndl.updateSession(io, socket, { online: false }); });

  //socket.on('get-chat',          		(request) => {chatHndl.getChat(io, socket, request);});
  //socket.on('get-chat',          		(request) => {chatHndl.getChat(io, socket, request);});
  //socket.on('get-chattone',          		(request) => {chatHndl.getChatTone(io, socket, request);});
  //socket.on('get-chatstatus',          		(request) => {chatHndl.getChatStatus(io, socket, request);});
  //socket.on('chat-all-user',          		(request) => {chatHndl.ChatAllUser(io, socket, request);});
  //socket.on('create-chat',          		(request) => {chatHndl.createMessage(io, socket, request);});
  //socket.on('get-user-list',          		(request) => {chatHndl.getUserList(io, socket, request);});
  //socket.on('create-chat-forward',          		(request) => {chatHndl.createChatForward(io, socket, request);});
  //socket.on('update-chat-status',          		(request) => {chatHndl.updateChat(io, socket, request);});


});
server.listen(port, () => {
  logger.info(`Socket running on localhost:${port}`);
  console.log(`Socket running on localhost:${port}`)
});
