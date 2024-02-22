import { Login } from '@/controllers';
import { Router } from 'express';

const router = Router();

router.post('/login', Login.PostLogin);
router.post('/logout', Login.PostLogout);

export default router;
