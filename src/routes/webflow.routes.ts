import { Router } from "express";
import { WebflowController } from "@/controllers";

const router = Router();

router.get("/boats", WebflowController.getBoatsData);

export default router;
