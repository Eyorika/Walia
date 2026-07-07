import type { Request, Response, NextFunction } from 'express';
import { query, queryOne } from '../../config/database.js';
import { AppError } from '../../middleware/errorHandler.js';
import { HTTP_STATUS } from '@waliabet/shared';

export async function getSports(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const sports = await query('SELECT * FROM sports WHERE is_active = true ORDER BY display_order ASC');
    res.json({ success: true, data: sports });
  } catch (err) { next(err); }
}

export async function createSport(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { name, slug, icon, displayOrder } = req.body;
    const [sport] = await query(
      'INSERT INTO sports (name, slug, icon, display_order) VALUES ($1, $2, $3, $4) RETURNING *',
      [name, slug, icon, displayOrder ?? 0]
    );
    res.status(201).json({ success: true, data: sport });
  } catch (err) { next(err); }
}

export async function getLeagues(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { sportId, countryId } = req.query;
    const conditions: string[] = ['l.is_active = true'];
    const params: unknown[] = [];

    if (sportId) { params.push(sportId); conditions.push(`l.sport_id = $${params.length}`); }
    if (countryId) { params.push(countryId); conditions.push(`l.country_id = $${params.length}`); }

    const leagues = await query(
      `SELECT l.*, s.name as sport_name, s.slug as sport_slug, c.name as country_name, c.code as country_code
       FROM leagues l
       LEFT JOIN sports s ON l.sport_id = s.id
       LEFT JOIN countries c ON l.country_id = c.id
       WHERE ${conditions.join(' AND ')}
       ORDER BY l.display_order ASC`,
      params
    );
    res.json({ success: true, data: leagues });
  } catch (err) { next(err); }
}

export async function getTeams(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { leagueId, search } = req.query;
    const conditions: string[] = ['t.is_active = true'];
    const params: unknown[] = [];

    if (leagueId) { params.push(leagueId); conditions.push(`t.league_id = $${params.length}`); }
    if (search) { params.push(`%${search}%`); conditions.push(`t.name ILIKE $${params.length}`); }

    const teams = await query(
      `SELECT t.*, c.name as country_name FROM teams t LEFT JOIN countries c ON t.country_id = c.id WHERE ${conditions.join(' AND ')} ORDER BY t.name`,
      params
    );
    res.json({ success: true, data: teams });
  } catch (err) { next(err); }
}

export async function getCountries(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const countries = await query('SELECT * FROM countries WHERE is_active = true ORDER BY name ASC');
    res.json({ success: true, data: countries });
  } catch (err) { next(err); }
}
