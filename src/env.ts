import dotenv from "dotenv";

dotenv.config();

const getEnv = (key: string, required = true): string => {
  const value = process.env[key];
  if (!value && required) {
    throw new Error(`Missing environment variable: ${key}`);
  }
  return value!;
};

export const ENV = {
  PORT: parseInt(getEnv("PORT", false) || "3000"),
  WEBFLOW_API_TOKEN: getEnv("WEBFLOW_API_TOKEN"),

  WEBFLOW_CMS_BOATS_ID: getEnv("WEBFLOW_CMS_BOATS_ID"),
  WEBFLOW_CMS_COLORS_ID: getEnv("WEBFLOW_CMS_COLORS_ID"),
  WEBFLOW_CMS_OPTIONS_ID: getEnv("WEBFLOW_CMS_OPTIONS_ID"),

  EMAIL_SENDER_ADDRESS: getEnv("EMAIL_SENDER_ADDRESS"),
  EMAIL_SENDER_APP_PASS: getEnv("EMAIL_SENDER_APP_PASS"),

  GOOGLE_SHEET_ID: getEnv("GOOGLE_SHEET_ID"),
  GOOGLE_SERVICE_ACCOUNT_KEY: getEnv("GOOGLE_SERVICE_ACCOUNT_KEY"),
};
