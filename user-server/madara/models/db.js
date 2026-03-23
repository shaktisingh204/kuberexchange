var mongoose  =   require('mongoose');
var logger    = 	require('log4js').getLogger();
const fs = require('fs');

const options = {
  poolSize: 200,
  useNewUrlParser: true,
  useUnifiedTopology: true,
  useFindAndModify : false,
  useCreateIndex: true,
};

try
{
  var privateKey = fs.readFileSync(__dirname + '/ca-certificate.crt', 'utf8');
// mongoose.connect('mongodb+srv://doadmin:l35hI9p61VNQ8J27@db-mongodb-lon1-22743-ecbe8edf.mongo.ondigitalocean.com/admin?tls=true&authSource=admin', options);
// mongoose.connect('mongodb+srv://doadmin:94i6NZB3q02tO58H@db-mongodb-blr1-32194-d21cf5a0.mongo.ondigitalocean.com/admin?tls=true&authSource=admin', options);
// mongoose.connect('mongodb+srv://doadmin:l8769hAOf0c21Ks4@diamond444-db-12e8e1c6.mongo.ondigitalocean.com/admin?tls=true&authSource=admin&replicaSet=diamond444-db', options);
// mongoose.connect('mongodb+srv://doadmin:3uV7y48HR0p2F9b5@diamond222-prod-ca25cbef.mongo.ondigitalocean.com/admin?tls=true&authSource=admin', options);
// mongoose.connect(process.env.DB, options);
// var db = mongoose.connection;
if(process.env.DB){
  mongoose.connect(process.env.DB, options);
}else{
  mongoose.connect('mongodb+srv://doadmin:2L0J9T4oZ5r3BG81@staging-mongo-349c2e6b.mongo.ondigitalocean.com/admin?authSource=admin&tls=true', options);
}



var db = mongoose.connection;  
}
catch(e)
{
	console.log('errr')
	console.log(e)
}


// CONNECTION EVENTS
db.on('connected', function() {
  logger.info('Mongoose connected to mongodb://178.62.12.13:27017/akatsuki');
  console.log("Mongo connected User");
});
db.on('error', function(err) {
  logger.error('Mongoose connection error: ' + err);
  console.log(err)
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
require('./setting');
require('./banner');

require('./wheel');
require('./othermarket');
require('./wheelstatus');

require('./marketteenpati');
require('./teenpatiResult');
require('./wheelpermission');
require('./Finance');
require('./lock');
require('./casinotrans');
require('./stack');
require('./chat');
require('./information');
require('./summary');
require('./pushnotificatioToken');
require('./playerbattleEvent');
require('./webtoken');
require('./logsettlement');
require('./CricketVideo');
require('./VideoTeam.js');
// require('./account');
// require('./config');
//
