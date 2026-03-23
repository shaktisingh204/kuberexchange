// required modules
var mongoose            = require('mongoose');
var logger              = require('log4js').getLogger();

var Login               = mongoose.model('Login');
var User                = mongoose.model('User');
var Log                 = mongoose.model('Log');
var Logsettlement = mongoose.model('Logsettlement');

module.exports.updateAmount = function(io, socket, request){
  if(!request) return;
  if(!request.user) return;
  if(!request.user.details) return;
  logger.info("updateAmount: "+JSON.stringify(request));
   //return;
  User.findOne({hash:request.user.key, username:request.user.details.username, role:request.user.details.role, deleted:false, status:'active'}, function(err, dbUser){
    if(err) logger.error(err);
    if(!dbUser){
      logger.error("Invalid Access: "+JSON.stringify(request));
      return;
    }
    var amount=0;
    var arr=[];
   
  Logsettlement.find({manager:request.user.details.username,deleted:false}, function(err, logs){
   if(!logs)return;
   var len=logs.length;
  
    for(var i=0;i<logs.length;i++)
    {
    (function(logsi,index)
    {


    amount+=logsi.amount;
    
  Logsettlement.find({username:logsi.username,deleted:false}, function(err, logscheck){
          var lengthj=logscheck.length;
          var amountj=0;
          for(var j=0;j<logscheck.length;j++)
          {
              amountj+=logscheck[j].amount;
              var totalstring=logs[j].username+" :"+logscheck[j].eventName+" :"+logscheck[j].marketName+" :"+amountj;
                if(j==lengthj-1)
                {
                  if(arr.indexOf(totalstring)==-1)
                       {
                      arr.push(totalstring);
                       }
                }
                
          }
    
   /*console.log('len'+len)
   console.log('i'+index)*/
      if(index==len-1)
      {
User.findOne({username:request.user.details.username}, function(err, dbser){
        var oldLimit=dbser.limit; 
        dbser.limit=dbser.limit+amount;
        dbser.balance=dbser.balance+amount;
         User.update({username:request.user.details.username, deleted:false}, {$set:{limit:dbser.limit,balance:dbser.balance}}, function(err, raw1){
         
          Logsettlement.updateMany({manager:request.user.details.username, deleted:false}, {$set:{deleted:true}}, function(err, raw1){
         
         });

         });

         var log = new Log();
        log.username = dbser.username;
        log.action = 'BALANCE';
        log.subAction = 'BALANCE_DEPOSIT';
        log.mnewLimit=dbser.limit;
        log.amount=amount;
        log.oldLimit=oldLimit;
        log.newLimit=dbser.limit;
        log.remark = 'Balance Earn as Referal commision ';
        log.description = arr.toString();
        log.manager = dbser.manager;
        log.master = dbser.master;
        log.subadmin = dbser.subadmin;
        log.relation=dbser.username;
        log.time = new Date();
        log.deleted = false;
        console.log(log);
        log.save(function(err){if(err){logger.error('update-user-balance-error: Log entry failed.');}});
        //log end
    socket.emit('update-amount-success',{message:'balance updated'});

      });
      
      }
      });
})(logs[i],i)
    }
  });
});
  
};

module.exports.updateAmountOld = function(io, socket, request){
  if(!request) return;
  if(!request.user) return;
  if(!request.user.details) return;
  logger.info("updateAmount: "+JSON.stringify(request));

  User.findOne({hash:request.user.key, username:request.user.details.username, role:request.user.details.role, deleted:false, status:'active'}, function(err, dbUser){
    if(err) logger.error(err);
    if(!dbUser){
      logger.error("Invalid Access: "+JSON.stringify(request));
      return;
    }
    var amount=0;
  Logsettlement.find({manager:request.user.details.username,deleted:false}, function(err, logs){
   if(!logs)return;
   var len=logs.length;
    for(var i=0;i<logs.length;i++)
    {
    amount+=logs[i].amount;
      if(len-1==i)
      {
User.findOne({username:request.user.details.username}, function(err, dbser){
        var oldLimit=dbser.limit; 
        dbser.limit=dbser.limit+amount;
        dbser.balance=dbser.balance+amount;
         User.update({username:request.user.details.username, deleted:false}, {$set:{limit:dbser.limit,balance:dbser.balance}}, function(err, raw1){
         
          Logsettlement.updateMany({manager:request.user.details.username, deleted:false}, {$set:{deleted:true}}, function(err, raw1){
         
         });

         });
         var log = new Log();
        log.username = dbser.username;
        log.action = 'BALANCE';
        log.subAction = 'BALANCE_DEPOSIT';
        log.mnewLimit=dbser.limit;
        log.amount=amount;
        log.oldLimit=oldLimit;
        log.newLimit=dbser.limit;
         log.remark = 'Balance Earn as Referal commision ';
        log.description = 'Balance Earn as Referal commision ';
        log.manager = dbser.manager;
        log.master = dbser.master;
        log.subadmin = dbser.subadmin;
        log.relation=dbser.username;
        log.time = new Date();
        log.deleted = false;
        //console.log(log);
        log.save(function(err){if(err){logger.error('update-user-balance-error: Log entry failed.');}});
        //log end
    socket.emit('update-amount-success',{message:'balance updated'});

      });
      
      }
    }
  });
  });
};

