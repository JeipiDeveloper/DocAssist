# DocAssist Backend API Documentation

## Visão geral
Este documento descreve os endpoints do backend do projeto `DocAssist`, o fluxo de upload de PDFs, armazenamento de metadados em JSON, e a integração com a IA via Ollama.

O servidor roda em `backend/server.js` e expõe as rotas diretamente na raiz do servidor (`http://localhost:3000` por padrão).

---

## Configuração necessária

1. Instalar dependências:

```bash
npm install
```

2. Configurar variáveis de ambiente em `.env`:

```env
API_KEY=<sua_chave_ollama>
```

3. Garantir que a pasta `backend/uploads/` exista ou será criada automaticamente ao armazenar PDFs.

---

## Modelo de dados de documento
Os documentos são salvos em `backend/data/documents.json` com esta estrutura:

```json
{
  "id": "<timestamp-string>",
  "name": "<nome do arquivo ou título>",
  "summary": null,
  "processing": true,
  "fileUrl": "backend/uploads/<nome-do-arquivo>.pdf",
  "createdAt": "2024-01-01T00:00:00.000Z"
}
```

### Campos principais
- `id`: identificador único gerado a partir do timestamp.
- `name`: nome enviado pelo frontend (`req.body.name`).
- `summary`: resumo gerado pela IA. Inicialmente `null`, depois atualizado.
- `processing`: indica se o resumo ainda está sendo gerado.
- `fileUrl`: caminho local do PDF no servidor.
- `createdAt`: carimbo de data/hora de criação.

---

## Endpoints

### 1. Upload de PDF
**POST** `/upload`

- Tipo de requisição: `multipart/form-data`
- Campos esperados:
  - `pdf` (arquivo)
  - `name` (texto)

#### Exemplo com `fetch`

```js
const formData = new FormData();
formData.append('pdf', fileInput.files[0]);
formData.append('name', 'Meu Documento');

const response = await fetch('http://localhost:3000/upload', {
  method: 'POST',
  body: formData,
});
const data = await response.json();
```

#### Resposta imediata
```json
{
  "message": "PDF enviado com sucesso",
  "document": {
    "id": "1681234567890",
    "name": "Meu Documento",
    "summary": null,
    "processing": true,
    "fileUrl": "backend/uploads/1681234567890-meu.pdf",
    "createdAt": "2026-05-21T..."
  }
}
```

#### Observação
O upload retorna imediatamente antes do resumo ser gerado. A geração do resumo ocorre assincronamente em segundo plano.

---

### 2. Listar todos os documentos
**GET** `/documents`

- Retorna todos os registros salvos em `backend/data/documents.json`.

#### Exemplo de uso
```js
const response = await fetch('http://localhost:3000/documents');
const documents = await response.json();
```

#### Resposta
```json
[
  {
    "id": "1681234567890",
    "name": "Meu Documento",
    "summary": null,
    "processing": true,
    "fileUrl": "backend/uploads/1681234567890-meu.pdf",
    "createdAt": "2026-05-21T..."
  }
]
```

---

### 3. Excluir documento
**DELETE** `/upload/:id`

- Parâmetro de rota:
  - `:id` = ID do documento

#### Exemplo de uso
```js
await fetch('http://localhost:3000/upload/1681234567890', {
  method: 'DELETE',
});
```

#### Resposta
```json
{
  "message": "Documento removido com sucesso",
  "document": {
    "id": "1681234567890",
    "name": "Meu Documento",
    "summary": null,
    "processing": true,
    "fileUrl": "backend/uploads/1681234567890-meu.pdf",
    "createdAt": "2026-05-21T..."
  }
}
```

---

### 4. Perguntar ao documento (ASK)
**POST** `/documents/:id/ask`

- Parâmetro de rota:
  - `:id` = ID do documento
- Corpo JSON:
  - `prompt` = texto da pergunta do usuário

