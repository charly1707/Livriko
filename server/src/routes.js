import express from 'express';
import { requireAuth, requireAdmin } from './middleware/auth.js';
import { imageUpload, handleMulter } from './middleware/upload.js';
import * as auth from './controllers/authController.js';
import * as admin from './controllers/adminController.js';
import * as products from './controllers/productController.js';
import * as stores from './controllers/storeController.js';
import * as orders from './controllers/orderController.js';
import * as payments from './controllers/paymentController.js';
import * as wallet from './controllers/walletController.js';
import * as chat from './controllers/chatController.js';
import * as reviews from './controllers/reviewController.js';
import * as catalogReviews from './controllers/catalogReviewController.js';
import * as serviceExpress from './controllers/serviceExpressController.js';
import * as maps from './controllers/mapsController.js';
import * as subscriptions from './controllers/subscriptionController.js';
import * as health from './controllers/healthController.js';
import * as upload from './controllers/uploadController.js';
import { mtnWebhook } from './controllers/webhookController.js';

export function createApiRouter() {
  const router = express.Router();

  router.post('/auth/login', auth.login);
  router.post('/auth/register', auth.register);
  router.post('/auth/logout', auth.logout);
  router.get('/auth/me', auth.me);
  router.post('/auth/profile', requireAuth, auth.updateProfile);
  router.post('/auth/delete-account', requireAuth, auth.deleteMyAccount);

  router.post('/upload/register-image', handleMulter(imageUpload.single('image')), upload.uploadRegisterImage);
  router.post('/upload/image', requireAuth, handleMulter(imageUpload.single('image')), upload.uploadImage);

  router.get('/products', products.listAllProducts);
  router.post('/products', requireAuth, products.createProduct);
  router.get('/products/restaurant', requireAuth, products.listRestaurantProducts);
  router.post('/products/update', requireAuth, products.updateProduct);
  router.post('/products/delete', requireAuth, products.deleteProduct);
  router.post('/products/upload-image', requireAuth, handleMulter(imageUpload.single('image')), products.uploadImage);

  router.get('/restaurants', stores.listStores);
  router.post('/restaurants/update', requireAuth, stores.updateStore);

  router.get('/wallet', requireAuth, wallet.getWallet);
  router.post('/wallet/credit', requireAuth, requireAdmin, wallet.creditWallet);

  router.get('/admin/users', requireAuth, requireAdmin, admin.listUsers);
  router.post('/admin/users/create', requireAuth, requireAdmin, admin.createAdminUser);
  router.post('/admin/livreurs/approve', requireAuth, requireAdmin, admin.approveLivreur);
  router.post('/admin/livreurs/reject', requireAuth, requireAdmin, admin.rejectLivreur);
  router.post('/admin/livreurs/incomplete', requireAuth, requireAdmin, admin.requestIncompleteLivreur);
  router.post('/admin/stores/certify', requireAuth, requireAdmin, admin.toggleStoreCertification);
  router.post('/admin/stores/delete', requireAuth, requireAdmin, admin.deleteStore);
  router.post('/admin/users/delete', requireAuth, requireAdmin, admin.deleteUserAccount);

  router.get('/orders', requireAuth, orders.listOrders);
  router.post('/orders', requireAuth, orders.createOrder);
  router.post('/orders/status', requireAuth, orders.updateOrderStatus);
  router.post('/orders/archive', requireAuth, orders.archiveOrder);

  router.post('/payments/transactions', requireAuth, payments.createTransaction);
  router.get('/payments/status', requireAuth, payments.paymentStatus);
  router.post('/webhooks/mtn', mtnWebhook);

  router.post('/chat/create', requireAuth, chat.getOrCreateConversation);
  router.get('/chat/messages', requireAuth, chat.getMessages);
  router.post('/chat/send', requireAuth, chat.sendMessage);
  router.post('/chat/add_participant', requireAuth, chat.addParticipant);
  router.post('/chat/mark_read', requireAuth, chat.markRead);
  router.post('/chat/upload', requireAuth, handleMulter(imageUpload.single('image')), chat.uploadChatImage);

  router.post('/reviews/create', requireAuth, reviews.createReview);
  router.get('/reviews/driver', reviews.listForDriver);
  router.get('/reviews/admin', requireAuth, requireAdmin, reviews.adminList);
  router.post('/reviews/report', requireAuth, reviews.createReport);

  router.get('/reviews/catalog', catalogReviews.listCatalogReviews);
  router.post('/reviews/catalog/create', requireAuth, catalogReviews.createCatalogReview);

  router.get('/service-express', requireAuth, serviceExpress.listMissions);
  router.post('/service-express', requireAuth, serviceExpress.createMission);
  router.post('/service-express/status', requireAuth, serviceExpress.updateMissionStatus);

  router.get('/maps/route', requireAuth, maps.route);
  router.post('/subscriptions', subscriptions.subscribe);
  router.get('/health/db', health.database);

  router.use((req, res) => {
    res.status(404).json({ error: 'Endpoint not found' });
  });

  return router;
}
