import { Router } from 'express';
import { ingest, latest, history, discoveredSchema } from '../controllers/ingest.controller.js';
import { listMachines, getMachine } from '../controllers/machine.controller.js';

const router = Router();

// --- Ingestion (called by the company's PLC engineers) ---
// machineId is now in the BODY, not the URL — the company assigns it.
router.post('/ingest', ingest);

// --- Machines ---
router.get('/machines', listMachines);
router.get('/machines/:machineId', getMachine);

// --- Reading data back / schema discovery ---
router.get('/machines/:machineId/latest', latest);
router.get('/machines/:machineId/history', history);
router.get('/machines/:machineId/schema', discoveredSchema);

export default router;
