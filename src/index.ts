import express from "express";
import cors from "cors";

import { ENV } from "./env";

import webflowRoutes from "./routes/boats.routes";

const app = express();

const allowedOrigins = [
  "http://localhost:8669",
  "https://localhost:8669",
  "https://verge3d-boat-ui.webflow.io",
  "https://grand-3d-test.vercel.app",
  "https://constructor.grandboats.com",
  "https://aquaspirit-backend-production.up.railway.app",
  "https://s3.us-east-1.amazonaws.com",
  "http://localhost:5500",
  "https://localhost:5500",
  "https://cdn.soft8soft.com",
];

app.use(
  cors({
    origin: (origin, callback) => {
      if (
        !origin ||
        allowedOrigins.includes(origin) ||
        origin.endsWith(".netlify.app")
      ) {
        callback(null, true);
      } else {
        callback(new Error("Not allowed by CORS"));
      }
    },
    methods: ["GET", "POST", "PUT", "DELETE"],
    credentials: true,
  })
);

app.use(express.json());

app.use("/api/cms", webflowRoutes);

app.listen(ENV.PORT, () => {
  console.log(`Server is running at http://localhost:${ENV.PORT}`);
});
