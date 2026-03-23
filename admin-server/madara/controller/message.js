// required modules
var mongoose = require('mongoose');
var logger = require('log4js').getLogger();
const { ObjectId } = require('mongodb');
var requestUrl = require("request");
var jwt = require('jsonwebtoken');
const myEnv = require('dotenv').config();

/////// ----- Used Comman Helpers ---- //////
const Helper = require('../controller/helper')

var multer = require('multer');
var Login = mongoose.model('Login');
var User = mongoose.model('User');
var Message = mongoose.model('Message');
var Pushnotification = mongoose.model('Pushnotification');

//var admin = require('firebase-admin');
var path = require('path');
var serviceAccount = path.resolve('./serviceKey.json')


module.exports.createMessage = async function (req, res) {
  try {
    console.log(req.body)
    let decoded = jwt.verify(req.token, myEnv.parsed.SECRET);
    let { userId } = jwt.decode(req.token);
    let dbAdmin = await User.findOne({ _id: userId, token: req.token });
    if (!dbAdmin) return res.send({ success: false, logout: true, message: "Token Invalid. Please login in again." });
    if (dbAdmin.token != req.token) return res.send({ success: false, logout: true, message: "Token Invalid. Please login in again." });

    Message.findOne({ deleted: false, visible: true, createdBy: userId, type: 'ADMIN' }).exec(function (err, getMessage) {
      if (getMessage) {
        const update = {
          message: req.body.message,
        };
        Message.findOneAndUpdate({ _id: getMessage._id },
          update, function (err, docs) {
            res.json({ response: docs, success: true, "message": "Message Succes" });
          })

      } else {
        var message = new Message();
        message.messageId = Math.floor(Date.now()) + '';
        message.message = req.body.message;
        message.time = new Date();
        message.visible = true;
        message.deleted = false;
        message.type = 'ADMIN';
        message.createdBy = userId;
        message.save(function (err, raw) {
          logger.error(err);
          res.json({ response: raw, success: true, "message": "Message Create Succes" });
        });
        //  res.json({ response: [], success: false, "message": "" });
      }
    })

  
} catch (err) {
  res.json({ response: [], success: false, "message": "server response error" });
}

};

module.exports.getMessage = async function (req, res) {
  try {
    console.log(req.body)
    let decoded = jwt.verify(req.token, myEnv.parsed.SECRET);
    let { userId } = jwt.decode(req.token);
    let dbAdmin = await User.findOne({ _id: userId, token: req.token });
    if (!dbAdmin) return res.send({ success: false, logout: true, message: "Token Invalid. Please login in again." });
    if (dbAdmin.token != req.token) return res.send({ success: false, logout: true, message: "Token Invalid. Please login in again." });

    Message.findOne({ deleted: false, visible: true, createdBy: userId, type: 'ADMIN' }).sort({ 'time': -1 }).exec(function (err, getUser) {
      if (getUser) {
        res.json({ response: getUser, success: true, "message": "Message Succes" });
      } else {
        res.json({ response: [], success: false, "message": "" });
      }
    });
} catch (err) {
  res.json({ response: [], success: false, "message": "server response success" });
}
};



/////////// ------- End used Apis ----------- //////////////


