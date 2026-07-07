import { Router } from 'express';
import { authenticate, requireRole } from '../../middleware/auth.middleware.js';
import type { Request, Response, NextFunction } from 'express';
import { query, queryOne } from '../../config/database.js';
import { AppError } from '../../middleware/errorHandler.js';
import { HTTP_STATUS } from '@waliabet/shared';

const router = Router();

// Public: Get all published pages
router.get('/pages', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const pages = await query('SELECT slug, title, content, meta_title, meta_description FROM cms_pages WHERE is_published = true');
    res.json({ success: true, data: pages });
  } catch (err) { next(err); }
});

// Public: Get page by slug
router.get('/pages/:slug', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { slug } = req.params;
    const page = await queryOne('SELECT slug, title, content, meta_title, meta_description FROM cms_pages WHERE slug = $1 AND is_published = true', [slug]);
    if (!page) throw new AppError('Page not found', HTTP_STATUS.NOT_FOUND);
    res.json({ success: true, data: page });
  } catch (err) { next(err); }
});

// Public: Get active banners
router.get('/banners', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const banners = await query(
      `SELECT title, subtitle, image_url, link_url, position, display_order
       FROM banners
       WHERE is_active = true AND (start_date IS NULL OR start_date <= NOW()) AND (end_date IS NULL OR end_date >= NOW())
       ORDER BY display_order ASC`
    );
    res.json({ success: true, data: banners });
  } catch (err) { next(err); }
});

// Admin: Manage CMS pages
router.post('/pages', authenticate, requireRole('admin', 'super_admin'), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { slug, title, content, isPublished, metaTitle, metaDescription } = req.body;
    const [page] = await query(
      `INSERT INTO cms_pages (slug, title, content, is_published, meta_title, meta_description, created_by)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING *`,
      [slug.toLowerCase(), title, content, isPublished ?? false, metaTitle, metaDescription, req.userId]
    );
    res.status(HTTP_STATUS.CREATED).json({ success: true, data: page });
  } catch (err) { next(err); }
});

router.put('/pages/:id', authenticate, requireRole('admin', 'super_admin'), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const { title, content, isPublished, metaTitle, metaDescription } = req.body;
    const [page] = await query(
      `UPDATE cms_pages
       SET title = COALESCE($1, title),
           content = COALESCE($2, content),
           is_published = COALESCE($3, is_published),
           meta_title = COALESCE($4, meta_title),
           meta_description = COALESCE($5, meta_description),
           updated_at = NOW()
       WHERE id = $6
       RETURNING *`,
      [title, content, isPublished, metaTitle, metaDescription, id]
    );
    if (!page) throw new AppError('Page not found', HTTP_STATUS.NOT_FOUND);
    res.json({ success: true, data: page });
  } catch (err) { next(err); }
});

export default router;
