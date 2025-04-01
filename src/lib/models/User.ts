import mongoose from 'mongoose';

// Define User interface
export interface IUser extends mongoose.Document {
  username: string;
  password: string;
  patients: mongoose.Types.ObjectId[];
  createdAt: Date;
  updatedAt: Date;
}

// Define User schema
const UserSchema = new mongoose.Schema({
  username: {
    type: String,
    required: [true, 'Username is required'],
    unique: true,
  },
  password: {
    type: String,
    required: [true, 'Password is required'],
  },
  patients: {
    type: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Patient'
    }],
    default: [] // Initialize with an empty array
  }
}, { timestamps: true });

// Clear the model cache to ensure the updated schema is used
if (mongoose.models.User) {
  delete mongoose.models.User;
}

// Create the model with the updated schema
const User = mongoose.model<IUser>('User', UserSchema, 'users');

export default User; 