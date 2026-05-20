require("dotenv").config();

const express = require("express");
const cors = require("cors");
const multer = require("multer");

const app = express();

app.use(cors());
app.use(express.json());

const storage = multer.diskStorage({

    //Tem que existir essa pasta no projeto para funcionar
    destination: function(req, file, cb) {
        cb(null, "backend/uploads/");
    },

    filename: function(req, file, cb) {
        cb(null, Date.now() + "-" + file.originalname);
    }

});

const upload = multer({ storage });

app.post("/upload", upload.single("pdf"), (req, res) => {

    console.log(req.file);

    res.json({
        message: "PDF enviado com sucesso"
    });

});

app.listen(3000, () => {
    console.log("Servidor rodando");
});