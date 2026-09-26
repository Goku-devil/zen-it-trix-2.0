import 'dotenv/config'
import crypto from 'node:crypto'
import bwipjs from 'bwip-js'
import cors from 'cors'
import express from 'express'
import mariadb from 'mariadb'

const app = express()
const port = Number(process.env.PORT || 4000)
const allowedOrigin = process.env.FRONTEND_ORIGIN || 'http://localhost:5173'
const adminUsername = process.env.ADMIN_USERNAME || 'admin'
const adminPassword = process.env.ADMIN_PASSWORD || 'change_this_password'
const adminSessions = new Map()
const pool = mariadb.createPool({
    host: process.env.DB_HOST || 'localhost',
    port: Number(process.env.DB_PORT || 3306),
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME || 'zen_it_trix',
    connectionLimit: Number(process.env.DB_CONNECTION_LIMIT || 5),
})

app.use(cors({ origin: allowedOrigin }))
app.use(express.json({ limit: '20kb' }))

const requiredFields = ['fullName', 'email', 'phone', 'college', 'eventName']
const csvEscape = (value) => `"${String(value ?? '').replaceAll('"', '""')}"`
const passCode = (id) => `ZEN${String(id).padStart(3, '0')}`

const ensureAttendanceColumns = async () => {
    await pool.query('ALTER TABLE registrations ADD COLUMN IF NOT EXISTS present TINYINT(1) NOT NULL DEFAULT 0')
    await pool.query('ALTER TABLE registrations ADD COLUMN IF NOT EXISTS present_at TIMESTAMP NULL DEFAULT NULL')
}

const requireAdmin = (request, response, next) => {
    const token = request.headers.authorization?.replace('Bearer ', '')
    const expiresAt = adminSessions.get(token)
    if (!token || !expiresAt || expiresAt < Date.now()) {
        adminSessions.delete(token)
        return response.status(401).json({ message: 'Admin login required.' })
    }
    next()
}

app.get('/', (_request, response) => {
    response.json({
        name: 'Zen-it-trix registration API',
        endpoints: {
            health: 'GET /api/health',
            registrations: 'POST /api/registrations',
            report: 'GET /api/registrations/export',
            admin: 'POST /api/admin/login',
        },
    })
})

app.post('/api/admin/login', (request, response) => {
    const { username, password } = request.body
    if (username !== adminUsername || password !== adminPassword) return response.status(401).json({ message: 'Invalid admin credentials.' })
    const token = crypto.randomBytes(32).toString('hex')
    const sessionMinutes = Number(process.env.ADMIN_SESSION_MINUTES || 240)
    adminSessions.set(token, Date.now() + sessionMinutes * 60 * 1000)
    response.json({ token, expiresInMinutes: sessionMinutes })
})

app.get('/api/health', async (_request, response) => {
    try {
        await pool.query('SELECT 1')
        response.json({ status: 'ok', database: 'connected' })
    } catch {
        response.status(503).json({ status: 'error', database: 'unavailable' })
    }
})

const saveRegistration = async (request, response) => {
    const { fullName, email, phone, college, eventName, teamSize = 1 } = request.body
    const missingField = requiredFields.find((field) => typeof request.body[field] !== 'string' || !request.body[field].trim())
    const normalizedTeamSize = Number(teamSize)

    if (missingField) return response.status(400).json({ message: `${missingField} is required.` })
    if (!/^\S+@\S+\.\S+$/.test(email.trim())) return response.status(400).json({ message: 'Enter a valid email address.' })
    if (!Number.isInteger(normalizedTeamSize) || normalizedTeamSize < 1 || normalizedTeamSize > 10) {
        return response.status(400).json({ message: 'Team size must be between 1 and 10.' })
    }

    try {
        const result = await pool.query(
            `INSERT INTO registrations (full_name, email, phone, college, event_name, team_size)
             VALUES (?, ?, ?, ?, ?, ?)`,
            [fullName.trim(), email.trim().toLowerCase(), phone.trim(), college.trim(), eventName.trim(), normalizedTeamSize],
        )
        response.status(201).json({ message: 'Registration completed.', registrationId: Number(result.insertId) })
    } catch (error) {
        if (error.code === 'ER_DUP_ENTRY') return response.status(409).json({ message: 'This email is already registered for that event.' })
        console.error(error)
        response.status(500).json({ message: 'The registration could not be saved.' })
    }
}

