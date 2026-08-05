import mongoose from 'mongoose';

const searchHistorySchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    query: {
      type: String,
      required: true,
      trim: true,
    },
  },
  { timestamps: true }
);

searchHistorySchema.index({ userId: 1, query: 1 }, { unique: true });

export default mongoose.model('SearchHistory', searchHistorySchema);