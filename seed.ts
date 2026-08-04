import { db } from './src/db/index';
import { surveys } from './src/db/schema';
import * as dotenv from 'dotenv';
dotenv.config();

async function seed() {
  console.log("Seeding all survey types...");
  try {
    await db.insert(surveys).values([
      {
        title: "AI Generated Video Feedback",
        description: "Watch this AI-generated video and tell us what you think about its realism.",
        type: "AI Video",
        rewardPoints: 100,
        estimatedCompletionTime: 2,
        status: "active",
        category: "Technology",
        content: {
          mediaType: "video",
          media: "https://www.w3schools.com/html/mov_bbb.mp4"
        }
      },
      {
        title: "AI Image Comparison",
        description: "Compare two AI-generated images and choose the one that looks more natural.",
        type: "AI Image Comparison",
        rewardPoints: 50,
        estimatedCompletionTime: 1,
        status: "active",
        category: "Design",
        content: {
          mediaType: "image",
          media: "https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=400&q=80",
          mediaType2: "image",
          media2: "https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=400&q=80" // just placeholders
        }
      },
      {
        title: "Image Rating",
        description: "Rate the aesthetic appeal of this photograph.",
        type: "Image Rating",
        rewardPoints: 20,
        estimatedCompletionTime: 1,
        status: "active",
        category: "Photography",
        content: {
          mediaType: "image",
          media: "https://images.unsplash.com/photo-1506744626753-1fa44df14d28?auto=format&fit=crop&w=400&q=80"
        }
      },
      {
        title: "Brand Advertisement Review",
        description: "Watch our latest ad campaign and share your thoughts.",
        type: "Brand Advertisement",
        rewardPoints: 150,
        estimatedCompletionTime: 3,
        status: "active",
        category: "Marketing",
        content: {
          mediaType: "video",
          media: "https://www.w3schools.com/html/mov_bbb.mp4"
        }
      },
      {
        title: "Product Packaging Comparison",
        description: "Which packaging design do you prefer for our new snack line?",
        type: "Product Packaging Comparison",
        rewardPoints: 60,
        estimatedCompletionTime: 1,
        status: "active",
        category: "Product",
        content: {
          mediaType: "image",
          media: "https://images.unsplash.com/photo-1556228578-0d85b1a4d571?auto=format&fit=crop&w=400&q=80",
          mediaType2: "image",
          media2: "https://images.unsplash.com/photo-1556228578-0d85b1a4d571?auto=format&fit=crop&w=400&q=80"
        }
      },
      {
        title: "Logo Comparison",
        description: "Help us choose our new startup logo.",
        type: "Logo Comparison",
        rewardPoints: 40,
        estimatedCompletionTime: 1,
        status: "active",
        category: "Design",
        content: {
          mediaType: "image",
          media: "https://images.unsplash.com/photo-1599305445671-ac291c95aaa9?auto=format&fit=crop&w=400&q=80",
          mediaType2: "image",
          media2: "https://images.unsplash.com/photo-1599305445671-ac291c95aaa9?auto=format&fit=crop&w=400&q=80"
        }
      },
      {
        title: "Voice Response: Customer Support",
        description: "Listen to the prompt and record your response as if you were speaking to a customer.",
        type: "Voice Response",
        rewardPoints: 120,
        estimatedCompletionTime: 2,
        status: "active",
        category: "Service",
        content: {
          mediaType: "audio",
          media: "https://www.w3schools.com/html/horse.mp3"
        }
      },
      {
        title: "Selfie Video: Product Unboxing",
        description: "Record a short selfie video describing your initial reaction to a product.",
        type: "Selfie Video Response",
        rewardPoints: 200,
        estimatedCompletionTime: 4,
        status: "active",
        category: "Product"
      },
      {
        title: "Website Usability Testing",
        description: "Visit our new landing page and tell us how easy it was to find the pricing section.",
        type: "Website Testing",
        rewardPoints: 80,
        estimatedCompletionTime: 5,
        status: "active",
        category: "UX/UI",
        content: {
          link: "https://example.com"
        }
      },
      {
        title: "Mobile App Beta Testing",
        description: "Test our new mobile app prototype and share your feedback on the navigation.",
        type: "Mobile App Testing",
        rewardPoints: 250,
        estimatedCompletionTime: 10,
        status: "active",
        category: "Software",
        content: {
          link: "https://example.com/app"
        }
      },
      {
        title: "Audio/Music Review",
        description: "Listen to this new music track and tell us how it makes you feel.",
        type: "Audio/Music",
        rewardPoints: 70,
        estimatedCompletionTime: 3,
        status: "active",
        category: "Entertainment",
        content: {
          mediaType: "audio",
          media: "https://www.w3schools.com/html/horse.mp3"
        }
      },
      {
        title: "Movie & Trailer Review",
        description: "Watch the trailer for our upcoming sci-fi movie and rate your excitement.",
        type: "Movie & Trailer Review",
        rewardPoints: 90,
        estimatedCompletionTime: 2,
        status: "active",
        category: "Entertainment",
        content: {
          mediaType: "video",
          media: "https://www.w3schools.com/html/mov_bbb.mp4"
        }
      },
      {
        title: "Interactive Tech Poll",
        description: "Which emerging technology are you most excited about?",
        type: "Interactive Poll",
        rewardPoints: 10,
        estimatedCompletionTime: 1,
        status: "active",
        category: "Technology"
      },
      {
        title: "Personality & Psychology",
        description: "Answer a few questions to help us understand different personality types in the workplace.",
        type: "Personality & Psychology",
        rewardPoints: 100,
        estimatedCompletionTime: 5,
        status: "active",
        category: "Research"
      }
    ]);
    console.log("Seeding complete!");
  } catch (error) {
    console.error("Failed to seed", error);
  } finally {
    process.exit(0);
  }
}

seed();
