import { google } from "googleapis";
import { ENV } from "@/env";
import { Boat } from "@/custom-types/Boat";

const auth = new google.auth.GoogleAuth({
  credentials: JSON.parse(ENV.GOOGLE_SERVICE_ACCOUNT_KEY),
  scopes: ["https://www.googleapis.com/auth/spreadsheets"],
});

const sheets = google.sheets({ version: "v4", auth });

export const appendToSheet = async (data: Boat) => {
  const spreadsheetId = ENV.GOOGLE_SHEET_ID;
  const range = "Sheet1!A1";

  const resGet = await sheets.spreadsheets.values.get({
    spreadsheetId,
    range,
  });

  const isEmpty = !resGet.data.values || resGet.data.values.length === 0;

  const rows = [];

  if (isEmpty) {
    rows.push(Object.keys(data));
  }

  rows.push(Object.values(data));

  const resAppend = await sheets.spreadsheets.values.append({
    spreadsheetId,
    range,
    valueInputOption: "USER_ENTERED",
    requestBody: { values: rows },
  });

  return resAppend.status === 200;
};
