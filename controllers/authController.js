const userModel = require('../models/user-model')
const ownerModel = require('../models/owner-model')
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const {generateToken} = require('../utils/generateTokens');


module.exports.registerUser = async (req, res) => {
    try {
        let { fullname, email, password } = req.body;

        let user = await userModel.findOne({email});
        if(user) return res.status(401).send("User Already Exists!");

        bcrypt.genSalt(10, (err, salt) => {
            bcrypt.hash(password, salt, async (err, hash) => {
                if (err) {
                    return res.send(err.message);
                }
                let user = await userModel.create({
                    fullname,
                    email,
                    password: hash
                });
                let token = generateToken(user);
                res.cookie("token", token);
                res.redirect('/shop');
            })
        })
    } catch (err) {
        console.log(err.message);
    }
}

module.exports.loginUser = async (req, res) => {
    let {email, password} = req.body;

    let user = await userModel.findOne({email});
    if(!user) return res.status(401).send('Email or Password is incorrect');

    bcrypt.compare(password, user.password, (err, result) => {
        if(result){
            let token = generateToken(user);
            res.cookie("token", token);
            res.redirect('/shop');
        }
        else{
            res.status(401).send('Email or Password is incorrect');
        }
    });
}

module.exports.logout = (req, res) => {
    res.cookie('token', "");
    res.redirect('/');
}



module.exports.loginOwner = async (req, res) => {
    let {email, password} = req.body;

    let owner = await ownerModel.findOne({email});
    if(!owner) return res.status(401).send('Email or Password is incorrect');

    bcrypt.compare(password, owner.password, (err, result) => {
        if(result){
            let token = generateToken(owner);
            res.cookie("token", token);
            res.redirect('/owners/admin');
        }
        else{
            res.status(401).send('Email or Password is incorrect');
        }
    });
}