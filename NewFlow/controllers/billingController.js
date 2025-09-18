const Bill = require('../models/Bill');
const Patient = require('../models/Patient');
const Doctor = require('../models/Doctor');
const Visit = require('../models/Visit');

// Get all bills with filtering and pagination
const getAllBills = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      status,
      patientId,
      doctorId,
      startDate,
      endDate,
      search
    } = req.query;

    // Build filter object
    const filter = {};
    
    if (status) filter.status = status;
    if (patientId) filter.patientId = patientId;
    if (doctorId) filter.doctorId = doctorId;
    
    if (startDate || endDate) {
      filter.billDate = {};
      if (startDate) filter.billDate.$gte = new Date(startDate);
      if (endDate) filter.billDate.$lte = new Date(endDate);
    }

    // Search functionality
    if (search) {
      filter.$or = [
        { billNumber: { $regex: search, $options: 'i' } },
        { notes: { $regex: search, $options: 'i' } }
      ];
    }

    const options = {
      page: parseInt(page),
      limit: parseInt(limit),
      populate: [
        { path: 'patientId', select: 'name mobile email' },
        { path: 'doctorId', select: 'name specialization' },
        { path: 'visitId', select: 'visitType department' }
      ],
      sort: { createdAt: -1 }
    };

    const bills = await Bill.paginate(filter, options);

    res.json({
      success: true,
      data: bills
    });
  } catch (error) {
    console.error('Error fetching bills:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching bills',
      error: error.message
    });
  }
};

// Get billing statistics
const getBillingStats = async (req, res) => {
  try {
    const { startDate, endDate, status } = req.query;
    
    const filters = {};
    if (startDate) filters.startDate = startDate;
    if (endDate) filters.endDate = endDate;
    if (status) filters.status = status;

    const stats = await Bill.getBillingStats(filters);

    // Get additional statistics
    const today = new Date();
    const thisMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    const lastMonth = new Date(today.getFullYear(), today.getMonth() - 1, 1);

    const [thisMonthStats, lastMonthStats] = await Promise.all([
      Bill.getBillingStats({ startDate: thisMonth }),
      Bill.getBillingStats({ 
        startDate: lastMonth, 
        endDate: new Date(today.getFullYear(), today.getMonth(), 0) 
      })
    ]);

    // Calculate growth percentages
    const revenueGrowth = lastMonthStats.totalAmount > 0 
      ? ((thisMonthStats.totalAmount - lastMonthStats.totalAmount) / lastMonthStats.totalAmount * 100)
      : 0;

    const billsGrowth = lastMonthStats.totalBills > 0
      ? ((thisMonthStats.totalBills - lastMonthStats.totalBills) / lastMonthStats.totalBills * 100)
      : 0;

    res.json({
      success: true,
      data: {
        ...stats,
        thisMonth: thisMonthStats,
        lastMonth: lastMonthStats,
        growth: {
          revenue: revenueGrowth,
          bills: billsGrowth
        }
      }
    });
  } catch (error) {
    console.error('Error fetching billing stats:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching billing statistics',
      error: error.message
    });
  }
};

// Get bill by ID
const getBillById = async (req, res) => {
  try {
    const { id } = req.params;

    const bill = await Bill.findById(id)
      .populate('patientId', 'name mobile email address')
      .populate('doctorId', 'name specialization')
      .populate('visitId', 'visitType department appointmentDate')
      .populate('createdBy', 'name')
      .populate('updatedBy', 'name')
      .populate('payments.processedBy', 'name');

    if (!bill) {
      return res.status(404).json({
        success: false,
        message: 'Bill not found'
      });
    }

    res.json({
      success: true,
      data: bill
    });
  } catch (error) {
    console.error('Error fetching bill:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching bill',
      error: error.message
    });
  }
};

// Create new bill
const createBill = async (req, res) => {
  try {
    const {
      patientId,
      doctorId,
      visitId,
      billDate,
      dueDate,
      items,
      tax,
      discount,
      notes
    } = req.body;

    // Validate required fields
    if (!patientId || !doctorId || !visitId || !items || items.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Patient, doctor, visit, and items are required'
      });
    }

    // Verify patient, doctor, and visit exist
    const [patient, doctor, visit] = await Promise.all([
      Patient.findById(patientId),
      Doctor.findById(doctorId),
      Visit.findById(visitId)
    ]);

    if (!patient) {
      return res.status(400).json({
        success: false,
        message: 'Patient not found'
      });
    }

    if (!doctor) {
      return res.status(400).json({
        success: false,
        message: 'Doctor not found'
      });
    }

    if (!visit) {
      return res.status(400).json({
        success: false,
        message: 'Visit not found'
      });
    }

    // Generate bill number
    const billNumber = await Bill.generateBillNumber();

    // Create bill data
    const billData = {
      billNumber,
      patientId,
      doctorId,
      visitId,
      billDate: billDate || new Date(),
      dueDate: dueDate || new Date(Date.now() + 15 * 24 * 60 * 60 * 1000), // 15 days from now
      items,
      tax: tax || 0,
      discount: discount || 0,
      notes,
      createdBy: req.user.id
    };

    const bill = new Bill(billData);
    await bill.save();

    // Populate the created bill
    await bill.populate([
      { path: 'patientId', select: 'name mobile email' },
      { path: 'doctorId', select: 'name specialization' },
      { path: 'visitId', select: 'visitType department' }
    ]);

    res.status(201).json({
      success: true,
      message: 'Bill created successfully',
      data: bill
    });
  } catch (error) {
    console.error('Error creating bill:', error);
    res.status(500).json({
      success: false,
      message: 'Error creating bill',
      error: error.message
    });
  }
};

