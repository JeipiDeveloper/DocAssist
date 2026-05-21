require("dotenv").config();
const { lerPDF } = require("./pdfService");

const model = "google/gemma-4-31b-it:free"
const configPrompt =
"Você é um assistente de consulta de documentos acadêmicos relacionados à universidade. " +
"Você responde perguntas, faz buscas e resumos relacionados ao documento fornecido, " +
"de forma clara e concisa e sem introduções, apenas o que for pedido.";

async function perguntarIA(promptCompleto) {
    const response = await fetch(
        "https://openrouter.ai/api/v1/chat/completions",
        {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${process.env.API_KEY}`
            },
            body: JSON.stringify({
                model: model,
                messages: [
                    {
                        role: "user",
                        content: promptCompleto
                    }
                ],
                reasoning: { enabled: false }
            })
        }
    );

    if (!response.ok) {
        const errorBody = await response.text();
        throw new Error(`OpenRouter API error ${response.status}: ${errorBody}`);
    }

    const data = await response.json();
    return data?.choices?.[0]?.message?.content || "";
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
