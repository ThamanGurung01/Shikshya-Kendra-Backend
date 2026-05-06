import bcrypt from 'bcrypt';
export const hashPassword = async (password:string):Promise<string> => {
try {
        const hashedPassword = await bcrypt.hash(password, parseInt(process.env.BCRYPT_SALT_ROUNDS || '10'));
        return hashedPassword;
} catch (error) {
    console.error("Error hashing password:", error);
    throw new Error("Password hashing failed");
}
}
export const comparePassword = async (password:string,hashedPassword:string):Promise<boolean> => {
try {
    const isMatch = await bcrypt.compare(password, hashedPassword);
    return isMatch;
} catch (error) {
    console.error("Error comparing password:", error);
    throw new Error("Password comparison failed");
}

}