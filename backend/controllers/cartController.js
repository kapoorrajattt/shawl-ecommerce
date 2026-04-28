const Cart = require("../models/Cart");
const Product = require("../models/Product");

exports.getCart = async (req, res) => {
  try {
    let cart = await Cart.findOne({ user: req.user._id });
    if (!cart) cart = { items: [], total: 0 };
    const total = (cart.items || []).reduce((s, i) => s + i.price * i.qty, 0);
    res.json({ success: true, items: cart.items || [], total });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.addToCart = async (req, res) => {
  try {
    const { productId, qty = 1 } = req.body;
    if (!productId)
      return res
        .status(400)
        .json({ success: false, message: "productId required." });

    const product = await Product.findById(productId);
    if (!product)
      return res
        .status(404)
        .json({ success: false, message: "Product not found." });
    if (product.stock < 1)
      return res.status(400).json({ success: false, message: "Out of stock." });

    let cart = await Cart.findOne({ user: req.user._id });
    if (!cart) cart = new Cart({ user: req.user._id, items: [] });

    const existing = cart.items.find((i) => i.product.toString() === productId);
    if (existing) {
      existing.qty += Number(qty);
    } else {
      cart.items.push({
        product: product._id,
        name: product.name,
        price: product.price,
        qty: Number(qty),
        image: product.images[0] || "",
      });
    }

    await cart.save();
    const total = cart.items.reduce((s, i) => s + i.price * i.qty, 0);
    res.json({
      success: true,
      message: `${product.name} added to cart!`,
      items: cart.items,
      total,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.updateQty = async (req, res) => {
  try {
    const { productId, qty } = req.body;
    if (!productId || qty === undefined) {
      return res
        .status(400)
        .json({ success: false, message: "productId and qty required." });
    }

    const cart = await Cart.findOne({ user: req.user._id });
    if (!cart)
      return res
        .status(404)
        .json({ success: false, message: "Cart not found." });

    const item = cart.items.find((i) => i.product.toString() === productId);
    if (!item)
      return res
        .status(404)
        .json({ success: false, message: "Item not in cart." });

    if (Number(qty) <= 0) {
      cart.items = cart.items.filter((i) => i.product.toString() !== productId);
    } else {
      item.qty = Number(qty);
    }

    await cart.save();
    const total = cart.items.reduce((s, i) => s + i.price * i.qty, 0);
    res.json({ success: true, items: cart.items, total });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.removeFromCart = async (req, res) => {
  try {
    const cart = await Cart.findOne({ user: req.user._id });
    if (!cart)
      return res
        .status(404)
        .json({ success: false, message: "Cart not found." });

    cart.items = cart.items.filter(
      (i) => i.product.toString() !== req.params.productId,
    );
    await cart.save();
    const total = cart.items.reduce((s, i) => s + i.price * i.qty, 0);
    res.json({
      success: true,
      message: "Item removed.",
      items: cart.items,
      total,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.clearCart = async (req, res) => {
  try {
    await Cart.findOneAndDelete({ user: req.user._id });
    res.json({ success: true, message: "Cart cleared.", items: [], total: 0 });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.syncCart = async (req, res) => {
  try {
    const { items } = req.body;
    if (!Array.isArray(items)) {
      return res
        .status(400)
        .json({ success: false, message: "items array required." });
    }

    let cart = await Cart.findOne({ user: req.user._id });
    if (!cart) cart = new Cart({ user: req.user._id, items: [] });

    for (const { productId, qty } of items) {
      const product = await Product.findById(productId);
      if (!product) continue;
      const existing = cart.items.find(
        (i) => i.product.toString() === productId,
      );
      if (existing) {
        existing.qty += Number(qty);
      } else {
        cart.items.push({
          product: product._id,
          name: product.name,
          price: product.price,
          qty: Number(qty),
          image: product.images[0] || "",
        });
      }
    }

    await cart.save();
    const total = cart.items.reduce((s, i) => s + i.price * i.qty, 0);
    res.json({ success: true, items: cart.items, total });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
