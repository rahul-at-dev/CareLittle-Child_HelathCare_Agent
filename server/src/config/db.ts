import mongoose from 'mongoose';
import dns from 'dns';

// Fix for Windows DNS resolution issues with MongoDB Atlas SRV records
try {
  dns.setServers(['8.8.8.8', '1.1.1.1', '8.8.4.4']);
  dns.setDefaultResultOrder?.('ipv4first');
  console.log('[DB DNS] Configured custom DNS resolvers (8.8.8.8 / 1.1.1.1) for Atlas SRV lookup');
} catch (dnsErr: any) {
  console.warn('[DB DNS Warning] Could not set custom DNS servers:', dnsErr.message);
}

export const connectDB = async (): Promise<boolean> => {
  try {
    const mongoURI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/carelittle_db';
    console.log(`[DB] Attempting connection to MongoDB Atlas...`);
    
    await mongoose.connect(mongoURI, {
      serverSelectionTimeoutMS: 15000,
      connectTimeoutMS: 15000,
    });
    
    console.log(`[DB] Successfully connected to MongoDB Atlas at host: ${mongoose.connection.host}, Database: ${mongoose.connection.name}`);
    return true;
  } catch (error: any) {
    console.error(`[DB Error] Connection failed: ${error.message}`);
    if (error.message.includes('ENOTFOUND') || error.message.includes('querySrv')) {
      console.error(`[DB Error Diagnostic] DNS SRV Lookup issue detected. Check internet connectivity or firewall rules.`);
    }
    return false;
  }
};
