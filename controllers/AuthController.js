const User = require("../models/UserModel");
const { createSecretToken } = require("../util/SecretToken");
const HealthProviderModal = require("../models/HealthProviderModel");
const createOTPFun = require("../util/otp");
const { sendEmail } = require("../util/sendEmail");
// const googleOAuth = require('../util/googleOauth');
const bcrypt = require("bcrypt");
const validator = require("validator");
const OtpModel = require("../models/OtpModel");
const axios = require("axios");
require("dotenv").config();

const registerApi = async (req, res) => {
  try {
    const {
      firstName,
      lastName,
      email,
      phone,
      password,
      confirmPassword,
      role,
      providerName,
      providerAddress,
      providerPhone,
    } = req.body;

    if (
      !email ||
      !firstName ||
      !lastName ||
      !phone ||
      !password ||
      !confirmPassword
    ) {
      return res
        .status(400)
        .json({ status: "error", message: "All fields are required" });
    }

    if (!validator.isEmail(email)) {
      return res
        .status(400)
        .json({ status: "error", message: "Invalid email" });
    }

    const { code, number } = phone;
    if (!code || !number) {
      return res
        .status(400)
        .json({ status: "error", message: "Phone object is incomplete" });
    }

    if (password.length < 8) {
      return res
        .status(400)
        .json({
          status: "error",
          message: "Password must be at least 8 characters",
        });
    }

    if (password !== confirmPassword) {
      return res
        .status(400)
        .json({ status: "error", message: "Passwords do not match" });
    }

    const isEmailExist = await User.findOne({ email });
    if (isEmailExist) {
      return res
        .status(400)
        .json({ status: "error", message: "Email already in use" });
    }

    const isPhoneExist = await User.findOne({ phone });
    if (isPhoneExist) {
      return res
        .status(400)
        .json({ status: "error", message: "Phone number already in use" });
    }

    if (!providerName || !providerAddress || !providerPhone) {
      return res
        .status(400)
        .json({
          status: "error",
          message: "Health provider details are required",
        });
    }

    const user = await User.create({
      firstName,
      lastName,
      email,
      phone: { code, number },
      password,
      role,
    });

    const healthProvider = await HealthProviderModal.create({
      providerName,
      providerAddress,
      phone: providerPhone,
      active: true,
      verifyAt: new Date(),
    });

    console.log("Health provider created", healthProvider);

    const otp = await createOTPFun(user.email);
    const mailSend = await sendEmail({
      email: user.email,
      subject: "OTP for Signup",
      text: `Your OTP for signup is ${otp}`,
      html: `<html><body><p>Your OTP is ${otp}</p></body></html>`,
    });

    if (!mailSend) {
      return res
        .status(400)
        .json({ status: "error", message: "Error in sending OTP email" });
    }

    const userData = await getUserData(user);
    res.status(201).json({
      status: "success",
      data: {
        user: userData,
      },
      message:
        "Account created successfully, please check your email for OTP verification",
    });
  } catch (error) {
    console.log("Error in signup", error);
    res.status(400).json({ status: "error", message: error.message });
  }
};

