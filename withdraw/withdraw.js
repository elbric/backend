const express = require("express");
const router = express.Router();

const { admin, db } = require("../middleware/middleware");

// TEST
router.get("/", (req, res) => {
  res.send("halo");
});

/*
  WITHDRAW
  minimal: 500000
*/

router.post("/wd", async (req, res) => {
  try {
    const uid = req.user.uid;

    const { amount, bank, name } = req.body;

    // VALIDASI
    if (!amount || isNaN(amount)) {
      return res.status(400).json({
        message: "Jumlah withdraw tidak valid",
      });
    }

    // MINIMAL WD
    if (Number(amount) < 500000) {
      return res.status(400).json({
        message: "Minimal withdraw Rp 500.000",
      });
    }

    // REF BALANCE
    const balanceRef = db
      .collection("balances")
      .doc(uid);

    const balanceSnap =
      await balanceRef.get();

    // CEK SALDO ADA
    if (!balanceSnap.exists) {
      return res.status(404).json({
        message: "Saldo tidak ditemukan",
      });
    }

    const balanceData =
      balanceSnap.data();

    const currentSaldo =
      balanceData.saldo || 0;

    // CEK SALDO CUKUP
    if (currentSaldo < Number(amount)) {
      return res.status(400).json({
        message: "Saldo tidak cukup",
      });
    }

    // KURANGI SALDO
    await balanceRef.update({
      saldo:
        admin.firestore.FieldValue.increment(
          -Number(amount)
        ),
    });

    // HISTORY WD
    await balanceRef
      .collection("withdraw_history")
      .add({
        amount: Number(amount),

        bank,

        name,

        status: "pending",

        createdAt:
          admin.firestore.FieldValue.serverTimestamp(),
      });

    return res.json({
      success: true,
      message:
        "Withdraw berhasil diajukan",
    });
  } catch (err) {
    console.log(err);

    return res.status(500).json({
      message: err.message,
    });
  }
});

module.exports = router;