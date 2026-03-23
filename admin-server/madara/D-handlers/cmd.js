// required modules
var mongoose            = require('mongoose');
var logger              = require('log4js').getLogger();
var exec                = require('child_process').exec;

var Login               = mongoose.model('Login');

function execute(command, callback){
    exec(command, function(error, stdout, stderr){ callback(stdout); });
};

module.exports.getServerDetails = function(io, socket, request){
  execute("pm2 jlist", function(processInfo){
    execute("iostat", function(cpuInfo){
      execute("cat /proc/meminfo", function(memoryInfo){
        socket.emit('get-server-details-success', {processInfo:processInfo, cpuInfo:cpuInfo, memoryInfo:memoryInfo});
      });
    });
  });
};

module.exports.updateServer = function(io, socket, request){
  if(!request) return;
  if(!request.user || !request.server) return;
  if(!request.user.details || !request.server.name || !request.server.operation) return;
  logger.info("updateServer: "+JSON.stringify(request));

  if(request.user.details.role == 'admin'){
    Login.findOne({hash:request.user.key, username:request.user.details.username, role:'admin', deleted:false, status:'active'}, function(err, dbAdmin){
      if(err) logger.error(err);
      if(!dbAdmin){
        logger.error("Invalid Access: "+JSON.stringify(request));
        return;
      }
    });
    var command = "pm2 "+request.server.operation+" "+request.server.name;
    execute(command, function(commandOutput){
      socket.emit('update-server-success', commandOutput);
    });
  }
};
