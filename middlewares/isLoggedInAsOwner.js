const jwt = require('jsonwebtoken');
const ownerModel = require('../models/owner-model');

module.exports = async (req, res, next) => {

    if (!req.cookies.token) {
        req.flash("error", 'You need to be logged in.');
        return res.redirect('/owners/login');
    }

    try {
        let decoded = jwt.verify(req.cookies.token, process.env.JWT_KEY);

        let owner = await ownerModel.findOne({ email: decoded.email }).select('-password');
        if (!owner) {
            req.flash("error", 'Something went wrong');
            res.redirect('/owners/login');
        }
        else {
            req.owner = owner;
            next();
        }
    } catch (err) {
        req.flash("error", 'Something went wrong');
        res.redirect('/owners/login');
    }

};