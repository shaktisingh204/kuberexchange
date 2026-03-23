var mongoose = require('mongoose');
var logger = require('log4js').getLogger();

// const User = require('../models/userModel');
const Site = require('../models/siteModel');
const PaymentMethod = require('../models/paymentmethodModel');
const Payment = require('../models/paymentModel');
const Withdrawal = require('../models/withdrawalModel.js');
const Mysite = require('../models/mysitesModel');
const WithdrawnMethod = require('../models/withdrawnMethodModel');
const Notification = require('../models/notificationModel');
const SubAdmin = require('../models/subadminModel');
const Manager = require('../models/managerModel');

var User = mongoose.model('User');

const { ObjectId } = require('mongodb');

const myEnv = require('dotenv').config();

// Required Helper Function
const util = require('./util');
const jwt = require('jsonwebtoken');
const fs = require("fs");
var request = require('request');

// Message API Key
const api_key = 'e6c032ca-eca9-11ec-9c12-0200cd936042';
const ShoutoutClient = require('shoutout-sdk');
const apiKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJqdGkiOiI0NTljMmI4MC1jYWE1LTExZWMtYjcyMy03ZDNlMmQ0ZDQ3MTciLCJzdWIiOiJTSE9VVE9VVF9BUElfVVNFUiIsImlhdCI6MTY1MTU1NzE3MiwiZXhwIjoxOTY3MTc2MzcyLCJzY29wZXMiOnsiYWN0aXZpdGllcyI6WyJyZWFkIiwid3JpdGUiXSwibWVzc2FnZXMiOlsicmVhZCIsIndyaXRlIl0sImNvbnRhY3RzIjpbInJlYWQiLCJ3cml0ZSJdfSwic29fdXNlcl9pZCI6IjY2OTA0Iiwic29fdXNlcl9yb2xlIjoidXNlciIsInNvX3Byb2ZpbGUiOiJhbGwiLCJzb191c2VyX25hbWUiOiIiLCJzb19hcGlrZXkiOiJub25lIn0.Eu7O747baCkA6v0896sVsv39qZvEqpBLQPPyiwof6_k';
const debug = true, verifySSL = false;


// Get Payment Method
module.exports.getPaymentMethod = async (req, res) => {
    try {
        let { userId } = jwt.decode(req.params.token);
        let subadmin = await User.findOne({ _id: userId });
        if (!subadmin._id) return res.send({ error, success: false, message: "Please login in again." });
        if (subadmin.token != req.params.token) return res.send({ success: false, message: "Token Invalid. Please login in again." });

        PaymentMethod.find({ typeId: userId, }).sort({ createdAt: -1 })
            .then(doc => {
                res.send({ doc, success: true, message: "Payment Methods get successfully" });
            })
            .catch(error => {
                res.send({ error, success: false, message: "DB error in getting Peyment Method" });
            })
    }
    catch (error) {
        console.log(error)
        res.send({ error, success: false, message: "Unknown error" });
    }
}

//Payment Deposit
module.exports.depositPayment = async (req, res) => {
    try {
        let decoded = jwt.verify(req.params.token, myEnv.parsed.SECRET);
        let { userId } = jwt.decode(req.params.token);
        let user = await User.findOne({ _id: userId });
        if (!user._id || user.status === 'inactive') return res.send({ success: false, message: "Token Invalid. Please login in again." });
        if (user.token != req.params.token) return res.send({ success: false, message: "Token Invalid. Please login in again." });
        let max = 500;

        if (req.body.amount < max) return res.send({ success: false, message: `Amount can't be less than ${max}.` });

        let query;
        let imageName = [];
        let time = new Date().getTime();
        var base64Data;
        let image;
        if (req.body.imagetype) {
            console.log(req.body.imagetype);
            let mimetype = req.body.imagetype.split("/").pop();
            console.log(mimetype);
            if (mimetype == 'jpeg') {
                base64Data = req.body.image.replace(/^data:image\/jpeg;base64,/, "");
                image = `${time}.jpeg`;
            } else if (mimetype == 'jpg') {
                base64Data = req.body.image.replace(/^data:image\/jpg;base64,/, "");
                image = `${time}.jpg`;
            } else {
                base64Data = req.body.image.replace(/^data:image\/png;base64,/, "");
                image = `${time}.png`;
            }
        } else {
            base64Data = req.body.image.replace(/^data:image\/png;base64,/, "");
            image = `${time}.png`;
        }

        require("fs").writeFile(`uploads/screenshot/${image}`, base64Data, 'base64', function (err) {
            // console.log(err);
        });
        imageName.push(image);

        // if (req.files.length > 0) {
        //     for (let i = 0; i < req.files.length; i++) {
        //         image = req.files[i].filename;
        //         imageName.push(image);
        //     }
        // }
        // else {
        //     imageName = []
        // }


        var characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
        var result = ""
        var charactersLength = characters.length;

        for (var i = 0; i < 10; i++) {
            result += characters.charAt(Math.floor(Math.random() * charactersLength));
        }

        let exposure = parseInt(user.exposure) + parseInt(req.body.amount);

        if (req.body.deviceId) {
            deviceId = JSON.parse(req.body.deviceId);
        }
        else if (user.deviceId) {
            deviceId = user.deviceId
        }
        else {
            deviceId = ''
        }

        const payment = new Payment({
            type: 'Deposit',
            userId: user._id,
            amount: req.body.amount,
            name: user.fullname,
            username: user.username,
            paymentType: req.body.type,
            depositId: req.body.depositId,
            status: 'Pending',
            image: imageName,
            managerType: user.ParentRole,
            managerId: user.ParentId,
            balance: user.balance,
            to: "Wallet",
            refrenceNo: result
        });
        payment.save()
            .then(async doc => {

                // Push Notification Start
                // if (manager.playerId) {

                //     let deviceIds = [manager.playerId];
                //     let partner = await User.find({ managerId: user.typeId });
                //     for (let i = 0; i < partner.length; i++) {
                //         if (partner[i].playerId) {
                //             deviceIds.push(partner[i].playerId);
                //         }
                //     }

                //     var datapush = {
                //         app_id: "9adf2973-6d8a-4a42-9ce0-a3a98d97deaa",
                //         contents: { "en": `${user.name} has created a request to deposit amount of ${req.body.amount}` },
                //         headings: { "en": "Deposit Payment Request" },
                //         big_picture: "https://blog.taskpigeon.co/wp-content/uploads/2017/06/Advanced-Email-Notifications-Task-Pigeon.jpg",
                //         url: "",
                //         include_player_ids: deviceIds
                //     };

                //     var headers = {
                //         "Content-Type": "application/json; charset=utf-8",
                //         "Authorization": "Basic MjNhMTlkNWMtYmJmOS00MTA3LWJiNzQtNjI4MjE0N2NjYWU2"
                //     };

                //     var options = {
                //         host: "onesignal.com",
                //         port: 443,
                //         path: "/api/v1/notifications",
                //         method: "POST",
                //         headers: headers
                //     };


                //     var https = require('https');
                //     var requestpush = https.request(options, function (res) {
                //         res.on('data', function (datapush) {
                //             // console.log("Response:");
                //             // // console.log(JSON.parse(datapush));

                //         });
                //     });

                //     requestpush.on('error', function (e) {
                //         // console.log("ERROR:");

                //         // console.log(e);
                //     });

                //     requestpush.write(JSON.stringify(datapush));
                //     requestpush.end();
                // }
                // Push Notification End


                User.updateOne({
                    '_id': userId
                }, { balance: user.balance, exposure: exposure, deviceId: deviceId }, async function (error, updateUser) {
                    res.send({ doc, success: true, message: "Deposit registered" });
                });
            })
            .catch(error => {
                console.log(error);
                res.send({ error, success: false, message: "DB error in deposit register" });
            })
    }
    catch (error) {
        console.log(error);
        res.send({ error, success: false, message: "Unknown error" });
    }
}

