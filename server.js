const express = require('express');
const cors = require('cors');
const http = require('http');
const { Server } = require('socket.io');
require('dotenv').config();

const connectDB = require('./config/db');
const TripLocation = require('./models/TripLocation');
const Booking = require('./models/Booking');
const Trip = require('./models/Trip');
const { createNotification } = require('./utils/notificationService');

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
app.use('/api/notifications', require('./routes/notificationRoutes'));

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

      const previousLocation = await TripLocation.findOne({ trip: tripId });

      const shouldSendStartNotification =
        !previousLocation || !previousLocation.start_notification_sent;

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
          start_notification_sent: true,
        },
        {
          new: true,
          upsert: true,
        }
      );

      if (shouldSendStartNotification) {
        const trip = await Trip.findById(tripId);

        await createNotification({
          recipient: driverId,
          title: 'Live tracking active',
          message: trip
            ? `You started live tracking for ${trip.route_from} to ${trip.route_to}.`
            : 'You started live tracking for your trip.',
          type: 'driver_tracking_started',
          data: {
            tripId,
          },
        });

        const bookings = await Booking.find({
          trip: tripId,
          booking_status: { $ne: 'cancelled' },
        });

        await Promise.all(
          bookings.map((booking) =>
            createNotification({
              recipient: booking.passenger,
              title: 'Driver started live tracking',
              message: trip
                ? `Your ride from ${trip.route_from} to ${trip.route_to} is now live. Track it now.`
                : 'Your driver has started live tracking. Track your ride now.',
              type: 'ride_tracking_started',
              data: {
                tripId,
                bookingId: booking._id,
              },
            })
          )
        );
      }

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