import jwt from 'jsonwebtoken';
export const generateAccessToken = (userId: string) => {
    if(!process.env.ACCESS_TOKEN_SECRET) throw new Error('ACCESS_TOKEN_SECRET is not defined in environment variables');
return jwt.sign({ userId }, process.env.ACCESS_TOKEN_SECRET , { expiresIn: '15m'});
}

export const generateRefreshToken = (userId: string) => {
    if(!process.env.REFRESH_TOKEN_SECRET) throw new Error('REFRESH_TOKEN_SECRET is not defined in environment variables');  
return jwt.sign({ userId }, process.env.REFRESH_TOKEN_SECRET, { expiresIn: '7d'});
}
export const verifyToken = (token: string, secret: string) => {
    if(!secret) throw new Error('Secret is not defined in environment variables');
try {
    const decoded = jwt.verify(token, secret) as { userId: string };
    return decoded.userId;
} catch (error) {
    return null;
}}