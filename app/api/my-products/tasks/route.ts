import { NextResponse } from 'next/server';
import { connectDB, dbModel } from '@/lib/db';
import { getUserFromRequest } from '@/lib/auth';

// POST: Mark maintenance task as completed (reschedules next event)
export async function POST(request: Request) {
  try {
    await connectDB();
    const user = await getUserFromRequest(request);

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized. Please log in.' }, { status: 401 });
    }

    const { taskId, completed } = await request.json();
    if (!taskId) {
      return NextResponse.json({ error: 'Task ID is required.' }, { status: 400 });
    }

    // Find task in db
    // Mongoose doesn't have a direct findById for MaintenanceTask unless we map it,
    // we did map findByIdAndUpdate and find. Let's find by querying list.
    const tasks = await dbModel.MaintenanceTask.find({ _id: taskId });
    const task = tasks[0];

    if (!task) {
      return NextResponse.json({ error: 'Maintenance task not found.' }, { status: 404 });
    }

    if (task.userId.toString() !== (user._id || user.id).toString()) {
      return NextResponse.json({ error: 'Unauthorized. This task does not belong to you.' }, { status: 403 });
    }

    // Update task status
    const updatedTask = await dbModel.MaintenanceTask.findByIdAndUpdate(taskId, {
      completed: !!completed,
      completedAt: completed ? new Date().toISOString() : null
    });

    // Roll forward: Create new upcoming task if completed is true
    if (completed && task.intervalMonths) {
      const nextDueDate = new Date();
      nextDueDate.setMonth(nextDueDate.getMonth() + task.intervalMonths);

      await dbModel.MaintenanceTask.create({
        userId: task.userId,
        productId: task.productId,
        title: task.title,
        description: task.description,
        intervalMonths: task.intervalMonths,
        dueDate: nextDueDate.toISOString(),
        completed: false,
        createdAt: new Date().toISOString()
      });
    }

    return NextResponse.json({ success: true, task: updatedTask });
  } catch (error: any) {
    console.error('Update task error:', error);
    return NextResponse.json({ error: 'Failed to update task: ' + error.message }, { status: 500 });
  }
}
