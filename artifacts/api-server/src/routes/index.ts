import { Router, type IRouter } from "express";
import healthRouter from "./health";
import servicesRouter from "./services";
import metricsRouter from "./metrics";
import { logsRouter } from "./logs";
import { incidentsRouter } from "./incidents";
import { deploymentsRouter } from "./deployments";
import { dashboardRouter } from "./dashboard";

const router: IRouter = Router();

router.use(healthRouter);
router.use("/dashboard", dashboardRouter);
router.use(servicesRouter);
router.use(metricsRouter);
router.use("/logs", logsRouter);
router.use("/incidents", incidentsRouter);
router.use("/deployments", deploymentsRouter);

export default router;
