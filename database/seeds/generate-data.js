const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');
[
  path.resolve(__dirname, '../../backend/.env'),
  path.resolve(__dirname, '../../.env')
].forEach((p) => {
  if (fs.existsSync(p)) dotenv.config({ path: p });
});
const User = require('../../backend/services/user-service/src/models/User');
const Flight = require('../../backend/services/flight-service/src/models/Flight');
const Hotel = require('../../backend/services/hotel-service/src/models/Hotel');
const Car = require('../../backend/services/car-service/src/models/Car');

// Generic connection resolver so it works locally or with a shared cluster URI.
// If MONGODB_URI is set (e.g., remote cluster), we reuse it and set dbName per service.
// Otherwise fall back to service-specific env vars or local Mongo on 27020.
const BASE_DB_URI = process.env.MONGODB_URI;
const DEFAULT_LOCAL_HOST = 'mongodb://localhost:27020';

const defaultOptions = { useNewUrlParser: true, useUnifiedTopology: true };
const resolveDbConfig = (dbName, envKey, localPath) => {
  const serviceUri = process.env[envKey];
  if (serviceUri) {
    return { uri: serviceUri, options: defaultOptions };
  }
  if (BASE_DB_URI) {
    return { uri: BASE_DB_URI, options: { ...defaultOptions, dbName } };
  }
  return { uri: `${DEFAULT_LOCAL_HOST}/${localPath}`, options: defaultOptions };
};

const userDb = resolveDbConfig('kayak_users', 'USER_DB_URI', 'kayak_users');
const flightDb = resolveDbConfig('kayak_flights', 'FLIGHT_DB_URI', 'kayak_flights');
const hotelDb = resolveDbConfig('kayak_hotels', 'HOTEL_DB_URI', 'kayak_hotels');
const carDb = resolveDbConfig('kayak_cars', 'CAR_DB_URI', 'kayak_cars');

const airports = [
  { code: 'JFK', name: 'John F. Kennedy International', city: 'New York', country: 'USA' },
  { code: 'LAX', name: 'Los Angeles International', city: 'Los Angeles', country: 'USA' },
  { code: 'LHR', name: 'Heathrow Airport', city: 'London', country: 'UK' },
  { code: 'CDG', name: 'Charles de Gaulle', city: 'Paris', country: 'France' },
  { code: 'DXB', name: 'Dubai International', city: 'Dubai', country: 'UAE' },
  { code: 'NRT', name: 'Narita International', city: 'Tokyo', country: 'Japan' },
  { code: 'SYD', name: 'Sydney Airport', city: 'Sydney', country: 'Australia' },
  { code: 'SFO', name: 'San Francisco International', city: 'San Francisco', country: 'USA' },
];

const airlines = ['American Airlines', 'Delta', 'United', 'British Airways', 'Lufthansa', 'Air France', 'Emirates', 'Qatar Airways'];
const cities = ['New York', 'Los Angeles', 'London', 'Paris', 'Tokyo', 'Dubai', 'Sydney', 'San Francisco', 'Chicago', 'Miami'];
const hotelNames = ['Grand Plaza', 'Luxury Suites', 'Ocean View', 'City Center', 'Royal Hotel', 'Paradise Resort', 'Business Inn', 'Garden Hotel'];
const carCompanies = ['Hertz', 'Avis', 'Enterprise', 'Budget', 'National', 'Alamo'];

function randomDate(start, end) {
  return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
}

function randomElement(array) {
  return array[Math.floor(Math.random() * array.length)];
}

