require("dotenv").config();
const { Ollama } = require("ollama");
const { lerPDF } = require("./pdfService");

const model = "gemma4:31b-cloud"
const configPrompt =
"Você é um assistente de consulta de documentos acadêmicos relacionados à universidade. " +
"Você responde perguntas, faz buscas e resumos relacionados ao documento fornecido, " +
"de forma clara, concisa e sem introduções ou conclusões/perguntas, apenas o que for pedido.";

const ollama = new Ollama({
  host: 'https://ollama.com',
  headers: { Authorization: `Bearer ${process.env.API_KEY}` },
})

async function perguntarIA(promptCompleto) {
    const response = await ollama.chat({
        model: model,
        messages: [
            {
                role: "user",
                content: promptCompleto
            }
        ]
    });

    return response?.message?.content || "";
}

function montarPrompt(documento, perguntaUsuario) {
    return `
        ${configPrompt}

        DOCUMENTO:
        ${documento}

        PERGUNTA:
        ${perguntaUsuario}
    `;
}

async function gerarRespostaDoDocumento(pdfPath, perguntaUsuario) {
    const documento = await lerPDF(pdfPath);
    const promptCompleto = montarPrompt(documento, perguntaUsuario);
    return await perguntarIA(promptCompleto);
}

module.exports = {
    perguntarIA,
    montarPrompt,
    gerarRespostaDoDocumento
};
