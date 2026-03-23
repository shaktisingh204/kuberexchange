const router = require('express').Router();
const path = require('path');
var multer  =   require('multer'); 
const jwt = require('jsonwebtoken');
const myEnv = require('dotenv').config();

const Helper = require("../controller/helper");


const userHandler = require('../controller/userController');
var rootHndl =   require('../controller/casinotransfer.js');
var gameHndl =   require('../controller/game-all.js');
var marketHndl = require('../controller/market.js');
var messageHndl = require('../controller/message.js');

const storage = multer.diskStorage({
    destination: function(req, file, cb) {
        cb(null, '../admin-server/uploads/screenshot/');
    },
   
    filename: function(req, file, cb) {
        cb(null, file.fieldname + '-' + Date.now() + path.extname(file.originalname));
    }
});
var upload = multer({ storage: storage, limits: { fileSize: 25 * 1024 * 1024, fieldSize: 25 * 1024 * 1024 } })




//////----Qtech EndPoints------/////
router.get('/accounts/:playerId/session', rootHndl.verifySession);
router.get('/accounts/:playerId/balance', rootHndl.ngetBalance);
router.post('/transactions/rollback', rootHndl.rollback);
router.post('/bonus/reward', rootHndl.reward);
router.post('/transactions', rootHndl.transactions);

////////// ------ Lotus (Poker)------////////
router.post('/api/poker/auth/', rootHndl.pokerAuth);
router.post('/api/poker/exposure/', rootHndl.pokerExposure);
router.post('/api/poker/results/', rootHndl.pokerResults);
router.post('/api/poker/refund/', rootHndl.pokerRefund);

/////////--------User Api--------------//////////

////////------ Casino App Apis ---------/////////////
// router.post('/api/loginOtp', upload.none(), userHandler.loginOtp);
router.post('/api/getSetting', upload.none(), userHandler.getSetting);
// router.get('api/getPaymentMethod', userHandler.getPaymentMethod);

// router.post('/api/getSetting',upload.any(),Helper.verifyToken,(req, res, next)=>{  
//     // console.log(req)
//     jwt.verify(req.token,myEnv.parsed.SECRET,(err,authData)=>{  
//         if(err){  
//             res.sendStatus(403);  
//         }else{  
//             userHandler.getSetting(req, res, next); 
//         }  
//     });  
//   });
  
  
router.get('/api/getPaymentMethod',upload.any(),Helper.verifyToken,(req, res, next)=>{  
    // console.log(req)
    jwt.verify(req.token,myEnv.parsed.SECRET,(err,authData)=>{  
        if(err){  
            res.sendStatus(403);  
        }else{  
            userHandler.getPaymentMethod(req, res, next); 
        }  
    });  
});

// router.post('/api/depositPayment/:token', upload.none(), userHandler.depositPayment);
router.post('/api/depositPayment',upload.single("image"),Helper.verifyToken,(req, res, next)=>{  
    // console.log(req)
    jwt.verify(req.token,myEnv.parsed.SECRET,(err,authData)=>{  
        if(err){  
            res.sendStatus(403);  
        }else{  
            userHandler.depositPayment(req, res, next); 
        }  
    });  
});

// router.post('/updateDeviceId', upload.none(), userHandler.updateDeviceId);
router.post('/api/updateDeviceId',upload.any(),Helper.verifyToken,(req, res, next)=>{  
    // console.log(req)
    jwt.verify(req.token,myEnv.parsed.SECRET,(err,authData)=>{  
        if(err){  
            res.sendStatus(403);  
        }else{  
            userHandler.updateDeviceId(req, res, next); 
        }  
    });  
});

router.get('/api/getwithdrawnMethod',upload.any(),Helper.verifyToken,(req, res, next)=>{  
    // console.log(req)
    jwt.verify(req.token,myEnv.parsed.SECRET,(err,authData)=>{  
        if(err){  
            res.sendStatus(403);  
        }else{  
            userHandler.getwithdrawnMethod(req, res, next); 
        }  
    });  
});

// router.post('/api/withdrawalMethod/:token', upload.none(), userHandler.withdrawalMethod);
router.post('/api/withdrawalMethod',upload.any(),Helper.verifyToken,(req, res, next)=>{  
    // console.log(req)
    jwt.verify(req.token,myEnv.parsed.SECRET,(err,authData)=>{  
        if(err){  
            res.sendStatus(403);  
        }else{  
            userHandler.withdrawalMethod(req, res, next); 
        }  
    });  
});