const verifyOtpApi = async (req, res, next) => {
  try {
    let { email, otp, type } = req.body;
    if (!email || !otp) {
      return res
        .status(400)
        .json({ status: "error", message: "Email and otp are required" });
    }
    email = email.replace(/"/g, "");
    console.log("Email", email);
    const otpDoc = await OtpModel.findOne({
      email,
      otp,
    }).sort({ $natural: 1 });

    console.log("otpDoc381", otpDoc);

    if (!otpDoc) {
      return res.status(400).json({ status: "error", message: "Invalid otp" });
    }
    if (otpDoc.otp !== otp) {
      return res
        .status(400)
        .json({ status: "error", message: "Otp not match" });
    }

    if (new Date() > otpDoc.expiredAt) {
      return res.status(400).json({ status: "error", message: "OTP expired" });
    }

    if (type === "reset") {
      return res
        .status(200)
        .json({ status: "success", message: "OTP verified successfully" });
    }

    let user = await User.findOne({ email });
    if (!email) {
      return res.status(400).json({ status: "error", message: "Invalid otp" });
    }
    if (user.verified === false) {
      await User.updateOne({ email }, { verified: true, verifyAt: new Date() });

      user.verified = true;
      user.verifyAt = new Date();
    }
    const token = createSecretToken({ id: user._id });
    const userData = await getUserData(user);

    res.status(200).json({
      status: "success",
      data: {
        token,
        user: userData,
      },
      message: "OTP verified successfully",
    });
  } catch (error) {
    console.log("Error in verify otp", error);
    res.status(400).json({ status: "error", message: error.message });
  }
};

const loginApi = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res
        .status(400)
        .json({ status: "error", message: "All fields is required" });
    }

    const user = await User.findOne({ email });

    if (!user) {
      return res
        .status(400)
        .json({ status: "error", message: "Invalid credientials" });
    }

    if (user && (await bcrypt.compare(password, user.password))) {
      if (user.deletedAt !== undefined) {
        if (user.deletedAt !== null) {
          return res
            .status(400)
            .json({ status: "error", message: "Account has been deleted" });
        }
      }

      // const otp = await createOTPFun(user.email);

      // const mailSend = await sendEmail({
      //   email: user.email,
      //   subject: "OTP for login",
      //   text: `Your OTP for login is ${otp}`,
      //   html: `<!DOCTYPE html>
      //       <html lang="en">
      //         <head>
      //           <meta charset="UTF-8" />
      //           <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      //           <title>Document</title>

      //           <style>

      //   @import url('https://fonts.googleapis.com/css2?family=Poppins:ital,wght@0,100;0,200;0,300;0,400;0,500;0,600;0,700;1,100;1,200;1,300;1,400;1,500&display=swap');

      //   /* Default styles outside of media query */

      //   /* Media query for screen width up to 768px */
      //   @media screen and (max-width: 800px) {
      //     .para-makely1{
      //       font-size: 0.625rem !important;
      //       line-height: 19px !important;

      //     }
      //     .para-makely{
      //       font-size: 0.625rem !important;

      //     }
      //     .hole-container{
      //       padding-left: 0px !important;
      //       padding-right: 8px !important;
      //     }
      //     body{
      //       background-color: white !important;
      //       padding-top:10px !important;
      //       padding-bottom:10px !important;
      //       padding-right:20px !important;
      //       padding-left:20px !important;
      //     }
      //     .card-wdth{
      //       max-width: 400px !important;

      //     }
      //   }
      // </style>
      //         </head>
      //         <body style="background-color: #E3E3E3;padding-top:30px;padding-bottom:30px;padding-right:15px;padding-left:15px;">

      //             <div class="card-wdth" style="background-color: white !important; max-width: 550px; height: auto;padding: 15px; margin:auto;" >
      //               <div style="text-align: center;margin-top: 10px; padding-top: 20px;"> <img src="
      //               ${makelyLogo}"  width="160px" height="auto" alt="MakelyPro">
      //               </div>
      //           <div><p style="text-align: center;font-weight: 500;font-size: 26px;font-family: 'Poppins', sans-serif;font-size: 18px;color: #000000;">Let’s Sign You In  </p></div>
      //           <div class="hole-container" style="padding-left: 35px;padding-right:35px;font-family: 'Poppins',sans-serif;font-weight: 400;">
      //           <div style="color: #303030;font-size: 14px;font-family: 'Poppins', sans-serif;padding-top:13px;"><p>Dear User,</p></div>

      //       <div><p class="para-makely" style="color: #303030;font-size: 14px;font-family: 'Poppins', sans-serif;padding-top:13px;">Thank you for choosing MAKELY PRO. Use This One Time Passcode (OTP) to complete your Sign Up Procedure & Verify Your Accont on MAKELY PRO.</p></div>
      //       <div style="height: 70px;background-color: rgb(206, 246, 232);border: none;outline: none;width: 100%;letter-spacing: 10px;font-size: 40px;font-weight: 600;display:flex;justify-content:center;align-items: center;padding:5px;margin-top:15px">
      //       <span style="font-size:30px;margin:auto">${otp}</span>
      //         <!-- <input type="tel" id="otp" name="otp" maxlength="6" style="border: none;outline: none;text-align: center;height: 70px;background-color: rgb(206, 246, 232);width: 100%;letter-spacing: 10px;font-size: 40px;font-weight: 600;" > -->
      //       </div>
      //       <div class="para-makely" style="padding-top: 13px; color: #303030;font-size: 14px;font-family: 'Poppins', sans-serif"><p>This OTP is Valid For 05 Mins</p></div>
      //       <div ><p class="para-makely" style="color: #FF5151;font-size: 14px;font-family: 'Poppins', sans-serif;">“Please Don't Share Your OTP With Anyone For Your Account <br> Security.”</p></div>

      //       <p class="para-makely" style="color: #303030 ;font-size: 14px;font-weight: 600;font-size: 18px;font-family: 'Poppins', sans-serif;padding-top:12px">Thank You</p>
      //       </div>

      //           </div>

      //           </body>

      //       </html>
      //       `,

      //   headers: {
      //     "Content-Type": "multipart/mixed",
      //     "Content-Disposition": "inline",
      //   },
      // });

      // if (!mailSend) {
      //   return res.status(400).json({
      //     status: "error",
      //     message: "Error in sending email",
      //   });
      // }

      const token = createSecretToken({ id: user._id });
      const userData = await getUserData(user);

      res.status(201).json({
        status: "success",
        data: {
          token,
          user: userData,
        },
        message: "Login successfull",
      });
    } else {
      return res
        .status(400)
        .json({ status: "error", message: "Invalid credientials" });
    }
  } catch (error) {
    console.log("Error in login", error);
    res.status(400).json({ status: "error", message: error.message });
  }
};

