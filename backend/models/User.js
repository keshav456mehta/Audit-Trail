const mongoose = require('mongoose');

const ROLES = Object.freeze(['viewer', 'operator', 'admin']);

const userSchema = new mongoose.Schema(
  {
    username: { type: String, required: true, unique: true, trim: true, lowercase: true, maxlength: 40 },
    passwordHash: { type: String, required: true },
    role: { type: String, enum: ROLES, required: true, default: 'viewer' },
  },
  { versionKey: false, timestamps: true },
);

const User = mongoose.models.User || mongoose.model('User', userSchema);
User.ROLES = ROLES;
module.exports = User;
