import { createServer } from 'node:http'
import { Server } from 'socket.io'
import { app } from './app.js'
import { env } from './config/env.js'

// HTTP + Socket.io share one port; auction/user rooms are set up in src/realtime.
const http = createServer(app)
export const io = new Server(http, { path: '/socket.io' })

http.listen(env.port, () => console.log(`api listening on :${env.port}`))