function randomNumber(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

async function generateUsers(count = 1000) {
  console.log(`Generating ${count} users...`);
  // Connect to user database
  const userConn = await mongoose.createConnection(userDb.uri, userDb.options);
  const UserModel = userConn.model('User', User.schema);
  
  // Create users one by one to trigger password hashing middleware
  const batchSize = 100;
  for (let batch = 0; batch < Math.ceil(count / batchSize); batch++) {
    const batchUsers = [];
    const startIdx = batch * batchSize;
    const endIdx = Math.min(startIdx + batchSize, count);
    
    for (let i = startIdx; i < endIdx; i++) {
      const userId = Math.floor(100000000 + Math.random() * 900000000).toString();
      const user = new UserModel({
        userId,
        firstName: `User${i + 1}`,
        lastName: `Last${i + 1}`,
        email: `user${i + 1}@example.com`,
        password: 'password123', // Will be hashed by pre-save hook
        address: `${randomNumber(100, 9999)} Main St`,
        city: randomElement(cities),
        state: 'CA',
        zipCode: randomNumber(10000, 99999).toString(),
        phoneNumber: `555${randomNumber(1000000, 9999999)}`,
      });
      batchUsers.push(user);
    }
    
    // Save each user individually to trigger pre-save hooks (password hashing)
    await Promise.all(batchUsers.map(user => user.save()));
    console.log(`  Saved batch ${batch + 1} (users ${startIdx + 1}-${endIdx})`);
  }
  
  await userConn.close();
  console.log(`✅ Generated ${count} users`);
}

async function generateFlights(count = 2000) {
  console.log(`Generating ${count} flights...`);
  // Connect to flight database
  const flightConn = await mongoose.createConnection(flightDb.uri, flightDb.options);
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
    
    // Generate unique flight ID
    let flightId;
    do {
      flightId = `${randomElement(['AA', 'DL', 'UA', 'BA', 'LH', 'AF', 'EK', 'QR'])}${String(i + 1).padStart(4, '0')}`;
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

async function generateHotels(count = 1500) {
  console.log(`Generating ${count} hotels...`);
  // Connect to hotel database
  const hotelConn = await mongoose.createConnection(hotelDb.uri, hotelDb.options);
  const HotelModel = hotelConn.model('Hotel', Hotel.schema);
  
  const hotels = [];
  
  for (let i = 0; i < count; i++) {
    const city = randomElement(cities);
    hotels.push({
      hotelId: `HTL${String(i + 1).padStart(6, '0')}`,
      hotelName: `${randomElement(hotelNames)} ${city}`,
      address: `${randomNumber(100, 9999)} ${randomElement(['Main', 'Park', 'Broadway', 'Oak', 'Pine'])} St`,
      city,
      state: 'CA',
      zipCode: randomNumber(10000, 99999).toString(),
      starRating: randomNumber(3, 5),
      numberOfRooms: randomNumber(50, 500),
      availableRooms: randomNumber(5, 100),
      roomTypes: [
        { type: 'Single', pricePerNight: randomNumber(80, 200), available: randomNumber(5, 20) },
        { type: 'Double', pricePerNight: randomNumber(120, 300), available: randomNumber(5, 20) },
        { type: 'Suite', pricePerNight: randomNumber(250, 600), available: randomNumber(2, 10) }
      ],
      pricePerNight: randomNumber(80, 600),
      amenities: ['Wi-Fi', 'Breakfast', 'Parking', 'Pool', 'Gym'].slice(0, randomNumber(3, 5)),
      hotelRating: {
        average: Number((Math.random() * 2 + 3).toFixed(1)),
        count: randomNumber(20, 800)
      }
    });
  }
  
  await HotelModel.insertMany(hotels);
  await hotelConn.close();
  console.log(`✅ Generated ${count} hotels`);
}

async function generateCars(count = 1000) {
  console.log(`Generating ${count} cars...`);
  // Connect to car database
  const carConn = await mongoose.createConnection(carDb.uri, carDb.options);
  const CarModel = carConn.model('Car', Car.schema);
  
  const cars = [];
  
  const carTypes = ['SUV', 'Sedan', 'Compact', 'Luxury', 'Convertible'];
  const models = ['Camry', 'Accord', 'Civic', 'Corolla', 'Altima', 'Fusion', 'Malibu', 'Sonata'];
  const brands = ['Toyota', 'Honda', 'Ford', 'Chevrolet', 'Nissan', 'BMW', 'Mercedes', 'Audi'];
  
  for (let i = 0; i < count; i++) {
    const city = randomElement(cities);
    cars.push({
      carId: `CAR${String(i + 1).padStart(6, '0')}`,
      carType: randomElement(carTypes),
      company: randomElement(carCompanies),
      model: randomElement(models),
      year: randomNumber(2020, 2024),
      transmissionType: randomElement(['Automatic', 'Manual']),
      numberOfSeats: randomNumber(4, 8),
      dailyRentalPrice: randomNumber(25, 150),
      carRating: {
        average: Number((Math.random() * 2 + 3).toFixed(1)),
        count: randomNumber(5, 300)
      },
      availabilityStatus: 'available', // Most cars available
      location: {
        city,
        state: 'CA',
        address: `${randomNumber(100, 9999)} Rental St`
      },
      features: ['GPS', 'Bluetooth', 'USB', 'Backup Camera'].slice(0, randomNumber(2, 4))
    });
  }
  
  // Insert in batches to avoid timeout
  const batchSize = 200;
  for (let i = 0; i < cars.length; i += batchSize) {
    const batch = cars.slice(i, i + batchSize);
    await CarModel.insertMany(batch);
    console.log(`  Inserted batch ${Math.floor(i / batchSize) + 1} of ${Math.ceil(cars.length / batchSize)}`);
  }
  await carConn.close();
  console.log(`✅ Generated ${count} cars`);
}

async function seedDatabase() {
  try {
    console.log('🌱 Starting database seeding...\n');

    // Connect to each database to clear existing data
    const userConn = await mongoose.createConnection(userDb.uri, userDb.options);
    const UserModel = userConn.model('User', User.schema);
    
    const flightConn = await mongoose.createConnection(flightDb.uri, flightDb.options);
    const FlightModel = flightConn.model('Flight', Flight.schema);
    
    const hotelConn = await mongoose.createConnection(hotelDb.uri, hotelDb.options);
    const HotelModel = hotelConn.model('Hotel', Hotel.schema);
    
    const carConn = await mongoose.createConnection(carDb.uri, carDb.options);
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

    // Generate data (each function connects to its own database)
    await generateUsers(1000);
    await generateFlights(2000);
    await generateHotels(1500);
    await generateCars(1000);

    // Reconnect to count records
    const userConn2 = await mongoose.createConnection(userDb.uri, userDb.options);
    const UserModel2 = userConn2.model('User', User.schema);
    
    const flightConn2 = await mongoose.createConnection(flightDb.uri, flightDb.options);
    const FlightModel2 = flightConn2.model('Flight', Flight.schema);
    
    const hotelConn2 = await mongoose.createConnection(hotelDb.uri, hotelDb.options);
    const HotelModel2 = hotelConn2.model('Hotel', Hotel.schema);
    
    const carConn2 = await mongoose.createConnection(carDb.uri, carDb.options);
    const CarModel2 = carConn2.model('Car', Car.schema);

    console.log('\n🎉 Database seeding completed!');
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

seedDatabase();
