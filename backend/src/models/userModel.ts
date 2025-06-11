import { prisma } from "../db/prisma"

export const findUserByUsername = async (username: string) => {
  return prisma.user.findUnique({
    where: { username }
  });
};

export const findUserByUserId = async (userId: number) => {
  return prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      username: true,
    }
  });
};

export const createUser = async (username: string) => {
  return prisma.user.create({
    data: { username }
  });
};