API Documentation — DocAssist Backend

Base URL: `http://localhost:3000`

Endpoints

- GET /api/editais
  - Description: Returns a JSON array with uploaded editais (most recent first).
  - Response: 200 OK, body: [{ id, title, summary, originalName, storedName, path, uploadedAt }, ...]

- POST /api/editais
  - Description: Upload a new edital (PDF). Requires API key in header `x-api-key`.
  - Authentication: header `x-api-key: <API_KEY>` (server reads key from `.env`)
  - Content-Type: `multipart/form-data`
  - Fields:
    - `title` (string) — name/title for the PDF
    - `file` (file) — the PDF file
  - Response: 201 Created with the created item JSON, or 401 if API key invalid.

Notes
- Files are stored under `/uploads/` and metadata in `data/editais.json`.
- This is a minimal dev backend meant for local testing.

Example CURL (upload):

curl -X POST "http://localhost:3000/api/editais" \
  -H "x-api-key: YOUR_API_KEY" \
  -F "title=Meu Edital" \
  -F "file=@/path/to/file.pdf"
