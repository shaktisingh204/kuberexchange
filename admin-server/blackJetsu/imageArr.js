// required modules
var phantom     = require('phantom');
var mongoose    = require('mongoose');
var logger      = require('log4js').getLogger();
var db          = require('../madara/models/db');
const fs = require('fs');
var Market = mongoose.model('Market');
var Event = mongoose.model('Event');
var request = require('request');
 var arr=fs.readFileSync(__dirname + '/data.txt', 'utf8');
 var parseData=JSON.parse(arr);
 setInterval(function () {
  try
  {
Market.find({
        "marketBook.status":"OPEN",
        "marketType":"MATCH_ODDS",
        'eventTypeId':'4',
        
      },{marketId:1,eventName:1}, function (err, markets) {
  if(!markets)return;
 for(var j=0;j<markets.length;j++)
 {
    var market=markets[j];
    var ev=market.eventName.toLowerCase().split("v");
    var eventarr={};

 if(ev[0])
 {
 var all=ev[0].trim() || '';
 }
if(ev[1])
{
 var all1=ev[1].trim() || '';
}

 console.log(all1)
 var ar1=all.replace(/\s/g, '-').toLowerCase();
 var ar2=all1.replace(/\s/g, '-').toLowerCase();
eventarr[0]="https://static.sportskeeda.com/cricket_widget/"+ar1+".png";
eventarr[1]="https://static.sportskeeda.com/cricket_widget/"+ar2+".png";
    console.log(ar2)

    market.imgArr=eventarr;
               Market.update({
                   marketId: market.marketId
               }, market, function(err, raw) {
                  //console.log(raw);
                   if (err) logger.error(err);
               });

  }
})
  }
  catch(e)
  {

  }

 }, 600000);