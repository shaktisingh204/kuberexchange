var express             = 	require('express');
var device              =   require('express-device');
var http                =   require('http');
var cors                = 	require('cors');
var path                = 	require('path');
var mongoose            = 	require('mongoose');
var logger              = 	require('log4js').getLogger();

var db                  =   require('./madara/models/db');

var userHndl            =   require('./madara/handlers/user');
var sessionHndl         =   require('./madara/handlers/session');
var eventHndl           =   require('./madara/handlers/event');
var marketHndl          =   require('./madara/handlers/market');
var betHndl          		=   require('./madara/handlers/bet');
var broadcastHndl       =   require('./madara/handlers/broadcast');
var messageHndl         =   require('./madara/handlers/message');
var logHndl         		=   require('./madara/handlers/log');
var marketteenpatiHndl  =   require('./madara/handlers/teenpatimarket');
var gameallHndl  =   require('./madara/handlers/game-all');
var othersportsHndl  =   require('./madara/handlers/othersports');

var chatHndl            =   require('./madara/handlers/chat');
var port                =   8191;
var app                 =   express();

app.use(device.capture());
app.use(cors());
app.use(express.static(path.join(__dirname, 'orochimaru')));
app.set('port', port);
app.get('*', function(req, res){res.send('<h1>Hello world Manager</h1>');});

var server              =   http.createServer(app);
var socketIO           	=   require('socket.io')(server, {path: '/Dcd7pwimDyfKiPvTadgGH/socket.io'});
var userSocket          =   require('socket.io-client')('http://localhost:3003', {transports: ["websocket"], path: '/Dcd7pwimDyfKiPvTAAAh/socket.io'});
var adminSocket       	=   require('socket.io-client')('http://localhost:3000', {transports: ["websocket"], path: '/RVeDr66xWzOVLhV5AABI/socket.io'});
logger.level            =   'error';
var io 									= 	{self:socketIO, user:userSocket, admin:adminSocket};

// Market Pulse
setInterval(function(){broadcastHndl.marketPulse(io);broadcastHndl.wheelMarketPulse(io,'manager','manager');}, 10000);
//setInterval(function(){broadcastHndl.chatsuccess(io);},resultteenpatPulse 6000);marketteenpatPulse
//setInterval(function(){broadcastHndl.homePulse(io);broadcastHndl.resultteenpatPulse(io)}, 6000);
//setInterval(function(){broadcastHndl.marketOneDayPulse(io);broadcastHndl.wheelMarketPulse(io,'manager','manager');}, 1000); 

