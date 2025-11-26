const mongoose = require('mongoose');
const User = require('../../backend/services/user-service/src/models/User');
const Flight = require('../../backend/services/flight-service/src/models/Flight');
const Hotel = require('../../backend/services/hotel-service/src/models/Hotel');
const Car = require('../../backend/services/car-service/src/models/Car');

// Connect to separate databases for each service
const USER_DB_URI = process.env.USER_DB_URI || 'mongodb://localhost:27020/kayak_users';
const FLIGHT_DB_URI = process.env.FLIGHT_DB_URI || 'mongodb://localhost:27020/kayak_flights';
const HOTEL_DB_URI = process.env.HOTEL_DB_URI || 'mongodb://localhost:27020/kayak_hotels';
const CAR_DB_URI = process.env.CAR_DB_URI || 'mongodb://localhost:27020/kayak_cars';

const airports = [
  { code: 'JFK', name: 'John F. Kennedy International', city: 'New York', country: 'USA' },
  { code: 'LAX', name: 'Los Angeles International', city: 'Los Angeles', country: 'USA' },
  { code: 'LHR', name: 'Heathrow Airport', city: 'London', country: 'UK' },
  { code: 'CDG', name: 'Charles de Gaulle', city: 'Paris', country: 'France' },
];

const airlines = ['American Airlines', 'Delta', 'United', 'British Airways'];
const cities = ['New York', 'Los Angeles', 'London', 'Paris'];
const hotelNames = ['Grand Plaza', 'Luxury Suites', 'Ocean View', 'City Center'];
const carCompanies = ['Hertz', 'Avis', 'Enterprise', 'Budget'];

function randomDate(start, end) {
  return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
}

function randomElement(array) {
  return array[Math.floor(Math.random() * array.length)];
}

function randomNumber(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

async function generateUsers(count = 4) {
  console.log(`Generating ${count} users...`);
  const userConn = await mongoose.createConnection(USER_DB_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  });
  const UserModel = userConn.model('User', User.schema);
  
  for (let i = 0; i < count; i++) {
    const userId = Math.floor(100000000 + Math.random() * 900000000).toString();
    const user = new UserModel({
      userId,
      firstName: `User${i + 1}`,
      lastName: `Last${i + 1}`,
      email: `user${i + 1}@example.com`,
      password: 'password123',
      address: `${randomNumber(100, 9999)} Main St`,
      city: randomElement(cities),
      state: 'CA',
      zipCode: randomNumber(10000, 99999).toString(),
      phoneNumber: `555${randomNumber(1000000, 9999999)}`,
    });
    await user.save();
  }
  
  await userConn.close();
  console.log(`✅ Generated ${count} users`);
}

async function generateFlights(count = 4) {
  console.log(`Generating ${count} flights...`);
  const flightConn = await mongoose.createConnection(FLIGHT_DB_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  });
  const FlightModel = flightConn.model('Flight', Flight.schema);
  
  const flights = [];
  const usedFlightIds = new Set();
  
  for (let i = 0; i < count; i++) {
    const from = randomElement(airports);
    const to = randomElement(airports.filter(a => a.code !== from.code));
    const departureDate = randomDate(new Date(), new Date(Date.now() + 90 * 24 * 60 * 60 * 1000));
    const durationHours = randomNumber(2, 12);
    const durationMinutes = randomNumber(0, 59);
    const arrivalDate = new Date(departureDate.getTime() + durationHours * 60 * 60 * 1000 + durationMinutes * 60 * 1000);
    
    let flightId;
    do {
      flightId = `${randomElement(['AA', 'DL', 'UA', 'BA'])}${String(i + 1).padStart(4, '0')}`;
    } while (usedFlightIds.has(flightId));
    usedFlightIds.add(flightId);
    
    flights.push({
      flightId,
      airline: randomElement(airlines),
      departureAirport: from,
      arrivalAirport: to,
      departureDateTime: departureDate,
      arrivalDateTime: arrivalDate,
      duration: { hours: durationHours, minutes: durationMinutes },
      flightClass: randomElement(['Economy', 'Business', 'First']),
      ticketPrice: randomNumber(200, 2000),
      totalAvailableSeats: randomNumber(100, 300),
      availableSeats: randomNumber(10, 200),
      flightRating: {
        average: Number((Math.random() * 2 + 3).toFixed(1)),
        count: randomNumber(10, 500)
      }
    });
  }
  
  await FlightModel.insertMany(flights);
  await flightConn.close();
  console.log(`✅ Generated ${count} flights`);
}

