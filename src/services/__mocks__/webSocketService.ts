const mockWebSocketService = {
  connect: jest.fn(() => {
    // console.log("[MockWebSocket] connect called");
    // Simulate connection status if needed by parts of your app
    // (this.isConnected as any).value = true;
  }),
  disconnect: jest.fn(() => {
    // console.log("[MockWebSocket] disconnect called");
    // (this.isConnected as any).value = false;
  }),
  sendMessage: jest.fn((message: any) => {
    // console.log("[MockWebSocket] sendMessage called with:", message);
    return Promise.resolve();
  }),
  onMessage: jest.fn((callback: (data: any) => void) => {
    // console.log("[MockWebSocket] onMessage listener added");
    // To simulate receiving a message, you could expose a function from the mock
    // e.g., mockTriggerMessage(data) { callback(data); }
    return () => { /* console.log("[MockWebSocket] onMessage listener removed") */ }; // Unsubscribe function
  }),
  subscribe: jest.fn((feedName: string, parameters?: Record<string, any>) => {
    // console.log("[MockWebSocket] subscribe called for:", feedName, parameters);
  }),
  unsubscribe: jest.fn((feedName: string) => {
    // console.log("[MockWebSocket] unsubscribe called for:", feedName);
  }),
  getSocketState: jest.fn(() => undefined), // Or mock a specific state like WebSocket.CLOSED (3)
  isConnected: { value: false }, // Mock reactive isConnected status
  // Add any other methods or properties that are used by your application
  // Ensure the mock implements the full interface of the actual service if necessary
  onReconnect: jest.fn((callback: () => void) => {
    return () => {};
  }),
  onOpen: jest.fn((callback: () => void) => {
    return () => {};
  }),
  onError: jest.fn((callback: (event: Event) => void) => {
    return () => {};
  }),
  onClose: jest.fn((callback: (event: CloseEvent) => void) => {
    return () => {};
  }),
};

export default mockWebSocketService;

// Optional: If you need to spy on the reactive isConnected property directly
// or other parts of a more complex mock setup, you might need a more intricate mock.
// For now, simple jest.fn() should suffice for preventing connections and allowing assertions. 