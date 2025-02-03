const User = require("../models/UserModel");
const { createSecretToken } = require("../util/SecretToken");
const HealthProviderModal = require("../models/HealthProviderModel");
const createOTPFun = require("../util/otp");
const { sendEmail } = require("../util/sendEmail");
const crypto = require("crypto");
// const googleOAuth = require('../util/googleOauth');
const bcrypt = require("bcrypt");
const validator = require("validator");
const OtpModel = require("../models/OtpModel");
const Invitation = require("../models/InvitationModel");
const Admin = require("../models/AdminModel");
const HealthProviderModel = require("../models/HealthProviderModel");
require("dotenv").config();

const registerApi = async (req, res) => {
  console.log("req.body", req.body)
  try {
    const {
      firstName,
      lastName,
      email,
      password,
      confirmPassword,
      role,
    } = req.body;

    if (
      !email
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

    if (password.length < 8) {
      return res.status(400).json({
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

    const user = await User.create({
      firstName,
      lastName,
      email,
      password,
      role,
    });

    const userData = await getUserData(user);
    res.status(201).json({
      status: "success",
      data: {
        user: userData,
      },
      message:
      "User Details Enter Sucessfully",
    });
  } catch (error) {
    console.log("Error in signup", error);
    res.status(400).json({ status: "error", message: error.message });
  }
};

const healthProviderApi = async (req, res) => {
  const { userId } = req.body
  try {
    const {
      providerName,
      providerAddress,
      providerPhone
    } = req.body;

    const isProviderName = await HealthProviderModel.findOne({ providerName });
    if (isProviderName) {
      return res
        .status(400)
        .json({ status: "error", message: "Provider Name already in use" });
    }

    const isProviderAddress = await HealthProviderModel.findOne({ providerAddress });
    if (isProviderAddress) {
      return res
        .status(400)
        .json({ status: "error", message: "Provider Address already in use" });
    }

    const user = await User.findOne({_id:userId})
    console.log("user", user)

      const healthProvider = await HealthProviderModal.create({
        userId:user._id,
        providerName,
        providerAddress,
        phone: providerPhone,
        active: true,
        verifyAt: new Date(),
      })

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

    res.status(201).json({
      status: "success",
      data: {
        user: healthProvider,
      },
      message:
        "Health Provider Added Sucessfully, check your email, Enter otp to verify your account.",
    });

} catch (error) {
    console.log("Error in signup", error);
    res.status(400).json({ status: "error", message: error.message });
  }
}

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

const loginApi = async (req, res) => {
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

const checkTokenIsValidApi = async (req, res, next) => {
  try {
    const { id } = req.user;
    console.log("id", id);

    // Fetch the user by ID
    const user = await User.findById(id);
    if (!user) {
      return res.status(400).json({ status: "error", message: "Invalid user" });
    }

    const token = createSecretToken({ id: user._id });

    const userData = await getUserData(user);

    res.status(201).json({
      status: "success",
      data: {
        token,
        user: userData,
      },
      message: "Login successful",
    });
  } catch (error) {
    console.error("Error checking token validity:", error);
    res.status(500).json({ status: "error", message: "Internal server error" });
  }
};

const UserAutoLoginApi = async (req, res, next) => {
  try {
    const { userId } = req.body;

    const user = await User.findById(userId);
    if (!user) {
      return res.status(400).json({ status: "error", message: "Invalid user" });
    }

    const token = createSecretToken({ id: user._id });

    const userData = await getUserData(user);

    res.status(201).json({
      status: "success",
      data: {
        token,
        user: userData,
      },
      message: "Login successful",
    });
  } catch (error) {
    console.error("Error checking token validity:", error);
    res.status(500).json({ status: "error", message: "Internal server error" });
  }
};


const forgetPasswordApi = async (req, res, next) => {
  try {
    const { email } = req.body;
    const emailWithoutQuotes = email.replace(/"/g, "").replace(/\s+/g, "");

    if (!email) {
      return res
        .status(400)
        .json({ status: "error", message: "Registered email is required" });
    }
    const user = await User.findOne({
      $or: [{ email: emailWithoutQuotes }],
    });

    if (!user) {
      return res
        .status(400)
        .json({ status: "error", message: "Invalid Credientials" });
    } else {
      const invitationToken = crypto.randomBytes(32).toString("hex");

      const setupLink = `${process.env.CLIENT_URL}/forget-password/${invitationToken}`;

      const mailSend = await sendEmail({
        email: user.email,
        subject: "Forget Password",
        text: `Your link for forget password is ${setupLink} `,
      });

      if (!mailSend) {
        return res.status(400).json({
          status: "error",
          message: "Error in sending email",
        });
      }
      res.status(201).json({
        status: "success",
        message: "Check Your Email for Passord Recovery",
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

const logoutApi = async (req, res, next) => {
  try {
    res.clearCookie("token");
    res.status(200).json({ status: "success", message: "Logout successfully" });
  } catch (error) {
    res.status(400).json({ status: "error", message: error.message });
  }
};

const getAllUsersApi = async (req, res, next) => {
  try {
    if (req.user === undefined) {
      return res.status(400).json({ status: "error", message: "Invalid user" });
    }
    const { id } = req.user;
    if (!validator.isMongoId(id)) {
      return res.status(400).json({ status: "error", message: "Invalid id" });
    }
    const myUser = await User.findById(id);
    if (!myUser) {
      return res
        .status(400)
        .json({ status: "error", message: "User not found" });
    }
    if (myUser.role !== "super-admin") {
      return res.status(400).json({
        status: "error",
        message: "You are not authorized to access users",
      });
    }
    const userData = await User.find({});

    const users = [];

    await Promise.all(
      userData.map(async (user) => {
        const myusersData = await getUserData(user);
        users.push(myusersData);
      })
    );

    res.status(200).json({
      status: "success",
      data: {
        users,
      },
      message: "Users fetched successfully",
    });
  } catch (error) {
    console.log("Error in get all users", error);
    res.status(400).json({ status: "error", message: error.message });
  }
};

const getUserbyId = async (req, res) => {
  
  try {
    const { userId } = req.body;

    if (!userId) {
      return res.status(400).json({
        status: "error",
        message: "User Id is required",
      });
    }

    const user = await User.findById(userId);
    const userData = await getUserData(user);

    res.status(200).json({
      status: "success",
      data: userData,
      message: "Getting User Detail Success",
    });
  } catch (error) {
    console.error("Error in getting user details", error);
    res.status(500).json({ status: "error", message: error });
  }
};

const UpdateUserApi = async (req, res, next) => {
  console.log("clall",req.body);
  
  try {
    const { userId } = req.body;
    if (!validator.isMongoId(userId)) {
      return res.status(400).json({ status: "error", message: "Invalid id" });
    }
    const myUser = await User.findById(userId);

    if (!myUser) {
      return res
        .status(400)
        .json({ status: "error", message: "User not found" });
    }
    // if (myUser.role !== "super-admin") {
    //   return res.status(400).json({
    //     status: "error",
    //     message: "You are not authorized to access users",
    //   });
    // }

    const existingUser = await User.findById(userId);
    if (!existingUser) {
      return res.status(404).json({
        status: "error",
        message: "User not found",
      });
    }

    const updatedUserFields = {
      active: req.body.active,
      firstName: req.body.firstName ?? existingUser.firstName,
      lastName: req.body.lastName ?? existingUser.lastName,
      email: req.body.email ?? existingUser.email,
      phone: req.body.phone ?? existingUser.phone,
      role: req.body.role ?? existingUser.role,
    };

    const updatedBusinessData = await User.findOneAndUpdate(
      { _id: userId },
      { $set: updatedUserFields },
      { new: true }
    );

    const user = await getUserData(updatedBusinessData);

    res.status(200).json({
      status: "success",
      user,
      message: "Users Updated Successfully",
    });
  } catch (error) {
    console.log("Error in get all users", error);
    res.status(400).json({ status: "error", message: error.message });
  }
};

const ActivateUserAccount = async (req, res, next) => {
  try {
    const { userId, active, verified } = req.body;
    const user = await User.findById(userId);
    if (!user) {
      return res.status(400).json({
        status: "error",
        message: "user not found",
      });
    }
    await User.findByIdAndUpdate(
      { _id: userId },
      {
        $set: {
          active: active,
          verified: verified,
        },
      },
      { upsert: true }
    );
    const userData = await User.findById(userId);

    console.log("userData", userData);
    res.status(200).json({
      status: "success",
      data: userData,
      message: "User Activated Successfully",
    });
  } catch (error) {
    console.error("Error in getting Package", error);
    res.status(500).json({ status: "error", message: error });
  }
};

const SentInvitationAdminApi = async (req, res, next) => {
  try {
    const { email, role, userId } = req.body;

    const invitationToken = crypto.randomBytes(32).toString("hex");
    await Invitation.create({
      email,
      role,
      invitationToken,
      invitedBy: req?.user?.id || userId,
    });

    const setupLink = `${process.env.CLIENT_URL}/setup-account/${invitationToken}`;

    const mailSend = await sendEmail({
      email: req.body.email,
      subject: "Admin Invitation",
      text: `Set up your account here: ${setupLink}`,
    });

    if (!mailSend) {
      return res
        .status(400)
        .json({ status: "error", message: "Error in sending OTP email" });
    }

    res.status(201).json({ message: "Invitation sent successfully" });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Failed to send invitation", error: error.message });
  }
};

const createNewAdminApi = async (req, res, next) => {
  try {
    const {
      firstName,
      lastName,
      email,
      phone,
      password,
      confirmPassword,
      role,
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
      return res.status(400).json({
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

    const user = await Admin.create({
      firstName,
      lastName,
      email,
      phone: { code, number },
      password,
      role,
    });

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

const GetAllAdminsApi = async (req, res, next) => {
  try {
    // if (req.user === undefined) {
    //   return res.status(400).json({ status: "error", message: "Invalid user" });
    // }
    // const { id } = req.user;
    // if (!validator.isMongoId(id)) {
    //   return res.status(400).json({ status: "error", message: "Invalid id" });
    // }
    // const myUser = await User.findById(id);
    // if (!myUser) {
    //   return res
    //     .status(400)
    //     .json({ status: "error", message: "User not found" });
    // }
    // if (myUser.role !== "super-admin") {
    //   return res.status(400).json({
    //     status: "error",
    //     message: "You are not authorized to access users",
    //   });
    // }

    const userData = await Admin.find({ deletedAt: { $exists: false } });

    const admins = [];

    await Promise.all(
      userData.map(async (user) => {
        const myusersData = await getAdminsData(user);
        admins.push(myusersData);
      })
    );

    res.status(200).json({
      status: "success",
      data: {
        admins,
      },
      message: "Admins fetched successfully",
    });
  } catch (error) {
    console.log("Error in get all admins", error);
    res.status(400).json({ status: "error", message: error.message });
  }
};

const deleteAdminApi = async (req, res, next) => {
  try {
    const { adminId } = req.params;

    if (!adminId || !validator.isMongoId(adminId)) {
      return res.status(400).json({
        status: "error",
        message: "Invalid Admin ID",
      });
    }

    const admin = await Admin.findById(adminId);

    if (!admin) {
      return res.status(400).json({
        status: "error",
        message: "Admin not found",
      });
    }

    await Admin.findByIdAndUpdate({ _id: adminId }, { deletedAt: new Date() });

    const mailSend = await sendEmail({
      email: admin.email,
      subject: "Admin Invitation",
      text: "Hi ! you are removed.",
    });

    if (!mailSend) {
      return res
        .status(400)
        .json({ status: "error", message: "Error in sending OTP email" });
    }

    res.status(200).json({
      status: "success",
      message: "Admin Removed successfully",
      data: admin,
    });
  } catch (error) {
    console.log("Error in deleting Admin", error);
    res.status(500).json({
      status: "error",
      message: error.message,
    });
  }
};

const changeAdminPasswordApi = async (req, res, next) => {
  try {
    const { newPassword, confirmPassword, adminId } = req.body;
    if (!adminId || !newPassword || !confirmPassword) {
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
    // if (oldPassword === newPassword) {
    //   return res.status(400).json({
    //     status: "error",
    //     message: "Old password and new password should not be same",
    //   });
    // }
    const admin = await Admin.findById(adminId);
    if (!admin) {
      return res
        .status(400)
        .json({ status: "error", message: "Admin not found" });
    }
    // if (!(await bcrypt.compare(oldPassword, admin.password))) {
    //   return res
    //     .status(400)
    //     .json({ status: "error", message: "Invalid old password" });
    // }
    await Admin.updateOne(
      { _id: adminId },
      { password: bcrypt.hashSync(newPassword, 10) }
    );

    const mailSend = await sendEmail({
      email: admin.email,
      subject: "Admin Invitation",
      text: "Your Password is Changes by admin.",
    });
    console.log("admin.email", admin?.email);
    if (!mailSend) {
      return res
        .status(400)
        .json({ status: "error", message: "Error in sending OTP email" });
    }

    res.status(200).json({
      status: "success",
      message: "Password changed successfully",
    });
  } catch (error) {
    console.log("Error in change password", error);
    res.status(400).json({ status: "error", message: error.message });
  }
};

module.exports = {
  registerApi,
  verifyOtpApi,
  loginApi,
  forgetPasswordApi,
  resetPasswordApi,
  changePasswordApi,
  logoutApi,
  getAllUsersApi,
  getUserbyId,
  healthProviderApi,
  UpdateUserApi,
  ActivateUserAccount,
  SentInvitationAdminApi,
  createNewAdminApi,
  GetAllAdminsApi,
  deleteAdminApi,
  changeAdminPasswordApi,
  checkTokenIsValidApi,
  UserAutoLoginApi,
};

const getAdminsData = async (user) => {
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
  };
};

const getUserData = async (user) => {
  console.log("user",user._id)
  let healthProvider = null;
  healthProvider = await HealthProviderModal.findOne({ userId: user._id });
  console.log("heat",healthProvider)
  if (healthProvider) {
    healthProvider = {
      providerName: healthProvider?.providerName,
      providerAddress: healthProvider?.providerAddress,
      verified: healthProvider?.verified,
      active: healthProvider?.active,
    };
  }

  return {
    id: user._id,
    firstName: user?.firstName,
    lastName: user?.lastName,
    email: user?.email,
    phone: user?.phone,
    role: user?.role,
    active: user?.active,
    createdAt: user?.createdAt,
    verified: user?.verified,
    verifyAt: user?.verifyAt,
    healthProvider,
  };
};
