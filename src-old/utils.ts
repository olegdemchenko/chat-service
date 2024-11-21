export const logErrors = (
  wrappedFunc: (...args: any[]) => void,
  title: string,
) => {
  try {
    wrappedFunc();
  } catch (e) {
    console.error(title);
    console.error(e);
  }
};

export const getRoomName = (roomId: string) => `room:${roomId}`;
