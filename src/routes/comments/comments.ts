import { Router } from 'express';
import { Comment } from '@/controllers';
import { authorize } from '../middleware';

const router = Router();

/* ================================= GET ==================================== */

router.get('/:id/', Comment.Get);

router.get('/', Comment.GetByRelation);

/* ================================ POST ==================================== */

router.post('/', authorize, Comment.Post);

/* ================================= PUT ==================================== */

router.put('/:id', authorize, Comment.Put);

/* =============================== DELETE =================================== */

router.delete('/:id', authorize, Comment.Delete);

export default router;
