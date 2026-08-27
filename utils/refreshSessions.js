const crypto = require("crypto");
const jwt = require("jsonwebtoken");
const refreshSessionModel = require("../models/refresh-session-model");
const {
    generateAccessToken,
    generateRefreshToken
} = require("./generateTokens");
const {
    refreshTokenMaxAge,
    sessionMaxAge
} = require("./authConfig");

const hashToken = (token) => {
    return crypto.createHash("sha256").update(token).digest("hex");
};

const addDays = (date, days) => {
    return new Date(date.getTime() + days * 24 * 60 * 60 * 1000);
};

const createRefreshSession = async (account, accountType) => {
    const familyId = crypto.randomUUID();
    const refreshToken = generateRefreshToken(account, familyId);
    const now = new Date();

    await refreshSessionModel.create({
        accountId: account._id,
        accountType,
        familyId,
        tokenHash: hashToken(refreshToken),
        expiresAt: new Date(now.getTime() + refreshTokenMaxAge),
        familyExpiresAt: new Date(now.getTime() + sessionMaxAge)
    });

    return refreshToken;
};

const rotateRefreshSession = async (refreshToken, accountModel, accountType) => {
    const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_KEY);

    if (decoded.role !== accountType || !decoded.sid) {
        throw new Error("Invalid refresh token");
    }

    const tokenHash = hashToken(refreshToken);
    const now = new Date();
    const session = await refreshSessionModel.findOneAndUpdate(
        {
            familyId: decoded.sid,
            tokenHash,
            accountType,
            revokedAt: null,
            expiresAt: { $gt: now },
            familyExpiresAt: { $gt: now }
        },
        { $set: { revokedAt: now } },
        { new: false }
    );

    if (!session) {
        await refreshSessionModel.updateMany(
            { familyId: decoded.sid, revokedAt: null },
            { $set: { revokedAt: now } }
        );
        throw new Error("Refresh token reuse detected");
    }

    const account = await accountModel.findById(session.accountId).select("-password");
    if (!account) {
        throw new Error("Account not found");
    }

    account.role = accountType;
    const newRefreshToken = generateRefreshToken(account, session.familyId);

    await refreshSessionModel.create({
        accountId: account._id,
        accountType,
        familyId: session.familyId,
        tokenHash: hashToken(newRefreshToken),
        expiresAt: new Date(now.getTime() + refreshTokenMaxAge),
        familyExpiresAt: session.familyExpiresAt
    });

    return {
        account,
        accessToken: generateAccessToken(account),
        refreshToken: newRefreshToken
    };
};

const revokeRefreshSession = async (refreshToken) => {
    if (!refreshToken) {
        return;
    }

    try {
        const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_KEY);
        await refreshSessionModel.updateMany(
            { familyId: decoded.sid, revokedAt: null },
            { $set: { revokedAt: new Date() } }
        );
    } catch (err) {
        // Invalid or expired tokens are already unusable.
    }
};

module.exports = {
    createRefreshSession,
    rotateRefreshSession,
    revokeRefreshSession
};