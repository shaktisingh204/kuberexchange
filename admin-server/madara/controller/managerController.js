const Manager = require('../models/managerModel');
const Site = require('../models/siteModel');

// Required Helper Function
const util = require('./util');
const jwt = require('jsonwebtoken');



// Manager Login
module.exports.login = (req, res) => {
    try {
        let { username, password } = req.body;
        if (!username || !password) return res.send({ success: false, message: "missing field/'s" });

        else {
            Manager.findOne({ username: username })
                .then(doc => {
                    if (!doc) return res.send({ data: {}, success: false, message: "No such user found" });

                    if (!util.comparePassword(doc.password, password)) {
                        return res.send({ data: {}, success: false, message: "Incorrect password" });
                    }
                    else {
                        const token = util.generateToken(doc._id);

                        const data = { doc, token }
                        res.send({ data, success: true, message: "Manager login success" });
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

// Get Sites
module.exports.getSite = async (req, res) => {
    try {
        let { userId } = jwt.decode(req.params.token);
        let manager = await Manager.findOne({ _id: userId });
        if (!manager._id) return res.send({ error, success: false, message: "Please login in again." });

        Site.find({ type: 'Admin'})
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