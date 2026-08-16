import mongoose from "mongoose";
import { DB_NAME } from "../constants.js";

// Connect to MongoDB

const connectDB = async () => {
    try {

        const connectionInstnace = await mongoose.connect(`${process.env.MONGODB_URL}/${DB_NAME}`);
        console.log(`\n MongoDB connected: ${connectionInstnace.connection.host} \n`);

    }catch(error){
        console.error("MONGODB connection error:", error);
        process.exit(1);
    }
}
export default connectDB;