import express from "express";
import cors from "cors";

import { ENV } from "./env";

import webflowRoutes from "./routes/boats.routes";

const app = express();

const allowedOrigins = [
  "https://verge3d-boat-ui.webflow.io",
  "https://grand-3d-test.vercel.app",
  "https://constructor.grandboats.com",
  "https://aquaspirit-backend-production.up.railway.app",
  "http://localhost:8669",
  "https://localhost:8669",
  "https://s3.us-east-1.amazonaws.com/assets.vvmd.team/Grand3d/test/index3.html?id=685569e2da50c670bb2fc01d",
];

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.includes(origin)) {
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
