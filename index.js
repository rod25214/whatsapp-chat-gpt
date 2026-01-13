const { Client } = require("whatsapp-web.js");
const { createClient } = require("@supabase/supabase-js");
const WebSocket = require("ws");
const express = require("express");
const cors = require("cors");

const app = express();
app.use(cors({ origin: "*" }));
app.listen(3000, () => console.log("Servidor HTTP rodando na porta 3000"));

const wss = new WebSocket.Server({ port: 8080 });

let qrCodeData = "";
let connectionStatus = "desconectado";

wss.on("connection", ws => {
  ws.send(JSON.stringify({ status: connectionStatus, qrCode: qrCodeData }));
});

// Supabase direto no código
const SUPABASE_URL = "https://shnhjbilqykqbvultwih.supabase.co";
const SUPABASE_KEY = "sb_publishable_5cz6ObPo_kMZMB_X-yNipg_sXU3wp_F";

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

  const { error } = await supabase
    .from("whatsapp_connection")
    .update({
      status,
      qr_code: qr,
      updated_at: new Date()
    })
    .eq("id", 1);

  if (error) console.error("Erro Supabase:", error.message);
}

// 🔥 CLIENT SEM LocalAuth (igual ao projeto que funciona)
const client = new Client({
  puppeteer: {
    headless: true,
    args: [
      "--no-sandbox",
      "--disable-setuid-sandbox",
      "--disable-dev-shm-usage",
      "--disable-gpu",
      "--single-process",
      "--no-zygote"
    ]
  }
});

client.on("qr", async qr => {
  console.log("QR Code gerado");
  await atualizarStatus("qr_gerado", qr);
});

client.on("ready", async () => {
  console.log("WhatsApp conectado");
  await atualizarStatus("conectado", null);
});

client.on("disconnected", async () => {
  console.log("WhatsApp desconectado");
  await atualizarStatus("desconectado", null);
});

client.initialize();