//Add Withdrawal Method
module.exports.withdrawalMethod = async (req, res) => {
    try {
        let decoded = jwt.verify(req.params.token, myEnv.parsed.SECRET);
        let { userId } = jwt.decode(req.params.token);
        let user = await User.findOne({ _id: userId });
        if (!user._id) return res.send({ success: false, message: "Token Invalid. Please login in again." });
        if (user.token != req.params.token) return res.send({ success: false, message: "Token Invalid. Please login in again." });

        let status;
        let withdrawn = await Withdrawal.findOne({ userId: userId, type: req.body.type });
        if (!withdrawn) {
            status = true;
        } else {
            status = false;
        }

        let withdrawalType = await WithdrawnMethod.findOne({ _id: req.body.withdrawlId });

        let data;
        if (req.body.type == 'bank') {
            data = {
                type: req.body.type,
                userId: userId,
                bankName: req.body.bankName,
                name: req.body.name,
                accnumber: req.body.accnumber,
                ifsc: req.body.ifsc,
                withdrawnMethod: req.body.withdrawlId,
                status: status
            }
        } else {
            data = {
                type: withdrawalType.type,
                userId: userId,
                name: req.body.name,
                upi: req.body.upi,
                withdrawnMethod: req.body.withdrawlId,
                status: status
            }
        }

        const withdrawal = new Withdrawal(data);
        withdrawal.save()
            .then(async doc => {

                await WithdrawnMethod.findOneAndUpdate({ _id: req.body.withdrawlId }, { $push: { withdrawns: doc._id } }, { new: true })
                    .then(function (dbProduct) {
                        // If we were able to successfully update a Product, send it back to the client
                        console.log(dbProduct);
                    })
                    .catch(function (err) {
                        // If an error occurred, send it to the client
                        console.log(err);
                    });

                res.send({ doc, success: true, message: "Withdrawal registered" });
            })
            .catch(error => {
                res.send({ error, success: false, message: "DB error in withdrawal register" });
            })
    }
    catch (error) {
        res.send({ error, success: false, message: "Unknown error" });
    }
}

// Get Withdrawn Method
module.exports.getwithdrawnMethod = async (req, res) => {
    try {

        let decoded = jwt.verify(req.params.token, myEnv.parsed.SECRET);
        let { userId } = jwt.decode(req.params.token);
        let user = await User.findOne({ _id: userId });
        if (!user._id) return res.send({ success: false, message: "Token Invalid. Please login in again." });
        if (user.token != req.params.token) return res.send({ success: false, message: "Token Invalid. Please login in again." });


        WithdrawnMethod.
            find({}).
            populate({ path: 'withdrawns', match: { userId: userId } }).
            exec(function (err, data) {
                if (err) {
                    res.send({ error: err, success: false, message: "Unknown error" });
                }
                else {
                    res.send({ data: data, success: true, message: "Withdrawn Method get successfully" });
                }
            });

    }
    catch (error) {
        res.send({ error, success: false, message: "Unknown error" });
    }
}

//Payment Withdrawal
module.exports.withdrawalPayment = async (req, res) => {
    try {
        let decoded = jwt.verify(req.params.token, myEnv.parsed.SECRET);
        let { userId } = jwt.decode(req.params.token);

        let user = await User.findOne({ _id: userId });
        if (!user._id || user.status === 'inactive') return res.send({ success: false, message: "Token Invalid. Please login in again." });
        let max = 500;
        // if (user.typeId === '62b013cd6d70f31108551e35' || user.typeId === '631195e7d84105a6457fd88e') {
        //     max = 100;
        // }
        if (req.body.amount < max) return res.send({ success: false, message: `Amount can't be less than ${max}.` });

        let getWithdrawnMethod = await WithdrawnMethod.findOne({ type: req.body.type });
        // if (getWithdrawnMethod.manager && getWithdrawnMethod.manager.includes(user.typeId)) return res.send({ success: false, message: `${req.body.type} is currently disabled.` });

        // if (parseInt(user.wallet) < parseInt(req.body.amount)) return res.send({ success: false, message: "You don't have sufficients funds." });

        let query;
        // let manager;
        // if (user.type == "Manager") {
        //     query = "Admin"
        //     manager = await Manager.findOne({ _id: user.typeId });
        // } else {
        //     query = "Subadmin"
        //     manager = await User.findOne({ _id: user.typeId });
        // }

        var characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
        var result = ""
        var charactersLength = characters.length;

        for (var i = 0; i < 10; i++) {
            result += characters.charAt(Math.floor(Math.random() * charactersLength));
        }

        let balance = parseInt(user.balance) - parseInt(req.body.amount);
        let exposure = parseInt(user.exposure) + parseInt(req.body.amount);


        // var request = require('request');
        // var options = {
        //     'method': 'GET',
        //     'url': `https://wapi.paisaexch.com/api/balance/${user.username}`,
        //     'headers': {
        //     }
        // };
        // request(options,async function (error, response) {
        //     if (error) {
        //         console.log(error);
        //         res.send({ error, success: false, message: "Error in withdrawal request" });
        //     } else {
        //         let body = JSON.parse(response.body);

        //         if (body.error == true) {
        //             console.log(body.error);
        //             res.send({ error: body.error, success: false, message: body.message });
        //         }
        //         else if (body.response.balance < req.body.amount) {
        //             res.send({ error: {}, success: false, message: "User don't have sufficient ammount" });
        //         } else {

        // var request = require('request');
        // var options = {
        //     'method': 'POST',
        //     'url': 'https://wapi.paisaexch.com/api/updatewithdraw',
        //     'headers': {
        //         'cache-control': 'no-cache',
        //         'content-type': 'application/x-www-form-urlencoded',
        //         'postman-token': '15dc1ded-e6b9-d2e2-f73e-1d4ce00f568a'
        //     },
        //     form: {
        //         'username': user.username,
        //         'amount': req.body.amount
        //     }
        // };
        // request(options, async function (error, response) {
        //     let body = JSON.parse(response.body);
        // if (error) {
        //     console.log(error);
        //     res.send({ error, success: false, message: "Error in withdrawal request" });
        // } else if (body.error == true) {
        //     console.log(body.error);
        //     res.send({ error: body.error, success: false, message: body.message });
        // } else {

        // Push Notification Start
        // if (user.ParentId) {
        //     let deviceIds = [user.ParentId];
        //     let partner = await User.find({ username: user.ParentId });
        //     for (let i = 0; i < partner.length; i++) {
        //         if (partner[i].playerId) {
        //             deviceIds.push(partner[i].playerId);
        //         }
        //     }

        //     var datapush = {
        //         app_id: "9adf2973-6d8a-4a42-9ce0-a3a98d97deaa",
        //         contents: { "en": `${user.name} has created a request to withdraw amount of ${req.body.amount}` },
        //         headings: { "en": "Withdrawal Payment Request" },
        //         big_picture: "https://blog.taskpigeon.co/wp-content/uploads/2017/06/Advanced-Email-Notifications-Task-Pigeon.jpg",
        //         url: "",
        //         include_player_ids: deviceIds
        //     };

        //     var headers = {
        //         "Content-Type": "application/json; charset=utf-8",
        //         "Authorization": "Basic MjNhMTlkNWMtYmJmOS00MTA3LWJiNzQtNjI4MjE0N2NjYWU2"
        //     };

        //     var options = {
        //         host: "onesignal.com",
        //         port: 443,
        //         path: "/api/v1/notifications",
        //         method: "POST",
        //         headers: headers
        //     };


        //     var https = require('https');
        //     var requestpush = https.request(options, function (res) {
        //         res.on('data', function (datapush) {
        //             console.log("Response:");
        //             // console.log(JSON.parse(datapush));

        //         });
        //     });

        //     requestpush.on('error', function (e) {
        //         console.log("ERROR:");

        //         console.log(e);
        //     });

        //     requestpush.write(JSON.stringify(datapush));
        //     requestpush.end();
        // }
        // Push Notification End

        const payment = new Payment({
            type: 'Withdrawal',
            userId: user._id,
            amount: req.body.amount,
            name: user.name,
            username: user.username,
            paymentType: req.body.type,
            paymentId: req.body.paymentId,
            status: 'Pending',
            managerType: user.ParentRole,
            managerId: user.ParentId,
            balance: balance,
            to: "Wallet",
            refrenceNo: result
        });
        payment.save()
            .then(doc => {
                User.updateOne({
                    '_id': userId
                }, { balance: balance, exposure: exposure }, async function (error, updateUser) {
                    res.send({ doc, success: true, message: "Withdrawal registered" });
                });
            })
            .catch(error => {
                console.log(error);
                res.send({ error, success: false, message: "DB error in withdrawal register" });
            })

        // }
        // });
        // }
        // }
        // });
    }
    catch (error) {
        console.log(error);
        res.send({ error, success: false, message: "Unknown error" });
    }
}

