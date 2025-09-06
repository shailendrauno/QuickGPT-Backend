import mongoose from "mongoose";

const connectDB = async () => {
  try {
    mongoose.connection.on("connected", () => console.log("Mongoose connected to DB"));
    
    await mongoose.connect(`${process.env.MONGODB_URI}/quickgpt`, {
    });
    // console.log("MongoDB connected successfully");
  } catch (error) {
    console.log("MongoDB connection error:", error.message);
  }
};

export default connectDB;