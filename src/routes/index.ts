import { Router } from "express";
import controller from "../controllers";

const router = Router();

export default router.get("/user", controller.getUserData);
