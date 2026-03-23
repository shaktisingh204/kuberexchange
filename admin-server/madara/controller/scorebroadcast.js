// required modules
var mongoose            = require('mongoose');
var logger              = require('log4js').getLogger();
var request = require('request');

// required internal modules
var eventTypeModule     = require('../../whiteJetsu/eventType');
var competitionModule   = require('../../whiteJetsu/competition')
var marketBook          = require('../../whiteJetsu/marketBook');

// required models
module.exports.getScores = function(io, socket, request1){
  //if(!request) return;
  //if(!request.user) return;
  //if(!request.user.details) return;

  //var filter = {};

  //if(request.user.details.role == 'user'){
    //if(!request.filter || !request.sort) return;
    if(request1.eventTypeid==1||request1.eventTypeid==2)
    {
  var url="https://ips.betfair.com/inplayservice/v1/scores?_ak=nzIFcwyWhrlwYMrh&alt=json&eventIds="+request1.eventId+"&locale=en&productType=EXCHANGE&regionCode=ASIA";
  request(url, function(error, response, body) {
                  
                   try{
                       var resultall = JSON.parse(body);
                      socket.emit("get-score-tennis-success", resultall);
                      }
                      catch(e)
                      { 
                      
                      }   

    });  

    }
    else if(request1.eventTypeid==4)
    {
                  //var url="https://www.lotusbook.com/api/match-center/stats/4/29131958";
                   //request(url, function(error, response, body) {
                  
                   //try{
                      //var resultall = JSON.parse(body);
                      //socket.emit("get-score-tennis-success", resultall);
                      //}
                      //catch(e)
                      //{ 
                      //var resultall =[{"id":"testing"}];
                      //socket.emit("get-score-tennis-success", resultall);
                      //}   

    //}); 

    }
    else
    {

    }
  
  
 
};

