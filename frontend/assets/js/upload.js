const API_BASE = 'http://localhost:3000';
const form = document.getElementById('uploadForm');
const submitBtn = document.getElementById('submitBtn');
const statusMessage = document.getElementById('statusMessage');

form.addEventListener('submit', async (event) => {
    event.preventDefault();

    const name = document.getElementById('name').value.trim();
    const pdf = document.getElementById('pdf').files[0];

    if (!pdf) {
        statusMessage.textContent = 'Selecione um arquivo PDF.';
        return;
    }

    submitBtn.disabled = true;
    submitBtn.textContent = 'Enviando...';
    statusMessage.textContent = 'Enviando o arquivo para o backend...';

    try {
        const formData = new FormData();
        formData.append('name', name);
        formData.append('pdf', pdf);

        const response = await fetch(`${API_BASE}/upload`, {
            method: 'POST',
            body: formData,
        });

        const data = await response.json().catch(() => ({}));

        if (!response.ok) {
            throw new Error(data.message || 'Não foi possível enviar o edital.');
        }

        statusMessage.textContent = `Upload concluído: ${data.document?.name || name}. O resumo será gerado automaticamente.`;
        form.reset();
    } catch (error) {
        statusMessage.textContent = error.message || 'Erro ao enviar o edital.';
    } finally {
        submitBtn.disabled = false;
        submitBtn.textContent = 'Enviar';
    }
});
