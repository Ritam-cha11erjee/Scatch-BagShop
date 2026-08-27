const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const {
    accessTokenExpiresIn,
    refreshTokenExpiresIn
} = require('./authConfig');

const generateAccessToken = (account) => {
    return jwt.sign(
        {
            email: account.email, 
            id: account._id,
            role: account.role
        }, 
        process.env.JWT_KEY,
        { expiresIn: accessTokenExpiresIn }
    );
}

const generateRefreshToken = (account, sessionId) => {
    return jwt.sign(
        {
            id: account._id,
            role: account.role,
            sid: sessionId,
            jti: crypto.randomUUID()
        },
        process.env.JWT_REFRESH_KEY,
        { expiresIn: refreshTokenExpiresIn }
    );
}

module.exports = {
    generateAccessToken,
    generateRefreshToken
};