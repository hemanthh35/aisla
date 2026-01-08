// Enrollment model - Student-Class relationship
import mongoose from "mongoose";

const enrollmentSchema = new mongoose.Schema(
  {
    student: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    class: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Class",
      required: true,
    },
    enrolledAt: {
      type: Date,
      default: Date.now,
    },
    status: {
      type: String,
      enum: ["active", "dropped", "completed"],
      default: "active",
    },
    // Track student progress in this class
    progress: {
      experimentsCompleted: {
        type: Number,
        default: 0,
      },
      quizzesTaken: {
        type: Number,
        default: 0,
      },
      averageScore: {
        type: Number,
        default: 0,
      },
      lastActivity: {
        type: Date,
      },
    },
  },
  { timestamps: true }
);

// Compound index to prevent duplicate enrollments
enrollmentSchema.index({ student: 1, class: 1 }, { unique: true });

// Index for querying by class
enrollmentSchema.index({ class: 1, status: 1 });

// Index for querying by student
enrollmentSchema.index({ student: 1, status: 1 });

// Static method to enroll student using join code
enrollmentSchema.statics.enrollByCode = async function (studentId, joinCode) {
  const Class = mongoose.model("Class");
  const classDoc = await Class.findOne({
    joinCode: joinCode.toUpperCase(),
    isActive: true,
  });

  if (!classDoc) {
    throw new Error("Invalid or inactive class code");
  }

  // Check if already enrolled
  const existing = await this.findOne({
    student: studentId,
    class: classDoc._id,
  });
  if (existing) {
    throw new Error("Already enrolled in this class");
  }

  // Check max students limit
  const currentCount = await this.countDocuments({
    class: classDoc._id,
    status: "active",
  });
  if (currentCount >= classDoc.maxStudents) {
    throw new Error("Class is full");
  }

  // Create enrollment
  return this.create({
    student: studentId,
    class: classDoc._id,
  });
};

// Method to update progress
enrollmentSchema.methods.updateProgress = async function () {
  const Submission = mongoose.model("Submission");
  const Class = mongoose.model("Class");

  const classDoc = await Class.findById(this.class);
  if (!classDoc) return;

  const submissions = await Submission.find({
    userId: this.student,
    experimentId: { $in: classDoc.experiments },
  });

  const uniqueExperiments = new Set(
    submissions.map((s) => s.experimentId.toString())
  );
  const totalScore = submissions.reduce((sum, s) => sum + s.percentage, 0);

  this.progress = {
    experimentsCompleted: uniqueExperiments.size,
    quizzesTaken: submissions.length,
    averageScore:
      submissions.length > 0 ? Math.round(totalScore / submissions.length) : 0,
    lastActivity:
      submissions.length > 0
        ? submissions[submissions.length - 1].submittedAt
        : null,
  };

  await this.save();
};

export default mongoose.model("Enrollment", enrollmentSchema);
