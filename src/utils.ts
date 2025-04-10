import * as bcrypt from 'bcrypt';

export const getRoomName = (roomId: string) => `room:${roomId}`;

export const hashPassword = async (plainPassword: string) => {
  const saltRounds = 10;
  const salt = await bcrypt.genSalt(saltRounds);
  const hashedPassword = await bcrypt.hash(plainPassword, salt);
  return hashedPassword;
};

export const verifyPassword = async (
  promptedPassword: string,
  savedPassword: string,
) => {
  return await bcrypt.compare(promptedPassword, savedPassword);
};
