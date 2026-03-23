const router = require('express').Router();
const subadminHandler = require('../controller/subadminController');
const Helper = require("../controller/helper");

const path = require('path');
var multer  =   require('multer'); 
const jwt = require('jsonwebtoken');
const myEnv = require('dotenv').config();

const storage = multer.diskStorage({
    destination: function(req, file, cb) {
        cb(null, './uploads/sites/');
    },
   
    filename: function(req, file, cb) {
        cb(null, file.fieldname + '-' + Date.now() + path.extname(file.originalname));
    }
});

const newstorage = multer.diskStorage({
    destination: function(req, file, cb) {
        cb(null, './uploads/payments/');
    },
   
    filename: function(req, file, cb) {
        cb(null,  Date.now() + path.extname(file.originalname));
    }
});

const scstorage = multer.diskStorage({
    destination: function(req, file, cb) {
        cb(null, './uploads/screenshot/');
    },
   
    filename: function(req, file, cb) {
        cb(null,  Date.now() + path.extname(file.originalname));
    }
});
   
var upload = multer({ storage: storage, limits: { fileSize: 25 * 1024 * 1024 * 1024, fieldSize: 25 * 1024 * 1024 *1024 } });
var newupload = multer({ storage: newstorage, limits: { fileSize: 25 * 1024 * 1024 * 1024, fieldSize: 25 * 1024 * 1024 * 1024 } });
var scupload = multer({ storage: scstorage, limits: { fileSize: 25 * 1024 * 1024 * 1024, fieldSize: 25 * 1024 * 1024 * 1024 } });
// routes

router.post('/login', upload.none(), subadminHandler.login);

// router.post('/createSite/:token', upload.single("image"), subadminHandler.createSite);
router.post('/createSite',upload.single("image"),Helper.verifyToken,(req, res, next)=>{  
    // console.log(req.body,req.file)
    jwt.verify(req.token,myEnv.parsed.SECRET,(err,authData)=>{  
        if(err){  
            res.sendStatus(403);  
        }else{  
            subadminHandler.createSite(req, res, next); 
        }  
    });  
  });

// router.get('/getSite/:token', subadminHandler.getSite);
router.get('/getSite',upload.none(),Helper.verifyToken,(req, res, next)=>{  
    // console.log(req)
    jwt.verify(req.token,myEnv.parsed.SECRET,(err,authData)=>{  
        if(err){  
            res.sendStatus(403);  
        }else{  
            subadminHandler.getSite(req, res, next); 
        }  
    });  
  });

// router.post('/createpaymentMethod/:token', newupload.single("image"), subadminHandler.createpaymentMethod);
router.post('/createpaymentMethod',newupload.single("image"),Helper.verifyToken,(req, res, next)=>{  
    // console.log(req)
    jwt.verify(req.token,myEnv.parsed.SECRET,(err,authData)=>{  
        if(err){  
            res.sendStatus(403);  
        }else{  
            subadminHandler.createpaymentMethod(req, res, next); 
        }  
    });  
  });

  router.post('/createWithdrawalLimit',upload.none(),Helper.verifyToken,(req, res, next)=>{  
    // console.log(req.token,req.body)
    jwt.verify(req.token,myEnv.parsed.SECRET,(err,authData)=>{  
        if(err){  
            res.sendStatus(403);  
        }else{  
            subadminHandler.createWithdrawalLimit(req, res, next); 
        }  
    });  
  });

// router.get('/getPaymentmethod/:token', subadminHandler.getPaymentmethod);
router.get('/getPaymentmethod',newupload.none(),Helper.verifyToken,(req, res, next)=>{  
    // console.log(req)
    jwt.verify(req.token,myEnv.parsed.SECRET,(err,authData)=>{  
        if(err){  
            res.sendStatus(403);  
        }else{  
            subadminHandler.getPaymentmethod(req, res, next); 
        }  
    });  
  });

// router.post('/getUsers/:token', upload.none(), subadminHandler.getUsers);
router.post('/getUsers',upload.none(),Helper.verifyToken,(req, res, next)=>{  
    // console.log(req)
    jwt.verify(req.token,myEnv.parsed.SECRET,(err,authData)=>{  
        if(err){  
            res.sendStatus(403);  
        }else{  
            subadminHandler.getUsers(req, res, next); 
        }  
    });  
  });

