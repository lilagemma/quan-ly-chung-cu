const mongoose = require('mongoose');

const ServiceLogSchema = new mongoose.Schema(
  {
    date: {
      type: Date,
      required: true,
      default: Date.now,
    },
    description: {
      type: String,
      required: [true, "Mô tả là bắt buộc"],
      trim: true,
      maxlength: [500, "Mô tả không được vượt quá 500 ký tự"],
    },
    done_by: {
      type: String,
      required: [true, "Tên kỹ thuật viên là bắt buộc"],
      trim: true,
    },
  },
  { _id: true },
);

const AssetSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Tên tài sản là bắt buộc"],
      trim: true,
      maxlength: [100, "Tên tài sản không được vượt quá 100 ký tự"],
    },
    type: {
      type: String,
      enum: ["lift", "water_pump", "generator"],
      required: [true, "Loại tài sản là bắt buộc"],
    },
    status: {
      type: String,
      enum: ["working", "under_maintenance", "not_working"],
      default: "working",
    },
    location: {
      type: String,
      default: null,
    },
    last_service_date: {
      type: Date,
      default: null,
    },
    services: [ServiceLogSchema],
  },
  {
    timestamps: true,
  },
);

// Indexes
AssetSchema.index({ type: 1 });
AssetSchema.index({ status: 1 });

// Update last_service_date when service is added
AssetSchema.pre('save', async function() {
  if (this.services && this.services.length > 0) {
    const lastService = this.services[this.services.length - 1];
    this.last_service_date = lastService.date;
  }
});

module.exports = mongoose.model('Asset', AssetSchema);
