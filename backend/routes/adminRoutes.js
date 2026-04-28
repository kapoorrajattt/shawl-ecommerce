const express = require("express");
const router = express.Router();
const {
  createProduct,
  updateProduct,
  deleteProduct,
  removeImage,
  getAllUsers,
  changeUserRole,
  getStats,
} = require("../controllers/adminController");
const { protect, restrictToAdmin } = require("../middleware/authMiddleware");
const upload = require("../middleware/uploadMiddleware");

router.use(protect, restrictToAdmin);
router.get("/stats", getStats);
router.post("/products", upload.array("images", 6), createProduct);
router.put("/products/:id", upload.array("images", 6), updateProduct);
router.delete("/products/:id", deleteProduct);
router.patch("/products/:id/images", removeImage);
router.get("/users", getAllUsers);
router.patch("/users/:id/role", changeUserRole);

module.exports = router;
