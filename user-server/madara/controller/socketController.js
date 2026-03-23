var User = mongoose.model('User');
const SubAdmin = require('../models/subadminModel');
const Site = require('../models/siteModel');
const PaymentMethod = require('../models/paymentmethodModel');
const Payment = require('../models/paymentModel');
const Withdrawal = require('../models/withdrawalModel.js');
const Notification = require('../models/notificationModel');
const Mysite = require('../models/mysitesModel');
const totalPaymentModel = require('../models/totalPaymentModel');

const myEnv = require('dotenv').config();

// Required Helper Function
const util = require('./util');
const jwt = require('jsonwebtoken');
const fs = require("fs");
var request = require('request');

// User Login
module.exports.login = (io, socket, req) => {
    try {
        let { phone, password, type, typeId } = req;
        if (!phone || !password) io.to(socket.id).emit("get-user-login", { message: "missing field/'s", success: false, data: {} });

        else {


            User.findOne({ phone: phone, type: type, typeId: typeId })
                .then(async doc => {

                    if (!doc) {
                        io.to(socket.id).emit("get-user-login", { message: "No such user found", success: false, data: {} });
                    }
                    else if (doc.status == 'inactive') {
                        io.to(socket.id).emit("get-user-login", { message: "Please login with otp to verify number", success: false, data: {} });
                    }
                    else if (!util.comparePassword(doc.password, password)) {
                        io.to(socket.id).emit("get-user-login", { message: "Incorrect password", success: false, data: {} });
                    }
                    else {

                        let deviceId;
                        if (req.deviceId) {
                            deviceId = JSON.parse(req.deviceId);
                        }
                        else if (doc.deviceId) {
                            deviceId = doc.deviceId
                        }
                        else {
                            deviceId = ''
                        }

                        const token = util.generateToken(doc._id);

                        User.updateOne({
                            '_id': doc._id
                        }, { token: token, deviceId: deviceId }, function (err, updateMessage) {
                            setTimeout(function () {
                                io.emit("user-logout-device", { message: "Please Login Again.", success: true, data: doc._id, expired_token: token });
                            }, 500)
                        });

                        const data = { doc, token }
                        io.to(socket.id).emit("get-user-login", { message: "user login success", success: true, data: data });
                    }
                })
                .catch(error => {
                    // console.log(error);
                    io.to(socket.id).emit("get-user-login", { message: "DB error", success: false, data: error });
                })
        }
    }
    catch (error) {
        io.to(socket.id).emit("get-user-login", { message: "unknown error", success: false, data: error });
    }
}

// User login with OTP
module.exports.loginOtp = (io, socket, req) => {
    try {
        User.findOne({ phone: req.phone, type: req.type, typeId: req.typeId })
            .then(doc => {
                if (doc.otp == req.otp) {
                    User.updateOne({ _id: doc._id }, { status: "active" })
                        .then(user => {
                            // console.log('Status Updated');
                        })
                        .catch(error => {
                            // console.log('Error In Status Update');
                        })
                    const token = util.generateToken(doc._id);

                    const data = { doc, token }
                    let deviceId;
                    if (req.deviceId) {
                        deviceId = JSON.parse(req.deviceId);
                    }
                    else if (doc.deviceId) {
                        deviceId = doc.deviceId
                    }
                    else {
                        deviceId = ''
                    }

                    User.updateOne({
                        '_id': doc._id
                    }, { token: token, deviceId: deviceId }, function (err, updateMessage) {
                        setTimeout(function () {
                            io.emit("user-logout-device", { message: "Please Login Again.", success: true, data: doc._id, expired_token: token });
                        }, 500)
                    });

                    io.to(socket.id).emit("get-user-login", { message: "user login success", success: true, data: data });
                }
                else {
                    io.to(socket.id).emit("get-user-login", { message: "Please enter correct otp", success: false, data: {} });
                }
            })
            .catch(error => {
                io.to(socket.id).emit("get-user-login", { message: "DB error", success: false, data: error });
            })
    }
    catch (error) {
        io.to(socket.id).emit("get-user-login", { message: "unknown error", success: false, data: error });
    }
}

// SUb Admin Login
module.exports.subadminLogin = (io, socket, req) => {
    try {
        // console.log(req);
        let { username, password } = req;
        if (!username || !password) io.to(socket.id).emit("get-message-success", { message: "missing field/'s", success: false, data: {} });

        else {

            SubAdmin.findOne({ username: username })
                .then(doc => {
                    if (!doc) {
                        io.to(socket.id).emit("get-message-success", { message: "No such user found", success: false, data: {} });
                    }
                    else if (!util.comparePassword(doc.password, password)) {
                        io.to(socket.id).emit("get-message-success", { message: "Incorrect password", success: false, data: {} });
                    }
                    else {
                        const token = util.generateToken(doc._id);

                        SubAdmin.updateOne({
                            '_id': doc._id
                        }, { token: token }, function (err, updateMessage) {
                            io.emit("logout-device", { message: "Please Login Again.", success: true, data: doc._id, expired_token: doc.token });
                        });

                        const data = { doc, token }
                        io.to(socket.id).emit("get-message-success", { message: "SubAdmin login success", success: true, data: data });
                    }
                })
                .catch(error => {
                    // console.log(error);
                    io.to(socket.id).emit("get-message-success", { message: "DB error", success: false, data: error });
                })
        }
    }
    catch (error) {
        io.to(socket.id).emit("get-message-success", { message: "unknown error", success: false, data: error });
    }
}

