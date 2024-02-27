import { Post } from '@/controllers';
import { Router } from 'express';

const router = Router({ mergeParams: true });

router.get('/:slug', Post.GetBySlug);
router.get('/', Post.GetByUsername);

export default router;
