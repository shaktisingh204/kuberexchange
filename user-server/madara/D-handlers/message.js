// required modules
var mongoose            = require('mongoose');
var logger              = require('log4js').getLogger();

var Login               = mongoose.model('Login');
var User                = mongoose.model('User');
var Message             = mongoose.model('Message');
var Pushnotification             = mongoose.model('Pushnotification');

//var admin = require('firebase-admin');
var path = require('path');
var serviceAccount = path.resolve('./serviceKey.json')

module.exports.setPushToken = function(io, socket, request){
   if(!request)return;
   
    if(!request.user)return;
    var notification = new Pushnotification();

      notification.username = request.user.details.username;
      notification.deleted = false;
      notification.token = request.token;
      notification.manager = request.user.details.manager;
      Pushnotification.findOne({username:request.user.details.username}, function(err, checkExist){
         
          console.log(request.token)
        if(!checkExist)
        {
      notification.save(function(err){
        logger.error(err);

        socket.emit('create-message-success', notification);
      });
        }
        else
        {
           Pushnotification.update({
      username:request.user.details.username
    }, {
      $set: {
       token: request.token
      }
    }, function (err, raw) {});
      
       
        }
      
    });

  }

module.exports.pushMessage = function(io, socket, request){
  console.log(request.message);
 var data = { 
    app_id: "a9cf529a-687f-4545-a832-ffbcd21b64f6",
    contents: {"en": request.message.result},
    headings: {"en": request.message.result},
    big_picture : "https://blog.taskpigeon.co/wp-content/uploads/2017/06/Advanced-Email-Notifications-Task-Pigeon.jpg",
    url    : "https://onesignal.com",
    included_segments: ["All"]
  };

  var headers = {
      "Content-Type": "application/json; charset=utf-8",
      "Authorization": "Basic ZTA5MjExNTEtNzk2My00NGM3LWI0MDktNjJjYmJhMWE2NDlk"
    };
    
    var options = {
      host: "onesignal.com",
      port: 443,
      path: "/api/v1/notifications",
      method: "POST",
      headers: headers
    };


var https = require('https');
  var req = https.request(options, function(res) {  
    res.on('data', function(data) {
      console.log("Response:");
      console.log(JSON.parse(data));
      socket.emit('push-message-success', {'message':'push message set successfully'});
    });
  });
  
  req.on('error', function(e) {
    console.log("ERROR:");
    socket.emit('push-message-success', {'message':'push message set successfully'});
    console.log(e);
  });
  
  req.write(JSON.stringify(data));
  req.end();


 

 }   


