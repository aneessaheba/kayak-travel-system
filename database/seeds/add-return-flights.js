const mongoose = require('mongoose');
const Flight = require('../../backend/services/flight-service/src/models/Flight');

const FLIGHT_DB_URI = process.env.FLIGHT_DB_URI || 'mongodb://localhost:27020/kayak_flights';

async function addReturnFlights() {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(FLIGHT_DB_URI, { useNewUrlParser: true, useUnifiedTopology: true });
    console.log('✅ Connected to MongoDB\n');

    const FlightModel = mongoose.model('Flight', Flight.schema);
    
    // Get all flights without return flight fields
    const flights = await FlightModel.find({
      $or: [
        { returnFlightId: { $exists: false } },
        { returnFlightId: null },
        { returnFlightId: '' }
      ]
    });

    console.log(`Found ${flights.length} flights without return flight fields\n`);

    for (const flight of flights) {
      // Skip if already has return flight
      if (flight.returnFlightId) {
        console.log(`Skipping ${flight.flightId} - already has return flight`);
        continue;
      }

      // Calculate return flight details
      const outboundArrival = new Date(flight.arrivalDateTime);
      const returnDeparture = new Date(outboundArrival);
      returnDeparture.setDate(returnDeparture.getDate() + 3); // Return 3 days after arrival
      returnDeparture.setHours(returnDeparture.getHours() + 2); // Add 2 hours for buffer

      // Calculate return arrival (similar duration to outbound)
      const outboundDurationMs = new Date(flight.arrivalDateTime) - new Date(flight.departureDateTime);
      const returnArrival = new Date(returnDeparture);
      returnArrival.setTime(returnArrival.getTime() + outboundDurationMs);

      // Calculate return duration in hours
      const returnDurationHours = outboundDurationMs / (1000 * 60 * 60);

      // Generate return flight ID
      const returnFlightId = `${flight.flightId}-RET`;

      // Set return flight fields
      flight.returnFlightId = returnFlightId;
      flight.returnDepartureDateTime = returnDeparture;
      flight.returnArrivalDateTime = returnArrival;
      flight.returnDuration = {
        hours: Math.round(returnDurationHours * 10) / 10,
        minutes: 0
      };
      flight.returnTicketPrice = Math.round(flight.ticketPrice * 0.9); // 10% discount on return
      flight.returnFlightClass = flight.flightClass;
      flight.returnTotalAvailableSeats = flight.totalAvailableSeats;
      flight.returnAvailableSeats = Math.min(flight.availableSeats, Math.floor(flight.totalAvailableSeats * 0.8)); // 80% of total or available, whichever is less

      // Save the flight
      await flight.save();

      const from = flight.departureAirport?.city || flight.departureAirport?.code || 'N/A';
      const to = flight.arrivalAirport?.city || flight.arrivalAirport?.code || 'N/A';
      console.log(`✅ Updated ${flight.flightId}: ${from} → ${to}`);
      console.log(`   Return: ${to} → ${from} on ${returnDeparture.toLocaleDateString()}`);
      console.log(`   Return Flight ID: ${returnFlightId}`);
      console.log(`   Return Price: $${flight.returnTicketPrice}\n`);
    }

    console.log(`\n🎉 Successfully updated ${flights.length} flights with return flight fields!`);

    // Verify all flights now have return fields
    const allFlights = await FlightModel.find({});
    const flightsWithReturn = allFlights.filter(f => f.returnFlightId);
    console.log(`\nVerification: ${flightsWithReturn.length}/${allFlights.length} flights have return flight fields`);

    await mongoose.connection.close();
    process.exit(0);
  } catch (error) {
    console.error('❌ Error adding return flights:', error);
    process.exit(1);
  }
}

addReturnFlights();

