import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';

dotenv.config();
export const generateAccessToken = function (payload) {
    return jwt.sign(

        //this is payload
        { payload },
        process.env.ACCESS_TOKEN_SECRET,
        {
            expiresIn: process.env.ACCESS_TOKEN_EXPIRY
        }
    )}
