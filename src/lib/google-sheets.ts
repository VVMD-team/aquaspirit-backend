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

  const date = new Date();
  const readableDate = new Intl.DateTimeFormat("uk-UA", {
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    timeZone: "Europe/Kyiv",
  }).format(date);

  const fixedKeys: (keyof Boat)[] = [
    "name",
    "country",
    "email",
    "phone",
    "city",
    "comment",
    "screen",
    "link",
  ];

  const fixedPart = fixedKeys.map((k) => (data[k] ?? "").toString());

  const dynamicEntries = Object.entries(data).filter(([k, v]) => {
    if (!/^tab-\d+-color-\d+$/.test(k) && !/^option-\d+$/.test(k)) return false;
    return v !== undefined && v !== null && String(v).trim() !== "";
  });

  dynamicEntries.sort(([a], [b]) => {
    const tabRe = /^tab-(\d+)-color-(\d+)$/;
    const optRe = /^option-(\d+)$/;
    const aTab = tabRe.exec(a);
    const bTab = tabRe.exec(b);
    if (aTab && bTab) return +aTab[1] - +bTab[1] || +aTab[2] - +bTab[2];
    if (aTab && !bTab) return -1;
    if (!aTab && bTab) return 1;
    const aOpt = optRe.exec(a);
    const bOpt = optRe.exec(b);
    if (aOpt && bOpt) return +aOpt[1] - +bOpt[1];
    return a.localeCompare(b);
  });

  const combinedDynamicCell =
    dynamicEntries.map(([, v]) => String(v).trim()).join("\n") || "";

  const row = [readableDate, ...fixedPart, combinedDynamicCell];

  const resGet = await sheets.spreadsheets.values.get({ spreadsheetId, range });
  const isEmpty = !resGet.data.values || resGet.data.values.length === 0;

  const rows = [];
  if (isEmpty) {
    rows.push([...fixedKeys, "selected"]);
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
