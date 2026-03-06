const NOTIFICATION_SOCKET_EVENTS = {
  BROADCAST: "notification:broadcast",
};

const NOTIFICATION_SOCKET_ROOMS = {
  AUTHENTICATED_USERS: "notifications:authenticated-users",
};

const mapRealtimeNotification = (notification) => ({
  id: notification.id,
  title: notification.title,
  message: notification.message,
  type: notification.type,
  createdAt: notification.createdAt,
  isRead: false,
  readAt: null,
});

const emitBroadcastNotification = (io, notification) => {
  if (!io || !notification) {
    return;
  }

  io.to(NOTIFICATION_SOCKET_ROOMS.AUTHENTICATED_USERS).emit(
    NOTIFICATION_SOCKET_EVENTS.BROADCAST,
    {
      notification: mapRealtimeNotification(notification),
    }
  );
};

module.exports = {
  NOTIFICATION_SOCKET_EVENTS,
  NOTIFICATION_SOCKET_ROOMS,
  mapRealtimeNotification,
  emitBroadcastNotification,
};
