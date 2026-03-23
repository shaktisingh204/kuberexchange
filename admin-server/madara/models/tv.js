var mongoose 	= require('mongoose');
var Schema 		= mongoose.Schema;

module.exports = mongoose.model('tv', {
        name : {type : String},
        id : {type : String},
        data:Array,
        t20 : {type : String},
        tone : {type : String},
        virtualCricket : {type : String},
        iplCricket : {type : String},
        token : {type : String},
       
});
