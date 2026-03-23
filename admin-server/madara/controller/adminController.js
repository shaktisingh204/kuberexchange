var mongoose = require('mongoose');
var logger = require('log4js').getLogger();

const Admin = require('../models/adminModel');
const SubAdmin = require('../models/subadminModel');
const Site = require('../models/siteModel');
const PaymentMethod = require('../models/paymentmethodModel');
const Manager = require('../models/managerModel');
// const User = require('../models/userModel');
const Payment = require('../models/paymentModel');
const Mysite = require('../models/mysitesModel');
const WithdrawnMethod = require('../models/withdrawnMethodModel');
var User = mongoose.model('User');
// Required Helper Function
const util = require('./util');
const jwt = require('jsonwebtoken');
var request = require('request');


//Admin Register
module.exports.register = (req, res) => {
  try {
    const admin = new Admin({
      username: req.body.username,
      password: util.hashPassword(req.body.password)
    });
    admin.save()
      .then(doc => {
        res.send({ doc, success: true, message: "admin registered" });
      })
      .catch(error => {
        res.send({ error, success: false, message: "DB error in admin register" });
      })
  }
  catch (error) {
    res.send({ error, success: false, message: "Unknown error" });
  }
}

// Admin Login
module.exports.login = (req, res) => {
  try {
    console.log(req.body);
    let { username, password } = req.body;
    if (!username || !password) return res.send({ success: false, message: "missing field/'s" });

    else {
      Admin.findOne({ username: username })
        .then(doc => {
          if (!doc) return res.send({ data: {}, success: false, message: "No such user found" });

          if (!util.comparePassword(doc.password, password)) {
            return res.send({ data: {}, success: false, message: "Incorrect password" });
          }
          else {
            const token = util.generateToken(doc._id);

            const data = { doc, token }
            res.send({ data, success: true, message: "admin login success" });
          }
        })
        .catch(error => {
          console.log(error);
          res.send({ error, success: false, message: "DB error" });
        })
    }
  }
  catch (error) {
    res.send({ error, success: false, message: "unknown error" });
  }
}

//Site Register
module.exports.createSite = async (req, res) => {
  try {
    let { userId } = jwt.decode(req.params.token);
    let admin = await Admin.findOne({ _id: userId });
    if (!admin._id) return res.send({ error, success: false, message: "Please login in again." });

    const site = new Site({
      name: req.body.name,
      url: req.body.url,
      image: req.file.filename,
      demoId: req.body.demoId,
      demoPassword: req.body.demoPassword,
      cricket: req.body.cricket,
      football: req.body.football,
      tennis: req.body.tennis,
      horse_racing: req.body.horse_racing,
      politics: req.body.politics,
      cards: req.body.cards,
      live_casino: req.body.live_casino,
      status: req.body.status,
      type: 'Admin',
      typeId: userId,
      refill: req.body.refill,
      minwithdrawn: req.body.minwithdrawn,
      maxwithdrawn: req.body.maxwithdrawn,
      balance: req.body.balance,
    });
    site.save()
      .then(doc => {
        res.send({ doc, success: true, message: "Site registered" });
      })
      .catch(error => {
        res.send({ error, success: false, message: "DB error in site register" });
      })
  }
  catch (error) {
    res.send({ error, success: false, message: "Unknown error" });
  }
}

// Ger Sites
module.exports.getSite = async (req, res) => {
  try {
    let { userId } = jwt.decode(req.params.token);
    let admin = await Admin.findOne({ _id: userId });
    if (!admin._id) return res.send({ error, success: false, message: "Please login in again." });

    Site.find({ type: 'Admin' })
      .then(doc => {
        res.send({ doc, success: true, message: "Sites get successfully" });
      })
      .catch(error => {
        res.send({ error, success: false, message: "DB error in getting sites" });
      })
  }
  catch (error) {
    res.send({ error, success: false, message: "Unknown error" });
  }
}

//SUb Admin Register
module.exports.subadminregister = async (req, res) => {
  try {
    // let { userId } = jwt.decode(req.params.token);
    // let admin = await Admin.findOne({ _id: userId });
    // if (!admin._id) return res.send({ error, success: false, message: "Please login in again." });

    // var options = {
    //   'method': 'POST',
    //   'url': 'http://159.65.22.20:3006/api/createManager',
    //   'headers': {
    //     'cache-control': 'no-cache',
    //     'content-type': 'application/x-www-form-urlencoded',
    //     'postman-token': '8f153612-4eec-4ed0-12e2-0f0e29ad73c2'
    //   },
    //   form: {
    //     'username': req.body.username,
    //     'password': req.body.password,
    //     'sharing': req.body.sharing
    //   }
    // };
    // request(options, function (error, response) {
    //   let  body = JSON.parse(response.body);
    //   console.log(body);
    //   if (error) {
    //     res.send({ error, success: false, message: "Sub Admin already register" });
    //   } else if (body.error == true) {
    //     res.send({ error, success: false, message: "Sub Admin already register" });
    //   }
    //   else {
      let admin = await SubAdmin.findOne({ username: req.body.username });
      if (admin && admin._id) return res.send({ error:{}, success: false, message: "Manager already registered." });

        const subadmin = new SubAdmin({
          username: req.body.username,
          password: util.hashPassword(req.body.password),
          paisaexchId: req.body.paisaId,
          sharing: req.body.sharing,
          role: 'Manager'
        });
        subadmin.save()
          .then(doc => {
            res.send({ doc, success: true, message: "sub admin registered" });
          })
          .catch(error => {
            res.send({ error, success: false, message: "DB error in sub admin register" });
          })
    //   }
      
    // });

  }
  catch (error) {
    console.log(error);
    res.send({ error, success: false, message: "Unknown error" });
  }
}

