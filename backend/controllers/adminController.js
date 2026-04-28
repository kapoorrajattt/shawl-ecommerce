const Product = require("../models/Product");
const User = require("../models/User");

exports.createProduct = async (req, res) => {
  try {
    const { name, price, description, category, stock, featured } = req.body;
    if (!name || !price || !description || !category) {
      return res
        .status(400)
        .json({
          success: false,
          message: "name, price, description, category are required.",
        });
    }

    const images = req.files
      ? req.files.map((f) => `/uploads/${f.filename}`)
      : [];

    const product = await Product.create({
      name,
      price: Number(price),
      description,
      category,
      stock: Number(stock) || 0,
      featured: featured === "true",
      images,
    });

    res
      .status(201)
      .json({ success: true, message: "Product created!", product });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.updateProduct = async (req, res) => {
  try {
    const { name, price, description, category, stock, featured } = req.body;
    const updates = { name, description, category };
    if (price !== undefined) updates.price = Number(price);
    if (stock !== undefined) updates.stock = Number(stock);
    if (featured !== undefined) updates.featured = featured === "true";

    if (req.files && req.files.length > 0) {
      const newImages = req.files.map((f) => `/uploads/${f.filename}`);
      const existing = await Product.findById(req.params.id);
      updates.images = [...(existing.images || []), ...newImages];
    }

    const product = await Product.findByIdAndUpdate(req.params.id, updates, {
      new: true,
      runValidators: true,
    });
    if (!product)
      return res
        .status(404)
        .json({ success: false, message: "Product not found." });

    res.json({ success: true, message: "Product updated!", product });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.deleteProduct = async (req, res) => {
  try {
    const product = await Product.findByIdAndDelete(req.params.id);
    if (!product)
      return res
        .status(404)
        .json({ success: false, message: "Product not found." });
    res.json({ success: true, message: "Product deleted." });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.removeImage = async (req, res) => {
  try {
    const { index } = req.body;
    const product = await Product.findById(req.params.id);
    if (!product)
      return res
        .status(404)
        .json({ success: false, message: "Product not found." });

    product.images.splice(Number(index), 1);
    await product.save();
    res.json({
      success: true,
      message: "Image removed.",
      images: product.images,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.getAllUsers = async (req, res) => {
  try {
    const users = await User.find().select("-password").sort({ createdAt: -1 });
    res.json({ success: true, total: users.length, users });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.changeUserRole = async (req, res) => {
  try {
    const { role } = req.body;
    if (!["user", "admin"].includes(role)) {
      return res.status(400).json({ success: false, message: "Invalid role." });
    }
    const user = await User.findByIdAndUpdate(
      req.params.id,
      { role },
      { new: true },
    ).select("-password");
    if (!user)
      return res
        .status(404)
        .json({ success: false, message: "User not found." });
    res.json({ success: true, message: "Role updated.", user });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.getStats = async (req, res) => {
  try {
    const [totalProducts, totalUsers, outOfStock] = await Promise.all([
      Product.countDocuments(),
      User.countDocuments({ role: "user" }),
      Product.countDocuments({ stock: 0 }),
    ]);
    res.json({
      success: true,
      stats: { totalProducts, totalUsers, outOfStock },
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
