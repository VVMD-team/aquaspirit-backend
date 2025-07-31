import { Router } from "express";
import { BoatsController } from "@/controllers";

const router = Router();

router.get("/boats", BoatsController.getBoatsData);

router.post("/boats/send-info", BoatsController.sendBoatsData);

export default router;
