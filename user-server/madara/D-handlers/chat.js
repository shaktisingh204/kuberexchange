// required modules
var mongoose            = require('mongoose');
var logger              = require('log4js').getLogger();

var Login               = mongoose.model('Login');
var User                = mongoose.model('User');
var Message             = mongoose.model('Message');
var Chat                = mongoose.model('Chat');
var Information         = mongoose.model('Information');
var Pushnotification             = mongoose.model('Pushnotification');
var multer              = require('multer');
var path = require('path');
var serviceAccount = path.resolve('./serviceKey.json')
//var admin = require('firebase-admin');
//var path = require('path');
//var serviceAccount = path.resolve('./serviceKey.json')
module.exports.userInformation = function(io, socket, request){

   if(!request) return;
  if(!request.user) return;
  logger.info("userInformation: request="+JSON.stringify(request));
 
  if(request.user.details.role == 'user'){
     var information = new Information();
          information.username=request.user.details.username;
          information.phone=request.filter.phone;
          information.manager=request.user.details.manager;
          information.time=new Date();
          information.visible=true;
          information.deleted=false;
          information.save(function(err, chat){
            if(err) logger.debug(err);
          });
          console.log(information);

    socket.emit('user-information-success',{'message':'chat system avialble now','user':request.user.details.username});

  }

}




module.exports.updateChat = function(io, socket, request){

   if(!request) return;
  if(!request.user) return;
  logger.info("updateChat: request="+JSON.stringify(request));
 
  if(request.user.details.role == 'manager'){
  
      Chat.updateMany({user:request.filter.user,manager:request.user.details.username},
          {$set:{
            visiblebymanager:true,
          }}, function(err, chat){
            console.log(chat);
            if(err){
              logger.debug(err);
            }
           
          });
  }

  if(request.user.details.role == 'user'){
  
      Chat.updateMany({user:request.user.details.username,manager:request.user.details.manager},
          {$set:{
            visiblebyuser:true,
          }}, function(err, chat){
         console.log("test");
            if(err){
              logger.debug(err);
            }
           
          });
  }
}

