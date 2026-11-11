import { createServer } from 'node:http'
import { Server } from 'socket.io'
import { app } from './app.js'
import { env } from './config/env.js'
import { connect } from './db/connect.js'
import { attach } from './realtime/socket.js'

// HTTP + Socket.io share one port; rooms and handshake live in src/realtime.
const http = createServer(app)
attach(new Server(http, { path: '/socket.io' }))

await connect()
http.listen(env.port, () => console.log(`api listening on :${env.port}`))
