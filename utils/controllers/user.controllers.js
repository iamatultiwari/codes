import { User } from '../models/user.model.js';
import jwt from 'jsonwebtoken'
import { ApiError } from '../configApiError.js';
import { ApiResponse } from '../config/Apiresponse.js';
import { asyncHandler } from '../config/asynchandler.js';

import dotenv from "dotenv";
dotenv.config();


//  Generate Access and Refresh Tokens

const generateAccessAndRefreshToken = async (userId) => {
  try {
    const user = await User.findById(userId);

    const accessToken = user.generateAccessToken();
    const refreshToken = user.generateRefreshToken();

    user.refreshToken = refreshToken;
    await user.save({ validateBeforeSave: false });//just save dont check validation 

    return { accessToken, refreshToken };

  } catch (error) {
    throw new ApiError(500, "Something went wrong while generating access and refresh token");
  }
};

const registerUser = asyncHandler(async (req, res) => {

 const { fullName
, email, username, password } = req.body;

  if ([fullName, email, username, password].some(field => !field?.trim())) {
  throw new ApiError(400, "All fields are required");
}


  // Check for existing user
  const existedUser = await User.findOne({
    $or: [{ username }, { email }]
  });

  if (existedUser) {
    throw new ApiError(409, "User with this email or username already exists");
  }


  console.log(req.body);


  // Create user
  const user = await User.create({
    fullName,
    email,
    password,
    username: username?.toLowerCase()

  });

  // Fetch user without sensitive info by mdb id as its default docs id 
  const createdUser = await User.findById(user._id).select
  ("-password -refreshToken");

  if (!createdUser) {
    throw new ApiError(500, "Something went wrong while registering the user");
  }

  return res.status(201).json(
    new ApiResponse(201, createdUser, "User registered successfully")
    //send new object  ApiResponse these fields -201, createdUser, 
  );
});


// Controller: Login User

const loginUser = asyncHandler(async (req, res) => {
  //req.body - data
  //username or email
  //find the user
  //password check if login 
  //generate access and refresh token
  //send cookie

  const { email, username, password } = req.body;

  // Validate input
  if ((!email && !username) || !password) {
    throw new ApiError(400, "username or email and password are required");
  }

  // Find user by username or email
  const user = await User.findOne({
    $or: [{ username }, { email }]
  });

  if (!user) {
    throw new ApiError(404, "User not found");
  }

  // Validate password
  const isPasswordValid = await user.isPasswordCorrect(password);
  if (!isPasswordValid) {
    throw new ApiError(401, "Invalid password");
  }

  // Generate tokens
  const { accessToken, refreshToken } = await generateAccessAndRefreshToken(user._id);

  // Fetch user without sensitive fields
  const loggedInUser = await User.findById(user._id).select("-password -refreshToken");

  // Cookie options must imp for 
  //accessing by server only
  const options = {
    httpOnly: true,
    secure: true,
    sameSite: "strict"
  };

  return res
    .status(200)
    .cookie("accessToken", accessToken, options)
    .cookie("refreshToken", refreshToken, options)
    .json(
      new ApiResponse(200, { user: loggedInUser, accessToken,refreshToken}, "Login successful")
    );
});


//   controller - for accessofrefreshtoken
const refreshAccessToken = asyncHandler(async(req,res) =>
  {
  const incomingRefreshToken =  req.cookies.refreshToken || req.body.refreshToken 

  if (!incomingRefreshToken) {
    throw new ApiError(401,"unauthorized request ")
    
  }
 try {
   const decodedToken = jwt.verify(
     incomingRefreshToken,
     process.env.REFRESH_TOKEN_SECRET
   )
 
    const user = await User.findById(decodedToken?._id)
 
    if(!user){
     throw new ApiError(401,"INVALID REFRESH TOKEN ")
    }
     if (incomingRefreshToken !== user?.refreshToken) {
       throw new ApiError(401,"expired refresh token.")
       
     }
 //refershToken
     const options ={
       httpOnly:true,
       secure:true
     }
     const {accessToken,newRefreshToken
} =  await generateAccessAndRefreshToken(user._id)
 
     return res
    //  .status("accessToken",accessToken,options)
    //  .status("refreshToken",newRefreshToken,options)
    .cookie("accessToken", accessToken, options)
    .cookie("refreshToken", newRefreshToken, options)
     .json(
       new Apiresponse(
         200,
         {accessToken,refreshAccessToken:newRefreshToken
},
         "access token refreshed succesfully"
       )
     )
 } catch (error) {
  throw new ApiError(401,error?.message || "Invalid refreshToken")
  
 }
})


// Export Controllers

export {
  registerUser,
  loginUser,
  refreshAccessToken
};