// router.post('/getTransactions/:token', upload.none(), subadminHandler.getTransactions);
router.post('/getTransactions',upload.none(),Helper.verifyToken,(req, res, next)=>{  
    // console.log(req)
    jwt.verify(req.token,myEnv.parsed.SECRET,(err,authData)=>{  
        if(err){  
            res.sendStatus(403);  
        }else{  
            subadminHandler.getTransactions(req, res, next); 
        }  
    });  
  });

// router.post('/getDeposit/:token', upload.none(), subadminHandler.getDeposit);
router.post('/getDeposit',upload.none(),Helper.verifyToken,(req, res, next)=>{  
    // console.log(req)
    jwt.verify(req.token,myEnv.parsed.SECRET,(err,authData)=>{  
        if(err){  
            res.sendStatus(403);  
        }else{  
            subadminHandler.getDeposit(req, res, next); 
        }  
    });  
  });

// router.post('/getWithdraw/:token', upload.none(), subadminHandler.getWithdraw);
router.post('/getWithdraw',upload.none(),Helper.verifyToken,(req, res, next)=>{  
    // console.log(req)
    jwt.verify(req.token,myEnv.parsed.SECRET,(err,authData)=>{  
        if(err){  
            res.sendStatus(403);  
        }else{  
            subadminHandler.getWithdraw(req, res, next); 
        }  
    });  
  });

// router.get('/getpendingTransactions/:token', subadminHandler.getpendingTransactions);
router.get('/getpendingTransactions',upload.none(),Helper.verifyToken,(req, res, next)=>{  
    // console.log(req)
    jwt.verify(req.token,myEnv.parsed.SECRET,(err,authData)=>{  
        if(err){  
            res.sendStatus(403);  
        }else{  
            subadminHandler.getpendingTransactions(req, res, next); 
        }  
    });  
  });

// router.get('/getsitesRequest/:token', subadminHandler.getsitesRequest);
router.get('/getsitesRequest',upload.none(),Helper.verifyToken,(req, res, next)=>{  
    // console.log(req)
    jwt.verify(req.token,myEnv.parsed.SECRET,(err,authData)=>{  
        if(err){  
            res.sendStatus(403);  
        }else{  
            subadminHandler.getsitesRequest(req, res, next); 
        }  
    });  
  });
// router.post('/getUserTransactions/:token', upload.none(), subadminHandler.getUserTransactions);
router.post('/getUserTransactions',upload.none(),Helper.verifyToken,(req, res, next)=>{  
    // console.log(req)
    jwt.verify(req.token,myEnv.parsed.SECRET,(err,authData)=>{  
        if(err){  
            res.sendStatus(403);  
        }else{  
            subadminHandler.getUserTransactions(req, res, next); 
        }  
    });  
  });
// router.put('/prefferdPayment/:token', upload.none(), subadminHandler.prefferdPayment);
router.put('/prefferdPayment',upload.none(),Helper.verifyToken,(req, res, next)=>{  
    // console.log(req)
    jwt.verify(req.token,myEnv.parsed.SECRET,(err,authData)=>{  
        if(err){  
            res.sendStatus(403);  
        }else{  
            subadminHandler.prefferdPayment(req, res, next); 
        }  
    });  
  });
// router.put('/deletePaymentMethod/:token', upload.none(),  subadminHandler.deletePaymentMethod);
router.put('/deletePaymentMethod',upload.none(),Helper.verifyToken,(req, res, next)=>{  
    // console.log(req)
    jwt.verify(req.token,myEnv.parsed.SECRET,(err,authData)=>{  
        if(err){  
            res.sendStatus(403);  
        }else{  
            subadminHandler.deletePaymentMethod(req, res, next); 
        }  
    });  
  });
// router.post('/getUserSites/:token', upload.none(), subadminHandler.getUserSites);
router.post('/getUserSites',upload.none(),Helper.verifyToken,(req, res, next)=>{  
    // console.log(req)
    jwt.verify(req.token,myEnv.parsed.SECRET,(err,authData)=>{  
        if(err){  
            res.sendStatus(403);  
        }else{  
            subadminHandler.getUserSites(req, res, next); 
        }  
    });  
  });
// router.post('/getUserSitesTransactions/:token', upload.none(), subadminHandler.getUserSitesTransactions);
router.post('/getUserSitesTransactions',upload.none(),Helper.verifyToken,(req, res, next)=>{  
    // console.log(req)
    jwt.verify(req.token,myEnv.parsed.SECRET,(err,authData)=>{  
        if(err){  
            res.sendStatus(403);  
        }else{  
            subadminHandler.getUserSitesTransactions(req, res, next); 
        }  
    });  
  });