// Transaction Status Update
module.exports.subadmintransactionUpdate = async (io, socket, req) => {
    try {

        let { userId } = jwt.decode(req.token);
        let subadmin = await SubAdmin.findOne({ _id: userId });
        if (!subadmin._id) return io.to(socket.id).emit("transaction-status", { message: "Please login in again.", success: false, data: [] });
        if (subadmin.token != req.token) return io.to(socket.id).emit("transaction-status", { success: false, message: "Token Invalid. Please login in again.", data: [] });

        Payment.
            findOne({ _id: req.transactionId }).
            populate('sites').
            exec(async function (err, data) {
                if (err) return handleError(err);
                if (data.status != 'Pending') {
                    return io.to(socket.id).emit("transaction-status", { message: "Transaction already updated.", success: false, data: {} });
                }
                let user = await User.findOne({ _id: data.userId });


                let name;
                let message;
                let balance;
                let exposure;
                if (data.type == 'Deposit' && data.to == 'Wallet') {
                    if (req.status == 'Approved') {
                        name = 'Wallet Deposit Request Approved!';
                        message = `Your wallet deposit request has been approved. We have deposited ${data.amount} coins to your wallet. Have fun with ${subadmin.username}. `;
                        balance = parseInt(user.wallet) + parseInt(data.amount);
                        exposure = parseInt(user.exposure) - parseInt(data.amount);
                    }
                    else {
                        name = 'Wallet Deposit Request Declined!';
                        message = `Your request for the wallet deposit of ${data.amount} coins has been declined. Please check the reason and let us know if you need any further assistance.`;
                        balance = user.wallet;
                        exposure = parseInt(user.exposure) - parseInt(data.amount);
                    }
                } else if (data.type == 'Deposit' && data.to == 'Id') {
                    if (req.status == 'Approved') {
                        name = 'ID Deposit Request Approved!';
                        message = `Your request for ID Deposit of ${data.amount} coins has been approved. Have fun with games.`;
                        if (data.paymentType == 'wallet') {
                            balance = parseInt(user.wallet);
                            exposure = parseInt(user.exposure) - parseInt(data.amount);
                        } else {
                            balance = user.wallet;
                            exposure = parseInt(user.exposure);
                        }

                    }
                    else {
                        name = 'ID Deposit Request Declined!';
                        message = `Your request for the ID deposit of ${data.amount} coins has been declined. Please check the reason and let us know if you need any further assistance.`;
                        if (data.paymentType == 'wallet') {
                            balance = parseInt(user.wallet) + parseInt(data.amount);
                            exposure = parseInt(user.exposure) - parseInt(data.amount);
                        } else {
                            balance = user.wallet;
                            exposure = parseInt(user.exposure);
                        }
                    }
                } else if (data.type == 'Withdrawal' && data.to == 'Id') {
                    if (req.status == 'Approved') {
                        name = 'ID Withdrawal Request Approved!';
                        message = `Your request for the withdrawal of ${data.amount} coins from ID has been approved. Enjoy with ${subadmin.username}!`;
                        balance = user.wallet;
                        if (data.paymentType == 'wallet') {
                            balance = parseInt(user.wallet) + parseInt(data.amount);
                        } else {
                            balance = user.wallet;
                        }
                        exposure = parseInt(user.exposure);
                    }
                    else {
                        name = 'ID Withdrawal Request Declined!';
                        message = `Your request to withdraw ${data.amount} coins from ID has been rejected. Please go through the reason and let us know if you need any further help.`;
                        balance = user.wallet;
                        exposure = parseInt(user.exposure);
                    }
                } else if (data.type == 'Withdrawal' && data.to == 'Wallet') {
                    if (req.status == 'Approved') {
                        name = 'Wallet Withdrawal Request Approved!';
                        message = `Your request for the withdrawal of ${data.amount} coins from Wallet has been approved. Enjoy with ${subadmin.username}!`;
                        balance = parseInt(user.wallet);
                        exposure = parseInt(user.exposure) - parseInt(data.amount);
                    }
                    else {
                        name = 'Wallet Withdrawal Request Declined!';
                        message = `Your request to withdraw ${data.amount} coins from Wallet has been rejected. Please go through the reason and let us know if you need any further help.`;
                        balance = user.wallet + parseInt(data.amount);
                        exposure = parseInt(user.exposure) - parseInt(data.amount);
                    }
                }


                // Push Notification Start

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
                        // console.log("Response:");
                        // // console.log(JSON.parse(datapush));
                        socket.emit('push-message-success', { 'message': 'push message set successfully' });
                    });
                });

                requestpush.on('error', function (e) {
                    // console.log("ERROR:");
                    socket.emit('push-message-success', { 'message': 'push message set successfully' });
                    // console.log(e);
                });

                requestpush.write(JSON.stringify(datapush));
                requestpush.end();

                // Push Notification End



                let sitename, siteurl;
                if (data.sites) {
                    sitename = data.sites.name;
                    siteurl = data.sites.url;
                }
                let notificationCount = user.notificationCount + 1;

                // console.log(data.type, data.to, req.status)

                if (data.type == 'Deposit' && data.to == 'Wallet' && req.status == 'Approved' ||
                    data.type == 'Withdrawal' && data.to == 'Id' && data.paymentType == 'wallet' && req.status == 'Approved' ||
                    data.type == 'Deposit' && data.to == 'Id' && data.paymentType == 'wallet' && req.status != 'Approved' ||
                    data.type == 'Withdrawal' && data.to == 'Wallet' && req.status != 'Approved') {

                    let url = 'https://wapi.paisaexch.com/api/updatedeposit';

                    if (data.type == 'Deposit' && data.to == 'Wallet' && req.status == 'Approved') {
                        const paymentTotal = new totalPaymentModel({
                            typeId: data.depositId,
                            amount: data.amount,
                        });
                        paymentTotal.save()
                            .then(async doc => {
                                // console.log(doc);
                            });
                    }

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
                            'amount': data.amount,
                            'status': req.status,
                        }
                    };
                    request(options, function (error, response) {
                        let body = JSON.parse(response.body);
                        // console.log(body);
                        if (error) {
                            io.to(socket.id).emit("transaction-status", { message: "Error in update transaction", success: false, data: error });
                        } else if (body.error == true) {
                            io.to(socket.id).emit("transaction-status", { message: body.message, success: false, data: error });
                        } else {
                            User.updateOne({
                                '_id': data.userId
                            }, { wallet: balance, exposure: exposure, notificationCount: notificationCount }, async function (error, updateUser) {

                                Payment.updateOne({
                                    '_id': req.transactionId
                                }, { status: req.status, remarks: req.remarks, balance: balance, approvedBy: subadmin.username }, function (err, updateMessage) {

                                    const notification = new Notification({
                                        userId: data.userId,
                                        amount: data.amount,
                                        name: name,
                                        message: message,
                                        remarks: req.remarks,
                                        status: req.status,
                                        sitename: sitename,
                                        siteurl: siteurl,
                                        payment: req.transactionId
                                    });
                                    notification.save()
                                        .then(async doc => {
                                            let userdata = await User.findOne({ _id: data.userId });

                                            io.to(socket.id).emit("transaction-status", { message: "Transaction Updated Successfully", success: true, data: doc });
                                            io.emit("get-notification", { message: name, success: true, data: doc });
                                            io.emit("user-notification-count", { message: "Notification Count", success: true, data: userdata.notificationCount, userId: userdata._id });
                                        })
                                        .catch(error => {
                                            io.to(socket.id).emit("transaction-status", { message: "Error in update transaction", success: false, data: error });
                                        })
                                });

                            });
                        }

                    });


                } else {
                    User.updateOne({
                        '_id': data.userId
                    }, { wallet: balance, exposure: exposure, notificationCount: notificationCount }, async function (error, updateUser) {

                        Payment.updateOne({
                            '_id': req.transactionId
                        }, { status: req.status, remarks: req.remarks, balance: balance, approvedBy: subadmin.username }, function (err, updateMessage) {

                            const notification = new Notification({
                                userId: data.userId,
                                amount: data.amount,
                                name: name,
                                message: message,
                                remarks: req.remarks,
                                status: req.status,
                                sitename: sitename,
                                siteurl: siteurl,
                                payment: req.transactionId
                            });
                            notification.save()
                                .then(async doc => {
                                    let userdata = await User.findOne({ _id: data.userId });

                                    io.to(socket.id).emit("transaction-status", { message: "Transaction Updated Successfully", success: true, data: doc });
                                    io.emit("get-notification", { message: name, success: true, data: doc });
                                    io.emit("user-notification-count", { message: "Notification Count", success: true, data: userdata.notificationCount, userId: userdata._id });
                                })
                                .catch(error => {
                                    io.to(socket.id).emit("transaction-status", { message: "Error in update transaction", success: false, data: error });
                                })
                        });

                    });
                }


            });


    }
    catch (error) {
        // console.log(error);
        io.to(socket.id).emit("transaction-status", { message: "unknown error", success: false, data: error });
    }
}

