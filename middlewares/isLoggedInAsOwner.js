const ownerModel = require("../models/owner-model");
const jwt = require("jsonwebtoken");
const { rotateRefreshSession } = require("../utils/refreshSessions");
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
                req.cookies.ownerAccessToken,
                process.env.JWT_KEY
            );
        } catch (err) {
            if (req.cookies.ownerAccessToken && err.name !== "TokenExpiredError") {
                throw err;
            }

            const result = await rotateRefreshSession(
                req.cookies.ownerRefreshToken,
                ownerModel,
                "owner"
            );

            res.cookie(
                "ownerAccessToken",
                result.accessToken,
                accessCookieOptions
            );

            res.cookie(
                "ownerRefreshToken",
                result.refreshToken,
                refreshCookieOptions
            );

            decoded = { id: result.account._id, role: "owner" };
        }

        if (decoded.role !== "owner") {
            throw new Error("Invalid token role");
        }

        const owner = await ownerModel
            .findById(decoded.id)
            .select("-password");

        if (!owner) {
            throw new Error("Owner not found");
        }

        req.owner = owner;
        next();
    } catch (err) {
        req.flash("error", "Your session has expired. Please log in again.");
        return res.redirect("/owners/login");
    }
};