const clients = new Set();

const writeEvent = (res, event, payload) => {
  res.write(`event: ${event}\n`);
  res.write(`data: ${JSON.stringify(payload)}\n\n`);
};

const addSettingsSubscriber = (res) => {
  const client = {
    res,
    heartbeatId: setInterval(() => {
      try {
        res.write(": keep-alive\n\n");
      } catch (error) {
        clearInterval(client.heartbeatId);
        clients.delete(client);
      }
    }, 25000),
  };

  clients.add(client);

  return () => {
    clearInterval(client.heartbeatId);
    clients.delete(client);
  };
};

const broadcastSettingsUpdate = (payload) => {
  for (const client of [...clients]) {
    try {
      writeEvent(client.res, "settings:update", payload);
    } catch (error) {
      clearInterval(client.heartbeatId);
      clients.delete(client);
    }
  }
};

module.exports = {
  addSettingsSubscriber,
  broadcastSettingsUpdate,
  writeEvent,
};
