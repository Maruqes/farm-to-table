import type { Server } from 'socket.io'

// The only place modules touch the socket server; attach() registers it.
let io: Server | null = null

export function setIo(server: Server): void {
  io = server
}

export function emitToUser(userId: string, event: string, payload: unknown): void {
  io?.to(`user:${userId}`).emit(event, payload)
}

export function emitToAuction(auctionId: string, event: string, payload: unknown): void {
  io?.to(`auction:${auctionId}`).emit(event, payload)
}

export function viewerCount(auctionId: string): number {
  return io?.sockets.adapter.rooms.get(`auction:${auctionId}`)?.size ?? 0
}

export function connectedSockets(): number {
  return io?.sockets.sockets.size ?? 0
}
