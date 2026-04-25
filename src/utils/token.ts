import jwt from 'jsonwebtoken';
export const generateAccessToken = (userId: string) => {
    if(!process.env.ACCESS_TOKEN_SECRET||!process.env.ACCESS_TOKEN_EXPIRES) throw new Error('ACCESS_TOKEN_SECRET or ACCESS_TOKEN_EXPIRES is not defined in environment variables');
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
    throw new Error('Invalid access token');
}}