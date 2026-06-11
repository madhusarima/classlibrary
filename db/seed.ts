import mysql from "mysql2/promise";
import { drizzle } from "drizzle-orm/mysql2";
import { students, books, transactions } from "./schema";
import * as relations from "./relations";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, "../.env") });

const DATABASE_URL = process.env.DATABASE_URL;
if (!DATABASE_URL) {
  console.error("DATABASE_URL not found");
  process.exit(1);
}

const pool = mysql.createPool({
  uri: DATABASE_URL,
  connectionLimit: 5,
});

const db = drizzle(pool, {
  mode: "planetscale",
  schema: { ...relations },
});

const studentData = [
  { name: "Aarav Sharma", class: "Class 6", rollNumber: "601", parentWhatsApp: "+919876543210" },
  { name: "Ananya Gupta", class: "Class 6", rollNumber: "602", parentWhatsApp: "+919876543211" },
  { name: "Vihaan Patel", class: "Class 6", rollNumber: "603", parentWhatsApp: "+919876543212" },
  { name: "Diya Singh", class: "Class 6", rollNumber: "604", parentWhatsApp: "+919876543213" },
  { name: "Krishna Iyer", class: "Class 6", rollNumber: "605", parentWhatsApp: "+919876543214" },
  { name: "Ravi Kumar", class: "Class 7", rollNumber: "701", parentWhatsApp: "+919876543215" },
  { name: "Priya Nair", class: "Class 7", rollNumber: "702", parentWhatsApp: "+919876543216" },
  { name: "Arun Reddy", class: "Class 7", rollNumber: "703", parentWhatsApp: "+919876543217" },
  { name: "Sita Menon", class: "Class 7", rollNumber: "704", parentWhatsApp: "+919876543218" },
  { name: "Meera Joshi", class: "Class 7", rollNumber: "705", parentWhatsApp: "+919876543219" },
  { name: "Aditya Bose", class: "Class 8", rollNumber: "801", parentWhatsApp: "+919876543220" },
  { name: "Lakshmi Rao", class: "Class 8", rollNumber: "802", parentWhatsApp: "+919876543221" },
  { name: "Hari Prasad", class: "Class 8", rollNumber: "803", parentWhatsApp: "+919876543222" },
  { name: "Nandini Shah", class: "Class 8", rollNumber: "804", parentWhatsApp: "+919876543223" },
  { name: "Karthik Verma", class: "Class 8", rollNumber: "805", parentWhatsApp: "+919876543224" },
  { name: "Ishaan Kapoor", class: "Class 9", rollNumber: "901", parentWhatsApp: "+919876543225" },
  { name: "Sneha Desai", class: "Class 9", rollNumber: "902", parentWhatsApp: "+919876543226" },
  { name: "Rohan Mishra", class: "Class 9", rollNumber: "903", parentWhatsApp: "+919876543227" },
  { name: "Tanvi Khanna", class: "Class 9", rollNumber: "904", parentWhatsApp: "+919876543228" },
  { name: "Dev Anand", class: "Class 9", rollNumber: "905", parentWhatsApp: "+919876543229" },
  { name: "Aanya Chatterjee", class: "Class 10", rollNumber: "1001", parentWhatsApp: "+919876543230" },
  { name: "Vivaan Malhotra", class: "Class 10", rollNumber: "1002", parentWhatsApp: "+919876543231" },
  { name: "Kavya Srinivas", class: "Class 10", rollNumber: "1003", parentWhatsApp: "+919876543232" },
  { name: "Aryan Dutta", class: "Class 10", rollNumber: "1004", parentWhatsApp: "+919876543233" },
  { name: "Pari Mehta", class: "Class 10", rollNumber: "1005", parentWhatsApp: "+919876543234" },
  { name: "Kabir Khan", class: "Class 7", rollNumber: "706", parentWhatsApp: "+919876543235" },
  { name: "Ira Banerjee", class: "Class 8", rollNumber: "806", parentWhatsApp: "+919876543236" },
  { name: "Yash Thakur", class: "Class 6", rollNumber: "606", parentWhatsApp: "+919876543237" },
  { name: "Mira Agarwal", class: "Class 9", rollNumber: "906", parentWhatsApp: "+919876543238" },
  { name: "Om Chandra", class: "Class 10", rollNumber: "1006", parentWhatsApp: "+919876543239" },
];

