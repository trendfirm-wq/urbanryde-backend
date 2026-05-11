const express = require('express');
const cors = require('cors');
const http = require('http');
const { Server } = require('socket.io');
require('dotenv').config();

const connectDB = require('./config/db');
const TripLocation = require('./models/TripLocation');

const app = express();

connectDB();

app.use(cors());
app.use(express.json());

app.get('/', (req, res) => {
  res.send('UrbanRyde API is running');
});

app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/vehicles', require('./routes/vehicleRoutes'));
app.use('/api/trips', require('./routes/tripRoutes'));
app.use('/api/bookings', require('./routes/bookingRoutes'));
app.use('/api/chats', require('./routes/chatRoutes'));
app.use('/api/tracking', require('./routes/trackingRoutes'));

const PORT = process.env.PORT || 5000;

const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST'],
  },
});

io.on('connection', (socket) => {
  console.log('Socket connected:', socket.id);

  socket.on('joinTripTracking', ({ tripId }) => {
    if (!tripId) return;

    socket.join(`trip_${tripId}`);
    console.log(`Socket ${socket.id} joined trip_${tripId}`);
  });

  socket.on('driverLocationUpdate', async (data) => {
    try {
      const { tripId, driverId, latitude, longitude, heading, speed } = data;

      if (!tripId || !driverId || latitude == null || longitude == null) {
        return;
      }

      const location = await TripLocation.findOneAndUpdate(
        { trip: tripId },
        {
          trip: tripId,
          driver: driverId,
          latitude,
          longitude,
          heading: heading || 0,
          speed: speed || 0,
          is_tracking: true,
        },
        {
          new: true,
          upsert: true,
        }
      );

      io.to(`trip_${tripId}`).emit('tripLocationUpdated', {
        tripId,
        location,
      });
    } catch (error) {
      console.log('Driver location update error:', error.message);
    }
  });

  socket.on('leaveTripTracking', ({ tripId }) => {
    if (!tripId) return;

    socket.leave(`trip_${tripId}`);
    console.log(`Socket ${socket.id} left trip_${tripId}`);
  });

  socket.on('disconnect', () => {
    console.log('Socket disconnected:', socket.id);
  });
});

server.listen(PORT, () => {
  console.log(`UrbanRyde server running on port ${PORT}`);
});