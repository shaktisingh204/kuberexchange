var mongoose  =   require('mongoose');
var logger    = 	require('log4js').getLogger();
require("dotenv").config();
const fs = require('fs');
const options = {
  poolSize: 20,
  useNewUrlParser: true,
  useUnifiedTopology: true,
  useFindAndModify : false,
  useCreateIndex: true,
};

try
{
  var privateKey = fs.readFileSync(__dirname + '/ca-certificate.crt', 'utf8');
// mongoose.connect('mongodb+srv://Rahul:mCCgLapFDUVSGoQG@etherapy.ac12h.mongodb.net/eTherapy?w=majority', options);
// mongoose.connect('mongodb://localhost:27017/crickakatsuki', options);
// mongoose.connect('mongodb://crickakatsuki:CrI989ui8879jjh@167.99.86.239:27017/crickakatsuki', options);     
// mongoose.connect('mongodb+srv://doadmin:l35hI9p61VNQ8J27@db-mongodb-lon1-22743-ecbe8edf.mongo.ondigitalocean.com/admin?tls=true&authSource=admin', options);
// mongoose.connect('mongodb+srv://doadmin:L580Ei7fjC619qy3@billionstaging-6d3067d5.mongo.ondigitalocean.com/admin?tls=true&authSource=admin&replicaSet=billionstaging', options);
// if(process.env.DB){
//   mongoose.connect(process.env.DB, options);
// }else{
//   mongoose.connect('mongodb+srv://doadmin:2L0J9T4oZ5r3BG81@staging-mongo-349c2e6b.mongo.ondigitalocean.com/admin?authSource=admin&tls=true', options);
// }

if(process.env.DATABASE){
  mongoose.connect(process.env.DATABASE, options);
}else{
  mongoose.connect('mongodb+srv://skypanel777:q5PZpa1dHxMwK7bp@skypenal.xgo7tf.mongodb.net/', options);
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
  logger.info('Mongoose connected to mongodb://localhost:27017/billion');
  console.log("Mongo connected admin");
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
require('./lock');
require('./score');
require('./CrickData');
require('./ledger');
require('./bet');
require('./message');
require('./bonus');
require('./banner');

require('./wheel');
require('./setting');
require('./othermarket');
require('./wheelstatus');
require('./casinotrans');
require('./marketteenpati');
require('./teenpatiResult');
require('./wheelpermission');
require('./Finance');
require('./chat');
require('./information');
require('./summary');
require('./pushnotificatioToken');
require('./playerbattleEvent');
require('./webtoken');
require('./logsettlement');
require('./logMinus');
require('./CricketVideo');
require('./VideoTeam');
// require('./account');
// require('./config');
//
