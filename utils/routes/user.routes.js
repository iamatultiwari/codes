import { Router } from 'express';

import { registerUser, loginUser,refreshAccessToken } from '../controllers/user.controllers.js';
import { verifyJWT } from '../middlewares/auth.middleware.js'; 

const router = Router();

// Route: POST /api/users/register
router.route("/register").post(
  registerUser
);

// Route: POST /api/users/login
router.route("/login").post(loginUser);

//verifyJWT is a  middleware

router.route("/refresh-token").post(refreshAccessToken)

export default router;
