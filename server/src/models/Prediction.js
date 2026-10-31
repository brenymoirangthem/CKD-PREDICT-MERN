import mongoose from 'mongoose';
const schema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  patientName: { type: String, required: true, trim: true },
  record: { type: mongoose.Schema.Types.Mixed, required: true },
  probability: Number,
  risk: { type: String, enum: ['LOW', 'MODERATE', 'HIGH'] },
  flagged: Boolean,
  threshold: Number,
  modelName: String,
  dataSource: String,
  explanation: [{ feature: String, label: String, impact: Number, _id: false }],
  summary: String,
}, { timestamps: true });
schema.index({ user: 1, createdAt: -1 });
export default mongoose.model('Prediction', schema);
