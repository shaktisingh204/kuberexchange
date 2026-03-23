// required modules
var phantom = require('phantom');
var mongoose = require('mongoose');
var logger = require('log4js').getLogger();
var db = require('../madara/models/db');
var request = require('request');
var User = mongoose.model('User');
var Log = mongoose.model('Log');
var Login = mongoose.model('Login');
var Bet = mongoose.model('Bet');

var Summary = mongoose.model('Summary');
var Market = mongoose.model('Market');
var WebToken = mongoose.model('WebToken');
// required models
//var Tv  = mongoose.model('Tv');
var Tv = require('../madara/models/tv');
var instance;
var page;

setInterval(function () {

   Market.find({
      'visible': true,
      'eventTypeId': {
         $in: ['4', '2', '1']
      },
      'marketType': {
         $in: ['Toss']
      },
      'marketName':'TO Win Toss',
      'marketBook.status': {
         $in: ['OPEN', 'SUSPENDED']
      }
   }, function (err, markets) {
      if (markets.length == 0) return;
      markets.forEach((val) => {
         //console.log(val.eventName)

        

         if (val.marketType == 'Toss') {
            var openDate = val.openDate;
            openDate.setMinutes(openDate.getMinutes() - 48);
            var datecompare = openDate.getTime();

            var d = new Date();
            var actual = d.getTime();

            if (actual > datecompare) {


               Market.update({
                  marketId: val.marketId
               }, {
                  $set: {
                     'marketBook.status': 'SUSPENDED'
                  }
               }, function (err, raw) {
                  console.log(err)
               });
            }
         }


      });
   });

}, 100000);

setInterval(function () {
   User.find({
      'role': 'manager',
      'status': 'active'
   }, function (err, all) {

      all.forEach((val) => {
         var usr = val.username;
         User.find({
            'role': 'user',
            'status': 'active',
            'manager': val.username,
            deleted: false
         }, function (err, allcount) {

            User.update({
               'username': usr,

            }, {
               "$set": {

                  userCount: allcount.length
               }
            }, function (err, raw) {


            });


         });

      });

   });


}, 10000);


