import { Authentication } from '@/controllers';
import { Router } from 'express';

const router = Router();

router.post('/login', Authentication.PostLogin);
router.post('/logout', Authentication.PostLogout);

export default router;
