import crypto from 'crypto';

export const generateToken = () => {
    // Generate a random token using crypto library
    const token = crypto.randomBytes(32).toString('hex');
    // HashedToken is used to store in database
    const hashedToken = crypto.createHash('sha256').update(token).digest('hex');
    //Expiry time is set to 24 hours
    const expiryTime = Date.now() + 24 * 60 * 60 * 1000; // 24 hours in milliseconds

    return { token, hashedToken, expiryTime };
    
}