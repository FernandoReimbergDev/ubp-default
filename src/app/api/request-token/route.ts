import { NextResponse } from "next/server";
import { API_REQ_USER, API_REQ_PASSWORD, TOKEN_SECRET, ENVIRONMENT, API_REQ_APPLICATION } from "../../utils/env";
import CryptoJS from "crypto-js";
import { getDBConnection } from "../../database/db";
import { RowDataPacket } from "mysql2";

export async function POST() {
  try {
    const encoded = Buffer.from(`${API_REQ_USER}:${API_REQ_PASSWORD}`).toString("base64");

    const options = {
      method: "POST",
      headers: {
        "X-Environment": ENVIRONMENT,
        "Content-Type": "application/json",
        Authorization: `Basic ${encoded}`,
      },
    };

    const conn = await getDBConnection();

    const response = await fetch("https://unitybrindes.com.br/token-generate", options);
    const data = await response.json();

    if (!response.ok) {
      console.error("Erro da API externa:", data);
      return NextResponse.json({ error: true, status: response.status });
    }

    const { token, expiresIn } = data;
    const application = API_REQ_APPLICATION;
    const encryptedToken = CryptoJS.AES.encrypt(token, TOKEN_SECRET).toString();

    const [rows] = await conn.execute<RowDataPacket[]>(`SELECT id FROM access_token WHERE application = ?`, [
      application,
    ]);

    if (rows.length > 0) {
      await conn.execute(
        `UPDATE access_token SET token = ?, expiresIn = ?, updated_at = CURRENT_TIMESTAMP WHERE application = ?`,
        [encryptedToken, expiresIn, application]
      );
    } else {
      await conn.execute(`INSERT INTO access_token (token, expiresIn, application) VALUES (?, ?, ?)`, [
        encryptedToken,
        expiresIn,
        application,
      ]);
    }

    return NextResponse.json({ success: true, token: token }, { status: response.status });
  } catch (err: unknown) {
    if (err instanceof Error) {
      console.error("Erro interno capturado:", err.message);
      return NextResponse.json({ error: "Erro interno", details: err.message }, { status: 500 });
    } else {
      console.error("Erro interno desconhecido:", err);
      return NextResponse.json({ error: "Erro interno desconhecido" }, { status: 500 });
    }
  }
}
