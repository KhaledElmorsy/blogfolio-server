import { User } from '@/controllers';
import { Router } from 'express';
import { posts } from './posts';

/**
 * Main username parent route. Confirms the username exists and passes to child routes.
 * `/user/:username/childroutes/...`
 */
const router = Router();

router.get('/:username', User.GetUsername);

router.use('/:username/posts', posts);

export default router;
