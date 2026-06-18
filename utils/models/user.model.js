import mongoose from "mongoose"

const UserSchema =  new mongoose.Schema(
    {
    username: {
        type: String,
        required: true,
        unique: true
        
    },
    useremail: {
        type: String,
        unique: true,
        required: true
    }
},

 { timeStamp: true }
);


const User = mongoose.model("User", UserSchema);

export default User;