// Sites Status Update
module.exports.subadminsitesUpdate = async (io, socket, req) => {
    try {

        let { userId } = jwt.decode(req.token);
        let subadmin = await SubAdmin.findOne({ _id: userId });
        if (!subadmin._id) return io.to(socket.id).emit("siterequest-status", { message: "Please login in again.", success: false, data: [] });
        if (subadmin.token != req.token) return io.to(socket.id).emit("siterequest-status", { success: false, message: "Token Invalid. Please login in again.", data: [] });

        Mysite.
            findOne({ _id: req.siteId }).
            populate('sites').
            exec(async function (err, data) {

                let payment = await Payment.findOne({ mysites: data._id });
                let user = await User.findOne({ _id: data.userId });

                let name;
                let message;
                let balance;
                let exposure;
                if (req.status == 'Approved') {
                    name = 'Create Id Request Approved!';
                    message = `Your create id request has been approved. We have deposited ${data.balance} coins to your Id. Have fun with ${subadmin.username}. `;
                    if (payment.paymentType == 'wallet') {
                        balance = parseInt(user.wallet);
                        exposure = parseInt(user.exposure) - parseInt(payment.amount);
                    } else {
                        balance = user.wallet;
                        exposure = parseInt(user.exposure);
                    }
                }
                else {
                    name = 'Create Id Request Declined!';
                    message = `Your request for the create id has been declined. Please check the reason and let us know if you need any further assistance.`;
                    if (payment.paymentType == 'wallet') {
                        balance = parseInt(user.wallet) + parseInt(payment.amount);
                        exposure = parseInt(user.exposure) - parseInt(payment.amount);
                    } else {
                        balance = user.wallet;
                        exposure = parseInt(user.exposure);
                    }
                }


                // Push Notification Start

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
                        // console.log("Response:");
                        // // console.log(JSON.parse(datapush));
                        socket.emit('push-message-success', { 'message': 'push message set successfully' });
                    });
                });

                requestpush.on('error', function (e) {
                    // console.log("ERROR:");
                    socket.emit('push-message-success', { 'message': 'push message set successfully' });
                    // console.log(e);
                });

                requestpush.write(JSON.stringify(datapush));
                requestpush.end();

                // Push Notification End


                let sitename, siteurl;
                if (data.sites) {
                    sitename = data.sites.name;
                    siteurl = data.sites.url;
                }

                if (payment.paymentType == 'wallet' && req.status != 'Approved') {

                    let url = 'https://wapi.paisaexch.com/api/updatedeposit';

                    // if (subadmin.username === 'TESTMANAGER') {
                    //     url = 'http://138.68.129.236:3006/api/offer-deposit'
                    // }

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
                            'amount': payment.amount,
                            'status': req.status,
                        }
                    };
                    request(options, function (error, response) {
                        let body = JSON.parse(response.body);
                        if (error) {
                            io.to(socket.id).emit("siterequest-status", { message: "Error in update transaction", success: false, data: error });
                        } else if (body.error == true) {
                            io.to(socket.id).emit("siterequest-status", { message: body.message, success: false, data: error });
                        } else {

                            Mysite.updateOne({
                                '_id': req.siteId
                            }, { status: req.status, remarks: req.remarks, username: req.username, password: req.password }, async function (err, updateMessage) {

                                const notification = new Notification({
                                    userId: data.userId,
                                    amount: data.balance,
                                    name: name,
                                    message: message,
                                    remarks: req.remarks,
                                    status: req.status,
                                    sitename: sitename,
                                    siteurl: siteurl,
                                    sites: req.siteId
                                });
                                await notification.save()
                                    .then(async doc => {

                                        let notificationCount = user.notificationCount + 1;
                                        User.updateOne({
                                            '_id': data.userId
                                        }, { wallet: balance, exposure: exposure, notificationCount: notificationCount }, async function (error, updateUser) {
                                            Payment.updateOne({
                                                '_id': payment._id
                                            }, { status: req.status, remarks: req.remarks, balance: balance, approvedBy: subadmin.username }, async function (err, updateMessage) {

                                                io.to(socket.id).emit("siterequest-status", { message: "Transaction Updated Successfully", success: true, data: doc });
                                                io.emit("get-notification", { message: name, success: true, data: doc });
                                                io.emit("user-notification-count", { message: "Notification Count", success: true, data: notificationCount, userId: data.userId });
                                            })

                                        });

                                    })
                                    .catch(error => {
                                        // console.log(error);
                                        io.to(socket.id).emit("siterequest-status", { message: "Error in update transaction", success: false, data: error });
                                    })
                            });

                        }
                    });

                } else {
                    Mysite.updateOne({
                        '_id': req.siteId
                    }, { status: req.status, remarks: req.remarks, username: req.username, password: req.password }, async function (err, updateMessage) {

                        const notification = new Notification({
                            userId: data.userId,
                            amount: data.balance,
                            name: name,
                            message: message,
                            remarks: req.remarks,
                            status: req.status,
                            sitename: sitename,
                            siteurl: siteurl,
                            sites: req.siteId
                        });
                        await notification.save()
                            .then(async doc => {

                                let notificationCount = user.notificationCount + 1;
                                User.updateOne({
                                    '_id': data.userId
                                }, { wallet: balance, exposure: exposure, notificationCount: notificationCount }, async function (error, updateUser) {
                                    Payment.updateOne({
                                        '_id': payment._id
                                    }, { status: req.status, remarks: req.remarks, balance: balance, approvedBy: subadmin.username }, async function (err, updateMessage) {
                                        let userdata = await User.findOne({ _id: data.userId });

                                        io.to(socket.id).emit("siterequest-status", { message: "Transaction Updated Successfully", success: true, data: doc });
                                        io.emit("get-notification", { message: name, success: true, data: doc });
                                        io.emit("user-notification-count", { message: "Notification Count", success: true, data: userdata.notificationCount, userId: userdata._id });
                                    })

                                });

                            })
                            .catch(error => {
                                // console.log(error);
                                io.to(socket.id).emit("siterequest-status", { message: "Error in update transaction", success: false, data: error });
                            })
                    });
                }

            });

    }
    catch (error) {
        // console.log(error);
        io.to(socket.id).emit("transaction-status", { message: "unknown error", success: false, data: error });
    }
}

