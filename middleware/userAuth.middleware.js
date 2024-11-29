import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';

dotenv.config();


const secretKey = process.env.ACCESS_TOKEN_SECRET;

const authenticationMiddleware = (req, res, next) => {
    
    
  const token = req.headers.authorization;

  
  if (!token) return res.status(401).json({ message: 'Unauthorized - No token provided' });

  // Verify and decode the token
  jwt.verify(token, secretKey, (err, decoded) => {
    if (err) {
      return res.status(401).json({ message: 'Unauthorized - Invalid token' });
    }
    
    req.id = decoded.payload.id;
    next();
  });}
// };

export default authenticationMiddleware