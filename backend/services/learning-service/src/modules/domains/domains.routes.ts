import { Router } from 'express';
import { authenticate } from '../../middleware/authenticate';
import { authorize } from '../../middleware/authorize';
import * as ctrl from './domains.controller';

const router = Router();

/**
 * @swagger
 * tags:
 *   name: Domains
 *   description: Learning domain management
 */

/**
 * @swagger
 * /domains:
 *   get:
 *     summary: List all domains
 *     tags: [Domains]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Array of domains
 */
router.get('/domains', authenticate, ctrl.listDomains);

/**
 * @swagger
 * /domains/{slug}:
 *   get:
 *     summary: Get domain by slug
 *     tags: [Domains]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: slug
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Domain object
 *       404:
 *         description: Not found
 */
router.get('/domains/:slug', authenticate, ctrl.getDomainBySlug);

/**
 * @swagger
 * /domains:
 *   post:
 *     summary: Create a new domain
 *     tags: [Domains]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [name, slug]
 *             properties:
 *               name:
 *                 type: string
 *               slug:
 *                 type: string
 *               description:
 *                 type: string
 *               iconUrl:
 *                 type: string
 *     responses:
 *       201:
 *         description: Created domain
 *       409:
 *         description: Duplicate name or slug
 */
router.post('/domains', authenticate, authorize('admin', 'domain_expert'), ctrl.createDomain);

/**
 * @swagger
 * /domains/{id}:
 *   patch:
 *     summary: Update a domain
 *     tags: [Domains]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Updated domain
 *       404:
 *         description: Not found
 */
router.patch('/domains/:id', authenticate, authorize('admin', 'domain_expert'), ctrl.updateDomain);

router.delete('/domains/:id', authenticate, authorize('admin', 'domain_expert'), ctrl.deleteDomain);

export default router;
