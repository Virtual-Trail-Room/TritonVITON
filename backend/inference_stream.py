# backend/inference_stream.py
import cv2, torch, io, time
from aiohttp import web
from inference import VirtualTryon, get_opt      # reuse your model

DEVICE = 'cuda' if torch.cuda.is_available() else 'cpu'
opt    = get_opt()
model  = VirtualTryon(opt)
model.load_cloth()

async def handle_stream(request):
    ws = web.WebSocketResponse()
    await ws.prepare(request)

    async for msg in ws:
        if msg.type == web.WSMsgType.BINARY:
            nparr = np.frombuffer(msg.data, np.uint8)
            frame = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
            try_on = model.wrap(cv2.cvtColor(frame, cv2.COLOR_BGR2RGB))
            # encode back to JPEG
            ok, buf = cv2.imencode('.jpg', cv2.cvtColor(try_on, cv2.COLOR_RGB2BGR))
            await ws.send_bytes(buf.tobytes())
    return ws

app = web.Application()
app.router.add_get('/ws', handle_stream)

if __name__ == "__main__":
    web.run_app(app, port=8765)
