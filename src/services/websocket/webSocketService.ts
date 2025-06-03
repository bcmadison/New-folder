import { Observable, Subject } from 'rxjs';

class WebSocketService {
  private socket: WebSocket | null = null;
  private subjects: Map<string, Subject<any>> = new Map();

  constructor() {
    this.connect();
  }

  private connect() {
    this.socket = new WebSocket('ws://localhost:8000/ws');
    
    this.socket.onmessage = (event) => {
      try {
        const { type, data } = JSON.parse(event.data);
        const subject = this.subjects.get(type);
        if (subject) {
          subject.next(data);
        }
      } catch (error) {
        console.error('WebSocket message error:', error);
      }
    };

    this.socket.onclose = () => {
      setTimeout(() => this.connect(), 5000);
    };
  }

  public subscribe<T>(type: string, callback: (data: T) => void): () => void {
    if (!this.subjects.has(type)) {
      this.subjects.set(type, new Subject<T>());
    }

    const subject = this.subjects.get(type)!;
    const subscription = subject.subscribe(callback);

    return () => subscription.unsubscribe();
  }

  public send(type: string, data: any) {
    if (this.socket?.readyState === WebSocket.OPEN) {
      this.socket.send(JSON.stringify({ type, data }));
    }
  }
}

export const webSocketService = new WebSocketService(); 