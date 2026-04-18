// import redis from "../db/redisConnection.js";

// const saveOTP =async (email, generatedOtp, ttl = 5 * 60) => {

//     try{
//         await redis.set(`otp:${email}`, generatedOtp, {
//             EX: ttl,
//         });
//     } catch(error){
//         console.error("Redis Error:", error);
//         throw error;
//     }  
  
// };

// const verifyOTP =async (email, submittedOTP) => {

//     try {
//         const storedOtp = await redis.get(`otp:${email}`);

//         // 1. Check if OTP exists at all (it might have expired in Redis)
//         if (!storedOtp) {
//             return { valid: false, message: "OTP expired or not found" };
//         }

//         // 2. Check if the submitted code matches
//         if (storedOtp !== submittedOTP) {
//             return { valid: false, message: "Invalid OTP" };
//         }

//         // 3. Success! Delete the OTP immediately so it can't be used again
//         await redis.del(`otp:${email}`);

//         return { valid: true, message: "OTP verified" };
        
//     } catch (error) {
//         console.error("Redis verification error:", error);
//         return { valid: false, message: "Internal server error" };
//     }
// };

// export { saveOTP, verifyOTP };