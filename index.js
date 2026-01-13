import { Client, LocalAuth } from "whatsapp-web.js";
import qrcode from "qrcode-terminal";
import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = "https://shnhjbilqykqbvultwih.supabase.co";
const SUPABASE_KEY = "sb_publishable_5cz6ObPo_kMZMB_X-yNipg_sXU3wp_F";

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

const client = new Client({
  authStrategy: new LocalAuth()
});

async function atualizarStatus(status, qr = null) {
  const { error } = await supabase
    .from("whatsapp_connection")
    .update({
      status,
      qr_code: qr,
      updated_at: new Date()
    })
    .neq("status", status);

  if (error) console.error("Erro Supabase:", error.message);
}

client.on("qr", async qr => {
  console.log("QR Code gerado:");
  qrcode.generate(qr, { small: true });

  await atualizarStatus("qr_gerado", qr);
});

client.on("ready", async () => {
  console.log("WhatsApp conectado!");
  await atualizarStatus("conectado", null);
});

client.on("disconnected", async () => {
  console.log("WhatsApp desconectado!");
  await atualizarStatus("desconectado", null);
});

client.initialize();
