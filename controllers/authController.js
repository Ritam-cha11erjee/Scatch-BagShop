const userModel = require('../models/user-model')
const ownerModel = require('../models/owner-model')
const bcrypt = require('bcrypt');
const {
    generateAccessToken
} = require('../utils/generateTokens');
const {
    createRefreshSession,
    rotateRefreshSession,
    revokeRefreshSession
} = require('../utils/refreshSessions');
const {
    accessTokenMaxAge,
    refreshTokenMaxAge
} = require('../utils/authConfig');

const accessCookieOptions = {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: accessTokenMaxAge
};

const refreshCookieOptions = {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: refreshTokenMaxAge
};

const setUserAuthCookies = async (res, user) => {
    const refreshToken = await createRefreshSession(user, "user");
    res.cookie("userAccessToken", generateAccessToken(user), accessCookieOptions);
    res.cookie("userRefreshToken", refreshToken, refreshCookieOptions);
};

const setOwnerAuthCookies = async (res, owner) => {
    const refreshToken = await createRefreshSession(owner, "owner");
    res.cookie("ownerAccessToken", generateAccessToken(owner), accessCookieOptions);
    res.cookie("ownerRefreshToken", refreshToken, refreshCookieOptions);
};

module.exports.registerUser = async (req, res) => {
    try {
        let { fullname, email, password } = req.body;

        let user = await userModel.findOne({ email });
        if (user) return res.status(401).send("User Already Exists!");

        bcrypt.genSalt(10, (err, salt) => {
            bcrypt.hash(password, salt, async (err, hash) => {
                if (err) {
                    return res.send(err.message);
                }
                let user = await userModel.create({
                    fullname,
                    email,
                    role: "user",
                    password: hash
                });

                await setUserAuthCookies(res, user);
                res.redirect('/shop');
            })
        })
    } catch (err) {
        console.log(err.message);
    }
}

module.exports.loginUser = async (req, res) => {
    let { email, password } = req.body;

    let user = await userModel.findOne({ email });
    if (!user) return res.status(401).send('Email or Password is incorrect');
    user.role = "user";
    bcrypt.compare(password, user.password, (err, result) => {
        if (result) {
            setUserAuthCookies(res, user)
                .then(() => res.redirect("/shop"))
                .catch(() => res.status(500).send("Unable to create login session"));
        }
        else {
            res.status(401).send('Email or Password is incorrect');
        }
    });
}

module.exports.refreshUserToken = async (req, res) => {
    try {
        const result = await rotateRefreshSession(
            req.cookies.userRefreshToken,
            userModel,
            "user"
        );

        res.cookie("userAccessToken", result.accessToken, accessCookieOptions);
        res.cookie("userRefreshToken", result.refreshToken, refreshCookieOptions);
        return res.redirect("/shop");
    } catch (err) {
        return res.redirect("/");
    }
};

module.exports.logout = async (req, res) => {
    await Promise.all([
        revokeRefreshSession(req.cookies.userRefreshToken),
        revokeRefreshSession(req.cookies.ownerRefreshToken)
    ]);
    res.clearCookie("userAccessToken");
    res.clearCookie("userRefreshToken");
    res.clearCookie("ownerAccessToken");
    res.clearCookie("ownerRefreshToken");

    res.redirect("/");
};



module.exports.loginOwner = async (req, res) => {
    let { email, password } = req.body;

    let owner = await ownerModel.findOne({ email });
    if (!owner) return res.status(401).send('Email or Password is incorrect');
    bcrypt.compare(password, owner.password, (err, result) => {
        if (result) {
            owner.role = "owner";
            setOwnerAuthCookies(res, owner)
                .then(() => res.redirect("/owners/admin"))
                .catch(() => res.status(500).send("Unable to create login session"));
        } else {
            res.status(401).send("Email or Password is incorrect");
        }
    });
}