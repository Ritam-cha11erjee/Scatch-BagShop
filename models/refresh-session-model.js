const mongoose = require("mongoose");

const refreshSessionSchema = mongoose.Schema({
    accountId: {
        type: mongoose.Schema.Types.ObjectId,
        required: true
    },
    accountType: {
        type: String,
        enum: ["user", "owner"],
        required: true
    },
    familyId: {
        type: String,
        required: true,
        index: true
    },
    tokenHash: {
        type: String,
        required: true,
        unique: true
    },
    expiresAt: {
        type: Date,
        required: true
    },
    familyExpiresAt: {
        type: Date,
        required: true
    },
    revokedAt: Date
});

module.exports = mongoose.model("refreshSession", refreshSessionSchema);