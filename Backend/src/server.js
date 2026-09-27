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

const requiredFields = ['fullName', 'email', 'phone', 'college', 'yearOfStudy']
const csvEscape = (value) => `"${String(value ?? '').replaceAll('"', '""')}"`
const passCode = (id) => `ZEN${String(id).padStart(3, '0')}`

const ensureSchema = async () => {
    await pool.query('ALTER TABLE registrations ADD COLUMN IF NOT EXISTS present TINYINT(1) NOT NULL DEFAULT 0')
    await pool.query('ALTER TABLE registrations ADD COLUMN IF NOT EXISTS present_at TIMESTAMP NULL DEFAULT NULL')
    await pool.query('ALTER TABLE registrations ADD COLUMN IF NOT EXISTS year_of_study VARCHAR(30) NOT NULL DEFAULT "1st Year"')
    await pool.query('ALTER TABLE registrations ADD COLUMN IF NOT EXISTS registration_type VARCHAR(20) NOT NULL DEFAULT "individual"')
    await pool.query('ALTER TABLE registrations ADD COLUMN IF NOT EXISTS team_name VARCHAR(120) NULL DEFAULT NULL')
    await pool.query('ALTER TABLE registrations ADD COLUMN IF NOT EXISTS technical_event VARCHAR(120) NULL DEFAULT NULL')
    await pool.query('ALTER TABLE registrations ADD COLUMN IF NOT EXISTS non_technical_event VARCHAR(120) NULL DEFAULT NULL')
    await pool.query('ALTER TABLE registrations MODIFY COLUMN event_name VARCHAR(255) NOT NULL')
    await pool.query(`
        CREATE TABLE IF NOT EXISTS team_members (
            id INT UNSIGNED NOT NULL AUTO_INCREMENT,
            registration_id INT UNSIGNED NOT NULL,
            member_name VARCHAR(120) NOT NULL,
            member_order TINYINT UNSIGNED NOT NULL DEFAULT 1,
            created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
            PRIMARY KEY (id),
            INDEX idx_team_members_reg_id (registration_id),
            CONSTRAINT fk_team_members_registration FOREIGN KEY (registration_id) REFERENCES registrations(id) ON DELETE CASCADE
        )
    `)
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
    const {
        fullName,
        email,
        phone,
        college,
        yearOfStudy = '1st Year',
        eventName,
        technicalEvent = null,
        nonTechnicalEvent = null,
        registrationType = 'individual',
        teamName = null,
        teamSize = 1,
        teamMembers = [],
    } = request.body

    const missingField = requiredFields.find((field) => typeof request.body[field] !== 'string' || !request.body[field].trim())
    if (missingField) return response.status(400).json({ message: `${missingField} is required.` })
    if (!/^\S+@\S+\.\S+$/.test(email.trim())) return response.status(400).json({ message: 'Enter a valid email address.' })

    const cleanTech = technicalEvent ? String(technicalEvent).trim() : null
    const cleanNonTech = nonTechnicalEvent ? String(nonTechnicalEvent).trim() : null
    let computedEventName = eventName ? String(eventName).trim() : ''

    if (!computedEventName && (cleanTech || cleanNonTech)) {
        computedEventName = [cleanTech, cleanNonTech].filter(Boolean).join(' + ')
    }

    if (!computedEventName) {
        return response.status(400).json({ message: 'Please select at least one event (Technical or Non-Technical).' })
    }

    const isTeam = registrationType === 'team'
    const normalizedType = isTeam ? 'team' : 'individual'
    const normalizedTeamName = isTeam ? (teamName ? String(teamName).trim() : '') : null

    if (isTeam && !normalizedTeamName) {
        return response.status(400).json({ message: 'Team name is required for team registrations.' })
    }

    const normalizedTeamSize = isTeam ? Math.min(5, Math.max(2, Number(teamSize) || 2)) : 1

    let cleanedMembers = []
    if (isTeam) {
        if (Array.isArray(teamMembers)) {
            cleanedMembers = teamMembers.map((m) => String(m ?? '').trim()).filter(Boolean)
        }
        if (cleanedMembers.length === 0 || cleanedMembers[0] !== fullName.trim()) {
            cleanedMembers = [fullName.trim(), ...cleanedMembers]
        }
        if (cleanedMembers.length < normalizedTeamSize) {
            return response.status(400).json({
                message: `Please provide names for all ${normalizedTeamSize} team members.`,
            })
        }
        cleanedMembers = cleanedMembers.slice(0, normalizedTeamSize)
    }

    try {
        const result = await pool.query(
            `INSERT INTO registrations (full_name, email, phone, college, year_of_study, event_name, technical_event, non_technical_event, registration_type, team_name, team_size)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
                fullName.trim(),
                email.trim().toLowerCase(),
                phone.trim(),
                college.trim(),
                String(yearOfStudy || '1st Year').trim(),
                computedEventName,
                cleanTech,
                cleanNonTech,
                normalizedType,
                normalizedTeamName,
                normalizedTeamSize,
            ],
        )

        const registrationId = Number(result.insertId)

        if (isTeam && cleanedMembers.length > 0) {
            for (let i = 0; i < cleanedMembers.length; i++) {
                await pool.query(
                    `INSERT INTO team_members (registration_id, member_name, member_order)
                     VALUES (?, ?, ?)`,
                    [registrationId, cleanedMembers[i], i + 1],
                )
            }
        }

        response.status(201).json({
            message: 'Registration completed.',
            registrationId,
            registrationType: normalizedType,
            teamName: normalizedTeamName,
            eventName: computedEventName,
            technicalEvent: cleanTech,
            nonTechnicalEvent: cleanNonTech,
        })
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
            `SELECT r.id, r.full_name AS fullName, r.email, r.phone, r.college,
                    r.year_of_study AS yearOfStudy, r.event_name AS eventName,
                    r.technical_event AS technicalEvent, r.non_technical_event AS nonTechnicalEvent,
                    r.registration_type AS registrationType, r.team_name AS teamName,
                    r.team_size AS teamSize, r.present, r.present_at AS presentAt,
                    r.created_at AS createdAt,
                    GROUP_CONCAT(tm.member_name ORDER BY tm.member_order SEPARATOR ', ') AS teamMembersList
             FROM registrations r
             LEFT JOIN team_members tm ON r.id = tm.registration_id
             GROUP BY r.id
             ORDER BY r.id DESC`,
        )
        response.json(rows.map((row) => ({
            ...row,
            passCode: passCode(row.id),
            teamMembers: row.teamMembersList ? row.teamMembersList.split(', ') : [],
        })))
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
            `SELECT r.id, r.full_name, r.email, r.phone, r.college, r.year_of_study,
                    r.event_name, r.technical_event, r.non_technical_event,
                    r.registration_type, r.team_name, r.team_size,
                    r.present, r.present_at, r.created_at,
                    GROUP_CONCAT(tm.member_name ORDER BY tm.member_order SEPARATOR '; ') AS team_members
             FROM registrations r
             LEFT JOIN team_members tm ON r.id = tm.registration_id
             GROUP BY r.id
             ORDER BY r.created_at DESC`,
        )
        const header = [
            'ID',
            'Pass',
            'Full name',
            'Email',
            'Phone',
            'College',
            'Year of study',
            'Events',
            'Technical event',
            'Non-technical event',
            'Registration type',
            'Team name',
            'Team size',
            'Team members',
            'Present',
            'Present at',
            'Registered at',
        ]
        const csv = [
            header,
            ...rows.map((row) => [
                row.id,
                passCode(row.id),
                row.full_name,
                row.email,
                row.phone,
                row.college,
                row.year_of_study,
                row.event_name,
                row.technical_event ?? '',
                row.non_technical_event ?? '',
                row.registration_type,
                row.team_name ?? '',
                row.team_size,
                row.team_members ?? row.full_name,
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

ensureSchema()
    .then(() => app.listen(port, () => console.log(`Zen-it-trix API listening on http://localhost:${port}`)))
    .catch((error) => {
        console.error('Could not prepare database schema.', error)
        process.exitCode = 1
    })