#### Exemplo de uso
```js
const response = await fetch('http://localhost:3000/documents/1681234567890/ask', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ prompt: 'Qual é o tema principal?' }),
});
const answer = await response.json();
```

#### Resposta
```json
{
  "documentId": "1681234567890",
  "answer": "O documento trata principalmente de..."
}
```

#### Observação
Esta rota aguarda a resposta da IA antes de retornar ao frontend.

---

## Regras de integração para o frontend

1. **Upload**
   - Envie arquivos PDF como `multipart/form-data` para `/upload`.
   - Use o campo `name` para exibir o título no frontend.
   - Guarde o `id` retornado para consultas posteriores.

2. **Listagem**
   - Consulte `/documents` para obter a lista de documentos e o status `processing`.
   - Enquanto `processing` for `true`, o `summary` pode estar `null` ou conter o texto de erro.

3. **Status do resumo**
   - A geração do resumo é assíncrona após o upload.
   - Para saber quando o resumo estiver pronto, requeira `/documents` novamente ou verifique o campo `summary` de cada item.

4. **Perguntas específicas**
   - Para fazer perguntas a um documento já salvo, use `POST /documents/:id/ask`.
   - O corpo deve conter apenas `{ "prompt": "..." }`.

5. **Exclusão**
   - Para remover documento e PDF do servidor, use `DELETE /upload/:id`.

---

## Detalhes técnicos importantes

- O backend usa `express` + `multer` para receber uploads.
- Os PDFs são armazenados em `backend/uploads/`.
- Metadados são gravados em `backend/data/documents.json`.
- O resumo e as respostas de ASK são gerados usando `ollama.chat()`.
- A variável de ambiente `API_KEY` deve estar configurada para autenticar a chamada ao Ollama Cloud.

---

## Sugestão de fluxo frontend

1. Usuário seleciona PDF e envia para `/upload`.
2. O frontend mostra o documento na lista com `processing: true`.
3. O backend gera o resumo em background.
4. O frontend atualiza a lista periodicamente chamando `/documents`.
5. Quando o resumo estiver pronto, exibe `summary`.
6. Usuário pode usar `POST /documents/:id/ask` para perguntas específicas.

---

## Observações adicionais

- O campo `fileUrl` é um caminho local no servidor e não deve ser usado como URL pública sem expor o diretório.
- Se quiser entregar o arquivo para download no frontend, é necessário adicionar rota de download/servir arquivos estáticos no backend.

---

## Autenticação da área administrativa

As rotas de escrita (`POST /upload` e `DELETE /upload/:id`) exigem um token de sessão emitido no login. As rotas de leitura (`GET /documents`, `GET /documents/:id/download`, `POST /documents/:id/ask`) permanecem públicas.

### Credenciais
Definidas por variáveis de ambiente (veja `.env.example`):

```env
ADMIN_USER=admin
ADMIN_PASSWORD=admin
AUTH_SECRET=<segredo_para_assinar_o_token>
```

O token é assinado com HMAC-SHA256 usando `AUTH_SECRET`, expira em 8 horas e não depende de dependências externas.

### 5. Login do admin
**POST** `/admin/login`

- Corpo JSON: `{ "user": "...", "password": "..." }`
- Resposta `200`: `{ "message": "Login realizado com sucesso", "token": "<token>" }`
- Resposta `401`: `{ "message": "Usuário ou senha inválidos." }`

### 6. Verificar sessão
**GET** `/admin/verify`

- Header: `Authorization: Bearer <token>`
- Resposta `200`: `{ "authenticated": true }`
- Resposta `401`: `{ "message": "Não autorizado. Faça login para continuar." }`

### Uso do token nas rotas protegidas
Envie o token no header `Authorization` das requisições de upload e exclusão:

```js
fetch('http://localhost:3000/upload', {
  method: 'POST',
  headers: { Authorization: `Bearer ${token}` },
  body: formData,
});
```

Requisições sem token (ou com token inválido/expirado) recebem `401`.
