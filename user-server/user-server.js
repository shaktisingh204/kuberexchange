// @file    user.js
// @brief   This file is the entry point for all the requests from user app.
//          All the socket requests will be handled here.
require("dotenv").config({
  path: __dirname + "/.env",
});

var db = require('./madara/models/db'); // DB config module
const Helper = require("./madara/controller/helper"); // Helper
const fs = require('fs');
var express = require('express');
var device = require('express-device');
// var http = require('https');
var http = require('http');
var cors = require('cors'); // For cross origin device access
var path = require('path');
var mongoose = require('mongoose');
var multer = require('multer');
var request = require('request');
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

var bodyParser = require('body-parser');

////// ----- Used Controller ------/////
var userHndl = require('./madara/controller/userController');
var sessionHndl = require('./madara/controller/session');
var marketHndl = require('./madara/controller/market');
var betHndl = require('./madara/controller/bet');
var broadcastHndl = require('./madara/controller/broadcast');
var messageHndl = require('./madara/controller/message');
var logHndl = require('./madara/controller/log');
var gameallHndl = require('./madara/controller/game-all');

////// ----- Used Model ----- //////
var Market = mongoose.model('Market');

var port = 3099; // Port used for user server
var app = express();
var privateKey = fs.readFileSync(__dirname + '/api.paisaexch.key', 'utf8');
var certificate = fs.readFileSync(__dirname + '/api.paisaexch.crt', 'utf8');

app.use(device.capture());
app.use(cors());
app.use(express.json());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
// app.use(bodyParser.json());
// app.use(bodyParser.urlencoded({ extended: false }));



////////////-------- Casino App Apis Routes -------////////////
// var byHndl =   require('./madara/routes/marketHandler');
const userRoutes = require('./madara/routes/userRoute');
app.use('/', userRoutes);

var dir = path.join(__dirname, 'uploads');
app.use(express.static(dir));
app.set('port', port);
app.get('*', function (req, res) {
  res.send('<h1>Hello world User Server</h1>');
});

var server = http.createServer({
  key: privateKey,
  cert: certificate
}, app);
// var io            =   require('socket.io')(server, {path: '/socket.io'});    // socket.io path. The same path will be used on client side.
// var adminSocket         =   require('socket.io-client')('http://localhost:3000', {transports: ["websocket"], path: '/RVeDr66xWzOVLhV5AABI/socket.io'});
// var managerSocket       =   require('socket.io-client')('http://localhost:3001', {transports: ["websocket"], path: '/5b52ccd84fa96dd59b65e54f/socket.io'});
// var io                  =   {self:socketIO, admin:adminSocket, manager:managerSocket};
const io = require('socket.io')(server, {
  transports: ['polling'],
  cors: {
    origin: "http://localhost:4200",
    methods: ["GET", "POST"],
    credentials: true,
    allowEIO3: true
  }
});
logger.level = 'error';

// @brief   Broadcast functions
// @note    There will be no request for market/multi market rate update from user side.
//          Server will send the updated rate per second to all the connected users based on
//          the active page of user.
setInterval(function () {
  broadcastHndl.eventPulse(io);
}, 500);
setInterval(function () {
  broadcastHndl.virtualMarketPulse(io);
}, 1000);
var connectionCount = 0;
// User socket requests
   console.log("socket connectting.......");
   console.log("IO",io);
