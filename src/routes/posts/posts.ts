import { Post } from '@/controllers';
import { Router } from 'express';
import { authorize } from '../middleware';

/**
 * Upper post route for major actions and queries
 */
const router = Router();

/* ================================= GET ==================================== */

/** Get posts and, optionally, draft/hidden posts for the logged in user. */
router.get('/me', authorize, Post.GetByUserID);

router.get('/:id', Post.Get);

router.get('/', Post.GetSearch);

/* ================================= POST =================================== */

router.post('/', authorize, Post.Post);

/* ================================= PUT ==================================== */

router.put('/:id', authorize, Post.Put);

/** Increment a post's view count */
router.put('/:id/view', Post.PutView);

/* ================================= DELETE ================================= */

router.delete('/:id', authorize, Post.Delete);

export default router;
