const API_BASE = 'http://localhost:3000';
const listEl = document.getElementById('list');
const modal = document.getElementById('modal');
const deleteConfirmModal = document.getElementById('deleteConfirmModal');
const btnUpload = document.getElementById('btnUpload');
const cancel = document.getElementById('cancel');
const cancelDelete = document.getElementById('cancelDelete');
const confirmDelete = document.getElementById('confirmDelete');
const deleteConfirmMessage = document.getElementById('deleteConfirmMessage');
const uploadForm = document.getElementById('uploadForm');

let pendingDelete = null;

async function fetchDocuments() {
  const response = await fetch(`${API_BASE}/documents`);

  if (!response.ok) {
    throw new Error('Não foi possível carregar os documentos.');
  }

  return response.json();
}

async function uploadDocument(name, file) {
  const formData = new FormData();
  formData.append('name', name);
  formData.append('pdf', file);

  const response = await fetch(`${API_BASE}/upload`, {
    method: 'POST',
    body: formData,
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(data.message || 'Não foi possível enviar o documento.');
  }

  return data;
}

async function deleteDocument(id) {
  const response = await fetch(`${API_BASE}/upload/${id}`, {
    method: 'DELETE',
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(data.message || 'Não foi possível remover o documento.');
  }

  return data;
}

function render(list) {
  if (!Array.isArray(list) || list.length === 0) {
    listEl.innerHTML = '<div class="small">Nenhum documento encontrado.</div>';
    return;
  }

  listEl.innerHTML = '';

  list.forEach((item) => {
    const statusText = item.processing
      ? 'Resumo em processamento'
      : (item.summary || 'Resumo ainda não disponível');

    const downloadUrl = `${API_BASE}/documents/${item.id}/download`;

    const itemCard = document.createElement('div');
    itemCard.className = 'list-item';

    const content = document.createElement('div');

    const title = document.createElement('div');
    title.className = 'list-item-title';
    title.textContent = item.name;

    const status = document.createElement('div');
    status.className = 'list-item-status small';
    status.textContent = statusText;

    const date = document.createElement('div');
    date.className = 'list-item-date small';
    date.textContent = new Date(item.createdAt).toLocaleString();

    content.append(title, status, date);

    const actions = document.createElement('div');
    actions.className = 'list-item-actions';

    const openLink = document.createElement('a');
    openLink.className = 'btn';
    openLink.href = downloadUrl;
    openLink.target = '_blank';
    openLink.rel = 'noreferrer';
    openLink.textContent = 'Abrir PDF';

    const deleteButton = document.createElement('button');
    deleteButton.type = 'button';
    deleteButton.className = 'link-back delete-button';
    deleteButton.textContent = 'Excluir';
    deleteButton.addEventListener('click', () => {
      pendingDelete = item;
      deleteConfirmMessage.textContent = `Deseja mesmo excluir o documento "${item.name}"?`;
      deleteConfirmModal.classList.add('open');
    });

    actions.append(openLink, deleteButton);
    itemCard.append(content, actions);
    listEl.appendChild(itemCard);
  });
}

async function load() {
  try {
    const data = await fetchDocuments();
    render(data);
  } catch (error) {
    listEl.innerHTML = `<div class="small">${error.message}</div>`;
  }
}

load();
setInterval(load, 5000);

btnUpload.addEventListener('click', () => modal.classList.add('open'));
cancel.addEventListener('click', () => modal.classList.remove('open'));

cancelDelete.addEventListener('click', () => {
  pendingDelete = null;
  deleteConfirmModal.classList.remove('open');
});

confirmDelete.addEventListener('click', async () => {
  if (!pendingDelete) {
    return;
  }

  try {
    await deleteDocument(pendingDelete.id);
    deleteConfirmModal.classList.remove('open');
    pendingDelete = null;
    await load();
  } catch (error) {
    alert(error.message);
  }
});

uploadForm.addEventListener('submit', async (event) => {
  event.preventDefault();

  const name = document.getElementById('title').value.trim();
  const fileInput = document.getElementById('file');
  const file = fileInput.files[0];

  if (!name) {
    alert('Preencha o nome do PDF');
    return;
  }

  if (!file) {
    alert('Selecione um PDF');
    return;
  }

  try {
    await uploadDocument(name, file);
    modal.classList.remove('open');
    uploadForm.reset();
    await load();
  } catch (error) {
    alert(error.message);
  }
});
