// Class model - Faculty-created class with students
import mongoose from "mongoose";
import crypto from "crypto";

const classSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Class name is required"],
      trim: true,
    },
    code: {
      type: String,
      required: [true, "Class code is required"],
      unique: true,
      uppercase: true,
      trim: true,
    },
    description: {
      type: String,
      trim: true,
    },
    department: {
      type: String,
      trim: true,
    },
    semester: {
      type: String,
      trim: true,
    },
    // Faculty who owns this class
    faculty: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    // 6-character join code for students
    joinCode: {
      type: String,
      unique: true,
      uppercase: true,
    },
    // Settings
    isActive: {
      type: Boolean,
      default: true,
    },
    maxStudents: {
      type: Number,
      default: 50,
    },
    // Assigned experiments
    experiments: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Experiment",
      },
    ],
  },
  { timestamps: true }
);

// Generate unique join code before saving
classSchema.pre("save", async function (next) {
  if (!this.joinCode) {
    // Generate a 6-character alphanumeric code
    let code;
    let isUnique = false;

    while (!isUnique) {
      code = crypto.randomBytes(3).toString("hex").toUpperCase();
      const existing = await mongoose
        .model("Class")
        .findOne({ joinCode: code });
      if (!existing) {
        isUnique = true;
      }
    }
    this.joinCode = code;
  }
  next();
});

// Virtual for enrolled student count
classSchema.virtual("studentCount", {
  ref: "Enrollment",
  localField: "_id",
  foreignField: "class",
  count: true,
});

// Virtual for enrolled students
classSchema.virtual("enrollments", {
  ref: "Enrollment",
  localField: "_id",
  foreignField: "class",
});

// Ensure virtuals are included in JSON
classSchema.set("toJSON", { virtuals: true });
classSchema.set("toObject", { virtuals: true });

// Indexes
classSchema.index({ faculty: 1 });
classSchema.index({ joinCode: 1 });
classSchema.index({ code: 1 });

export default mongoose.model("Class", classSchema);
