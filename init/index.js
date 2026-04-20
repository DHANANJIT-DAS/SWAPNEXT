import mongoose from "mongoose";
import { faker } from '@faker-js/faker/locale/en_IN'; // Using Indian locale for relevant data
import Listing from "../src/models/listingModel.js"; // Adjust path to your model file

const CATEGORIES = ['electronics', 'vehicles', 'furniture', 'clothing', 'sports', 'books', 'art', 'tools', 'other'];
const CONDITIONS = ['Brand New', 'Like New', 'Good', 'Fair'];
const CITIES = ['Mumbai', 'Delhi', 'Bangalore', 'Hyderabad', 'Ahmedabad', 'Chennai', 'Kolkata', 'Pune'];

const generateMockData = async () => {
    try {
        // Connect to your DB (Change URL as needed)
        await mongoose.connect('mongodb://127.0.0.1:27017/SWAPNEXT');
        console.log("Connected to MongoDB...");

        const listings = [];

        for (let i = 0; i < 200; i++) {
            const category = faker.helpers.arrayElement(CATEGORIES);
            
            // Create 2-4 random image URLs from Unsplash for each listing
            const photoCount = faker.number.int({ min: 2, max: 5 });
            const photos = Array.from({ length: photoCount }, () => 
                `https://picsum.photos/seed/${faker.string.uuid()}/800/600`
            );

            listings.push({
                category: category,
                condition: faker.helpers.arrayElement(CONDITIONS),
                location: {
                    address: faker.location.streetAddress(),
                    city: faker.helpers.arrayElement(CITIES),
                    state: faker.location.state(),
                    pincode: faker.helpers.fromRegExp(/[1-9]{1}[0-9]{5}/),
                    meetPref: faker.helpers.arrayElement(['Buyer visits seller', 'Seller delivers', 'Public meetup']),
                    pinX: faker.number.float({ min: 0, max: 100 }),
                    pinY: faker.number.float({ min: 0, max: 100 }),
                    geo: {
                        type: 'Point',
                        coordinates: [faker.location.longitude(), faker.location.latitude()]
                    }
                },
                title: faker.commerce.productName() + " - " + faker.commerce.productAdjective(),
                description: faker.commerce.productDescription() + ". Contact for more details.",
                brand: faker.company.name(),
                yearAge: faker.number.int({ min: 1, max: 5 }) + " years old",
                price: faker.number.int({ min: 500, max: 50000 }),
                tags: [category, faker.commerce.productMaterial(), "sale"],
                photos: photos,
                photosCount: photos.length,
                seller: new mongoose.Types.ObjectId(), // Creating a dummy ID for the seller
                status: faker.helpers.arrayElement(['active', 'active', 'active', 'sold', 'reserved']), // Weighted towards active
                views: faker.number.int({ min: 0, max: 500 }),
                savedCount: faker.number.int({ min: 0, max: 50 }),
                inquiries: faker.number.int({ min: 0, max: 10 }),
                isApproved: true,
                createdAt: faker.date.past({ years: 1 })
            });
        }

        await Listing.insertMany(listings);
        console.log("Successfully inserted 200 listings!");
        process.exit();
    } catch (error) {
        console.error("Error seeding data:", error);
        process.exit(1);
    }
};

generateMockData();