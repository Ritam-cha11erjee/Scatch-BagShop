const express = require('express');
const router = express.Router();
const ownerModel = require('../models/owner-model');
const productModel = require('../models/product-model');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { loginOwner } = require('../controllers/authController');
const isLoggedInAsOwner = require('../middlewares/isLoggedInAsOwner');
const {generateToken} = require('../utils/generateTokens');

router.get('/createproduct', isLoggedInAsOwner, (req, res) => {
    let success = req.flash("success");
    res.render("createproducts", { success });
})

router.get('/admin', isLoggedInAsOwner, async (req, res) => {
    let products = await productModel.find();
    res.render("admin", { products });
})

router.get('/login', (req, res) => {
    res.render("owner-login");
})

router.post('/login', loginOwner);
if (process.env.NODE_ENV === 'development') {
    router.post('/create', async (req, res) => {
        let owner = await ownerModel.find();
        if (owner.length > 0) {
            return res.status(504).send("You don't have permission to create a new owner.")
        }
        let { fullname, email, password } = req.body;

        bcrypt.genSalt(10, (err, salt) => {
            bcrypt.hash(password, salt, async (err, hash) => {
                let createdOwner = await ownerModel.create({
                    fullname,
                    email,
                    password: hash
                });

                let token = generateToken(createdOwner);
                res.cookie('token', token);
                res.redirect('/owners/admin');
            })
        })
    })
}

module.exports = router;