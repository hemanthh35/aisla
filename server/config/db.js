// MongoDB connection configuration
const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    console.log('\n🔄 Attempting to connect to MongoDB Atlas...');
    
    if (!process.env.MONGO_URI) {
      throw new Error('MONGO_URI is not defined in .env file');
    }
    
    const conn = await mongoose.connect(process.env.MONGO_URI);
    
    console.log(`✅ MongoDB Connected Successfully!`);
    console.log(`📍 Host: ${conn.connection.host}`);
    console.log(`📂 Database: ${conn.connection.name || 'default'}\n`);
  } catch (error) {
    console.error(`\n❌ MongoDB Connection Failed!`);
    console.error(`📛 Error: ${error.message}`);
    
    if (error.message.includes('bad auth')) {
      console.error('\n💡 SOLUTION:');
      console.error('   1. Go to MongoDB Atlas → Database Access');
      console.error('   2. Verify username and password are correct');
      console.error('   3. Reset password if needed (use simple password: letters & numbers only)');
      console.error('   4. Make sure user has "Read and write to any database" permission');
      console.error('   5. Update .env file with correct credentials\n');
    } else if (error.message.includes('ENOTFOUND')) {
      console.error('\n💡 SOLUTION: Check your internet connection\n');
    }
    
    // Don't exit process, let server run without DB for now
    console.log('⚠️  Server will continue running without database connection');
    console.log('⚠️  Authentication features will not work until DB is connected\n');
  }
};

module.exports = connectDB;
