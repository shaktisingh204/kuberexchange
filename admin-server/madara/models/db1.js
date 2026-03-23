var mongoose  =   require('mongoose');
var logger    = 	require('log4js').getLogger();

const options = {
  poolSize: 20,
  useNewUrlParser: true
};
mongoose.connect('mongodb://178.62.12.13:27017/akatsuki', options);
var db = mongoose.connection;

// CONNECTION EVENTS
db.on('connected', function() {
  logger.info('Mongoose connected to mongodb://178.62.12.13:27017/akatsuki');
});
db.on('error', function(err) {
  logger.error('Mongoose connection error: ' + err);
});
db.on('disconnected', function() {
  logger.info('Mongoose disconnected');
});

// BRING IN YOUR SCHEMAS & MODELS
require('./login');
require('./user');
require('./session');
require('./room');
require('./log');
require('./eventType');
require('./competition');
require('./event');
require('./market');
require('./score');
require('./ledger');
require('./bet');
require('./message');

require('./wheel');
require('./othermarket');
require('./wheelstatus');

require('./marketteenpati');
require('./teenpatiResult');

// require('./account');
// require('./config');
//