const bookData = [
  { title: "Panchatantra", author: "Vishnu Sharma", category: "Folktales", language: "Hindi", copies: 3 },
  { title: "Wings of Fire", author: "A.P.J. Abdul Kalam", category: "Biography", language: "English", copies: 4 },
  { title: "Malgudi Days", author: "R.K. Narayan", category: "Fiction", language: "English", copies: 3 },
  { title: "Akbar Birbal Stories", author: "Anant Pai", category: "Folktales", language: "Hindi", copies: 3 },
  { title: "Tenali Rama", author: "Anant Pai", category: "Folktales", language: "English", copies: 2 },
  { title: "Discovery of India", author: "Jawaharlal Nehru", category: "History", language: "English", copies: 3 },
  { title: "The Jungle Book", author: "Rudyard Kipling", category: "Adventure", language: "English", copies: 3 },
  { title: "Charlie and the Chocolate Factory", author: "Roald Dahl", category: "Fiction", language: "English", copies: 2 },
  { title: "The Little Prince", author: "Antoine de Saint-Exupery", category: "Fiction", language: "English", copies: 2 },
  { title: "Charlotte's Web", author: "E.B. White", category: "Fiction", language: "English", copies: 2 },
  { title: "Alice in Wonderland", author: "Lewis Carroll", category: "Fantasy", language: "English", copies: 3 },
  { title: "Treasure Island", author: "Robert Louis Stevenson", category: "Adventure", language: "English", copies: 2 },
  { title: "The Secret Garden", author: "Frances Hodgson Burnett", category: "Fiction", language: "English", copies: 2 },
  { title: "Heidi", author: "Johanna Spyri", category: "Fiction", language: "English", copies: 2 },
  { title: "Gulliver's Travels", author: "Jonathan Swift", category: "Adventure", language: "English", copies: 2 },
  { title: "Robinson Crusoe", author: "Daniel Defoe", category: "Adventure", language: "English", copies: 2 },
  { title: "Around the World in 80 Days", author: "Jules Verne", category: "Adventure", language: "English", copies: 2 },
  { title: "The Three Musketeers", author: "Alexandre Dumas", category: "Adventure", language: "English", copies: 2 },
  { title: "Oliver Twist", author: "Charles Dickens", category: "Classic", language: "English", copies: 2 },
  { title: "Tom Sawyer", author: "Mark Twain", category: "Adventure", language: "English", copies: 2 },
  { title: "The Wizard of Oz", author: "L. Frank Baum", category: "Fantasy", language: "English", copies: 2 },
  { title: "Pride and Prejudice", author: "Jane Austen", category: "Classic", language: "English", copies: 2 },
  { title: "Amar Chitra Katha: Mahabharata", author: "Anant Pai", category: "Mythology", language: "English", copies: 3 },
  { title: "Ruskin Bond Stories", author: "Ruskin Bond", category: "Fiction", language: "English", copies: 2 },
  { title: "The Alchemist", author: "Paulo Coelho", category: "Philosophy", language: "English", copies: 2 },
];

