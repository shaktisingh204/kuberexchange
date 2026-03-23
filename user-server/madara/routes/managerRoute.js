const router = require('express').Router();
const managerHandler = require('../controller/managerController');

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
   
var upload = multer({ storage: storage })

// routes
router.post('/login', upload.none(), managerHandler.login);

router.get('/getSite/:token', managerHandler.getSite);

module.exports = router;