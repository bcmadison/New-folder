from typing import Dict, Set, Optional
import asyncio
import json
import logging
from datetime import datetime
import websockets
from websockets.server import WebSocketServerProtocol

class WebSocketService:
    def __init__(self):
        self.logger = logging.getLogger(__name__)
        self.clients: Set[WebSocketServerProtocol] = set()
        self.rooms: Dict[str, Set[WebSocketServerProtocol]] = {}
        self._instance = None

    @classmethod
    def get_instance(cls) -> 'WebSocketService':
        """Get singleton instance."""
        if cls._instance is None:
            cls._instance = cls()
        return cls._instance

    async def register(self, websocket: WebSocketServerProtocol):
        """Register a new client connection."""
        self.clients.add(websocket)
        self.logger.info(f"New client connected. Total clients: {len(self.clients)}")

    async def unregister(self, websocket: WebSocketServerProtocol):
        """Unregister a client connection."""
        self.clients.remove(websocket)
        # Remove from all rooms
        for room in self.rooms.values():
            room.discard(websocket)
        self.logger.info(f"Client disconnected. Total clients: {len(self.clients)}")

    async def join_room(self, websocket: WebSocketServerProtocol, room: str):
        """Add a client to a specific room."""
        if room not in self.rooms:
            self.rooms[room] = set()
        self.rooms[room].add(websocket)
        self.logger.info(f"Client joined room {room}. Total in room: {len(self.rooms[room])}")

    async def leave_room(self, websocket: WebSocketServerProtocol, room: str):
        """Remove a client from a specific room."""
        if room in self.rooms:
            self.rooms[room].discard(websocket)
            if not self.rooms[room]:
                del self.rooms[room]
            self.logger.info(f"Client left room {room}")

    async def broadcast(self, message: Dict, room: Optional[str] = None):
        """Broadcast a message to all clients or to a specific room."""
        try:
            message_str = json.dumps({
                **message,
                'timestamp': datetime.now().isoformat()
            })
            
            if room:
                if room in self.rooms:
                    websockets_to_send = self.rooms[room]
                else:
                    return
            else:
                websockets_to_send = self.clients

            if websockets_to_send:
                await asyncio.gather(
                    *[client.send(message_str) for client in websockets_to_send]
                )
                self.logger.info(f"Broadcasted message to {len(websockets_to_send)} clients")
        except Exception as e:
            self.logger.error(f"Error broadcasting message: {str(e)}")
            raise

    async def handle_client(self, websocket: WebSocketServerProtocol, path: str):
        """Handle a client connection."""
        try:
            await self.register(websocket)
            
            async for message in websocket:
                try:
                    data = json.loads(message)
                    action = data.get('action')
                    
                    if action == 'join_room':
                        room = data.get('room')
                        if room:
                            await self.join_room(websocket, room)
                    
                    elif action == 'leave_room':
                        room = data.get('room')
                        if room:
                            await self.leave_room(websocket, room)
                    
                    elif action == 'broadcast':
                        room = data.get('room')
                        message_data = data.get('data', {})
                        await self.broadcast(message_data, room)
                    
                except json.JSONDecodeError:
                    self.logger.error("Invalid JSON message received")
                except Exception as e:
                    self.logger.error(f"Error handling message: {str(e)}")
        
        except websockets.exceptions.ConnectionClosed:
            pass
        finally:
            await self.unregister(websocket)

    async def start_server(self, host: str = 'localhost', port: int = 8765):
        """Start the WebSocket server."""
        try:
            server = await websockets.serve(
                self.handle_client,
                host,
                port
            )
            self.logger.info(f"WebSocket server started on ws://{host}:{port}")
            await server.wait_closed()
        except Exception as e:
            self.logger.error(f"Error starting WebSocket server: {str(e)}")
            raise

    async def stop_server(self):
        """Stop the WebSocket server."""
        try:
            # Close all client connections
            for client in self.clients:
                await client.close()
            self.clients.clear()
            self.rooms.clear()
            self.logger.info("WebSocket server stopped")
        except Exception as e:
            self.logger.error(f"Error stopping WebSocket server: {str(e)}")
            raise 