const express = require("express");
const multer = require("multer");
const { gerarRespostaDoDocumento } = require("../services/aiService");

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

router.post("/upload", upload.single("pdf"), async (req, res) => {
    if (!req.file) {
        return res.status(400).json({ message: "Nenhum arquivo PDF foi enviado." });
    }

    try {
        const summary = await gerarRespostaDoDocumento(
            req.file.path,
            "Faça um resumo breve deste documento."
        );

        return res.json({
            message: "PDF enviado com sucesso",
            summary,
        });
    } catch (error) {
        console.error("Erro ao processar PDF:", error);
        return res.status(500).json({
            message: "Erro ao gerar resumo do PDF.",
            error: error.message,
        });
    }
});

module.exports = router;
