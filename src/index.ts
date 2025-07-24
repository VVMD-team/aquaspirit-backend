import express from "express";

import { ENV } from "./env";

import webflowRoutes from "@/routes/webflow.routes";

const app = express();

app.use(express.json());

app.use("/api/cms", webflowRoutes);

app.listen(ENV.PORT, () => {
  console.log(`Server is running at http://localhost:${ENV.PORT}`);
});