// Get Pending Transaction Count
module.exports.subadminTransactions = async (io, socket, req) => {
    try {

        let subadmin = await SubAdmin.find({});
        var test = [];
        for (let i = 0; i < subadmin.length; i++) {
            let pending = await Payment.find({ managerType: 'Subadmin', managerId: subadmin[i]._id, status: 'Pending', idReq: { $ne: 1 } })
            let pendingsites = await Mysite.find({ type: 'Subadmin', typeId: subadmin[i]._id, status: 'Pending' });
            let pendingwith = await Payment.find({ managerType: 'Subadmin', managerId: subadmin[i]._id, status: 'Pending', type: 'Withdrawal', idReq: { $ne: 1 } })
            let pendingdeposit = await Payment.find({ managerType: 'Subadmin', managerId: subadmin[i]._id, status: 'Pending', type: 'Deposit', idReq: { $ne: 1 } })

            var obj = { "Pending": pending.length, "Sites": pendingsites.length, "Withdrawan": pendingwith.length, "Deposit": pendingdeposit.length, "managerId": subadmin[i]._id };
            test.push(obj);
        }
        io.emit("pending-transaction", { message: "Pending transaction", success: true, data: test });

    }
    catch (error) {
        io.to(socket.id).emit("pending-transaction", { message: "unknown error", success: false, data: error });
    }
}

// Get Withdrawal Pending Transaction Count
module.exports.subadminwithTransactions = async (io, socket, req) => {
    try {

        let { userId } = jwt.decode(req.token);
        let subadmin = await SubAdmin.findOne({ _id: userId });
        if (!subadmin._id) return io.to(socket.id).emit("pending-withtransaction", { message: "Please login in again.", success: false, data: [] });
        if (subadmin.role && subadmin.role == 'Partner') {
            userId = subadmin.managerId;
        }

        let pending = await Payment.find({ managerType: 'Subadmin', managerId: userId, status: 'Pending', type: 'Withdrawal', idReq: { $ne: 1 } })

        io.to(socket.id).emit("pending-withtransaction", { message: "Pending transaction", success: true, data: pending.length });

    }
    catch (error) {
        io.to(socket.id).emit("pending-withtransaction", { message: "unknown error", success: false, data: error });
    }
}

// Get Deposite Pending Transaction Count
module.exports.subadmindepositeTransactions = async (io, socket, req) => {
    try {

        let { userId } = jwt.decode(req.token);
        let subadmin = await SubAdmin.findOne({ _id: userId });
        if (!subadmin._id) return io.to(socket.id).emit("pending-depositetransaction", { message: "Please login in again.", success: false, data: [] });
        if (subadmin.role && subadmin.role == 'Partner') {
            userId = subadmin.managerId;
        }

        let pending = await Payment.find({ managerType: 'Subadmin', managerId: userId, status: 'Pending', type: 'Deposit', idReq: { $ne: 1 } })

        io.to(socket.id).emit("pending-depositetransaction", { message: "Pending transaction", success: true, data: pending.length });

    }
    catch (error) {
        io.to(socket.id).emit("pending-depositetransaction", { message: "unknown error", success: false, data: error });
    }
}

