// Class management routes - Faculty CRUD operations
import express from "express";
import Class from "../models/Class.js";
import Enrollment from "../models/Enrollment.js";
import { protect, authorize } from "../middleware/authMiddleware.js";

const router = express.Router();

// @route   POST /api/classes
// @desc    Create a new class
// @access  Faculty/Admin
router.post("/", protect, authorize("faculty", "admin"), async (req, res) => {
  try {
    const { name, code, description, department, semester, maxStudents } =
      req.body;

    const classData = {
      name,
      code,
      description,
      department,
      semester,
      maxStudents: maxStudents || 50,
      faculty: req.user._id,
    };

    const newClass = await Class.create(classData);

    res.status(201).json({
      success: true,
      data: newClass,
    });
  } catch (error) {
    console.error("Create class error:", error);
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: "Class code already exists",
      });
    }
    res.status(500).json({ success: false, message: error.message });
  }
});

// @route   GET /api/classes
// @desc    Get all classes for current user (faculty: their classes, student: enrolled)
// @access  Private
router.get("/", protect, async (req, res) => {
  try {
    let classes;

    if (req.user.role === "faculty" || req.user.role === "admin") {
      // Get classes created by this faculty
      classes = await Class.find({ faculty: req.user._id })
        .populate("faculty", "name email")
        .populate("studentCount")
        .sort({ createdAt: -1 });
    } else {
      // Get classes student is enrolled in
      const enrollments = await Enrollment.find({
        student: req.user._id,
        status: "active",
      }).populate({
        path: "class",
        populate: { path: "faculty", select: "name email" },
      });

      classes = enrollments.map((e) => e.class).filter((c) => c);
    }

    res.json({
      success: true,
      count: classes.length,
      data: classes,
    });
  } catch (error) {
    console.error("Get classes error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// @route   GET /api/classes/:id
// @desc    Get single class details
// @access  Private (Faculty owner or enrolled student)
router.get("/:id", protect, async (req, res) => {
  try {
    const classDoc = await Class.findById(req.params.id)
      .populate("faculty", "name email")
      .populate("experiments", "title subject difficulty")
      .populate("studentCount");

    if (!classDoc) {
      return res
        .status(404)
        .json({ success: false, message: "Class not found" });
    }

    // Check access
    const isFaculty =
      classDoc.faculty._id.toString() === req.user._id.toString();
    const isEnrolled = await Enrollment.findOne({
      student: req.user._id,
      class: classDoc._id,
      status: "active",
    });

    if (!isFaculty && !isEnrolled && req.user.role !== "admin") {
      return res
        .status(403)
        .json({ success: false, message: "Not authorized" });
    }

    res.json({
      success: true,
      data: classDoc,
      isOwner: isFaculty,
    });
  } catch (error) {
    console.error("Get class error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// @route   PUT /api/classes/:id
// @desc    Update class
// @access  Faculty (owner) / Admin
router.put("/:id", protect, authorize("faculty", "admin"), async (req, res) => {
  try {
    let classDoc = await Class.findById(req.params.id);

    if (!classDoc) {
      return res
        .status(404)
        .json({ success: false, message: "Class not found" });
    }

    // Check ownership
    if (
      classDoc.faculty.toString() !== req.user._id.toString() &&
      req.user.role !== "admin"
    ) {
      return res
        .status(403)
        .json({ success: false, message: "Not authorized" });
    }

    const { name, description, department, semester, maxStudents, isActive } =
      req.body;

    classDoc = await Class.findByIdAndUpdate(
      req.params.id,
      { name, description, department, semester, maxStudents, isActive },
      { new: true, runValidators: true }
    );

    res.json({
      success: true,
      data: classDoc,
    });
  } catch (error) {
    console.error("Update class error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// @route   DELETE /api/classes/:id
// @desc    Delete class (and all enrollments)
// @access  Faculty (owner) / Admin
router.delete(
  "/:id",
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

      // Check ownership
      if (
        classDoc.faculty.toString() !== req.user._id.toString() &&
        req.user.role !== "admin"
      ) {
        return res
          .status(403)
          .json({ success: false, message: "Not authorized" });
      }

      // Delete all enrollments for this class
      await Enrollment.deleteMany({ class: classDoc._id });

      // Delete the class
      await classDoc.deleteOne();

      res.json({
        success: true,
        message: "Class deleted successfully",
      });
    } catch (error) {
      console.error("Delete class error:", error);
      res.status(500).json({ success: false, message: error.message });
    }
  }
);

// @route   POST /api/classes/:id/experiments
// @desc    Assign experiment to class
// @access  Faculty (owner)
router.post(
  "/:id/experiments",
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

      const { experimentId } = req.body;

      if (!classDoc.experiments.includes(experimentId)) {
        classDoc.experiments.push(experimentId);
        await classDoc.save();
      }

      res.json({
        success: true,
        data: classDoc,
      });
    } catch (error) {
      console.error("Assign experiment error:", error);
      res.status(500).json({ success: false, message: error.message });
    }
  }
);

// @route   DELETE /api/classes/:id/experiments/:expId
// @desc    Remove experiment from class
// @access  Faculty (owner)
router.delete(
  "/:id/experiments/:expId",
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

      classDoc.experiments = classDoc.experiments.filter(
        (e) => e.toString() !== req.params.expId
      );
      await classDoc.save();

      res.json({
        success: true,
        data: classDoc,
      });
    } catch (error) {
      console.error("Remove experiment error:", error);
      res.status(500).json({ success: false, message: error.message });
    }
  }
);

// @route   GET /api/classes/:id/students
// @desc    Get enrolled students with progress
// @access  Faculty (owner) / Admin
router.get(
  "/:id/students",
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

      const enrollments = await Enrollment.find({ class: req.params.id })
        .populate("student", "name email rollNumber department")
        .sort({ enrolledAt: -1 });

      res.json({
        success: true,
        count: enrollments.length,
        data: enrollments,
      });
    } catch (error) {
      console.error("Get students error:", error);
      res.status(500).json({ success: false, message: error.message });
    }
  }
);

// @route   DELETE /api/classes/:id/students/:studentId
// @desc    Remove student from class
// @access  Faculty (owner) / Admin
router.delete(
  "/:id/students/:studentId",
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

      await Enrollment.findOneAndDelete({
        class: req.params.id,
        student: req.params.studentId,
      });

      res.json({
        success: true,
        message: "Student removed from class",
      });
    } catch (error) {
      console.error("Remove student error:", error);
      res.status(500).json({ success: false, message: error.message });
    }
  }
);

export default router;
