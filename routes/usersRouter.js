const express = require('express');
const router = express.Router();
const {registerUser, loginUser, refreshUserToken} = require('../controllers/authController');

router.get('/', (req, res) => {
    res.send("Hey");
})

router.post('/register', registerUser);

router.post('/login', loginUser);

router.post('/refresh', refreshUserToken)


module.exports = router;