// Get Pending Sites Count
module.exports.subadminSites = async (io, socket, req) => {
    try {
        let { userId } = jwt.decode(req.token);
        let subadmin = await SubAdmin.findOne({ _id: userId });
        if (!subadmin._id) return io.to(socket.id).emit("pending-sites", { message: "Please login in again.", success: false, data: [] });
        if (subadmin.role && subadmin.role == 'Partner') {
            userId = subadmin.managerId;
        }

        let pending = await Mysite.find({ type: 'Subadmin', typeId: userId, status: 'Pending' })

        io.to(socket.id).emit("pending-sites", { message: "Pending Sites", success: true, data: pending.length });

    }
    catch (error) {
        io.to(socket.id).emit("pending-sites", { message: "unknown error", success: false, data: error });
    }
}

// Get User Notification Count
module.exports.userNotificationCount = async (io, socket, req) => {
    try {
        let { userId } = jwt.decode(req.token);
        let user = await User.findOne({ _id: userId });
        if (!user._id) return io.to(socket.id).emit("user-notification-count", { message: "Please login in again.", success: false, data: [] });

        io.to(socket.id).emit("user-notification-count", { message: "Notification Count", success: true, data: user.notificationCount, userId: user._id });

    }
    catch (error) {
        io.to(socket.id).emit("user-notification-count", { message: "unknown error", success: false, data: error });
    }
}

//Payment Deposit
module.exports.depositPayment = async (io, socket, req) => {
    try {
        // let decoded = jwt.verify(req.token, myEnv.parsed.SECRET);
        let { userId } = jwt.decode(req.token);
        let user = await User.findOne({ _id: userId });
        if (!user._id) return io.to(socket.id).emit("user-depositPayment", { message: "Token Invalid. Please login in again.", success: false, data: [] });
        if (user.token != req.token) return io.to(socket.id).emit("user-depositPayment", { message: "Token Invalid. Please login in again.", success: false, data: [] });

        let query;
        let manager;
        if (user.typeId == "Manager") {
            query = "Admin"
            manager = await Manager.findOne({ _id: user.typeId });
        } else {
            query = "Subadmin"
            manager = await SubAdmin.findOne({ _id: user.typeId });
        }


        let imageName = [];
        let time = new Date().getTime();
        var base64Data = req.image.replace(/^data:image\/png;base64,/, "");
        let image = `${time}.png`;
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

        let exposure = parseInt(user.exposure) + parseInt(req.amount);

        // console.log(req.deviceId)
        if (req.deviceId) {
            deviceId = JSON.parse(req.deviceId);
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
            amount: req.amount,
            name: user.name,
            username: user.username,
            paymentType: req.type,
            depositId: req.depositId,
            status: 'Pending',
            image: imageName,
            managerType: user.type,
            managerId: user.typeId,
            balance: user.wallet,
            to: "Wallet",
            refrenceNo: result
        });
        payment.save()
            .then(doc => {

                // Push Notification Start
                if (manager.playerId) {
                    var datapush = {
                        app_id: "9adf2973-6d8a-4a42-9ce0-a3a98d97deaa",
                        contents: { "en": `${user.name} has created a request to deposit amount of ${req.amount}` },
                        headings: { "en": "Deposit Payment Request" },
                        big_picture: "https://blog.taskpigeon.co/wp-content/uploads/2017/06/Advanced-Email-Notifications-Task-Pigeon.jpg",
                        url: "",
                        include_player_ids: [manager.playerId]
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
                            // console.log("Response:");
                            // // console.log(JSON.parse(datapush));

                        });
                    });

                    requestpush.on('error', function (e) {
                        // console.log("ERROR:");

                        // console.log(e);
                    });

                    requestpush.write(JSON.stringify(datapush));
                    requestpush.end();
                }
                // Push Notification End


                User.updateOne({
                    '_id': userId
                }, { wallet: user.wallet, exposure: exposure, deviceId: deviceId }, async function (error, updateUser) {
                    io.to(socket.id).emit("user-depositPayment", { message: "Deposit registered", success: true, data: doc });
                });
            })
            .catch(error => {
                // console.log(error);
                io.to(socket.id).emit("user-depositPayment", { message: "DB error in deposit register", success: false, data: [], error: error });
            })
    }
    catch (error) {
        io.to(socket.id).emit("user-depositPayment", { message: "Unknown error", success: false, data: [], error: error });
    }
}