module.exports.getMessage = function(io, socket, request){
  if(!request) return;
  if(!request.user) return;
  if(!request.user.details) return;
  logger.info("getMessage: "+JSON.stringify(request));

  User.findOne({hash:request.user.key, username:request.user.details.username, role:request.user.details.role, deleted:false, status:'active'}, function(err, dbUser){
    if(err) logger.error(err);
    if(!dbUser){
      logger.error("Invalid Access: "+JSON.stringify(request));
      return;
    }
    if(request.user.details.role == 'user' || request.user.details.role == 'partner'){
      Message.findOne({deleted:false, visible:true, createdBy:request.user.details.manager, type:'MANAGER'}).sort({'time':-1}).exec(function(err, msg){
        socket.emit('get-message-success', msg);
      });
    }
    if(request.user.details.role == 'manager'){
      Message.findOne({deleted:false, visible:true, createdBy:request.user.details.username, type:'MANAGER'}).sort({'time':-1}).exec(function(err, msg){
        socket.emit('get-message-success', msg);
      });
    }
    Message.findOne({deleted:false, visible:true, type:'ADMIN'}).sort({'time':-1}).exec(function(err, msg){
      socket.emit('get-message-success', msg);
    });
  });
};
module.exports.getMessages = function(io, socket, request){
  if(!request) return;
  if(!request.user) return;
  if(!request.user.details) return;
  logger.info("getMessages: "+JSON.stringify(request));

  if(request.user.details.role == 'admin'){
    if(!request.filter || !request.sort) return;
    User.findOne({hash:request.user.key, username:request.user.details.username, role:'admin', deleted:false, status:'active'}, function(err, dbAdmin){
      if(err) logger.error(err);
      if(!dbAdmin){
        logger.error("Invalid Access: "+JSON.stringify(request));
        return;
      }
      Message.find(request.filter).sort(request.sort).exec(function(err, messages){
        if(err) logger.error(err);
        socket.emit('get-messages-success', messages);
      });
    });
  }
  if(request.user.details.role == 'operator'){
    if(!request.filter || !request.sort) return;
    User.findOne({hash:request.user.key, username:request.user.details.username, role:'operator', deleted:false, status:'active'}, function(err, dbAdmin){
      if(err) logger.error(err);
      if(!dbAdmin){
        logger.error("Invalid Access: "+JSON.stringify(request));
        return;
      }
      Message.find(request.filter).sort(request.sort).exec(function(err, messages){
        if(err) logger.error(err);
        socket.emit('get-messages-success', messages);
      });
    });
  }
  if(request.user.details.role == 'manager'){
    if(!request.filter || !request.sort) return;
    User.findOne({hash:request.user.key, username:request.user.details.username, role:'manager', deleted:false, status:'active'}, function(err, dbAdmin){
      if(err) logger.error(err);
      if(!dbAdmin){
        logger.error("Invalid Access: "+JSON.stringify(request));
        return;
      }
      request.filter['createdBy'] = request.user.details.username;
      request.filter['deleted'] = false;
      Message.find(request.filter).sort(request.sort).exec(function(err, messages){
        if(err) logger.error(err);
        socket.emit('get-messages-success', messages);
      });
    });
  }
};
module.exports.createMessage = function(io, socket, request){
  if(!request) return;
  if(!request.user || !request.message) return;
  if(!request.user.details) return;
  logger.info("createMessage: "+JSON.stringify(request));

  if(request.user.details.role == 'admin'){
    User.findOne({hash:request.user.key, username:request.user.details.username, role:'admin', deleted:false, status:'active'}, function(err, dbAdmin){
      if(err) logger.error(err);
      if(!dbAdmin){
        logger.error("Invalid Access: "+JSON.stringify(request));
        return;
      }
      var message = new Message();
      message.messageId = Math.floor(Date.now())+'';
      message.message = request.message;
      message.time = new Date();
      message.visible = true;
      message.deleted = false;
      message.type = 'ADMIN';
      message.createdBy = request.user.details.username;
      message.image = request.user.details.image;
      message.save(function(err){
        logger.error(err);
        socket.emit('create-message-success', message);
      });
    });
  }

  if(request.user.details.role == 'operator'){
    User.findOne({hash:request.user.key, username:request.user.details.username, role:'operator', deleted:false, status:'active'}, function(err, dbAdmin){
      if(err) logger.error(err);
      if(!dbAdmin){
        logger.error("Invalid Access: "+JSON.stringify(request));
        return;
      }
      var message = new Message();
      message.messageId = Math.floor(Date.now())+'';
      message.message = request.message;
      message.time = new Date();
      message.visible = true;
      message.deleted = false;
      message.type = 'ADMIN';
      message.createdBy = request.user.details.username;
      message.image = request.user.details.image;
      message.save(function(err){
        logger.error(err);
        socket.emit('create-message-success', message);
      });
    });
  }
  if(request.user.details.role == 'manager'){
    User.findOne({hash:request.user.key, username:request.user.details.username, role:'manager', deleted:false, status:'active'}, function(err, dbAdmin){
      if(err) logger.error(err);
      if(!dbAdmin){
        logger.error("Invalid Access: "+JSON.stringify(request));
        return;
      }
      var message = new Message();
      message.messageId = Math.floor(Date.now())+'';
      message.message = request.message;
      message.time = new Date();
      message.visible = true;
      message.deleted = false;
      message.type = 'MANAGER';
      message.createdBy = request.user.details.username;
      message.image = request.user.details.image;
      message.save(function(err){
        logger.error(err);
        socket.emit('create-message-success', message);
      });
    });
  }
};
module.exports.updateMessage = function(io, socket, request){
  if(!request) return;
  if(!request.user || !request.message) return;
  if(!request.user.details || !request.message.messageId) return;
  logger.info("updateMessage: "+JSON.stringify(request));

  if(request.user.details.role == 'admin'){
    User.findOne({hash:request.user.key, username:request.user.details.username, role:'admin', deleted:false, status:'active'}, function(err, dbAdmin){
      if(err) logger.error(err);
      if(!dbAdmin){
        logger.error("Invalid Access: "+JSON.stringify(request));
        return;
      }
      Message.update({messageId:request.message.messageId}, request.message, function(err, raw){
        if(err) logger.error(err);
        socket.emit('update-message-success', request.message);
      });
    });
  }

  if(request.user.details.role == 'operator'){
    User.findOne({hash:request.user.key, username:request.user.details.username, role:'operator', deleted:false, status:'active'}, function(err, dbAdmin){
      if(err) logger.error(err);
      if(!dbAdmin){
        logger.error("Invalid Access: "+JSON.stringify(request));
        return;
      }
      Message.update({messageId:request.message.messageId}, request.message, function(err, raw){
        if(err) logger.error(err);
        socket.emit('update-message-success', request.message);
      });
    });
  }
  if(request.user.details.role == 'manager'){
    User.findOne({hash:request.user.key, username:request.user.details.username, role:'manager', deleted:false, status:'active'}, function(err, dbAdmin){
      if(err) logger.error(err);
      if(!dbAdmin){
        logger.error("Invalid Access: "+JSON.stringify(request));
        return;
      }
      Message.update({messageId:request.message.messageId, createdBy: request.user.details.username, deleted:false}, request.message, function(err, raw){
        if(err) logger.error(err);
        socket.emit('update-message-success', request.message);
      });
    });
  }
};
