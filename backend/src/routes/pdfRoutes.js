const fs = require("fs");
const path = require("path");
const express = require("express");
const multer = require("multer");
const { gerarRespostaDoDocumento } = require("../services/aiService");
const { criarDocumento, atualizarResumo, deletarDocumento, lerDocumentos, obterDocumento } = require("../services/documentService");

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
        // Criar documento instantaneamente
        const documento = criarDocumento(req.body.name, req.file.path);

        // Retornar resposta imediata
        res.json({
            message: "PDF enviado com sucesso",
            document: documento,
        });

        // Processar resumo assincronamente (sem await)
        gerarRespostaDoDocumento(
            req.file.path,
            "Faça um resumo deste documento em um parágrafo muito curto."
        )
            .then((summary) => {
                atualizarResumo(documento.id, summary);
                console.log(`Resumo gerado para documento ${documento.id}`);
            })
            .catch((error) => {
                console.error(`Erro ao gerar resumo para ${documento.id}:`, error);
                atualizarResumo(documento.id, `Erro ao gerar resumo: ${error.message}`);
            });
    } catch (error) {
        console.error("Erro ao processar PDF:", error);
        return res.status(500).json({
            message: "Erro ao processar PDF.",
            error: error.message,
        });
    }
});

router.delete("/upload/:id", (req, res) => {
    const { id } = req.params;

    try {
        const documentoRemovido = deletarDocumento(id);
        return res.json({
            message: "Documento removido com sucesso",
            document: documentoRemovido,
        });
    } catch (error) {
        console.error(`Erro ao excluir documento ${id}:`, error);
        return res.status(404).json({
            message: error.message,
        });
    }
});

router.get("/documents/:id/download", (req, res) => {
    const { id } = req.params;

    try {
        const documento = obterDocumento(id);

        if (!documento) {
            return res.status(404).json({ message: "Documento não encontrado." });
        }

        const filePath = path.resolve(documento.fileUrl);

        if (!fs.existsSync(filePath)) {
            return res.status(404).json({ message: "Arquivo não encontrado." });
        }

        return res.sendFile(filePath, {
            headers: {
                "Content-Disposition": `inline; filename="${path.basename(filePath)}"`,
            },
        });
    } catch (error) {
        console.error(`Erro ao abrir documento ${id}:`, error);
        return res.status(500).json({ message: "Erro ao abrir documento." });
    }
});

router.get("/documents", (req, res) => {
    try {
        const documentos = lerDocumentos();
        return res.json(documentos);
    } catch (error) {
        console.error("Erro ao ler documentos:", error);
        return res.status(500).json({ message: "Erro ao ler documentos." });
    }
});

router.post("/documents/:id/ask", async (req, res) => {
    const { id } = req.params;
    const { prompt } = req.body;

    if (!prompt) {
        return res.status(400).json({ message: "Campo 'prompt' é obrigatório." });
    }

    try {
        const documento = obterDocumento(id);
        if (!documento) {
            return res.status(404).json({ message: "Documento não encontrado." });
        }

        const answer = await gerarRespostaDoDocumento(documento.fileUrl, prompt);

        return res.json({ documentId: id, answer });
    } catch (error) {
        console.error("Erro ao processar ASK:", error);
        return res.status(500).json({ message: "Erro ao processar pergunta.", error: error.message });
    }
});

module.exports = router;