// User requests
io.self.on('connection', function(socket){
	//setInterval(function(){broadcastHndl.marketteenpatPulse(socket);}, 1000);
	socket.emit('get-login-status', {'socket.id':socket.id});
	socket.on('RVeDr66xWzOVLhV5AABIDcd7pwimDyfKiPvTAAAh5b52ccd84fa96dd59b65e54f', 		(request) => {
		logger.info("local communication: "+JSON.stringify(request));
		if(!request) return;
		if(!request.socket || !request.emitString) return;
		io.self.to(request.socket).emit(request.emitString, request.emitData);
	});

    socket.on('login',                (request) => {userHndl.login(io, socket, request);});
	socket.on('logout',               (request) => {userHndl.logout(io, socket, request);});
	socket.on('login-status',         (request) => {userHndl.loginStatus(io, socket, request, {role:'manager', role2:'partner'})});

	socket.on('get-tv-api',          (request) => {userHndl.getTvs(io, socket, request);}); 
	socket.on('get-omarkets',          (request) => {marketHndl.getoMarkets(io, socket, request);});

	socket.on('create-user',          (request) => {userHndl.createUser(io, socket, request);});
    socket.on('get-manager-balance',(request) => {userHndl.getBalance(io, socket, request);});
    socket.on('get-user',             (request) => {userHndl.getUser(io, socket, request);});
	socket.on('get-users',            (request) => {userHndl.getUsers(io, socket, request);});

	socket.on('get-history', (request) => {
    gameallHndl.getHistory(io, socket, request);
  });

	socket.on('get-chatusers',            (request) => {userHndl.getChatUsers(io, socket, request);});
    socket.on('update-user',          (request) => {userHndl.updateUser(io, socket, request);});
    socket.on('update-user-status',          (request) => {userHndl.updateUserStatus(io, socket, request);});
	socket.on('update-user-balance',  (request) => {userHndl.updateUserBalance(io, socket, request);});
	socket.on('update-password',      (request) => {userHndl.updatePassword(io, socket, request);});
	socket.on('delete-user',          (request) => {userHndl.deleteUser(io, socket, request);});
	socket.on('update-match-fees',    (request) => {userHndl.updateMatchFees(io, socket, request);});

	socket.on('update-credit',    (request) => {userHndl.updateCredit(io, socket, request);});
	socket.on('get-user-balance',    (request) => {userHndl.getUserBalance(io, socket, request);});

	socket.on('update-sharing',    (request) => {userHndl.updateShare(io, socket, request);});
   socket.on('get-market-summary',          (request) => {marketHndl.getMarketSummary(io, socket, request);});
	socket.on('update-match-commision',    (request) => {userHndl.updateMatchCommisions(io, socket, request);});
	socket.on('update-referal',    (request) => {userHndl.updateReferal(io, socket, request);});
 socket.on('user-report',      (request) => {userHndl.userReport(io, socket, request);});

	 socket.on('update-whatsapp',          (request) => {userHndl.updatewhatsapp(io, socket, request);});
	 socket.on('update-telegram',          (request) => {userHndl.updatetelegram(io, socket, request);});

	socket.on('get-withdraw',    (request) => {userHndl.getFinance(io, socket, request);});
	socket.on('update-withdraw',    (request) => {userHndl.updateWithdraw(io, socket, request);});

	socket.on('get-sessions',         (request) => {sessionHndl.getSessions(io, socket, request);});
  socket.on('get-session-count',    (request) => {sessionHndl.getSessionCount(io, socket, request);});
  socket.on('remove-sessions',      (request) => {sessionHndl.removeSessions(io, socket, request);});

	socket.on('get-sorted-event-ids', (request) => {eventHndl.getSortedEventIds(io, socket, request);});

	socket.on('get-markets',          (request) => {marketHndl.getMarkets(io, socket, request);});
    
    socket.on('get-openmarkets',          (request) => {marketHndl.getopenMarkets(io, socket, request);});

	socket.on('get-markethomes',          (request) => {marketHndl.getMarketHomes(io, socket, request);});
	socket.on('get-summary',          (request) => {marketHndl.getManagerSummary(io, socket, request);});
	 socket.on('get-summary-filter',          (request) => {marketHndl.getManagerSummaryfilter(io, socket, request);});
	socket.on('update-market',        (request) => {marketHndl.updateMarket(io, socket, request);});
	socket.on('get-match-fees-profit',(request) => {marketHndl.getMatchFeesProfit(io, socket, request);});

	socket.on('get-bets',             (request) => {betHndl.getBets(io, socket, request);});
	socket.on('delete-bet',           (request) => {betHndl.deleteBet(io, socket, request);});
	socket.on('get-runner-profit', 		(request) => {betHndl.getRunnerProfit(io, socket, request);});
	socket.on('refresh-balance',      (request) => {betHndl.refreshBalance(io, socket, request);});

	socket.on('getuser-profitloss',      (request) => {betHndl.getuserProfitLossSummary(io, socket, request);});
	socket.on('getuser-filterprofitloss',      (request) => {betHndl.getuserFilterProfitLossSummary(io, socket, request);});

  socket.on('add-to-room',          (request) => {broadcastHndl.addToRoom(io, socket, request);});
  socket.on('remove-from-room',     (request) => {broadcastHndl.removeFromRoom(io, socket, request);});

	socket.on('get-message',          (request) => {messageHndl.getMessage(io, socket, request);});
  socket.on('get-messages',         (request) => {messageHndl.getMessages(io, socket, request);});
  socket.on('create-message',       (request) => {messageHndl.createMessage(io, socket, request);});
  socket.on('update-message',       (request) => {messageHndl.updateMessage(io, socket, request);});
  socket.on('get-logs-filter',             (request) => {logHndl.getLogsfilter(io, socket, request);});

 socket.on('get-logs-credit',             (request) => {logHndl.getLogCredit(io, socket, request);});

  socket.on('set-chat-push-message',       (request) => {messageHndl.pushIndividualMessage(io, socket, request);});
  socket.on('set-push-token',       (request) => {messageHndl.setPushToken(io, socket, request);});
  //teenpati

  socket.on('get-teen-pati-markets',             (request) => {marketteenpatiHndl.getpatiMarkets(io, socket, request);});
  socket.on('get-teen-pati-bets',             (request) => {marketteenpatiHndl.getpatiBets(io, socket, request);});
  socket.on('get-teen-pati-bets-auto',             (request) => {marketteenpatiHndl.getpatiBetsAuto(io, socket, request);});
  socket.on('get-teen-pati-results',             (request) => {marketteenpatiHndl.getpatiResult(io, socket, request);});
  socket.on('get-teenpati-summary',          (request) => {marketteenpatiHndl.getManagerTeenPatiSummary(io, socket, request);});

  //spinner

  socket.on('get-wheel-market-result',             (request) => {othersportsHndl.getWheelMarketResult(io, socket, request);});
  socket.on('get-wheel-bets',             (request) => {othersportsHndl.getWheelBet(io, socket, request);});
  socket.on('get-wheel-market-view-all',             (request) => {othersportsHndl.getWheelMarketViewAll(io, socket, request);});
  socket.on('get-wheel-bets-user',             (request) => {othersportsHndl.getWheelBetUser(io, socket, request);});
  socket.on('get-runner-wheel-profit', 		(request) => {othersportsHndl.getRunnerWheelProfit(io, socket, request);});
  socket.on('get-wheel-spinner-active', 		(request) => {othersportsHndl.getWheelUserPermission(io, socket, request);});
  socket.on('update-wheel-spinner', 		(request) => {othersportsHndl.updateWheelUserPermission(io, socket, request);});

  socket.on('get-market-analasis',       (request) => {marketHndl.getMarketAnalasis(io, socket, request);});

   socket.on('get-marketLine',       (request) => {marketHndl.getMarketLine(io, socket, request);});
   socket.on('get-market-fancy',       (request) => {marketHndl.getMarketFancy(io, socket, request);});
   socket.on('update-market-line',       (request) => {marketHndl.updateMarketLine(io, socket, request);});
   socket.on('update-userline',       (request) => {marketHndl.userLine(io, socket, request);});

   socket.on('get-game-report',             (request) => {gameallHndl.gameReport(io, socket, request);});
   socket.on('get-user-report',             (request) => {gameallHndl.getUserReport(io, socket, request);});
   socket.on('get-logs-commision',          		(request) => {logHndl.getLogCommisions(io, socket, request);});

   socket.on('get-referal-commision',          		(request) => {logHndl.getReferalCommisions(io, socket, request);});

	socket.on('get-logs',          		(request) => {logHndl.getLogs(io, socket, request);});

     socket.on('get-summarylog',             (request) => {logHndl.getSummary(io, socket, request);});
   socket.on('get-summary-pagination',             (request) => {logHndl.summaryPagination(io, socket, request);});

    socket.on('get-manager-commision',          		(request) => {logHndl.getManagerCommision(io, socket, request);});

	//socket.on('get-chat',          		(request) => {chatHndl.getChat(io, socket, request);});

	//socket.on('get-chat',          		(request) => {chatHndl.getChat(io, socket, request);});
	//socket.on('get-chattone',          		(request) => {chatHndl.getChatTone(io, socket, request);});

    //socket.on('get-chatstatus',          		(request) => {chatHndl.getChatStatus(io, socket, request);});

    //socket.on('chat-all-user',          		(request) => {chatHndl.ChatAllUser(io, socket, request);});

	//socket.on('create-chat',          		(request) => {chatHndl.createMessage(io, socket, request);});
	//socket.on('get-user-list',          		(request) => {chatHndl.getUserList(io, socket, request);});
		//socket.on('create-chat-forward',          		(request) => {chatHndl.createChatForward(io, socket, request);});

		//socket.on('update-chat-status',          		(request) => {chatHndl.updateChat(io, socket, request);});

  socket.on('disconnect',           ()        => {sessionHndl.updateSession(io, socket, {online:false});});

});
server.listen(port, () => {logger.info(`API running on localhost:${port}`);});
