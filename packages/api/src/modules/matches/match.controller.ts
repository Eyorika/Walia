import type { Request, Response, NextFunction } from 'express';
import { query, queryOne } from '../../config/database.js';
import { AppError } from '../../middleware/errorHandler.js';
import { HTTP_STATUS } from '@waliabet/shared';

export async function getMatches(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { status, leagueId, sportId, date, page = 1, limit = 20 } = req.query;
    const conditions: string[] = [];
    const params: unknown[] = [];

    if (status) { params.push(status); conditions.push(`m.status = $${params.length}`); }
    if (leagueId) { params.push(leagueId); conditions.push(`m.league_id = $${params.length}`); }
    if (sportId) { params.push(sportId); conditions.push(`l.sport_id = $${params.length}`); }
    if (date) {
      params.push(date);
      conditions.push(`DATE(m.kickoff_time AT TIME ZONE 'Africa/Addis_Ababa') = $${params.length}`);
    }

    const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
    const offset = (Number(page) - 1) * Number(limit);
    params.push(Number(limit), offset);

    const matches = await query(
      `SELECT m.*,
              ht.name as home_team_name, ht.logo as home_team_logo,
              at.name as away_team_name, at.logo as away_team_logo,
              l.name as league_name, l.logo as league_logo,
              s.name as sport_name, s.slug as sport_slug
       FROM matches m
       LEFT JOIN teams ht ON m.home_team_id = ht.id
       LEFT JOIN teams at ON m.away_team_id = at.id
       LEFT JOIN leagues l ON m.league_id = l.id
       LEFT JOIN sports s ON l.sport_id = s.id
       ${where}
       ORDER BY m.kickoff_time ASC
       LIMIT $${params.length - 1} OFFSET $${params.length}`,
      params
    );

    res.json({ success: true, data: matches });
  } catch (err) { next(err); }
}

export async function getLiveMatches(_req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const matches = await query(
      `SELECT m.*,
              ht.name as home_team_name, ht.logo as home_team_logo,
              at.name as away_team_name, at.logo as away_team_logo,
              l.name as league_name, s.name as sport_name
       FROM matches m
       LEFT JOIN teams ht ON m.home_team_id = ht.id
       LEFT JOIN teams at ON m.away_team_id = at.id
       LEFT JOIN leagues l ON m.league_id = l.id
       LEFT JOIN sports s ON l.sport_id = s.id
       WHERE m.status IN ('live', 'half_time')
       ORDER BY m.kickoff_time ASC`
    );
    res.json({ success: true, data: matches });
  } catch (err) { next(err); }
}

export async function getMatchById(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { id } = req.params;

    const match = await queryOne(
      `SELECT m.*,
              ht.name as home_team_name, ht.logo as home_team_logo,
              at.name as away_team_name, at.logo as away_team_logo,
              l.name as league_name, l.logo as league_logo,
              s.name as sport_name, s.slug as sport_slug,
              v.name as venue_name, v.city as venue_city
       FROM matches m
       LEFT JOIN teams ht ON m.home_team_id = ht.id
       LEFT JOIN teams at ON m.away_team_id = at.id
       LEFT JOIN leagues l ON m.league_id = l.id
       LEFT JOIN sports s ON l.sport_id = s.id
       LEFT JOIN venues v ON m.venue_id = v.id
       WHERE m.id = $1`,
      [id]
    );

    if (!match) throw new AppError('Match not found', HTTP_STATUS.NOT_FOUND);

    // Load markets with odds
    const markets = await query(
      `SELECT mk.*, json_agg(o ORDER BY o.name) as odds
       FROM markets mk
       LEFT JOIN odds o ON mk.id = o.market_id AND o.is_active = true AND o.is_suspended = false
       WHERE mk.match_id = $1 AND mk.status != 'closed'
       GROUP BY mk.id
       ORDER BY mk.name`,
      [id]
    );

    // Load timeline
    const timeline = await query(
      'SELECT * FROM match_timelines WHERE match_id = $1 ORDER BY minute ASC',
      [id]
    );

    res.json({ success: true, data: { ...match, markets, timeline } });
  } catch (err) { next(err); }
}

export async function createMatch(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { leagueId, homeTeamId, awayTeamId, venueId, kickoffTime } = req.body;

    const [match] = await query(
      `INSERT INTO matches (league_id, home_team_id, away_team_id, venue_id, kickoff_time, status)
       VALUES ($1, $2, $3, $4, $5, 'scheduled') RETURNING *`,
      [leagueId, homeTeamId, awayTeamId, venueId ?? null, kickoffTime]
    );

    res.status(201).json({ success: true, data: match });
  } catch (err) { next(err); }
}

export async function updateMatchResult(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { id } = req.params;
    const { homeScore, awayScore, status } = req.body;

    const [match] = await query(
      'UPDATE matches SET home_score = $1, away_score = $2, status = $3 WHERE id = $4 RETURNING *',
      [homeScore, awayScore, status ?? 'finished', id]
    );

    if (!match) throw new AppError('Match not found', HTTP_STATUS.NOT_FOUND);

    // Insert or update result
    await query(
      `INSERT INTO results (match_id, home_score, away_score, winner, status, settled_by)
       VALUES ($1, $2, $3, $4, 'confirmed', $5)
       ON CONFLICT (match_id) DO UPDATE SET home_score = $2, away_score = $3, winner = $4`,
      [id, homeScore, awayScore,
        homeScore > awayScore ? 'home' : awayScore > homeScore ? 'away' : 'draw',
        req.userId]
    );

    res.json({ success: true, data: match });
  } catch (err) { next(err); }
}
