import { Router, type IRouter } from "express";
import healthRouter from "./health";
import usersRouter from "./users";
import postsRouter from "./posts";
import coinsRouter from "./coins";
import rafflesRouter from "./raffles";
import notificationsRouter from "./notifications";
import adminRouter from "./admin";
import followsRouter from "./follows";
import searchRouter from "./search";
import storageRouter from "./storage";

const router: IRouter = Router();

router.use(healthRouter);
router.use("/users", usersRouter);
router.use("/users", followsRouter);
router.use("/posts", postsRouter);
router.use("/coins", coinsRouter);
router.use("/raffles", rafflesRouter);
router.use("/notifications", notificationsRouter);
router.use("/admin", adminRouter);
router.use("/search", searchRouter);
router.use("/storage", storageRouter);

export default router;
