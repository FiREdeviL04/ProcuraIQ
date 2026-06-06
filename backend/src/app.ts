import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import morgan from 'morgan'
import authRoutes from './routes/auth'
import vendorRoutes from './routes/vendors'
import rfqRoutes from './routes/rfqs'
import quotationRoutes from './routes/quotations'
import approvalRoutes from './routes/approvals'
import poRoutes from './routes/purchase-orders'
import invoiceRoutes from './routes/invoices'
import emailRoutes from './routes/email'
import activityLogs from './routes/activity-logs'
import exportJobs from './routes/export-jobs'
import reportsRoutes from './routes/reports'
import notificationsRoutes from './routes/notifications'
import dashboardRoutes from './routes/dashboard'

const app = express()
app.use(cors())
app.use(helmet())
app.use(morgan('dev'))
app.use(express.json())

app.use('/api/auth', authRoutes)
app.use('/api/vendors', vendorRoutes)
app.use('/api/rfqs', rfqRoutes)
app.use('/api/quotations', quotationRoutes)
app.use('/api/approvals', approvalRoutes)
app.use('/api/purchase-orders', poRoutes)
app.use('/api/invoices', invoiceRoutes)
app.use('/api/email', emailRoutes)
app.use('/api/activity-logs', activityLogs)
app.use('/api/exports', exportJobs)
app.use('/api/reports', reportsRoutes)
app.use('/api/notifications', notificationsRoutes)
app.use('/api/dashboard', dashboardRoutes)

app.get('/api/health', (req, res) => res.json({ ok: true }))

export default app