//Payment Withdrawal
module.exports.withdrawalPayment = async (io, socket, req) => {
    try {
        // let decoded = jwt.verify(req.token, myEnv.parsed.SECRET);
        let { userId } = jwt.decode(req.token);
        let user = await User.findOne({ _id: userId });
        if (!user._id) return io.to(socket.id).emit("user-withdrawPayment", { message: "Token Invalid. Please login in again.", success: false, data: [] });
        if (user.token != req.token) return io.to(socket.id).emit("user-withdrawPayment", { message: "Token Invalid. Please login in again.", success: false, data: [] });

        let query;
        let manager;
        if (user.type == "Manager") {
            query = "Admin"
            manager = await Manager.findOne({ _id: user.typeId });
        } else {
            query = "Subadmin"
            manager = await SubAdmin.findOne({ _id: user.typeId });
        }

        var characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
        var result = ""
        var charactersLength = characters.length;

        for (var i = 0; i < 10; i++) {
            result += characters.charAt(Math.floor(Math.random() * charactersLength));
        }

        let balance = parseInt(user.wallet) - parseInt(req.amount);
        let exposure = parseInt(user.exposure) + parseInt(req.amount);


        var request = require('request');
        var options = {
            'method': 'GET',
            'url': `https://wapi.paisaexch.com/api/balance/${user.username}`,
            'headers': {
            }
        };
        request(options, function (error, response) {
            if (error) {
                // console.log(error);
                io.to(socket.id).emit("user-withdrawPayment", { message: "Error in withdrawal request", success: false, data: [], error: error });
            } else {
                let body = JSON.parse(response.body);

                if (body.error == true) {
                    // console.log(body.error);
                    io.to(socket.id).emit("user-withdrawPayment", { message: body.message, success: false, data: [], error: body.error });
                }
                else if (body.response.balance < req.amount) {
                    io.to(socket.id).emit("user-withdrawPayment", { message: "User don't have sufficient ammount", success: false, data: [], error: {} });
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
                            'amount': req.amount
                        }
                    };
                    request(options, function (error, response) {
                        let body = JSON.parse(response.body);
                        if (error) {
                            // console.log(error);
                            io.to(socket.id).emit("user-withdrawPayment", { message: "Error in withdrawal request", success: false, data: [], error: error });
                        } else if (body.error == true) {
                            // console.log(body.error);
                            io.to(socket.id).emit("user-withdrawPayment", { message: body.message, success: false, data: [], error: body.error });
                        } else {

                            // Push Notification Start
                            if (manager.playerId) {
                                var datapush = {
                                    app_id: "9adf2973-6d8a-4a42-9ce0-a3a98d97deaa",
                                    contents: { "en": `${user.name} has created a request to withdraw amount of ${req.amount}` },
                                    headings: { "en": "Withdrawal Payment Request" },
                                    big_picture: "https://blog.taskpigeon.co/wp-content/uploads/2017/06/Advanced-Email-Notifications-Task-Pigeon.jpg",
                                    url: "",
                                    include_player_ids: [manager.playerId]
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
                                        // console.log("Response:");
                                        // // console.log(JSON.parse(datapush));

                                    });
                                });

                                requestpush.on('error', function (e) {
                                    // console.log("ERROR:");

                                    // console.log(e);
                                });

                                requestpush.write(JSON.stringify(datapush));
                                requestpush.end();
                            }
                            // Push Notification End

                            const payment = new Payment({
                                type: 'Withdrawal',
                                userId: user._id,
                                amount: req.amount,
                                name: user.name,
                                username: user.username,
                                paymentType: req.type,
                                paymentId: req.paymentId,
                                status: 'Pending',
                                managerType: user.type,
                                managerId: user.typeId,
                                balance: balance,
                                to: "Wallet",
                                refrenceNo: result
                            });
                            payment.save()
                                .then(doc => {
                                    User.updateOne({
                                        '_id': userId
                                    }, { wallet: balance, exposure: exposure }, async function (error, updateUser) {
                                        io.to(socket.id).emit("user-withdrawPayment", { message: "Withdrawal registered", success: true, data: doc });
                                    });
                                })
                                .catch(error => {
                                    // console.log(error);
                                    io.to(socket.id).emit("user-withdrawPayment", { message: "DB error in withdrawal register", success: false, data: [], error: error });
                                })

                        }
                    });
                }
            }
        });
    }
    catch (error) {
        // console.log(error);
        io.to(socket.id).emit("user-withdrawPayment", { message: "Unknown error", success: false, data: [], error: error });
    }
}

