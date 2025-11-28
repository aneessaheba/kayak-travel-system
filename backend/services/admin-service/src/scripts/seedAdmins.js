const bcrypt = require('bcryptjs');
const { MongoClient } = require('mongodb');
require('dotenv').config();

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017';
const ADMIN_DB = process.env.MONGO_ADMIN_DB || 'kayak_admin';

// Sample admin users to create
const sampleAdmins = [
  // 1. Kayak Super Admin
  {
    adminId: 'KADM001',
    email: 'admin@kayak.com',
    password: 'kayak123', // Will be hashed
    firstName: 'Sarah',
    lastName: 'Johnson',
    role: 'kayak_admin',
    providerType: null,
    providerName: null,
    phoneNumber: '+1-555-0001',
    profileImage: null,
    isActive: true
  },

  // 2. British Airways Provider Admin
  {
    adminId: 'PADM001',
    email: 'admin@britishairways.com',
    password: 'british123',
    firstName: 'David',
    lastName: 'Smith',
    role: 'provider_admin',
    providerType: 'flight',
    providerName: 'British Airways', // Must match flights.airline
    phoneNumber: '+1-555-0002',
    profileImage: null,
    isActive: true
  },

  // 3. Mahesh Babu Hotel Provider Admin
  {
    adminId: 'PADM002',
    email: 'owner@maheshbabu.com',
    password: 'mahesh123',
    firstName: 'Mahesh',
    lastName: 'Babu',
    role: 'provider_admin',
    providerType: 'hotel',
    providerName: 'Mahesh Babu', // Must match hotels.hotelName
    phoneNumber: '+1-555-0003',
    profileImage: null,
    isActive: true
  },

  // 4. Honda Car Rental Provider Admin
  {
    adminId: 'PADM003',
    email: 'admin@honda.com',
    password: 'honda123',
    firstName: 'Honda',
    lastName: 'Admin',
    role: 'provider_admin',
    providerType: 'car',
    providerName: 'Honda', // Must match cars.company
    phoneNumber: '+1-555-0004',
    profileImage: null,
    isActive: true
  }
];

async function seedAdmins() {
  let client;

  try {
    console.log('🌱 Starting admin seed process...\n');

    // Connect to MongoDB
    client = new MongoClient(MONGO_URI);
    await client.connect();
    console.log('✅ Connected to MongoDB\n');

    const db = client.db(ADMIN_DB);
    const adminsCollection = db.collection('admins');

    // Create indexes
    console.log('📑 Creating indexes...');
    await adminsCollection.createIndex({ email: 1 }, { unique: true });
    await adminsCollection.createIndex({ adminId: 1 }, { unique: true });
    await adminsCollection.createIndex({ role: 1 });
    await adminsCollection.createIndex({ providerType: 1, providerName: 1 });
    console.log('✅ Indexes created\n');

    // Hash passwords and insert admins
    console.log('👥 Creating admin users...\n');
    
    for (const admin of sampleAdmins) {
      try {
        // Check if admin already exists
        const existingAdmin = await adminsCollection.findOne({ email: admin.email });
        
        if (existingAdmin) {
          console.log(`⚠️  Admin ${admin.email} already exists. Skipping...`);
          continue;
        }

        // Hash password
        const hashedPassword = await bcrypt.hash(admin.password, 10);

        // Prepare admin document
        const adminDoc = {
          ...admin,
          password: hashedPassword,
          createdAt: new Date(),
          updatedAt: new Date(),
          lastLogin: null
        };

        // Insert admin
        await adminsCollection.insertOne(adminDoc);
        
        console.log(`✅ Created ${admin.role}: ${admin.email}`);
        console.log(`   Name: ${admin.firstName} ${admin.lastName}`);
        if (admin.providerType) {
          console.log(`   Provider: ${admin.providerName} (${admin.providerType})`);
        }
        console.log(`   Password: ${admin.password} (for testing)\n`);

      } catch (error) {
        console.error(`❌ Error creating admin ${admin.email}:`, error.message);
      }
    }

    console.log('\n🎉 Admin seed process completed!\n');
    console.log('📝 Login Credentials Summary:');
    console.log('═'.repeat(60));
    sampleAdmins.forEach(admin => {
      console.log(`${admin.role.toUpperCase()}`);
      console.log(`  Email: ${admin.email}`);
      console.log(`  Password: ${admin.password}`);
      if (admin.providerName) {
        console.log(`  Provider: ${admin.providerName}`);
      }
      console.log('─'.repeat(60));
    });

  } catch (error) {
    console.error('❌ Seed process failed:', error);
  } finally {
    if (client) {
      await client.close();
      console.log('\n✅ MongoDB connection closed');
    }
  }
}

// Run seed function
seedAdmins();