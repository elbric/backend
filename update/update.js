const express = require("express")
const router = express.Router()
const { admin, db } = require("../middleware/middleware"); // sesuaikan path
const cors = require("cors");
const bodyParser = require("body-parser");

router.get("/" , (req, res) => {
res.send("halo")
})


router.put("/update2",  async (req, res) => {
  const userData = req.body;

  try {
    const userRef = db.collection("users").doc(req.user.uid);

    await userRef.update(userData);

    res.json({ message: "updated" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});







module.exports = router