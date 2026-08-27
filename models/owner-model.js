const mongoose = require('mongoose');

const ownerSchema = mongoose.Schema({
    fullname: String,
    email: String,
    password: String,
    products: {
        type: Array,
        default: []
    },
    role: {
        type: String,
        default: "owner",
        immutable: true
    },
    picture: String,
    gstin: String,
});

module.exports = mongoose.model("owner", ownerSchema);