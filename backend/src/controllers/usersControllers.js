const db = require('../firebase/firebase');

// Registro de usuario
exports.register = async (req, res) => {
  try {
    const { nombre, apellido, email, password, telefono, direccion } = req.body;

    // Validar campos requeridos
    if (!nombre || !apellido || !email || !password) {
      return res.status(400).json({
        error: 'Todos los campos son requeridos'
      });
    }

    // Verificar si el email ya existe
    const existingUser = await db.collection('Usuarios')
      .where('email', '==', email)
      .get();

    if (!existingUser.empty) {
      return res.status(400).json({
        error: 'El email ya está registrado'
      });
    }

    // Crear nuevo usuario
    const newUser = {
      nombre,
      apellido,
      email,
      password, // En producción, hashear la contraseña
      telefono: telefono || '',
      direccion: direccion || '',
      createdAt: new Date().toISOString()
    };

    const docRef = await db.collection('Usuarios').add(newUser);

    res.status(201).json({
      success: true,
      message: 'Usuario registrado exitosamente',
      userId: docRef.id,
      user: {
        id: docRef.id,
        nombre,
        apellido,
        email,
        telefono,
        direccion
      }
    });
  } catch (error) {
    console.error('Error en registro:', error);
    res.status(500).json({ error: 'Error al registrar el usuario' });
  }
};

// Login de usuario
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validar campos
    if (!email || !password) {
      return res.status(400).json({
        error: 'Email y contraseña son requeridos'
      });
    }

    // Buscar usuario por email
    const snapshot = await db.collection('Usuarios')
      .where('email', '==', email)
      .get();

    if (snapshot.empty) {
      return res.status(404).json({
        error: 'Usuario no encontrado'
      });
    }

    const userDoc = snapshot.docs[0];
    const userData = userDoc.data();

    // Verificar contraseña (en producción, usar bcrypt)
    if (userData.password !== password) {
      return res.status(401).json({
        error: 'Contraseña incorrecta'
      });
    }

    // Login exitoso
    res.json({
      success: true,
      message: 'Login exitoso',
      user: {
        id: userDoc.id,
        nombre: userData.nombre,
        apellido: userData.apellido,
        email: userData.email,
        telefono: userData.telefono,
        direccion: userData.direccion
      }
    });
  } catch (error) {
    console.error('Error en login:', error);
    res.status(500).json({ error: 'Error al iniciar sesión' });
  }
};

// Obtener perfil de usuario
exports.getProfile = async (req, res) => {
  try {
    const { userId } = req.query;

    if (!userId) {
      return res.status(400).json({ error: 'userId es requerido' });
    }

    const doc = await db.collection('Usuarios').doc(userId).get();

    if (!doc.exists) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }

    const userData = doc.data();
    res.json({
      id: doc.id,
      nombre: userData.nombre,
      apellido: userData.apellido,
      email: userData.email,
      telefono: userData.telefono,
      direccion: userData.direccion
    });
  } catch (error) {
    console.error('Error al obtener perfil:', error);
    res.status(500).json({ error: 'Error al obtener el perfil' });
  }
};

// Actualizar perfil de usuario
exports.updateProfile = async (req, res) => {
  try {
    const { userId } = req.query;
    const { nombre, apellido, email, telefono, direccion } = req.body;

    if (!userId) {
      return res.status(400).json({ error: 'userId es requerido' });
    }

    // Verificar si el usuario existe
    const doc = await db.collection('Usuarios').doc(userId).get();
    if (!doc.exists) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }

    // Si se está cambiando el email, verificar que no exista
    if (email && email !== doc.data().email) {
      const existingEmail = await db.collection('Usuarios')
        .where('email', '==', email)
        .get();

      if (!existingEmail.empty) {
        return res.status(400).json({
          error: 'El email ya está en uso'
        });
      }
    }

    // Actualizar usuario
    const updateData = {
      nombre,
      apellido,
      email,
      telefono,
      direccion,
      updatedAt: new Date().toISOString()
    };

    await db.collection('Usuarios').doc(userId).update(updateData);

    res.json({
      success: true,
      message: 'Perfil actualizado exitosamente',
      user: {
        id: userId,
        ...updateData
      }
    });
  } catch (error) {
    console.error('Error al actualizar perfil:', error);
    res.status(500).json({ error: 'Error al actualizar el perfil' });
  }
};

// Exportar funciones existentes
exports.getUsers = async (req, res) => {
  try {
    const snapshot = await db.collection('Usuarios').get();
    const users = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    res.json(users);
  } catch (error) {
    res.status(500).json({ error: 'Error al obtener los usuarios' });
  }
};

exports.getUserById = async (req, res) => {
  const { id } = req.params;
  try {
    const doc = await db.collection('Usuarios').doc(id).get();
    if (!doc.exists) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }
    res.json({ id: doc.id, ...doc.data() });
  } catch (error) {
    res.status(500).json({ error: 'Error al obtener el usuario' });
  }
};

exports.createUser = async (req, res) => {
  try {
    const newUser = req.body;
    const docRef = await db.collection('Usuarios').add(newUser);
    res.status(201).json({ id: docRef.id });
  } catch (error) {
    res.status(500).json({ error: 'Error al crear el usuario' });
  }
};

exports.updateUser = async (req, res) => {
  const { id } = req.params;
  try {
    await db.collection('Usuarios').doc(id).update(req.body);
    res.json({ message: 'Usuario actualizado' });
  } catch (error) {
    res.status(500).json({ error: 'Error al actualizar el usuario' });
  }
};

exports.deleteUser = async (req, res) => {
  const { id } = req.params;
  try {
    await db.collection('Usuarios').doc(id).delete();
    res.json({ message: 'Usuario eliminado' });
  } catch (error) {
    res.status(500).json({ error: 'Error al eliminar el usuario' });
  }
};