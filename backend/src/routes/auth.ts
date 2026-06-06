import { Router } from 'express'
import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcrypt'
import jwt from 'jsonwebtoken'
import { createActivity } from '../utils/activity'

const prisma = new PrismaClient()
const router = Router()

router.post('/register', async (req: any, res) => {
  try {
    const { firstName, lastName, email, password, role } = req.body
    if (!email || !password) return res.status(400).json({ error: 'Missing fields' })
    const existing = await prisma.user.findUnique({ where: { email } })
    if (existing) return res.status(400).json({ error: 'User exists' })
    const hashed = await bcrypt.hash(password, 10)
    const user = await prisma.user.create({ data: { firstName, lastName, email, password: hashed, role } })
    const token = jwt.sign({ userId: user.id, role: user.role }, process.env.JWT_SECRET || 'secret', { expiresIn: '8h' })
    await createActivity(user.id, 'Register', 'User', user.id)
    res.json({ token, user: { id: user.id, email: user.email, role: user.role } })
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Server error' })
  }
})

router.post('/login', async (req: any, res) => {
  try {
    const { email, password } = req.body
    const user = await prisma.user.findUnique({ where: { email } })
    if (!user) return res.status(401).json({ error: 'Invalid credentials' })
    const ok = await bcrypt.compare(password, user.password)
    if (!ok) return res.status(401).json({ error: 'Invalid credentials' })
    const token = jwt.sign({ userId: user.id, role: user.role }, process.env.JWT_SECRET || 'secret', { expiresIn: '8h' })
    await createActivity(user.id, 'Login', 'User', user.id)
    res.json({ token, user: { id: user.id, email: user.email, role: user.role } })
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Server error' })
  }
})

// logout (client-side token invalidation) - record activity
router.post('/logout', async (req: any, res) => {
  try {
    const userId = req.body.userId || 'unknown'
    await createActivity(userId, 'Logout', 'User', userId)
    res.json({ ok: true })
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Server error' })
  }
})

// forgot-password stub - record request
router.post('/forgot-password', async (req: any, res) => {
  try {
    const { email } = req.body
    const user = await prisma.user.findUnique({ where: { email } })
    if (user) await createActivity(user.id, 'Forgot Password', 'User', user.id)
    res.json({ ok: true })
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Server error' })
  }
})

export default router