// Get Transaction
module.exports.getPayment = async (req, res) => {
    try {
        let decoded = jwt.verify(req.params.token, myEnv.parsed.SECRET);
        let { userId } = jwt.decode(req.params.token);
        let user = await User.findOne({ _id: userId });
        if (!user._id) return res.send({ success: false, message: "Token Invalid. Please login in again." });
        if (user.token != req.params.token) return res.send({ success: false, message: "Token Invalid. Please login in again." });

        Payment.
            find({ userId: userId }).
            populate('sites').
            sort({ createdAt: -1 }).
            exec(function (err, data) {
                if (err) return handleError(err);
                res.send({ data: data, success: true, message: "Transaction get successfully" });
                // prints "The author is Ian Fleming"
            });


    }
    catch (error) {
        res.send({ error, success: false, message: "Unknown error" });
    }
}

// Get Transaction By Id
module.exports.gettransactionById = async (req, res) => {
    try {

        let decoded = jwt.verify(req.params.token, myEnv.parsed.SECRET);
        let { userId } = jwt.decode(req.params.token);
        let user = await User.findOne({ _id: userId });
        if (!user._id) return res.send({ success: false, message: "Token Invalid. Please login in again." });
        if (user.token != req.params.token) return res.send({ success: false, message: "Token Invalid. Please login in again." });

        Payment.
            findOne({ _id: req.body.id }).
            populate('sites').
            populate('paymentId').
            populate('mysites').
            populate('depositId').
            exec(function (err, data) {
                if (err) return handleError(err);
                res.send({ data: data, success: true, message: "Transaction get successfully" });
                // prints "The author is Ian Fleming"
            });
    }
    catch (error) {
        res.send({ error, success: false, message: "Unknown error" });
    }
}

// Delete Withdrawl Method
module.exports.deleteWithdrawlMethod = async (req, res) => {
    try {

        let decoded = jwt.verify(req.params.token, myEnv.parsed.SECRET);
        let { userId } = jwt.decode(req.params.token);
        let user = await User.findOne({ _id: userId });
        if (!user._id) return res.send({ success: false, message: "Token Invalid. Please login in again." });
        if (user.token != req.params.token) return res.send({ success: false, message: "Token Invalid. Please login in again." });

        let pending = await Payment.findOne({ userId: userId, type: 'Withdrawal', status: 'Pending' });

        if (!pending || pending.length == 0) {
            await Withdrawal.deleteOne({ _id: req.body.id })
                .then(result => {
                    console.log("slot deletemany");
                    res.send({ data: result, success: true, message: "Withdrawal deleted successfully" });
                })
                .catch(error => {
                    res.send({ error, success: false, message: "Error in deleting Withdrawal" });
                })
        } else {
            res.send({ error: {}, success: false, message: "You have pending Withdrawal request" });
        }



    }
    catch (error) {
        console.log(error)
        res.send({ error, success: false, message: "Unknown error" });
    }
}












// Verify Number
module.exports.verifyNumber = (req, res) => {
    try {
        User.findOne({ phone: req.body.phone, type: req.body.type, typeId: req.body.typeId })
            .then(doc => {
                res.send({ doc, success: true, message: "User get succcessfully" });
            })
            .catch(error => {
                res.send({ error, success: false, message: "DB error in getting user" });
            })
    }
    catch (error) {
        res.send({ error, success: false, message: "Unknown error" });
    }
}

