import { Router } from 'express';
import { Emote } from '@/controllers';
import { authorize } from '../middleware';

const router = Router();

/* ================================= GET ==================================== */

router.get('/', Emote.Get);

/* ================================ POST ==================================== */

router.post('/post/', authorize, Emote.PostNewPostEmote);

router.post('/comment/', authorize, Emote.PostNewCommentEmote);

router.post('/post/get', Emote.PostGetPostEmotes);

router.post('/comment/get', Emote.PostGetPostEmotes);

/* ================================= PUT ==================================== */

router.put('/post/', authorize, Emote.PutPostEmote);

router.put('/comment/', authorize, Emote.PutCommentEmote);

/* =============================== DELETE =================================== */

router.delete('/post/:postID', authorize, Emote.DeletePostEmote);

router.delete('/comment/:commentID', authorize, Emote.DeleteCommentEmote);

export default router;
