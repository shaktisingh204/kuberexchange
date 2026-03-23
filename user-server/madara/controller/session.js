// required modules
var mongoose    = require('mongoose');
var logger    = 	require('log4js').getLogger();

// required models
var Login       = mongoose.model('Login');
var User        = mongoose.model('User');
var Session     = mongoose.model('Session');
var Log         = mongoose.model('Log');
var mobileIds   = [
  "vivo 1723", "iPhone", "ONEPLUS A6000", "SM-G950F", "SM-N950F", "Macintosh", "Lenovo K8 Note", "Redmi Note 5 Pro",
  "CPH1819", "SM-J810G", "GIONEE A1", "vivo 1606", "SM-A510F", "vivo V3", "SM-J400F", "SM-J701F", "Mi A1", "Redmi Note 4",
  "SM-J500F", "Redmi Note 3"
];
var mobileNames = {
  "vivo 1723": {name:"Vivo V9", type:"mobile"}, "iPhone": {name:"iPhone", type:"mobile"},
  "ONEPLUS A6000": {name:"OnePlus 6", type:"mobile"}, "SM-G950F": {name:"Samsung Galaxy S8", type:"mobile"},
  "SM-N950F": {name:"Samsung Galaxy Note 8", type:"mobile"}, "Macintosh": {name: "Apple MacBook", type:"laptop"},
  "Lenovo K8 Note": {name: "Lenovo K8 Note", type:"mobile"}, "Redmi Note 5 Pro": {name: "Redmi Note 5 Pro", type:"mobile"},
  "CPH1819": {name:"Oppo F7", type:"mobile"}, "SM-J810G": {name:"Samsung Galaxy J8", type:"mobile"},
  "GIONEE A1": {name:"Gionee A1", type:"mobile"}, "vivo 1606": {name:"Vivo Y53i 1606", type:"mobile"},
  "SM-A510F": {name:"Samsung Galaxy A5", type:"mobile"}, "vivo V3": {name:"Vivo V3", type:"mobile"},
  "SM-J400F": {name:"Samsung Galaxy J4", type:"mobile"}, "SM-J701F": {name:"Samsung Galaxy J7", type:"mobile"},
  "Mi A1": {name: "Mi A1", type: "mobile"}, "Redmi Note 4": {name: "Redmi Note 4", type:"mobile"},
  "SM-J500F": {name: "Samsung Galaxy J5", type:"mobile"}, "Redmi Note 3": {name: "Redmi Note 3", type:"mobile"}
};

// @description
module.exports.getSessions = function(io, socket, request){
  if(!request) return;
  if(!request.user) return;
  if(!request.user.details) return;
  logger.debug("getSessions: "+JSON.stringify(request));

  User.findOne({username:request.user.details.username, role:request.user.details.role, hash:request.user.key, deleted:false}, function(err, dbUser){
    if(err) logger.debug(err);
    if(!dbUser){
      logger.error("Invalid Access: "+JSON.stringify(request));
      socket.emit('logout');
      return;
    }
    if(dbUser.role == 'user'){}
    if(dbUser.role == 'partner'){}
    if(dbUser.role == 'manager'){
      if(!request.sort) request['sort'] = {};
      if(!request.filter || !request.sort) return;
      request.filter['manager'] = dbUser.username;
      Session.find(request.filter).sort(request.sort).exec(function(err, dbSessions){
        if(err) logger.debug(err);
        for(var i = 0; i < dbSessions.length; i++){
          for(var j = 0; j < mobileIds.length; j++){
            if(dbSessions[i].headers['user-agent'].indexOf(mobileIds[j]) > -1){
              logger.info(mobileNames[mobileIds[j]]);
              dbSessions[i]['deviceName'] = mobileNames[mobileIds[j]].name;
              dbSessions[i]['deviceType'] = mobileNames[mobileIds[j]].type;
              logger.debug(dbSessions[i]);
              break;
            }
          }
        }
        logger.debug(dbSessions);
        socket.emit('get-sessions-success', dbSessions);
      });
    }
    if(dbUser.role == 'admin'){
      if(!request.sort) request['sort'] = {};
      if(!request.filter || !request.sort) return;
      Session.find(request.filter).sort(request.sort).exec(function(err, dbSessions){
        if(err) logger.debug(err);
        for(var i = 0; i < dbSessions.length; i++){
          for(var j = 0; j < mobileIds.length; j++){
            if(dbSessions[i].headers['user-agent'].indexOf(mobileIds[j]) > -1){
              dbSessions[i]['deviceName'] = mobileNames[mobileIds[j]].name;
              dbSessions[i]['deviceType'] = mobileNames[mobileIds[j]].type;
              break;
            }
          }
        }
        socket.emit('get-sessions-success', dbSessions);
      });
    }
  });
};

