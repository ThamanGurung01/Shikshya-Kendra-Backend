import mongoose from "mongoose";
import {userData} from "../seeders/user.seeder";
export const connectDB=async()=>{
    try{
const MONGO_URI=process.env.MONGO_URI||"mongodb://localhost:27017/school_management";  
        await mongoose.connect(MONGO_URI);
        await initialData(); // for seed
        console.log("Connected to MongoDB");
    }catch(error){
        console.error("Error connecting to MongoDB:",error);
        process.exit(1);
    }
}
const initialData=async()=>{
await userData();
}
