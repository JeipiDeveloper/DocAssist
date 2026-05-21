const express = require("express");
const multer = require("multer");

const router = express.Router();

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, "backend/uploads/");
    },
    filename: function (req, file, cb) {
        cb(null, `${Date.now()}-${file.originalname}`);
    },
});

const upload = multer({ storage });

router.post("/upload", upload.single("pdf"), (req, res) => {
    console.log(req.file);
    res.json({
        message: "PDF enviado com sucesso",
    });
});

module.exports = router;
