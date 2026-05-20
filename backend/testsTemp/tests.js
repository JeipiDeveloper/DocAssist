require("dotenv").config();

const fs = require("fs");
const pdf = require("pdf-parse");

async function lerPDF(filePath) {
    const buffer = fs.readFileSync(filePath);
    const data = await pdf(buffer);
    return data.text;
}

const configPrompt =
"Você é um assistente de consulta de documentos acadêmicos relacionados à universidade. "+
"Você responde perguntas, faz buscas e resumos relacionados ao documento fornecido, "+
"de forma clara e concisa e sem introduções, apenas o que for pedido.";

async function perguntarIA(promptCompleto){

    const response = await fetch(
        "https://openrouter.ai/api/v1/chat/completions",
        {
            method: "POST",

            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${process.env.API_KEY}`
            },

            body: JSON.stringify({
                model: "deepseek/deepseek-v4-flash:free",

                messages: [
                    {
                        role: "user",
                        content: promptCompleto
                    }
                ],
                "reasoning": {"enabled": false}
            })
        }
    );

    const data = await response.json();

    console.log(data.choices[0].message.content);
}

async function main() {

    const edital = await lerPDF("./backend/testsTemp/editalteste.pdf");

    const promptUsuario = "Faça um resumo do edital";

    const promptCompleto = `
        ${configPrompt}

        DOCUMENTO:
        ${edital}

        PERGUNTA:
        ${promptUsuario}
    `;

    await perguntarIA(promptCompleto);

}

main();