import { Router } from 'express';
import { Comment } from '@/controllers';

const router = Router({ mergeParams: true });

router.get('/', Comment.GetBySlug);

export default router;
