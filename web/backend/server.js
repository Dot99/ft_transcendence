import Fastify from 'fastify'
import path from 'path'
import { fileURLToPath } from 'url'
import fastifyStatic from '@fastify/static'
import cors from '@fastify/cors'
import sqlite3 from 'sqlite3'
import { open } from 'sqlite'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const fastify = Fastify()
await fastify.register(cors, { origin: '*' })

// Serve static files from /public
await fastify.register(fastifyStatic, {
  root: path.join(__dirname, 'public'),
  prefix: '/',
})

let db

// User profile and gameplay stats
fastify.get('/api/user/:id', async (req, reply) => {
  const { id } = req.params
  const user = await db.get('SELECT * FROM users WHERE id = ?', id)
  const gameplay = await db.get('SELECT * FROM gameplay WHERE player_id = ?', id)

  reply.send({
    ...user,
    play_time_hours: (user.total_play_time || 0) / 3600,
    total_matches: gameplay?.total_matches || 0,
    matches_won: gameplay?.matches_won || 0,
    matches_lost: gameplay?.matches_lost || 0,
    avg_score: gameplay?.avg_score || 0,
    win_streak: gameplay?.win_streak_max || 0,
    tournaments_won: gameplay?.tournaments_won || 0,
    leaderboard_position: gameplay?.leaderboard_position || 0,
  })
})

// Match history with opponent names
fastify.get('/api/user/:id/matches', async (req, reply) => {
  const { id } = req.params
  const matches = await db.all(`
    SELECT mh.*, u.username AS opponent_username
    FROM match_history mh
    LEFT JOIN users u ON mh.opponent_id = u.id
    WHERE mh.player_id = ?
    ORDER BY mh.match_date DESC
  `, id)
  reply.send(matches)
})

// User's Friends list
fastify.get('/api/user/:id/friends', async (req, reply) => {
  const { id } = req.params

  const friends = await db.all(`
    SELECT u.id, u.username
    FROM friends f
    JOIN users u ON f.friend_id = u.id
    WHERE f.user_id = ?
  `, [id])

  reply.send(friends)
})

// User tournament participation
fastify.get('/api/user/:id/tournaments', async (req, reply) => {
  const { id } = req.params

  // Get all tournaments the user is participating in
  const tournaments = await db.all(`
    SELECT tp.*, t.name, t.start_date, t.end_date
    FROM tournament_players tp
    JOIN tournaments t ON tp.tournament_id = t.tournament_id
    WHERE tp.player_id = ?
  `, id)

  const enrichedTournaments = await Promise.all(tournaments.map(async (t) => {
    // Fetch matches played by the user in this tournament
    const matches = await db.all(`
      SELECT tm.*, u.username AS opponent_username
      FROM tournament_matches tm
      JOIN users u ON u.id = tm.opponent_id
      WHERE tm.tournament_id = ? AND tm.player_id = ?
    `, [t.tournament_id, id])

    // Determine status
    const now = new Date()
    const end = new Date(t.end_date)
    const status = now > end ? 'finished' : 'ongoing'

    return {
      ...t,
      matches,
      matches_played: matches.length,
      final_placement: t.current_position,
      rank: t.current_position,
      status,
    }
  }))

  reply.send(enrichedTournaments)
})

// Upcoming tournament matches
fastify.get('/api/tournaments/upcoming', async (req, reply) => {
  const matches = await db.all(`
    SELECT utm.*, 
           p1.username AS player_name, 
           p2.username AS opponent_name, 
           t.name AS tournament_name
    FROM upcoming_tournament_matches utm
    JOIN users p1 ON utm.player_id = p1.id
    JOIN users p2 ON utm.opponent_id = p2.id
    JOIN tournaments t ON utm.tournament_id = t.tournament_id
    ORDER BY utm.scheduled_date ASC
  `)
  reply.send(matches)
})

// Serve profile page
fastify.get('/profile', async (req, reply) => {
  return reply.sendFile('profile.html')
})

// Serve friends page
fastify.get('/friends', async (req, reply) => {
  return reply.sendFile('friends.html')
})

// Serve play page
fastify.get('/play', async (req, reply) => {
  return reply.sendFile('play.html')
})

const start = async () => {
  db = await open({ filename: '/app/db/stats.db', driver: sqlite3.Database })
  await fastify.listen({ host: '0.0.0.0', port: 3000 })
}

start()