async function generateHotels(count = 4) {
  console.log(`Generating ${count} hotels...`);
  const hotelConn = await mongoose.createConnection(HOTEL_DB_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  });
  const HotelModel = hotelConn.model('Hotel', Hotel.schema);
  
  const hotels = [];
  
  for (let i = 0; i < count; i++) {
    const city = randomElement(cities);
    const totalRooms = randomNumber(20, 100);
    const available = randomNumber(5, totalRooms);
    hotels.push({
      hotelId: `HTL${String(i + 1).padStart(4, '0')}`,
      hotelName: `${randomElement(hotelNames)} ${city}`,
      city,
      address: `${randomNumber(100, 9999)} ${city} Street`,
      state: 'CA',
      zipCode: randomNumber(10000, 99999).toString(),
      country: 'USA',
      starRating: randomNumber(3, 5),
      numberOfRooms: totalRooms,
      availableRooms: available,
      pricePerNight: randomNumber(50, 500),
      amenities: ['WiFi', 'Pool', 'Gym', 'Spa'],
      hotelRating: {
        average: Number((Math.random() * 2 + 3).toFixed(1)),
        count: randomNumber(10, 500)
      }
    });
  }
  
  await HotelModel.insertMany(hotels);
  await hotelConn.close();
  console.log(`✅ Generated ${count} hotels`);
}

async function generateCars(count = 4) {
  console.log(`Generating ${count} cars...`);
  const carConn = await mongoose.createConnection(CAR_DB_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  });
  const CarModel = carConn.model('Car', Car.schema);
  
  const cars = [];
  
  for (let i = 0; i < count; i++) {
    const city = randomElement(cities);
    cars.push({
      carId: `CAR${String(i + 1).padStart(4, '0')}`,
      company: randomElement(carCompanies),
      model: randomElement(['Sedan', 'SUV', 'Convertible', 'Hatchback']),
      carType: randomElement(['SUV', 'Sedan', 'Compact', 'Luxury', 'Convertible', 'Van', 'Truck']),
      year: randomNumber(2020, 2024),
      location: {
        city,
        address: `${randomNumber(100, 9999)} ${city} Avenue`,
        state: 'CA',
        zipCode: randomNumber(10000, 99999).toString()
      },
      dailyRentalPrice: randomNumber(25, 200),
      transmissionType: randomElement(['Automatic', 'Manual']),
      numberOfSeats: randomElement([4, 5, 7]),
      fuelType: randomElement(['Gasoline', 'Electric', 'Hybrid', 'Diesel']),
      availabilityStatus: 'available',
      carRating: {
        average: Number((Math.random() * 2 + 3).toFixed(1)),
        count: randomNumber(10, 500)
      }
    });
  }
  
  await CarModel.insertMany(cars);
  await carConn.close();
  console.log(`✅ Generated ${count} cars`);
}

async function seedMinimal() {
  try {
    console.log('🗑️  Clearing existing data and seeding minimal dataset...\n');

    // Connect to each database to clear existing data
    const userConn = await mongoose.createConnection(USER_DB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    const UserModel = userConn.model('User', User.schema);
    
    const flightConn = await mongoose.createConnection(FLIGHT_DB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    const FlightModel = flightConn.model('Flight', Flight.schema);
    
    const hotelConn = await mongoose.createConnection(HOTEL_DB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    const HotelModel = hotelConn.model('Hotel', Hotel.schema);
    
    const carConn = await mongoose.createConnection(CAR_DB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    const CarModel = carConn.model('Car', Car.schema);

    // Clear existing data
    console.log('Clearing existing data...');
    await UserModel.deleteMany({});
    await FlightModel.deleteMany({});
    await HotelModel.deleteMany({});
    await CarModel.deleteMany({});
    console.log('✅ Cleared existing data\n');

    await userConn.close();
    await flightConn.close();
    await hotelConn.close();
    await carConn.close();

    // Generate minimal data (4 of each)
    await generateUsers(4);
    await generateFlights(4);
    await generateHotels(4);
    await generateCars(4);

    // Reconnect to count records
    const userConn2 = await mongoose.createConnection(USER_DB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    const UserModel2 = userConn2.model('User', User.schema);
    
    const flightConn2 = await mongoose.createConnection(FLIGHT_DB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    const FlightModel2 = flightConn2.model('Flight', Flight.schema);
    
    const hotelConn2 = await mongoose.createConnection(HOTEL_DB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    const HotelModel2 = hotelConn2.model('Hotel', Hotel.schema);
    
    const carConn2 = await mongoose.createConnection(CAR_DB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    const CarModel2 = carConn2.model('Car', Car.schema);

    console.log('\n🎉 Minimal database seeding completed!');
    console.log('Total records:');
    console.log(`- Users: ${await UserModel2.countDocuments()}`);
    console.log(`- Flights: ${await FlightModel2.countDocuments()}`);
    console.log(`- Hotels: ${await HotelModel2.countDocuments()}`);
    console.log(`- Cars: ${await CarModel2.countDocuments()}`);

    await userConn2.close();
    await flightConn2.close();
    await hotelConn2.close();
    await carConn2.close();
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error seeding database:', error);
    process.exit(1);
  }
}

seedMinimal();

