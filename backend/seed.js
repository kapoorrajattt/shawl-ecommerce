require("dotenv").config();
const mongoose = require("mongoose");
const User = require("./models/User");
const Product = require("./models/Product");

const products = [
  {
    name: "Kullu Heritage Shawl",
    price: 2499,
    description:
      "Handwoven traditional Kullu shawl with iconic geometric patterns. Pure Himachali wool, perfect for chilly mountain evenings.",
    category: "shawl",
    stock: 15,
    featured: true,
    images: [],
  },
  {
    name: "Kinnauri Silk Stole",
    price: 1799,
    description:
      "Lightweight silk stole with fine Kinnauri embroidery. Elegant drape, rich colours. A timeless Himalayan accessory.",
    category: "stole",
    stock: 20,
    featured: true,
    images: [],
  },
  {
    name: "Pashmina Wool Blanket",
    price: 4999,
    description:
      "Premium pashmina-blend blanket. Ultra-soft, warm, and durable. Handcrafted by artisans in the Kullu valley.",
    category: "blanket",
    stock: 8,
    featured: false,
    images: [],
  },
  {
    name: "Himachali Woollen Cap",
    price: 499,
    description:
      "Traditional topi-style Himachali cap with colourful band. One size fits most. A must-have Himachal souvenir.",
    category: "cap",
    stock: 40,
    featured: false,
    images: [],
  },
  {
    name: "Mountain Muffler",
    price: 699,
    description:
      "Cosy hand-knitted muffler in earthy tones. Made from local sheep wool. Keeps you warm on the coldest treks.",
    category: "muffler",
    stock: 30,
    featured: false,
    images: [],
  },
  {
    name: "Tribal Weave Shawl",
    price: 3299,
    description:
      "Bold tribal patterns in deep reds and ochres. Heavy-weight winter shawl. Ideal gift for loved ones.",
    category: "shawl",
    stock: 12,
    featured: true,
    images: [],
  },
];

async function seed() {
  await mongoose.connect(process.env.MONGO_URI);
  console.log("✅ Connected to MongoDB");

  await Product.deleteMany({});
  await User.deleteMany({ email: "admin@kulluvalley.com" });

  const inserted = await Product.insertMany(products);
  console.log(`✅ Inserted ${inserted.length} products`);

  const admin = await User.create({
    name: "Admin",
    email: "admin@kulluvalley.com",
    password: "Admin@1234",
    role: "admin",
  });
  console.log(`✅ Admin created: ${admin.email} / Admin@1234`);

  await mongoose.disconnect();
  console.log("🎉 Seeding complete!");
}

seed().catch((err) => {
  console.error("❌ Seed failed:", err.message);
  process.exit(1);
});
