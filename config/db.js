import mongoose from 'mongoose';

export async function connectDB() {
  const uri = process.env.MONGO_URI;
  if (!uri) {
    console.error('✗ MONGO_URI missing in .env');
    process.exit(1);
  }
  try {
    await mongoose.connect(uri);
    console.log('✓ MongoDB Atlas connected');
  } catch (err) {
    console.error('✗ MongoDB connection failed:', err.message);
    process.exit(1);
  }
}
