const express = require("express");
const app = express();
const bodyParser = require("body-parser");
const cors = require("cors");
const { Timestamp } = require("firebase-admin/firestore");
const serviceAccount = require(process.env.FIREBASE_SERVICE_ACCOUNT);
const updatedoc = require("./update/update");
const withdraw = require("./withdraw/withdraw")
const { admin, db } = require("./middleware/middleware");
// Middleware
app.use(cors());
app.use(bodyParser.json());
const PORT = process.env.PORT || 5000;
// Middleware: Verifikasi Token
async function verifyToken(req, res, next) {
  const token = req.headers.authorization?.split("Bearer ")[1];
  if (!token) {
    return res.status(401).json({ error: "Token not found" });
  }

  try {
    const decoded = await admin.auth().verifyIdToken(token);
    req.user = decoded;
    next();
  } catch (err) {
    return res.status(403).json({ error: "Invalid token" });
  }
}
app.get("/", (req, res) => {
  res.send("API Backend aktif 🚀");
});

app.post("/register", async (req, res) => {
  const {
    name,
    email,
    username,
    bank,
    password,
    rekening,
    namaRekening,
    whatsapp,
  } = req.body;

  // 🔒 Validasi input awal
  if (
    !name ||
    !email ||
    !username ||
    !bank ||
    !rekening ||
    !namaRekening ||
    !whatsapp
  ) {
    return res.status(400).json({
      message: "Mohon lengkapi semua data yang dibutuhkan.",
    });
  }

  try {
    const usernameQuery = await db
      .collection("users")
      .where("username", "==", username)
      .get();

    if (!usernameQuery.empty) {
      return res.status(400).json({ message: "Username sudah digunakan." });
    }

    const newUser = await admin.auth().createUser({
      email,
      password,
    });

    const uid = newUser.uid;

    await db.collection("users").doc(newUser.uid).set({
      uid,
      name,
      email,
      username,
      bank,
      rekening,
      namaRekening,
      whatsapp,
      verifikasi: false,
      totalStreams: 0,
      Pendapatan: 0,
      youtube: "",
      spotify: "",
      platforms: 0,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    return res.status(201).json({
      message: "Registrasi berhasil.",
      uid,
    });
  } catch (err) {
    console.error("❌ Error saat registrasi:", err);
    return res.status(500).json({
      message: "Terjadi kesalahan di server.",
      error: err?.message || "Unknown error",
    });
  }
});

// app.post("/validate-register", async (req, res) => {
//   const { name, email, username, sponsorUsername, bank, rekening, whatsapp } =
//     req.body;

//   // 🔒 Validasi kosong
//   if (
//     !name ||
//     !email ||
//     !username ||
//     !sponsorUsername ||
//     !bank ||
//     !rekening ||
//     !whatsapp
//   ) {
//     return res.status(400).json({
//       message: "Mohon lengkapi semua data yang dibutuhkan.",
//     });
//   }

//   if (username === sponsorUsername) {
//     return res.status(400).json({
//       message: "Username sponsor tidak boleh sama dengan username Anda.",
//     });
//   }

//   try {
//     // ❌ Cek apakah username sudah digunakan
//     const usernameQuery = await db
//       .collection("users")
//       .where("username", "==", username)
//       .limit(1)
//       .get();

//     if (!usernameQuery.empty) {
//       return res.status(400).json({ message: "Username sudah digunakan." });
//     }

//     // ❌ Validasi sponsorUsername
//     // const sponsorQuery = await db
//     //   .collection("users")
//     //   .where("username", "==", sponsorUsername)
//     //   .limit(1)
//     //   .get();

//     // if (sponsorQuery.empty) {
//     //   return res
//     //     .status(400)
//     //     .json({ message: "Username sponsor tidak ditemukan." });
//     // }

//     // ✅ Semua valid
//     return res.status(200).json({ message: "Validasi berhasil." });
//   } catch (err) {
//     console.error("❌ Error validasi registrasi:", err);
//     return res.status(500).json({
//       message: "Terjadi kesalahan saat validasi.",
//       error: err?.message || "Unknown error",
//     });
//   }
// });

app.use("/update", verifyToken, updatedoc);
app.use("/withdraw", verifyToken,withdraw );

app.listen(PORT, () => {
  console.log(`🚀 Server berjalan di http://localhost:${PORT}`);
});
