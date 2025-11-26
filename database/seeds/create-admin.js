const mongoose = require('mongoose');
const Admin = require('../../backend/services/admin-service/src/models/Admin');

const MONGODB_URI = process.env.ADMIN_DB_URI || 'mongodb://localhost:27020/kayak_admin';

async function createAdmin() {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('✅ Connected to MongoDB\n');

    // Check if admin already exists
    const existingAdmin = await Admin.findOne({ email: 'admin@kayak.com' });
    if (existingAdmin) {
      console.log('❌ Admin already exists with email: admin@kayak.com');
      await mongoose.connection.close();
      process.exit(0);
    }

    // Create default admin
    const admin = new Admin({
      adminId: 'ADMIN001',
      firstName: 'Admin',
      lastName: 'User',
      email: 'admin@kayak.com',
      password: 'admin123', // Will be hashed by pre-save hook
      address: '123 Admin Street',
      city: 'San Francisco',
      state: 'CA',
      zipCode: '94102',
      phoneNumber: '5550100',
      role: 'super_admin',
      accessLevel: 'full',
    });

    await admin.save();
    console.log('✅ Default admin created successfully!');
    console.log('\nAdmin Credentials:');
    console.log('  Email: admin@kayak.com');
    console.log('  Password: admin123');
    console.log('\n⚠️  Please change the password after first login!\n');

    await mongoose.connection.close();
    process.exit(0);
  } catch (error) {
    console.error('❌ Error creating admin:', error.message);
    process.exit(1);
  }
}

createAdmin();

