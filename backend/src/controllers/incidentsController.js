const db = require('../firebase/firebase');

// Crear un nuevo incidente
exports.createIncident = async (req, res) => {
    try {
        const { type, lat, lng, description, userId } = req.body;

        // Validar campos requeridos
        if (!type || lat === undefined || lng === undefined) {
            return res.status(400).json({
                error: 'Tipo, latitud y longitud son requeridos'
            });
        }

        // Validar tipo de incidente
        const validTypes = ['accidente', 'rutaEnMalEstado', 'retencion', 'obraEnRuta', 'animalesSueltos', 'complicacionClimatica'];
        if (!validTypes.includes(type)) {
            return res.status(400).json({
                error: 'Tipo de incidente inválido'
            });
        }

        // Crear nuevo incidente
        const newIncident = {
            type,
            lat: parseFloat(lat),
            lng: parseFloat(lng),
            description: description || '',
            userId: userId || null,
            timestamp: new Date().toISOString(),
            upvotes: 0,
            downvotes: 0,
            votes: {} // Objeto para trackear votos por usuario
        };

        const docRef = await db.collection('Incidentes').add(newIncident);

        res.status(201).json({
            success: true,
            message: 'Incidente reportado exitosamente',
            incident: {
                id: docRef.id,
                ...newIncident
            }
        });
    } catch (error) {
        console.error('Error al crear incidente:', error);
        res.status(500).json({ error: 'Error al reportar el incidente' });
    }
};

// Obtener todos los incidentes
exports.getIncidents = async (req, res) => {
    try {
        const snapshot = await db.collection('Incidentes').get();
        const incidents = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        }));
        res.json(incidents);
    } catch (error) {
        console.error('Error al obtener incidentes:', error);
        res.status(500).json({ error: 'Error al obtener los incidentes' });
    }
};

// Obtener incidentes por área (radio desde un punto)
exports.getIncidentsByArea = async (req, res) => {
    try {
        const { lat, lng, radius } = req.query;

        if (!lat || !lng || !radius) {
            return res.status(400).json({
                error: 'Latitud, longitud y radio son requeridos'
            });
        }

        const centerLat = parseFloat(lat);
        const centerLng = parseFloat(lng);
        const radiusKm = parseFloat(radius) / 1000; // Convertir metros a km

        // Obtener todos los incidentes (en producción, usar geohash para mejor performance)
        const snapshot = await db.collection('Incidentes').get();

        // Filtrar por distancia
        const incidents = snapshot.docs
            .map(doc => ({
                id: doc.id,
                ...doc.data()
            }))
            .filter(incident => {
                const distance = calculateDistance(
                    centerLat,
                    centerLng,
                    incident.lat,
                    incident.lng
                );
                return distance <= radiusKm;
            });

        res.json(incidents);
    } catch (error) {
        console.error('Error al obtener incidentes por área:', error);
        res.status(500).json({ error: 'Error al obtener los incidentes' });
    }
};

// Votar positivo en un incidente
exports.upvoteIncident = async (req, res) => {
    try {
        const { id } = req.params;
        const { userId } = req.body;

        if (!userId) {
            return res.status(400).json({ error: 'userId es requerido' });
        }

        const docRef = db.collection('Incidentes').doc(id);
        const doc = await docRef.get();

        if (!doc.exists) {
            return res.status(404).json({ error: 'Incidente no encontrado' });
        }

        const incident = doc.data();
        const votes = incident.votes || {};
        const previousVote = votes[userId];

        let upvotes = incident.upvotes || 0;
        let downvotes = incident.downvotes || 0;

        // Si ya votó positivo, remover el voto
        if (previousVote === 'up') {
            upvotes--;
            delete votes[userId];
        }
        // Si votó negativo, cambiar a positivo
        else if (previousVote === 'down') {
            downvotes--;
            upvotes++;
            votes[userId] = 'up';
        }
        // Si no ha votado, agregar voto positivo
        else {
            upvotes++;
            votes[userId] = 'up';
        }

        await docRef.update({ upvotes, downvotes, votes });

        res.json({
            success: true,
            upvotes,
            downvotes,
            userVote: votes[userId] || null
        });
    } catch (error) {
        console.error('Error al votar incidente:', error);
        res.status(500).json({ error: 'Error al registrar el voto' });
    }
};

// Votar negativo en un incidente
exports.downvoteIncident = async (req, res) => {
    try {
        const { id } = req.params;
        const { userId } = req.body;

        if (!userId) {
            return res.status(400).json({ error: 'userId es requerido' });
        }

        const docRef = db.collection('Incidentes').doc(id);
        const doc = await docRef.get();

        if (!doc.exists) {
            return res.status(404).json({ error: 'Incidente no encontrado' });
        }

        const incident = doc.data();
        const votes = incident.votes || {};
        const previousVote = votes[userId];

        let upvotes = incident.upvotes || 0;
        let downvotes = incident.downvotes || 0;

        // Si ya votó negativo, remover el voto
        if (previousVote === 'down') {
            downvotes--;
            delete votes[userId];
        }
        // Si votó positivo, cambiar a negativo
        else if (previousVote === 'up') {
            upvotes--;
            downvotes++;
            votes[userId] = 'down';
        }
        // Si no ha votado, agregar voto negativo
        else {
            downvotes++;
            votes[userId] = 'down';
        }

        await docRef.update({ upvotes, downvotes, votes });

        res.json({
            success: true,
            upvotes,
            downvotes,
            userVote: votes[userId] || null
        });
    } catch (error) {
        console.error('Error al votar incidente:', error);
        res.status(500).json({ error: 'Error al registrar el voto' });
    }
};

// Remover voto de un incidente
exports.removeVote = async (req, res) => {
    try {
        const { id } = req.params;
        const { userId } = req.body;

        if (!userId) {
            return res.status(400).json({ error: 'userId es requerido' });
        }

        const docRef = db.collection('Incidentes').doc(id);
        const doc = await docRef.get();

        if (!doc.exists) {
            return res.status(404).json({ error: 'Incidente no encontrado' });
        }

        const incident = doc.data();
        const votes = incident.votes || {};
        const previousVote = votes[userId];

        let upvotes = incident.upvotes || 0;
        let downvotes = incident.downvotes || 0;

        if (previousVote === 'up') {
            upvotes--;
        } else if (previousVote === 'down') {
            downvotes--;
        }

        delete votes[userId];

        await docRef.update({ upvotes, downvotes, votes });

        res.json({
            success: true,
            upvotes,
            downvotes,
            userVote: null
        });
    } catch (error) {
        console.error('Error al remover voto:', error);
        res.status(500).json({ error: 'Error al remover el voto' });
    }
};

exports.deleteIncident = async (req, res) => {
    const { id } = req.params;
    try {
        await db.collection('Incidentes').doc(id).delete();
        res.json({ message: 'Incidente eliminado' });
    } catch (error) {
        res.status(500).json({ error: 'Error al eliminar el incidente' });
    }
};

// Función auxiliar para calcular distancia entre dos puntos (fórmula de Haversine)
function calculateDistance(lat1, lon1, lat2, lon2) {
    const R = 6371; // Radio de la Tierra en km
    const dLat = toRad(lat2 - lat1);
    const dLon = toRad(lon2 - lon1);
    const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
        Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
}

function toRad(degrees) {
    return degrees * (Math.PI / 180);
}
