const router = require('express').Router();
const subadminHandler = require('../controller/subadminController');

const path = require('path');
var multer  =   require('multer'); 

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

router.post('/createSite/:token', upload.single("image"), subadminHandler.createSite);

router.get('/getSite/:token', subadminHandler.getSite);

router.post('/createpaymentMethod/:token', newupload.single("image"), subadminHandler.createpaymentMethod);

router.get('/getPaymentmethod/:token', subadminHandler.getPaymentmethod);

router.post('/getUsers/:token', upload.none(), subadminHandler.getUsers);

router.post('/getTransactions/:token', upload.none(), subadminHandler.getTransactions);

router.post('/getDeposit/:token', upload.none(), subadminHandler.getDeposit);

router.post('/getWithdraw/:token', upload.none(), subadminHandler.getWithdraw);

router.get('/getpendingTransactions/:token', subadminHandler.getpendingTransactions);

router.get('/getsitesRequest/:token', subadminHandler.getsitesRequest);

router.post('/getUserTransactions/:token', upload.none(), subadminHandler.getUserTransactions);

router.put('/prefferdPayment/:token', upload.none(), subadminHandler.prefferdPayment);

router.put('/deletePaymentMethod/:token', upload.none(),  subadminHandler.deletePaymentMethod);

router.post('/getUserSites/:token', upload.none(), subadminHandler.getUserSites);

router.post('/getUserSitesTransactions/:token', upload.none(), subadminHandler.getUserSitesTransactions);

router.put('/updateSite/:token', upload.single("image"), subadminHandler.updateSite);

router.put('/updatepaymentMethod/:token', newupload.single("image"), subadminHandler.updatepaymentMethod);

router.put('/deleteSite/:token', upload.none(),  subadminHandler.deleteSite);

router.post('/getwithdrawnMethod/:token', upload.none(), subadminHandler.getwithdrawnMethod);

router.post('/addwithdrawalImage/:token', scupload.array('image'), subadminHandler.addwithdrawalImage);

router.get('/getDetail/:token', subadminHandler.getSubadmin);

router.post('/findSubadmin', upload.none(), subadminHandler.findSubadmin);

router.post('/loginUsername', upload.none(), subadminHandler.loginUsername);

router.post('/updatePlayerId', upload.none(), subadminHandler.updatePlayerId);

router.post('/depositMannual/:token', upload.none(), subadminHandler.depositMannual);

router.post('/withdrawalMannual/:token', upload.none(), subadminHandler.withdrawalMannual);

router.get('/dashboard/activeUsers/:token', upload.none(), subadminHandler.activeUsers);

router.get('/dashboard/weeklyUsers/:token', upload.none(), subadminHandler.weeklyUsers);

router.get('/dashboard/monthlyUsers/:token', upload.none(), subadminHandler.monthlyUsers);

router.get('/dashboard/totalUsers/:token', upload.none(), subadminHandler.totalUsers);

router.get('/dashboard/gettodayDeposit/:token', upload.none(), subadminHandler.gettodayDeposit);

router.get('/dashboard/getweeklyDeposit/:token', upload.none(), subadminHandler.getweeklyDeposit);

router.get('/dashboard/getmonthlyDeposit/:token', upload.none(), subadminHandler.getmonthlyDeposit);

router.get('/dashboard/gettotalDeposit/:token', upload.none(), subadminHandler.gettotalDeposit);

router.get('/dashboard/gettodayWithdrawal/:token', upload.none(), subadminHandler.gettodayWithdrawal);

router.get('/dashboard/getweeklyWithdrawal/:token', upload.none(), subadminHandler.getweeklyWithdrawal);

router.get('/dashboard/getmonthlyWithdrawal/:token', upload.none(), subadminHandler.getmonthlyWithdrawal);

router.get('/dashboard/gettotalWithdrawal/:token', upload.none(), subadminHandler.gettotalWithdrawal);

router.post('/dashboard/getsiteTotal/:token', upload.none(), subadminHandler.getsiteTotal);

router.post('/userNotification/:token', upload.none(), subadminHandler.userNotification);

router.post('/alluserNotification/:token', upload.none(), subadminHandler.alluserNotification);

router.put('/processingPayment/:token', upload.none(), subadminHandler.processingPayment);

router.post('/searchUsers/:token', upload.none(), subadminHandler.searchUsers);

router.post('/createUser/:token', upload.none(), subadminHandler.createUser);

router.post('/partnerregister/:token', upload.none(), subadminHandler.partnerregister);

router.get('/getPartner/:token', subadminHandler.getPartner);

router.get('/getWithdrawalMethod/:token', subadminHandler.getWithdrawalMethod);

router.put('/updateWithdrawalMethod/:token', upload.none(), subadminHandler.updateWithdrawalMethod);

router.put('/updateuserStatus', upload.none(), subadminHandler.updateuserStatus);

router.put('/updatenewuserStatus/:token', upload.none(), subadminHandler.updatenewuserStatus);

router.post('/totalPaymentById/:token', upload.none(), subadminHandler.totalPaymentById);

router.post('/adminalluserNotification', upload.single("image"), subadminHandler.adminalluserNotification);

module.exports = router;