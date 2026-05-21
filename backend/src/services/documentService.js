const fs = require("fs");
const path = require("path");

const DOCUMENTS_FILE = path.join(__dirname, "../../data/documents.json");

function lerDocumentos() {
    if (!fs.existsSync(DOCUMENTS_FILE)) {
        return [];
    }
    const data = fs.readFileSync(DOCUMENTS_FILE, "utf-8");
    return data.trim() ? JSON.parse(data) : [];
}

function salvarDocumentos(documentos) {
    const dir = path.dirname(DOCUMENTS_FILE);
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(DOCUMENTS_FILE, JSON.stringify(documentos, null, 2));
}

function criarDocumento(nome, caminhoArquivo) {
    const id = Date.now().toString();
    const documento = {
        id,
        name: nome,
        summary: null,
        processing: true,
        fileUrl: caminhoArquivo,
        createdAt: new Date().toISOString(),
    };

    const documentos = lerDocumentos();
    documentos.push(documento);
    salvarDocumentos(documentos);

    return documento;
}

function atualizarResumo(documentoId, resumo) {
    const documentos = lerDocumentos();
    const documento = documentos.find((d) => d.id === documentoId);

    if (!documento) {
        throw new Error(`Documento com ID ${documentoId} não encontrado.`);
    }

    documento.summary = resumo;
    documento.processing = false;

    salvarDocumentos(documentos);
    return documento;
}

function obterDocumento(documentoId) {
    const documentos = lerDocumentos();
    return documentos.find((d) => d.id === documentoId);
}

module.exports = {
    lerDocumentos,
    salvarDocumentos,
    criarDocumento,
    atualizarResumo,
    obterDocumento,
};
