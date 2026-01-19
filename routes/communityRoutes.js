
import express from 'express';
import * as communityController from '../controllers/communityController.js';
import { createHandlers } from '../controllers/genericController.js';
import { authenticateToken } from '../middlewares/auth.js';

const router = express.Router();
const marketHandlers = createHandlers('marketplace_items');
const suggestionHandlers = createHandlers('suggestions');

// Marketplace
router.get('/marketplace', authenticateToken, communityController.getMarketplace);
router.post('/marketplace', authenticateToken, communityController.createMarketplaceItem);
router.put('/marketplace/:id', authenticateToken, marketHandlers.update);
router.delete('/marketplace/:id', authenticateToken, marketHandlers.delete);

// Reservations
router.get('/reservations', authenticateToken, communityController.getReservations);
router.post('/reservations', authenticateToken, communityController.createReservation);
router.delete('/reservations/:id', authenticateToken, communityController.deleteReservation);

// Suggestions (Ouvidoria)
router.get('/suggestions', authenticateToken, communityController.getSuggestions);
router.post('/suggestions', authenticateToken, communityController.createSuggestion);
router.put('/suggestions/:id', authenticateToken, suggestionHandlers.update);
router.delete('/suggestions/:id', authenticateToken, suggestionHandlers.delete);

export default router;
