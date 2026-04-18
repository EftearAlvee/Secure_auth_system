const mongoose = require('mongoose');
require('dotenv').config();

async function cleanDatabase() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');
    
    const db = mongoose.connection;
    
    // Drop all collections
    const collections = await db.db.collections();
    for (let collection of collections) {
      await collection.drop();
      console.log(`🗑️ Dropped collection: ${collection.collectionName}`);
    }
    
    console.log('\n✅ Database cleaned successfully!');
    console.log('📝 All users removed. Please register again.');
    
    await mongoose.disconnect();
    
  } catch (error) {
    console.error('Error:', error.message);
  }
}

cleanDatabase();
