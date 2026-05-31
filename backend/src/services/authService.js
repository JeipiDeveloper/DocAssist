const crypto = require("crypto");

const ADMIN_USER = process.env.ADMIN_USER || "admin";
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "admin";
const AUTH_SECRET = process.env.AUTH_SECRET || "docassist-dev-secret";
const TOKEN_TTL_MS = 1000 * 60 * 60 * 8; // 8 horas

function assinar(payload) {
    return crypto.createHmac("sha256", AUTH_SECRET).update(payload).digest("hex");
}

function compararSeguro(a, b) {
    const bufferA = Buffer.from(a);
    const bufferB = Buffer.from(b);

    if (bufferA.length !== bufferB.length) {
        return false;
    }

    return crypto.timingSafeEqual(bufferA, bufferB);
}

function validarCredenciais(usuario, senha) {
    if (typeof usuario !== "string" || typeof senha !== "string") {
        return false;
    }

    return compararSeguro(usuario, ADMIN_USER) && compararSeguro(senha, ADMIN_PASSWORD);
}

function gerarToken() {
    const expiraEm = Date.now() + TOKEN_TTL_MS;
    const payload = `${ADMIN_USER}.${expiraEm}`;
    const assinatura = assinar(payload);
    return Buffer.from(`${payload}.${assinatura}`).toString("base64");
}

function verificarToken(token) {
    if (typeof token !== "string" || token.length === 0) {
        return false;
    }

    let conteudo;
    try {
        conteudo = Buffer.from(token, "base64").toString("utf-8");
    } catch (error) {
        return false;
    }

    const partes = conteudo.split(".");
    if (partes.length !== 3) {
        return false;
    }

    const [usuario, expiraEm, assinatura] = partes;
    const payload = `${usuario}.${expiraEm}`;

    if (!compararSeguro(assinatura, assinar(payload))) {
        return false;
    }

    const expiraEmNumero = Number(expiraEm);
    if (!Number.isFinite(expiraEmNumero) || Date.now() > expiraEmNumero) {
        return false;
    }

    return true;
}

module.exports = {
    validarCredenciais,
    gerarToken,
    verificarToken,
};
