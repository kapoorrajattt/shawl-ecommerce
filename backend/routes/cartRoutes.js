const express = require("express");
const router = express.Router();
const {
  getCart,
  addToCart,
  updateQty,
  removeFromCart,
  clearCart,
  syncCart,
} = require("../controllers/cartController");
const { protect } = require("../middleware/authMiddleware");

router.use(protect);

router.get("/", getCart);
router.post("/add", addToCart);
router.patch("/update", updateQty);
router.delete("/remove/:productId", removeFromCart);
router.delete("/clear", clearCart);
router.post("/sync", syncCart);

module.exports = router;
