const express = require("express");
const { validarCredenciais, gerarToken, verificarToken } = require("../services/authService");

const router = express.Router();

function extrairToken(req) {
    const header = req.headers.authorization || "";
    if (header.startsWith("Bearer ")) {
        return header.slice("Bearer ".length).trim();
    }
    return "";
}

function autenticar(req, res, next) {
    const token = extrairToken(req);

    if (!verificarToken(token)) {
        return res.status(401).json({ message: "Não autorizado. Faça login para continuar." });
    }

    return next();
}

router.post("/admin/login", (req, res) => {
    const { user, password } = req.body || {};

    if (!validarCredenciais(user, password)) {
        return res.status(401).json({ message: "Usuário ou senha inválidos." });
    }

    const token = gerarToken();
    return res.json({ message: "Login realizado com sucesso", token });
});

router.get("/admin/verify", autenticar, (req, res) => {
    return res.json({ authenticated: true });
});

module.exports = { router, autenticar };
