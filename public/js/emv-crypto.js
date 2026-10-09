/* OSC Payment Academy v4.0.0-rc.1.22 · Criptografía EMV didáctica (DES / 3DES reales)
   ---------------------------------------------------------------------------------
   Todo se calcula con CLAVES DE PRÁCTICA públicas. No son claves de producción.
   Algoritmos implementados:
   - DES / 3DES (2 claves, EDE) en modo ECB.
   - MAC ISO/IEC 9797-1 Algoritmo 3 ("Retail MAC"), padding método 1 (ceros) o método 2 (80 00..).
   - Derivación de la clave de la tarjeta (UDK / ICC Master Key) · EMV Book 2, Anexo A1.4 Opción A.
   - Clave de sesión EMV Common Session Key (CSK) · EMV Book 2, Anexo A1.3.
     M/Chip: Cryptogram Version Number con "EMV CSK session key" (M/Chip Requirements, Tabla 25).
   - ARQC sobre el conjunto mínimo de datos recomendado por EMV + CVR del 9F10.
   - ARPC Método 1: ARPC = 3DES(K, ARQC XOR (ARC || 00 00 00 00 00 00)).
   - PIN Block ISO 9564 Formato 0 y su cifrado 3DES con una ZPK de práctica (HSM simulado).
*/
(function () {
  const PC1 = [57,49,41,33,25,17,9,1,58,50,42,34,26,18,10,2,59,51,43,35,27,19,11,3,60,52,44,36,63,55,47,39,31,23,15,7,62,54,46,38,30,22,14,6,61,53,45,37,29,21,13,5,28,20,12,4];
  const PC2 = [14,17,11,24,1,5,3,28,15,6,21,10,23,19,12,4,26,8,16,7,27,20,13,2,41,52,31,37,47,55,30,40,51,45,33,48,44,49,39,56,34,53,46,42,50,36,29,32];
  const SHIFTS = [1,1,2,2,2,2,2,2,1,2,2,2,2,2,2,1];
  const IP = [58,50,42,34,26,18,10,2,60,52,44,36,28,20,12,4,62,54,46,38,30,22,14,6,64,56,48,40,32,24,16,8,57,49,41,33,25,17,9,1,59,51,43,35,27,19,11,3,61,53,45,37,29,21,13,5,63,55,47,39,31,23,15,7];
  const FP = [40,8,48,16,56,24,64,32,39,7,47,15,55,23,63,31,38,6,46,14,54,22,62,30,37,5,45,13,53,21,61,29,36,4,44,12,52,20,60,28,35,3,43,11,51,19,59,27,34,2,42,10,50,18,58,26,33,1,41,9,49,17,57,25];
  const E = [32,1,2,3,4,5,4,5,6,7,8,9,8,9,10,11,12,13,12,13,14,15,16,17,16,17,18,19,20,21,20,21,22,23,24,25,24,25,26,27,28,29,28,29,30,31,32,1];
  const P = [16,7,20,21,29,12,28,17,1,15,23,26,5,18,31,10,2,8,24,14,32,27,3,9,19,13,30,6,22,11,4,25];
  const S = [
    [14,4,13,1,2,15,11,8,3,10,6,12,5,9,0,7,0,15,7,4,14,2,13,1,10,6,12,11,9,5,3,8,4,1,14,8,13,6,2,11,15,12,9,7,3,10,5,0,15,12,8,2,4,9,1,7,5,11,3,14,10,0,6,13],
    [15,1,8,14,6,11,3,4,9,7,2,13,12,0,5,10,3,13,4,7,15,2,8,14,12,0,1,10,6,9,11,5,0,14,7,11,10,4,13,1,5,8,12,6,9,3,2,15,13,8,10,1,3,15,4,2,11,6,7,12,0,5,14,9],
    [10,0,9,14,6,3,15,5,1,13,12,7,11,4,2,8,13,7,0,9,3,4,6,10,2,8,5,14,12,11,15,1,13,6,4,9,8,15,3,0,11,1,2,12,5,10,14,7,1,10,13,0,6,9,8,7,4,15,14,3,11,5,2,12],
    [7,13,14,3,0,6,9,10,1,2,8,5,11,12,4,15,13,8,11,5,6,15,0,3,4,7,2,12,1,10,14,9,10,6,9,0,12,11,7,13,15,1,3,14,5,2,8,4,3,15,0,6,10,1,13,8,9,4,5,11,12,7,2,14],
    [2,12,4,1,7,10,11,6,8,5,3,15,13,0,14,9,14,11,2,12,4,7,13,1,5,0,15,10,3,9,8,6,4,2,1,11,10,13,7,8,15,9,12,5,6,3,0,14,11,8,12,7,1,14,2,13,6,15,0,9,10,4,5,3],
    [12,1,10,15,9,2,6,8,0,13,3,4,14,7,5,11,10,15,4,2,7,12,9,5,6,1,13,14,0,11,3,8,9,14,15,5,2,8,12,3,7,0,4,10,1,13,11,6,4,3,2,12,9,5,15,10,11,14,1,7,6,0,8,13],
    [4,11,2,14,15,0,8,13,3,12,9,7,5,10,6,1,13,0,11,7,4,9,1,10,14,3,5,12,2,15,8,6,1,4,11,13,12,3,7,14,10,15,6,8,0,5,9,2,6,11,13,8,1,4,10,7,9,5,0,15,14,2,3,12],
    [13,2,8,4,6,15,11,1,10,9,3,14,5,0,12,7,1,15,13,8,10,3,7,4,12,5,6,11,0,14,9,2,7,11,4,1,9,12,14,2,0,6,10,13,15,3,5,8,2,1,14,7,4,10,8,13,15,12,9,0,3,5,6,11],
  ];

  const clean = (h) => String(h || "").replace(/[^0-9a-f]/gi, "").toUpperCase();
  const hexToBits = (hex) => clean(hex).split("").flatMap((c) => parseInt(c, 16).toString(2).padStart(4, "0").split("").map(Number));
  const bitsToHex = (bits) => {
    let out = "";
    for (let i = 0; i < bits.length; i += 4) out += parseInt(bits.slice(i, i + 4).join(""), 2).toString(16);
    return out.toUpperCase();
  };
  const permute = (bits, table) => table.map((p) => bits[p - 1]);
  const xorBits = (a, b) => a.map((v, i) => v ^ b[i]);
  const rotl = (arr, n) => arr.slice(n).concat(arr.slice(0, n));

  function subkeys(keyHex) {
    const k = permute(hexToBits(keyHex), PC1);
    let c = k.slice(0, 28), d = k.slice(28);
    return SHIFTS.map((s) => {
      c = rotl(c, s);
      d = rotl(d, s);
      return permute(c.concat(d), PC2);
    });
  }
  function feistel(r, k) {
    const x = xorBits(permute(r, E), k);
    let out = [];
    for (let i = 0; i < 8; i++) {
      const b = x.slice(i * 6, i * 6 + 6);
      const row = (b[0] << 1) | b[5];
      const col = (b[1] << 3) | (b[2] << 2) | (b[3] << 1) | b[4];
      out = out.concat(S[i][row * 16 + col].toString(2).padStart(4, "0").split("").map(Number));
    }
    return permute(out, P);
  }
  function desBlock(keyHex, blockHex, decrypt = false) {
    const ks = subkeys(keyHex);
    if (decrypt) ks.reverse();
    const b = permute(hexToBits(blockHex), IP);
    let l = b.slice(0, 32), r = b.slice(32);
    for (let i = 0; i < 16; i++) {
      const nr = xorBits(l, feistel(r, ks[i]));
      l = r;
      r = nr;
    }
    return bitsToHex(permute(r.concat(l), FP));
  }
  const des = (key, block) => desBlock(key, block, false);
  const desDecrypt = (key, block) => desBlock(key, block, true);
  // 3DES de doble longitud (K1 = K3): E(K1) · D(K2) · E(K1)
  function tdes(key32, block) {
    const k = clean(key32), k1 = k.slice(0, 16), k2 = k.slice(16, 32) || k1;
    return des(k1, desDecrypt(k2, des(k1, block)));
  }
  function tdesDecrypt(key32, block) {
    const k = clean(key32), k1 = k.slice(0, 16), k2 = k.slice(16, 32) || k1;
    return desDecrypt(k1, des(k2, desDecrypt(k1, block)));
  }
  function xorHex(a, b) {
    a = clean(a); b = clean(b);
    let out = "";
    for (let i = 0; i < a.length; i++) out += (parseInt(a[i], 16) ^ parseInt(b[i] || "0", 16)).toString(16);
    return out.toUpperCase();
  }
  function pad(dataHex, method) {
    let d = clean(dataHex);
    if (method === 2) d += "80";
    while (d.length % 16) d += "0";
    if (!d.length) d = "0000000000000000";
    return d;
  }
  // ISO/IEC 9797-1 Algoritmo 3: CBC-DES con K1 y transformación final D(K2)·E(K1).
  function retailMac(key32, dataHex, paddingMethod = 2) {
    const k = clean(key32), k1 = k.slice(0, 16), k2 = k.slice(16, 32);
    const d = pad(dataHex, paddingMethod);
    let h = "0000000000000000";
    for (let i = 0; i < d.length; i += 16) h = des(k1, xorHex(h, d.slice(i, i + 16)));
    return des(k1, desDecrypt(k2, h));
  }
  function setOddParity(hex) {
    return clean(hex).match(/../g).map((b) => {
      let v = parseInt(b, 16) & 0xfe, ones = 0;
      for (let i = 1; i < 8; i++) ones += (v >> i) & 1;
      if (ones % 2 === 0) v |= 1;
      return v.toString(16).padStart(2, "0");
    }).join("").toUpperCase();
  }

  // ---- Claves de práctica (públicas, solo para el laboratorio) ----
  const PRACTICE_KEYS = {
    IMK_AC: "0123456789ABCDEFFEDCBA9876543210", // Issuer Master Key para Application Cryptograms
    ZPK: "11111111111111112222222222222222",    // Zone PIN Key POS/ATM → adquirente → emisor
  };

  // EMV Book 2 A1.4 Opción A: Y = 16 dígitos más a la derecha de PAN || PSN.
  function deriveUdk(pan, psn = "00", imk = PRACTICE_KEYS.IMK_AC) {
    const y = (String(pan).replace(/\D/g, "") + String(psn).padStart(2, "0")).slice(-16).padStart(16, "0");
    const zl = tdes(imk, y), zr = tdes(imk, xorHex(y, "FFFFFFFFFFFFFFFF"));
    return { y, udk: setOddParity(zl + zr) };
  }
  // EMV CSK: R = ATC || 00 00 00 00 00 00 ; F1 = R0 R1 F0 R3..R7 ; F2 = R0 R1 0F R3..R7
  function deriveSessionKey(udk, atc) {
    const a = clean(atc).padStart(4, "0").slice(-4);
    const f1 = a + "F0" + "0000000000", f2 = a + "0F" + "0000000000";
    return { f1, f2, sk: tdes(udk, f1) + tdes(udk, f2) };
  }

  /* Datos del ARQC (EMV Book 2, Tabla 26 · conjunto mínimo recomendado) + CVR del Issuer Application Data.
     tags: objeto con valores hex de 9F02, 9F03, 9F1A, 95, 5F2A, 9A, 9C, 9F37, 82, 9F36 y cvr. */
  const ARQC_ORDER = [
    ["9F02", "Importe autorizado", 6], ["9F03", "Importe otro", 6], ["9F1A", "País del terminal", 2],
    ["95", "TVR", 5], ["5F2A", "Moneda de la transacción", 2], ["9A", "Fecha", 3], ["9C", "Tipo de transacción", 1],
    ["9F37", "Número impredecible (UN)", 4], ["82", "AIP", 2], ["9F36", "ATC", 2], ["CVR", "CVR (dentro del 9F10)", 0],
  ];
  function arqcData(tags) {
    return ARQC_ORDER.map(([t, , len]) => {
      const v = clean(t === "CVR" ? tags.cvr : tags[t]);
      return len ? v.padStart(len * 2, "0").slice(-len * 2) : v;
    }).join("");
  }
  /* scheme: "CSK" (EMV Common Session Key, M/Chip CVN 10/Amex didáctico)
             "UDK" (Visa CVN 10: el MAC se calcula directo con la clave de la tarjeta, padding método 1) */
  function computeArqc({ pan, psn = "00", atc, tags, scheme = "CSK" }) {
    const { y, udk } = deriveUdk(pan, psn);
    const data = arqcData({ ...tags, "9F36": atc });
    if (scheme === "UDK") {
      return { scheme, y, udk, key: udk, data, padding: 1, arqc: retailMac(udk, data, 1) };
    }
    const s = deriveSessionKey(udk, atc);
    return { scheme, y, udk, ...s, key: s.sk, data, padding: 2, arqc: retailMac(s.sk, data, 2) };
  }
  // ARPC Método 1. ARC "3030" = "00" en ASCII (aprobada); "3035" = "05".
  function computeArpc(key, arqc, arc = "3030") {
    const input = xorHex(clean(arqc), clean(arc).padEnd(16, "0"));
    return { input, arpc: tdes(key, input), arc: clean(arc) };
  }
  function asciiHex(text) {
    return String(text).split("").map((c) => c.charCodeAt(0).toString(16).padStart(2, "0")).join("").toUpperCase();
  }

  // ---- PIN Block ISO 9564-1 Formato 0 ----
  function pinBlockClear(pin, pan) {
    const p = String(pin || "").replace(/\D/g, "");
    const pinField = ("0" + p.length.toString(16) + p).padEnd(16, "F").toUpperCase();
    const digits = String(pan || "").replace(/\D/g, "");
    const panField = ("0000" + digits.slice(0, -1).slice(-12)).padStart(16, "0");
    return { pinField, panField, clear: xorHex(pinField, panField) };
  }
  function pinBlockEncrypted(pin, pan, zpk = PRACTICE_KEYS.ZPK) {
    const b = pinBlockClear(pin, pan);
    return { ...b, zpk, encrypted: tdes(zpk, b.clear) };
  }
  // HSM simulado: descifra con la ZPK, quita el PAN y recupera el PIN para verificarlo.
  function hsmVerifyPin(encrypted, pan, expectedPin, zpk = PRACTICE_KEYS.ZPK) {
    const clear = tdesDecrypt(zpk, encrypted);
    const digits = String(pan || "").replace(/\D/g, "");
    const panField = ("0000" + digits.slice(0, -1).slice(-12)).padStart(16, "0");
    const pinField = xorHex(clear, panField);
    const len = parseInt(pinField[1], 16);
    const pin = pinField.slice(2, 2 + len);
    const valid = pinField[0] === "0" && len >= 4 && len <= 12 && /^\d+$/.test(pin) && /^F*$/.test(pinField.slice(2 + len));
    return { clear, panField, pinField, pin, formatOk: valid, match: expectedPin == null ? null : valid && pin === String(expectedPin) };
  }

  window.OSCEmvCrypto = {
    PRACTICE_KEYS, des, desDecrypt, tdes, tdesDecrypt, retailMac, xorHex, setOddParity,
    deriveUdk, deriveSessionKey, arqcData, ARQC_ORDER, computeArqc, computeArpc, asciiHex,
    pinBlockClear, pinBlockEncrypted, hsmVerifyPin,
  };
  if (typeof module !== "undefined") module.exports = window.OSCEmvCrypto;
})();