// router.get('api/transactions', upload.none(), userHandler.getPayment);
router.post('/api/transactions',upload.any(),Helper.verifyToken,(req, res, next)=>{  
    // console.log(req)
    jwt.verify(req.token,myEnv.parsed.SECRET,(err,authData)=>{  
        if(err){  
            res.sendStatus(403);  
        }else{  
            userHandler.getPayment(req, res, next); 
        }  
    });  
});

// router.post('/gettransactionById/:token', upload.none(),  userHandler.gettransactionById);
router.post('/api/gettransactionById',upload.any(),Helper.verifyToken,(req, res, next)=>{  
    // console.log(req)
    jwt.verify(req.token,myEnv.parsed.SECRET,(err,authData)=>{  
        if(err){  
            res.sendStatus(403);  
        }else{  
            userHandler.gettransactionById(req, res, next); 
        }  
    });  
});
// router.post('/api/withdrawalPayment/:token', upload.none(), userHandler.withdrawalPayment);
router.post('/api/withdrawalPayment',upload.any(),Helper.verifyToken,(req, res, next)=>{  
    // console.log(req)
    jwt.verify(req.token,myEnv.parsed.SECRET,(err,authData)=>{  
        if(err){  
            res.sendStatus(403);  
        }else{  
            userHandler.withdrawalPayment(req, res, next); 
        }  
    });  
});

// router.put('/deleteWithdrawlMethod/:token', upload.none(),  userHandler.deleteWithdrawlMethod);
router.put('/api/deleteWithdrawlMethod',upload.any(),Helper.verifyToken,(req, res, next)=>{  
    // console.log(req)
    jwt.verify(req.token,myEnv.parsed.SECRET,(err,authData)=>{  
        if(err){  
            res.sendStatus(403);  
        }else{  
            userHandler.deleteWithdrawlMethod(req, res, next); 
        }  
    });  
});

router.get('/api/HomeGames', rootHndl.HomeGames);
router.get('/api/getBanner', userHandler.getAllBanner);
// router.post('/api/providerGames', gameHndl.providerGames);

router.post('/api/providerGames',upload.any(),Helper.verifyToken,(req, res, next)=>{  
    jwt.verify(req.token,myEnv.parsed.SECRET,(err,authData)=>{  
        if(err){  
            res.sendStatus(403);  
        }else{  
            gameHndl.providerGames(req, res, next); 
        }  
    });  
});

router.post('/api/singleGame',upload.any(),Helper.verifyToken,(req, res, next)=>{  
    // console.log(req)
    jwt.verify(req.token,myEnv.parsed.SECRET,(err,authData)=>{  
        if(err){  
            res.sendStatus(403);  
        }else{  
            gameHndl.singleGame(req, res, next); 
        }  
    });  
});

// router.post('/api/singleGame', gameHndl.singleGame);
// router.get('/api/HomeGames', gameHndl.HomeGames);


// router.post('/api/updateButton', rootHndl.updateButton);
router.post('/api/updateButton',upload.any(),Helper.verifyToken,(req, res, next)=>{  
    jwt.verify(req.token,myEnv.parsed.SECRET,(err,authData)=>{  
        if(err){  
            res.sendStatus(403);  
        }else{  
            rootHndl.updateButton(req, res, next); 
        }  
    });  
});

// router.post('/api/getStackButton', rootHndl.getStackButton);
router.post('/api/getStackButton',upload.any(),Helper.verifyToken,(req, res, next)=>{  
    jwt.verify(req.token,myEnv.parsed.SECRET,(err,authData)=>{  
        if(err){  
            res.sendStatus(403);  
        }else{  
            rootHndl.getStackButton(req, res, next); 
        }  
    });  
});

// routes

router.post('/api/getUserDetails',upload.any(),Helper.verifyToken,(req, res, next)=>{  
    jwt.verify(req.token,myEnv.parsed.SECRET,(err,authData)=>{  
        if(err){  
            res.sendStatus(403);  
        }else{  
            userHandler.getUserDetails(req, res, next); 
        }  
    });  
});

router.post('/api/razorPayStatus',upload.any(),Helper.verifyToken,(req, res, next)=>{  
    jwt.verify(req.token,myEnv.parsed.SECRET,(err,authData)=>{  
        if(err){  
            res.sendStatus(403);  
        }else{  
            userHandler.razorPayStatus(req, res, next); 
        }  
    });  
});