// router.put('/updateSite/:token', upload.single("image"), subadminHandler.updateSite);
router.put('/updateSite',upload.single("image"),Helper.verifyToken,(req, res, next)=>{  
    // console.log(req)
    jwt.verify(req.token,myEnv.parsed.SECRET,(err,authData)=>{  
        if(err){  
            res.sendStatus(403);  
        }else{  
            subadminHandler.updateSite(req, res, next); 
        }  
    });  
  });
// router.put('/updatepaymentMethod/:token', newupload.single("image"), subadminHandler.updatepaymentMethod);
router.put('/updatepaymentMethod',newupload.single("image"),Helper.verifyToken,(req, res, next)=>{  
    // console.log(req)
    jwt.verify(req.token,myEnv.parsed.SECRET,(err,authData)=>{  
        if(err){  
            res.sendStatus(403);  
        }else{  
            subadminHandler.updatepaymentMethod(req, res, next); 
        }  
    });  
  });
// router.put('/deleteSite/:token', upload.none(),  subadminHandler.deleteSite);
router.put('/deleteSite',upload.none(),Helper.verifyToken,(req, res, next)=>{  
    // console.log(req)
    jwt.verify(req.token,myEnv.parsed.SECRET,(err,authData)=>{  
        if(err){  
            res.sendStatus(403);  
        }else{  
            subadminHandler.deleteSite(req, res, next); 
        }  
    });  
  });
// router.post('/getwithdrawnMethod/:token', upload.none(), subadminHandler.getwithdrawnMethod);
router.post('/getwithdrawnMethod',upload.none(),Helper.verifyToken,(req, res, next)=>{  
    // console.log(req)
    jwt.verify(req.token,myEnv.parsed.SECRET,(err,authData)=>{  
        if(err){  
            res.sendStatus(403);  
        }else{  
            subadminHandler.getwithdrawnMethod(req, res, next); 
        }  
    });  
  });
// router.post('/addwithdrawalImage/:token', scupload.array('image'), subadminHandler.addwithdrawalImage);
router.post('/addwithdrawalImage',scupload.array('image'),Helper.verifyToken,(req, res, next)=>{  
    // console.log(req)
    jwt.verify(req.token,myEnv.parsed.SECRET,(err,authData)=>{  
        if(err){  
            res.sendStatus(403);  
        }else{  
            subadminHandler.addwithdrawalImage(req, res, next); 
        }  
    });  
  });
// router.get('/getDetail/:token', subadminHandler.getSubadmin);
router.get('/getDetails',upload.none(),Helper.verifyToken,(req, res, next)=>{  
    // console.log(req)
    jwt.verify(req.token,myEnv.parsed.SECRET,(err,authData)=>{  
        if(err){  
            res.sendStatus(403);  
        }else{  
            subadminHandler.getSubadmin(req, res, next); 
        }  
    });  
  });
// router.post('/findSubadmin', upload.none(), subadminHandler.findSubadmin);
router.post('/findSubadmin',upload.none(),Helper.verifyToken,(req, res, next)=>{  
    // console.log(req)
    jwt.verify(req.token,myEnv.parsed.SECRET,(err,authData)=>{  
        if(err){  
            res.sendStatus(403);  
        }else{  
            subadminHandler.findSubadmin(req, res, next); 
        }  
    });  
  });
// router.post('/loginUsername', upload.none(), subadminHandler.loginUsername);
router.post('/loginUsername',upload.none(),Helper.verifyToken,(req, res, next)=>{  
    // console.log(req)
    jwt.verify(req.token,myEnv.parsed.SECRET,(err,authData)=>{  
        if(err){  
            res.sendStatus(403);  
        }else{  
            subadminHandler.loginUsername(req, res, next); 
        }  
    });  
  });
// router.post('/updatePlayerId', upload.none(), subadminHandler.updatePlayerId);
router.post('/updatePlayerId',upload.none(),Helper.verifyToken,(req, res, next)=>{  
    // console.log(req)
    jwt.verify(req.token,myEnv.parsed.SECRET,(err,authData)=>{  
        if(err){  
            res.sendStatus(403);  
        }else{  
            subadminHandler.updatePlayerId(req, res, next); 
        }  
    });  
  });
