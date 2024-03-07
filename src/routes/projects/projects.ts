import { Project } from '@/controllers';
import { Router } from 'express';
import { authorize } from '../middleware';

const router = Router();

/* ================================= GET ==================================== */

router.get('/:projectID', Project.GetProject);

router.get('/', Project.GetUserProjects);

/* ================================= POST =================================== */

router.post('/', authorize, Project.Post);

/* ================================= PUT ==================================== */

router.put('/', authorize, Project.Put);

/* ================================= DELETE ================================= */

router.delete('/:projectID', authorize, Project.Delete);

export default router;
