const API_BASE = 'http://localhost:3000';
const params = new URLSearchParams(window.location.search);
const documentId = params.get('id');

const documentTitle = document.getElementById('documentTitle');
const documentDate = document.getElementById('documentDate');
const downloadLink = document.getElementById('downloadLink');
const summaryText = document.getElementById('summaryText');
const chatHistory = document.getElementById('chatHistory');
const suggestedQuestions = document.getElementById('suggestedQuestions');
const askForm = document.getElementById('askForm');
const promptInput = document.getElementById('promptInput');
const sendButton = document.getElementById('sendButton');

const suggestions = [
    'Quais são os requisitos principais?',
    'Qual é o período de inscrição?',
    'Quais documentos são necessários?',
    'Há cotas ou critérios especiais?'
];

function formatDate(value) {
    if (!value) return 'Data indisponível';
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return 'Data indisponível';
    return date.toLocaleString('pt-BR');
}

function createBubble(role, text, extraClass = '') {
    const row = document.createElement('div');
    row.className = `message-row ${role}`;

    const bubble = document.createElement('div');
    bubble.className = `message-bubble ${extraClass}`;
    bubble.textContent = text;

    row.appendChild(bubble);
    chatHistory.appendChild(row);
    chatHistory.scrollTop = chatHistory.scrollHeight;
}

function renderSuggestions() {
    suggestedQuestions.innerHTML = '';
    suggestions.forEach((item) => {
        const button = document.createElement('button');
        button.type = 'button';
        button.className = 'suggestion-chip';
        button.textContent = item;
        button.addEventListener('click', () => {
            promptInput.value = item;
            promptInput.focus();
        });
        suggestedQuestions.appendChild(button);
    });
}

function setLoadingState(message) {
    chatHistory.innerHTML = '';
    createBubble('ai', message, 'loading');
}

async function loadDocument() {
    if (!documentId) {
        setLoadingState('Nenhum edital foi selecionado. Volte ao site e abra um edital para iniciar o chat.');
        return;
    }

    try {
        const response = await fetch(`${API_BASE}/documents`);
        if (!response.ok) {
            throw new Error('Não foi possível carregar os editais.');
        }

        const documents = await response.json();
        const current = documents.find((item) => String(item.id) === String(documentId));

        if (!current) {
            setLoadingState('Não foi possível localizar este edital no backend. Tente voltar ao site e clicar em outro edital.');
            return;
        }

        documentTitle.textContent = current.name || 'Documento sem título';
        documentDate.textContent = formatDate(current.createdAt);
        downloadLink.href = `${API_BASE}/documents/${current.id}/download`;

        if (current.processing) {
            summaryText.textContent = 'O resumo ainda está sendo gerado. Tente novamente em alguns instantes.';
        } else if (current.summary) {
            summaryText.textContent = current.summary;
        } else {
            summaryText.textContent = 'Ainda não há resumo disponível para este edital.';
        }

        chatHistory.innerHTML = '';
        createBubble('ai', `Olá! Vou te ajudar a entender o edital "${current.name || 'este documento'}". Faça sua pergunta quando quiser.`);
    } catch (error) {
        console.error(error);
        setLoadingState('Não foi possível conectar ao backend do DocAssist. Verifique se o servidor está rodando em http://localhost:3000.');
    }
}

async function sendQuestion(event) {
    event.preventDefault();
    const prompt = promptInput.value.trim();

    if (!prompt || !documentId) {
        return;
    }

    createBubble('user', prompt);
    promptInput.value = '';
    sendButton.disabled = true;
    createBubble('ai', 'Consultando o documento...', 'loading');

    try {
        const response = await fetch(`${API_BASE}/documents/${documentId}/ask`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ prompt })
        });

        const payload = await response.json();
        const answer = payload?.answer || payload?.message || 'Não foi possível gerar uma resposta agora.';

        chatHistory.removeChild(chatHistory.lastElementChild);
        createBubble('ai', answer);
    } catch (error) {
        console.error(error);
        chatHistory.removeChild(chatHistory.lastElementChild);
        createBubble('ai', 'Não foi possível responder agora. Tente novamente em instantes.', 'error');
    } finally {
        sendButton.disabled = false;
        promptInput.focus();
    }
}

renderSuggestions();
askForm.addEventListener('submit', sendQuestion);
loadDocument();