module.exports.createMessage = function(io, socket, request){

   if(!request) return;
  if(!request.user) return;
  logger.info("create chat: request="+JSON.stringify(request));
 
  if(request.user.details.role == 'manager'){
    var random=Math.floor((Math.random() * 1000000) + 1);;
     var chat = new Chat();
          chat.messageId=random;
          chat.message=request.message;
          chat.senderId=request.user.details.username;
          chat.receiverId=request.receiverId;
          chat.manager=request.user.details.username;
          chat.user=request.receiverId;
          chat.time=new Date()
          chat.visible=true;
          chat.deleted=false;
          chat.status=false;
          chat.visiblebymanager=false;
          chat.visiblebyuser=false;
          chat.type='string';
          chat.createdBy=request.user.details.username;
          chat.save(function(err, chat){
            if(err) logger.debug(err);
          });
   
    socket.emit('get-create-chat-success',{'message':'success','user':request.receiverId});
    
  }

  if(request.user.details.role == 'user'){
    var random=Math.floor((Math.random() * 1000000) + 1);;
    console.log(request);
     var chat = new Chat();
          chat.messageId=random;
          chat.message=request.message;
          chat.senderId=request.user.details.username;
          chat.receiverId=request.receiverId;
          chat.manager=request.receiverId;
          chat.user=request.user.details.username;
          chat.time=new Date()
          chat.visible=true;
          chat.status=false;
          chat.deleted=false;
          chat.type='string';
          chat.visiblebymanager=false;
          chat.visiblebyuser=false;
          chat.createdBy=request.user.details.username;
          chat.save(function(err, chat){
            if(err) logger.debug(err);
          });
     pushIndividualMessage(io, socket, request);
    socket.emit('get-create-chat-success',{'message':'success','user':request.user.details.username});

  }

 } 

 function pushIndividualMessage(io, socket, request){

 User.find({'manager':request.user.details.manager,role:'partner'}, function(err, dbAdmin){
  if(!dbAdmin)return;
  for(var i=0;i<dbAdmin.length;i++)
  {
   Pushnotification.findOne({username:dbAdmin[i].username}, function(err, allmessage){
     

    if(!allmessage)return;
     arr=[];
     console.log(allmessage);
    if(allmessage)
    {
      var stringId=allmessage.token;
      arr.push(stringId); 
    }
    
       

 var data = { 
    app_id: "a9cf529a-687f-4545-a832-ffbcd21b64f6",
    contents: {"en": request.message},
    headings: {"en": 'From: '+request.user.details.username},
    big_picture : "https://blog.taskpigeon.co/wp-content/uploads/2017/06/Advanced-Email-Notifications-Task-Pigeon.jpg",
    url    : "",
    
    include_player_ids:arr,
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
      //socket.emit('push-message-success', {'message':'push message set successfully'});
    });
  });
  
  req.on('error', function(e) {
    console.log("ERROR:");
    //socket.emit('push-message-success', {'message':'push message set successfully'});
    console.log(e);
  });
  
  req.write(JSON.stringify(data));
  req.end();


 });
 }
  
  });
  Pushnotification.findOne({username:request.user.details.manager}, function(err, allmessage){
     

    if(!allmessage)return;
     arr=[];
     console.log(allmessage);
    if(allmessage)
    {
      var stringId=allmessage.token;
      arr.push(stringId); 
    }
    
       

 var data = { 
    app_id: "a9cf529a-687f-4545-a832-ffbcd21b64f6",
    contents: {"en": request.message},
    headings: {"en": 'From: '+request.user.details.username},
    big_picture : "https://blog.taskpigeon.co/wp-content/uploads/2017/06/Advanced-Email-Notifications-Task-Pigeon.jpg",
    url    : "",
    
    include_player_ids:arr,
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
      //socket.emit('push-message-success', {'message':'push message set successfully'});
    });
  });
  
  req.on('error', function(e) {
    console.log("ERROR:");
    //socket.emit('push-message-success', {'message':'push message set successfully'});
    console.log(e);
  });
  
  req.write(JSON.stringify(data));
  req.end();


 });

 }   
 


 module.exports.getChats = function(io, socket, request){
  if(!request) return;
  if(!request.user) return;
  logger.info("get Chat: request="+JSON.stringify(request));
 
  if(request.user.details.role == 'manager'){
    
     Chat.find(request.filter, function(err, data){
      if(err) logger.error(err);
      

      socket.emit('get-chats-success',{'data':data,'manager':request.user.details.username});
    });
  }

  if(request.user.details.role == 'user'){
    
     Information.find(request.filter, function(err, data){
      if(err) logger.error(err);
       

      socket.emit('get-chats-success',{'data':data,'manager':request.user.details.username});

      Chat.find(request.filter, function(err, datas){
      if(err) logger.error(err);
      

      socket.emit('get-chat-count-success',{'data':datas,'manager':request.user.details.username});
    });
    });
  }
 } 

 module.exports.getChatStatus = function(io, socket, request){

   if(!request) return;
  if(!request.user) return;
  logger.info("getChatStatus: request="+JSON.stringify(request));
 
  if(request.user.details.role == 'manager'){
  
      Chat.updateMany({manager:request.user.details.username},
          {$set:{
            status:true,
          }}, function(err, chat){
            console.log(chat);
            if(err){
              logger.debug(err);
            }
           
          });
  }

  if(request.user.details.role == 'user'){
  
      Chat.updateMany({user:request.user.details.username},
          {$set:{
            status:true,
          }}, function(err, chat){
            console.log(chat);
            if(err){
              logger.debug(err);
            }
           
          });
  }
}



 module.exports.getChat = function(io, socket, request){
  if(!request) return;
  if(!request.user) return;
  logger.info("get Chat: request="+JSON.stringify(request));
 
  if(request.user.details.role == 'manager'){
    
     Chat.find(request.filter, function(err, data){
      if(err) logger.error(err);
      

      socket.emit('get-chat-success',{'data':data,'manager':request.user.details.username});
    });
  }

  if(request.user.details.role == 'user'){
    
     Chat.find(request.filter, function(err, data){
      if(err) logger.error(err);
      

      socket.emit('get-chat-success',{'data':data,'manager':request.user.details.username});
    });


  }
 } 

 module.exports.getUserList = function(io, socket, request){

 } 


 var storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, './uploads/');
  },

  filename: function (req, file, cb) {
    let originalname = file.originalname;
    
    let extension = originalname.split(".");
    filename = Date.now() + "." + extension[extension.length - 1];


    cb(null, filename);
  },
});


var fileFilter = (req, file, cb) => {
  if (file.mimetype == 'image/jpeg' || file.mimetype == 'image/png') {
    cb(null, true);
  } else {
    cb(null, false);
  }
}

const upload = multer({ storage : storage, fileFilter :fileFilter }).single('image');

 
module.exports.profilePictureUpload = (req, res) => {
  try {
   
    upload(req, res,(error) =>{
    if(error){
     

      res.send({data : {}, success : false, error, message : "file upload error" });
    }
    else{
       var random=Math.floor((Math.random() * 1000000) + 1);;
     
       var username=req.body.username;
       var manager=req.body.receiverId;
        var role=req.body.role;
        if(role=='manager')
        {
      var manager1=req.body.username;
      var username1=req.body.receiverId;
      console.log(role);
        }
        else
        {
      var manager1=req.body.receiverId;
      var username1=req.body.username;
        }
     var random=Math.floor((Math.random() * 1000000) + 1);;
     
     var chat = new Chat();
          chat.messageId=random;
          chat.message='';
          chat.senderId=username;
          chat.receiverId=manager;
          chat.manager=manager1;
          chat.user=username1;
          chat.time=new Date();
          chat.visible=true;
          chat.deleted=false;
          chat.type='string';
          chat.visiblebymanager=false;
          chat.status=false;
          chat.visiblebyuser=false;
          chat.image=req.file.filename;
          chat.createdBy=username;
          chat.save(function(err, chat){
            console.log(chat);
            if(err) logger.debug(err);
          }); 
     res.send({ message: 'Image Upload', success: true }).status(201);
    }
  });
  
   
  }
  catch (error) {
   // console.log(error);
    res.send({ message: "file upload error", success: true }).status(203);
  }
}
  



