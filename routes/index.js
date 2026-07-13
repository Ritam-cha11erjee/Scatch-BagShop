const express = require('express');
const router = express.Router();
const isLoggedIn = require('../middlewares/isLoggedIn');
const productModel = require('../models/product-model');
const userModel = require('../models/user-model');
const { logout } = require('../controllers/authController');

router.get('/', (req, res) => {
    let error = req.flash("error");
    res.render("index", { error, loggedin: false });
});

router.get('/shop', isLoggedIn, async (req, res) => {
    let newCollectionProducts = await productModel.find({ newCollection: true });
    let browseProducts = await productModel.find({ newCollection: { $ne: true } });
    let success = req.flash("success");
    res.render('shop', {
        products: { ...newCollectionProducts, ...browseProducts },
        newCollection: newCollectionProducts,
        browseProducts,
        selectedCategory: 'all',
        success
    });
})

router.get('/shop/discounts', isLoggedIn, async (req, res) => {
    let products = await productModel.find({ discount: { $gt: 0 } });
    let success = req.flash("success");
    res.render('shop', {
        products,
        newCollection: [],
        browseProducts: products,
        selectedCategory: 'discounts',
        success
    });
})

router.get('/shop/newCollection', isLoggedIn, async (req, res) => {
    let products = await productModel.find({ newCollection: true });
    let success = req.flash("success");
    res.render('shop', {
        products,
        newCollection: products,
        browseProducts: [],
        selectedCategory: 'newCollection',
        success
    });
})


router.get('/cart', isLoggedIn, async (req, res) => {
    let user = await userModel.findOne({ email: req.user.email }).populate('cart.product');
    res.render('cart', { user });
})

router.get('/addtocart/:productId', isLoggedIn, async (req, res) => {
    let user = await userModel.findOne({ email: req.user.email });
    let alreadyAddedProduct = user.cart.find(item => item.product.toString() === req.params.productId);
    if (alreadyAddedProduct) {
        alreadyAddedProduct.quantity += 1;
    }
    else {
        user.cart.push({ product: req.params.productId, quantity: 1 });
    }
    await user.save();

    req.flash("success", "Added to cart");
    res.redirect('/shop');
})

router.post('/cart/update-quantities', isLoggedIn, async (req, res) => {
    try {
        const { updates } = req.body; // Expects format: { "productId": quantity }

        // Validation check for empty payloads
        if (!updates || Object.keys(updates).length === 0) {
            return res.status(400).json({ message: "No updates provided" });
        }

        const user = await userModel.findOne({ email: req.user.email });
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        // Loop through the user's cart array and modify quantities based on frontend updates
        user.cart.forEach(item => {
            const prodIdStr = item.product.toString();
            if (updates[prodIdStr] !== undefined) {
                item.quantity = Math.max(1, updates[prodIdStr]);
            }
        });
        await user.save();

        res.status(200).json({ message: "Quantities synchronized successfully" });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

router.delete('/cart/remove/:productId', isLoggedIn, async (req, res) => {
    try {
        const { productId } = req.params;

        const updatedUser = await userModel.findOneAndUpdate(
            { email: req.user.email },
            { $pull: { cart: { product: productId } } },
            { new: true }
        );

        if (!updatedUser) {
            return res.status(404).json({ message: "User not found" });
        }

        res.status(200).json({ message: "Item removed from cart successfully" });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

router.get('/logout', logout);

module.exports = router;