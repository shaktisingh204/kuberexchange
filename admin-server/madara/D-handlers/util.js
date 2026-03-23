const myEnv = require('dotenv').config();


const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');



let hashPassword = function (password) {
  console.log("password: ", password);
  return bcrypt.hashSync(password, bcrypt.genSaltSync(8));
}


let generateregisterationToken = function (id) {
  const registerationToken = jwt.sign({
      userId : id
  },
  myEnv.parsed.SECRET,
  { expiresIn: "7d"}
  );

  return registerationToken;
}

let generateToken  = function (id){
  const token = jwt.sign({
      userId : id
  },
  myEnv.parsed.SECRET,{expiresIn : "7d" }
  );

  return token;
}



let comparePassword = function (hashPassword,password){

  return bcrypt.compareSync(password,hashPassword);
}


let isValidEmail = function (email) {
  return /\S+@\S+\.\S+/.test(email);
}


module.exports = {hashPassword, generateregisterationToken, generateToken, comparePassword, isValidEmail};