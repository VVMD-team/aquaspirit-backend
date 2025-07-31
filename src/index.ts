import express from "express";
import cors from "cors";

import { ENV } from "./env";

import webflowRoutes from "./routes/boats.routes";

const app = express();

app.use(
  cors({
    origin: "https://verge3d-boat-ui.webflow.io",
    methods: ["GET", "POST", "PUT", "DELETE"],
    credentials: true,
  })
);

app.use(express.json());

app.use("/api/cms", webflowRoutes);

app.listen(ENV.PORT, () => {
  console.log(`Server is running at http://localhost:${ENV.PORT}`);
});
