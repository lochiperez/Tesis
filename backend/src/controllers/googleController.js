const db = require('../firebase/firebase')

exports.getApiGoogleMaps = async (req, res) => {
  try {
    const doc = await db.collection('api_key').doc('api_google').get();

    if (!doc.exists) {
      return res.status(404).json({ error: 'Key no encontrada' });
    }

    res.json(doc.data());
  } catch (error) {
    console.error('Error al obtener Key', error);
    res.status(500).json({ error: 'Error al obtener Key' });
  }
};