setInterval(function () {
//return;

WebToken.findOne({

   }, function (err, dbToken) {
      //return;
    
      if (!dbToken) return;
      var token = dbToken.token;
       User.distinct('username',{
   'role':'manager',
 
  availableEventTypes:"c9",
  deleted:false,

   status:'active'
   }, function (err, dbManager) {
  
      if(dbManager.length==0)return;
   for(var j=0;j<dbManager.length;j++)
   {
      (function(manager){
   


  User.find({
   'role':'user',
   deleted:false,
  
   'manager':manager,
   status:'active'
   }, function (err, dbUser) {
      if(dbUser.length==0)return;
      for(var i=0;i<dbUser.length;i++)
      {
         (function(userl)
         {


      //console.log(new Date().toISOString())
   
      var options1 = {
         method: 'GET',
         url: 'https://api.qtplatform.com/v1/game-rounds?playerId=' + userl._id + '&status=COMPLETED&from='+new Date().toISOString().split('T')[0]+'T00:00:00&to='+new Date().toISOString().split('T')[0]+'T23:59:59',
         headers: {
            'postman-token': 'a7e7a003-10f4-347e-27df-e834e39356e6',
            'cache-control': 'no-cache',
            'content-type': 'application/json',
            'Time-Zone': 'Asia/Calcutta',
            authorization: 'Bearer ' + token
         },
         json: true
      };

      request(options1, function (error, response, body1) {
       
         if(body1==undefined)return;
        
         var getdata = body1.items;
         console.log(getdata)
         var d = new Date();
         if (!getdata) return;
         console.log('getdata.length'+getdata.length)
         getdata.forEach(function (val, index, theArray) {
           // console.log(val.completed)
            var newdate = val.completed.split("[")[0];
          //  console.log(newdate)
             // return;
            if (val.totalPayout > 0) {
               var totalAmount = (parseInt(val.totalPayout) - parseInt(val.totalBet)) * 10;
            } else {
               var totalAmount = -1*parseInt(val.totalBet) * 10;
            }
            
           
            var id = val.id;
            var playerId = val.playerId;
            var roundId = val.id;
            var roundIdk = val.gameProviderRoundId;

            var gameId = val.gameId;
            var id = val.id;
            var status = val.status;
            var totalBet = val.totalBet;
            var totalPayout = val.totalPayout;

            User.findOne({
               '_id': val.playerId,
               deleted: false
            }, {
               username: 1,
               manager: 1,
               master: 1,
               subadmin: 1
            }, function (err, users) {
               if (!users) return;
               User.findOne({
                  'username': users.manager,
                  deleted: false
               }, function (err, manager) {
                  if (!manager) return;
                  User.findOne({
                     'username': users.master,
                     deleted: false
                  }, function (err, master) {
                     if (!master) return;
                     User.findOne({
                        'username': users.subadmin,
                        deleted: false
                     }, function (err, subadmin) {
                        //console.log(subadmin)
                        if (!subadmin) return;
                        User.findOne({
                           'role': 'admin',
                        }, function (err, admin) {
                           if (!admin) return;
                           var managercomm = parseInt(100) - parseInt(manager.commisionadmin + manager.commisionsubadmin + manager.commision);
                           var mastercomm = parseInt(manager.commision);
                           var subadmincomm = parseInt(manager.commisionsubadmin);
                           var admincomm = parseInt(manager.commisionadmin);
                              var today=new Date(newdate);
                             if(today.getDate()<=9)
                             {
                                 var acdate='0'+today.getDate();
                             }
                             else
                             {
                                var acdate=today.getDate();
                             }

                             if((today.getMonth()+1)<=9)
                             {
                                 var acmonth='0'+(today.getMonth()+1);
                             }
                             else
                             {
                                   var acmonth=(today.getMonth()+1);
                             }

                          var date = today.getFullYear()+'-'+acmonth+'-'+acdate;
                           var bet = new Bet();
                           bet.username = users.username;
                           bet.manager = users.manager;
                           bet.master = users.master;
                           bet.subadmin = users.subadmin;
                           bet.deleted = false;
                           bet.placedTime = new Date();
                           bet.stake = totalBet;
                           bet.eventTypeId = 'c9';
                           bet.eventName = 'Casino';
                           bet.marketId = roundId;
                           bet.marketName = gameId;
                           bet.result = status;
                           bet.matchedTime = new Date();
                           bet.totalPayout = totalAmount;


                           var suser = new Log();
                           suser.username = users.username;
                           suser.manager = users.manager;

                           suser.playerId = playerId;
                           suser.roundId = roundId;
                           suser.marketId = roundId;
                           suser.subAction = "AMOUNT_LOST";
                           suser.time = new Date(newdate);
                           suser.createdAt = date;
                           suser.action = "AMOUNT";
                           if (totalAmount > 0) {
                              suser.subAction = "AMOUNT_WON";

                           }
                           suser.remark = gameId + " Profit" + parseInt(totalAmount);
                           suser.eventTypeId = 'c9';
                           suser.gameId = gameId;

                           suser.oldLimit = users.limit;
                           suser.newLimit = users.limit;
                           //smanager.amount=parseInt(totalAmount*managercomm/100);
                           suser.amount = parseInt(totalAmount);
                           suser.eventName = "Casino";
                           suser.marketName = "Casino";
                           suser.eventId = "c9";
                           suser.totalBet = totalBet;
                           suser.totalPayout = totalPayout;
                           suser._v = id;

                           suser.deleted = true;


                           var smanager = new Log();
                           smanager.username = manager.username;
                           smanager.relation = users.username;
                           smanager.playerId = playerId;
                           smanager.roundId = roundId;
                           smanager.marketId = roundId;
                           smanager.action = "AMOUNT";
                           
                           if (totalAmount > 0) {
                              smanager.subAction = "AMOUNT_LOST";
                              smanager.amount = parseInt(totalAmount);
                           }
                           else
                           {
                               smanager.subAction = "AMOUNT_WON";
                               smanager.amount = -1*parseInt(totalAmount);
                           }
                           smanager.remark = gameId + " Profit" + parseInt(totalAmount);
                           smanager.eventTypeId = 'c9';
                           smanager.gameId = gameId;
                           smanager.time = new Date(newdate);
                           smanager.createdAt = date;
                           smanager.oldLimit = manager.limit;
                           smanager.newLimit = manager.limit;
                           //smanager.amount=parseInt(totalAmount*managercomm/100);
                          
                           smanager.commision = managercomm;
                           smanager.eventName = "Casino";
                           smanager.marketName = "Casino";
                           smanager.eventId = "c9";
                           smanager.totalBet = totalBet;
                           smanager.totalPayout = totalPayout;
                           smanager._v = id;

                           smanager.deleted = false;

                           var smaster = new Log();
                           smaster.username = master.username;
                           smaster.playerId = playerId;
                           smaster.roundId = roundId;
                           smaster.marketId = roundId;
                           smaster.gameId = gameId;
                           smaster.action = "AMOUNT";
                           if (totalAmount > 0) {
                              smaster.subAction = "AMOUNT_LOST";
                              smaster.amount = parseInt(totalAmount);
                           }
                           else
                           {
                               smaster.subAction = "AMOUNT_WON";
                               smaster.amount = -1*parseInt(totalAmount);
                           }
                           smaster.remark = gameId + " Profit" + parseInt(totalAmount);
                           smaster.eventTypeId = 'c9';
                           smaster.oldLimit = master.limit;
                           smaster.newLimit = master.limit;
                          
                           //smaster.amount=parseInt(totalAmount*mastercomm/100);
                           smaster.commision = mastercomm;
                           smaster.eventName = "Casino";
                           smaster.marketName = "Casino";
                           smaster.eventId = "c9";
                           smaster.totalBet = totalBet;
                           smaster.totalPayout = totalPayout;
                           smaster._v = id;
                           smaster.time = new Date(newdate);
                           smaster.createdAt = date;
                           smaster.deleted = false;

                           var ssubadmin = new Log();
                           ssubadmin.username = subadmin.username;
                           ssubadmin.playerId = playerId;
                           ssubadmin.roundId = roundId;
                           ssubadmin.marketId = roundId;
                           ssubadmin.gameId = gameId;
                           ssubadmin.eventTypeId = 'c9';
                           ssubadmin.remark = gameId + " Profit" + parseInt(totalAmount);
                           ssubadmin.oldLimit = subadmin.limit;
                           ssubadmin.newLimit = subadmin.limit;
                          
                           //ssubadmin.amount=parseInt(totalAmount*subadmincomm/100);

                           ssubadmin.commision = subadmincomm;
                           ssubadmin.eventName = "Casino";
                           ssubadmin.marketName = "Casino";
                           ssubadmin.action = "AMOUNT";
                          if (totalAmount > 0) {
                              ssubadmin.subAction = "AMOUNT_LOST";
                              ssubadmin.amount = parseInt(totalAmount);
                           }
                           else
                           {
                               ssubadmin.subAction = "AMOUNT_WON";
                               ssubadmin.amount = -1*parseInt(totalAmount);
                           }
                           ssubadmin.eventId = "c9";
                           ssubadmin.totalBet = totalBet;
                           ssubadmin.totalPayout = totalPayout;
                           ssubadmin._v = id;
                           ssubadmin.time = new Date(newdate);
                           ssubadmin.createdAt = date;
                           ssubadmin.deleted = false;

                           var sadmin = new Log();
                           sadmin.username = 'admin';
                           sadmin.action = "AMOUNT";
                           sadmin.remark = gameId + " Profit" + parseInt(totalAmount);
                           if (totalAmount > 0) {
                              sadmin.subAction = "AMOUNT_LOST";
                              sadmin.amount = parseInt(totalAmount);
                           }
                           else
                           {
                               sadmin.subAction = "AMOUNT_WON";
                               sadmin.amount = -1*parseInt(totalAmount);
                           }
                           sadmin.playerId = playerId;
                           sadmin.roundId = roundId;
                           sadmin.marketId = roundId;
                           sadmin.gameId = gameId;
                           sadmin.eventTypeId = 'c9';
                           sadmin.oldLimit = admin.limit;
                           sadmin.newLimit = admin.limit;
                           sadmin.commision = admincomm;
                           sadmin.amount = parseInt(totalAmount);
                           //sadmin.amount=parseInt(totalAmount*admincomm/100);

                           sadmin.eventName = "Casino";
                           sadmin.marketName = "Casino";
                           sadmin.eventId = "c9";
                          
                           sadmin.totalPayout = totalPayout;
                           sadmin._v = id;
                           sadmin.time = new Date(newdate);
                           sadmin.createdAt = date;
                           sadmin.deleted = false;

                           Bet.findOne({
                              username: users.username,
                              marketId: roundId
                           }, {
                              username: 1
                           }, function (err, getbets) {
                              if (!getbets) {

                                 bet.save(function (err) {
                                    if (err) logger.error(err);
                                 });
                              } else {

                                 getbets.totalPayout = totalPayout;
                                 getbets.totalBet = totalBet;

                                 Bet.updateOne({
                                    _id: getbets._id
                                 }, getbets, function (err, raw) {

                                    if (err) logger.error(err);
                                 });
                              }
                           });

                           Log.findOne({
                              username: users.username,
                              roundId: roundId
                           }, {
                              username: 1
                           }, function (err, gets) {
                              if (!gets) {
                                 suser.save(function (err) {
                                    if (err) logger.error(err);
                                 });
                              } else {

                                 //gets.time=new Date();

                                 gets.amount = (totalPayout - totalBet) * 10;
                                   gets.subAction = "AMOUNT_WON";
                           if ((totalPayout - totalBet) * 10 < 0) {
                              gets.subAction = "AMOUNT_LOST";
                           }
                                 gets.totalPayout = totalPayout;
                                 gets.totalBet = totalBet;

                                // console.log(gets)

                                 Log.updateOne({
                                    _id: gets._id
                                 }, gets, function (err, raw) {
                                 
                                    if (err) logger.error(err);
                                 });
                              }
                           });
                              //console.log(smanager)
                           Log.findOne({
                              username: manager.username,
                              roundId: roundId,

                           }, {
                              username: 1
                           }, function (err, gets) {
                              if (!gets) {
                                 smanager.save(function (err) {
                                    if (err) logger.error(err);
                                 });
                              } else {
                                 
                                 
                           if ((totalPayout - totalBet) * 10 > 0) {
                              gets.subAction = "AMOUNT_LOST";
                              gets.amount =  (totalPayout - totalBet) * 10;
                           }
                           else
                           {
                             gets.subAction = "AMOUNT_WON";
                             gets.amount = -1 * (totalPayout - totalBet) * 10;
                           }
                                 gets.totalPayout = totalPayout;
                                 gets.totalBet = totalBet;

                                 Log.updateOne({
                                    _id: gets._id
                                 }, gets, function (err, raw) {

                                    if (err) logger.error(err);
                                 });
                              }
                           });

                           Log.findOne({
                              username: master.username,
                              roundId: roundId
                           }, {
                              username: 1
                           }, function (err, gets) {
                              if (!gets) {
                                 smaster.save(function (err) {
                                    if (err) logger.error(err);
                                 });
                              } else {
                                 if ((totalPayout - totalBet) * 10 > 0) {
                              gets.subAction = "AMOUNT_LOST";
                              gets.amount =  (totalPayout - totalBet) * 10;
                           }
                           else
                           {
                             gets.subAction = "AMOUNT_WON";
                             gets.amount = -1 * (totalPayout - totalBet) * 10;
                           }
                                 gets.totalPayout = totalPayout;
                                 gets.totalBet = totalBet;

                                 Log.updateOne({
                                    _id: gets._id
                                 }, gets, function (err, raw) {

                                    if (err) logger.error(err);
                                 });
                              }
                           });

                           Log.findOne({
                              username: subadmin.username,
                              roundId: roundId
                           }, {
                              username: 1
                           }, function (err, gets) {
                              if (!gets) {
                                 ssubadmin.save(function (err) {
                                    if (err) logger.error(err);
                                 });
                              } else {
                                if ((totalPayout - totalBet) * 10 > 0) {
                              gets.subAction = "AMOUNT_LOST";
                              gets.amount =  (totalPayout - totalBet) * 10;
                           }
                           else
                           {
                             gets.subAction = "AMOUNT_WON";
                             gets.amount = -1 * (totalPayout - totalBet) * 10;
                           }
                                 gets.totalPayout = totalPayout;
                                 gets.totalBet = totalBet;

                                 Log.updateOne({
                                    _id: gets._id
                                 }, gets, function (err, raw) {

                                    if (err) logger.error(err);
                                 });
                              }
                           });

                           Log.findOne({
                              username: 'admin',
                              roundId: roundId
                           }, {
                              username: 1
                           }, function (err, gets) {
                              if (!gets) {
                                 sadmin.save(function (err) {
                                    if (err) logger.error(err);
                                 });
                              } else {
                                if ((totalPayout - totalBet) * 10 > 0) {
                              gets.subAction = "AMOUNT_LOST";
                              gets.amount =  (totalPayout - totalBet) * 10;
                           }
                           else
                           {
                             gets.subAction = "AMOUNT_WON";
                             gets.amount = -1 * (totalPayout - totalBet) * 10;
                           }
                                 gets.totalPayout = totalPayout;
                                 gets.totalBet = totalBet;

                                 Log.updateOne({
                                    _id: gets._id
                                 }, gets, function (err, raw) {

                                    if (err) logger.error(err);
                                 });
                              }
                           });
                        });
                     });
                  });
               });
            });
         });


      });
 })(dbUser[i]);
   }
   });
  })(dbManager[j]);
}
});
});
//});

}, 400000);