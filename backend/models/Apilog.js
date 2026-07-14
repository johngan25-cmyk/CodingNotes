import mongoose from "mongoose";

const apiLogSchema = new mongoose.Schema(
  {
    endpoint: {
      type: String,
      required: true,
    },

    method: {
      type: String,
      required: true,
    },

    statusCode: {
      type: Number,

    },

    response: {
      type: mongoose.Schema.Types.Mixed,
      default: null,
    },

    requestBody: {
      type: mongoose.Schema.Types.Mixed,
      default: null,
    },

    requestQuery: {
      type: mongoose.Schema.Types.Mixed,
      default: null,
    },

    requestParams: {
      type: mongoose.Schema.Types.Mixed,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

const ApiLog = mongoose.model("ApiLog", apiLogSchema);
export default ApiLog;