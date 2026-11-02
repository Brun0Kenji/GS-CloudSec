import express from "express";
import { middleware as frontend } from "./.output/server/index.mjs";
import api from "./api/app.js";

const app = express();
const PORT = process.env.PORT || 3000;

app.use("/api", api);
app.use(frontend);

app.listen(PORT, () => console.log(`Aplicação rodando na porta ${PORT}`));