app.post('/api/registrations', saveRegistration)

app.get('/api/admin/registrations', requireAdmin, async (_request, response) => {
    try {
        const rows = await pool.query(
            `SELECT id, full_name AS fullName, email, phone, college, event_name AS eventName, team_size AS teamSize,
                    present, present_at AS presentAt, created_at AS createdAt
             FROM registrations ORDER BY id DESC`,
        )
        response.json(rows.map((row) => ({ ...row, passCode: passCode(row.id) })))
    } catch (error) {
        console.error(error)
        response.status(500).json({ message: 'The registrations could not be loaded.' })
    }
})

app.post('/api/admin/registrations', requireAdmin, saveRegistration)

app.post('/api/admin/registrations/:id/present', requireAdmin, async (request, response) => {
    try {
        const result = await pool.query(
            `UPDATE registrations SET present = 1, present_at = COALESCE(present_at, CURRENT_TIMESTAMP) WHERE id = ?`,
            [Number(request.params.id)],
        )
        if (!result.affectedRows) return response.status(404).json({ message: 'Registration not found.' })
        response.json({ message: 'Student marked present.' })
    } catch (error) {
        console.error(error)
        response.status(500).json({ message: 'Attendance could not be recorded.' })
    }
})

app.get('/api/admin/registrations/:id/barcode', requireAdmin, async (request, response) => {
    const code = passCode(Number(request.params.id))
    if (!/^ZEN\d{3,}$/.test(code)) return response.status(400).json({ message: 'Invalid registration ID.' })
    try {
        const png = await bwipjs.toBuffer({ bcid: 'code128', text: code, scale: 3, height: 12, includetext: true, textxalign: 'center' })
        response.type('image/png').send(png)
    } catch (error) {
        console.error(error)
        response.status(500).json({ message: 'The barcode could not be generated.' })
    }
})

app.get('/api/registrations/export', requireAdmin, async (_request, response) => {
    try {
        const rows = await pool.query(
            `SELECT id, full_name, email, phone, college, event_name, team_size, present, present_at, created_at
             FROM registrations
             ORDER BY created_at DESC`,
        )
        const header = ['ID', 'Pass', 'Full name', 'Email', 'Phone', 'College', 'Event', 'Team size', 'Present', 'Present at', 'Registered at']
        const csv = [
            header,
            ...rows.map((row) => [
                row.id,
                passCode(row.id),
                row.full_name,
                row.email,
                row.phone,
                row.college,
                row.event_name,
                row.team_size,
                row.present ? 'YES' : 'NO',
                row.present_at instanceof Date ? row.present_at.toISOString() : row.present_at,
                row.created_at instanceof Date ? row.created_at.toISOString() : row.created_at,
            ]),
        ].map((row) => row.map(csvEscape).join(',')).join('\r\n')

        response.attachment('zen-it-trix-registrations.csv')
        response.type('text/csv').send(`\ufeff${csv}`)
    } catch (error) {
        console.error(error)
        response.status(500).json({ message: 'The registrations could not be exported.' })
    }
})

app.use((_request, response) => response.status(404).json({ message: 'Route not found.' }))

ensureAttendanceColumns()
    .then(() => app.listen(port, () => console.log(`Zen-it-trix API listening on http://localhost:${port}`)))
    .catch((error) => {
        console.error('Could not prepare attendance columns.', error)
        process.exitCode = 1
    })