// router.post('/depositMannual/:token', upload.none(), subadminHandler.depositMannual);
router.post('/depositMannual',upload.none(),Helper.verifyToken,(req, res, next)=>{  
    // console.log(req)
    jwt.verify(req.token,myEnv.parsed.SECRET,(err,authData)=>{  
        if(err){  
            res.sendStatus(403);  
        }else{  
            subadminHandler.depositMannual(req, res, next); 
        }  
    });  
  });
// router.post('/withdrawalMannual/:token', upload.none(), subadminHandler.withdrawalMannual);
router.post('/withdrawalMannual',upload.none(),Helper.verifyToken,(req, res, next)=>{  
    // console.log(req)
    jwt.verify(req.token,myEnv.parsed.SECRET,(err,authData)=>{  
        if(err){  
            res.sendStatus(403);  
        }else{  
            subadminHandler.withdrawalMannual(req, res, next); 
        }  
    });  
  });
// router.get('/dashboard/activeUsers/:token', upload.none(), subadminHandler.activeUsers);
router.get('/dashboard/activeUsers',upload.none(),Helper.verifyToken,(req, res, next)=>{  
    // console.log(req)
    jwt.verify(req.token,myEnv.parsed.SECRET,(err,authData)=>{  
        if(err){  
            res.sendStatus(403);  
        }else{  
            subadminHandler.activeUsers(req, res, next); 
        }  
    });  
  });

// router.get('/dashboard/weeklyUsers/:token', upload.none(), subadminHandler.weeklyUsers);
router.get('/dashboard/weeklyUsers',upload.none(),Helper.verifyToken,(req, res, next)=>{  
    // console.log(req)
    jwt.verify(req.token,myEnv.parsed.SECRET,(err,authData)=>{  
        if(err){  
            res.sendStatus(403);  
        }else{  
            subadminHandler.weeklyUsers(req, res, next); 
        }  
    });  
  });

// router.get('/dashboard/monthlyUsers/:token', upload.none(), subadminHandler.monthlyUsers);
router.get('/dashboard/monthlyUsers',upload.none(),Helper.verifyToken,(req, res, next)=>{  
    // console.log(req)
    jwt.verify(req.token,myEnv.parsed.SECRET,(err,authData)=>{  
        if(err){  
            res.sendStatus(403);  
        }else{  
            subadminHandler.monthlyUsers(req, res, next); 
        }  
    });  
  });
// router.get('/dashboard/totalUsers/:token', upload.none(), subadminHandler.totalUsers);
router.get('/dashboard/totalUsers',upload.none(),Helper.verifyToken,(req, res, next)=>{  
    // console.log(req)
    jwt.verify(req.token,myEnv.parsed.SECRET,(err,authData)=>{  
        if(err){  
            res.sendStatus(403);  
        }else{  
            subadminHandler.totalUsers(req, res, next); 
        }  
    });  
  });
// router.get('/dashboard/gettodayDeposit/:token', upload.none(), subadminHandler.gettodayDeposit);
router.get('/dashboard/gettodayDeposit',upload.none(),Helper.verifyToken,(req, res, next)=>{  
    // console.log(req)
    jwt.verify(req.token,myEnv.parsed.SECRET,(err,authData)=>{  
        if(err){  
            res.sendStatus(403);  
        }else{  
            subadminHandler.gettodayDeposit(req, res, next); 
        }  
    });  
  });
// router.get('/dashboard/getweeklyDeposit/:token', upload.none(), subadminHandler.getweeklyDeposit);
router.get('/dashboard/getweeklyDeposit',upload.none(),Helper.verifyToken,(req, res, next)=>{  
    // console.log(req)
    jwt.verify(req.token,myEnv.parsed.SECRET,(err,authData)=>{  
        if(err){  
            res.sendStatus(403);  
        }else{  
            subadminHandler.getweeklyDeposit(req, res, next); 
        }  
    });  
  });
// router.get('/dashboard/getmonthlyDeposit/:token', upload.none(), subadminHandler.getmonthlyDeposit);
router.get('/dashboard/getmonthlyDeposit',upload.none(),Helper.verifyToken,(req, res, next)=>{  
    // console.log(req)
    jwt.verify(req.token,myEnv.parsed.SECRET,(err,authData)=>{  
        if(err){  
            res.sendStatus(403);  
        }else{  
            subadminHandler.getmonthlyDeposit(req, res, next); 
        }  
    });  
  });
