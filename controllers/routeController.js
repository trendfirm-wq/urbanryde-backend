const Trip = require("../models/Trip");

exports.searchRoutes = async (req, res) => {
  try {
    const q = req.query.q?.trim();

    if (!q) {
      return res.json({
        success: true,
        routes: [],
      });
    }

    const now = new Date();

const trips = await Trip.find({
  departure_time: {
    $gt: now,
  },
  $or: [
    {
      route_from: {
        $regex: q,
        $options: "i",
      },
    },
    {
      route_to: {
        $regex: q,
        $options: "i",
      },
    },
  ],
}).select("route_from route_to departure_time");

    const routes = [];

    trips.forEach((trip) => {
      routes.push({
        _id: `${trip.route_from}-${trip.route_to}`,
        origin: trip.route_from,
        destination: trip.route_to,
      });
    });

    const unique = routes.filter(
      (route, index, self) =>
        index ===
        self.findIndex(
          (r) =>
            r.origin === route.origin &&
            r.destination === route.destination
        )
    );
console.log("Search:", q);
console.log("Trips:", trips);
console.log("Routes:", unique);
    res.json({
      success: true,
      routes: unique,
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};