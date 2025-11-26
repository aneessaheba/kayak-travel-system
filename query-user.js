const mongoose = require('mongoose');
const User = require('./backend/services/user-service/src/models/User');

const MONGODB_URI = 'mongodb://localhost:27020/kayak_users';

async function findUser() {
  try {
    await mongoose.connect(MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    
    console.log('Connected to MongoDB');
    
    // Search for user with 'abcd' in name or email
    const users = await User.find({
      $or: [
        { firstName: /abcd/i },
        { lastName: /abcd/i },
        { email: /abcd/i }
      ]
    }).select('firstName lastName email userId createdAt');
    
    if (users.length > 0) {
      console.log(`\nâœ… Found ${users.length} user(s):\n`);
      users.forEach(user => {
        console.log(`Name: ${user.firstName} ${user.lastName}`);
        console.log(`Email: ${user.email}`);
        console.log(`User ID: ${user.userId}`);
        console.log(`Created: ${user.createdAt}`);
        console.log('---');
      });
    } else {
      console.log('\nâŒ No users found with "abcd" in name or email');
    }
    
    await mongoose.connection.close();
  } catch (error) {
    console.error('Error:', error.message);
  }
}

findUser();
