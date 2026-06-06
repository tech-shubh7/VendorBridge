import express from 'express';
import { 
  initiateApproval, 
  getApprovals, 
  getApprovalById, 
  approveQuotation, 
  rejectQuotation 
} from '../controllers/approvalController.js';
import authenticate from '../middlewares/auth.js';

const router = express.Router();

router.use(authenticate);

router.post('/', initiateApproval);
router.get('/', getApprovals);
router.get('/:id', getApprovalById);
router.patch('/:id/approve', approveQuotation);
router.patch('/:id/reject', rejectQuotation);

export default router;
