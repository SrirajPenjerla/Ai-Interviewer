from fastapi import APIRouter, WebSocket, WebSocketDisconnect, Query
from typing import Dict, List
import json
import asyncio

router = APIRouter()

# Store active connections by room
proctor_rooms: Dict[str, List[WebSocket]] = {}

@router.websocket("/ws/proctor")
async def proctor_signaling(websocket: WebSocket, room: str = Query("default")):
    await websocket.accept()
    if room not in proctor_rooms:
        proctor_rooms[room] = []
    proctor_rooms[room].append(websocket)
    try:
        while True:
            data = await websocket.receive_text()
            message = json.loads(data)
            # Relay signaling messages to all other peers in the room
            if message["type"] in ["offer", "answer", "ice-candidate"]:
                for peer in proctor_rooms[room]:
                    if peer != websocket:
                        await peer.send_text(json.dumps(message))
    except WebSocketDisconnect:
        proctor_rooms[room].remove(websocket)
        if not proctor_rooms[room]:
            del proctor_rooms[room] 