import { Router } from 'express';
import { User } from '@/controllers';
import { authenticate } from '../middleware';

const router = Router();

/* ================================= GET ==================================== */

router.get('/:id/', User.Get);

router.get('/:id/follows', User.GetFollows);

router.get('/:id/followers', User.GetFollowers);

router.get('/s/username/:username', User.GetSearchUsername);

router.get('/s/any/:text', User.GetSearchAny);

router.get('/t/exists/email/:email', User.GetExistsEmail);

router.get('/t/exists/username/:username', User.GetExistsUsername);

router.get('/:followerId/follows/:id', User.GetCheckFollow);

/* ================================= PUT ==================================== */

router.put('/*', authenticate);

router.put('/', User.Put);

router.put('/followers/:targetId', User.PutFollower);

router.put('/email', User.PutEmail);

router.put('/username', User.PutUsername);

router.put('/password', User.PutPassword);

router.put('/activate', User.PutActivate);

/* ================================ POST ==================================== */

router.post('/', User.Post);

/* =============================== DELETE =================================== */

router.delete('/*', authenticate);

router.delete('/', User.Delete);

router.delete('/follows/:targetId', User.DeleteFollow);

export default router;
