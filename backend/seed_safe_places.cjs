const mongoose = require('mongoose');

const uri = "mongodb+srv://hegdeashik13_db_user:PNDSqP5OA7kF1JTK@cluster0.2131umc.mongodb.net/?appName=Cluster0";

const SafePlaceSchema = new mongoose.Schema({
  name: { type: String, required: true },
  type: { type: String, enum: ['police', 'hospital', 'safe_zone'], required: true },
  location: {
    type: { type: String, enum: ['Point'], default: 'Point' },
    coordinates: { type: [Number], required: true } // [lng, lat]
  },
  address: String,
  phone: String,
  rating: { type: Number, default: 4.8 },
  verified: { type: Boolean, default: true }
});

SafePlaceSchema.index({ location: '2dsphere' });

const SafePlace = mongoose.models.SafePlace || mongoose.model('SafePlace', SafePlaceSchema);

async function seed() {
  await mongoose.connect(uri);
  console.log("Connected to MongoDB for safe places seeding...");

  await SafePlace.deleteMany({});

  const places = [
    // Pune
    { name: "Shivajinagar Police Station", type: "police", location: { type: "Point", coordinates: [73.8520, 18.5308] }, address: "Shivajinagar, Pune", phone: "020-25531234", rating: 4.8 },
    { name: "KEM Emergency Hospital & Trauma", type: "hospital", location: { type: "Point", coordinates: [73.8710, 18.5200] }, address: "Rasta Peth, Pune", phone: "020-66037300", rating: 4.7 },
    { name: "Deccan Gymkhana Women Safety Hub", type: "safe_zone", location: { type: "Point", coordinates: [73.8410, 18.5167] }, address: "FC Road, Deccan, Pune", phone: "112", rating: 4.9 },
    { name: "Ruby Hall Clinic 24/7 Emergency", type: "hospital", location: { type: "Point", coordinates: [73.8780, 18.5320] }, address: "Sassoon Road, Pune", phone: "020-66455100", rating: 4.9 },
    { name: "Swargate Police Station & Women Cell", type: "police", location: { type: "Point", coordinates: [73.8580, 18.5010] }, address: "Swargate, Pune", phone: "020-24440100", rating: 4.6 },
    { name: "Pune Station 24/7 Safe Transit Hub", type: "safe_zone", location: { type: "Point", coordinates: [73.8740, 18.5280] }, address: "Pune Railway Station", phone: "139", rating: 4.8 },

    // Mumbai
    { name: "Bandra Police Station", type: "police", location: { type: "Point", coordinates: [72.8360, 19.0596] }, address: "Hill Road, Bandra West, Mumbai", phone: "022-26422201", rating: 4.9 },
    { name: "Lilavati Hospital & Research Centre", type: "hospital", location: { type: "Point", coordinates: [72.8286, 19.0514] }, address: "Bandra Reclamation, Mumbai", phone: "022-26751000", rating: 4.8 },
    { name: "BKC Women Safety Haven", type: "safe_zone", location: { type: "Point", coordinates: [72.8680, 19.0657] }, address: "Bandra Kurla Complex, Mumbai", phone: "112", rating: 4.9 },
    { name: "Marine Drive Police Station", type: "police", location: { type: "Point", coordinates: [72.8238, 18.9438] }, address: "Marine Drive, Churchgate, Mumbai", phone: "022-22812234", rating: 4.8 },

    // Delhi
    { name: "Connaught Place Police Station", type: "police", location: { type: "Point", coordinates: [77.2197, 28.6327] }, address: "Connaught Place, New Delhi", phone: "011-23340000", rating: 4.8 },
    { name: "Dr. Ram Manohar Lohia Hospital", type: "hospital", location: { type: "Point", coordinates: [77.1997, 28.6344] }, address: "Baba Kharak Singh Marg, New Delhi", phone: "011-23365525", rating: 4.7 },
    { name: "India Gate 24/7 Monitored Safe Zone", type: "safe_zone", location: { type: "Point", coordinates: [77.2295, 28.6129] }, address: "Rajpath, New Delhi", phone: "112", rating: 4.9 }
  ];

  await SafePlace.insertMany(places);
  console.log(`Successfully seeded ${places.length} verified safe places across Pune, Mumbai, and Delhi!`);
  process.exit(0);
}

seed().catch(err => {
  console.error("Seeding error:", err);
  process.exit(1);
});
