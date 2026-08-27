const jwt = require("jsonwebtoken");
const userModel = require("../models/user-model");
const {
    rotateRefreshSession
} = require("../utils/refreshSessions");
const {
    accessTokenMaxAge,
    refreshTokenMaxAge
} = require("../utils/authConfig");

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

module.exports = async (req, res, next) => {
    try {
        let decoded;

        try {
            decoded = jwt.verify(
                req.cookies.userAccessToken,
                process.env.JWT_KEY
            );
        } catch (err) {
            if (req.cookies.userAccessToken && err.name !== "TokenExpiredError") {
                throw err;
            }

            const result = await rotateRefreshSession(
                req.cookies.userRefreshToken,
                userModel,
                "user"
            );

            res.cookie(
                "userAccessToken",
                result.accessToken,
                accessCookieOptions
            );

            res.cookie(
                "userRefreshToken",
                result.refreshToken,
                refreshCookieOptions
            );

            decoded = { id: result.account._id, role: "user" };
        }

        if (decoded.role !== "user") {
            throw new Error("Invalid token role");
        }

        const user = await userModel
            .findById(decoded.id)
            .select("-password");

        if (!user) {
            throw new Error("User not found");
        }

        req.user = user;
        next();
    } catch (err) {
        req.flash("error", "Your session has expired. Please log in again.");
        return res.redirect("/");
    }
};