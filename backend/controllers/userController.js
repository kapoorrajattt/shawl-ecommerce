const User = require("../models/User");

exports.getProfile = async (req, res) => {
  res.json({
    success: true,
    user: {
      id: req.user._id,
      name: req.user.name,
      email: req.user.email,
      phone: req.user.phone,
      address: req.user.address,
      role: req.user.role,
    },
  });
};

exports.updateProfile = async (req, res) => {
  try {
    const { name, phone, address } = req.body;
    const updated = await User.findByIdAndUpdate(
      req.user._id,
      { name, phone, address },
      { new: true, runValidators: true },
    );
    res.json({
      success: true,
      message: "Profile updated successfully!",
      user: {
        id: updated._id,
        name: updated.name,
        email: updated.email,
        phone: updated.phone,
        address: updated.address,
      },
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword) {
      return res
        .status(400)
        .json({ success: false, message: "Both fields required." });
    }

    const user = await User.findById(req.user._id).select("+password");
    if (!(await user.comparePassword(currentPassword))) {
      return res
        .status(401)
        .json({ success: false, message: "Current password is incorrect." });
    }

    user.password = newPassword;
    await user.save();
    res.json({ success: true, message: "Password changed successfully!" });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
