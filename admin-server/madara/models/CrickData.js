const mongoose = require('mongoose');

const crickdataSchema = new mongoose.Schema({
    id : { type : Number, trim : true},

    event_id : { type : Number, trim : true},

    event_name : { type : String, trim : true},

    event_timestamp_date : {type : String, trim: true},

    has_bookmaker : { type : String, trim : true},

    has_fancy : { type : String, trim : true},

    inplay_stake_limit : { type : String, trim : true},

    inplay_status : { type : String, trim : true},

    league_id : { type : String, trim : true},

    league_name : { type : String, trim : true},
    
    market_id : { type : String, trim : true},

    slug : { type : String, trim : true},

    sport_id : { type : Number, trim : true},

    sport_radar_id : { type : Number, trim : true},

    stake_limit : { type : String, trim : true},

    tv_url : { type : String, trim : true},

    score_url : { type : String, trim : true}
    
}, { timestamps : true});

module.exports = mongoose.model('CrickData', crickdataSchema);