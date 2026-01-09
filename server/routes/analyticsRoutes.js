// Analytics routes - Class and student performance metrics
import express from "express";
import mongoose from "mongoose";
import Class from "../models/Class.js";
import Enrollment from "../models/Enrollment.js";
import Submission from "../models/Submission.js";
import Experiment from "../models/Experiment.js";
import { protect, authorize } from "../middleware/authMiddleware.js";

const router = express.Router();

// @route   GET /api/analytics/class/:id
// @desc    Get class performance analytics
// @access  Faculty (owner) / Admin
router.get(
  "/class/:id",
  protect,
  authorize("faculty", "admin"),
  async (req, res) => {
    try {
      const classDoc = await Class.findById(req.params.id);

      if (!classDoc) {
        return res
          .status(404)
          .json({ success: false, message: "Class not found" });
      }

      if (
        classDoc.faculty.toString() !== req.user._id.toString() &&
        req.user.role !== "admin"
      ) {
        return res
          .status(403)
          .json({ success: false, message: "Not authorized" });
      }

      // Get all enrollments for this class
      const enrollments = await Enrollment.find({
        class: req.params.id,
        status: "active",
      }).populate("student", "name email rollNumber department");

      const studentIds = enrollments.map((e) => e.student._id);

      // Get all submissions for students in this class for assigned experiments
      const submissions = await Submission.find({
        userId: { $in: studentIds },
        experimentId: { $in: classDoc.experiments },
      }).populate("experimentId", "title");

      // Calculate analytics
      const totalStudents = enrollments.length;
      const totalExperiments = classDoc.experiments.length;

      // Submissions per experiment
      const experimentStats = {};
      for (const expId of classDoc.experiments) {
        const expSubmissions = submissions.filter(
          (s) => s.experimentId?._id?.toString() === expId.toString()
        );
        const studentsCompleted = new Set(
          expSubmissions.map((s) => s.userId.toString())
        ).size;
        const avgScore =
          expSubmissions.length > 0
            ? Math.round(
                expSubmissions.reduce((sum, s) => sum + s.percentage, 0) /
                  expSubmissions.length
              )
            : 0;

        experimentStats[expId.toString()] = {
          totalSubmissions: expSubmissions.length,
          studentsCompleted,
          completionRate:
            totalStudents > 0
              ? Math.round((studentsCompleted / totalStudents) * 100)
              : 0,
          averageScore: avgScore,
        };
      }

      // Overall class stats
      const allScores = submissions.map((s) => s.percentage);
      const classAverage =
        allScores.length > 0
          ? Math.round(allScores.reduce((a, b) => a + b, 0) / allScores.length)
          : 0;

      // Students with at least one submission
      const activeStudents = new Set(
        submissions.map((s) => s.userId.toString())
      ).size;

      // Score distribution
      const scoreDistribution = {
        excellent: submissions.filter((s) => s.percentage >= 90).length,
        good: submissions.filter((s) => s.percentage >= 70 && s.percentage < 90)
          .length,
        average: submissions.filter(
          (s) => s.percentage >= 50 && s.percentage < 70
        ).length,
        needsWork: submissions.filter((s) => s.percentage < 50).length,
      };

      res.json({
        success: true,
        data: {
          overview: {
            totalStudents,
            totalExperiments,
            activeStudents,
            totalSubmissions: submissions.length,
            classAverage,
            completionRate:
              totalStudents > 0 && totalExperiments > 0
                ? Math.round((activeStudents / totalStudents) * 100)
                : 0,
          },
          experimentStats,
          scoreDistribution,
          enrollments: enrollments.map((e) => ({
            student: e.student,
            enrolledAt: e.enrolledAt,
            status: e.status,
          })),
        },
      });
    } catch (error) {
      console.error("Class analytics error:", error);
      res.status(500).json({ success: false, message: error.message });
    }
  }
);

