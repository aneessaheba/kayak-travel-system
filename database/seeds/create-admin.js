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
const Admin = require('../../backend/services/admin-service/src/models/Admin');

const MONGODB_URI = process.env.ADMIN_DB_URI || 'mongodb://localhost:27020/kayak_admin';

async function createAdmin() {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('Connected to MongoDB\n');

    const existingAdmin = await Admin.findOne({ email: 'admin@kayak.com' });
    if (existingAdmin) {
      console.log('Admin already exists with email: admin@kayak.com');
      await mongoose.connection.close();
      process.exit(0);
    }

    const admin = new Admin({
      adminId: 'ADMIN001',
      firstName: 'Admin',
      lastName: 'User',
      email: 'admin@kayak.com',
      password: 'admin123',
      address: '123 Admin Street',
      city: 'San Francisco',
      state: 'CA',
      zipCode: '94102',
      phoneNumber: '5550100',
      role: 'super_admin',
      accessLevel: 'full',
    });

    await admin.save();
    console.log('Default admin created successfully!');
    console.log('\nAdmin Credentials:');
    console.log('Email: admin@kayak.com');
    console.log('Password: admin123');
    console.log('\nPlease change the password after first login!\n');

    await mongoose.connection.close();
    process.exit(0);
  } catch (error) {
    console.error('Error creating admin:', error.message);
    process.exit(1);
  }
}

createAdmin();
