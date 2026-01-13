const express = require("express");
const WebSocket = require("ws");
const cors = require("cors");
const { Client, LocalAuth } = require("whatsapp-web.js");
const { createClient } = require("@supabase/supabase-js");

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

// Supabase direto no código
const supabase = createClient(
  "https://shnhjbilqykqbvultwih.supabase.co",
  "sb_publishable_5cz6ObPo_kMZMB_X-yNipg_sXU3wp_F"
);

// Atualiza Supabase + Frontend
async function atualizarStatus(status, qr = null) {
  connectionStatus = status;
  qrCodeData = qr || "";

  wss.clients.forEach(client => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(JSON.stringify({ status, qrCode: qrCodeData }));
    }
  });

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

// WhatsApp Client
const client = new Client({
  authStrategy: new LocalAuth()
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
