import { google } from "googleapis";
import { Request, Response } from "express";
import { ENV } from "@/env";

import { BoatBase } from "@/custom-types/Boat";

const auth = new google.auth.GoogleAuth({
  credentials: JSON.parse(ENV.GOOGLE_SERVICE_ACCOUNT_KEY),
  scopes: ["https://www.googleapis.com/auth/spreadsheets"],
});

const sheets = google.sheets({ version: "v4", auth });

export const appendToSheet = async ({
  name,
  country,
  email,
  phone,
  city,
  comment,
  screen,
  link,
}: BoatBase) => {
  const spreadsheetId = ENV.GOOGLE_SHEET_ID;
  const range = "Sheet1!A1";

  const values = [[name, country, email, phone, city, comment, screen, link]];

  const { ok } = await sheets.spreadsheets.values.append({
    spreadsheetId,
    range,
    valueInputOption: "USER_ENTERED",
    requestBody: { values },
  });

  return ok;
};
