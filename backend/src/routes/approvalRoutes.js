import express from 'express';
import { 
  initiateApproval, 
  getApprovals, 
  getApprovalById, 
  approveQuotation, 
  rejectQuotation 
} from '../controllers/approvalController.js';
import authenticate from '../middlewares/auth.js';

import { validate } from '../middlewares/validate.js';
import { initiateApprovalSchema, reviewApprovalSchema } from '../validations/approvalValidation.js';

const router = express.Router();

router.use(authenticate);

router.post('/', validate(initiateApprovalSchema), initiateApproval);
router.get('/', getApprovals);
router.get('/:id', getApprovalById);
router.patch('/:id/approve', validate(reviewApprovalSchema), approveQuotation);
router.patch('/:id/reject', validate(reviewApprovalSchema), rejectQuotation);

export default router;