// @route   GET /api/analytics/class/:id/students
// @desc    Get per-student progress for a class
// @access  Faculty (owner) / Admin
router.get(
  "/class/:id/students",
  protect,
  authorize("faculty", "admin"),
  async (req, res) => {
    try {
      const classDoc = await Class.findById(req.params.id).populate(
        "experiments",
        "title"
      );

      if (!classDoc) {
        return res
          .status(404)
          .json({ success: false, message: "Class not found" });
      }

      if (
        classDoc.faculty.toString() !== req.user._id.toString() &&
        req.user.role !== "admin"
      ) {
        return res
          .status(403)
          .json({ success: false, message: "Not authorized" });
      }

      const enrollments = await Enrollment.find({
        class: req.params.id,
        status: "active",
      }).populate("student", "name email rollNumber department");

      const studentProgress = [];

      for (const enrollment of enrollments) {
        const submissions = await Submission.find({
          userId: enrollment.student._id,
          experimentId: { $in: classDoc.experiments.map((e) => e._id) },
        });

        const completedExperiments = new Set(
          submissions.map((s) => s.experimentId.toString())
        ).size;

        const averageScore =
          submissions.length > 0
            ? Math.round(
                submissions.reduce((sum, s) => sum + s.percentage, 0) /
                  submissions.length
              )
            : 0;

        const lastActivity =
          submissions.length > 0
            ? submissions.sort(
                (a, b) => new Date(b.submittedAt) - new Date(a.submittedAt)
              )[0].submittedAt
            : null;

        studentProgress.push({
          student: enrollment.student,
          enrolledAt: enrollment.enrolledAt,
          completedExperiments,
          totalExperiments: classDoc.experiments.length,
          completionRate:
            classDoc.experiments.length > 0
              ? Math.round(
                  (completedExperiments / classDoc.experiments.length) * 100
                )
              : 0,
          averageScore,
          totalSubmissions: submissions.length,
          lastActivity,
        });
      }

      // Sort by completion rate descending
      studentProgress.sort((a, b) => b.completionRate - a.completionRate);

      res.json({
        success: true,
        data: {
          experiments: classDoc.experiments,
          students: studentProgress,
        },
      });
    } catch (error) {
      console.error("Student progress error:", error);
      res.status(500).json({ success: false, message: error.message });
    }
  }
);

// @route   GET /api/analytics/class/:id/export
// @desc    Export class data as CSV
// @access  Faculty (owner) / Admin
router.get(
  "/class/:id/export",
  protect,
  authorize("faculty", "admin"),
  async (req, res) => {
    try {
      const classDoc = await Class.findById(req.params.id).populate(
        "experiments",
        "title"
      );

      if (!classDoc) {
        return res
          .status(404)
          .json({ success: false, message: "Class not found" });
      }

      if (
        classDoc.faculty.toString() !== req.user._id.toString() &&
        req.user.role !== "admin"
      ) {
        return res
          .status(403)
          .json({ success: false, message: "Not authorized" });
      }

      const enrollments = await Enrollment.find({
        class: req.params.id,
      }).populate("student", "name email rollNumber department");

      // Build CSV data
      const rows = [
        [
          "Student Name",
          "Email",
          "Roll Number",
          "Department",
          "Status",
          "Enrolled At",
          "Experiments Completed",
          "Average Score",
        ],
      ];

      for (const enrollment of enrollments) {
        const submissions = await Submission.find({
          userId: enrollment.student._id,
          experimentId: { $in: classDoc.experiments.map((e) => e._id) },
        });

        const completedExperiments = new Set(
          submissions.map((s) => s.experimentId.toString())
        ).size;
        const averageScore =
          submissions.length > 0
            ? Math.round(
                submissions.reduce((sum, s) => sum + s.percentage, 0) /
                  submissions.length
              )
            : 0;

        rows.push([
          enrollment.student.name,
          enrollment.student.email,
          enrollment.student.rollNumber || "N/A",
          enrollment.student.department || "N/A",
          enrollment.status,
          new Date(enrollment.enrolledAt).toLocaleDateString(),
          `${completedExperiments}/${classDoc.experiments.length}`,
          `${averageScore}%`,
        ]);
      }

      const csv = rows
        .map((row) => row.map((cell) => `"${cell}"`).join(","))
        .join("\n");

      res.setHeader("Content-Type", "text/csv");
      res.setHeader(
        "Content-Disposition",
        `attachment; filename="${classDoc.code}_students.csv"`
      );
      res.send(csv);
    } catch (error) {
      console.error("Export error:", error);
      res.status(500).json({ success: false, message: error.message });
    }
  }
);

export default router;
