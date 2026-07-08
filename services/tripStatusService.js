const Trip = require("../models/Trip");

const BOARDING_MINUTES =
  Number(process.env.BOARDING_MINUTES) || 15;

const ARRIVING_MINUTES =
  Number(process.env.ARRIVING_MINUTES) || 10;

const DEFAULT_TRIP_DURATION =
  Number(process.env.DEFAULT_TRIP_DURATION) || 60;

exports.updateTripStatuses = async () => {
  try {

    const now = new Date();

    const trips = await Trip.find({
      trip_status: {
        $in: [
          "scheduled",
          "boarding",
          "on_route",
          "arriving",
        ],
      },
    });

    for (const trip of trips) {

      const departure =
        new Date(trip.departure_time);

      const diff =
        departure.getTime() -
        now.getTime();

      // Boarding

      if (
        diff <= BOARDING_MINUTES * 60000 &&
        diff > 0 &&
        trip.trip_status === "scheduled"
      ) {

        trip.trip_status = "boarding";

        await trip.save();

      }

      // On Route

      if (
        diff <= 0 &&
        trip.trip_status === "boarding"
      ) {

        trip.trip_status = "on_route";

        await trip.save();

      }

      // Minutes since departure

      const minutesSinceDeparture =
        Math.floor(
          (now - departure) /
          60000
        );

      // Arriving

      if (
        trip.trip_status === "on_route" &&
        minutesSinceDeparture >=
        DEFAULT_TRIP_DURATION -
        ARRIVING_MINUTES
      ) {

        trip.trip_status = "arriving";

        await trip.save();

      }

      // Completed

      if (
        trip.trip_status === "arriving" &&
        minutesSinceDeparture >=
        DEFAULT_TRIP_DURATION
      ) {

        trip.trip_status = "completed";

        await trip.save();

      }

    }

  } catch (err) {

    console.log(err.message);

  }
};