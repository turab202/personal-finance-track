import mongoose from 'mongoose';

const transactionSchema = new mongoose.Schema({
  userId     : { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  description: { type: String,  required: true },
  amount     : { type: Number,  required: true },
  date       : { type: Date,    required: true },
  category   : { type: String,  required: true },

  /* advanced fields */
  isRecurring   : { type: Boolean, default: false },
  repeatInterval: { type: String, enum:['weekly','monthly'], default:null },
  attachment    : { type: String },  // filename in /uploads
});

export default mongoose.model('Transaction', transactionSchema);
