import { db } from "./db";
import { categories } from "@shared/schema";

async function seedDatabase() {
  console.log("Seeding database with default categories...");
  
  // Check if categories already exist
  const existingCategories = await db.select().from(categories);
  
  if (existingCategories.length === 0) {
    const defaultCategories = [
      { name: "Food", icon: "🍽️", color: "bg-orange-100" },
      { name: "Transport", icon: "🚗", color: "bg-blue-100" },
      { name: "Shopping", icon: "🛒", color: "bg-green-100" },
      { name: "Bills", icon: "💳", color: "bg-purple-100" },
      { name: "Entertainment", icon: "🎬", color: "bg-red-100" },
      { name: "Health", icon: "🏥", color: "bg-pink-100" },
      { name: "Other", icon: "📋", color: "bg-gray-100" },
    ];

    await db.insert(categories).values(defaultCategories);
    console.log("✓ Default categories seeded successfully");
  } else {
    console.log("✓ Categories already exist, skipping seed");
  }
}

// Run seed if this file is executed directly
seedDatabase()
  .then(() => {
    console.log("Seeding completed");
    process.exit(0);
  })
  .catch((error) => {
    console.error("Seeding failed:", error);
    process.exit(1);
  });

export { seedDatabase };