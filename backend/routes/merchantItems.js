const express = require("express");
const router = express.Router();
const User = require("../models/User");
const Transaction = require("../models/Transaction"); // Needed for summary route



router.get("/details/:userId", async (req, res) => {
  try {
    const merchant = await User.findOne({ userId: req.params.userId, role: "merchant" });
    if (!merchant) return res.status(404).json({ error: "Merchant not found" });
    res.json({ items: merchant.items || [] });
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch merchant items" });
  }
});


// Create new merchant record in Merchants collection
router.post("/", async (req, res) => {
  try {
    const { merchantId, merchantName, walletId } = req.body;
    const existing = await Merchant.findOne({ merchantId });
    if (existing) return res.status(400).json({ error: "Merchant already exists" });

    const merchant = new Merchant({ merchantId, merchantName, walletId, items: [] });
    await merchant.save();
    res.status(201).json(merchant);
  } catch (err) {
    res.status(500).json({ error: "Failed to create merchant" });
  }
});

// Update items array
router.get("/:userId/items", async (req, res) => {
  const { userId } = req.params;
  try {
    const merchant = await User.findOne({ userId });
    if (!merchant) return res.status(404).json({ error: "Merchant not found" });

    res.json(merchant.items); // ✅ returns clean array
  } catch (err) {
    console.error("❌ Error fetching merchant items:", err.message);
    res.status(500).json({ error: "Server error" });
  }
});





router.get("/summary/:userId", async (req, res) => {
  try {
    const merchant = await User.findOne({ userId: req.params.userId, role: "merchant" });
    if (!merchant) return res.status(404).json({ error: "Merchant not found" });

    const totalItems = merchant.items.length;
    const totalCost = merchant.items.reduce((sum, item) => sum + (item.costPrice || 0), 0);
    const totalRevenue = merchant.items.reduce((sum, item) => sum + (item.sellingPrice || 0), 0);
    const totalProfit = totalRevenue - totalCost;

    const transactions = await Transaction.find({ type: "purchase", merchantId: req.params.userId });
    const totalItemsSold = transactions.reduce((sum, tx) => {
      return sum + (Array.isArray(tx.items) ? tx.items.reduce((s, item) => s + (item.quantity || 1), 0) : 0);
    }, 0);

    res.json({
      walletBalance: merchant.walletID?.balance || 0, // fallback if wallet is not fetched separately
      totalItems,
      totalCost,
      totalRevenue,
      totalProfit,
      totalItemsSold
    });

  } catch (err) {
    console.error("❌ Error in merchant summary:", err.message);
    res.status(500).json({ error: "Failed to fetch merchant summary" });
  }
});


// PUT: Update merchant items array
router.put("/:userId/items", async (req, res) => {
  const { userId } = req.params;
  const { items } = req.body;

  try {
    const updatedMerchant = await User.findOneAndUpdate(
      { userId, role: "merchant" },
      { $set: { items } },
      { new: true }
    );

    if (!updatedMerchant) {
      return res.status(404).json({ error: "Merchant not found" });
    }

    res.json({ items: updatedMerchant.items });
  } catch (err) {
    console.error("❌ Failed to update merchant items:", err.message);
    res.status(500).json({ error: "Failed to update items" });
  }
});


module.exports = router;
