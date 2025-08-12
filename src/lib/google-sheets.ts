import { google } from "googleapis";
import { ENV } from "@/env";
import { Boat } from "@/custom-types/Boat"; // merged fixed + dynamic

const auth = new google.auth.GoogleAuth({
  credentials: JSON.parse(ENV.GOOGLE_SERVICE_ACCOUNT_KEY),
  scopes: ["https://www.googleapis.com/auth/spreadsheets"],
});

const sheets = google.sheets({ version: "v4", auth });

export const appendToSheet = async (data: Boat) => {
  const spreadsheetId = ENV.GOOGLE_SHEET_ID;
  const range = "Sheet1!A1";

  const fixedKeys = [
    "name",
    "country",
    "email",
    "phone",
    "city",
    "comment",
    "screen",
    "link",
  ];

  const fixedPart = fixedKeys.map((k) => data[k] ?? "");

  const tabGroups: Record<string, string> = {};
  Object.keys(data)
    .filter((k) => k.startsWith("tab-"))
    .forEach((key) => {
      const baseKey = key.replace(/-(name|value)$/, "");
      tabGroups[baseKey] = tabGroups[baseKey] || "";
      if (key.endsWith("-name")) {
        tabGroups[baseKey] =
          data[key] + (tabGroups[baseKey] ? `: ${tabGroups[baseKey]}` : "");
      } else if (key.endsWith("-value")) {
        tabGroups[baseKey] =
          (tabGroups[baseKey] ? `${tabGroups[baseKey]}: ` : "") + data[key];
      }
    });

  const tabPart = Object.values(tabGroups);

  const optionPart = Object.keys(data)
    .filter((k) => k.startsWith("option-"))
    .map((k) => `${k}: ${data[k]}`);

  const row = [...fixedPart, ...tabPart, ...optionPart];

  const resGet = await sheets.spreadsheets.values.get({ spreadsheetId, range });
  const isEmpty = !resGet.data.values || resGet.data.values.length === 0;

  const rows = [];
  if (isEmpty) {
    rows.push([
      ...fixedKeys,
      ...Object.keys(tabGroups),
      ...Object.keys(data).filter((k) => k.startsWith("option-")),
    ]);
  }
  rows.push(row);

  const resAppend = await sheets.spreadsheets.values.append({
    spreadsheetId,
    range,
    valueInputOption: "USER_ENTERED",
    requestBody: { values: rows },
  });

  return resAppend.status === 200;
};
