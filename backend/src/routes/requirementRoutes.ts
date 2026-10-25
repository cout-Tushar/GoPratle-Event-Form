import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import { create, getById, list } from '../controllers/requirementController';

const router = Router();
const writeLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: process.env.NODE_ENV === 'test' ? 100 : 10,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Too many submissions. Please try again later.',
  },
});

router.post('/', writeLimiter, create);
router.get('/', list);
router.get('/:id', getById);
export default router;
