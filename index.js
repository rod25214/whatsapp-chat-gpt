const { Client, LocalAuth } = require("whatsapp-web.js");
const { createClient } = require("@supabase/supabase-js");
const WebSocket = require("ws");
const express = require("express");
const cors = require("cors");

const app = express();
app.use(cors({ origin: "*" }));

app.listen(3000, () => {
  console.log("Servidor HTTP rodando na porta 3000");
});

// WebSocket
const wss = new WebSocket.Server({ port: 8080 });
let qrCodeData = "";
let connectionStatus = "desconectado";

wss.on("connection", ws => {
  ws.send(JSON.stringify({ status: connectionStatus, qrCode: qrCodeData }));
});

// Supabase
const SUPABASE_URL = "SUA_URL";
const SUPABASE_KEY = "SUA_ANON_PUBLIC_KEY"; // NÃO USE publishable
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

// Atualiza Supabase + Frontend
async function atualizarStatus(status, qr = null) {
  connectionStatus = status;
  qrCodeData = qr || "";

  for (const client of wss.clients) {
    if (client.readyState === WebSocket.OPEN) {
      client.send(JSON.stringify({ status, qrCode: qrCodeData }));
    }
  }

  try {
    await supabase
      .from("whatsapp_connection")
      .update({
        status,
        qr_code: qr,
        updated_at: new Date()
      })
      .eq("id", 1);
  } catch (err) {
    console.error("Erro Supabase:", err.message);
  }
}

// 🔥 CLIENTE COM LocalAuth
const client = new Client({
  authStrategy: new LocalAuth(),
  puppeteer: {
    headless: true,
    args: ["--no-sandbox", "--disable-setuid-sandbox"]
  }
});

// QR
client.on("qr", async qr => {
  console.log("QR Code gerado");
  await atualizarStatus("qr_gerado", qr);
});

// Conectado
client.on("ready", async () => {
  console.log("WhatsApp conectado");
  await atualizarStatus("conectado", null);
});

// Desconectado
client.on("disconnected", async () => {
  console.log("WhatsApp desconectado");
  await atualizarStatus("desconectado", null);
});

// Inicializa
client.initialize();
