// required modules
var mongoose            = require('mongoose');
var logger              = require('log4js').getLogger();
var multer              = require('multer');
var Login               = mongoose.model('Login');
var User                = mongoose.model('User');
var Message             = mongoose.model('Message');
var Pushnotification    = mongoose.model('Pushnotification');

const router = require('express').Router();
const path = require('path');
var multer  =   require('multer'); 

const storage = multer.diskStorage({
    destination: function(req, file, cb) {
        cb(null, './uploads/screenshot/');
    },
   
    filename: function(req, file, cb) {
        cb(null, file.fieldname + '-' + Date.now() + path.extname(file.originalname));
    }
});
   
var upload = multer({ storage: storage, limits: { fileSize: 25 * 1024 * 1024, fieldSize: 25 * 1024 * 1024 } })

var rootHndl =   require('./casinotransfer.js');
var gameHndl =   require('./game-all.js');
const userHandler = require('../controller/userController');


////////------ Casino App Apis ---------/////////////
router.post('/api/loginOtp', upload.none(), userHandler.loginOtp);
router.get('/api/HomeGames', rootHndl.HomeGames);
router.post('/api/providerGames', gameHndl.providerGames);
router.post('/api/singleGame', gameHndl.singleGame);
// router.get('/api/HomeGames', gameHndl.HomeGames);


//////----Qtech EndPoints------/////
router.get('/accounts/:playerId/session', rootHndl.verifySession);
router.get('/accounts/:playerId/balance', rootHndl.ngetBalance);
router.post('/transactions/rollback', rootHndl.rollback);
router.post('/bonus/reward', rootHndl.reward);
router.post('/transactions', rootHndl.transactions);

////////// ------ Lotus (Poker)------////////
router.post('/api/poker/auth/', rootHndl.pokerAuth);
router.post('/api/poker/exposure/', rootHndl.pokerExposure);
router.post('/api/poker/results/', rootHndl.pokerResults);
router.post('/api/poker/refund/', rootHndl.pokerRefund);

/////////--------User Api--------------//////////
router.post('/api/updateButton', rootHndl.updateButton);
router.post('/api/getStackButton', rootHndl.getStackButton);

// router.post('/api/createManager', rootHndl.createManager);
// router.post('/api/getMarketBet', rootHndl.getMarketBet);
// router.post('/api/getCasinoReport', rootHndl.getCasinoReport);
// router.post('/api/createMatchVideo', rootHndl.createMatchVideo);
// router.post('/api/getuserbalance', rootHndl.getuserbalance);
// router.post('/api/getlogbalance', rootHndl.getlogbalance);
// router.post('/api/createUser', rootHndl.createUser);
// router.post('/api/getAllUser', rootHndl.getAllUser);
/*router.post('/api/getCasinolink/', rootHndl.getCasinoUrl);
router.post('/api/get-history', rootHndl.getHistory);

router.post('/api/casino-balance-withdraw', rootHndl.balanceWithdraw);
router.post('/api/casino-balance-transfer', rootHndl.balanceDeposit);

router.post('/api/casinowallet', rootHndl.getWallet);

router.post('/api/getCasino', rootHndl.casinoLink);*/
// router.get('/api/apiurl/:market', rootHndl.getAppUrl);
// router.get('/api/getCasinolinkapp/:username/:gameId', rootHndl.getCasinoUrlapp);
// router.get('/api/get-historyapp/:username', rootHndl.getHistoryapp);
// router.get('/api/get-market/:eventId', rootHndl.getMarket);
// router.get('/api/getVirtualCricket', rootHndl.getVirtualCricket);
// router.post('/api/getMatchVideo', rootHndl.getMatchVideo);

// router.get('/api/casino-balance-withdrawapp/:username/:balance', rootHndl.balanceWithdrawapp);
// router.get('/api/casino-balance-transferapp/:username/:balance', rootHndl.balanceDepositapp);

// router.get('/api/casinowalletapp/:username', rootHndl.getWalletapp);

// router.get('/api/gamedetails/:roundId', rootHndl.gamedetails);

// router.get('/api/getCasinoapp/:username', rootHndl.casinoLinkapp);

// router.post('/api/verifytoken', rootHndl.verifytoken);
// router.post('/api/verifylogin', rootHndl.verifylogin);
//api for wallet
// router.get('/api/balance/:username', rootHndl.getBalance);
// router.post('/api/updatedeposit', rootHndl.updateDeposit);
// router.post('/api/updatewithdraw', rootHndl.updateWithdraw);


module.exports = router ;