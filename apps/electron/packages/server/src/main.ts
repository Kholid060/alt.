import WebsocketService from './service/websocket.service';

const PORT = 4567;

WebsocketService.instance.initServer(PORT);
