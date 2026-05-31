require("dotenv").config();

const express = require("express");
const cors = require("cors");
const pdfRoutes = require("./src/routes/pdfRoutes");
const { router: authRoutes } = require("./src/routes/authRoutes");

const app = express();

app.use(cors());
app.use(express.json());
app.use(authRoutes);
app.use(pdfRoutes);

app.listen(3000, () => {
    console.log("Servidor rodando");
});