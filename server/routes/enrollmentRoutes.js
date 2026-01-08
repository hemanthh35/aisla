// Enrollment routes - Student join/leave operations
import express from "express";
import Enrollment from "../models/Enrollment.js";
import Class from "../models/Class.js";
import Submission from "../models/Submission.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

// @route   POST /api/enroll
// @desc    Student joins a class using join code
// @access  Private (Students)
router.post("/", protect, async (req, res) => {
  try {
    const { joinCode } = req.body;

    if (!joinCode) {
      return res.status(400).json({
        success: false,
        message: "Join code is required",
      });
    }

    // Find the class by join code
    const classDoc = await Class.findOne({
      joinCode: joinCode.toUpperCase(),
      isActive: true,
    });

    if (!classDoc) {
      return res.status(404).json({
        success: false,
        message: "Invalid or inactive class code",
      });
    }

    // Check if already enrolled
    const existing = await Enrollment.findOne({
      student: req.user._id,
      class: classDoc._id,
    });

    if (existing) {
      return res.status(400).json({
        success: false,
        message: "Already enrolled in this class",
      });
    }

    // Check max students limit
    const currentCount = await Enrollment.countDocuments({
      class: classDoc._id,
      status: "active",
    });

    if (currentCount >= classDoc.maxStudents) {
      return res.status(400).json({
        success: false,
        message: "Class is full",
      });
    }

    // Create enrollment
    const enrollment = await Enrollment.create({
      student: req.user._id,
      class: classDoc._id,
    });

    // Populate class details for response
    await enrollment.populate({
      path: "class",
      populate: { path: "faculty", select: "name email" },
    });

    res.status(201).json({
      success: true,
      message: `Successfully enrolled in ${classDoc.name}`,
      data: enrollment,
    });
  } catch (error) {
    console.error("Enroll error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// @route   GET /api/enroll/my-classes
// @desc    Get student's enrolled classes
// @access  Private
router.get("/my-classes", protect, async (req, res) => {
  try {
    const enrollments = await Enrollment.find({
      student: req.user._id,
      status: "active",
    })
      .populate({
        path: "class",
        populate: [
          { path: "faculty", select: "name email" },
          { path: "experiments", select: "title subject difficulty" },
        ],
      })
      .sort({ enrolledAt: -1 });

    res.json({
      success: true,
      count: enrollments.length,
      data: enrollments,
    });
  } catch (error) {
    console.error("Get my classes error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// @route   DELETE /api/enroll/:classId
// @desc    Student leaves a class
// @access  Private
router.delete("/:classId", protect, async (req, res) => {
  try {
    const enrollment = await Enrollment.findOneAndUpdate(
      { student: req.user._id, class: req.params.classId },
      { status: "dropped" },
      { new: true }
    );

    if (!enrollment) {
      return res.status(404).json({
        success: false,
        message: "Enrollment not found",
      });
    }

    res.json({
      success: true,
      message: "Successfully left the class",
    });
  } catch (error) {
    console.error("Leave class error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// @route   GET /api/enroll/:classId/progress
// @desc    Get student's progress in a class
// @access  Private
router.get("/:classId/progress", protect, async (req, res) => {
  try {
    const enrollment = await Enrollment.findOne({
      student: req.user._id,
      class: req.params.classId,
    }).populate("class");

    if (!enrollment) {
      return res.status(404).json({
        success: false,
        message: "Enrollment not found",
      });
    }

    // Get submissions for experiments in this class
    const classDoc = await Class.findById(req.params.classId);
    const submissions = await Submission.find({
      userId: req.user._id,
      experimentId: { $in: classDoc.experiments },
    }).populate("experimentId", "title");

    // Calculate progress
    const progress = {
      totalExperiments: classDoc.experiments.length,
      completedExperiments: new Set(
        submissions.map((s) => s.experimentId?._id?.toString())
      ).size,
      totalSubmissions: submissions.length,
      averageScore:
        submissions.length > 0
          ? Math.round(
              submissions.reduce((sum, s) => sum + s.percentage, 0) /
                submissions.length
            )
          : 0,
      submissions: submissions.map((s) => ({
        experiment: s.experimentId?.title,
        score: s.percentage,
        submittedAt: s.submittedAt,
      })),
    };

    res.json({
      success: true,
      data: progress,
    });
  } catch (error) {
    console.error("Get progress error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
});

export default router;
