import { Router } from 'express';
import { withExpress } from '@/controllers/adapters';
import { User as UserController } from '@/controllers';

const router = Router();

const User = withExpress(UserController);

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

router.put('/:id', User.Put);

router.put('/:followerId/follows/:id', User.PutFollower);

router.put('/:id/email', User.PutEmail);

router.put('/:id/username', User.PutUsername);

router.put('/:id/password', User.PutPassword);

router.put('/:id/activate', User.PutActivate);

/* ================================ POST ==================================== */

router.post('/', User.Post);

/* =============================== DELETE =================================== */

router.delete('/:id', User.Delete);

router.delete('/:id/follows/:followerId', User.DeleteFollow);

export default router;