async function seed() {
  console.log("Seeding students...");
  for (const s of studentData) {
    await db.insert(students).values(s);
  }
  console.log(`Inserted ${studentData.length} students`);

  console.log("Seeding books...");
  for (const b of bookData) {
    await db.insert(books).values(b);
  }
  console.log(`Inserted ${bookData.length} books`);

  const now = new Date();
  const patterns = [
    { studentId: 6, bookId: 1, daysAgo: 45, returned: true },
    { studentId: 6, bookId: 2, daysAgo: 38, returned: true },
    { studentId: 6, bookId: 4, daysAgo: 30, returned: true },
    { studentId: 6, bookId: 3, daysAgo: 22, returned: true },
    { studentId: 6, bookId: 7, daysAgo: 14, returned: true },
    { studentId: 6, bookId: 5, daysAgo: 5, returned: false },
    { studentId: 6, bookId: 8, daysAgo: 2, returned: false },
    { studentId: 7, bookId: 2, daysAgo: 40, returned: true },
    { studentId: 7, bookId: 9, daysAgo: 32, returned: true },
    { studentId: 7, bookId: 10, daysAgo: 20, returned: true },
    { studentId: 7, bookId: 11, daysAgo: 10, returned: true },
    { studentId: 7, bookId: 12, daysAgo: 3, returned: false },
    { studentId: 8, bookId: 1, daysAgo: 50, returned: true },
    { studentId: 8, bookId: 3, daysAgo: 42, returned: true },
    { studentId: 8, bookId: 6, daysAgo: 35, returned: true },
    { studentId: 8, bookId: 4, daysAgo: 25, returned: true },
    { studentId: 8, bookId: 13, daysAgo: 15, returned: true },
    { studentId: 8, bookId: 14, daysAgo: 6, returned: false },
    { studentId: 9, bookId: 3, daysAgo: 35, returned: true },
    { studentId: 9, bookId: 7, daysAgo: 28, returned: true },
    { studentId: 9, bookId: 2, daysAgo: 18, returned: true },
    { studentId: 9, bookId: 15, daysAgo: 8, returned: false },
    { studentId: 10, bookId: 4, daysAgo: 30, returned: true },
    { studentId: 10, bookId: 8, daysAgo: 22, returned: true },
    { studentId: 10, bookId: 9, daysAgo: 12, returned: true },
    { studentId: 10, bookId: 16, daysAgo: 4, returned: false },
    { studentId: 11, bookId: 5, daysAgo: 20, returned: true },
    { studentId: 11, bookId: 17, daysAgo: 10, returned: false },
    { studentId: 12, bookId: 6, daysAgo: 25, returned: true },
    { studentId: 12, bookId: 10, daysAgo: 15, returned: true },
    { studentId: 12, bookId: 18, daysAgo: 5, returned: false },
    { studentId: 13, bookId: 7, daysAgo: 18, returned: true },
    { studentId: 13, bookId: 11, daysAgo: 8, returned: false },
    { studentId: 14, bookId: 8, daysAgo: 22, returned: true },
    { studentId: 14, bookId: 12, daysAgo: 12, returned: true },
    { studentId: 14, bookId: 19, daysAgo: 2, returned: false },
    { studentId: 15, bookId: 9, daysAgo: 16, returned: true },
    { studentId: 15, bookId: 13, daysAgo: 7, returned: false },
    { studentId: 16, bookId: 10, daysAgo: 28, returned: true },
    { studentId: 16, bookId: 14, daysAgo: 18, returned: true },
    { studentId: 16, bookId: 20, daysAgo: 8, returned: false },
    { studentId: 17, bookId: 11, daysAgo: 24, returned: true },
    { studentId: 17, bookId: 15, daysAgo: 14, returned: true },
    { studentId: 17, bookId: 21, daysAgo: 4, returned: false },
    { studentId: 18, bookId: 12, daysAgo: 20, returned: true },
    { studentId: 18, bookId: 16, daysAgo: 10, returned: false },
    { studentId: 19, bookId: 13, daysAgo: 15, returned: true },
    { studentId: 19, bookId: 17, daysAgo: 6, returned: false },
    { studentId: 20, bookId: 14, daysAgo: 12, returned: true },
    { studentId: 20, bookId: 18, daysAgo: 3, returned: false },
    { studentId: 21, bookId: 15, daysAgo: 18, returned: true },
    { studentId: 21, bookId: 19, daysAgo: 8, returned: false },
    { studentId: 22, bookId: 16, daysAgo: 14, returned: true },
    { studentId: 22, bookId: 20, daysAgo: 5, returned: false },
    { studentId: 23, bookId: 17, daysAgo: 10, returned: false },
    { studentId: 24, bookId: 18, daysAgo: 7, returned: false },
    { studentId: 25, bookId: 21, daysAgo: 9, returned: false },
    { studentId: 1, bookId: 1, daysAgo: 20, returned: true },
    { studentId: 1, bookId: 22, daysAgo: 10, returned: false },
    { studentId: 2, bookId: 2, daysAgo: 15, returned: true },
    { studentId: 2, bookId: 23, daysAgo: 5, returned: false },
    { studentId: 3, bookId: 3, daysAgo: 12, returned: false },
    { studentId: 4, bookId: 4, daysAgo: 8, returned: false },
    { studentId: 5, bookId: 5, daysAgo: 6, returned: false },
    { studentId: 26, bookId: 6, daysAgo: 11, returned: false },
    { studentId: 27, bookId: 7, daysAgo: 9, returned: false },
    { studentId: 28, bookId: 8, daysAgo: 7, returned: false },
    { studentId: 29, bookId: 9, daysAgo: 5, returned: false },
    { studentId: 30, bookId: 10, daysAgo: 3, returned: false },
  ];

  console.log("Seeding transactions...");
  for (const t of patterns) {
    const issueDate = new Date(now.getTime() - t.daysAgo * 24 * 60 * 60 * 1000);
    let returnDate = null;
    let status = "issued" as const;
    
    if (t.returned) {
      const returnDays = Math.max(1, t.daysAgo - Math.floor(Math.random() * 7 + 5));
      returnDate = new Date(now.getTime() - returnDays * 24 * 60 * 60 * 1000);
      status = "returned";
    }
    
    await db.insert(transactions).values({
      studentId: t.studentId,
      bookId: t.bookId,
      issueDate,
      returnDate,
      status,
    });
  }
  console.log(`Inserted ${patterns.length} transactions`);

  await pool.end();
  console.log("Seed complete!");
}

seed().catch((err) => {
  console.error(err);
  pool.end();
  process.exit(1);
});
