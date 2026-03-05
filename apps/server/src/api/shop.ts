import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import { purchaseCosmetic, equipCosmetic, getMyCosmetics, getMarketplace } from '../controllers/shop.controller';

const router = Router();
router.use(authenticate);

router.post('/purchase', purchaseCosmetic);
router.post('/equip', equipCosmetic);
router.get('/@me', getMyCosmetics);
router.get('/marketplace', getMarketplace);

export default router;
