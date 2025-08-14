const socketIo = require('socket.io');

let socketNamespace = null;

function initSocket(httpServer) {
	if (!httpServer) return null;
	const io = socketIo(httpServer, {
		cors: {
			origin: '*',
			methods: ['GET', 'POST'],
			credentials: true,
		},
		transports: ['websocket', 'polling'],
	});

	const namespace = io.of('/user-namespace');
	const connectedUsers = new Map();

	namespace.on('connection', (socket) => {
		const userId = socket?.handshake?.auth?.userId;

		if (userId) {
			connectedUsers.set(userId, socket.id);
			namespace.emit('userOnlineStatus', {
				userId,
				isOnline: true,
				lastSeen: new Date(),
			});
		}

		socket.on('joinRoom', ({ userId: targetUserId }) => {
			socket.join(targetUserId);
		});

		socket.on('leaveRoom', ({ userId: targetUserId }) => {
			socket.leave(targetUserId);
		});

		socket.on('typing', ({ receiverId, isTyping }) => {
			namespace.to(receiverId).emit('userTyping', {
				userId,
				isTyping,
			});
		});

		socket.on('getUserStatus', ({ userId: targetUserId }) => {
			const isOnline = connectedUsers.has(targetUserId);
			socket.emit('userOnlineStatus', {
				userId: targetUserId,
				isOnline,
				lastSeen: new Date(),
			});
		});

		socket.on('disconnect', () => {
			if (userId) {
				connectedUsers.delete(userId);
				namespace.emit('userOnlineStatus', {
					userId,
					isOnline: false,
					lastSeen: new Date(),
				});
			}
		});
	});

	socketNamespace = namespace;
	return namespace;
}

function getSocketNamespace() {
	return socketNamespace;
}

module.exports = { initSocket, getSocketNamespace };


