const db = require('../firebase/firebase');

// Guardar una consulta de ruta
exports.saveRouteQuery = async (req, res) => {
    try {
        const { userId, origin, destination, distance, duration, travelMode } = req.body;

        if (!userId || !origin || !destination) {
            return res.status(400).json({
                error: 'userId, origin y destination son requeridos'
            });
        }

        const routeData = {
            userId,
            origin,
            destination,
            distance: distance || 'N/A',
            duration: duration || 'N/A',
            travelMode: travelMode || 'DRIVING',
            timestamp: new Date().toISOString(),
            createdAt: new Date()
        };

        const routeRef = await db.collection('RutasConsultadas').add(routeData);

        res.status(201).json({
            success: true,
            message: 'Ruta guardada exitosamente',
            routeId: routeRef.id,
            route: {
                id: routeRef.id,
                ...routeData
            }
        });
    } catch (error) {
        console.error('Error al guardar ruta:', error);
        res.status(500).json({ error: 'Error al guardar la ruta consultada' });
    }
};

// Obtener todas las rutas consultadas (igual que getIncidents)
exports.getRoutes = async (req, res) => {
    try {
        const snapshot = await db.collection('RutasConsultadas').get();
        const routes = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        }));
        res.json(routes);
    } catch (error) {
        console.error('Error al obtener rutas:', error);
        res.status(500).json({ error: 'Error al obtener las rutas consultadas' });
    }
};

// Eliminar una ruta consultada
exports.deleteRouteQuery = async (req, res) => {
    try {
        const { id } = req.params;

        await db.collection('RutasConsultadas').doc(id).delete();

        res.json({
            success: true,
            message: 'Ruta eliminada exitosamente'
        });
    } catch (error) {
        console.error('Error al eliminar ruta:', error);
        res.status(500).json({ error: 'Error al eliminar la ruta' });
    }
};
