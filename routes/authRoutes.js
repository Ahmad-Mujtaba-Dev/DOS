const {
  registerApi,
  verifyOtpApi,
  loginApi,
  forgetPasswordApi,
  resetPasswordApi,
  changePasswordApi,
  logoutApi,
  // googleLogin,
} = require("../controllers/AuthController.js");
const auth = require("../middlewares/auth");
const router = require("express").Router();
const passport = require('passport'); 

router.post("/auth/verifyOtp", verifyOtpApi);
router.post("/auth/login", loginApi);
router.post("/auth/register-user-api", registerApi);
router.post("/auth/forget-password", forgetPasswordApi);
router.post("/auth/reset-password", resetPasswordApi);
router.post("/change-password", auth, changePasswordApi);

router.get("/login/success", (req, res) => {
	if (req.user) {
		res.status(200).json({
			error: false,
			message: "Successfully Loged In",
			user: req.user,
		});
	} else {
		res.status(403).json({ error: true, message: "Not Authorized" });
	}
});

router.get("/login/failed", (req, res) => {
	res.status(401).json({
		error: true,
		message: "Log in failure",
	});
});

router.get("/auth/google", passport.authenticate("google", ["profile", "email"]));

router.get(
	"/auth/google/callback",
	passport.authenticate("google", {
		successRedirect: process.env.CLIENT_URL,
		failureRedirect: "/login/failed",
	})
);

router.get("/logout", (req, res) => {
	req.logout();
	res.redirect(process.env.CLIENT_URL);
});

router.get("/auth/facebook", passport.authenticate("facebook", { scope: ["email"] }));

router.get(
  "/auth/facebook/callback",
  passport.authenticate("facebook", { successRedirect: process.env.CLIENT_URL,
    failureRedirect: "/login/failed",
   }),
);

router.get("/auth/logout", auth, logoutApi);

module.exports = router;
