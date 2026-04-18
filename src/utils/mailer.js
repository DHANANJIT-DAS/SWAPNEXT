// import nodemailer from "nodemailer";

// const transporter = nodemailer.createTransport({
//   service: "gmail",
//   auth: {
//     user: process.env.EMAIL,
//     pass: process.env.EMAIL_PASSWORD,
//   },
// });

// const sendOTPEmail = async (to, otp) => {

//   try {
//     const info = await transporter.sendMail({
//       from: `"SwapNext" <${process.env.EMAIL}>`, // Nicer display name
//       to,
//       subject: "Verification Code",
//       text: `Your OTP is: ${otp}. It expires in 5 minutes.`, // Plain text fallback
//       html: `
//         <div style="font-family: sans-serif; padding: 20px; border: 1px solid #eee">
//           <h2>Verification Code</h2>
//           <p>Please use the following code to complete your login:</p>
//           <h1 style="color: #4A90E2;">${otp}</h1>
//           <p>This code <strong>expires in 5 minutes</strong>.</p>
//         </div>
//       `,
//     });
//     return { success: true, messageId: info.messageId };
//   } catch (error) {
//     console.error("Failed to send OTP email:", error);
//     return { success: false, error: error.message };
//   }

// };

// export {sendOTPEmail};