// router.get('/dashboard/gettotalDeposit/:token', upload.none(), subadminHandler.gettotalDeposit);
router.get('/dashboard/gettotalDeposit',upload.none(),Helper.verifyToken,(req, res, next)=>{  
    // console.log(req)
    jwt.verify(req.token,myEnv.parsed.SECRET,(err,authData)=>{  
        if(err){  
            res.sendStatus(403);  
        }else{  
            subadminHandler.gettotalDeposit(req, res, next); 
        }  
    });  
  });
// router.get('/dashboard/gettodayWithdrawal/:token', upload.none(), subadminHandler.gettodayWithdrawal);
router.get('/dashboard/gettodayWithdrawal',upload.none(),Helper.verifyToken,(req, res, next)=>{  
    // console.log(req)
    jwt.verify(req.token,myEnv.parsed.SECRET,(err,authData)=>{  
        if(err){  
            res.sendStatus(403);  
        }else{  
            subadminHandler.gettodayWithdrawal(req, res, next); 
        }  
    });  
  });
// router.get('/dashboard/getweeklyWithdrawal/:token', upload.none(), subadminHandler.getweeklyWithdrawal);
router.get('/dashboard/getweeklyWithdrawal',upload.none(),Helper.verifyToken,(req, res, next)=>{  
    // console.log(req)
    jwt.verify(req.token,myEnv.parsed.SECRET,(err,authData)=>{  
        if(err){  
            res.sendStatus(403);  
        }else{  
            subadminHandler.getweeklyWithdrawal(req, res, next); 
        }  
    });  
  });
// router.get('/dashboard/getmonthlyWithdrawal/:token', upload.none(), subadminHandler.getmonthlyWithdrawal);
router.get('/dashboard/getmonthlyWithdrawal',upload.none(),Helper.verifyToken,(req, res, next)=>{  
    // console.log(req)
    jwt.verify(req.token,myEnv.parsed.SECRET,(err,authData)=>{  
        if(err){  
            res.sendStatus(403);  
        }else{  
            subadminHandler.getmonthlyWithdrawal(req, res, next); 
        }  
    });  
  });
// router.get('/dashboard/gettotalWithdrawal/:token', upload.none(), subadminHandler.gettotalWithdrawal);
router.get('/dashboard/gettotalWithdrawal',upload.none(),Helper.verifyToken,(req, res, next)=>{  
    // console.log(req)
    jwt.verify(req.token,myEnv.parsed.SECRET,(err,authData)=>{  
        if(err){  
            res.sendStatus(403);  
        }else{  
            subadminHandler.gettotalWithdrawal(req, res, next); 
        }  
    });  
  });
// router.post('/dashboard/getsiteTotal/:token', upload.none(), subadminHandler.getsiteTotal);
router.post('/dashboard/getsiteTotal',upload.none(),Helper.verifyToken,(req, res, next)=>{  
    // console.log(req)
    jwt.verify(req.token,myEnv.parsed.SECRET,(err,authData)=>{  
        if(err){  
            res.sendStatus(403);  
        }else{  
            subadminHandler.getsiteTotal(req, res, next); 
        }  
    });  
  });
// router.post('/userNotification/:token', upload.none(), subadminHandler.userNotification);
router.post('/userNotification',upload.none(),Helper.verifyToken,(req, res, next)=>{  
    // console.log(req)
    jwt.verify(req.token,myEnv.parsed.SECRET,(err,authData)=>{  
        if(err){  
            res.sendStatus(403);  
        }else{  
            subadminHandler.userNotification(req, res, next); 
        }  
    });  
  });
// router.post('/alluserNotification/:token', upload.none(), subadminHandler.alluserNotification);
router.post('/alluserNotification',upload.none(),Helper.verifyToken,(req, res, next)=>{  
    // console.log(req)
    jwt.verify(req.token,myEnv.parsed.SECRET,(err,authData)=>{  
        if(err){  
            res.sendStatus(403);  
        }else{  
            subadminHandler.alluserNotification(req, res, next); 
        }  
    });  
  });
// router.put('/processingPayment/:token', upload.none(), subadminHandler.processingPayment);
router.put('/processingPayment',upload.none(),Helper.verifyToken,(req, res, next)=>{  
    // console.log(req)
    jwt.verify(req.token,myEnv.parsed.SECRET,(err,authData)=>{  
        if(err){  
            res.sendStatus(403);  
        }else{  
            subadminHandler.processingPayment(req, res, next); 
        }  
    });  
  });