io.on('connection', function (socket) {
   console.log("socket connected");
  connectionCount += 1;
//   logger.error("new connection: " + connectionCount);
  socket.on('RVeDr66xWzOVLhV5AABIDcd7pwimDyfKiPvTAAAh5b52ccd84fa96dd59b65e54f', (request) => {
    // logger.info("local communication: " + JSON.stringify(request));
    if (!request) return;
    if (!request.socket || !request.emitString) return;
    io.to(request.socket).emit(request.emitString, request.emitData);
  });

  // Login and account related requests
  socket.on('login', (request) => { userHndl.login(io, socket, request); });
  socket.on('get-home-markets', (request) => { marketHndl.getHomeMarkets(io, socket, request); });
  socket.on('get-inplay-markets', (request) => { marketHndl.getInPLayMarkets(io, socket, request); });
  socket.on('get-marketbyid', (request) => { marketHndl.getMarketById(io, socket, request); });
  socket.on('get-message', (request) => { messageHndl.getMessages(io, socket, request); });
  socket.on('add-to-room', (request) => { broadcastHndl.addToRoom(io, socket, request); });
  socket.on('remove-from-room', (request) => { broadcastHndl.removeFromRoom(io, socket, request); });
  socket.on('add-to-room-virtual', (request) => { broadcastHndl.addToVirtualRoom(io, socket, request); });
  socket.on('remove-from-room-virtual', (request) => { broadcastHndl.removeFromVirtualRoom(io, socket, request); });
  socket.on('get-free-home-markets', (request) => { marketHndl.getFreeHomeMarkets(io, socket, request); });
  socket.on('get-free-home-allmarkets', (request) => { marketHndl.getFreeHomeAllMarkets(io, socket, request); });
  socket.on('get-bets', (request) => { betHndl.getBets(io, socket, request); });
  socket.on('get-bet-markets', (request) => { marketHndl.betMarkets(io, socket, request); });
  socket.on('create-bet', (request) => {
    console.log("create bet socket", request);
    // Market.findOne({
    //   marketId: request.bet.marketId
    // }, { marketType: 1 }, function (err, market) {
    //   if (err) logger.error(err);
    //   if (market) {
    if (request.bet.marketType == 'SESSION') {
      // setTimeout(function () {
      betHndl.matchFees(io, socket, request);
      // }, 100);
    }
    else if (request.bet.marketType == 'Special') {
      // setTimeout(function () {
      betHndl.matchFees(io, socket, request);
      // }, 100);
    }
    else {
      setTimeout(function () {
        betHndl.matchFees(io, socket, request);
      }, 100);
    }
    // } else {
    //   return;
    // }
    // });
  });
  socket.on('get-runner-profit', (request) => { betHndl.getRunnerProfit(io, socket, request); });
  socket.on('password-changed', (request) => { userHndl.updatePasswordchanged(io, socket, request); });
  socket.on('get-logs', (request) => { logHndl.getLogs(io, socket, request); });


  // socket.on('get-game-all', (request) => { gameallHndl.allGames(io, socket, request); }); // Deprecated Make Api ProvidersGames
  // socket.on('get-user', (request) => { userHndl.getUser(io, socket, request); }); // Deprecated Make Api getuserDetails
  // socket.on('get-game-one', (request) => { gameallHndl.gameLinkOne(io, socket, request);});






  socket.on('loginwithotp', (request) => { userHndl.loginWithOtp(io, socket, request); });
  socket.on('createuser', (request) => { userHndl.createUser(io, socket, request); });
  socket.on('registerwithotp', (request) => { userHndl.RegisterWithOtp(io, socket, request); });
  socket.on('createusernew', (request) => { userHndl.createUserNew(io, socket, request); });
  // socket.on('loginverify', (request) => { userHndl.loginverify(io, socket, request); });
  // socket.on('logout', (request) => { userHndl.logout(io, socket, request); });
  // socket.on('login-status', (request) => { userHndl.loginStatus(io, socket, request, { role: 'user' }); });
  // socket.emit('get-login-status', {'socket.id': socket.id });

  // loginOtp and VerifyOtp
  // socket.on('login-otp', (request) => {userHndl.loginOtp(io, socket, request); });

  // socket.on('login-verify-otp', (request) => { userHndl.verifyloginOtp(io, socket, request); });



  // socket.on('get-user-permission', (request) => { userHndl.getUserPermission(io, socket, request);});
  // socket.on('update-password', (request) => { userHndl.updatePassword(io, socket, request); });

  // socket.on('update-user', (request) => {  userHndl.updateUser(io, socket, request);});
  // socket.on('get-tv-api', (request) => {  userHndl.getTvs(io, socket, request);});

  // socket.on('get-match-video', (request) => { userHndl.getMatchVideo(io, socket, request); });

  // socket.on('get-virtual-video', (request) => { userHndl.getVirtualCricket(io, socket, request); });

  // // Events related requests


  // socket.on('get-events', (request) => {
  //   eventHndl.getEvents(io, socket, request);
  // });

  // socket.on('get-playerevents', (request) => {
  //   eventHndl.getPlayerEvents(io, socket, request);
  // });

  // socket.on('get-sorted-event-ids', (request) => {
  //   eventHndl.getSortedEventIds(io, socket, request);
  // });

  // // Market related requests
  // socket.on('get-dashboard-markets', (request) => {
  //   marketHndl.getDashboardMarkets(io, socket, request);
  // });





  // socket.on('get-home-markets', Helper.verifyToken, (request) => {
  //   jwt.verify(request.token, myEnv.parsed.SECRET, (err, authData) => {
  //     if (err) {
  //       res.sendStatus(403);
  //     } else {
  //       marketHndl.getHomeMarkets(io, socket, request);
  //     }
  //   });
  // });





  // socket.on('get-free-inplay-markets', (request) => {
  //   marketHndl.getFreeInPLayMarkets(io, socket, request);
  // });


  // socket.on('get-market', (request) => {
  //   marketHndl.getMarket(io, socket, request);
  // });

  // socket.on('get-tvurl', (request) => {
  //   marketHndl.getTvUrl(io, socket, request);
  // });

  // socket.on('get-streamscore', (request) => {
  //   marketHndl.getStreamScore(io, socket, request);
  // });

  // socket.on('get-sportbook-markets', (request) => {
  //   marketHndl.getSportBookMarkets(io, socket, request);
  // });



  // //Score Tennis 
  // socket.on('get-score-tennis', (request) => {
  //   scorebroadcastHndl.getScores(io, socket, request);
  // });
  // // Bet related requests


  // socket.on('user-fee', (request) => {
  //   betHndl.userFees(io, socket, request);
  // });
  // socket.on('delete-bet', (request) => {
  //   betHndl.deleteBet(io, socket, request);
  // });
  socket.on('refresh-balance', (request) => { betHndl.refreshBalance(io, socket, request); });
  // socket.on('create-playerbet', (request) => {
  //   setTimeout(function () {
  //     betHndl.createPlayerbattleBet(io, socket, request);
  //   }, 2000);
  // }); 




  // socket.on('create-bet-2', (request) => {


  //   Market.findOne({
  //     marketId: request.bet.marketId
  //   }, function (err, market) {
  //     if (err) logger.error(err);
  //     if (!market) return;

  //     if (market.marketType == 'wheelSpiner' || market.marketType == 'Teenpati') betHndl.refreshBalance(io, socket, request);
  //     setTimeout(function () {
  //       othersportsHndl.createBet2(io, socket, request);
  //     }, 2000);

  //   });
  // });
  // // Adding/Removing from broadcast list



  // // Message related requests


  // socket.on('set-push-token', (request) => {
  //   messageHndl.setPushToken(io, socket, request);
  // });

  // // Logs related requests


  // //Teenpati 
  // socket.on('get-teen-pati-markets', (request) => {
  //   marketteenpatiHndl.getpatiMarkets(io, socket, request);
  // });
  // socket.on('get-teen-pati-market', (request) => {
  //   marketteenpatiHndl.getpatiMarket(io, socket, request);
  // });
  // socket.on('get-teen-pati-results', (request) => {
  //   marketteenpatiHndl.getpatiResult(io, socket, request);
  // });
  // socket.on('get-teen-pati-bets', (request) => {
  //   marketteenpatiHndl.getpatiBets(io, socket, request);
  // });

  // //spinner
  // socket.on('get-settlement', (request) => {
  //   logHndl.getsettlment(io, socket, request);
  // });
  // socket.on('update-amount', (request) => {
  //   logHndl.updateAmount(io, socket, request);
  // });

  // //wheel spinner
  // socket.on('get-wheel-spinner', (request) => {
  //   othersportsHndl.getWheelSpinner(io, socket, request);
  // });
  // socket.on('get-wheel-market', (request) => {
  //   othersportsHndl.getWheelMarket(io, socket, request);
  // });
  // socket.on('get-wheel-bets-user', (request) => {
  //   othersportsHndl.getWheelBetUser(io, socket, request);
  // });
  // socket.on('get-wheel-bets', (request) => {
  //   othersportsHndl.getWheelBet(io, socket, request);
  // });
  // socket.on('get-wheel-market-result', (request) => {
  //   othersportsHndl.getWheelMarketResult(io, socket, request);
  // });
  // socket.on('refresh-balance-other-market', (request) => {
  //   othersportsHndl.refreshBalance(io, socket, request);
  // });
  // socket.on('get-user-refesh', (request) => {
  //   userHndl.getReheshUser(io, socket, request);
  // });

  // socket.on('set-view', (request) => {
  //   othersportsHndl.setView(io, socket, request);
  // });

  // socket.on('get-wheel-market-view-all', (request) => {
  //   othersportsHndl.getWheelMarketViewAll(io, socket, request);
  // });
  // socket.on('get-wheel-count-timer', (request) => {
  //   othersportsHndl.getWheelCountTimer(io, socket, request);
  // });

  socket.on('get-game-all', (request) => { gameallHndl.allGames(io, socket, request); });
  socket.on('get-home-game', (request) => { gameallHndl.homeGames(io, socket, request); });

  // socket.on('get-game-status', (request) => {
  //   gameallHndl.gameLink(io, socket, request);
  // });


  // socket.on('get-balance-transfer', (request) => {
  //   gameallHndl.balanceTransfer(io, socket, request);
  //   // console.log("balance transfer")
  // });

  // socket.on('get-balance-withdraw', (request) => {
  //   gameallHndl.balanceWithdraw(io, socket, request);
  // });

  socket.on('get-userbalance', (request) => { gameallHndl.getbalance(io, socket, request); });

  // socket.on('update-balance', (request) => {
  //   gameallHndl.updateBalance(io, socket, request);
  // });

  // socket.on('get-history', (request) => {
  //   gameallHndl.getHistory(io, socket, request);
  // });

  // socket.on('get-report', (request) => {
  //   gameallHndl.gameNpreport(io, socket, request);
  // });


  // socket.on('get-manager', (request) => {
  //   userHndl.getManager(io, socket, request);
  // });
  // socket.on('add-finance', (request) => {
  //   userHndl.addFinance(io, socket, request);
  // });
  // socket.on('get-finance', (request) => {
  //   userHndl.getFinance(io, socket, request);
  // });


  //socket.on('get-chat',             (request) => {chatHndl.getChat(io, socket, request);});
  //socket.on('get-chats',             (request) => {chatHndl.getChats(io, socket, request);});
  //socket.on('get-chatstatus',             (request) => {chatHndl.getChatStatus(io, socket, request);});
  //socket.on('create-chat',              (request) => {chatHndl.createMessage(io, socket, request);});
  //socket.on('user-information',              (request) => {chatHndl.userInformation(io, socket, request);});
  //socket.on('update-chat-status',             (request) => {chatHndl.updateChat(io, socket, request);});


  //virtual cricket

   socket.on('get-virtual-result', (request) => {
      marketHndl.getVirtualResult(io, socket, request);
    });


  // Session related requests
  socket.on('disconnect', () => {
    connectionCount -= 1;
    sessionHndl.updateSession(io, socket, {
      online: false
    });
  });

});
server.prependListener("request", (req, res) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
});
server.listen(port, () => {
  console.log(`User API running on localhost:${port}`);
  logger.info(`User API running on localhost:${port}`);
});
