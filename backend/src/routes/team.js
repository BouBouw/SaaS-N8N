import express from 'express';
import * as teamController from '../controllers/teamController.js';
import { verifyJWT } from '../middleware/auth.js';

const router = express.Router();

// All routes are protected
router.use(verifyJWT);

// Team management
router.post('/invite', teamController.inviteMember);
router.get('/members', teamController.getMembers);
router.put('/members/:memberId/role', teamController.updateRole);
router.delete('/members/:memberId', teamController.removeMember);

// Invitations
router.get('/invitations', teamController.getInvitations);
router.post('/invitations/:memberId/accept', teamController.acceptInvitation);
router.post('/invitations/:memberId/decline', teamController.declineInvitation);

export default router;