module.exports.getsettlment = function(io, socket, request){
  if(!request) return;
  if(!request.user) return;
  if(!request.user.details) return;
  logger.info("getsettlment: "+JSON.stringify(request));

  User.findOne({hash:request.user.key, username:request.user.details.username, role:request.user.details.role, deleted:false, status:'active'}, function(err, dbUser){
    if(err) logger.error(err);
    if(!dbUser){
      logger.error("Invalid Access: "+JSON.stringify(request));
      return;
    }
    if(request.user.details.role == 'user'){
      //request.filter['username'] = request.user.details.username;
      request.filter['deleted'] = false;
      Logsettlement.find(request.filter).sort(request.sort).exec(function(err, dbLogs){
        if(err) logger.error(err);
        socket.emit('get-logsettlement-success', dbLogs);
      });
    }
    if(request.user.details.role == 'manager' || request.user.details.role == 'partner'){
      Logsettlement.find(request.filter).sort(request.sort).exec(function(err, dbLogs){
        if(err) logger.error(err);
        socket.emit('get-logsettlement-success', dbLogs);
      });
    }
    if(request.user.details.role == 'admin'){
      Logsettlement.find(request.filter).sort(request.sort).exec(function(err, dbLogs){
        if(err) logger.error(err);
        socket.emit('get-logsettlement-success', dbLogs);
      });
    }
  });
};


module.exports.getLogs = function(io, socket, request){
  if(!request) return;
  if(!request.user || !request.filter || !request.sort) return;
  if(!request.user.details) return;
  logger.info("getLogs: "+JSON.stringify(request));
  // console.log(request.filter);

  User.findOne({hash:request.user.key, username:request.user.details.username, role:request.user.details.role, deleted:false, status:'active'}, function(err, dbUser){
    if(err) logger.error(err);
    if(!dbUser){
      logger.error("Invalid Access: "+JSON.stringify(request));
      return;
    }
    if(request.user.details.role == 'user'){
      request.filter['username'] = request.user.details.username;
      request.filter['deleted'] = false;
      Log.find(request.filter).sort(request.sort).exec(function(err, dbLogs){
        if(err) logger.error(err);
        socket.emit('get-logs-success', dbLogs);
      });
    }
    if(request.user.details.role == 'manager' || request.user.details.role == 'partner'){
      Log.find(request.filter).sort(request.sort).exec(function(err, dbLogs){
        if(err) logger.error(err);
        socket.emit('get-logs-success', dbLogs);
      });
    }
    if(request.user.details.role == 'admin'){
      Log.find(request.filter).sort(request.sort).exec(function(err, dbLogs){
        if(err) logger.error(err);
        socket.emit('get-logs-success', dbLogs);
      });
    }
  });
};

module.exports.getLogsfilter = function(io, socket, request){
  if(!request) return;
  //console.log(request.from);
  if(!request.user) return;
  if(!request.user.details) return;
  logger.info("getLogs: "+JSON.stringify(request));

  User.findOne({hash:request.user.key, username:request.user.details.username, role:request.user.details.role, deleted:false, status:'active'}, function(err, dbUser){
    if(err) logger.error(err);
    if(!dbUser){
      logger.error("Invalid Access: "+JSON.stringify(request));
      return;
    }
   
    if(request.user.details.role == 'manager' || request.user.details.role == 'partner'){
      Log.find({relation:request.user.details.username, action:{$in:['BALANCE', 'AMOUNT']}, deleted:false,"time": {"$gte": new Date(request.from+"T00:59:00.000Z"),"$lte": new Date(request.to+"T23:59:00.000Z")}}).exec(function(err, dbLogs){
        if(err) logger.error(err);
        if(err) logger.error(err);
        socket.emit('get-logs-success', dbLogs);
      });
    }
    if(request.user.details.role == 'admin'){
      
      Log.find({manager:'admin', action:{$in:['BALANCE', 'AMOUNT']}, deleted:false,"time": {"$gte": new Date(request.from+"T00:59:00.000Z"),"$lte": new Date(request.to+"T23:59:00.000Z")}}).exec(function(err, dbLogs){
        if(err) logger.error(err);
        
        socket.emit('get-logs-success',dbLogs);
      });
    }
  });
};



module.exports.getManagerCommision = function(io, socket, request){
  if(!request) return;
  //console.log(request.from);
  if(!request.user) return;
  if(!request.user.details) return;
  logger.info("getManagerCommision: "+JSON.stringify(request));

  User.findOne({hash:request.user.key, username:request.user.details.username, role:request.user.details.role, deleted:false, status:'active'}, function(err, dbUser){
    if(err) logger.error(err);
    if(!dbUser){
      logger.error("Invalid Access: "+JSON.stringify(request));
      return;
    }
   
    if(request.user.details.role == 'manager' || request.user.details.role == 'partner'){
      Log.find({manager:request.user.details.username, commision:'MATCH_COMM', deleted:false,"time": { $gte: (new Date((new Date()).getTime() - (request.days * 24 * 60 * 60 * 1000)))}}).exec(function(err, dbLogs){
        if(err) logger.error(err);
        
       if(dbLogs)
       {
      
       
        socket.emit('get-commision-success', dbLogs);
       }
       else
       {
        socket.emit('get-commision-success', 0);
       }
      
      });
    }
 
  });
};

