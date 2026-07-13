const mongoose = require("mongoose");

mongoose.connect(process.env.MONGODB_URI)
.then(() => {
    console.log("Connected");
})
.catch(err => {
    console.error("Connection Error:");
    console.error(err);
});