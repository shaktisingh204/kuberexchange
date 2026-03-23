const router = require('express').Router();
const adminHandler = require('../controller/adminController');

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
   
var upload = multer({ storage: storage });
var newupload = multer({ storage: newstorage });

// routes
router.post('/register', upload.none(), adminHandler.register);

router.post('/login', upload.none(), adminHandler.login);

router.post('/createSite/:token', upload.single("image"), adminHandler.createSite);

router.get('/getSite/:token', adminHandler.getSite);

router.post('/subadminRegister', upload.none(), adminHandler.subadminregister);

router.get('/getSubadmin/:token', adminHandler.getSubadmin);

router.post('/createManager/:token', upload.none(), adminHandler.createManager);

router.get('/getManager/:token', adminHandler.getManager);

router.post('/createpaymentMethod/:token', newupload.single("image"), adminHandler.createpaymentMethod);

router.get('/getPaymentmethod/:token', adminHandler.getPaymentmethod);

router.get('/getUsers/:token', adminHandler.getUsers);

router.post('/getUserById/:token', adminHandler.getUserById);

router.get('/getTransactions/:token', adminHandler.getTransactions);

router.get('/getpendingTransactions/:token', adminHandler.getpendingTransactions);

router.get('/getsitesRequest/:token', adminHandler.getsitesRequest);

router.post('/getUserTransactions/:token', upload.none(), adminHandler.getUserTransactions);

router.post('/createwithdrawnMethod/:token', upload.single("image"), adminHandler.createwithdrawnMethod);

router.get('/totalUsers/:token', adminHandler.totalUsers);

router.get('/totalSubadmin/:token', adminHandler.totalSubadmin);

module.exports = router;