//User Register
module.exports.register = async (req, res) => {
    try {
        let manager;
        if (req.body.type == "Manager") {
            manager = await Manager.findOne({ _id: req.body.typeId });
        } else {
            manager = await User.findOne({ _id: req.body.typeId });
        }

        var resultname = manager.username + Math.floor(1000 + Math.random() * 9000);

        User.find({
            type: req.body.type,
            typeId: req.body.typeId,
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

                var options = {
                    'method': 'GET',
                    'url': `https://2factor.in/API/V1/${api_key}/SMS/${req.body.phone}/${otp}`,
                    'headers': {
                        'content-type': 'application/x-www-form-urlencoded'
                    }
                };
                request(options, async function (error, response) {
                    if (error) {
                        res.send({ error: err, success: false, message: "Please enter correct phone number." });
                    }
                    else {

                        let id;
                        if (req.body.type == 'Subadmin') {
                            let subadmin = await User.findOne({ _id: req.body.typeId });
                            id = subadmin.paisaexchId;
                        } else {
                            let manager = await Manager.findOne({ _id: req.body.typeId });
                            id = manager.paisaexchId;
                        }

                        var options = {
                            'method': 'POST',
                            'url': 'https://rnapi.paisaexch.com/api/createUser',
                            'headers': {
                                'cache-control': 'no-cache',
                                'content-type': 'application/x-www-form-urlencoded',
                                'postman-token': 'bd01daf8-bf7f-0688-a7c5-5c38ec34c6f8'
                            },
                            form: {
                                'username': resultname,
                                'password': req.body.password,
                                '_id': id,
                                'phone': req.body.phone,
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
                                    promo: req.body.promo,
                                    type: req.body.type,
                                    typeId: req.body.typeId,
                                    otp: otp,
                                    status: 'inactive',
                                    paisaexchId: body.response._id,
                                });
                                user.save()
                                    .then(async doc => {


                                        // Push Notification Start
                                        if (manager.playerId) {
                                            let deviceIds = [manager.playerId];
                                            let partner = await User.find({ managerId: user.typeId });
                                            for (let i = 0; i < partner.length; i++) {
                                                if (partner[i].playerId) {
                                                    deviceIds.push(partner[i].playerId);
                                                }
                                            }
                                            var datapush = {
                                                app_id: "9adf2973-6d8a-4a42-9ce0-a3a98d97deaa",
                                                contents: { "en": `${req.body.name} has been registered` },
                                                headings: { "en": "New User Registered" },
                                                big_picture: "https://blog.taskpigeon.co/wp-content/uploads/2017/06/Advanced-Email-Notifications-Task-Pigeon.jpg",
                                                url: "",
                                                include_player_ids: deviceIds,
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
                                        }
                                        // Push Notification End

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
        });
    }
    catch (error) {
        console.log(error);
        res.send({ error, success: false, message: "Unknown error" });
    }
}

// Verify OTP
module.exports.verifyOtp = (req, res) => {
    try {
        User.findOne({ phone: req.body.phone, type: req.body.type, typeId: req.body.typeId })
            .then(doc => {
                if (doc.otp == req.body.otp) {
                    var options = {
                        'method': 'POST',
                        'url': 'https://rnapi.paisaexch.com/api/updateUserStatus',
                        'headers': {
                            'Content-Type': 'application/json'
                        },
                        body: JSON.stringify({
                            "username": doc.username,
                            "status": "active"
                        })

                    };
                    request(options, function (error, response) {
                        if (error) throw new Error(error);
                        console.log(response.body);
                    });

                    User.updateOne({ _id: doc._id }, { status: "active" })
                        .then(user => {
                            console.log('Status Updated');
                        })
                        .catch(error => {
                            console.log('Error In Status Update');
                        })
                    return res.send({ data: doc, success: true, message: "Otp has been verified successfully" });
                }
                else {
                    res.send({ data: {}, success: false, message: "Please enter correct otp" });
                }
            })
            .catch(error => {
                res.send({ error, success: false, message: "DB error in getting user" });
            })
    }
    catch (error) {
        res.send({ error, success: false, message: "Unknown error" });
    }
}

module.exports.updateStatus = (req, res) => {
    try {
        User.updateOne({ username: req.body.username }, { status: req.body.status })
            .then(user => {
                return res.send({ data: user, success: true, message: "Otp has been verified successfully" });
            })
            .catch(error => {
                return res.send({ error: error, success: false, message: "Otp has been verified successfully" });
            })
    }
    catch (error) {
        res.send({ error, success: false, message: "Unknown error" });
    }
}

// User Login
module.exports.login = (req, res) => {
    try {
        let { phone, password } = req.body;
        if (!phone || !password) return res.send({ success: false, message: "missing field/'s" });

        else {
            User.findOne({ phone: phone })
                .then(doc => {
                    if (!doc) return res.send({ data: {}, success: false, message: "No such user found" });

                    if (doc.status == 'inactive') return res.send({ data: {}, success: false, message: "Please login with otp to verify number" });

                    if (!util.comparePassword(doc.password, password)) {
                        return res.send({ data: {}, success: false, message: "Incorrect password" });
                    }
                    else {
                        const token = util.generateToken(doc._id);

                        User.updateOne({
                            '_id': doc._id
                        }, { token: token }, function (err, updateMessage) {

                        });

                        const data = { doc, token }
                        res.send({ data, success: true, message: "user login success" });
                    }
                })
                .catch(error => {
                    res.send({ error, success: false, message: "DB error" });
                })
        }
    }
    catch (error) {
        res.send({ error, success: false, message: "unknown error" });
    }
}

// User Login with Username
module.exports.userlogin = (req, res) => {
    try {
        let { username, password } = req.body;
        if (!username || !password) return res.send({ success: false, message: "missing field/'s" });

        else {
            User.findOne({ username: username })
                .then(doc => {
                    if (!doc) return res.send({ data: {}, success: false, message: "No such user found" });

                    if (!util.comparePassword(doc.password, password)) {
                        return res.send({ data: {}, success: false, message: "Incorrect password" });
                    }
                    else {
                        const token = util.generateToken(doc._id);

                        User.updateOne({
                            '_id': doc._id
                        }, { token: token }, function (err, updateMessage) {

                        });

                        const data = { doc, token }
                        res.send({ data, success: true, message: "user login success" });
                    }
                })
                .catch(error => {
                    res.send({ error, success: false, message: "DB error" });
                })
        }
    }
    catch (error) {
        res.send({ error, success: false, message: "unknown error" });
    }
}

// User Login With Otp
module.exports.loginOtp = (req, res) => {
    try {
        let { phone } = req.body;
        if (!phone) return res.send({ success: false, message: "missing field/'s" });

        else {

            User.findOne({ phone: phone, type: req.body.type, typeId: req.body.typeId })
                .then(doc => {

                    let otp = Math.floor(1000 + Math.random() * 9000);
                    var options = {
                        'method': 'GET',
                        'url': `https://2factor.in/API/V1/${api_key}/SMS/${req.body.phone}/${otp}`,
                        'headers': {
                            'content-type': 'application/x-www-form-urlencoded'
                        }
                    };
                    request(options, async function (error, response) {
                        if (error) {
                            res.send({ error: err, success: false, message: "Please enter correct phone number." });
                        }
                        else {

                            User.updateOne({ _id: doc._id }, { otp: otp })
                                .then(user => {
                                    res.send({ data: user, success: true, message: "Otp Has been sent!" });
                                })
                                .catch(error => {
                                    res.send({ error, data: {}, success: false, message: "Failed to send otp" });
                                })

                        }
                    });

                })
                .catch(error => {
                    res.send({ error, success: false, message: "DB error" });
                })
        }
    }
    catch (error) {
        res.send({ error, success: false, message: "unknown error" });
    }
}

// Verify login OTP
module.exports.verifyloginOtp = (req, res) => {
    try {
        User.findOne({ phone: req.body.phone, type: req.body.type, typeId: req.body.typeId })
            .then(doc => {
                if (doc.otp == req.body.otp) {
                    User.updateOne({ _id: doc._id }, { status: "active" })
                        .then(user => {
                            console.log('Status Updated');
                        })
                        .catch(error => {
                            console.log('Error In Status Update');
                        })
                    const token = util.generateToken(doc._id);

                    const data = { doc, token }
                    res.send({ data, success: true, message: "user login success" });
                }
                else {
                    res.send({ data: {}, success: false, message: "Please enter correct otp" });
                }
            })
            .catch(error => {
                res.send({ error, success: false, message: "DB error in getting user" });
            })
    }
    catch (error) {
        res.send({ error, success: false, message: "Unknown error" });
    }
}

// Get Sites
module.exports.getSite = async (req, res) => {
    try {
        let decoded = jwt.verify(req.params.token, myEnv.parsed.SECRET);
        let { userId } = jwt.decode(req.params.token);
        let user = await User.findOne({ _id: userId });
        if (!user._id) return res.send({ success: false, message: "Token Invalid. Please login in again." });
        if (user.token != req.params.token) return res.send({ success: false, message: "Token Invalid. Please login in again." });

        let query;
        if (user.type == "Manager") {
            query = { type: "Admin", status: 'active' }
        } else {
            query = { type: "Subadmin", typeId: user.typeId, status: 'active' }
        }

        Site.find(query)
            .then(doc => {
                res.send({ doc, success: true, message: "Sites get successfully" });
            })
            .catch(error => {
                res.send({ error, success: false, message: "DB error in getting sites" });
            })
    }
    catch (error) {
        console.log(error);
        res.send({ error, success: false, message: "Unknown error" });
    }
}



// Forgot Password
module.exports.forgotPassword = (req, res) => {
    try {
        let { phone } = req.body;
        if (!phone) return res.send({ success: false, message: "missing field/'s" });

        else {

            User.findOne({ phone: phone, type: req.body.type, typeId: req.body.typeId })
                .then(doc => {

                    let otp = Math.floor(1000 + Math.random() * 9000);
                    var options = {
                        'method': 'GET',
                        'url': `https://2factor.in/API/V1/${api_key}/SMS/${req.body.phone}/${otp}`,
                        'headers': {
                            'content-type': 'application/x-www-form-urlencoded'
                        }
                    };
                    request(options, async function (error, response) {
                        if (error) {
                            res.send({ error: err, success: false, message: "Please enter correct phone number." });
                        }
                        else {
                            console.log(response.body);

                            User.updateOne({ _id: doc._id }, { otp: otp })
                                .then(user => {
                                    res.send({ data: user, success: true, message: "Otp Has been sent!" });
                                })
                                .catch(error => {
                                    res.send({ error, data: {}, success: false, message: "Failed to send otp" });
                                })

                        }
                    });

                })
                .catch(error => {
                    res.send({ error, success: false, message: "DB error" });
                })
        }
    }
    catch (error) {
        res.send({ error, success: false, message: "unknown error" });
    }
}

// Update Password
module.exports.updatePassword = (req, res) => {
    try {
        let { phone, password } = req.body;
        if (!phone, !password) return res.send({ success: false, message: "missing field/'s" });

        else {
            User.findOne({ phone: req.body.phone, type: req.body.type, typeId: req.body.typeId })
                .then(doc => {
                    if (doc.otp == req.body.otp) {
                        User.updateOne({ phone: phone, type: req.body.type, typeId: req.body.typeId }, { password: util.hashPassword(password) })
                            .then(user => {
                                res.send({ data: user, success: true, message: "Password has been updated successfully" });
                            })
                            .catch(error => {
                                res.send({ error, data: {}, success: false, message: "Failed to update password" });
                            })

                    }
                    else {
                        res.send({ data: {}, success: false, message: "Please enter correct otp" });
                    }
                });
        }
    }
    catch (error) {
        res.send({ error, success: false, message: "unknown error" });
    }
}



//Create My Sites
module.exports.createMysites = async (req, res) => {
    try {
        let decoded = jwt.verify(req.params.token, myEnv.parsed.SECRET);
        let { userId } = jwt.decode(req.params.token);
        let user = await User.findOne({ _id: userId });
        if (!user._id) return res.send({ success: false, message: "Token Invalid. Please login in again." });
        if (user.token != req.params.token) return res.send({ success: false, message: "Token Invalid. Please login in again." });
        // if (req.body.paymentType == 'wallet' && parseInt(user.wallet) < parseInt(req.body.amount)) return res.send({ success: false, message: "You don't have sufficients funds." });
        let max = 500;
        if (user.typeId === '62b013cd6d70f31108551e35' || user.typeId === '631195e7d84105a6457fd88e') {
            max = 100;
        }
        if (req.body.amount < max) return res.send({ success: false, message: `Amount can't be less than ${max}.` });

        let query;
        let manager;
        if (user.type == "Manager") {
            query = "Admin"
            manager = await Manager.findOne({ _id: user.typeId });
        } else {
            query = "Subadmin"
            manager = await User.findOne({ _id: user.typeId });
        }




        // Push Notification Start
        if (manager.playerId) {
            let deviceIds = [manager.playerId];
            let partner = await User.find({ managerId: user.typeId });
            for (let i = 0; i < partner.length; i++) {
                if (partner[i].playerId) {
                    deviceIds.push(partner[i].playerId);
                }
            }

            var datapush = {
                app_id: "9adf2973-6d8a-4a42-9ce0-a3a98d97deaa",
                contents: { "en": `${user.name} has created a request to create Id` },
                headings: { "en": "Create Id Request" },
                big_picture: "https://blog.taskpigeon.co/wp-content/uploads/2017/06/Advanced-Email-Notifications-Task-Pigeon.jpg",
                url: "",
                include_player_ids: deviceIds,
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
        }
        // Push Notification End


        let imageName = [];
        let time = new Date().getTime();
        var base64Data;
        let image;
        if (req.body.imagetype) {
            console.log(req.body.imagetype);
            let mimetype = req.body.imagetype.split("/").pop();
            console.log(mimetype);
            if (mimetype == 'jpeg') {
                base64Data = req.body.image.replace(/^data:image\/jpeg;base64,/, "");
                image = `${time}.jpeg`;
            } else if (mimetype == 'jpg') {
                base64Data = req.body.image.replace(/^data:image\/jpg;base64,/, "");
                image = `${time}.jpg`;
            } else {
                base64Data = req.body.image.replace(/^data:image\/png;base64,/, "");
                image = `${time}.png`;
            }
        } else {
            base64Data = req.body.image.replace(/^data:image\/png;base64,/, "");
            image = `${time}.png`;
        }

        require("fs").writeFile(`uploads/screenshot/${image}`, base64Data, 'base64', function (err) {
            // console.log(err);
        });
        imageName.push(image);

        var characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
        var result = ""
        var charactersLength = characters.length;

        for (var i = 0; i < 10; i++) {
            result += characters.charAt(Math.floor(Math.random() * charactersLength));
        }

        let balance, exposure;
        if (req.body.paymentType == 'wallet') {
            balance = parseInt(user.wallet) - parseInt(req.body.amount);
            exposure = parseInt(user.exposure) + parseInt(req.body.amount);
        } else {
            balance = parseInt(user.wallet);
            exposure = parseInt(user.exposure);
        }

        if (req.body.paymentType == 'wallet') {

            var request = require('request');
            var options = {
                'method': 'GET',
                'url': `https://wapi.paisaexch.com/api/balance/${user.username}`,
                'headers': {
                }
            };
            request(options, function (error, response) {
                if (error) {
                    res.send({ error, success: false, message: "Error in Creating site" });
                } else {
                    let body = JSON.parse(response.body);

                    if (body.error == true) {
                        res.send({ error, success: false, message: body.message });
                    }
                    else if (body.response.balance < req.body.amount) {
                        res.send({ error, success: false, message: "User don't have sufficient ammount" });
                    } else {

                        var request = require('request');
                        var options = {
                            'method': 'POST',
                            'url': 'https://wapi.paisaexch.com/api/updatewithdraw',
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
                            if (error) {
                                res.send({ error, success: false, message: "Error in creating site" });
                            } else if (body.error == true) {
                                res.send({ error, success: false, message: body.message });
                            } else {

                                const mysite = new Mysite({
                                    userId: userId,
                                    type: user.type,
                                    typeId: user.typeId,
                                    username: req.body.username,
                                    status: "Pending",
                                    sites: req.body.sites,
                                    balance: req.body.amount,
                                    name: user.username,
                                    image: imageName,
                                });
                                mysite.save()
                                    .then(doc => {

                                        const payment = new Payment({
                                            type: 'Deposit',
                                            userId: userId,
                                            amount: req.body.amount,
                                            name: user.name,
                                            username: user.username,
                                            paymentType: req.body.paymentType,
                                            depositId: req.body.depositId,
                                            status: 'Pending',
                                            image: imageName,
                                            managerType: user.type,
                                            managerId: user.typeId,
                                            balance: balance,
                                            to: "Id",
                                            sites: req.body.sites,
                                            mysites: doc._id,
                                            refrenceNo: result,
                                            idReq: 1
                                        });
                                        payment.save()
                                            .then(doc1 => {
                                                User.updateOne({
                                                    '_id': userId
                                                }, { wallet: balance, exposure: exposure }, async function (error, updateUser) {
                                                    res.send({ doc, success: true, message: "My sites created" });
                                                });
                                            })
                                            .catch(error => {
                                                res.send({ error, success: false, message: "DB error in deposit register" });
                                            })

                                    })
                                    .catch(error => {
                                        res.send({ error, success: false, message: "DB error in creating sites" });
                                    })

                            }
                        });
                    }
                }
            });


        } else {

            const mysite = new Mysite({
                userId: userId,
                type: user.type,
                typeId: user.typeId,
                username: req.body.username,
                status: "Pending",
                sites: req.body.sites,
                balance: req.body.amount,
                name: user.username,
                image: imageName,
            });
            mysite.save()
                .then(doc => {

                    const payment = new Payment({
                        type: 'Deposit',
                        userId: userId,
                        amount: req.body.amount,
                        name: user.name,
                        username: user.username,
                        paymentType: req.body.paymentType,
                        depositId: req.body.depositId,
                        status: 'Pending',
                        image: imageName,
                        managerType: user.type,
                        managerId: user.typeId,
                        balance: balance,
                        to: "Id",
                        sites: req.body.sites,
                        mysites: doc._id,
                        refrenceNo: result,
                        idReq: 1
                    });
                    payment.save()
                        .then(doc1 => {
                            User.updateOne({
                                '_id': userId
                            }, { wallet: balance, exposure: exposure }, async function (error, updateUser) {
                                res.send({ doc, success: true, message: "My sites created" });
                            });
                        })
                        .catch(error => {
                            res.send({ error, success: false, message: "DB error in deposit register" });
                        })
                })
                .catch(error => {
                    res.send({ error, success: false, message: "DB error in creating sites" });
                })

        }


    }
    catch (error) {
        console.log(error)
        res.send({ error, success: false, message: "Unknown error" });
    }
}

// Get My Sites
module.exports.getMysites = async (req, res) => {
    try {
        let decoded = jwt.verify(req.params.token, myEnv.parsed.SECRET);
        let { userId } = jwt.decode(req.params.token);
        let user = await User.findOne({ _id: userId });
        if (!user._id) return res.send({ success: false, message: "Token Invalid. Please login in again." });
        if (user.token != req.params.token) return res.send({ success: false, message: "Token Invalid. Please login in again." });

        Mysite.
            find({ userId: userId, status: 'Approved' }).
            populate('sites').
            sort({ createdAt: -1 }).
            exec(function (err, data) {
                if (err) return handleError(err);
                res.send({ data: data, success: true, message: "My Sites get successfully" });
                // prints "The author is Ian Fleming"
            });


    }
    catch (error) {
        res.send({ error, success: false, message: "Unknown error" });
    }
}

// Get User Details
module.exports.getUser = async (req, res) => {
    try {
        console.log(req.params.token)
        let decoded = jwt.verify(req.params.token, myEnv.parsed.SECRET);
        let { userId } = jwt.decode(req.params.token);
        let user = await User.findOne({ _id: userId });
        if (!user._id) return res.send({ success: false, message: "Token Invalid. Please login in again." });
        if (user.token != req.params.token) return res.send({ success: false, message: "Token Invalid. Please login in again." });

        User.findOne({ _id: userId })
            .then(doc => {
                res.send({ doc, success: true, message: "User get successfully" });
            })
            .catch(error => {
                res.send({ error, success: false, message: "DB error in getting user" });
            })
    }
    catch (error) {
        console.log(error);
        res.send({ error, success: false, message: "Unknown error" });
    }
}





// Make Withdrawn Preffered
module.exports.prefferdWithdrawn = async (req, res) => {
    try {
        let decoded = jwt.verify(req.params.token, myEnv.parsed.SECRET);
        let { userId } = jwt.decode(req.params.token);
        let user = await User.findOne({ _id: userId });
        if (!user._id) return res.send({ success: false, message: "Token Invalid. Please login in again." });
        if (user.token != req.params.token) return res.send({ success: false, message: "Token Invalid. Please login in again." });

        let withdrawn = await Withdrawal.findOne({ _id: req.body.id });

        await Withdrawal.updateMany({ userId: userId, type: withdrawn.type }, { status: false }, { new: true })
            .then(async function (dbProduct) {
                await Withdrawal.findOneAndUpdate({ _id: req.body.id }, { status: true }, { new: true })
                    .then(function (dbProduct) {
                        res.send({ data: dbProduct, success: true, message: "Withdrawn Method preffered successfully" });
                    })
                    .catch(function (err) {
                        res.send({ error: err, success: false, message: "Error in making withdrawn preffered" });
                    });

            })
            .catch(function (err) {
                res.send({ error: err, success: false, message: "Error in making withdrawn preffered" });
            });

    }
    catch (error) {
        res.send({ error, success: false, message: "Unknown error" });
    }
}

// Get Preffered Withdrawl
module.exports.getPrefferedWithdrawl = async (req, res) => {
    try {

        let decoded = jwt.verify(req.params.token, myEnv.parsed.SECRET);
        let { userId } = jwt.decode(req.params.token);
        let user = await User.findOne({ _id: userId });
        if (!user._id) return res.send({ success: false, message: "Token Invalid. Please login in again." });
        if (user.token != req.params.token) return res.send({ success: false, message: "Token Invalid. Please login in again." });

        const users = await WithdrawnMethod.find({}).select("-withdrawns");

        const requiredMediaByName = (name) => {
            return users.find(data => data.type === name && data.manager.includes(ObjectId(user.typeId)));
        };

        const withdrawals = await Withdrawal.find({ userId: userId });
        var doc = [];
        var team;

        team = withdrawals;
        for (let i = 0; i < withdrawals.length; i++) {
            var obj = team[i];
            var obj2 = { activestatus: requiredMediaByName(team[i].type) === undefined ? true : false };
            Object.assign(obj, obj2);
            doc.push(obj);
        }
        res.send({ doc, success: true, message: "Withdrawal Method get successfully" });
        // Withdrawal.find({ userId: userId })
        //     .then(doc => {
        //         res.send({ doc, success: true, message: "Withdrawl Preffered get successfully" });
        //     })
        //     .catch(error => {
        //         res.send({ error, success: false, message: "DB error in getting withdrawal preffered" });
        //     })
    }
    catch (error) {
        console.log(error);
        res.send({ error, success: false, message: "Unknown error" });
    }
}

// Get Sites By Id
module.exports.getsitesById = async (req, res) => {
    try {

        let decoded = jwt.verify(req.params.token, myEnv.parsed.SECRET);
        let { userId } = jwt.decode(req.params.token);
        let user = await User.findOne({ _id: userId });
        if (!user._id) return res.send({ success: false, message: "Token Invalid. Please login in again." });
        if (user.token != req.params.token) return res.send({ success: false, message: "Token Invalid. Please login in again." });

        Site.findOne({ _id: req.body.id })
            .then(doc => {
                res.send({ doc, success: true, message: "Site get successfully" });
            })
            .catch(error => {
                res.send({ error, success: false, message: "DB error in getting Site" });
            })
    }
    catch (error) {
        res.send({ error, success: false, message: "Unknown error" });
    }
}


// Get Notification
module.exports.getNotification = async (req, res) => {
    try {

        let decoded = jwt.verify(req.params.token, myEnv.parsed.SECRET);
        let { userId } = jwt.decode(req.params.token);
        let user = await User.findOne({ _id: userId });
        if (!user._id) return res.send({ success: false, message: "Token Invalid. Please login in again." });
        if (user.token != req.params.token) return res.send({ success: false, message: "Token Invalid. Please login in again." });

        User.updateOne({
            '_id': userId
        }, { notificationCount: 0 }, async function (error, updateUser) {

            Notification.
                find({ userId: userId }).
                populate('payment').
                populate('sites').
                sort({ createdAt: -1 }).
                exec(function (err, data) {
                    if (err) return res.send({ error: err, success: false, message: "DB error in getting notification" });

                    res.send({ data: data, success: true, message: "Notification get successfully" });
                });
        });

    }
    catch (error) {
        res.send({ error, success: false, message: "Unknown error" });
    }
}



// Get Mysites Transaction
module.exports.getmysiteTransaction = async (req, res) => {
    try {

        let decoded = jwt.verify(req.params.token, myEnv.parsed.SECRET);
        let { userId } = jwt.decode(req.params.token);
        let user = await User.findOne({ _id: userId });
        if (!user._id) return res.send({ success: false, message: "Token Invalid. Please login in again." });
        if (user.token != req.params.token) return res.send({ success: false, message: "Token Invalid. Please login in again." });

        console.log(req.body.mysiteId);
        Payment.find({ mysites: req.body.mysiteId, userId: userId })
            .then(doc => {
                res.send({ doc, success: true, message: "Mysite transaction get successfully" });
            })
            .catch(error => {
                res.send({ error, success: false, message: "DB error in getting Mysite transaction" });
            })
    }
    catch (error) {
        res.send({ error, success: false, message: "Unknown error" });
    }
}

//Deposit in  My Sites
module.exports.depositInsite = async (req, res) => {
    try {
        let decoded = jwt.verify(req.params.token, myEnv.parsed.SECRET);
        let { userId } = jwt.decode(req.params.token);
        let user = await User.findOne({ _id: userId });
        if (!user._id || user.status === 'inactive') return res.send({ success: false, message: "Token Invalid. Please login in again." });
        if (user.token != req.params.token) return res.send({ success: false, message: "Token Invalid. Please login in again." });
        // if (req.body.paymentType == 'wallet') return res.send({ success: false, message: "You don't have sufficients funds." });
        let max = 500;
        if (user.typeId === '62b013cd6d70f31108551e35' || user.typeId === '631195e7d84105a6457fd88e') {
            max = 100;
        }
        if (req.body.amount < max) return res.send({ success: false, message: `Amount can't be less than ${max}.` });

        let query;
        let manager;
        if (user.type == "Manager") {
            query = "Admin"
            manager = await Manager.findOne({ _id: user.typeId });
        } else {
            query = "Subadmin"
            manager = await User.findOne({ _id: user.typeId });
        }

        let imageName = [];
        let time = new Date().getTime();
        var base64Data;
        let image;
        if (req.body.imagetype) {
            console.log(req.body.imagetype);
            let mimetype = req.body.imagetype.split("/").pop();
            console.log(mimetype);
            if (mimetype == 'jpeg') {
                base64Data = req.body.image.replace(/^data:image\/jpeg;base64,/, "");
                image = `${time}.jpeg`;
            } else if (mimetype == 'jpg') {
                base64Data = req.body.image.replace(/^data:image\/jpg;base64,/, "");
                image = `${time}.jpg`;
            } else {
                base64Data = req.body.image.replace(/^data:image\/png;base64,/, "");
                image = `${time}.png`;
            }
        } else {
            base64Data = req.body.image.replace(/^data:image\/png;base64,/, "");
            image = `${time}.png`;
        }

        require("fs").writeFile(`uploads/screenshot/${image}`, base64Data, 'base64', function (err) {
            // console.log(err);
        });
        imageName.push(image);

        var characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
        var result = ""
        var charactersLength = characters.length;

        for (var i = 0; i < 10; i++) {
            result += characters.charAt(Math.floor(Math.random() * charactersLength));
        }

        let balance, exposure;
        if (req.body.paymentType == 'wallet') {
            balance = parseInt(user.wallet) - parseInt(req.body.amount);
            exposure = parseInt(user.exposure) + parseInt(req.body.amount);
        } else {
            balance = parseInt(user.wallet);
            exposure = parseInt(user.exposure);
        }

        let mysite = await Mysite.findOne({ _id: req.body.mysiteId });


        var request = require('request');
        var options = {
            'method': 'GET',
            'url': `https://wapi.paisaexch.com/api/balance/${user.username}`,
            'headers': {
            }
        };
        request(options, async function (error, response) {
            if (error) {
                res.send({ error, success: false, message: "Error in deposite to site" });
            } else {
                let body = JSON.parse(response.body);

                if (body.error == true) {
                    res.send({ error, success: false, message: body.message });
                }
                else if (req.body.paymentType == 'wallet' && body.response.balance < req.body.amount) {
                    res.send({ error, success: false, message: "User don't have sufficient ammount" });
                } else {

                    if (req.body.paymentType == 'wallet') {
                        var request = require('request');
                        var options = {
                            'method': 'POST',
                            'url': 'https://wapi.paisaexch.com/api/updatewithdraw',
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
                        request(options, async function (error, response) {
                            let body = JSON.parse(response.body);
                            if (error) {
                                res.send({ error, success: false, message: "Error in deposite to site" });
                            } else if (body.error == true) {
                                res.send({ error, success: false, message: body.message });
                            } else {

                                // Push Notification Start
                                if (manager.playerId) {
                                    let deviceIds = [manager.playerId];
                                    let partner = await User.find({ managerId: user.typeId });
                                    for (let i = 0; i < partner.length; i++) {
                                        if (partner[i].playerId) {
                                            deviceIds.push(partner[i].playerId);
                                        }
                                    }
                                    var datapush = {
                                        app_id: "9adf2973-6d8a-4a42-9ce0-a3a98d97deaa",
                                        contents: { "en": `${user.name} has created a request to deposit amount of ${req.body.amount}` },
                                        headings: { "en": "Deposit Payment In Id Request" },
                                        big_picture: "https://blog.taskpigeon.co/wp-content/uploads/2017/06/Advanced-Email-Notifications-Task-Pigeon.jpg",
                                        url: "",
                                        include_player_ids: deviceIds,
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
                                }
                                // Push Notification End

                                const payment = new Payment({
                                    type: 'Deposit',
                                    userId: userId,
                                    amount: req.body.amount,
                                    name: user.name,
                                    username: user.username,
                                    paymentType: req.body.paymentType,
                                    status: 'Pending',
                                    image: imageName,
                                    managerType: user.type,
                                    managerId: user.typeId,
                                    balance: balance,
                                    to: "Id",
                                    sites: mysite.sites,
                                    mysites: req.body.mysiteId,
                                    refrenceNo: result
                                });
                                payment.save()
                                    .then(doc1 => {
                                        User.updateOne({
                                            '_id': userId
                                        }, { wallet: balance, exposure: exposure }, async function (error, updateUser) {
                                            res.send({ doc1, success: true, message: "Deposit to Id Submitted" });
                                        });
                                    })
                                    .catch(error => {
                                        console.log(error);
                                        res.send({ error, success: false, message: "DB error in id deposit" });
                                    })

                            }
                        });
                    } else {
                        // Push Notification Start
                        if (manager.playerId) {
                            let deviceIds = [manager.playerId];
                            let partner = await User.find({ managerId: user.typeId });
                            for (let i = 0; i < partner.length; i++) {
                                if (partner[i].playerId) {
                                    deviceIds.push(partner[i].playerId);
                                }
                            }
                            var datapush = {
                                app_id: "9adf2973-6d8a-4a42-9ce0-a3a98d97deaa",
                                contents: { "en": `${user.name} has created a request to deposit amount of ${req.body.amount}` },
                                headings: { "en": "Deposit Payment In Id Request" },
                                big_picture: "https://blog.taskpigeon.co/wp-content/uploads/2017/06/Advanced-Email-Notifications-Task-Pigeon.jpg",
                                url: "",
                                include_player_ids: deviceIds,
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
                        }
                        // Push Notification End

                        const payment = new Payment({
                            type: 'Deposit',
                            userId: userId,
                            amount: req.body.amount,
                            name: user.name,
                            username: user.username,
                            paymentType: req.body.paymentType,
                            status: 'Pending',
                            image: imageName,
                            managerType: user.type,
                            managerId: user.typeId,
                            balance: balance,
                            to: "Id",
                            sites: mysite.sites,
                            mysites: req.body.mysiteId,
                            refrenceNo: result
                        });
                        payment.save()
                            .then(doc1 => {
                                User.updateOne({
                                    '_id': userId
                                }, { wallet: balance, exposure: exposure }, async function (error, updateUser) {
                                    res.send({ doc1, success: true, message: "Deposit to Id Submitted" });
                                });
                            })
                            .catch(error => {
                                console.log(error);
                                res.send({ error, success: false, message: "DB error in id deposit" });
                            })
                    }

                }
            }
        });
    }
    catch (error) {
        console.log(error);
        res.send({ error, success: false, message: "Unknown error" });
    }
}

//Withdrawal form My Sites
module.exports.withdrawalInsites = async (req, res) => {
    try {
        let decoded = jwt.verify(req.params.token, myEnv.parsed.SECRET);
        let { userId } = jwt.decode(req.params.token);
        let user = await User.findOne({ _id: userId });
        if (!user._id || user.status === 'inactive') return res.send({ success: false, message: "Token Invalid. Please login in again." });
        let max = 500;
        if (user.typeId === '62b013cd6d70f31108551e35' || user.typeId === '631195e7d84105a6457fd88e') {
            max = 100;
        }
        if (req.body.amount < max) return res.send({ success: false, message: `Amount can't be less than ${max}.` });
        // if (user.wallet < req.body.amount) return res.send({ success: false, message: "You don't have sufficients funds." });

        let query;
        let manager;
        if (user.type == "Manager") {
            query = "Admin"
            manager = await Manager.findOne({ _id: user.typeId });
        } else {
            query = "Subadmin"
            manager = await User.findOne({ _id: user.typeId });
        }

        var characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
        var result = ""
        var charactersLength = characters.length;

        for (var i = 0; i < 10; i++) {
            result += characters.charAt(Math.floor(Math.random() * charactersLength));
        }

        let balance = parseInt(user.wallet);
        let exposure = parseInt(user.exposure);

        let mysite = await Mysite.findOne({ _id: req.body.mysiteId });

        let paymentdata;

        if (req.body.type === 'Wallet') {
            paymentdata = {
                type: 'Withdrawal',
                userId: user._id,
                amount: req.body.amount,
                name: user.name,
                username: user.username,
                paymentType: req.body.type,
                status: 'Pending',
                managerType: user.type,
                managerId: user.typeId,
                balance: balance,
                to: "Id",
                sites: mysite.sites,
                mysites: req.body.mysiteId,
                refrenceNo: result
            }
        } else {
            paymentdata = {
                type: 'Withdrawal',
                userId: user._id,
                amount: req.body.amount,
                name: user.name,
                username: user.username,
                paymentType: req.body.type,
                paymentId: req.body.paymentId,
                status: 'Pending',
                managerType: user.type,
                managerId: user.typeId,
                balance: balance,
                to: "Id",
                sites: mysite.sites,
                mysites: req.body.mysiteId,
                refrenceNo: result

            }
        }

        const payment = new Payment(paymentdata);
        payment.save()
            .then(async doc => {


                // Push Notification Start
                if (manager.playerId) {
                    let deviceIds = [manager.playerId];
                    let partner = await User.find({ managerId: user.typeId });
                    for (let i = 0; i < partner.length; i++) {
                        if (partner[i].playerId) {
                            deviceIds.push(partner[i].playerId);
                        }
                    }
                    var datapush = {
                        app_id: "9adf2973-6d8a-4a42-9ce0-a3a98d97deaa",
                        contents: { "en": `${user.name} has created a request to withdrawal amount of ${req.body.amount}` },
                        headings: { "en": "Withdrawal Payment From Id Request" },
                        big_picture: "https://blog.taskpigeon.co/wp-content/uploads/2017/06/Advanced-Email-Notifications-Task-Pigeon.jpg",
                        url: "",
                        include_player_ids: deviceIds,
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
                }
                // Push Notification End

                User.updateOne({
                    '_id': userId
                }, { wallet: balance, exposure: exposure }, async function (error, updateUser) {
                    res.send({ doc, success: true, message: "Withdrawal registered" });
                });
            })
            .catch(error => {
                console.log(error);
                res.send({ error, success: false, message: "DB error in withdrawal register" });
            })
    }
    catch (error) {
        console.log(error);
        res.send({ error, success: false, message: "Unknown error" });
    }
}

// Get Pending Transaction
module.exports.getpendingPayment = async (req, res) => {
    try {
        let decoded = jwt.verify(req.params.token, myEnv.parsed.SECRET);
        let { userId } = jwt.decode(req.params.token);
        let user = await User.findOne({ _id: userId });
        if (!user._id) return res.send({ success: false, message: "Token Invalid. Please login in again." });
        if (user.token != req.params.token) return res.send({ success: false, message: "Token Invalid. Please login in again." });

        Payment.
            find({ userId: userId, status: 'Pending' }).
            populate('sites').
            sort({ createdAt: -1 }).
            exec(function (err, data) {
                if (err) return handleError(err);
                res.send({ data: data, success: true, message: "Transaction get successfully" });
                // prints "The author is Ian Fleming"
            });


    }
    catch (error) {
        res.send({ error, success: false, message: "Unknown error" });
    }
}

// Get My Sites By Id
module.exports.getMysitesByID = async (req, res) => {
    try {
        let decoded = jwt.verify(req.params.token, myEnv.parsed.SECRET);
        let { userId } = jwt.decode(req.params.token);
        let user = await User.findOne({ _id: userId });
        if (!user._id) return res.send({ success: false, message: "Token Invalid. Please login in again." });
        if (user.token != req.params.token) return res.send({ success: false, message: "Token Invalid. Please login in again." });

        Mysite.
            findOne({ userId: userId, status: 'Approved', _id: req.body.id }).
            populate('sites').
            sort({ createdAt: -1 }).
            exec(function (err, data) {
                if (err) return handleError(err);
                res.send({ data: data, success: true, message: "My Sites get successfully" });
                // prints "The author is Ian Fleming"
            });


    }
    catch (error) {
        res.send({ error, success: false, message: "Unknown error" });
    }
}

//Add Withdrawal Method
module.exports.updatewithdrawalMethod = async (req, res) => {
    try {
        let decoded = jwt.verify(req.params.token, myEnv.parsed.SECRET);
        let { userId } = jwt.decode(req.params.token);
        let user = await User.findOne({ _id: userId });
        if (!user._id) return res.send({ success: false, message: "Token Invalid. Please login in again." });
        if (user.token != req.params.token) return res.send({ success: false, message: "Token Invalid. Please login in again." });


        let data;
        if (req.body.type == 'bank') {
            data = {
                type: req.body.type,
                userId: userId,
                bankName: req.body.bankName,
                name: req.body.name,
                accnumber: req.body.accnumber,
                ifsc: req.body.ifsc,
                withdrawnMethod: req.body.withdrawlId
            }
        } else {
            data = {
                type: req.body.type,
                userId: userId,
                name: req.body.name,
                upi: req.body.upi,
                withdrawnMethod: req.body.withdrawlId
            }
        }

        let pending = await Payment.findOne({ userId: userId, type: 'Withdrawal', status: 'Pending' });

        if (pending.length == 0) {
            await Withdrawal.findOneAndUpdate({ _id: req.body.Id }, { data }, { new: true })
                .then(function (dbProduct) {
                    // If we were able to successfully update a Product, send it back to the client
                    res.send({ data: dbProduct, success: true, message: "Withdrawal updated" });
                })
                .catch(function (err) {
                    // If an error occurred, send it to the client
                    res.send({ data: {}, success: False, message: "Error in Withdrawal update" });
                });
        } else {
            res.send({ error: {}, success: false, message: "You have pending Withdrawal request" });
        }


    }
    catch (error) {
        res.send({ error, success: false, message: "Unknown error" });
    }
}

//Cancel Withdrawal Request
module.exports.cancelWithdrawl = async (req, res) => {
    try {

        let decoded = jwt.verify(req.params.token, myEnv.parsed.SECRET);
        let { userId } = jwt.decode(req.params.token);
        let user = await User.findOne({ _id: userId });
        if (!user._id) return res.send({ success: false, message: "Token Invalid. Please login in again." });
        if (user.token != req.params.token) return res.send({ success: false, message: "Token Invalid. Please login in again." });

        let paymentData = await Payment.findOne({ _id: req.body.id });

        if (paymentData.status !== 'Pending' || paymentData.isProcessing === true) {
            res.send({ data: {}, success: False, message: `You can't cancel your request after your request has been ${paymentData.status}` });
        }
        else {

            await Payment.findOneAndUpdate({ _id: req.body.id }, { status: 'Decline', remarks: 'User decline the request.' }, { new: true })
                .then(function (dbProduct) {

                    let exposure;

                    if (dbProduct.to == 'Wallet') {
                        let balance = parseInt(user.wallet) + parseInt(dbProduct.amount)
                        exposure = parseInt(user.exposure) - parseInt(dbProduct.amount);
                        var request = require('request');
                        var options = {
                            'method': 'POST',
                            'url': 'https://wapi.paisaexch.com/api/updatedeposit',
                            'headers': {
                                'cache-control': 'no-cache',
                                'content-type': 'application/x-www-form-urlencoded',
                                'postman-token': '15dc1ded-e6b9-d2e2-f73e-1d4ce00f568a'
                            },
                            form: {
                                'username': user.username,
                                'amount': dbProduct.amount,
                                'status': 'Decline'
                            }
                        };
                        request(options, function (error, response) {
                            let body = JSON.parse(response.body);
                            if (error) {
                                res.send({ data: {}, success: False, message: "Error in cancelling Withdrawal request" });
                            } else if (body.error == true) {
                                res.send({ data: {}, success: False, message: "Error in cancelling Withdrawal request" });
                            } else {
                                User.updateOne({
                                    '_id': userId
                                }, { wallet: balance, exposure: exposure }, async function (error, updateUser) {
                                    res.send({ data: dbProduct, success: true, message: "Withdrawal request cancelled" });
                                });
                            }
                        });
                    } else {
                        exposure = parseInt(user.exposure);
                        User.updateOne({
                            '_id': userId
                        }, { exposure: exposure }, async function (error, updateUser) {
                            res.send({ data: dbProduct, success: true, message: "Withdrawal request cancelled" });
                        });
                    }


                })
                .catch(function (err) {
                    // If an error occurred, send it to the client
                    res.send({ data: {}, success: False, message: "Error in cancelling Withdrawal request" });
                });

        }


    }
    catch (error) {
        res.send({ error, success: false, message: "Unknown error" });
    }
}


// User Login
module.exports.getUserByToken = async (req, res) => {
    try {

        User.findOne({ username: req.params.token })
            .then(doc => {
                if (!doc) return res.send({ data: {}, success: false, message: "No such user found" });

                if (doc.status == 'inactive') return res.send({ data: {}, success: false, message: "Please login with otp to verify number" });


                const token = util.generateToken(doc._id);

                User.updateOne({
                    '_id': doc._id
                }, { token: token }, function (err, updateMessage) {

                });

                const data = { doc, token }
                res.send({ data, success: true, message: "user login success" });

            })
            .catch(error => {
                res.send({ error, success: false, message: "DB error" });
            })

    }
    catch (error) {
        res.send({ error, success: false, message: "unknown error" });
    }
}

//Add Withdrawal Method
module.exports.updateDeviceId = async (req, res) => {
    try {

        var options = {
            'method': 'POST',
            'url': 'https://rnapi.paisaexch.com/api/update-device',
            'headers': {
                'Content-Type': 'application/x-www-form-urlencoded'
            },
            form: {
                'username': req.body.username,
                'deviceId': req.body.deviceId,
            }
        };
        request(options, async function (error, response) {
            console.log(response.body);
        });

        await User.findOneAndUpdate({ username: req.body.username }, { deviceId: req.body.deviceId }, { new: true })
            .then(function (dbProduct) {
                res.send({ data: dbProduct, success: true, message: "Withdrawal updated" });
            })
            .catch(function (err) {
                // If an error occurred, send it to the client
                res.send({ data: {}, success: False, message: "Error in Withdrawal update" });
            });

    }
    catch (error) {
        res.send({ error, success: false, message: "Unknown error" });
    }
}

//User Register
module.exports.getManager = async (req, res) => {
    try {
        let decoded = jwt.verify(req.params.token, myEnv.parsed.SECRET);
        let { userId } = jwt.decode(req.params.token);
        let user = await User.findOne({ _id: userId });
        if (!user._id) return res.send({ success: false, message: "Token Invalid. Please login in again." });
        if (user.token != req.params.token) return res.send({ success: false, message: "Token Invalid. Please login in again." });

        let manager = await User.findOne({ _id: req.body.typeId }, { username: 1 });
        res.send({ data: manager, success: true, message: "Manager Get Success" });
    }
    catch (error) {
        res.send({ error, success: false, message: "Unknown error" });
    }
}