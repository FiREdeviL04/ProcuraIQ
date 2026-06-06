import app from './app'
import http from 'http'
import { Server } from 'socket.io'

const server = http.createServer(app)
const io = new Server(server, { cors: { origin: '*' } })

io.on('connection', socket => {
  console.log('socket connected', socket.id)
});

// expose io on the express app for routes to emit events
(app as any).set('io', io)

const PORT = process.env.PORT || 4000
server.listen(PORT, () => {
  console.log(`VendorBridge backend running on ${PORT}`)
})

// start background export worker
import { startExportWorker } from './worker/exportWorker'
startExportWorker(app)
