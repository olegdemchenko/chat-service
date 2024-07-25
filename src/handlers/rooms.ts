import { RedisClientType } from "@redis/client";
import { User } from "../db/models/User";
import { Message } from "../db/models/Message";
import { CustomSocket, IOServer } from "../types";
import { logErrors, getRoomName } from "../utils";
import sendMessage from "./messages/sendMessage";
import {
  addActiveParticipant,
  createNewRoom,
  deleteRoom,
  getRoom,
  getRoomByParticipants,
  getRoomWithMessages,
  removeActiveParticipant,
} from "../db/functions/rooms";
import {
  addRoom,
  getUserWithRooms,
  getUser,
  removeRoom,
} from "../db/functions/users";
import { isSocketIdSaved } from "../redisClient";
import { deleteRoomMessages } from "../db/functions/messages";

interface RoomWithParticipantStatus {
  roomId: string;
  messages: Message[];
  participants: (Omit<User, "externalId" | "rooms"> & {
    isOnline: boolean;
  })[];
}

export const handleConnectToRooms = (socket: CustomSocket) => {
  logErrors(async () => {
    const userWithRooms = await getUserWithRooms(socket.data.user.userId);
    const rooms = userWithRooms.rooms.map(({ roomId }) => getRoomName(roomId));
    await socket.join(rooms);
    socket.to(rooms).emit("userJoin", socket.data.user.userId);

    socket.on("disconnect", () => {
      logErrors(() => {
        socket.to(rooms).emit("userLeave", socket.data.user.userId);
        rooms.forEach((room) => socket.leave(room));
      }, "socket leave rooms error");
    });
  }, "connect to rooms error");
};

export const handleFindExistingRoom = (
  socket: CustomSocket,
  redisClient: RedisClientType,
) => {
  socket.on(
    "findRoom",
    (
      secondParticipantId: string,
      callback: (room: RoomWithParticipantStatus | null) => void,
    ) => {
      logErrors(async () => {
        const secondParticipant = await getUser(secondParticipantId);
        const existingRoom = await getRoomByParticipants(
          socket.data.user._id,
          secondParticipant._id,
        );
        if (!existingRoom) {
          return callback(null);
        }
        const existingRoomWithMessages = await getRoomWithMessages(
          existingRoom.roomId,
        );
        const isSecondParticipantOnline = await isSocketIdSaved(
          redisClient,
          secondParticipant.userId,
        );
        callback({
          roomId: existingRoomWithMessages.roomId,
          messages: existingRoomWithMessages.messages,
          participants: [
            {
              userId: secondParticipant.userId,
              name: secondParticipant.name,
              isOnline: isSecondParticipantOnline,
            },
          ],
        });
      }, "find existing room error");
    },
  );
};

export const handleConnectToRoom = (
  socket: CustomSocket,
  redisClient: RedisClientType,
  io: IOServer,
) => {
  socket.on("connectToRoom", (roomId: string, callback: () => void) => {
    logErrors(async () => {
      const { user } = socket.data;
      await addActiveParticipant(roomId, user._id);
      const room = await getRoom(roomId);
      await addRoom(user._id, room._id);
      await socket.join(getRoomName(roomId));
      callback();
      await sendMessage(
        socket,
        io,
        "all",
        roomId,
        `User "${socket.data.user.name}" has joined the room`,
        "system",
      );
    }, "connect to room error");
  });
};

export const handleCreateRoom = (
  socket: CustomSocket,
  redisClient: RedisClientType,
  io: IOServer,
) => {
  socket.on(
    "createRoom",
    (
      secondParticipantId: string,
      callback: (newRoom: RoomWithParticipantStatus) => void,
    ) => {
      logErrors(async () => {
        const creator = socket.data.user;
        const secondParticipant = await getUser(secondParticipantId);
        const newRoom = await createNewRoom(creator._id, secondParticipant._id);
        await addRoom(creator._id, newRoom._id);
        await addRoom(secondParticipant._id, newRoom._id);
        await socket.join(getRoomName(newRoom.roomId));
        const secondParticipantSocketId = await redisClient.get(
          secondParticipant.userId,
        );
        if (secondParticipantSocketId) {
          const secondParticipantSocket = io
            .of("/")
            .sockets.get(secondParticipantSocketId);
          await secondParticipantSocket!.join(getRoomName(newRoom.roomId));
          secondParticipantSocket!.emit("newRoom", {
            roomId: newRoom.roomId,
            participants: [
              {
                userId: creator.userId,
                name: creator.name,
                isOnline: true,
              },
            ],
            messages: [],
          });
        }
        callback({
          roomId: newRoom.roomId,
          messages: [],
          participants: [
            {
              userId: secondParticipant.userId,
              name: secondParticipant.name,
              isOnline: Boolean(secondParticipantSocketId),
            },
          ],
        });
      }, "create room error");
    },
  );
};

export const handleLeaveRoom = (
  socket: CustomSocket,
  redisClient: RedisClientType,
  io: IOServer,
) => {
  socket.on(
    "leaveRoom",
    (roomId: string, callback: (status: boolean) => void) => {
      logErrors(async () => {
        const { userId } = socket.data.user;
        const room = await getRoom(roomId);
        await removeRoom(userId, room._id);
        const roomParticipantsCount = room.activeParticipants.length;
        if (roomParticipantsCount === 1) {
          await deleteRoomMessages(room.messages);
          await deleteRoom(roomId);
        } else {
          await removeActiveParticipant(roomId, socket.data.user._id);
          await sendMessage(
            socket,
            io,
            "all",
            roomId,
            `User "${socket.data.user.name}" has left the room`,
            "system",
          );
        }
        socket.leave(getRoomName(roomId));
        callback(true);
      }, "leave room error");
    },
  );
};
