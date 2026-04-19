const mongoose = require('mongoose');
const dbgr = require('debug')("development:mongoose");

mongoose
.connect(`${process.env.MONGODB_URI}`)
.then(() => {
    dbgr("connected");
    console.log("Connected");
})
.catch((err) => {
    dbgr(err);
})

module.exports = mongoose.connection;