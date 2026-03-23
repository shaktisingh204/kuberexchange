const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const myEnv = require("dotenv").config();
const hbs = require("handlebars");
const nodemailer = require("nodemailer");
const fs = require("fs");
const path = require("path");

const Helper = {
    hashPassword(password) {
        return bcrypt.hashSync(password, bcrypt.genSaltSync(10));
    },

    /* function for checking valid email or not based on email pattern */
    isValidEmail(email) {
        return /\S+@\S+\.\S+/.test(email);
    },

    /* function for compare password with database when user give password at the time of registration */
    comparePassword(hashPassword, password) {
        return bcrypt.compareSync(password, hashPassword);
    },

    oldsendMail(mailData, templateData, emailTemplate) {
        try {
            return new Promise((resolve, rejects) => {
                const template = hbs.compile(emailTemplate);
                //   console.log("template: ", template)
                let htmlToSend = template({ data: templateData });
                //   console.log("mail data: ", mailData);

                // create reusable transporter object using the default SMTP transport
                let transporter = nodemailer.createTransport({
                    host: "smtp.gmail.com",
                    port: 465,
                    auth: {
                        user: "chauhan.ankur503@gmail.com",
                        pass: "ankur@123#",
                    },
                });
                let response = false;
                // send mail with defined transport object
                transporter
                    .sendMail({
                        from: "chauhan.ankur503@gmail.com", // sender address
                        to: mailData.to, // list of receivers
                        subject: mailData.subject, // Subject line
                        text: "OTP?", // plain text body
                        html: htmlToSend, // html body
                    })
                    .then(
                        (result) => {
                            // console.log("result: ", result);
                            response = true;
                            resolve(response);
                        },
                        (error) => {
                            // console.log("error: ", error);
                            response = false;
                            rejects(response);
                        }
                    );
                //   response = true;
                //   console.log("sdbfsdk: ", response);
                //   return response;
            });
        } catch (error) {
            console.log(error);
            return false;
        }
    },

    sendMail(mailData, templateData, emailTemplate) {
        try {
            return new Promise((resolve, rejects) => {
                const template = hbs.compile(emailTemplate);
                let htmlToSend = template({ data: templateData });

                // create reusable transporter object using the default SMTP transport
                // let transporter = nodemailer.createTransport({
                //     host: 'mail.fantasylineups.com',
                //     port: 465,
                //     auth: {
                //     user: "noreply@fantasylineups.com",
                //     pass: "76%p;[Z?vw.v",
                //     },
                // });

                ///// Rohit (QA) Postmarkapp details
                // let transporter = nodemailer.createTransport({
                //     host: "smtp.postmarkapp.com",
                //     port: 587,
                //     auth: {
                //         user: "cf73e76b-4bf6-4e49-a03f-c9d38cf577d6",
                //         pass: "cf73e76b-4bf6-4e49-a03f-c9d38cf577d6",
                //     },
                // });
				
                let transporter = nodemailer.createTransport({
					host: 'smtp.mailtrap.io',
					port: 2525,
					auth: {
						user: "60950bfc6bbe82",
						pass: "fd2274e7aa23cc",
					},
                });
				
                ///// Pratham Postmarkapp details
                // let transporter = nodemailer.createTransport({
                // host: 'smtp.postmarkapp.com',
                // port: 587,
                // auth: {
                // user: "a48a3d34-a64b-4325-b807-2333bd4a21c5",
                // pass: "a48a3d34-a64b-4325-b807-2333bd4a21c5",
                // },
                // });

                // let transporter = nodemailer.createTransport({
                // host: 'smtp.mailtrap.io',
                // port: 2525,
                // auth: {
                // user: "827d2450d994cb",
                // pass: "da746dbfa568e5",
                // },
                // });

                let response = false;
                // send mail with defined transport object
                transporter
                    .sendMail({
                        from: "rohit.kumar@dikonia.in", // sender address rohit.kumar@dikonia.in
                        to: mailData.to, // list of receivers
                        subject: mailData.subject, // Subject line
                        text: "OTP?", // plain text body
                        html: htmlToSend, // html body
                    })
                    .then(
                        (result) => {
                            // console.log("result: ", result);
                            response = true;
                            resolve(response);
                        },
                        (error) => {
                            // console.log("error: ", error);
                            response = false;
                            rejects(response);
                        }
                    );
                //   response = true;
                //   console.log("sdbfsdk: ", response);
                //   return response;
            });
        } catch (error) {
            console.log(error);
            return false;
        }
    },

    /* generate new token when user will login and store userid and role name inside token */
    generateToken(id) {
        const token = jwt.sign(
            {
                userId: id,
            },
            myEnv.parsed.SECRET,
            { expiresIn: "7d" }
        );
        return token;
    },

    generateregisterationToken(id) {
        const registerationToken = jwt.sign(
            {
                userId: id,
            },
            myEnv.parsed.REGISTERATION_SECRET
        );
        return registerationToken;
    },

    //Verify Token
    verifyToken(req, res, next) {
        //Get Auth header value
        const bearerHearder = req.headers["authorization"];
        //check if bearer is undefined
        if (typeof bearerHearder != "undefined") {
            //split at the space
            const bearer = bearerHearder.split(" ");
            //Get the token from array
            const bearerToken = bearer[1];
            // set the token
            req.token = bearerToken;
            //Next middleware
            next();
        } else {
            //Forbidden
            res.sendStatus(403);
        }
    },
};
module.exports = Helper;