// Update bill
const updateBill = async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    // Remove fields that shouldn't be updated directly
    delete updateData.billNumber;
    delete updateData.paidAmount;
    delete updateData.balance;
    delete updateData.status;
    delete updateData.payments;

    updateData.updatedBy = req.user.id;

    const bill = await Bill.findByIdAndUpdate(
      id,
      updateData,
      { new: true, runValidators: true }
    ).populate([
      { path: 'patientId', select: 'name mobile email' },
      { path: 'doctorId', select: 'name specialization' },
      { path: 'visitId', select: 'visitType department' }
    ]);

    if (!bill) {
      return res.status(404).json({
        success: false,
        message: 'Bill not found'
      });
    }

    res.json({
      success: true,
      message: 'Bill updated successfully',
      data: bill
    });
  } catch (error) {
    console.error('Error updating bill:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating bill',
      error: error.message
    });
  }
};

// Delete bill
const deleteBill = async (req, res) => {
  try {
    const { id } = req.params;

    const bill = await Bill.findById(id);
    if (!bill) {
      return res.status(404).json({
        success: false,
        message: 'Bill not found'
      });
    }

    // Check if bill has payments
    if (bill.paidAmount > 0) {
      return res.status(400).json({
        success: false,
        message: 'Cannot delete bill with payments. Please refund payments first.'
      });
    }

    await Bill.findByIdAndDelete(id);

    res.json({
      success: true,
      message: 'Bill deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting bill:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting bill',
      error: error.message
    });
  }
};

// Add payment to bill
const addPayment = async (req, res) => {
  try {
    const { id } = req.params;
    const { amount, paymentMethod, transactionId, notes } = req.body;

    const bill = await Bill.findById(id);
    if (!bill) {
      return res.status(404).json({
        success: false,
        message: 'Bill not found'
      });
    }

    // Validate payment amount
    if (amount <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Payment amount must be greater than 0'
      });
    }

    if (amount > bill.balance) {
      return res.status(400).json({
        success: false,
        message: 'Payment amount cannot exceed bill balance'
      });
    }

    const paymentData = {
      amount,
      paymentMethod,
      transactionId,
      notes
    };

    await bill.addPayment(paymentData, req.user.id);

    // Populate the updated bill
    await bill.populate([
      { path: 'patientId', select: 'name mobile email' },
      { path: 'doctorId', select: 'name specialization' },
      { path: 'visitId', select: 'visitType department' },
      { path: 'payments.processedBy', select: 'name' }
    ]);

    res.json({
      success: true,
      message: 'Payment added successfully',
      data: bill
    });
  } catch (error) {
    console.error('Error adding payment:', error);
    res.status(500).json({
      success: false,
      message: 'Error adding payment',
      error: error.message
    });
  }
};

// Get bill payments
const getBillPayments = async (req, res) => {
  try {
    const { id } = req.params;

    const bill = await Bill.findById(id)
      .populate('payments.processedBy', 'name')
      .select('payments');

    if (!bill) {
      return res.status(404).json({
        success: false,
        message: 'Bill not found'
      });
    }

    res.json({
      success: true,
      data: bill.payments
    });
  } catch (error) {
    console.error('Error fetching bill payments:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching bill payments',
      error: error.message
    });
  }
};