//Create My Sites
module.exports.createMysites = async (io, socket, req) => {
    try {
        // let decoded = jwt.verify(req.token, myEnv.parsed.SECRET);
        let { userId } = jwt.decode(req.token);
        let user = await User.findOne({ _id: userId });
        if (!user._id) return io.to(socket.id).emit("user-createMysites", { message: "Token Invalid. Please login in again.", success: false, data: [] });
        if (user.token != req.token) return io.to(socket.id).emit("user-createMysites", { message: "Token Invalid. Please login in again.", success: false, data: [] });

        let query;
        let manager;
        if (user.type == "Manager") {
            query = "Admin"
            manager = await Manager.findOne({ _id: user.typeId });
        } else {
            query = "Subadmin"
            manager = await SubAdmin.findOne({ _id: user.typeId });
        }




        // Push Notification Start
        if (manager.playerId) {
            var datapush = {
                app_id: "9adf2973-6d8a-4a42-9ce0-a3a98d97deaa",
                contents: { "en": `${user.name} has created a request to create Id` },
                headings: { "en": "Create Id Request" },
                big_picture: "https://blog.taskpigeon.co/wp-content/uploads/2017/06/Advanced-Email-Notifications-Task-Pigeon.jpg",
                url: "",
                include_player_ids: [manager.playerId]
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
                    // console.log("Response:");
                    // // console.log(JSON.parse(datapush));

                });
            });

            requestpush.on('error', function (e) {
                // console.log("ERROR:");

                // console.log(e);
            });

            requestpush.write(JSON.stringify(datapush));
            requestpush.end();
        }
        // Push Notification End


        let imageName = [];
        if (req.image) {
            let time = new Date().getTime();
            var base64Data = req.image.replace(/^data:image\/png;base64,/, "");
            let image = `${time}.png`;
            require("fs").writeFile(`uploads/screenshot/${image}`, base64Data, 'base64', function (err) {
                // console.log(err);
            });
            imageName.push(image);
        }
        // console.log(imageName);

        var characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
        var result = ""
        var charactersLength = characters.length;

        for (var i = 0; i < 10; i++) {
            result += characters.charAt(Math.floor(Math.random() * charactersLength));
        }

        let balance, exposure;
        if (req.paymentType == 'wallet') {
            balance = parseInt(user.wallet) - parseInt(req.amount);
            exposure = parseInt(user.exposure) + parseInt(req.amount);
        } else {
            balance = parseInt(user.wallet);
            exposure = parseInt(user.exposure);
        }

        if (req.paymentType == 'wallet') {

            var request = require('request');
            var options = {
                'method': 'GET',
                'url': `https://wapi.paisaexch.com/api/balance/${user.username}`,
                'headers': {
                }
            };
            request(options, function (error, response) {
                if (error) {
                    io.to(socket.id).emit("user-createMysites", { message: "Error in Creating site", success: false, data: [], error: error });
                } else {
                    let body = JSON.parse(response.body);

                    if (body.error == true) {
                        io.to(socket.id).emit("user-createMysites", { message: body.message, success: false, data: [], error: body.error });
                    }
                    else if (body.response.balance < req.amount) {
                        io.to(socket.id).emit("user-createMysites", { message: "User don't have sufficient ammount", success: false, data: [], error: {} });
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
                                'amount': req.amount
                            }
                        };
                        request(options, function (error, response) {
                            let body = JSON.parse(response.body);
                            if (error) {
                                io.to(socket.id).emit("user-createMysites", { message: "Error in creating site", success: false, data: [], error: error });
                            } else if (body.error == true) {
                                io.to(socket.id).emit("user-createMysites", { message: body.message, success: false, data: [], error: body.error });
                            } else {

                                const mysite = new Mysite({
                                    userId: userId,
                                    type: user.type,
                                    typeId: user.typeId,
                                    username: req.username,
                                    status: "Pending",
                                    sites: req.sites,
                                    balance: req.amount,
                                    name: user.username,
                                    image: imageName,
                                });
                                mysite.save()
                                    .then(doc => {

                                        const payment = new Payment({
                                            type: 'Deposit',
                                            userId: userId,
                                            amount: req.amount,
                                            name: user.name,
                                            username: user.username,
                                            paymentType: req.paymentType,
                                            status: 'Pending',
                                            image: imageName,
                                            managerType: user.type,
                                            managerId: user.typeId,
                                            balance: balance,
                                            to: "Id",
                                            sites: req.sites,
                                            mysites: doc._id,
                                            refrenceNo: result,
                                            idReq: 1
                                        });
                                        payment.save()
                                            .then(doc1 => {
                                                User.updateOne({
                                                    '_id': userId
                                                }, { wallet: balance, exposure: exposure }, async function (error, updateUser) {
                                                    io.to(socket.id).emit("user-createMysites", { message: "My sites created", success: true, data: doc });
                                                });
                                            })
                                            .catch(error => {
                                                io.to(socket.id).emit("user-createMysites", { message: "DB error in deposit register", success: false, data: [], error: error });
                                            })

                                    })
                                    .catch(error => {
                                        io.to(socket.id).emit("user-createMysites", { message: "DB error in creating sites", success: false, data: [], error: error });
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
                username: req.username,
                status: "Pending",
                sites: req.sites,
                balance: req.amount,
                name: user.username,
                image: imageName,
            });
            mysite.save()
                .then(doc => {

                    const payment = new Payment({
                        type: 'Deposit',
                        userId: userId,
                        amount: req.amount,
                        name: user.name,
                        username: user.username,
                        paymentType: req.paymentType,
                        depositId: req.depositId,
                        status: 'Pending',
                        image: imageName,
                        managerType: user.type,
                        managerId: user.typeId,
                        balance: balance,
                        to: "Id",
                        sites: req.sites,
                        mysites: doc._id,
                        refrenceNo: result,
                        idReq: 1
                    });
                    payment.save()
                        .then(doc1 => {
                            User.updateOne({
                                '_id': userId
                            }, { wallet: balance, exposure: exposure }, async function (error, updateUser) {
                                io.to(socket.id).emit("user-createMysites", { message: "My sites created", success: true, data: doc });
                            });
                        })
                        .catch(error => {
                            io.to(socket.id).emit("user-createMysites", { message: "DB error in deposit register", success: false, data: [], error: error });
                        })
                })
                .catch(error => {
                    io.to(socket.id).emit("user-createMysites", { message: "DB error in creating sites", success: false, data: [], error: error });
                })

        }


    }
    catch (error) {
        // console.log(error)
        io.to(socket.id).emit("user-createMysites", { message: "Unknown error", success: false, data: [], error: error });
    }
}

//Deposit in  My Sites
module.exports.depositInsite = async (io, socket, req) => {
    try {
        // let decoded = jwt.verify(req.token, myEnv.parsed.SECRET);
        let { userId } = jwt.decode(req.token);
        let user = await User.findOne({ _id: userId });
        if (!user._id) return io.to(socket.id).emit("user-depositInsite", { message: "Token Invalid. Please login in again.", success: false, data: [] });
        if (user.token != req.token) return io.to(socket.id).emit("user-depositInsite", { message: "Token Invalid. Please login in again.", success: false, data: [] });


        let query;
        let manager;
        if (user.type == "Manager") {
            query = "Admin"
            manager = await Manager.findOne({ _id: user.typeId });
        } else {
            query = "Subadmin"
            manager = await SubAdmin.findOne({ _id: user.typeId });
        }

        let imageName = [];
        if (req.image) {
            let time = new Date().getTime();
            var base64Data = req.image.replace(/^data:image\/png;base64,/, "");
            let image = `${time}.png`;
            require("fs").writeFile(`uploads/screenshot/${image}`, base64Data, 'base64', function (err) {
                // console.log(err);
            });
            imageName.push(image);
        }

        var characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
        var result = ""
        var charactersLength = characters.length;

        for (var i = 0; i < 10; i++) {
            result += characters.charAt(Math.floor(Math.random() * charactersLength));
        }

        let balance, exposure;
        if (req.paymentType == 'wallet') {
            balance = parseInt(user.wallet) - parseInt(req.amount);
            exposure = parseInt(user.exposure) + parseInt(req.amount);
        } else {
            balance = parseInt(user.wallet);
            exposure = parseInt(user.exposure);
        }

        let mysite = await Mysite.findOne({ _id: req.mysiteId });


        var request = require('request');
        var options = {
            'method': 'GET',
            'url': `https://wapi.paisaexch.com/api/balance/${user.username}`,
            'headers': {
            }
        };
        request(options, function (error, response) {
            if (error) {
                io.to(socket.id).emit("user-depositInsite", { message: "Error in deposite to site", success: false, data: [], error: error });
            } else {
                let body = JSON.parse(response.body);

                if (body.error == true) {
                    io.to(socket.id).emit("user-depositInsite", { message: body.message, success: false, data: [], error: body.error });
                }
                else if (body.response.balance < req.amount) {
                    io.to(socket.id).emit("user-depositInsite", { message: "User don't have sufficient ammount", success: false, data: [], error: {} });
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
                            'amount': req.amount
                        }
                    };
                    request(options, function (error, response) {
                        let body = JSON.parse(response.body);
                        if (error) {
                            io.to(socket.id).emit("user-depositInsite", { message: "Error in deposite to site", success: false, data: [], error: error });
                        } else if (body.error == true) {
                            io.to(socket.id).emit("user-depositInsite", { message: body.message, success: false, data: [], error: body.error });
                        } else {

                            // Push Notification Start
                            if (manager.playerId) {
                                var datapush = {
                                    app_id: "9adf2973-6d8a-4a42-9ce0-a3a98d97deaa",
                                    contents: { "en": `${user.name} has created a request to deposit amount of ${req.amount}` },
                                    headings: { "en": "Deposit Payment In Id Request" },
                                    big_picture: "https://blog.taskpigeon.co/wp-content/uploads/2017/06/Advanced-Email-Notifications-Task-Pigeon.jpg",
                                    url: "",
                                    include_player_ids: [manager.playerId]
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
                                        // console.log("Response:");
                                        // // console.log(JSON.parse(datapush));

                                    });
                                });

                                requestpush.on('error', function (e) {
                                    // console.log("ERROR:");

                                    // console.log(e);
                                });

                                requestpush.write(JSON.stringify(datapush));
                                requestpush.end();
                            }
                            // Push Notification End

                            const payment = new Payment({
                                type: 'Deposit',
                                userId: userId,
                                amount: req.amount,
                                name: user.name,
                                username: user.username,
                                paymentType: req.paymentType,
                                status: 'Pending',
                                image: imageName,
                                managerType: user.type,
                                managerId: user.typeId,
                                balance: balance,
                                to: "Id",
                                sites: mysite.sites,
                                mysites: req.mysiteId,
                                refrenceNo: result
                            });
                            payment.save()
                                .then(doc1 => {
                                    User.updateOne({
                                        '_id': userId
                                    }, { wallet: balance, exposure: exposure }, async function (error, updateUser) {
                                        io.to(socket.id).emit("user-depositInsite", { message: "Deposit to Id Submitted", success: true, data: doc1 });
                                    });
                                })
                                .catch(error => {
                                    // console.log(error);
                                    io.to(socket.id).emit("user-depositInsite", { message: "DB error in id deposit", success: false, data: [], error: error });
                                })

                        }
                    });
                }
            }
        });
    }
    catch (error) {
        // console.log(error);
        io.to(socket.id).emit("user-depositInsite", { message: "Unknown error", success: false, data: [], error: error });
    }
}

