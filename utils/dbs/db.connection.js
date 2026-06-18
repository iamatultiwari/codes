import mongoose from "mongoose"

const connectDB = async() => {
    try{
     const connectionInstance =    await mongoose.connect(process.env.MONGO_URL)
     console.log("mongodb connected succesfully ")
    }catch(error){
        console.log("mongodb connection fails ",error.message)
        process.exit(1);
    }
}


export default connectDB;