module.exports.setPushToken = function (io, socket, request) {
  if (!request) return;

  if (!request.user) return;
  var notification = new Pushnotification();

  notification.username = request.user.details.username;
  notification.deleted = false;
  notification.token = request.token;
  notification.manager = 'admin';
  Pushnotification.findOne({ username: request.user.details.username }, function (err, checkExist) {
    console.log(request.token)
    console.log("push test :" + JSON.stringify(checkExist))
    if (!checkExist) {
      notification.save(function (err) {
        logger.error(err);

        socket.emit('create-message-success', notification);
      });
    }
    else {

      if (checkExist.token != request.token) {
        Pushnotification.update({
          username: request.user.details.username
        }, {
          $set: {
            token: request.token
          }
        }, function (err, raw) { });
      }
    }

  });

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

const upload = multer({ storage: storage, fileFilter: fileFilter }).single('image');

module.exports.pushnotification = (req, res) => {
  //console.log(req.body);
  try {

    upload(req, res, (error) => {
      if (error) {


        res.send({ data: {}, success: false, error, message: "file upload error" });
      }
      else {
        console.log(req.file.filename);
        res.send({ data: req.file.filename }).status(201);
      }
    });


  }
  catch (error) {
    // console.log(error);
    res.send({ message: "file upload error", success: true }).status(203);
  }
}





module.exports.pushMessage = function (io, socket, request) {

  if (request.url) {
    // console.log(request.url);
    // console.log(request.url.data);
    var image = 'http://138.68.129.236:3003/' + request.url.data;
  }
  else {
    var image = "https://blog.taskpigeon.co/wp-content/uploads/2017/06/Advanced-Email-Notifications-Task-Pigeon.jpg";
  }

  console.log(image);

  var data = {
    app_id: "a9cf529a-687f-4545-a832-ffbcd21b64f6",
    contents: { "en": request.message },
    headings: { "en": request.message },
    big_picture: image,
    url: "",
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
  var req = https.request(options, function (res) {
    res.on('data', function (data) {
      console.log("Response:");
      console.log(JSON.parse(data));
      socket.emit('push-message-success', { 'message': 'push message set successfully' });
    });
  });

  req.on('error', function (e) {
    console.log("ERROR:");
    socket.emit('push-message-success', { 'message': 'push message set successfully' });
    console.log(e);
  });

  req.write(JSON.stringify(data));
  req.end();




}



function pushIndividualMessage(io, socket, request) {


  Pushnotification.find({ manager: request.user.details.username }, function (err, allmessage) {
    arr = [];
    allmessage.forEach((val) => {
      var stringId = val.token;
      arr.push(stringId);
    })

    var data = {
      app_id: "a9cf529a-687f-4545-a832-ffbcd21b64f6",
      contents: { "en": request.message.result },
      headings: { "en": request.message.result },
      big_picture: "https://blog.taskpigeon.co/wp-content/uploads/2017/06/Advanced-Email-Notifications-Task-Pigeon.jpg",
      url: "",

      include_player_ids: arr,
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
    var req = https.request(options, function (res) {
      res.on('data', function (data) {
        console.log("Response:");
        console.log(JSON.parse(data));
        //socket.emit('push-message-success', {'message':'push message set successfully'});
      });
    });

    req.on('error', function (e) {
      console.log("ERROR:");
      //socket.emit('push-message-success', {'message':'push message set successfully'});
      console.log(e);
    });

    req.write(JSON.stringify(data));
    req.end();


  });

}






module.exports.oldgetMessage = function (io, socket, request) {
  if (!request) return;
  if (!request.user) return;
  if (!request.user.details) return;
  logger.info("getMessage: " + JSON.stringify(request));

  User.findOne({ hash: request.user.key, username: request.user.details.username, role: request.user.details.role, deleted: false, status: 'active' }, function (err, dbUser) {
    if (err) logger.error(err);
    if (!dbUser) {
      logger.error("Invalid Access: " + JSON.stringify(request));
      return;
    }
    if (request.user.details.role == 'user' || request.user.details.role == 'partner') {
      Message.findOne({ deleted: false, visible: true, createdBy: request.user.details.manager, type: 'MANAGER' }).sort({ 'time': -1 }).exec(function (err, msg) {
        socket.emit('get-message-success', msg);
      });
    }
    if (request.user.details.role == 'subadmin') {
      Message.findOne({ deleted: false, visible: true, createdBy: request.user.details.username, type: 'SUBADMIN' }).sort({ 'time': -1 }).exec(function (err, msg) {
        socket.emit('get-message-success', msg);
      });
    }

    if (request.user.details.role == 'master') {
      Message.findOne({ deleted: false, visible: true, createdBy: request.user.details.username, type: 'MASTER' }).sort({ 'time': -1 }).exec(function (err, msg) {
        socket.emit('get-message-success', msg);
      });
    }
    Message.findOne({ deleted: false, visible: true, type: 'ADMIN' }).sort({ 'time': -1 }).exec(function (err, msg) {
      socket.emit('get-message-success', msg);
    });
  });
};
module.exports.getMessages = function (io, socket, request) {
  if (!request) return;
  if (!request.user) return;
  if (!request.user.details) return;
  logger.info("getMessages: " + JSON.stringify(request));

  if (request.user.details.role == 'admin') {
    if (!request.filter || !request.sort) return;
    User.findOne({ hash: request.user.key, username: request.user.details.username, role: 'admin', deleted: false, status: 'active' }, function (err, dbAdmin) {
      if (err) logger.error(err);
      if (!dbAdmin) {
        logger.error("Invalid Access: " + JSON.stringify(request));
        return;
      }
      Message.find(request.filter).sort(request.sort).exec(function (err, messages) {
        if (err) logger.error(err);
        socket.emit('get-messages-success', messages);
      });
    });
  }
  if (request.user.details.role == 'operator') {
    if (!request.filter || !request.sort) return;
    User.findOne({ hash: request.user.key, username: request.user.details.username, role: 'operator', deleted: false, status: 'active' }, function (err, dbAdmin) {
      if (err) logger.error(err);
      if (!dbAdmin) {
        logger.error("Invalid Access: " + JSON.stringify(request));
        return;
      }
      Message.find(request.filter).sort(request.sort).exec(function (err, messages) {
        if (err) logger.error(err);
        socket.emit('get-messages-success', messages);
      });
    });
  }
  if (request.user.details.role == 'manager') {
    if (!request.filter || !request.sort) return;
    User.findOne({ hash: request.user.key, username: request.user.details.username, role: 'manager', deleted: false, status: 'active' }, function (err, dbAdmin) {
      if (err) logger.error(err);
      if (!dbAdmin) {
        logger.error("Invalid Access: " + JSON.stringify(request));
        return;
      }
      request.filter['createdBy'] = request.user.details.username;
      request.filter['deleted'] = false;
      Message.find(request.filter).sort(request.sort).exec(function (err, messages) {
        if (err) logger.error(err);
        socket.emit('get-messages-success', messages);
      });
    });
  }
};
module.exports.oldcreateMessage = function (io, socket, request) {
  if (!request) return;
  if (!request.user || !request.message) return;
  if (!request.user.details) return;
  logger.info("createMessage: " + JSON.stringify(request));

  if (request.user.details.role == 'admin') {
    User.findOne({ hash: request.user.key, username: request.user.details.username, role: 'admin', deleted: false, status: 'active' }, function (err, dbAdmin) {
      if (err) logger.error(err);
      if (!dbAdmin) {
        logger.error("Invalid Access: " + JSON.stringify(request));
        return;
      }
      var message = new Message();
      message.messageId = Math.floor(Date.now()) + '';
      message.message = request.message;
      message.time = new Date();
      message.visible = true;
      message.deleted = false;
      message.type = 'ADMIN';
      message.createdBy = request.user.details.username;
      message.image = request.user.details.image;
      message.save(function (err) {
        logger.error(err);
        socket.emit('create-message-success', message);
      });
    });
  }

  if (request.user.details.role == 'operator') {
    User.findOne({ hash: request.user.key, username: request.user.details.username, role: 'operator', deleted: false, status: 'active' }, function (err, dbAdmin) {
      if (err) logger.error(err);
      if (!dbAdmin) {
        logger.error("Invalid Access: " + JSON.stringify(request));
        return;
      }
      var message = new Message();
      message.messageId = Math.floor(Date.now()) + '';
      message.message = request.message;
      message.time = new Date();
      message.visible = true;
      message.deleted = false;
      message.type = 'ADMIN';
      message.createdBy = request.user.details.username;
      message.image = request.user.details.image;
      message.save(function (err) {
        logger.error(err);
        socket.emit('create-message-success', message);
      });
    });
  }
  if (request.user.details.role == 'manager') {
    User.findOne({ hash: request.user.key, username: request.user.details.username, role: 'manager', deleted: false, status: 'active' }, function (err, dbAdmin) {
      if (err) logger.error(err);
      if (!dbAdmin) {
        logger.error("Invalid Access: " + JSON.stringify(request));
        return;
      }
      var message = new Message();
      message.messageId = Math.floor(Date.now()) + '';
      message.message = request.message;
      message.time = new Date();
      message.visible = true;
      message.deleted = false;
      message.type = 'MANAGER';
      message.createdBy = request.user.details.username;
      message.image = request.user.details.image;
      message.save(function (err) {
        logger.error(err);
        socket.emit('create-message-success', message);
      });
    });
  }
};
module.exports.updateMessage = function (io, socket, request) {
  if (!request) return;
  if (!request.user || !request.message) return;
  if (!request.user.details || !request.message.messageId) return;
  logger.info("updateMessage: " + JSON.stringify(request));

  if (request.user.details.role == 'admin') {
    User.findOne({ hash: request.user.key, username: request.user.details.username, role: 'admin', deleted: false, status: 'active' }, function (err, dbAdmin) {
      if (err) logger.error(err);
      if (!dbAdmin) {
        logger.error("Invalid Access: " + JSON.stringify(request));
        return;
      }

      Message.update({ messageId: request.message.messageId }, request.message, function (err, raw) {
        if (err) logger.error(err);
        socket.emit('update-message-success', request.message);
      });
    });
  }

  if (request.user.details.role == 'operator') {
    User.findOne({ hash: request.user.key, username: request.user.details.username, role: 'operator', deleted: false, status: 'active' }, function (err, dbAdmin) {
      if (err) logger.error(err);
      if (!dbAdmin) {
        logger.error("Invalid Access: " + JSON.stringify(request));
        return;
      }
      Message.update({ messageId: request.message.messageId }, request.message, function (err, raw) {
        if (err) logger.error(err);
        socket.emit('update-message-success', request.message);
      });
    });
  }
  if (request.user.details.role == 'manager') {
    User.findOne({ hash: request.user.key, username: request.user.details.username, role: 'manager', deleted: false, status: 'active' }, function (err, dbAdmin) {
      if (err) logger.error(err);
      if (!dbAdmin) {
        logger.error("Invalid Access: " + JSON.stringify(request));
        return;
      }
      Message.update({ messageId: request.message.messageId, createdBy: request.user.details.username, deleted: false }, request.message, function (err, raw) {
        if (err) logger.error(err);
        socket.emit('update-message-success', request.message);
      });
    });
  }
};
