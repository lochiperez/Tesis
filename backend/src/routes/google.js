const express = require('express')
const router = express.Router()
const {
    getApiGoogleMaps
} = require('../controllers/googleController.js')

router.get('/', getApiGoogleMaps)

module.exports = router