import prisma from '../src/lib/prisma';
import ClassroomSelectionClient from './components/ClassroomSelectionClient';

export const dynamic = 'force-dynamic';

export default async function DashboardPage() {
  const classrooms = await prisma.classroom.findMany({
    orderBy: { createdAt: 'desc' }
  });

  // We can pass simple plain objects to client components
  return (
    <ClassroomSelectionClient initialClassrooms={classrooms} />
  );
}