// Get Sub Admin
module.exports.getSubadmin = async (req, res) => {
  try {
    let { userId } = jwt.decode(req.params.token);
    let admin = await Admin.findOne({ _id: userId });
    if (!admin._id) return res.send({ error, success: false, message: "Please login in again." });

    SubAdmin.find({})
      .then(doc => {
        res.send({ doc, success: true, message: "Sub Admin get successfully" });
      })
      .catch(error => {
        res.send({ error, success: false, message: "DB error in getting Sub Admin" });
      })
  }
  catch (error) {
    res.send({ error, success: false, message: "Unknown error" });
  }
}

//Manager Register
module.exports.createManager = async (req, res) => {
  try {
    let { userId } = jwt.decode(req.params.token);
    let admin = await Admin.findOne({ _id: userId });
    if (!admin._id) return res.send({ error, success: false, message: "Please login in again." });

    const manager = new Manager({
      firstname: req.body.firstname,
      lastname: req.body.lastname,
      email: req.body.email,
      username: req.body.username,
      password: util.hashPassword(req.body.password)
    });
    manager.save()
      .then(doc => {
        res.send({ doc, success: true, message: "Manager registered" });
      })
      .catch(error => {
        res.send({ error, success: false, message: "DB error in manager register" });
      })
  }
  catch (error) {
    res.send({ error, success: false, message: "Unknown error" });
  }
}

// Get Manager
module.exports.getManager = async (req, res) => {
  try {
    let { userId } = jwt.decode(req.params.token);
    let admin = await Admin.findOne({ _id: userId });
    if (!admin._id) return res.send({ error, success: false, message: "Please login in again." });

    Manager.find({})
      .then(doc => {
        res.send({ doc, success: true, message: "Manager get successfully" });
      })
      .catch(error => {
        res.send({ error, success: false, message: "DB error in getting Manager" });
      })
  }
  catch (error) {
    res.send({ error, success: false, message: "Unknown error" });
  }
}

//Create Payment Method
module.exports.createpaymentMethod = async (req, res) => {
  try {
    let { userId } = jwt.decode(req.params.token);
    let admin = await Admin.findOne({ _id: userId });
    if (!admin._id) return res.send({ error, success: false, message: "Please login in again." });

    let data;
    if (req.body.paymenttype == 'bank') {
      data = {
        type: 'Admin',
        typeId: userId,
        paymenttype: req.body.paymenttype,
        name: req.body.name,
        accnumber: req.body.accnumber,
        ifsc: req.body.ifsc,
        acctype: req.body.acctype,
        image: req.file.filename
      }
    } else {
      data = {
        type: 'Admin',
        typeId: userId,
        paymenttype: req.body.paymenttype,
        name: req.body.name,
        mobile: req.body.mobile,
        upi: req.body.upi,
        image: req.file.filename
      }
    }

    const payment = new PaymentMethod(data);
    payment.save()
      .then(doc => {
        res.send({ doc, success: true, message: "Payment Method saved" });
      })
      .catch(error => {
        res.send({ error, success: false, message: "DB error in saving payment method" });
      })
  }
  catch (error) {
    res.send({ error, success: false, message: "Unknown error" });
  }
}

// Get Payment Method
module.exports.getPaymentmethod = async (req, res) => {
  try {
    let { userId } = jwt.decode(req.params.token);
    let admin = await Admin.findOne({ _id: userId });
    if (!admin._id) return res.send({ error, success: false, message: "Please login in again." });

    PaymentMethod.find({ type: 'Admin' })
      .then(doc => {
        res.send({ doc, success: true, message: "Payment Methods get successfully" });
      })
      .catch(error => {
        res.send({ error, success: false, message: "DB error in getting Peyment Method" });
      })
  }
  catch (error) {
    res.send({ error, success: false, message: "Unknown error" });
  }
}

// Get Users
module.exports.getUsers = async (req, res) => {
  try {
    let { userId } = jwt.decode(req.params.token);
    let admin = await Admin.findOne({ _id: userId });
    if (!admin._id) return res.send({ error, success: false, message: "Please login in again." });

    User.find({}).sort({ createdAt: -1 })
      .then(doc => {
        res.send({ doc, success: true, message: "Users get successfully" });
      })
      .catch(error => {
        res.send({ error, success: false, message: "DB error in getting users" });
      })
  }
  catch (error) {
    res.send({ error, success: false, message: "Unknown error" });
  }
}