// router.post('/searchUsers/:token', upload.none(), subadminHandler.searchUsers);
router.post('/searchUsers',upload.none(),Helper.verifyToken,(req, res, next)=>{  
    // console.log(req)
    jwt.verify(req.token,myEnv.parsed.SECRET,(err,authData)=>{  
        if(err){  
            res.sendStatus(403);  
        }else{  
            subadminHandler.searchUsers(req, res, next); 
        }  
    });  
  });
// router.post('/createUser/:token', upload.none(), subadminHandler.createUser);
router.post('/createUser',upload.none(),Helper.verifyToken,(req, res, next)=>{  
    // console.log(req)
    jwt.verify(req.token,myEnv.parsed.SECRET,(err,authData)=>{  
        if(err){  
            res.sendStatus(403);  
        }else{  
            subadminHandler.createUser(req, res, next); 
        }  
    });  
  });
// router.post('/partnerregister/:token', upload.none(), subadminHandler.partnerregister);
router.post('/partnerregister',upload.none(),Helper.verifyToken,(req, res, next)=>{  
    // console.log(req)
    jwt.verify(req.token,myEnv.parsed.SECRET,(err,authData)=>{  
        if(err){  
            res.sendStatus(403);  
        }else{  
            subadminHandler.partnerregister(req, res, next); 
        }  
    });  
  });
// router.get('/getPartner/:token', subadminHandler.getPartner);
router.get('/getPartner',upload.none(),Helper.verifyToken,(req, res, next)=>{  
    // console.log(req)
    jwt.verify(req.token,myEnv.parsed.SECRET,(err,authData)=>{  
        if(err){  
            res.sendStatus(403);  
        }else{  
            subadminHandler.getPartner(req, res, next); 
        }  
    });  
  });
// router.get('/getWithdrawalMethod/:token', subadminHandler.getWithdrawalMethod);
router.get('/getWithdrawalMethod',upload.none(),Helper.verifyToken,(req, res, next)=>{  
    // console.log(geteq)
    jwt.verify(req.token,myEnv.parsed.SECRET,(err,authData)=>{  
        if(err){  
            res.sendStatus(403);  
        }else{  
            subadminHandler.getWithdrawalMethod(req, res, next); 
        }  
    });  
  });
// router.put('/updateWithdrawalMethod/:token', upload.none(), subadminHandler.updateWithdrawalMethod);
router.put('/updateWithdrawalMethod',upload.none(),Helper.verifyToken,(req, res, next)=>{  
    // console.log(req)
    jwt.verify(req.token,myEnv.parsed.SECRET,(err,authData)=>{  
        if(err){  
            res.sendStatus(403);  
        }else{  
            subadminHandler.updateWithdrawalMethod(req, res, next); 
        }  
    });  
  });
// router.put('/updateuserStatus', upload.none(), subadminHandler.updateuserStatus);
router.put('/updateuserStatus',upload.none(),Helper.verifyToken,(req, res, next)=>{  
    // console.log(req)
    jwt.verify(req.token,myEnv.parsed.SECRET,(err,authData)=>{  
        if(err){  
            res.sendStatus(403);  
        }else{  
            subadminHandler.updateuserStatus(req, res, next); 
        }  
    });  
  });
// router.put('/updatenewuserStatus/:token', upload.none(), subadminHandler.updatenewuserStatus);
router.put('/updatenewuserStatus',upload.none(),Helper.verifyToken,(req, res, next)=>{  
    // console.log(req)
    jwt.verify(req.token,myEnv.parsed.SECRET,(err,authData)=>{  
        if(err){  
            res.sendStatus(403);  
        }else{  
            subadminHandler.updatenewuserStatus(req, res, next); 
        }  
    });  
  });
// router.post('/totalPaymentById/:token', upload.none(), subadminHandler.totalPaymentById);
router.post('/totalPaymentById',upload.none(),Helper.verifyToken,(req, res, next)=>{  
    // console.log(req)
    jwt.verify(req.token,myEnv.parsed.SECRET,(err,authData)=>{  
        if(err){  
            res.sendStatus(403);  
        }else{  
            subadminHandler.totalPaymentById(req, res, next); 
        }  
    });  
  });
// router.post('/adminalluserNotification', upload.single("image"), subadminHandler.adminalluserNotification);
router.post('/adminalluserNotification',upload.single("image"),Helper.verifyToken,(req, res, next)=>{  
    // console.log(req)
    jwt.verify(req.token,myEnv.parsed.SECRET,(err,authData)=>{  
        if(err){  
            res.sendStatus(403);  
        }else{  
            subadminHandler.adminalluserNotification(req, res, next); 
        }  
    });  
  });
module.exports = router;