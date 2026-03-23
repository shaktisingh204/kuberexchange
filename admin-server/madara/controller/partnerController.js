var mongoose = require('mongoose');
var logger = require('log4js').getLogger();

const SubAdmin = require('../models/subadminModel');
const Site = require('../models/siteModel');
const PaymentMethod = require('../models/paymentmethodModel');
// const User = require('../models/userModel');
const Payment = require('../models/paymentModel');
const Mysite = require('../models/mysitesModel');
const WithdrawnMethod = require('../models/withdrawnMethodModel');
const Withdrawal = require('../models/withdrawalModel.js');


var User = mongoose.model('User');

// Required Helper Function
const util = require('./util');
const jwt = require('jsonwebtoken');
const { runInNewContext } = require('vm');
var request = require('request');


// SUb Admin Login
module.exports.login = (req, res) => {
  try {
    let { username, password } = req.body;
    if (!username || !password) return res.send({ success: false, message: "missing field/'s" });

    else {
      SubAdmin.findOne({ username: username })
        .then(doc => {
          if (!doc) return res.send({ data: {}, success: false, message: "No such user found" });

          if (!util.comparePassword(doc.password, password)) {
            return res.send({ data: {}, success: false, message: "Incorrect password" });
          }
          else {
            const token = util.generateToken(doc._id);

            const data = { doc, token }
            res.send({ data, success: true, message: "SubAdmin login success" });
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

// Get SUb Admin
module.exports.getSubadmin = (req, res) => {
  try {

    SubAdmin.findOne({ token: req.params.token })
      .then(doc => {
        if (!doc) return res.send({ data: {}, success: false, message: "No such user found" });

        const token = util.generateToken(doc._id);

        const data = { doc, token }
        res.send({ data, success: true, message: "SubAdmin get success" });

      })
      .catch(error => {
        console.log(error);
        res.send({ error, success: false, message: "DB error" });
      })

  }
  catch (error) {
    res.send({ error, success: false, message: "unknown error" });
  }
}

// Find SUb Admin
module.exports.findSubadmin = (req, res) => {
  try {
    let { username } = req.body;
    if (!username) return res.send({ success: false, message: "missing field/'s" });

    else {
      SubAdmin.findOne({ username: username })
        .then(doc => {
          if (!doc) return res.send({ data: {}, success: false, message: "No such user found" });
          res.send({ doc, success: true, message: "SubAdmin found success" });

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

// SUb Admin Login By Username
module.exports.loginUsername = (req, res) => {
  try {
    let { username } = req.body;
    if (!username) return res.send({ success: false, message: "missing field/'s" });

    else {
      SubAdmin.findOne({ username: username })
        .then(doc => {
          if (!doc) return res.send({ data: {}, success: false, message: "No such user found" });


          const token = util.generateToken(doc._id);

          SubAdmin.updateOne({
            '_id': doc._id
          }, { token: token }, function (err, updateMessage) {
            // success update
          });

          const data = { doc, token }
          res.send({ data, success: true, message: "SubAdmin login success" });

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

// Update SUb Admin PlayerId
module.exports.updatePlayerId = (req, res) => {
  try {
    console.log(req.body);
    let { username, playerId } = req.body;
    if (!username || !playerId) return res.send({ success: false, message: "missing field/'s" });

    else {
      SubAdmin.findOne({ username: username })
        .then(doc => {
          if (!doc) return res.send({ data: {}, success: false, message: "No such user found" });

          SubAdmin.updateOne({
            '_id': doc._id
          }, { playerId: req.body.playerId }, function (err, updateMessage) {
            // success update
          });

          const data = { doc }
          res.send({ data, success: true, message: "PlayerId Update success" });

        })
        .catch(error => {
          console.log(error);
          res.send({ error, success: false, message: "DB error" });
        })
    }
  }
  catch (error) {
    console.log(error);
    res.send({ error, success: false, message: "unknown error" });
  }
}

// SUb Admin Login
module.exports.login = (req, res) => {
  try {
    let { username, password } = req.body;
    if (!username || !password) return res.send({ success: false, message: "missing field/'s" });

    else {
      SubAdmin.findOne({ username: username })
        .then(doc => {
          if (!doc) return res.send({ data: {}, success: false, message: "No such user found" });

          if (!util.comparePassword(doc.password, password)) {
            return res.send({ data: {}, success: false, message: "Incorrect password" });
          }
          else {
            const token = util.generateToken(doc._id);

            const data = { doc, token }
            res.send({ data, success: true, message: "SubAdmin login success" });
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
    let subadmin = await SubAdmin.findOne({ _id: userId });
    if (!subadmin._id) return res.send({ error, success: false, message: "Please login in again." });
    if (subadmin.token != req.params.token) return res.send({ success: false, message: "Token Invalid. Please login in again." });

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
      type: 'Subadmin',
      typeId: subadmin.managerId,
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

// Get Sites
module.exports.getSite = async (req, res) => {
  try {
    let { userId } = jwt.decode(req.params.token);
    let subadmin = await SubAdmin.findOne({ _id: userId });
    if (!subadmin._id) return res.send({ error, success: false, message: "Please login in again." });
    if (subadmin.token != req.params.token) return res.send({ success: false, message: "Token Invalid. Please login in again." });

    Site.find({ type: 'Subadmin', typeId: subadmin.managerId }).sort({ createdAt: -1 })
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

//Create Payment Method
module.exports.createpaymentMethod = async (req, res) => {
  try {
    let { userId } = jwt.decode(req.params.token);
    let subadmin = await SubAdmin.findOne({ _id: userId });
    if (!subadmin._id) return res.send({ error, success: false, message: "Please login in again." });
    if (subadmin.token != req.params.token) return res.send({ success: false, message: "Token Invalid. Please login in again." });


    let status, withdrawn;
    if (req.body.paymenttype == 'upi') {
      withdrawn = await PaymentMethod.findOne({ typeId: subadmin.managerId, paymenttype: req.body.paymenttype, name: req.body.name });
      if (!withdrawn) {
        status = true;
      } else {
        status = false;
      }
    }
    else {
      withdrawn = await PaymentMethod.findOne({ typeId: subadmin.managerId, paymenttype: req.body.paymenttype });
      if (!withdrawn) {
        status = true;
      } else {
        status = false;
      }
    }


    let data;
    if (req.body.paymenttype == 'bank') {
      data = {
        type: 'Subadmin',
        typeId: subadmin.managerId,
        paymenttype: req.body.paymenttype,
        name: req.body.name,
        accnumber: req.body.accnumber,
        ifsc: req.body.ifsc,
        acctype: req.body.acctype,
        image: req.file.filename,
        preffered: status
      }
    }
    else if (req.body.paymenttype == 'barcode') {
      data = {
        type: 'Subadmin',
        typeId: subadmin.managerId,
        paymenttype: req.body.paymenttype,
        name: req.body.name,
        image: req.file.filename,
        preffered: status
      }
    }
    else {
      let image;
      if (req.body.name == 'Google Pay') {
        image = 'google_pay.png';
      }
      else if (req.body.name == 'Paytm') {
        image = 'paytm_upi.png';
      }
      else if (req.body.name == 'Phone Pay') {
        image = 'phone_pe.png';
      }
      else if (req.body.name == 'UPI') {
        image = 'upi.png';
      }

      data = {
        type: 'Subadmin',
        typeId: subadmin.managerId,
        paymenttype: req.body.paymenttype,
        name: req.body.name,
        mobile: req.body.mobile,
        upi: req.body.upi,
        image: image,
        upiName: req.body.upiName,
        preffered: status
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

// Make Paymen tMethod Preffered
module.exports.prefferdPayment = async (req, res) => {
  try {
    let { userId } = jwt.decode(req.params.token);
    let subadmin = await SubAdmin.findOne({ _id: userId });
    if (!subadmin._id) return res.send({ error, success: false, message: "Please login in again." });
    if (subadmin.token != req.params.token) return res.send({ success: false, message: "Token Invalid. Please login in again." });

    let paymentMethod = await PaymentMethod.findOne({ _id: req.body.id });

    if (paymentMethod.paymenttype == 'upi') {
      await PaymentMethod.updateMany({ type: 'Subadmin', typeId: subadmin.managerId, paymenttype: paymentMethod.paymenttype, name: paymentMethod.name }, { preffered: false }, { new: true })
        .then(async function (dbProduct) {
          await PaymentMethod.findOneAndUpdate({ _id: req.body.id }, { preffered: true }, { new: true })
            .then(function (dbProduct) {
              res.send({ data: dbProduct, success: true, message: "Payment Method preffered successfully" });
            })
            .catch(function (err) {
              res.send({ error: err, success: false, message: "Error in making payment preffered" });
            });

        })
        .catch(function (err) {
          res.send({ error: err, success: false, message: "Error in making payment preffered" });
        });
    }
    else {
      await PaymentMethod.updateMany({ type: 'Subadmin', typeId: subadmin.managerId, paymenttype: paymentMethod.paymenttype }, { preffered: false }, { new: true })
        .then(async function (dbProduct) {
          await PaymentMethod.findOneAndUpdate({ _id: req.body.id }, { preffered: true }, { new: true })
            .then(function (dbProduct) {
              res.send({ data: dbProduct, success: true, message: "Payment Method preffered successfully" });
            })
            .catch(function (err) {
              res.send({ error: err, success: false, message: "Error in making payment preffered" });
            });

        })
        .catch(function (err) {
          res.send({ error: err, success: false, message: "Error in making payment preffered" });
        });
    }

  }
  catch (error) {
    res.send({ error, success: false, message: "Unknown error" });
  }
}

// Get Payment Method
module.exports.getPaymentmethod = async (req, res) => {
  try {
    let { userId } = jwt.decode(req.params.token);
    let subadmin = await SubAdmin.findOne({ _id: userId });
    if (!subadmin._id) return res.send({ error, success: false, message: "Please login in again." });
    if (subadmin.token != req.params.token) return res.send({ success: false, message: "Token Invalid. Please login in again." });

    PaymentMethod.find({ type: 'Subadmin', typeId: subadmin.managerId, }).sort({ createdAt: -1 })
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
    console.log(req.params.token);
    let { userId } = jwt.decode(req.params.token);
    let subadmin = await SubAdmin.findOne({ _id: userId });
    if (!subadmin._id) return res.send({ error, success: false, message: "Please login in again." });
    if (subadmin.token != req.params.token) return res.send({ success: false, message: "Token Invalid. Please login in again." });

    let manager = await SubAdmin.findOne({ _id: subadmin.managerId });

    var users = [];
    var team;

    let skipIndex = req.body.page - 1;
    let limit = JSON.parse(req.body.limit);
    let skip_size = skipIndex * limit;

    var request = require('request');
    var options = {
      'method': 'POST',
      'url': 'https://rnapi.paisaexch.com/api/getAllUser',
      'headers': {
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      form: {
        'manager': manager.username
      }
    };
    request(options, async function (error, response) {
      let body = JSON.parse(response.body);
      if (error) throw new Error(error);
      let datauser = body.data;

      const doc = await User.find({ type: 'Subadmin', typeId: subadmin.managerId }).sort({ createdAt: -1 }).skip(skip_size).limit(limit);

      team = doc;
      for (let i = 0; i < doc.length; i++) {
        let username = doc[i].username;
        let data = datauser.filter(a => a.username == username);
        var obj = team[i];
        var obj2 = { paisaData: data[0] };
        Object.assign(obj, obj2);
        users.push(obj);
      }
      res.send({ users, success: true, message: "Users get successfully" });


    });
  }
  catch (error) {
    console.log(error);
    res.send({ error, success: false, message: "Unknown error" });
  }
}

// Get Transactions
module.exports.getTransactions = async (req, res) => {
  try {
    let { userId } = jwt.decode(req.params.token);
    let subadmin = await SubAdmin.findOne({ _id: userId });
    if (!subadmin._id) return res.send({ error, success: false, message: "Please login in again." });
    if (subadmin.token != req.params.token) return res.send({ success: false, message: "Token Invalid. Please login in again." });

    let skipIndex = req.body.page - 1;
    let limit = JSON.parse(req.body.limit);
    let skip_size = skipIndex * limit;

    Payment.
      find({ managerType: 'Subadmin', managerId: subadmin.managerId, idReq: { $ne: 1 } }).
      populate('sites').
      populate('paymentId').
      populate('mysites').
      populate('depositId').
      sort({ createdAt: -1 }).
      skip(skip_size).
      limit(limit).
      exec(function (error, doc) {
        if (error) {
          res.send({ error, success: false, message: "DB error in getting transactions" });
        } else {
          res.send({ doc, success: true, message: "Transaction get successfully" });
        }
        // prints "The author is Ian Fleming"
      });
  }
  catch (error) {
    console.log(error);
    res.send({ error, success: false, message: "Unknown error" });
  }
}

// Get Deposit
module.exports.getDeposit = async (req, res) => {
  try {
    let { userId } = jwt.decode(req.params.token);
    let subadmin = await SubAdmin.findOne({ _id: userId });
    if (!subadmin._id) return res.send({ error, success: false, message: "Please login in again." });
    if (subadmin.token != req.params.token) return res.send({ success: false, message: "Token Invalid. Please login in again." });

    let skipIndex = req.body.page - 1;
    let limit = JSON.parse(req.body.limit);
    let skip_size = skipIndex * limit;

    Payment.
      find({ managerType: 'Subadmin', managerId: subadmin.managerId, type: 'Deposit', idReq: { $ne: 1 } }).
      populate('sites').
      populate('paymentId').
      populate('mysites').
      populate('depositId').
      sort({ createdAt: -1 }).
      skip(skip_size).
      limit(limit).
      exec(function (error, doc) {
        if (error) {
          res.send({ error, success: false, message: "DB error in getting transactions" });
        } else {
          res.send({ doc, success: true, message: "Transaction get successfully" });
        }
        // prints "The author is Ian Fleming"
      });
  }
  catch (error) {
    console.log(error);
    res.send({ error, success: false, message: "Unknown error" });
  }
}

// Get Withdraw
module.exports.getWithdraw = async (req, res) => {
  try {
    let { userId } = jwt.decode(req.params.token);
    let subadmin = await SubAdmin.findOne({ _id: userId });
    if (!subadmin._id) return res.send({ error, success: false, message: "Please login in again." });
    if (subadmin.token != req.params.token) return res.send({ success: false, message: "Token Invalid. Please login in again." });

    let skipIndex = req.body.page - 1;
    let limit = JSON.parse(req.body.limit);
    let skip_size = skipIndex * limit;

    Payment.
      find({ managerType: 'Subadmin', managerId: subadmin.managerId, type: 'Withdrawal', idReq: { $ne: 1 } }).
      populate('sites').
      populate('paymentId').
      populate('mysites').
      populate('depositId').
      sort({ createdAt: -1 }).
      skip(skip_size).
      limit(limit).
      exec(function (error, doc) {
        if (error) {
          res.send({ error, success: false, message: "DB error in getting transactions" });
        } else {
          res.send({ doc, success: true, message: "Transaction get successfully" });
        }
        // prints "The author is Ian Fleming"
      });
  }
  catch (error) {
    console.log(error);
    res.send({ error, success: false, message: "Unknown error" });
  }
}

// Get Pending Transactions
module.exports.getpendingTransactions = async (req, res) => {
  try {
    let { userId } = jwt.decode(req.params.token);
    let subadmin = await SubAdmin.findOne({ _id: userId });
    if (!subadmin._id) return res.send({ error, success: false, message: "Please login in again." });
    if (subadmin.token != req.params.token) return res.send({ success: false, message: "Token Invalid. Please login in again." });

    Payment.
      find({ managerType: 'Subadmin', managerId: subadmin.managerId, status: 'Pending', idReq: { $ne: 1 } }).
      populate('sites').
      populate('paymentId').
      populate('mysites').
      populate('depositId').
      sort({ createdAt: -1 }).
      exec(function (error, doc) {
        if (error) {
          res.send({ error, success: false, message: "DB error in getting transactions" });
        } else {
          res.send({ doc, success: true, message: "Transaction get successfully" });
        }
      });

  }
  catch (error) {
    res.send({ error, success: false, message: "Unknown error" });
  }
}

// Get My Sites
module.exports.getsitesRequest = async (req, res) => {
  try {
    let { userId } = jwt.decode(req.params.token);
    let subadmin = await SubAdmin.findOne({ _id: userId });
    if (!subadmin._id) return res.send({ error, success: false, message: "Please login in again." });
    if (subadmin.token != req.params.token) return res.send({ success: false, message: "Token Invalid. Please login in again." });

    Mysite.
      find({ type: 'Subadmin', typeId: subadmin.managerId }).
      populate('sites').
      sort({ createdAt: -1 }).
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
    let subadmin = await SubAdmin.findOne({ _id: userId });
    if (!subadmin._id) return res.send({ error, success: false, message: "Please login in again." });
    if (subadmin.token != req.params.token) return res.send({ success: false, message: "Token Invalid. Please login in again." });


    Payment.
      find({ managerType: 'Subadmin', managerId: subadmin.managerId, userId: req.body.userId }).
      populate('sites').
      populate('paymentId').
      populate('mysites').
      populate('depositId').
      sort({ createdAt: -1 }).
      exec(function (error, doc) {
        if (error) {
          res.send({ error, success: false, message: "DB error in getting transactions" });
        } else {
          res.send({ doc, success: true, message: "Transaction get successfully" });
        }
        // prints "The author is Ian Fleming"
      });

  }
  catch (error) {
    res.send({ error, success: false, message: "Unknown error" });
  }
}

// Delete Payment Method
module.exports.deletePaymentMethod = async (req, res) => {
  try {
    let { userId } = jwt.decode(req.params.token);
    let subadmin = await SubAdmin.findOne({ _id: userId });
    if (!subadmin._id) return res.send({ error, success: false, message: "Please login in again." });
    if (subadmin.token != req.params.token) return res.send({ success: false, message: "Token Invalid. Please login in again." });

    await PaymentMethod.deleteOne({ _id: req.body.id })
      .then(result => {
        res.send({ data: result, success: true, message: "Payment Method deleted successfully" });
      })
      .catch(error => {
        res.send({ error, success: false, message: "Error in deleting Payment Method" });
      })

  }
  catch (error) {
    res.send({ error, success: false, message: "Unknown error" });
  }
}

// Get User Sites
module.exports.getUserSites = async (req, res) => {
  try {
    let { userId } = jwt.decode(req.params.token);
    let subadmin = await SubAdmin.findOne({ _id: userId });
    if (!subadmin._id) return res.send({ error, success: false, message: "Please login in again." });
    if (subadmin.token != req.params.token) return res.send({ success: false, message: "Token Invalid. Please login in again." });

    Mysite.find({ type: 'Subadmin', typeId: subadmin.managerId, userId: req.body.userId }).populate('sites').
      sort({ createdAt: -1 }).
      exec(function (err, data) {
        res.send({ data, success: true, message: "User SItes get successfully" });
      })
  }
  catch (error) {
    res.send({ error, success: false, message: "Unknown error" });
  }
}

// Get User Sites Transactions
module.exports.getUserSitesTransactions = async (req, res) => {
  try {
    let { userId } = jwt.decode(req.params.token);
    let subadmin = await SubAdmin.findOne({ _id: userId });
    if (!subadmin._id) return res.send({ error, success: false, message: "Please login in again." });
    if (subadmin.token != req.params.token) return res.send({ success: false, message: "Token Invalid. Please login in again." });

    Payment.find({ mysites: req.body.mysiteId }).sort({ createdAt: -1 })
      .then(doc => {
        res.send({ doc, success: true, message: "Transactions get successfully" });
      })
      .catch(error => {
        res.send({ error, success: false, message: "DB error in getting site transaction" });
      })
  }
  catch (error) {
    res.send({ error, success: false, message: "Unknown error" });
  }
}

//Update Site
module.exports.updateSite = async (req, res) => {
  try {
    let { userId } = jwt.decode(req.params.token);
    let subadmin = await SubAdmin.findOne({ _id: userId });
    if (!subadmin._id) return res.send({ error, success: false, message: "Please login in again." });
    if (subadmin.token != req.params.token) return res.send({ success: false, message: "Token Invalid. Please login in again." });

    let site;
    if (req.file) {
      site = {
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
        refill: req.body.refill,
        minwithdrawn: req.body.minwithdrawn,
        maxwithdrawn: req.body.maxwithdrawn,
        balance: req.body.balance,
      };
    } else {
      site = {
        name: req.body.name,
        url: req.body.url,
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
        refill: req.body.refill,
        minwithdrawn: req.body.minwithdrawn,
        maxwithdrawn: req.body.maxwithdrawn,
        balance: req.body.balance,
      };
    }


    Site.findOneAndUpdate({
      '_id': req.body.siteId
    }, site, async function (error, updateUser) {
      if (error) {
        res.send({ error, success: false, message: "DB error in site update" });
      } else {
        res.send({ doc: updateUser, success: true, message: "Site Updated" });
      }
    });
  }
  catch (error) {
    res.send({ error, success: false, message: "Unknown error" });
  }
}

//Update Payment Method
module.exports.updatepaymentMethod = async (req, res) => {
  try {
    let { userId } = jwt.decode(req.params.token);
    let subadmin = await SubAdmin.findOne({ _id: userId });
    if (!subadmin._id) return res.send({ error, success: false, message: "Please login in again." });
    if (subadmin.token != req.params.token) return res.send({ success: false, message: "Token Invalid. Please login in again." });


    let data;
    if (req.body.paymenttype == 'bank') {

      if (req.file) {
        data = {
          type: 'Subadmin',
          typeId: subadmin.managerId,
          paymenttype: req.body.paymenttype,
          name: req.body.name,
          accnumber: req.body.accnumber,
          ifsc: req.body.ifsc,
          acctype: req.body.acctype,
          image: req.file.filename
        }
      }
      else {
        data = {
          type: 'Subadmin',
          typeId: subadmin.managerId,
          paymenttype: req.body.paymenttype,
          name: req.body.name,
          accnumber: req.body.accnumber,
          ifsc: req.body.ifsc,
          acctype: req.body.acctype
        }
      }

    }
    else if (req.body.paymenttype == 'barcode') {

      if (req.file) {
        data = {
          type: 'Subadmin',
          typeId: subadmin.managerId,
          paymenttype: req.body.paymenttype,
          name: req.body.name,
          image: req.file.filename
        }
      }
      else {
        data = {
          type: 'Subadmin',
          typeId: subadmin.managerId,
          paymenttype: req.body.paymenttype,
          name: req.body.name
        }
      }

    }
    else {
      let image;
      if (req.body.name == 'Google Pay') {
        image = 'google_pay.png';
      }
      else if (req.body.name == 'Paytm') {
        image = 'paytm_upi.png';
      }
      else if (req.body.name == 'Phone Pay') {
        image = 'phone_pe.png';
      }
      else if (req.body.name == 'UPI') {
        image = 'upi.png';
      }

      data = {
        type: 'Subadmin',
        typeId: subadmin.managerId,
        paymenttype: req.body.paymenttype,
        name: req.body.name,
        mobile: req.body.mobile,
        upi: req.body.upi,
        image: image
      }
    }

    PaymentMethod.findOneAndUpdate({
      '_id': req.body.paymentId
    }, data, async function (error, updateUser) {
      if (error) {
        res.send({ error, success: false, message: "DB error in payment method update" });
      } else {
        res.send({ doc: updateUser, success: true, message: "Payment Method Updated" });
      }
    });

  }
  catch (error) {
    res.send({ error, success: false, message: "Unknown error" });
  }
}

// Delete Site
module.exports.deleteSite = async (req, res) => {
  try {
    let { userId } = jwt.decode(req.params.token);
    let subadmin = await SubAdmin.findOne({ _id: userId });
    if (!subadmin._id) return res.send({ error, success: false, message: "Please login in again." });
    if (subadmin.token != req.params.token) return res.send({ success: false, message: "Token Invalid. Please login in again." });

    await Site.deleteOne({ _id: req.body.id })
      .then(result => {
        res.send({ data: result, success: true, message: "Site deleted successfully" });
      })
      .catch(error => {
        res.send({ error, success: false, message: "Error in deleting Site" });
      })

  }
  catch (error) {
    res.send({ error, success: false, message: "Unknown error" });
  }
}

// Get Transaction Withdrawn Method
module.exports.getwithdrawnMethod = async (req, res) => {
  try {
    let { userId } = jwt.decode(req.params.token);
    let subadmin = await SubAdmin.findOne({ _id: userId });
    if (!subadmin._id) return res.send({ error, success: false, message: "Please login in again." });
    if (subadmin.token != req.params.token) return res.send({ success: false, message: "Token Invalid. Please login in again." });

    let withdrawal = await Withdrawal.findOne({ _id: req.body.paymentId });

    res.send({ data: withdrawal, success: true, message: "Withdrawn Method get successfully" });


  }
  catch (error) {
    console.log(error);
    res.send({ error, success: false, message: "Unknown error" });
  }
}


//Add Withdrawal Image
module.exports.addwithdrawalImage = async (req, res) => {
  try {
    let { userId } = jwt.decode(req.params.token);
    let subadmin = await SubAdmin.findOne({ _id: userId });
    if (!subadmin._id) return res.send({ error, success: false, message: "Please login in again." });
    if (subadmin.token != req.params.token) return res.send({ success: false, message: "Token Invalid. Please login in again." });

    let payment = await Payment.findOne({ _id: req.body.transactionId });

    let imageName = [];

    console.log(req.body.transactionId)
    console.log(req.files)
    if (req.files.length > 0) {
      for (let i = 0; i < req.files.length; i++) {
        image = req.files[i].filename;
        imageName.push(image);
      }
    }
    else if (payment.image.length > 0) {
      imageName = payment.image
    }
    else {
      imageName = []
    }


    Payment.findOneAndUpdate({
      '_id': req.body.transactionId
    }, { image: imageName }, async function (error, updateUser) {
      if (error) {
        res.send({ error, success: false, message: "DB error in payment method update" });
      } else {
        res.send({ doc: updateUser, success: true, message: "Payment Method Updated" });
      }
    });

  }
  catch (error) {
    res.send({ error, success: false, message: "Unknown error" });
  }
}

//Add Deposite Manually
module.exports.depositMannual = async (req, res) => {
  try {
    let { userId } = jwt.decode(req.params.token);
    let subadmin = await SubAdmin.findOne({ _id: userId });
    if (!subadmin._id) return res.send({ error, success: false, message: "Please login in again." });
    if (subadmin.token != req.params.token) return res.send({ success: false, message: "Token Invalid. Please login in again." });


    let user = await User.findOne({ _id: req.body.userId });

    let imageName = [];

    var characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    var result = ""
    var charactersLength = characters.length;

    for (var i = 0; i < 10; i++) {
      result += characters.charAt(Math.floor(Math.random() * charactersLength));
    }

    let wallet = parseInt(user.wallet) + parseInt(req.body.amount);


    const payment = new Payment({
      type: 'Deposit',
      userId: user._id,
      amount: req.body.amount,
      name: user.name,
      username: user.username,
      paymentType: 'Manuall',
      status: 'Approved',
      image: imageName,
      managerType: user.type,
      managerId: user.typeId,
      balance: wallet,
      to: "Wallet",
      refrenceNo: result,
      remarks: req.body.remarks
    });
    payment.save()
      .then(doc => {

        let url = 'https://wapi.paisaexch.com/api/updatedeposit';

        var request = require('request');
        var options = {
          'method': 'POST',
          'url': url,
          'headers': {
            'cache-control': 'no-cache',
            'content-type': 'application/x-www-form-urlencoded',
            'postman-token': '15dc1ded-e6b9-d2e2-f73e-1d4ce00f568a'
          },
          form: {
            'username': user.username,
            'amount': req.body.amount,
            'status': 'Approved',
          }
        };
        request(options, function (error, response) {
          let body = JSON.parse(response.body);
          console.log(body);
          if (error) {
            res.send({ error, success: false, message: "Error in create transaction" });
          } else if (body.error == true) {
            res.send({ error, success: false, message: body.message });
          } else {


            // Push Notification Start

            let name = 'Wallet Deposit !';
            let message = `Your wallet has been deposit. We have deposited ${req.body.amount} coins to your wallet. Have fun with OSG Club. `;


            var datapush = {
              app_id: "9adf2973-6d8a-4a42-9ce0-a3a98d97deaa",
              contents: { "en": message },
              headings: { "en": name },
              big_picture: "https://blog.taskpigeon.co/wp-content/uploads/2017/06/Advanced-Email-Notifications-Task-Pigeon.jpg",
              url: "",
              include_player_ids: [user.deviceId]
            };

            var headers = {
              "Content-Type": "application/json; charset=utf-8",
              "Authorization": "Basic MjNhMTlkNWMtYmJmOS00MTA3LWJiNzQtNjI4MjE0N2NjYWU2"
            };

            var options = {
              host: "onesignal.com",
              port: 443,
              path: "/api/v1/notifications",
              method: "POST",
              headers: headers
            };


            var https = require('https');
            var requestpush = https.request(options, function (res) {
              res.on('data', function (datapush) {
                console.log("Response:");
                // console.log(JSON.parse(datapush));
              });
            });

            requestpush.on('error', function (e) {
              console.log("ERROR:");
              console.log(e);
            });

            requestpush.write(JSON.stringify(datapush));
            requestpush.end();

            // Push Notification End

            User.updateOne({
              '_id': user._id
            }, { wallet: wallet, }, async function (error, updateUser) {
              res.send({ doc, success: true, message: "Deposit created" });
            });

          }
        });
      })
      .catch(error => {
        res.send({ error, success: false, message: "DB error in deposit register" });
      })
  }
  catch (error) {
    console.log(error);
    res.send({ error, success: false, message: "Unknown error" });
  }
}


//Add Withdrawal Manually
module.exports.withdrawalMannual = async (req, res) => {
  try {
    let { userId } = jwt.decode(req.params.token);
    let subadmin = await SubAdmin.findOne({ _id: userId });
    if (!subadmin._id) return res.send({ error, success: false, message: "Please login in again." });
    if (subadmin.token != req.params.token) return res.send({ success: false, message: "Token Invalid. Please login in again." });

    let user = await User.findOne({ _id: req.body.userId });

    let imageName = [];

    var characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    var result = ""
    var charactersLength = characters.length;

    for (var i = 0; i < 10; i++) {
      result += characters.charAt(Math.floor(Math.random() * charactersLength));
    }

    let wallet = parseInt(user.wallet) - parseInt(req.body.amount);


    const payment = new Payment({
      type: 'Withdrawal',
      userId: user._id,
      amount: req.body.amount,
      name: user.name,
      username: user.username,
      paymentType: 'Manuall',
      status: 'Approved',
      image: imageName,
      managerType: user.type,
      managerId: user.typeId,
      balance: wallet,
      to: "Wallet",
      refrenceNo: result,
      remarks: req.body.remarks
    });
    payment.save()
      .then(doc => {


        var request = require('request');
        var options = {
          'method': 'GET',
          'url': `https://wapi.paisaexch.com/api/balance/${user.username}`,
          'headers': {
          }
        };
        request(options, function (error, response) {
          if (error) {
            res.send({ error, success: false, message: "Error in withdralaw request" });
          } else {
            let body = JSON.parse(response.body);

            if (body.error == true) {
              res.send({ error, success: false, message: body.message });
            }
            else if (body.response.balance < req.body.amount) {
              res.send({ error, success: false, message: "User don't have sufficient ammount" });
            } else {

              let url = 'https://wapi.paisaexch.com/api/updatewithdraw';

              var request = require('request');
              var options = {
                'method': 'POST',
                'url': url,
                'headers': {
                  'cache-control': 'no-cache',
                  'content-type': 'application/x-www-form-urlencoded',
                  'postman-token': '15dc1ded-e6b9-d2e2-f73e-1d4ce00f568a'
                },
                form: {
                  'username': user.username,
                  'amount': req.body.amount
                }
              };
              request(options, function (error, response) {
                let body = JSON.parse(response.body);
                console.log(body);
                if (error) {
                  res.send({ error, success: false, message: "Error in create transaction" });
                } else if (body.error == true) {
                  res.send({ error, success: false, message: body.message });
                } else {


                  // Push Notification Start

                  let name = 'Wallet Withdrawal !';
                  let message = `Your wallet has been withdrawal. We have withdrawal ${req.body.amount} coins from your wallet. Have fun with OSG Club. `;


                  var datapush = {
                    app_id: "9adf2973-6d8a-4a42-9ce0-a3a98d97deaa",
                    contents: { "en": message },
                    headings: { "en": name },
                    big_picture: "https://blog.taskpigeon.co/wp-content/uploads/2017/06/Advanced-Email-Notifications-Task-Pigeon.jpg",
                    url: "",
                    include_player_ids: [user.deviceId]
                  };

                  var headers = {
                    "Content-Type": "application/json; charset=utf-8",
                    "Authorization": "Basic MjNhMTlkNWMtYmJmOS00MTA3LWJiNzQtNjI4MjE0N2NjYWU2"
                  };

                  var options = {
                    host: "onesignal.com",
                    port: 443,
                    path: "/api/v1/notifications",
                    method: "POST",
                    headers: headers
                  };


                  var https = require('https');
                  var requestpush = https.request(options, function (res) {
                    res.on('data', function (datapush) {
                      console.log("Response:");
                      // console.log(JSON.parse(datapush));
                    });
                  });

                  requestpush.on('error', function (e) {
                    console.log("ERROR:");
                    console.log(e);
                  });

                  requestpush.write(JSON.stringify(datapush));
                  requestpush.end();

                  // Push Notification End

                  User.updateOne({
                    '_id': user._id
                  }, { wallet: wallet, }, async function (error, updateUser) {
                    res.send({ doc, success: true, message: "Deposit created" });
                  });

                }
              });

            }
          }
        });
      })
      .catch(error => {
        res.send({ error, success: false, message: "DB error in deposit register" });
      })
  }
  catch (error) {
    console.log(error);
    res.send({ error, success: false, message: "Unknown error" });
  }
}

// Active Users
module.exports.activeUsers = async (req, res) => {
  try {
    console.log(req.params.token);
    let { userId } = jwt.decode(req.params.token);
    let subadmin = await SubAdmin.findOne({ _id: userId });
    if (!subadmin._id) return res.send({ error, success: false, message: "Please login in again." });
    if (subadmin.token != req.params.token) return res.send({ success: false, message: "Token Invalid. Please login in again." });

    const doc = await User.find({ type: 'Subadmin', typeId: subadmin.managerId, status: 'active' }).sort({ createdAt: -1 });
    res.send({ data: doc.length, success: true, message: "Users get successfully" });

  }
  catch (error) {
    console.log(error);
    res.send({ error, success: false, message: "Unknown error" });
  }
}

// Weekly Users
module.exports.weeklyUsers = async (req, res) => {
  try {
    console.log(req.params.token);
    let { userId } = jwt.decode(req.params.token);
    let subadmin = await SubAdmin.findOne({ _id: userId });
    if (!subadmin._id) return res.send({ error, success: false, message: "Please login in again." });
    if (subadmin.token != req.params.token) return res.send({ success: false, message: "Token Invalid. Please login in again." });

    let date = new Date();
    let date1 = ("0" + (date.getDate())).slice(-2);
    let month = ("0" + (date.getMonth() + 1)).slice(-2);
    let year = date.getFullYear();
    let submission_date = year + "-" + month + "-" + date1 + "T00:00:00.000Z";
    let newDate = new Date(submission_date);
    new Date(newDate.setDate(newDate.getDate() - 6))

    const doc = await User.find({ type: 'Subadmin', typeId: subadmin.managerId, status: 'active', createdAt: { $gte: newDate, $lte: date } }).sort({ createdAt: -1 });
    res.send({ data: doc.length, success: true, message: "Users get successfully" });

  }
  catch (error) {
    console.log(error);
    res.send({ error, success: false, message: "Unknown error" });
  }
}

// Monthly Users
module.exports.monthlyUsers = async (req, res) => {
  try {
    console.log(req.params.token);
    let { userId } = jwt.decode(req.params.token);
    let subadmin = await SubAdmin.findOne({ _id: userId });
    if (!subadmin._id) return res.send({ error, success: false, message: "Please login in again." });
    if (subadmin.token != req.params.token) return res.send({ success: false, message: "Token Invalid. Please login in again." });

    let date = new Date();
    let date1 = ("0" + (date.getDate())).slice(-2);
    let month = ("0" + (date.getMonth() + 1)).slice(-2);
    let year = date.getFullYear();
    let submission_date = year + "-" + month + "-" + date1 + "T00:00:00.000Z";
    let newDate = new Date(submission_date);
    new Date(newDate.setDate(newDate.getDate() - 27))

    const doc = await User.find({ type: 'Subadmin', typeId: subadmin.managerId, status: 'active', createdAt: { $gte: newDate, $lte: date } }).sort({ createdAt: -1 });
    res.send({ data: doc.length, success: true, message: "Users get successfully" });

  }
  catch (error) {
    console.log(error);
    res.send({ error, success: false, message: "Unknown error" });
  }
}

// Total Users
module.exports.totalUsers = async (req, res) => {
  try {
    console.log(req.params.token);
    let { userId } = jwt.decode(req.params.token);
    let subadmin = await SubAdmin.findOne({ _id: userId });
    if (!subadmin._id) return res.send({ error, success: false, message: "Please login in again." });
    if (subadmin.token != req.params.token) return res.send({ success: false, message: "Token Invalid. Please login in again." });

    const doc = await User.find({ type: 'Subadmin', typeId: subadmin.managerId }).sort({ createdAt: -1 });
    res.send({ data: doc.length, success: true, message: "Users get successfully" });

  }
  catch (error) {
    console.log(error);
    res.send({ error, success: false, message: "Unknown error" });
  }
}

// Get Today Deposit
module.exports.gettodayDeposit = async (req, res) => {
  try {
    let { userId } = jwt.decode(req.params.token);
    let subadmin = await SubAdmin.findOne({ _id: userId });
    if (!subadmin._id) return res.send({ error, success: false, message: "Please login in again." });
    if (subadmin.token != req.params.token) return res.send({ success: false, message: "Token Invalid. Please login in again." });

    let date = new Date();
    let date1 = ("0" + (date.getDate())).slice(-2);
    let month = ("0" + (date.getMonth() + 1)).slice(-2);
    let year = date.getFullYear();
    let submission_date = year + "-" + month + "-" + date1 + "T00:00:00.000Z";
    let newDate = new Date(submission_date);

    newDate.setHours(newDate.getHours() - 5);
    newDate.setMinutes(newDate.getMinutes() - 30);

    Payment.find({ managerType: 'Subadmin', managerId: subadmin.managerId, status: 'Approved', type: 'Deposit', to: 'Wallet', createdAt: { $gte: newDate, $lte: date } })
      .then(doc => {
        let totalamount = 0;
        for (let i = 0; i < doc.length; i++) {
          totalamount += parseInt(doc[i].amount);
        }
        res.send({ data: totalamount, success: true, message: "Transactions get successfully" });
      })
      .catch(error => {
        res.send({ error, success: false, message: "DB error in getting transactions" });
      })
  }
  catch (error) {
    console.log(error);
    res.send({ error, success: false, message: "Unknown error" });
  }
}

// Get Weekly Deposit
module.exports.getweeklyDeposit = async (req, res) => {
  try {
    let { userId } = jwt.decode(req.params.token);
    let subadmin = await SubAdmin.findOne({ _id: userId });
    if (!subadmin._id) return res.send({ error, success: false, message: "Please login in again." });
    if (subadmin.token != req.params.token) return res.send({ success: false, message: "Token Invalid. Please login in again." });

    let date = new Date();
    let date1 = ("0" + (date.getDate())).slice(-2);
    let month = ("0" + (date.getMonth() + 1)).slice(-2);
    let year = date.getFullYear();
    let submission_date = year + "-" + month + "-" + date1 + "T00:00:00.000Z";
    let newDate = new Date(submission_date);
    new Date(newDate.setDate(newDate.getDate() - 6));

    Payment.find({ managerType: 'Subadmin', managerId: subadmin.managerId, status: 'Approved', type: 'Deposit', to: 'Wallet', createdAt: { $gte: newDate, $lte: date } })
      .then(doc => {
        let totalamount = 0;
        for (let i = 0; i < doc.length; i++) {
          totalamount += parseInt(doc[i].amount);
        }
        res.send({ data: totalamount, success: true, message: "Transactions get successfully" });
      })
      .catch(error => {
        res.send({ error, success: false, message: "DB error in getting transactions" });
      })
  }
  catch (error) {
    console.log(error);
    res.send({ error, success: false, message: "Unknown error" });
  }
}

// Get Monthly Deposit
module.exports.getmonthlyDeposit = async (req, res) => {
  try {
    let { userId } = jwt.decode(req.params.token);
    let subadmin = await SubAdmin.findOne({ _id: userId });
    if (!subadmin._id) return res.send({ error, success: false, message: "Please login in again." });
    if (subadmin.token != req.params.token) return res.send({ success: false, message: "Token Invalid. Please login in again." });

    let date = new Date();
    let date1 = ("0" + (date.getDate())).slice(-2);
    let month = ("0" + (date.getMonth() + 1)).slice(-2);
    let year = date.getFullYear();
    let submission_date = year + "-" + month + "-" + date1 + "T00:00:00.000Z";
    let newDate = new Date(submission_date);
    new Date(newDate.setDate(newDate.getDate() - 28));

    Payment.find({ managerType: 'Subadmin', managerId: subadmin.managerId, status: 'Approved', type: 'Deposit', to: 'Wallet', createdAt: { $gte: newDate, $lte: date } })
      .then(doc => {
        let totalamount = 0;
        for (let i = 0; i < doc.length; i++) {
          totalamount += parseInt(doc[i].amount);
        }
        res.send({ data: totalamount, success: true, message: "Transactions get successfully" });
      })
      .catch(error => {
        res.send({ error, success: false, message: "DB error in getting transactions" });
      })
  }
  catch (error) {
    console.log(error);
    res.send({ error, success: false, message: "Unknown error" });
  }
}

// Get Total Deposit
module.exports.gettotalDeposit = async (req, res) => {
  try {
    let { userId } = jwt.decode(req.params.token);
    let subadmin = await SubAdmin.findOne({ _id: userId });
    if (!subadmin._id) return res.send({ error, success: false, message: "Please login in again." });
    if (subadmin.token != req.params.token) return res.send({ success: false, message: "Token Invalid. Please login in again." });

    Payment.find({ managerType: 'Subadmin', managerId: subadmin.managerId, status: 'Approved', type: 'Deposit', to: 'Wallet' })
      .then(doc => {
        let totalamount = 0;
        for (let i = 0; i < doc.length; i++) {
          totalamount += parseInt(doc[i].amount);
        }
        res.send({ data: totalamount, success: true, message: "Transactions get successfully" });
      })
      .catch(error => {
        res.send({ error, success: false, message: "DB error in getting transactions" });
      })
  }
  catch (error) {
    console.log(error);
    res.send({ error, success: false, message: "Unknown error" });
  }
}

// Get Today Withdrawal
module.exports.gettodayWithdrawal = async (req, res) => {
  try {
    let { userId } = jwt.decode(req.params.token);
    let subadmin = await SubAdmin.findOne({ _id: userId });
    if (!subadmin._id) return res.send({ error, success: false, message: "Please login in again." });
    if (subadmin.token != req.params.token) return res.send({ success: false, message: "Token Invalid. Please login in again." });

    let date = new Date();
    let date1 = ("0" + (date.getDate())).slice(-2);
    let month = ("0" + (date.getMonth() + 1)).slice(-2);
    let year = date.getFullYear();
    let submission_date = year + "-" + month + "-" + date1 + "T00:00:00.000Z";
    let newDate = new Date(submission_date);

    newDate.setHours(newDate.getHours() - 5);
    newDate.setMinutes(newDate.getMinutes() - 30);

    Payment.find({ managerType: 'Subadmin', managerId: subadmin.managerId, status: 'Approved', type: 'Withdrawal', to: 'Wallet', createdAt: { $gte: newDate, $lte: date } })
      .then(doc => {
        let totalamount = 0;
        for (let i = 0; i < doc.length; i++) {
          totalamount += parseInt(doc[i].amount);
        }
        res.send({ data: totalamount, success: true, message: "Transactions get successfully" });
      })
      .catch(error => {
        res.send({ error, success: false, message: "DB error in getting transactions" });
      })
  }
  catch (error) {
    console.log(error);
    res.send({ error, success: false, message: "Unknown error" });
  }
}

// Get Weekly Withdrawal
module.exports.getweeklyWithdrawal = async (req, res) => {
  try {
    let { userId } = jwt.decode(req.params.token);
    let subadmin = await SubAdmin.findOne({ _id: userId });
    if (!subadmin._id) return res.send({ error, success: false, message: "Please login in again." });
    if (subadmin.token != req.params.token) return res.send({ success: false, message: "Token Invalid. Please login in again." });

    let date = new Date();
    let date1 = ("0" + (date.getDate())).slice(-2);
    let month = ("0" + (date.getMonth() + 1)).slice(-2);
    let year = date.getFullYear();
    let submission_date = year + "-" + month + "-" + date1 + "T00:00:00.000Z";
    let newDate = new Date(submission_date);
    new Date(newDate.setDate(newDate.getDate() - 6));

    Payment.find({ managerType: 'Subadmin', managerId: subadmin.managerId, status: 'Approved', type: 'Withdrawal', to: 'Wallet', createdAt: { $gte: newDate, $lte: date } })
      .then(doc => {
        let totalamount = 0;
        for (let i = 0; i < doc.length; i++) {
          totalamount += parseInt(doc[i].amount);
        }
        res.send({ data: totalamount, success: true, message: "Transactions get successfully" });
      })
      .catch(error => {
        res.send({ error, success: false, message: "DB error in getting transactions" });
      })
  }
  catch (error) {
    console.log(error);
    res.send({ error, success: false, message: "Unknown error" });
  }
}

// Get Monthly Withdrawal
module.exports.getmonthlyWithdrawal = async (req, res) => {
  try {
    let { userId } = jwt.decode(req.params.token);
    let subadmin = await SubAdmin.findOne({ _id: userId });
    if (!subadmin._id) return res.send({ error, success: false, message: "Please login in again." });
    if (subadmin.token != req.params.token) return res.send({ success: false, message: "Token Invalid. Please login in again." });

    let date = new Date();
    let date1 = ("0" + (date.getDate())).slice(-2);
    let month = ("0" + (date.getMonth() + 1)).slice(-2);
    let year = date.getFullYear();
    let submission_date = year + "-" + month + "-" + date1 + "T00:00:00.000Z";
    let newDate = new Date(submission_date);
    new Date(newDate.setDate(newDate.getDate() - 28));

    Payment.find({ managerType: 'Subadmin', managerId: subadmin.managerId, status: 'Approved', type: 'Withdrawal', to: 'Wallet', createdAt: { $gte: newDate, $lte: date } })
      .then(doc => {
        let totalamount = 0;
        for (let i = 0; i < doc.length; i++) {
          totalamount += parseInt(doc[i].amount);
        }
        res.send({ data: totalamount, success: true, message: "Transactions get successfully" });
      })
      .catch(error => {
        res.send({ error, success: false, message: "DB error in getting transactions" });
      })
  }
  catch (error) {
    console.log(error);
    res.send({ error, success: false, message: "Unknown error" });
  }
}

// Get Total Withdrawal
module.exports.gettotalWithdrawal = async (req, res) => {
  try {
    let { userId } = jwt.decode(req.params.token);
    let subadmin = await SubAdmin.findOne({ _id: userId });
    if (!subadmin._id) return res.send({ error, success: false, message: "Please login in again." });
    if (subadmin.token != req.params.token) return res.send({ success: false, message: "Token Invalid. Please login in again." });

    Payment.find({ managerType: 'Subadmin', managerId: subadmin.managerId, status: 'Approved', type: 'Withdrawal', to: 'Wallet' })
      .then(doc => {
        let totalamount = 0;
        for (let i = 0; i < doc.length; i++) {
          totalamount += parseInt(doc[i].amount);
        }
        res.send({ data: totalamount, success: true, message: "Transactions get successfully" });
      })
      .catch(error => {
        res.send({ error, success: false, message: "DB error in getting transactions" });
      })
  }
  catch (error) {
    console.log(error);
    res.send({ error, success: false, message: "Unknown error" });
  }
}

// Get Site Total
module.exports.getsiteTotal = async (req, res) => {
  try {
    let { userId } = jwt.decode(req.params.token);
    let subadmin = await SubAdmin.findOne({ _id: userId });
    if (!subadmin._id) return res.send({ error, success: false, message: "Please login in again." });
    if (subadmin.token != req.params.token) return res.send({ success: false, message: "Token Invalid. Please login in again." });

    let sites = await Mysite.find({ sites: req.body.siteId });

    let withdrawal = await Payment.find({ managerType: 'Subadmin', managerId: subadmin.managerId, status: 'Approved', type: 'Withdrawal', sites: req.body.siteId });

    let totalwithdrawal = 0;
    for (let i = 0; i < withdrawal.length; i++) {
      totalwithdrawal += parseInt(withdrawal[i].amount);
    }

    let deposit = await Payment.find({ managerType: 'Subadmin', managerId: subadmin.managerId, status: 'Approved', type: 'Deposit', sites: req.body.siteId });

    let totadeposit = 0;
    for (let i = 0; i < deposit.length; i++) {
      totadeposit += parseInt(deposit[i].amount);
    }

    res.send({ withdrawal: totalwithdrawal, deposit: totadeposit, users: sites.length, success: true, message: "Transactions get successfully" });

  }
  catch (error) {
    console.log(error);
    res.send({ error, success: false, message: "Unknown error" });
  }
}

// Send User Notification
module.exports.userNotification = async (req, resource) => {
  try {
    let { userId } = jwt.decode(req.params.token);
    let subadmin = await SubAdmin.findOne({ _id: userId });
    if (!subadmin._id) return resource.send({ error, success: false, message: "Please login in again." });
    if (subadmin.token != req.params.token) return resource.send({ success: false, message: "Token Invalid. Please login in again." });

    let user = await User.findOne({ _id: req.body.userId });

    var datapush = {
      app_id: "9adf2973-6d8a-4a42-9ce0-a3a98d97deaa",
      contents: { "en": req.body.message },
      headings: { "en": req.body.heading },
      big_picture: "https://blog.taskpigeon.co/wp-content/uploads/2017/06/Advanced-Email-Notifications-Task-Pigeon.jpg",
      url: "",
      include_player_ids: [user.deviceId]
    };

    var headers = {
      "Content-Type": "application/json; charset=utf-8",
      "Authorization": "Basic MjNhMTlkNWMtYmJmOS00MTA3LWJiNzQtNjI4MjE0N2NjYWU2"
    };

    var options = {
      host: "onesignal.com",
      port: 443,
      path: "/api/v1/notifications",
      method: "POST",
      headers: headers
    };


    var https = require('https');
    var requestpush = https.request(options, function (res) {
      res.on('data', function (datapush) {
        console.log("Response:");
        // console.log(JSON.parse(datapush));
        let datadoc = JSON.parse(datapush);
        resource.send({ data: datadoc, success: true, message: "Notification sent successfully" });

      });
    });

    requestpush.on('error', function (e) {
      console.log("ERROR:");
      resource.send({ data: [], success: false, message: " Error in sending notification" });
      console.log(e);
    });

    requestpush.write(JSON.stringify(datapush));
    requestpush.end();

    // Push Notification End

  }
  catch (error) {
    console.log(error);
    resource.send({ error, success: false, message: "Unknown error" });
  }
}

// Send Notification to all User
module.exports.alluserNotification = async (req, resource) => {
  try {
    let { userId } = jwt.decode(req.params.token);
    let subadmin = await SubAdmin.findOne({ _id: userId });
    if (!subadmin._id) return resource.send({ error, success: false, message: "Please login in again." });
    if (subadmin.token != req.params.token) return resource.send({ success: false, message: "Token Invalid. Please login in again." });

    let total = [];
    let user = await User.find({ type: 'Subadmin', typeId: subadmin.managerId, status: 'active' });

    for (let i = 0; i < user.length; i++) {
      if (user[i].deviceId && user[i].deviceId != ' ') {
        total.push(user[i].deviceId)
      }
    }


    var datapush = {
      app_id: "9adf2973-6d8a-4a42-9ce0-a3a98d97deaa",
      contents: { "en": req.body.message },
      headings: { "en": req.body.heading },
      big_picture: "https://blog.taskpigeon.co/wp-content/uploads/2017/06/Advanced-Email-Notifications-Task-Pigeon.jpg",
      url: "",
      include_player_ids: total
    };

    var headers = {
      "Content-Type": "application/json; charset=utf-8",
      "Authorization": "Basic MjNhMTlkNWMtYmJmOS00MTA3LWJiNzQtNjI4MjE0N2NjYWU2"
    };

    var options = {
      host: "onesignal.com",
      port: 443,
      path: "/api/v1/notifications",
      method: "POST",
      headers: headers
    };


    var https = require('https');
    var requestpush = https.request(options, function (res) {
      res.on('data', function (datapush) {
        console.log("Response:");
        // console.log(JSON.parse(datapush));
        let datadoc = JSON.parse(datapush);
        resource.send({ data: datadoc, success: true, message: "Notification sent successfully" });

      });
    });

    requestpush.on('error', function (e) {
      console.log("ERROR:");
      resource.send({ data: [], success: false, message: " Error in sending notification" });
      console.log(e);
    });

    requestpush.write(JSON.stringify(datapush));
    requestpush.end();

    // Push Notification End

  }
  catch (error) {
    console.log(error);
    resource.send({ error, success: false, message: "Unknown error" });
  }
}

// Processing Payment
module.exports.processingPayment = async (req, resource) => {
  try {
    let { userId } = jwt.decode(req.params.token);
    let subadmin = await SubAdmin.findOne({ _id: userId });
    if (!subadmin._id) return resource.send({ error, success: false, message: "Please login in again." });
    if (subadmin.token != req.params.token) return resource.send({ success: false, message: "Token Invalid. Please login in again." });

    let pay = await Payment.findOne({ _id: req.body.paymentId });
    let user = await User.findOne({ _id: pay.userId });

    var datapush = {
      app_id: "9adf2973-6d8a-4a42-9ce0-a3a98d97deaa",
      contents: { "en": `Your request to withdraw ${pay.amount} coins from Wallet is under processing.` },
      headings: { "en": 'Withdrawal Reqeuset Is Under Process' },
      big_picture: "https://blog.taskpigeon.co/wp-content/uploads/2017/06/Advanced-Email-Notifications-Task-Pigeon.jpg",
      url: "",
      include_player_ids: [user.deviceId]
    };

    var headers = {
      "Content-Type": "application/json; charset=utf-8",
      "Authorization": "Basic MjNhMTlkNWMtYmJmOS00MTA3LWJiNzQtNjI4MjE0N2NjYWU2"
    };

    var options = {
      host: "onesignal.com",
      port: 443,
      path: "/api/v1/notifications",
      method: "POST",
      headers: headers
    };


    var https = require('https');
    var requestpush = https.request(options, function (res) {
      res.on('data', function (datapush) {
        console.log("Response:");
        // // console.log(JSON.parse(datapush));

      });
    });

    requestpush.on('error', function (e) {
      console.log("ERROR:");
      console.log(e);
    });

    requestpush.write(JSON.stringify(datapush));
    requestpush.end();

    Payment.findOneAndUpdate({
      '_id': req.body.paymentId
    }, { isProcessing: true }, async function (err, updateMessage) {
      if (err) {
        resource.send({ err, success: false, message: "Error in update payment" });
      } else {
        resource.send({ updateMessage, success: true, message: "Update Successfully" });
      }
    })

  }
  catch (error) {
    console.log(error);
    resource.send({ error, success: false, message: "Unknown error" });
  }
}

// Search Users
module.exports.searchUsers = async (req, res) => {
  try {
    let { userId } = jwt.decode(req.params.token);
    let subadmin = await SubAdmin.findOne({ _id: userId });
    if (!subadmin._id) return res.send({ error, success: false, message: "Please login in again." });
    if (subadmin.token != req.params.token) return res.send({ success: false, message: "Token Invalid. Please login in again." });

    let manager = await SubAdmin.findOne({ _id: subadmin.managerId });

    var users = [];
    var team;

    let search = req.body.search;
    let skipIndex = req.body.page - 1;
    let limit = JSON.parse(req.body.limit);
    let skip_size = skipIndex * limit;

    const doc = await User.find({ $or: [{ name: { $regex: `${search}`, $options: 'i', } }, { username: { $regex: `${search}`, $options: 'i', } }, { phone: { $regex: `${search}` } }], type: 'Subadmin', typeId: subadmin.managerId }).sort({ createdAt: -1 }).skip(skip_size).limit(limit);

    console.log(doc);

    var request = require('request');
    var options = {
      'method': 'POST',
      'url': 'https://rnapi.paisaexch.com/api/getAllUser',
      'headers': {
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      form: {
        'manager': manager.username
      }
    };
    request(options, async function (error, response) {
      let body = JSON.parse(response.body);
      if (error) throw new Error(error);
      let datauser = body.data;


      // const doc = await User.find({ type: 'Subadmin', typeId: subadmin.managerId, status: 'active' }).sort({ createdAt: -1 }).skip(skip_size).limit(limit);
      // console.log(doc);
      team = doc;
      for (let i = 0; i < doc.length; i++) {
        let username = doc[i].username;
        let data = datauser.filter(a => a.username == username);
        var obj = team[i];
        var obj2 = { paisaData: data[0] };
        Object.assign(obj, obj2);
        users.push(obj);
      }
      res.send({ users, success: true, message: "Users get successfully" });


    });
  }
  catch (error) {
    console.log(error);
    res.send({ error, success: false, message: "Unknown error" });
  }
}

//User Register
module.exports.createUser = async (req, res) => {
  try {
    let { userId } = jwt.decode(req.params.token);
    let subadmin = await SubAdmin.findOne({ _id: userId });
    if (!subadmin._id) return res.send({ error, success: false, message: "Please login in again." });
    if (subadmin.token != req.params.token) return res.send({ success: false, message: "Token Invalid. Please login in again." });

    var resultname = subadmin.username + Math.floor(1000 + Math.random() * 9000);

    User.find({
      type: 'Subadmin',
      typeId: subadmin.managerId,
      $or: [
        { 'phone': req.body.phone },
        { 'username': resultname }
      ]
    }, function (err, docs) {
      //  if(!err) res.send(docs);
      if (err) {
        res.send({ error: err, success: false, message: "DB Error" });
      }
      else if (docs.length > 0) {
        res.send({ error: {}, success: false, message: "User already registered" });
      }
      else {
        let otp = Math.floor(1000 + Math.random() * 9000);

        let id = subadmin.paisaexchId;

        var options = {
          'method': 'POST',
          'url': 'http://159.65.22.20:3006/api/createUser',
          'headers': {
            'cache-control': 'no-cache',
            'content-type': 'application/x-www-form-urlencoded',
            'postman-token': 'bd01daf8-bf7f-0688-a7c5-5c38ec34c6f8'
          },
          form: {
            'username': resultname,
            'password': req.body.password,
            '_id': id
          }
        };
        request(options, async function (error, response) {
          let body = JSON.parse(response.body);

          if (error) {
            res.send({ error, success: false, message: "DB error in user register" });
          } else if (body.error == true) {
            res.send({ error, success: false, message: body.message });
          }
          else {
            const user = new User({
              name: req.body.name,
              username: resultname,
              phone: req.body.phone,
              password: util.hashPassword(req.body.password),
              promo: '',
              type: 'Subadmin',
              typeId: subadmin.managerId,
              otp: otp,
              status: 'active',
              paisaexchId: body.response._id,
            });
            user.save()
              .then(doc => {
                res.send({ doc, success: true, message: "User registered" });
              })
              .catch(error => {
                res.send({ error, success: false, message: "DB error in user register" });
              })
          }

        });

      }
    });
  }
  catch (error) {
    res.send({ error, success: false, message: "Unknown error" });
  }
}

//Uodate User Status
module.exports.updatenewuserStatus = async (req, res) => {
  try {
    let { userId } = jwt.decode(req.params.token);
    let subadmin = await SubAdmin.findOne({ _id: userId });
    if (!subadmin._id) return res.send({ error, success: false, message: "Please login in again." });
    if (subadmin.token != req.params.token) return res.send({ success: false, message: "Token Invalid. Please login in again." });

    await User.findOneAndUpdate({ username: req.body.username }, { status: req.body.status }, { new: true })
      .then(function (dbProduct) {

        var options = {
          'method': 'POST',
          'url': 'https://rnapi.paisaexch.com/api/updateUserStatus',
          'headers': {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            "username": req.body.username,
            "status": req.body.status
          })

        };
        request(options, function (error, response) {
          if (error) throw new Error(error);
          res.send({ data: dbProduct, success: true, message: "Status updated" });
        });

        // res.send({ data: dbProduct, success: true, message: "Status updated" });
      })
      .catch(function (err) {
        // If an error occurred, send it to the client
        res.send({ data: {}, success: False, message: "Error in status update" });
      });

  }
  catch (error) {
    console.log(error);
    res.send({ error, success: false, message: "Unknown error" });
  }
}

