import { Router } from "express";
import { BoatsController } from "@/controllers";

const router = Router();

router.get("/boats", BoatsController.getBoatsData);

export default router;
