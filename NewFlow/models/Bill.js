const mongoose = require('mongoose');

const billItemSchema = new mongoose.Schema({
  description: {
    type: String,
    required: true,
    trim: true,
    maxlength: 200
  },
  quantity: {
    type: Number,
    required: true,
    min: 1
  },
  rate: {
    type: Number,
    required: true,
    min: 0
  },
  amount: {
    type: Number,
    required: true,
    min: 0
  }
}, { _id: false });

const paymentSchema = new mongoose.Schema({
  amount: {
    type: Number,
    required: true,
    min: 0
  },
  paymentMethod: {
    type: String,
    enum: ['cash', 'card', 'upi', 'netbanking', 'cheque'],
    required: true
  },
  transactionId: {
    type: String,
    trim: true
  },
  notes: {
    type: String,
    trim: true,
    maxlength: 500
  },
  paymentDate: {
    type: Date,
    default: Date.now
  },
  processedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Doctor',
    required: true
  }
});

const billSchema = new mongoose.Schema({
  // Basic Information
  billNumber: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  
  // References
  patientId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Patient',
    required: true
  },
  doctorId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Doctor',
    required: true
  },
  visitId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Visit',
    required: true
  },
  
  // Dates
  billDate: {
    type: Date,
    required: true,
    default: Date.now
  },
  dueDate: {
    type: Date,
    required: true
  },
  
  // Bill Items
  items: [billItemSchema],
  
  // Financial Calculations
  subtotal: {
    type: Number,
    required: true,
    min: 0
  },
  tax: {
    type: Number,
    required: true,
    min: 0,
    default: 0
  },
  discount: {
    type: Number,
    required: true,
    min: 0,
    default: 0
  },
  total: {
    type: Number,
    required: true,
    min: 0
  },
  
  // Payment Information
  paidAmount: {
    type: Number,
    required: true,
    min: 0,
    default: 0
  },
  balance: {
    type: Number,
    required: true,
    min: 0
  },
  
  // Status
  status: {
    type: String,
    enum: ['pending', 'partial', 'paid', 'overdue', 'cancelled'],
    default: 'pending'
  },
  
  // Payment History
  payments: [paymentSchema],
  
  // Additional Information
  notes: {
    type: String,
    trim: true,
    maxlength: 1000
  },
  
  // Audit Fields
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Doctor',
    required: true
  },
  updatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Doctor'
  }
}, {
  timestamps: true
});

// Indexes for better performance
billSchema.index({ billNumber: 1 });
billSchema.index({ patientId: 1 });
billSchema.index({ doctorId: 1 });
billSchema.index({ visitId: 1 });
billSchema.index({ status: 1 });
billSchema.index({ billDate: 1 });
billSchema.index({ dueDate: 1 });

// Virtual for patient name (populated)
billSchema.virtual('patientName', {
  ref: 'Patient',
  localField: 'patientId',
  foreignField: '_id',
  justOne: true
});

// Virtual for doctor name (populated)
billSchema.virtual('doctorName', {
  ref: 'Doctor',
  localField: 'doctorId',
  foreignField: '_id',
  justOne: true
});

// Pre-save middleware to calculate totals
billSchema.pre('save', function(next) {
  // Calculate subtotal from items
  this.subtotal = this.items.reduce((sum, item) => sum + item.amount, 0);
  
  // Calculate total
  this.total = this.subtotal + this.tax - this.discount;
  
  // Calculate balance
  this.balance = this.total - this.paidAmount;
  
  // Update status based on balance
  if (this.balance <= 0) {
    this.status = 'paid';
  } else if (this.paidAmount > 0) {
    this.status = 'partial';
  } else if (new Date() > this.dueDate) {
    this.status = 'overdue';
  } else {
    this.status = 'pending';
  }
  
  next();
});

// Method to add payment
billSchema.methods.addPayment = function(paymentData, processedBy) {
  const payment = {
    ...paymentData,
    processedBy,
    paymentDate: new Date()
  };
  
  this.payments.push(payment);
  this.paidAmount += payment.amount;
  this.balance = this.total - this.paidAmount;
  
  // Update status
  if (this.balance <= 0) {
    this.status = 'paid';
  } else if (this.paidAmount > 0) {
    this.status = 'partial';
  }
  
  return this.save();
};

// Method to generate bill number
billSchema.statics.generateBillNumber = async function() {
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, '0');
  const day = String(today.getDate()).padStart(2, '0');
  
  const prefix = `BILL-${year}${month}${day}`;
  
  // Find the last bill for today
  const lastBill = await this.findOne({
    billNumber: { $regex: `^${prefix}` }
  }).sort({ billNumber: -1 });
  
  let sequence = 1;
  if (lastBill) {
    const lastSequence = parseInt(lastBill.billNumber.split('-')[1].substring(8));
    sequence = lastSequence + 1;
  }
  
  return `${prefix}-${String(sequence).padStart(3, '0')}`;
};

// Method to get billing statistics
billSchema.statics.getBillingStats = async function(filters = {}) {
  const matchStage = {};
  
  if (filters.startDate || filters.endDate) {
    matchStage.billDate = {};
    if (filters.startDate) matchStage.billDate.$gte = new Date(filters.startDate);
    if (filters.endDate) matchStage.billDate.$lte = new Date(filters.endDate);
  }
  
  if (filters.status) {
    matchStage.status = filters.status;
  }
  
  const stats = await this.aggregate([
    { $match: matchStage },
    {
      $group: {
        _id: null,
        totalBills: { $sum: 1 },
        totalAmount: { $sum: '$total' },
        totalPaid: { $sum: '$paidAmount' },
        totalBalance: { $sum: '$balance' },
        pendingBills: {
          $sum: { $cond: [{ $eq: ['$status', 'pending'] }, 1, 0] }
        },
        partialBills: {
          $sum: { $cond: [{ $eq: ['$status', 'partial'] }, 1, 0] }
        },
        paidBills: {
          $sum: { $cond: [{ $eq: ['$status', 'paid'] }, 1, 0] }
        },
        overdueBills: {
          $sum: { $cond: [{ $eq: ['$status', 'overdue'] }, 1, 0] }
        }
      }
    }
  ]);
  
  return stats[0] || {
    totalBills: 0,
    totalAmount: 0,
    totalPaid: 0,
    totalBalance: 0,
    pendingBills: 0,
    partialBills: 0,
    paidBills: 0,
    overdueBills: 0
  };
};

module.exports = mongoose.model('Bill', billSchema);
