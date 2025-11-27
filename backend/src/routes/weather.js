const express = require('express')
const router = express.Router()
const { 
    getWeather,
    getApiWeather
 } = require('../controllers/weather.js')

router.get('/', getWeather);
router.get('/api-weather', getApiWeather)

module.exports = router;