const forgetPasswordApi = async (req, res, next) => {
  try {
    const { email } = req.body;
    console.log("phone 432", email);
    const emailWithoutQuotes = email.replace(/"/g, "").replace(/\s+/g, "");
    console.log("Formatted email:", emailWithoutQuotes);

    if (!email) {
      return res
        .status(400)
        .json({ status: "error", message: "Email is required" });
    }
    const user = await User.findOne({
      $or: [{ email: emailWithoutQuotes }],
    });
    console.log("phone 442", user);

    if (!user) {
      return res
        .status(400)
        .json({ status: "error", message: "Invalid Credientials" });
    } else {
      const otp = await createOTPFun(user.email);

      const mailSend = await sendEmail({
        email: user.email,
        subject: "Resend Otp",
        text: `Your OTP for forget password is ${otp}`,
        html: `<!DOCTYPE html>
        <html lang="en">
          <head>
            <meta charset="UTF-8" />
            <meta name="viewport" content="width=device-width, initial-scale=1.0" />
            <title>Document</title>

            <style>

    @import url('https://fonts.googleapis.com/css2?family=Poppins:ital,wght@0,100;0,200;0,300;0,400;0,500;0,600;0,700;1,100;1,200;1,300;1,400;1,500&display=swap');

    /* Default styles outside of media query */


    /* Media query for screen width up to 768px */
    @media screen and (max-width: 800px) {
      .para-makely1{
        font-size: 0.625rem !important;
        line-height: 19px !important;

      }
      .para-makely{
        font-size: 0.625rem !important;


      }
      .hole-container{
        padding-left: 0px !important;
        padding-right: 8px !important;
      }
      body{
        background-color: white !important;
        padding-top:10px !important;
        padding-bottom:10px !important;
        padding-right:20px !important;
        padding-left:20px !important;
      }
      .card-wdth{
        max-width: 400px !important;

      }
    }
  </style>
          </head>
          <body style="background-color: #E3E3E3;padding-top:30px;padding-bottom:30px;padding-right:15px;padding-left:15px;">

              <div class="card-wdth" style="background-color: white !important; max-width: 550px; height: auto;padding: 15px; margin:auto;" >
                <div style="text-align: center;margin-top: 10px; padding-top: 20px;"> <img src="
                "  width="160px" height="auto" alt="">
                </div>
            <div><p style="text-align: center;font-weight: 500;font-size: 26px;font-family: 'Poppins', sans-serif;font-size: 18px;color: #000000;">Resend Otp  </p></div>
            <div class="hole-container" style="padding-left: 35px;padding-right:35px;font-family: 'Poppins',sans-serif;font-weight: 400;"> 
            <div style="color: #303030;font-size: 14px;font-family: 'Poppins', sans-serif;padding-top:13px;"><p>Dear User,</p></div>

        <div><p class="para-makely" style="color: #303030;font-size: 14px;font-family: 'Poppins', sans-serif;padding-top:13px;">Your One Time Passcode (OTP) - Resent for Your Convenience</p></div>
        <div style="height: 70px;background-color: rgb(206, 246, 232);border: none;outline: none;width: 100%;letter-spacing: 10px;font-size: 40px;font-weight: 600;display:flex;justify-content:center;align-items: center;padding:5px;margin-top:15px">
        <span style="font-size:30px;margin:auto">${otp}</span>
          <!-- <input type="tel" id="otp" name="otp" maxlength="6" style="border: none;outline: none;text-align: center;height: 70px;background-color: rgb(206, 246, 232);width: 100%;letter-spacing: 10px;font-size: 40px;font-weight: 600;" > -->
        </div>
        <div class="para-makely" style="padding-top: 13px; color: #303030;font-size: 14px;font-family: 'Poppins', sans-serif"><p>This OTP is Valid For 05 Mins</p></div>
        <div ><p class="para-makely" style="color: #FF5151;font-size: 14px;font-family: 'Poppins', sans-serif;">“Please Don't Share Your OTP With Anyone For Your Account <br> Security.”</p></div>

        <p class="para-makely" style="color: #303030 ;font-size: 14px;font-weight: 600;font-size: 18px;font-family: 'Poppins', sans-serif;padding-top:12px">Thank You</p>
        </div>

            </div>

            </body>


        </html>
        `,
      });

      if (!mailSend) {
        return res.status(400).json({
          status: "error",
          message: "Error in sending email",
        });
      }
      res.status(201).json({
        status: "success",
        message: "OTP sent successfully",
      });
    }
  } catch (error) {
    console.log("Error in forget password", error);
    res.status(400).json({ status: "error", message: error.message });
  }
};

const resetPasswordApi = async (req, res, next) => {
  console.log("req.body of reset password", req.body);
  try {
    const { password, confirmPassword, email } = req.body;

    if (!email || !password || !confirmPassword) {
      return res
        .status(400)
        .json({ status: "error", message: "All fields are required" });
    }

    if (password.length < 8) {
      return res
        .status(400)
        .json({ status: "error", message: "Password must be 8 characters" });
    }
    if (password !== confirmPassword) {
      return res.status(400).json({
        status: "error",
        message: "Password and confirm password not match",
      });
    }
    await User.updateOne(
      { email },
      { password: bcrypt.hashSync(password, 10) }
    );
    res.status(200).json({
      status: "success",
      message: "Password reset successfully",
    });
  } catch (error) {
    console.log("Error in reset password", error);
    res.status(400).json({ status: "error", message: error.message });
  }
};

const changePasswordApi = async (req, res, next) => {
  try {
    if (req.user === undefined) {
      return res.status(400).json({ status: "error", message: "Invalid user" });
    }
    const { id } = req.user;
    if (!validator.isMongoId(id)) {
      return res.status(400).json({ status: "error", message: "Invalid id" });
    }
    const { oldPassword, newPassword, confirmPassword } = req.body;
    if (!oldPassword || !newPassword || !confirmPassword) {
      return res
        .status(400)
        .json({ status: "error", message: "All fields are required" });
    }
    if (newPassword.length < 8) {
      return res
        .status(400)
        .json({ status: "error", message: "Password must be 8 characters" });
    }
    if (newPassword !== confirmPassword) {
      return res.status(400).json({
        status: "error",
        message: "Password and confirm password not match",
      });
    }
    if (oldPassword === newPassword) {
      return res.status(400).json({
        status: "error",
        message: "Old password and new password should not be same",
      });
    }
    const user = await User.findById(id);
    if (!user) {
      return res
        .status(400)
        .json({ status: "error", message: "User not found" });
    }
    if (!(await bcrypt.compare(oldPassword, user.password))) {
      return res
        .status(400)
        .json({ status: "error", message: "Invalid old password" });
    }
    await User.updateOne(
      { _id: id },
      { password: bcrypt.hashSync(newPassword, 10) }
    );
    res.status(200).json({
      status: "success",
      message: "Password changed successfully",
    });
  } catch (error) {
    console.log("Error in change password", error);
    res.status(400).json({ status: "error", message: error.message });
  }
};

const FacebookLoginApi = async (req, res) => {
  try {
    const { userId, accessToken } = req.body;

    if (!userId || !accessToken) {
      return res.status(400).json({ status: "error", message: "userId and accessToken are required" });
    }

    const response = await axios.get(`https://graph.facebook.com/v12.0/me?fields=id,name,email&access_token=${accessToken}`);

    if (response.data.id !== userId) {
      return res.status(400).json({ status: "error", message: "Invalid userId or accessToken" });
    }

    const { name, email } = response.data;

    let user = await User.findOne({ email });

    if (!user) {
      user = await User.create({
        firstName: name.split(" ")[0],
        lastName: name.split(" ")[1] || "",
        email,
        password: "",
        role: "user", 
        verified: true, 
      });
    }

    const token = createSecretToken({ id: user._id });
    const userData = await getUserData(user);

    res.status(200).json({
      status: "success",
      data: {
        token,
        user: userData,
      },
      message: "Login successful",
    });
  } catch (error) {
    console.log("Error in Facebook login", error);
    res.status(400).json({ status: "error", message: error.message });
  }
};

const logoutApi = async (req, res, next) => {
  try {
    res.clearCookie("token");
    res.status(200).json({ status: "success", message: "Logout successfully" });
  } catch (error) {
    res.status(400).json({ status: "error", message: error.message });
  }
};

// const googleLogin  = async (req, res) => {
//   try {
//     const code = req.body.code;
//     const profile = await googleOAuth.getProfileInfo(code);

//     const user = {
//       googleId: profile.sub,
//       name: profile.name,
//       firstName: profile.given_name,
//       lastName: profile.family_name,
//       email: profile.email,
//       profilePic: profile.picture,
//     };

//     res.send({ user });
//   } catch (e) {
//     console.log(e);
//     res.status(401).send();
//   }
// };

module.exports = {
  registerApi,
  verifyOtpApi,
  loginApi,
  forgetPasswordApi,
  resetPasswordApi,
  changePasswordApi,
  logoutApi,
  FacebookLoginApi,
  // googleLogin,
};

const getUserData = async (user) => {
  let healthProvider = null;

  healthProvider = await HealthProviderModal.findOne({ userId: user._id });
  if (healthProvider) {
    healthProvider = {
      providerName: healthProvider.providerName,
      providerAddress: healthProvider.providerAddress,
      providerPhone: healthProvider.phone,
      verified: healthProvider.verified,
      active: healthProvider.active,
    };
  }

  return {
    id: user._id,
    firstName: user.firstName,
    lastName: user.lastName,
    email: user.email,
    phone: user.phone,
    role: user.role,
    active: user.active,
    createdAt: user.createdAt,
    verified: user.verified,
    verifyAt: user.verifyAt,
    healthProvider,
  };
};
