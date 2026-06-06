import express from 'express';
import * as ApprovalController from '../controllers/approvalController.js';
import authenticate from '../middlewares/auth.js';

import { validate } from '../middlewares/validate.js';
import { initiateApprovalSchema, reviewApprovalSchema } from '../validations/approvalValidation.js';

const router = express.Router();

router.use(authenticate);

router.post('/', ApprovalController.initiateApproval);
router.get('/', ApprovalController.getApprovals);
router.get('/:id', ApprovalController.getApprovalById);
router.patch('/:id/approve', ApprovalController.approveQuotation);
router.patch('/:id/reject', ApprovalController.rejectQuotation);

export default router;
