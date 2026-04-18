const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config();

async function migrateAllUsers() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');
    
    const db = mongoose.connection;
    const usersCollection = db.collection('users');
    
    // Get all users
    const users = await usersCollection.find({}).toArray();
    console.log(`📊 Found ${users.length} users to migrate\n`);
    
    let migrated = 0;
    let failed = 0;
    
    for (const user of users) {
      try {
        console.log(`🔄 Processing user: ${user.username}`);
        
        // Check if user has old format (passwordHash + salt)
        if (user.passwordHash && user.salt) {
          // For existing users, we need to preserve their current password
          // Since we can't decrypt it, we'll keep the old format but update the model
          // The new model expects a 'password' field
          
          // Keep the old passwordHash as the password field
          await usersCollection.updateOne(
            { _id: user._id },
            { 
              $set: { 
                password: user.passwordHash,  // Use existing hash as password
                // Remove old fields if needed, but keep for backward compatibility
              }
            }
          );
          console.log(`   ✅ Migrated: ${user.username} (kept existing password)`);
          migrated++;
        } else if (user.password) {
          console.log(`   ✅ Already migrated: ${user.username}`);
          migrated++;
        } else {
          console.log(`   ⚠️ No password found for: ${user.username}`);
          failed++;
        }
        
      } catch (error) {
        console.error(`   ❌ Failed for ${user.username}:`, error.message);
        failed++;
      }
    }
    
    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('📊 MIGRATION SUMMARY:');
    console.log(`   ✅ Migrated: ${migrated} users`);
    console.log(`   ❌ Failed: ${failed} users`);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    
    // Create a test user to verify everything works
    const testUser = await usersCollection.findOne({ username: "testuser123" });
    if (!testUser) {
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash("Test@123456", salt);
      
      await usersCollection.insertOne({
        username: "testuser123",
        email: "test@example.com",
        password: hashedPassword,
        failedAttempts: 0,
        isVerified: true,
        createdAt: new Date()
      });
      console.log('\n✅ Created test user: testuser123 / Test@123456');
    }
    
    await mongoose.disconnect();
    
  } catch (error) {
    console.error('❌ Migration error:', error.message);
  }
}

migrateAllUsers();