//Withdrawal form My Sites
module.exports.withdrawalInsites = async (io, socket, req) => {
    try {
        // let decoded = jwt.verify(req.token, myEnv.parsed.SECRET);
        let { userId } = jwt.decode(req.token);
        let user = await User.findOne({ _id: userId });
        if (!user._id) return io.to(socket.id).emit("user-withdrawalInsites", { message: "Token Invalid. Please login in again.", success: false, data: [] });
        if (user.token != req.token) return io.to(socket.id).emit("user-withdrawalInsites", { message: "Token Invalid. Please login in again.", success: false, data: [] });

        let query;
        let manager;
        if (user.type == "Manager") {
            query = "Admin"
            manager = await Manager.findOne({ _id: user.typeId });
        } else {
            query = "Subadmin"
            manager = await SubAdmin.findOne({ _id: user.typeId });
        }

        var characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
        var result = ""
        var charactersLength = characters.length;

        for (var i = 0; i < 10; i++) {
            result += characters.charAt(Math.floor(Math.random() * charactersLength));
        }

        let balance = parseInt(user.wallet);
        let exposure = parseInt(user.exposure);

        let mysite = await Mysite.findOne({ _id: req.mysiteId });

        const payment = new Payment({
            type: 'Withdrawal',
            userId: user._id,
            amount: req.amount,
            name: user.name,
            username: user.username,
            paymentType: req.type,
            status: 'Pending',
            managerType: user.type,
            managerId: user.typeId,
            balance: balance,
            to: "Id",
            sites: mysite.sites,
            mysites: req.mysiteId,
            refrenceNo: result
        });
        payment.save()
            .then(doc => {


                // Push Notification Start
                if (manager.playerId) {
                    var datapush = {
                        app_id: "9adf2973-6d8a-4a42-9ce0-a3a98d97deaa",
                        contents: { "en": `${user.name} has created a request to withdrawal amount of ${req.amount}` },
                        headings: { "en": "Withdrawal Payment From Id Request" },
                        big_picture: "https://blog.taskpigeon.co/wp-content/uploads/2017/06/Advanced-Email-Notifications-Task-Pigeon.jpg",
                        url: "",
                        include_player_ids: [manager.playerId]
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
                            // console.log("Response:");
                            // // console.log(JSON.parse(datapush));

                        });
                    });

                    requestpush.on('error', function (e) {
                        // console.log("ERROR:");

                        // console.log(e);
                    });

                    requestpush.write(JSON.stringify(datapush));
                    requestpush.end();
                }
                // Push Notification End

                User.updateOne({
                    '_id': userId
                }, { wallet: balance, exposure: exposure }, async function (error, updateUser) {
                    io.to(socket.id).emit("user-withdrawalInsites", { message: "Withdrawal registered", success: true, data: doc });
                });
            })
            .catch(error => {
                // console.log(error);
                io.to(socket.id).emit("user-withdrawalInsites", { message: "DB error in withdrawal register", success: false, data: [], error: error });
            })
    }
    catch (error) {
        // console.log(error);
        io.to(socket.id).emit("user-withdrawalInsites", { message: "Unknown error", success: false, data: [], error: error });
    }
}