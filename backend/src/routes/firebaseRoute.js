const express = require('express')
const router = express.Router()
const {
    getApiFirebase
} = require('../controllers/firebaseController.js')

router.get('/', getApiFirebase)

module.exports = router