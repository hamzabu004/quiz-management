"use server";

import prisma from '../../src/lib/prisma';
import { revalidatePath } from 'next/cache';

export async function createClassroom(name: string) {
  await prisma.classroom.create({
    data: {
      classroomName: name,
    }
  });
  revalidatePath('/');
}

export async function deleteClassroom(id: string) {
  await prisma.classroom.delete({
    where: { id }
  });
  revalidatePath('/');
}
