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
    'Quem pode se inscrever?',
    'Requisitos essenciais?',
    'Prazos principais?'
];

function formatDate(value) {
    if (!value) return 'Data indisponível';
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return 'Data indisponível';
    return date.toLocaleString('pt-BR');
}

function escapeHTML(value) {
    return value
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}

function renderInlineMarkdown(value) {
    let rendered = value;

    rendered = rendered.replace(/`([^`]+)`/g, '<code>$1</code>');
    rendered = rendered.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" rel="noreferrer">$1</a>');
    rendered = rendered.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
    rendered = rendered.replace(/__([^_]+)__/g, '<strong>$1</strong>');
    rendered = rendered.replace(/\*([^*]+)\*/g, '<em>$1</em>');
    rendered = rendered.replace(/_([^_]+)_/g, '<em>$1</em>');

    return rendered;
}

function renderMarkdown(value) {
    const escaped = escapeHTML(value).replace(/\r\n/g, '\n');
    const lines = escaped.split('\n');
    const pieces = [];
    let inList = false;

    lines.forEach((line) => {
        const trimmed = line.trim();

        if (!trimmed) {
            if (inList) {
                pieces.push('</ul>');
                inList = false;
            }
            pieces.push('<br>');
            return;
        }

        const bulletMatch = trimmed.match(/^[-*]\s+(.+)$/);

        if (bulletMatch) {
            if (!inList) {
                pieces.push('<ul>');
                inList = true;
            }

            pieces.push(`<li>${renderInlineMarkdown(bulletMatch[1])}</li>`);
            return;
        }

        if (inList) {
            pieces.push('</ul>');
            inList = false;
        }

        pieces.push(`<p>${renderInlineMarkdown(line)}</p>`);
    });

    if (inList) {
        pieces.push('</ul>');
    }

    return pieces.join('');
}

function createBubble(role, text, extraClass = '') {
    const row = document.createElement('div');
    row.className = `message-row ${role}`;

    const bubble = document.createElement('div');
    bubble.className = `message-bubble ${extraClass}`;

    if (extraClass.includes('loading')) {
        bubble.innerHTML = `
            <span class="thinking-text">${escapeHTML(text)}</span>
            <span class="thinking-dots" aria-hidden="true">
                <span class="dot"></span>
                <span class="dot"></span>
                <span class="dot"></span>
            </span>
        `;
    } else if (role === 'ai') {
        bubble.innerHTML = renderMarkdown(text);
    } else {
        bubble.innerHTML = escapeHTML(text).replace(/\n/g, '<br>');
    }

    row.appendChild(bubble);
    chatHistory.appendChild(row);
    chatHistory.scrollTop = chatHistory.scrollHeight;
}

function renderFakeStream(answer) {
    const row = document.createElement('div');
    row.className = 'message-row ai';

    const bubble = document.createElement('div');
    bubble.className = 'message-bubble';
    bubble.textContent = '';

    row.appendChild(bubble);
    chatHistory.appendChild(row);
    chatHistory.scrollTop = chatHistory.scrollHeight;
    row.scrollIntoView({ block: 'end' });

    let index = 0;

    const step = () => {
        const chunkSize = Math.max(1, Math.ceil((answer.length - index) / 24));
        index = Math.min(answer.length, index + chunkSize);
        bubble.textContent = answer.slice(0, index);
        chatHistory.scrollTop = chatHistory.scrollHeight;
        row.scrollIntoView({ block: 'end' });

        if (index < answer.length) {
            window.setTimeout(step, 33);
            return;
        }

        bubble.innerHTML = renderMarkdown(answer);
        chatHistory.scrollTop = chatHistory.scrollHeight;
        row.scrollIntoView({ block: 'end' });
    };

    step();
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
    createBubble('ai', 'Analisando', 'loading');

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
        renderFakeStream(answer);
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
