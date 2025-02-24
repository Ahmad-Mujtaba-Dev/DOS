const {
  registerApi,
  verifyOtpApi,
  loginApi,
  forgetPasswordApi,
  resetPasswordApi,
  changePasswordApi,
  logoutApi,
  getAllUsersApi,
  getUserbyId,
  UpdateUserApi,
  ActivateUserAccount,
  SentInvitationAdminApi,
  createNewAdminApi,
  GetAllAdminsApi,
  deleteAdminApi,
  changeAdminPasswordApi,
  checkTokenIsValidApi,
  UserAutoLoginApi
} = require("../controllers/AuthController.js");
const auth = require("../middlewares/auth");
const router = require("express").Router();
const passport = require('passport'); 
const multer = require('multer');

// Configure multer for profile picture uploads
const storage = multer.memoryStorage();
const fileFilter = (req, file, cb) => {
  // Accept images only
  if (!file.originalname.match(/\.(jpg|JPG|jpeg|JPEG|png|PNG|gif|GIF)$/)) {
    req.fileValidationError = 'Only image files are allowed!';
    return cb(new Error('Only image files are allowed!'), false);
  }
  cb(null, true);
};

const upload = multer({ 
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB limit
  },
  fileFilter: fileFilter
});

router.post("/auth/verifyOtp", verifyOtpApi);
router.post("/auth/login", loginApi);
router.post("/auth/register-user-api", registerApi);
router.post("/auth/forget-password", forgetPasswordApi);
router.post("/auth/reset-password", resetPasswordApi);
router.post("/change-password", auth, changePasswordApi);
router.get("/auth/token-is-valid", auth, checkTokenIsValidApi);
router.post("/user-auto-login-api", auth, UserAutoLoginApi);
router.get("/auth/get-all-users", auth, (req, res, next) => {
  req.query.allUsers = req.query.allUsers === 'true';
  
  if (req.query.role) {
    const allowedRoles = ['admin', 'patient', 'super-admin'];
    req.query.role = allowedRoles.includes(req.query.role) ? req.query.role : null;
  }

  if (!req.query.allUsers) {
    req.query.page = parseInt(req.query.page) || 1;
    req.query.limit = parseInt(req.query.limit) || 10;
  }
  
  req.query.sortBy = req.query.sortBy || 'createdAt';
  req.query.sortOrder = req.query.sortOrder || 'desc';
  next();
}, getAllUsersApi);
router.post('/auth/get-user-details', getUserbyId);
router.post(
  '/auth/update-user-details', 
  upload.single('profilePicture'),
  (req, res, next) => {
    if (req.fileValidationError) {
      return res.status(400).json({ 
        status: "error",
        message: req.fileValidationError 
      });
    }
    next();
  },
  UpdateUserApi
);
router.post('/auth/account-status-change', ActivateUserAccount);
router.post('/auth/send-admin-request-api', SentInvitationAdminApi);
router.post('/auth/create-new-admin-api', createNewAdminApi);
router.get('/auth/get-all-admins-api', GetAllAdminsApi);
router.get("/admin/delete/:adminId", deleteAdminApi);
router.post('/admin/reset-password', changeAdminPasswordApi);

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
