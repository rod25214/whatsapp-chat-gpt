import { Client, LocalAuth } from "whatsapp-web.js";
import qrcode from "qrcode-terminal";
import { createClient } from "@supabase/supabase-js";
import "dotenv/config";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY
);

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
