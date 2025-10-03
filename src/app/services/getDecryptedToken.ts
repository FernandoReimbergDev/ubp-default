import { getDBConnection } from "../database/db";
import CryptoJS from "crypto-js";
import { TOKEN_SECRET } from "../utils/env";
import { RowDataPacket } from "mysql2";

export async function getDecryptedToken(application: string): Promise<string | null> {
  const conn = await getDBConnection();

  const [rows] = await conn.execute<RowDataPacket[]>(`SELECT token FROM access_token WHERE application = ?`, [
    application,
  ]);

  if (rows.length === 0) return null;

  const token = rows[0].token;

  const decryptedBytes = CryptoJS.AES.decrypt(token, TOKEN_SECRET);
  const decryptedToken = decryptedBytes.toString(CryptoJS.enc.Utf8);

  return decryptedToken;
}