// Get billing summary report
const getBillingSummary = async (req, res) => {
  try {
    const { startDate, endDate, groupBy = 'month' } = req.query;

    const matchStage = {};
    if (startDate || endDate) {
      matchStage.billDate = {};
      if (startDate) matchStage.billDate.$gte = new Date(startDate);
      if (endDate) matchStage.billDate.$lte = new Date(endDate);
    }

    let groupStage;
    switch (groupBy) {
      case 'day':
        groupStage = {
          _id: {
            year: { $year: '$billDate' },
            month: { $month: '$billDate' },
            day: { $dayOfMonth: '$billDate' }
          }
        };
        break;
      case 'week':
        groupStage = {
          _id: {
            year: { $year: '$billDate' },
            week: { $week: '$billDate' }
          }
        };
        break;
      case 'year':
        groupStage = {
          _id: { year: { $year: '$billDate' } }
        };
        break;
      default: // month
        groupStage = {
          _id: {
            year: { $year: '$billDate' },
            month: { $month: '$billDate' }
          }
        };
    }

    const summary = await Bill.aggregate([
      { $match: matchStage },
      {
        $group: {
          ...groupStage,
          totalBills: { $sum: 1 },
          totalAmount: { $sum: '$total' },
          totalPaid: { $sum: '$paidAmount' },
          totalBalance: { $sum: '$balance' },
          avgBillAmount: { $avg: '$total' }
        }
      },
      { $sort: { '_id.year': 1, '_id.month': 1, '_id.day': 1, '_id.week': 1 } }
    ]);

    res.json({
      success: true,
      data: summary
    });
  } catch (error) {
    console.error('Error fetching billing summary:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching billing summary',
      error: error.message
    });
  }
};

// Get outstanding bills
const getOutstandingBills = async (req, res) => {
  try {
    const { page = 1, limit = 10, overdue } = req.query;

    const filter = {
      balance: { $gt: 0 }
    };

    if (overdue === 'true') {
      filter.dueDate = { $lt: new Date() };
    }

    const options = {
      page: parseInt(page),
      limit: parseInt(limit),
      populate: [
        { path: 'patientId', select: 'name mobile email' },
        { path: 'doctorId', select: 'name specialization' }
      ],
      sort: { dueDate: 1 }
    };

    const bills = await Bill.paginate(filter, options);

    res.json({
      success: true,
      data: bills
    });
  } catch (error) {
    console.error('Error fetching outstanding bills:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching outstanding bills',
      error: error.message
    });
  }
};

// Get collection report
const getCollectionReport = async (req, res) => {
  try {
    const { startDate, endDate, paymentMethod } = req.query;

    const matchStage = {
      'payments.paymentDate': {}
    };

    if (startDate) matchStage['payments.paymentDate'].$gte = new Date(startDate);
    if (endDate) matchStage['payments.paymentDate'].$lte = new Date(endDate);
    if (paymentMethod) matchStage['payments.paymentMethod'] = paymentMethod;

    const collections = await Bill.aggregate([
      { $unwind: '$payments' },
      { $match: matchStage },
      {
        $group: {
          _id: {
            date: { $dateToString: { format: '%Y-%m-%d', date: '$payments.paymentDate' } },
            method: '$payments.paymentMethod'
          },
          totalAmount: { $sum: '$payments.amount' },
          count: { $sum: 1 }
        }
      },
      { $sort: { '_id.date': 1 } }
    ]);

    res.json({
      success: true,
      data: collections
    });
  } catch (error) {
    console.error('Error fetching collection report:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching collection report',
      error: error.message
    });
  }
};

// Export bill as PDF (placeholder)
const exportBillPDF = async (req, res) => {
  try {
    const { id } = req.params;

    const bill = await Bill.findById(id)
      .populate('patientId', 'name mobile email address')
      .populate('doctorId', 'name specialization')
      .populate('visitId', 'visitType department appointmentDate');

    if (!bill) {
      return res.status(404).json({
        success: false,
        message: 'Bill not found'
      });
    }

    // TODO: Implement PDF generation
    res.json({
      success: true,
      message: 'PDF export functionality will be implemented',
      data: bill
    });
  } catch (error) {
    console.error('Error exporting bill PDF:', error);
    res.status(500).json({
      success: false,
      message: 'Error exporting bill PDF',
      error: error.message
    });
  }
};

// Export bills as Excel (placeholder)
const exportBillsExcel = async (req, res) => {
  try {
    const { startDate, endDate, status } = req.query;

    const filter = {};
    if (startDate || endDate) {
      filter.billDate = {};
      if (startDate) filter.billDate.$gte = new Date(startDate);
      if (endDate) filter.billDate.$lte = new Date(endDate);
    }
    if (status) filter.status = status;

    const bills = await Bill.find(filter)
      .populate('patientId', 'name mobile email')
      .populate('doctorId', 'name specialization')
      .sort({ createdAt: -1 });

    // TODO: Implement Excel export
    res.json({
      success: true,
      message: 'Excel export functionality will be implemented',
      data: bills
    });
  } catch (error) {
    console.error('Error exporting bills Excel:', error);
    res.status(500).json({
      success: false,
      message: 'Error exporting bills Excel',
      error: error.message
    });
  }
};

module.exports = {
  getAllBills,
  getBillingStats,
  getBillById,
  createBill,
  updateBill,
  deleteBill,
  addPayment,
  getBillPayments,
  getBillingSummary,
  getOutstandingBills,
  getCollectionReport,
  exportBillPDF,
  exportBillsExcel
};
