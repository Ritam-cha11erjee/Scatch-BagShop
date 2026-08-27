const parseDuration = (value, fallback) => {
    const match = /^([0-9]+)\s*(s|m|h|d)$/i.exec(value || "");

    if (!match) {
        return fallback;
    }

    const amount = Number(match[1]);
    const units = { s: 1000, m: 60000, h: 3600000, d: 86400000 };
    return amount * units[match[2].toLowerCase()];
};

const accessTokenExpiresIn = process.env.ACCESS_TOKEN_EXPIRES_IN || "15m";
const refreshTokenExpiresIn = process.env.REFRESH_TOKEN_EXPIRES_IN || "30d";

module.exports = {
    accessTokenExpiresIn,
    refreshTokenExpiresIn,
    accessTokenMaxAge: parseDuration(accessTokenExpiresIn, 15 * 60 * 1000),
    refreshTokenMaxAge: parseDuration(refreshTokenExpiresIn, 30 * 24 * 60 * 60 * 1000),
    sessionMaxAge: parseDuration(
        process.env.SESSION_EXPIRES_IN || "90d",
        90 * 24 * 60 * 60 * 1000
    )
};