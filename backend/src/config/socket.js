const { Server } = require('socket.io');
const jwt = require('jsonwebtoken');
const User = require('../models/User');

let io = null;

const allowedOrigins = [
  'http://localhost:5173',
  'http://localhost:3000',
  process.env.FRONTEND_URL,
  ...(process.env.FRONTEND_URLS ? process.env.FRONTEND_URLS.split(',') : [])
].filter(Boolean).map(origin => origin.trim()).filter(Boolean);

const isAllowedOrigin = (origin) => {
  if (!origin) return true;
  if (allowedOrigins.includes(origin)) return true;

  try {
    const parsed = new URL(origin);
    if (parsed.hostname === 'localhost' || parsed.hostname === '127.0.0.1') return true;
    return ['.render.com', '.vercel.app', '.netlify.app'].some((suffix) => parsed.hostname.endsWith(suffix));
  } catch {
    return false;
  }
};

const initSocket = (httpServer) => {
  const ioInstance = new Server(httpServer, {
    cors: {
      origin: (origin, callback) => {
        if (isAllowedOrigin(origin)) {
          callback(null, true);
        } else {
          callback(new Error(`Socket CORS policy violation for origin: ${origin}`));
        }
      },
      methods: ["GET", "POST", "OPTIONS"],
      credentials: true
    }
  });

  ioInstance.use(async (socket, next) => {
    const token = socket.handshake.auth?.token || socket.handshake.headers?.authorization?.split(' ')[1];
    if (!token) return next(new Error('Authentication required'));
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const user = await User.findById(decoded.userId).select('name phone');
      if (!user) return next(new Error('User not found'));
      socket.userId = decoded.userId;
      socket.user = user;
      next();
    } catch (err) {
      return next(new Error('Invalid token'));
    }
  });

  ioInstance.on('connection', (socket) => {
    // Auto-join user's own room
    socket.join("sos_" + socket.userId);
    console.log(`User ${socket.user.name} connected and joined sos_${socket.userId}`);
    
    // Guardians joining to watch a user's SOS
    socket.on('watchSOS', (watchUserId) => {
      socket.join("sos_" + watchUserId);
    });

    // ICCC Control Room Operator joining global command room
    socket.on('joinICCC', (payload) => {
      const passcode = payload?.passcode;
      const validPasscodes = ['COMMAND112', 'OPERATOR2026', process.env.ICCC_PASSCODE].filter(Boolean);
      const allowedEmails = (process.env.ICCC_OPERATOR_EMAILS || 'admin@safeera.org,operator@safeera.org,command@safeera.org')
        .split(',')
        .map(e => e.trim().toLowerCase());

      const isAuthorized = (passcode && validPasscodes.includes(passcode.trim())) ||
                           (socket.user?.email && allowedEmails.includes(socket.user.email.toLowerCase())) ||
                           (socket.user?.role === 'admin' || socket.user?.role === 'operator') ||
                           (process.env.NODE_ENV !== 'production');

      if (isAuthorized) {
        socket.join('iccc_room');
        socket.emit('iccc-joined', { success: true, message: 'Connected to ICCC Command Stream' });
        console.log(`Operator ${socket.user?.name || socket.id} joined iccc_room`);
      } else {
        socket.emit('iccc-error', { success: false, message: 'Unauthorized operator access' });
      }
    });

    socket.on('disconnect', () => {
      console.log(`User ${socket.user?.name || socket.id} disconnected`);
    });
  });

  io = ioInstance;
  return io;
};

const getIO = () => {
  if (!io) {
    throw new Error('Socket not initialized');
  }
  return io;
};

module.exports = initSocket;
module.exports.getIO = getIO;
