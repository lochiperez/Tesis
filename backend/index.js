const express = require('express')
const cors = require('cors')
const dotenv = require('dotenv')
// const mapsRouter = require('./src/routes/maps.js')
const weatherRouter = require('./src/routes/weather.js')
const userRoutes = require('./src/routes/users')
const incidentRoutes = require('./src/routes/incidents')
const routeQueriesRoutes = require('./src/routes/routes')
const routeFirebase = require('./src/routes/firebaseRoute.js')
const routeGoogle = require('./src/routes/google.js')

dotenv.config()

const app = express()
app.use(cors())
app.use(express.json())

//endpoint que devuelve la API Key
app.get('/maps-script', (req, res) => {
  const key = process.env.GOOGLE_MAPS_API_KEY;
  res.redirect(`https://maps.googleapis.com/maps/api/js?key=${key}&libraries=maps,places&v=beta`);
});

//rutas
app.use('/api/usuarios', userRoutes)
// app.use('/api/maps', mapsRouter)
app.use('/api/weather', weatherRouter)
app.use('/api/incidents', incidentRoutes)
app.use('/api/routes', routeQueriesRoutes)
app.use('/api/firebase', routeFirebase)
app.use('/api/google', routeGoogle)

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => console.log(`Backend corriendo en ${PORT}`))