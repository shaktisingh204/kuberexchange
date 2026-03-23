// required modules
var mongoose            = require('mongoose');
var logger              = require('log4js').getLogger();
var multer              = require('multer');
var Login               = mongoose.model('Login');
var User                = mongoose.model('User');
var Message             = mongoose.model('Message');
var Pushnotification             = mongoose.model('Pushnotification');

const router = require('express').Router();
var rootHndl =   require('./statement.js');


// router.get('/accounts/:playerId/session?gameId=:gameId', rootHndl.verifySession);
router.get('/api/getCasinolink/:username/:gameId', rootHndl.getCasinoUrl);
router.get('/api/get-history/:username', rootHndl.getHistory);

router.get('/api/casino-balance-withdraw/:username/:balance', rootHndl.balanceWithdraw);
router.get('/api/casino-balance-transfer/:username/:balance', rootHndl.balanceDeposit);

router.get('/api/casinowallet/:username', rootHndl.getWallet);

router.get('/api/getCasino/:username', rootHndl.casinoLink);


module.exports = router ;