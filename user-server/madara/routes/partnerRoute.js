const router = require('express').Router();
const partnerHandler = require('../controller/partnerController');

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

router.post('/login', upload.none(), partnerHandler.login);

router.post('/createSite/:token', upload.single("image"), partnerHandler.createSite);

router.get('/getSite/:token', partnerHandler.getSite);

router.post('/createpaymentMethod/:token', newupload.single("image"), partnerHandler.createpaymentMethod);

router.get('/getPaymentmethod/:token', partnerHandler.getPaymentmethod);

router.post('/getUsers/:token', upload.none(), partnerHandler.getUsers);

router.post('/getTransactions/:token', upload.none(), partnerHandler.getTransactions);

router.post('/getDeposit/:token', upload.none(), partnerHandler.getDeposit);

router.post('/getWithdraw/:token', upload.none(), partnerHandler.getWithdraw);

router.get('/getpendingTransactions/:token', partnerHandler.getpendingTransactions);

router.get('/getsitesRequest/:token', partnerHandler.getsitesRequest);

router.post('/getUserTransactions/:token', upload.none(), partnerHandler.getUserTransactions);

router.put('/prefferdPayment/:token', upload.none(), partnerHandler.prefferdPayment);

router.put('/deletePaymentMethod/:token', upload.none(),  partnerHandler.deletePaymentMethod);

router.post('/getUserSites/:token', upload.none(), partnerHandler.getUserSites);

router.post('/getUserSitesTransactions/:token', upload.none(), partnerHandler.getUserSitesTransactions);

router.put('/updateSite/:token', upload.single("image"), partnerHandler.updateSite);

router.put('/updatepaymentMethod/:token', newupload.single("image"), partnerHandler.updatepaymentMethod);

router.put('/deleteSite/:token', upload.none(),  partnerHandler.deleteSite);

router.post('/getwithdrawnMethod/:token', upload.none(), partnerHandler.getwithdrawnMethod);

router.post('/addwithdrawalImage/:token', scupload.array('image'), partnerHandler.addwithdrawalImage);

router.get('/getDetail/:token', partnerHandler.getSubadmin);

router.post('/findSubadmin', upload.none(), partnerHandler.findSubadmin);

router.post('/loginUsername', upload.none(), partnerHandler.loginUsername);

router.post('/updatePlayerId', upload.none(), partnerHandler.updatePlayerId);

router.post('/depositMannual/:token', upload.none(), partnerHandler.depositMannual);

router.post('/withdrawalMannual/:token', upload.none(), partnerHandler.withdrawalMannual);

router.get('/dashboard/activeUsers/:token', upload.none(), partnerHandler.activeUsers);

router.get('/dashboard/weeklyUsers/:token', upload.none(), partnerHandler.weeklyUsers);

router.get('/dashboard/monthlyUsers/:token', upload.none(), partnerHandler.monthlyUsers);

router.get('/dashboard/totalUsers/:token', upload.none(), partnerHandler.totalUsers);

router.get('/dashboard/gettodayDeposit/:token', upload.none(), partnerHandler.gettodayDeposit);

router.get('/dashboard/getweeklyDeposit/:token', upload.none(), partnerHandler.getweeklyDeposit);

router.get('/dashboard/getmonthlyDeposit/:token', upload.none(), partnerHandler.getmonthlyDeposit);

router.get('/dashboard/gettotalDeposit/:token', upload.none(), partnerHandler.gettotalDeposit);

router.get('/dashboard/gettodayWithdrawal/:token', upload.none(), partnerHandler.gettodayWithdrawal);

router.get('/dashboard/getweeklyWithdrawal/:token', upload.none(), partnerHandler.getweeklyWithdrawal);

router.get('/dashboard/getmonthlyWithdrawal/:token', upload.none(), partnerHandler.getmonthlyWithdrawal);

router.get('/dashboard/gettotalWithdrawal/:token', upload.none(), partnerHandler.gettotalWithdrawal);

router.post('/dashboard/getsiteTotal/:token', upload.none(), partnerHandler.getsiteTotal);

router.post('/userNotification/:token', upload.none(), partnerHandler.userNotification);

router.post('/alluserNotification/:token', upload.none(), partnerHandler.alluserNotification);

router.put('/processingPayment/:token', upload.none(), partnerHandler.processingPayment);

router.post('/searchUsers/:token', upload.none(), partnerHandler.searchUsers);

router.post('/createUser/:token', upload.none(), partnerHandler.createUser);

router.put('/updatenewuserStatus/:token', upload.none(), partnerHandler.updatenewuserStatus);

module.exports = router;