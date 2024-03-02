import { Post } from '@/controllers';
import { Router } from 'express';
import { comments } from './comments';

const router = Router({ mergeParams: true });

router.get('/:slug', Post.GetBySlug);
router.get('/', Post.GetByUsername);

router.use('/:slug/comments', Post.CheckSlug, comments);

export default router;