module.exports.removeSessions = function(io, socket, request){
  if(!request) return;
  if(!request.user) return;
  if(!request.user.details) return;
  logger.debug("removeSessions: "+JSON.stringify(request));

  User.findOne({username:request.user.details.username, role:request.user.details.role, hash:request.user.key, deleted:false}, function(err, dbUser){
    if(err) logger.debug(err);
    if(!dbUser){
      logger.error("Invalid Access: "+JSON.stringify(request));
      socket.emit('logout');
      return;
    }
    if(dbUser.role == 'user'){}
    if(dbUser.role == 'partner'){}
    if(dbUser.role == 'manager'){
      if(!request.filter) return;
      request.filter['manager'] = dbUser.username;
      Session.find(request.filter, function(err, dbSessions){
        if(err) logger.debug(err);
        dbSessions.forEach(function(session, index){
          if(session.role == 'user')
            io.user.emit('RVeDr66xWzOVLhV5AABIDcd7pwimDyfKiPvTAAAh5b52ccd84fa96dd59b65e54f', {socket:session.socket, emitString:"session-expired", emitData:{session:session}});
          if(index == dbSessions.length-1){
            Session.remove(request.filter, function(err, raw){
              if(err) logger.debug(err);
              module.exports.getSessions(io, socket, request);
            });
          }
        });
      });
    }
    if(dbUser.role == 'admin'){
      if(!request.filter) return;
      Session.find(request.filter, function(err, dbSessions){
        if(err) logger.debug(err);
        dbSessions.forEach(function(session, index){
          if(session.role == 'user')
            io.user.emit('RVeDr66xWzOVLhV5AABIDcd7pwimDyfKiPvTAAAh5b52ccd84fa96dd59b65e54f', {socket:session.socket, emitString:"session-expired", emitData:{session:session}});
          if(session.role == 'manager')
            io.manager.emit('RVeDr66xWzOVLhV5AABIDcd7pwimDyfKiPvTAAAh5b52ccd84fa96dd59b65e54f', {socket:session.socket, emitString:"session-expired", emitData:{session:session}});
          if(index == dbSessions.length-1){
            Session.remove(request.filter, function(err, raw){
              if(err) logger.debug(err);
              module.exports.getSessions(io, socket, request);
            });
          }
        });
      });
    }
  });
};

module.exports.updateSession = function(io, socket, request){
  if(!request) return;
  logger.debug("updateSession: "+JSON.stringify(request));
  Session.update({socket:socket.id}, {$set:{online:request.online}}, function(err, raw){
    if(err) logger.debug(err);
  });
}

module.exports.getSessionCount = function(io, socket, request){
  if(!request) return;
  if(!request.user) return;
  if(!request.user.details) return;
  logger.debug("getSessionCount: "+JSON.stringify(request));

  User.findOne({username:request.user.details.username, role:request.user.details.role, hash:request.user.key, deleted:false}, function(err, dbUser){
    if(err) logger.debug(err);
    if(!dbUser){
      logger.error("Invalid Access: "+JSON.stringify(request));
      socket.emit('logout');
      return;
    }
    if(dbUser.role == 'user'){}
    if(dbUser.role == 'partner'){}
    if(dbUser.role == 'manager'){
      var result = {user:0, partner:0, total:0};
      Session.count({role:'partner', manager:dbUser.username, online:true}).exec(function(err, partnerCount){
        if(err) logger.error(err);
        result['partner'] = partnerCount;
        Session.count({role:'user', manager:dbUser.username, online:true}).exec(function(err, userCount){
          if(err) logger.error(err);
          result['user'] = userCount;
          result['total'] = partnerCount + userCount;
          socket.emit('get-session-count-success', result);
        });
      });
    }
    if(dbUser.role == 'admin'){
      var result = {user:0, manager:0, partner:0, admin:0, total:0};
      Session.count({role:'manager', online:true}).exec(function(err, managerCount){
        if(err) logger.error(err);
        result['manager'] = managerCount;
        Session.count({role:'partner', online:true}).exec(function(err, partnerCount){
          if(err) logger.error(err);
          result['partner'] = partnerCount;
          Session.count({role:'user', online:true}).exec(function(err, userCount){
            if(err) logger.error(err);
            result['user'] = userCount;
            Session.count({role:'admin', online:true}).exec(function(err, adminCount){
              if(err) logger.error(err);
              result['admin'] = adminCount;
              result['total'] = managerCount + partnerCount + userCount + adminCount;
              socket.emit('get-session-count-success', result);
            });
          });
        });
      });
    }

     if(dbUser.role == 'operator'){
      var result = {user:0, manager:0, partner:0, admin:0, total:0};
      Session.count({role:'manager', online:true}).exec(function(err, managerCount){
        if(err) logger.error(err);
        result['manager'] = managerCount;
        Session.count({role:'partner', online:true}).exec(function(err, partnerCount){
          if(err) logger.error(err);
          result['partner'] = partnerCount;
          Session.count({role:'user', online:true}).exec(function(err, userCount){
            if(err) logger.error(err);
            result['user'] = userCount;
            Session.count({role:'admin', online:true}).exec(function(err, adminCount){
              if(err) logger.error(err);
              result['admin'] = adminCount;
              result['total'] = managerCount + partnerCount + userCount + adminCount;
              socket.emit('get-session-count-success', result);
            });
          });
        });
      });
    }
  });
}
