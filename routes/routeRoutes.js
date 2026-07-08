const express = require("express");
const router = express.Router();
const SearchHistory = require("../models/SearchHistory");
const Trip = require("../models/Trip");
const {
  protect,
  optionalProtect,
} = require("../middleware/authMiddleware");

const {
  searchRoutes,
} = require("../controllers/routeController");

router.get(
  "/search",
  optionalProtect,
  searchRoutes
);
router.post(
  "/recent",
  protect,
  async (req, res) => {
    try {
      const {
        origin,
        destination,
      } = req.body;

      await SearchHistory.deleteMany({
        user: req.user._id,
        origin,
        destination,
      });

      await SearchHistory.create({
        user: req.user._id,
        origin,
        destination,
      });

      res.json({
        success: true,
      });
    } catch (err) {
      res.status(500).json({
        message: err.message,
      });
    }
  }
);
router.get(
  "/home",
  optionalProtect,
  async (req, res) => {
  try {
    let recent = [];

if (req.user) {
  const recentSearches = await SearchHistory.find({
    user: req.user._id,
  })
    .sort({ createdAt: -1 })
    .limit(5);

  const now = new Date();

  for (const item of recentSearches) {
    const exists = await Trip.exists({
      route_from: item.origin,
      route_to: item.destination,
      departure_time: {
        $gt: now,
      },
    });

    if (exists) {
      recent.push(item);
    }
  }
}

    // Popular routes for everyone
    const popular = await SearchHistory.aggregate([
      {
        $group: {
          _id: {
            origin: "$origin",
            destination: "$destination",
          },
          total: {
            $sum: 1,
          },
        },
      },
      {
        $sort: {
          total: -1,
        },
      },
      {
        $limit: 8,
      },
    ]);

    const now = new Date();

const availablePopular = [];

for (const route of popular) {
  const exists = await Trip.exists({
    route_from: route._id.origin,
    route_to: route._id.destination,
    departure_time: {
      $gt: now,
    },
  });

  if (exists) {
    availablePopular.push({
      _id: `${route._id.origin}-${route._id.destination}`,
      origin: route._id.origin,
      destination: route._id.destination,
      total: route.total,
    });
  }
}

res.json({
  recent,
  popular: availablePopular,
});
  } catch (err) {
    res.status(500).json({
      message: err.message,
    });
  }
});
module.exports = router;