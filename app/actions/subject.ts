"use server";

import prisma from '../../src/lib/prisma';
import { revalidatePath } from 'next/cache';

export async function createSubject(name: string, classroomId: string) {
  await prisma.subject.create({
    data: {
      subjectName: name,
      classroomId,
    }
  });
  revalidatePath(`/classroom/${classroomId}`);
}

export async function deleteSubject(id: string, classroomId: string) {
  await prisma.subject.delete({
    where: { id }
  });
  revalidatePath(`/classroom/${classroomId}`);
}
