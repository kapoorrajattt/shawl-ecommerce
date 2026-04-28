const express = require("express");
const router = express.Router();
const {
  getAllProducts,
  getProduct,
} = require("../controllers/productController");

router.get("/", getAllProducts);
router.get("/:id", getProduct);

module.exports = router;
