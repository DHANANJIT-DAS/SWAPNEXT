
// import { saveOTP, verifyOTP } from "../../utils/otpStore.js";
// import { sendOTPEmail } from "../../utils/mailer.js";



// const sendUserOTP = async function (req, res) {
//   const { email } = req.body;
//   if (!email) return res.status(400).json({ message: "Email is required" });

//   const otp = String(Math.floor(100000 + Math.random() * 900000)); // 6-digit OTP

//   try {
//     saveOTP(email, otp);
//     sendOTPEmail(email, otp);
//     res.json({ message: "OTP sent successfully" });
//   } catch (err) {
//     console.error(err);
//     res.status(500).json({ message: "Failed to send OTP" });
//   }
// }

// const verifyUserOTP = async function (req, res) {
//   const { email, otp } = req.body;
//   if (!email || !otp)
//     return res.status(400).json({ message: "Email and OTP are required" });

//   const result = verifyOTP(email, otp);
//   if (!result.valid) return res.status(400).json({ message: result.message });

//   res.json({ message: "Verified! Proceed to next step." });
// }


// export {sendUserOTP,verifyUserOTP};