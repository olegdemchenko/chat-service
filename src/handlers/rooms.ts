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
  getMoreRoomMessages,
  getRoom,
  getRoomByParticipants,
  getRoomWithMessages,
  removeActiveParticipant,
} from "../db/utils/rooms";
import {
  saveRoomToUserRooms,
  getUserWithRooms,
  getUser,
  removeRoomFromUserRooms,
} from "../db/utils/users";
import { isSocketIdSaved } from "../redisClient";
import { deleteRoomMessages } from "../db/utils/messages";
import { ChatEvents } from "../constants";

interface RoomWithParticipantStatus {
  roomId: string;
  messages: Message[];
  participants: (Omit<User, "externalId" | "rooms"> & {
    isOnline: boolean;
  })[];
  messagesCount: number;
  unreadMessagesCount: number;
}

export const handleConnectToRooms = (socket: CustomSocket) => {
  logErrors(async () => {
    const userWithRooms = await getUserWithRooms(socket.data.user.userId);
    const rooms = userWithRooms.rooms.map(({ roomId }) => getRoomName(roomId));
    await socket.join(rooms);
    socket.to(rooms).emit(ChatEvents.userJoin, socket.data.user.userId);

    socket.on("disconnect", () => {
      logErrors(() => {
        socket.to(rooms).emit(ChatEvents.userLeave, socket.data.user.userId);
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
    ChatEvents.findRoom,
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
          socket.data.user.userId,
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
          messagesCount: existingRoomWithMessages.messagesCount,
          unreadMessagesCount: existingRoomWithMessages.unreadMessagesCount,
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
      await saveRoomToUserRooms(user._id, room._id);
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
    ChatEvents.createRoom,
    (
      secondParticipantId: string,
      callback: (newRoom: RoomWithParticipantStatus) => void,
    ) => {
      logErrors(async () => {
        const creator = socket.data.user;
        const secondParticipant = await getUser(secondParticipantId);
        const newRoom = await createNewRoom(creator._id, secondParticipant._id);
        await saveRoomToUserRooms(creator._id, newRoom._id);
        await saveRoomToUserRooms(secondParticipant._id, newRoom._id);
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
            messagesCount: 0,
            unreadMessagesCount: 0,
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
          messagesCount: 0,
          unreadMessagesCount: 0,
        });
      }, "create room error");
    },
  );
};

export const handleLoadMoreMessages = (socket: CustomSocket) => {
  socket.on(
    ChatEvents.loadMoreMessages,
    (roomId: string, page: number, callback: (messages: Message[]) => void) => {
      logErrors(async () => {
        const messages = await getMoreRoomMessages(roomId, page);
        callback(messages);
      }, "load more messages error");
    },
  );
};

export const handleLeaveRoom = (
  socket: CustomSocket,
  redisClient: RedisClientType,
  io: IOServer,
) => {
  socket.on(
    ChatEvents.leaveRoom,
    (roomId: string, callback: (status: boolean) => void) => {
      logErrors(async () => {
        const { userId } = socket.data.user;
        const room = await getRoom(roomId);
        await removeRoomFromUserRooms(userId, room._id);
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
