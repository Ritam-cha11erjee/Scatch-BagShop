const express = require('express');
const router = express.Router();
const isLoggedIn = require('../middlewares/isLoggedIn');
const productModel = require('../models/product-model');
const userModel = require('../models/user-model');
const {logout} = require('../controllers/authController');

router.get('/', (req, res) => {
    let error = req.flash("error");
    res.render("index", {error, loggedin: false});
});

router.get('/shop', isLoggedIn, async (req, res) => {
    let products = await productModel.find();
    let success = req.flash("success");
    res.render('shop', {products, success});
})

router.get('/shop/discounts', isLoggedIn, async (req, res) => {
    let products = await productModel.find({discount: {$gt: 0}});
    let success = req.flash("success");
    res.render('shop', {products, success});
})

router.get('/cart', isLoggedIn, async (req, res) => {
    let user =  await userModel.findOne({email: req.user.email}).populate('cart');
    res.render('cart', {user});
})

router.get('/addtocart/:productId', isLoggedIn, async (req, res) => {
    let user = await userModel.findOne({email: req.user.email});
    user.cart.push(req.params.productId);
    await user.save();

    req.flash("success", "Added to cart");
    res.redirect('/shop');
})

router.get('/logout', logout);

module.exports = router;