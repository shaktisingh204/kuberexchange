// required modules
var phantom = require('phantom');
var mongoose = require('mongoose');
var request = require('request');
var logger = require('log4js').getLogger();
var db = require('../madara/models/db');
var index = 0;
// required models
var EventType = mongoose.model('EventType');
var Competition = mongoose.model('Competition');
var Event = mongoose.model('Event');
var Market = mongoose.model('Market');
var Bet = mongoose.model('Bet');
var User = mongoose.model('User');
var Log = mongoose.model('Log');
const https = require('https');
var express = require('express');
const { getVideoDurationInSeconds } = require('get-video-duration');
var CricketVideo = mongoose.model('CricketVideo');
var app = express();
var instance;
var page;
var errorCount = 0;
logger.level = 'info';

setInterval(function(){
  CricketVideo.find({ },{timelen:1,URL:1}).limit(500).sort({
    $natural: -1
  }).exec(function (err, market) {

    for(var i=0;i<market.length;i++)
    {

      (function(mk)
      {
          
             try
             {
               getVideoDurationInSeconds(mk.URL).then((duration1) => {
                         
                        CricketVideo.update({
                                    _id: mk._id
                                  }, {
                                    "$set": {
                                     
                                      timelen: Math.round(duration1*100)
                                    }
                                  }, function (err, raw) {
                                    console.log(duration1);
                                  console.log(raw);
                                  });

                        });
             }
             catch(e)
             {

             }
                     

      })(market[i])
    }

     

  });


}, 10000);