router.post('/api/getMarketBet',upload.any(),Helper.verifyToken,(req, res, next)=>{  
    // console.log(req)
    jwt.verify(req.token,myEnv.parsed.SECRET,(err,authData)=>{  
        if(err){  
            res.sendStatus(403);  
        }else{  
            marketHndl.getMarketBet(req, res, next); 
        }  
    });  
  });

  router.post('/api/getCasinoReport',upload.any(),Helper.verifyToken,(req, res, next)=>{  
    // console.log("userbetlock",req)
    jwt.verify(req.token,myEnv.parsed.SECRET,(err,authData)=>{  
        if(err){  
            res.sendStatus(403);  
        }else{  
            marketHndl.getCasinoReport(req, res, next); 
        }  
    });  
  });

  router.post('/api/getUserEvenets',upload.any(),Helper.verifyToken,(req, res, next)=>{  
    // console.log(req)
    jwt.verify(req.token,myEnv.parsed.SECRET,(err,authData)=>{  
        if(err){  
            res.sendStatus(403);  
        }else{  
            userHandler.getUserEvenets(req, res, next); 
        }  
    });  
  });

  router.post('/api/getMessage',upload.any(),Helper.verifyToken,(req, res, next)=>{  
    // console.log("userbetlock",req)
    jwt.verify(req.token,myEnv.parsed.SECRET,(err,authData)=>{  
        if(err){  
            res.sendStatus(403);  
        }else{  
          messageHndl.getMessage(req, res, next); 
        }  
    });  
  });

  router.get('/api/getNotification',upload.any(),Helper.verifyToken,(req, res, next)=>{  
    // console.log("userbetlock",req)
    jwt.verify(req.token,myEnv.parsed.SECRET,(err,authData)=>{  
        if(err){  
            res.sendStatus(403);  
        }else{  
            userHandler.getNotification(req, res, next); 
        }  
    });  
  });

  // router.get('/getNotification/:token',  userHandler.getNotification);

// router.get('/getwithdrawnMethod',  userHandler.getwithdrawnMethod);

// router.post('/verifyNumber', upload.none(), userHandler.verifyNumber);

// router.post('/verifyOtp', upload.none(), userHandler.verifyOtp);

// router.post('/updateStatus', upload.none(), userHandler.updateStatus);

// router.post('/register', upload.none(), userHandler.register);

// router.post('/login', upload.none(), userHandler.login);



// router.post('/verifyloginOtp', upload.none(), userHandler.verifyloginOtp);

// router.post('/forgotPassword', upload.none(), userHandler.forgotPassword);

// router.post('/updatePassword', upload.none(), userHandler.updatePassword);

// router.post('/getSite/:token', upload.none(), userHandler.getSite);







// router.post('/createMysites/:token', upload.none(), userHandler.createMysites);

// router.get('/getMysites/:token', upload.none(), userHandler.getMysites);

// router.get('/getUser/:token', upload.none(), userHandler.getUser);



// router.put('/prefferdWithdrawn/:token', upload.none(), userHandler.prefferdWithdrawn);

// router.get('/getPrefferedWithdrawl/:token',  userHandler.getPrefferedWithdrawl);

// router.post('/getsitesById/:token', upload.none(),  userHandler.getsitesById);



// router.get('/getNotification/:token',  userHandler.getNotification);

// router.put('/deleteWithdrawlMethod/:token', upload.none(),  userHandler.deleteWithdrawlMethod);

// router.post('/getmysiteTransaction/:token', upload.none(),  userHandler.getmysiteTransaction);

// router.post('/depositInsite/:token', upload.none(),  userHandler.depositInsite);

// router.post('/withdrawalInsites/:token', upload.none(),  userHandler.withdrawalInsites);

// router.get('/pendingtransactions/:token', upload.none(), userHandler.getpendingPayment);

// router.post('/getMysitesByID/:token', upload.none(), userHandler.getMysitesByID);

// router.put('/updatewithdrawalMethod/:token', upload.none(), userHandler.updatewithdrawalMethod);

// router.put('/cancelWithdrawl/:token', upload.none(), userHandler.cancelWithdrawl);

// router.get('/getUserByToken/:token', upload.none(), userHandler.getUserByToken);

// router.post('/userlogin', upload.none(), userHandler.userlogin);

// router.post('/getManager/:token', upload.none(), userHandler.getManager);

module.exports = router;