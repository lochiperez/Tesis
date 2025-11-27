const axios = require('axios');
const dotenv = require('dotenv');
dotenv.config();

const db = require('../firebase/firebase');

async function obtenerApiKeyOpenWeather() {
  const doc = await db.collection('api_key').doc('api_openweather').get();

  if (!doc.exists) {
    throw new Error('Key no encontrada');
  }

  return doc.data().api;
}

exports.getApiWeather = async (req, res) => {
  try {
    const doc = await db.collection('api_key').doc('api_openweather').get();

    if (!doc.exists) {
      return res.status(404).json({ error: 'Key no encontrada' });
    }

    res.json(doc.data());
  } catch (error) {
    console.error('Error al obtener Key', error);
    res.status(500).json({ error: 'Error al obtener Key' });
  }
};

exports.getWeather = async (req, res) => {
  const { lat, lon } = req.query;

  if (!lat || !lon) {
    return res.status(400).json({ error: 'Faltan parametros' });
  }

  try {
    // 🔥 Obtener API Key desde Firestore
    const apiKey = await obtenerApiKeyOpenWeather();

    const url = `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${apiKey}&units=metric&lang=es`;

    const { data } = await axios.get(url);

    res.json(data);

  } catch (err) {
    console.error('Error al obtener el clima:', err);
    res.status(500).json({ error: 'Error al obtener el clima' });
  }
};


