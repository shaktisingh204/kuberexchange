const router = require('express').Router();
const userHandler = require('../controller/userController');
require("dotenv").config();
const path = require('path');
var multer  =   require('multer'); 
console.log("user route",process.env.ImageUrl)
const storage = multer.diskStorage({
    destination: function(req, file, cb) {
        cb(null, 'http://165.22.223.230/uploads/screenshot/');
    },
   
    filename: function(req, file, cb) {
        cb(null, file.fieldname + '-' + Date.now() + path.extname(file.originalname));
    }
});
   
var upload = multer({ storage: storage, limits: { fileSize: 25 * 1024 * 1024, fieldSize: 25 * 1024 * 1024 } })

// routes

// router.post('/api/loginOtp', upload.none(), userHandler.loginOtp);

router.get('/getPaymentMethod/:token', userHandler.getPaymentMethod);

router.get('/getwithdrawnMethod/:token',  userHandler.getwithdrawnMethod);

router.post('/depositPayment/:token', upload.none(), userHandler.depositPayment);

router.post('/withdrawalMethod/:token', upload.none(), userHandler.withdrawalMethod);

router.post('/withdrawalPayment/:token', upload.none(), userHandler.withdrawalPayment);

router.get('/transactions/:token', userHandler.getPayment);

router.post('/gettransactionById/:token',  userHandler.gettransactionById);

router.put('/deleteWithdrawlMethod/:token', userHandler.deleteWithdrawlMethod);

// router.post('/verifyNumber', upload.none(), userHandler.verifyNumber);

// router.post('/verifyOtp', upload.none(), userHandler.verifyOtp);

// router.post('/updateStatus', upload.none(), userHandler.updateStatus);

// router.post('/register', upload.none(), userHandler.register);

// router.post('/login', upload.none(), userHandler.login);



// router.post('/verifyloginOtp', upload.none(), userHandler.verifyloginOtp);

// router.post('/forgotPassword', upload.none(), userHandler.forgotPassword);

// router.post('/updatePassword', upload.none(), userHandler.updatePassword);

// router.post('/getSite/:token', upload.none(), userHandler.getSite);






// router.get('/transactions/:token', upload.none(), userHandler.getPayment);

// router.post('/createMysites/:token', upload.none(), userHandler.createMysites);

// router.get('/getMysites/:token', upload.none(), userHandler.getMysites);

// router.get('/getUser/:token', upload.none(), userHandler.getUser);





// router.put('/prefferdWithdrawn/:token', upload.none(), userHandler.prefferdWithdrawn);

// router.get('/getPrefferedWithdrawl/:token',  userHandler.getPrefferedWithdrawl);

// router.post('/getsitesById/:token', upload.none(),  userHandler.getsitesById);



// router.get('/getNotification/:token',  userHandler.getNotification);



// router.post('/getmysiteTransaction/:token', upload.none(),  userHandler.getmysiteTransaction);

// router.post('/depositInsite/:token', upload.none(),  userHandler.depositInsite);

// router.post('/withdrawalInsites/:token', upload.none(),  userHandler.withdrawalInsites);

// router.get('/pendingtransactions/:token', upload.none(), userHandler.getpendingPayment);

// router.post('/getMysitesByID/:token', upload.none(), userHandler.getMysitesByID);

// router.put('/updatewithdrawalMethod/:token', upload.none(), userHandler.updatewithdrawalMethod);

// router.put('/cancelWithdrawl/:token', upload.none(), userHandler.cancelWithdrawl);

// router.get('/getUserByToken/:token', upload.none(), userHandler.getUserByToken);

// router.post('/userlogin', upload.none(), userHandler.userlogin);

// router.post('/updateDeviceId', upload.none(), userHandler.updateDeviceId);

// router.post('/getManager/:token', upload.none(), userHandler.getManager);

module.exports = router;