// Get User By Id
module.exports.getUserById = async (req, res) => {
  try {
    let { userId } = jwt.decode(req.params.token);
    let admin = await Admin.findOne({ _id: userId });
    if (!admin._id) return res.send({ error, success: false, message: "Please login in again." });

    User.findOne({ _id: req.body.id})
      .then(doc => {
        res.send({ doc, success: true, message: "Users get successfully" });
      })
      .catch(error => {
        res.send({ error, success: false, message: "DB error in getting users" });
      })
  }
  catch (error) {
    res.send({ error, success: false, message: "Unknown error" });
  }
}

// Get Transactions
module.exports.getTransactions = async (req, res) => {
  try {
    let { userId } = jwt.decode(req.params.token);
    let admin = await Admin.findOne({ _id: userId });
    if (!admin._id) return res.send({ error, success: false, message: "Please login in again." });

    Payment.find({ managerType: 'Admin' })
      .then(doc => {
        res.send({ doc, success: true, message: "Transactions get successfully" });
      })
      .catch(error => {
        res.send({ error, success: false, message: "DB error in getting transactions" });
      })
  }
  catch (error) {
    res.send({ error, success: false, message: "Unknown error" });
  }
}

// Get Pending Transactions
module.exports.getpendingTransactions = async (req, res) => {
  try {
    let { userId } = jwt.decode(req.params.token);
    let admin = await Admin.findOne({ _id: userId });
    if (!admin._id) return res.send({ error, success: false, message: "Please login in again." });

    Payment.find({ managerType: 'Admin', status: 'Pending' })
      .then(doc => {
        res.send({ doc, success: true, message: "Transactions get successfully" });
      })
      .catch(error => {
        res.send({ error, success: false, message: "DB error in getting transactions" });
      })
  }
  catch (error) {
    res.send({ error, success: false, message: "Unknown error" });
  }
}

// Get My Sites
module.exports.getsitesRequest = async (req, res) => {
  try {
    let { userId } = jwt.decode(req.params.token);
    let admin = await Admin.findOne({ _id: userId });
    if (!admin._id) return res.send({ error, success: false, message: "Please login in again." });

    Mysite.
      find({ type: 'Admin', status: 'Pending' }).
      populate('sites').
      exec(function (err, data) {
        if (err) return handleError(err);
        res.send({ data: data, success: true, message: "Sites Request get successfully" });
      });


  }
  catch (error) {
    res.send({ error, success: false, message: "Unknown error" });
  }
}

// Get User Transactions
module.exports.getUserTransactions = async (req, res) => {
  try {
    let { userId } = jwt.decode(req.params.token);
    let admin = await Admin.findOne({ _id: userId });
    if (!admin._id) return res.send({ error, success: false, message: "Please login in again." });

    Payment.find({ managerType: 'Admin', userId: req.body.userId })
      .then(doc => {
        res.send({ doc, success: true, message: "Transactions get successfully" });
      })
      .catch(error => {
        res.send({ error, success: false, message: "DB error in getting transactions" });
      })
  }
  catch (error) {
    res.send({ error, success: false, message: "Unknown error" });
  }
}


//Create Withdrawn Method
module.exports.createwithdrawnMethod = async (req, res) => {
  try {
    let { userId } = jwt.decode(req.params.token);
    let admin = await Admin.findOne({ _id: userId });
    if (!admin._id) return res.send({ error, success: false, message: "Please login in again." });

    let data = {
      name: req.body.name,
      type: req.body.type,
      image: req.file.filename,
      withdrawns: []
    }

    const withdrawnMethod = new WithdrawnMethod(data);
    withdrawnMethod.save()
      .then(doc => {
        res.send({ doc, success: true, message: "WithdrawnMethod Method saved" });
      })
      .catch(error => {
        res.send({ error, success: false, message: "DB error in saving withdranwn method" });
      })
  }
  catch (error) {
    res.send({ error, success: false, message: "Unknown error" });
  }
}

// Total Users
module.exports.totalUsers = async (req, res) => {
  try {
    let { userId } = jwt.decode(req.params.token);
    let admin = await Admin.findOne({ _id: userId });
    if (!admin._id) return res.send({ error, success: false, message: "Please login in again." });

    const doc = await User.find({}).sort({ createdAt: -1 });
    res.send({ data: doc.length, success: true, message: "Users get successfully" });

  }
  catch (error) {
    console.log(error);
    res.send({ error, success: false, message: "Unknown error" });
  }
}

// Total Subadmin
module.exports.totalSubadmin = async (req, res) => {
  try {
    let { userId } = jwt.decode(req.params.token);
    let admin = await Admin.findOne({ _id: userId });
    if (!admin._id) return res.send({ error, success: false, message: "Please login in again." });

    const doc = await SubAdmin.find({}).sort({ createdAt: -1 });
    res.send({ data: doc.length, success: true, message: "Subadmins get successfully" });

  }
  catch (error) {
    console.log(error);
    res.send({ error, success: false, message: "Unknown error" });
  }
}
