import mongoose from 'mongoose';

const taskSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    description: { type: String, default: '', trim: true },
    status: { type: String, enum: ['Todo', 'In Progress', 'Done'], default: 'Todo' },
    assignedTo: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    projectId: { type: mongoose.Schema.Types.ObjectId, ref: 'Project', required: true, index: true },
    dueDate: { type: Date },
  },
  { timestamps: true }
);

export default mongoose.model('Task', taskSchema);
