/* OSC Payment Academy v4.0.0-rc.1.22 · Mensajes ISO de Wallet y E-commerce en el Switch.
   Registra la solicitud y la respuesta REALES de la última operación (armadas por red en js/modern-channel-iso.js). */
(function () {
  function record(channel) {
    const tx = window.OSCModernLastTx;
    if (!tx || tx.channel !== channel || !window.OSCSwitchStore?.addIsoMessage) return;
    const id = channel.toLowerCase() + "-" + Date.now();
    const op = channel === "ECOMMERCE" ? "Compra E-Commerce" : "Compra Wallet NFC";
    const currency = tx.currency === "840" ? "USD" : "ARS";
    const toObj = (f) => Object.fromEntries(f.map((r) => [r[0], r[2]]));
    window.OSCSwitchStore.addIsoMessage({ transactionId: id, channel, network: tx.network.toUpperCase(), direction: "REQUEST", operation: op, mti: tx.request.mti, bitmap: tx.request.bitmap, fields: toObj(tx.request.fields), raw: tx.request.mti + tx.request.bitmap, amountCents: tx.amountCents, currency, status: "SENT", panLast4: tx.panLast4 });
    window.OSCSwitchStore.addIsoMessage({ transactionId: id, channel, network: tx.network.toUpperCase(), direction: "RESPONSE", operation: op, mti: tx.response.mti, bitmap: tx.response.bitmap, fields: toObj(tx.response.fields), raw: tx.response.mti + tx.response.bitmap, amountCents: tx.amountCents, currency, responseCode: tx.code, status: tx.approved ? "APPROVED" : "DECLINED", panLast4: tx.panLast4 });
    window.OSCSwitchStore.flush?.();
    tx.recorded = true;
  }
  window.addEventListener("DOMContentLoaded", () => {
    const ch = location.pathname.includes("ecommerce") ? "ECOMMERCE" : location.pathname.includes("wallet") ? "WALLET" : null;
    if (!ch) return;
    document.getElementById("pay")?.addEventListener("click", () => {
      const wait = setInterval(() => {
        const tx = window.OSCModernLastTx;
        if (tx && !tx.recorded && tx.channel === ch) { clearInterval(wait); record(ch); }
      }, 300);
      setTimeout(() => clearInterval(wait), 8000);
    });
  });
})();
