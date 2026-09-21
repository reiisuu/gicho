import { model, models, Schema, type InferSchemaType } from "mongoose";

const transactionItemSchema = new Schema(
  {
    productId: {
      type: Schema.Types.ObjectId,
      ref: "Product",
      required: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    unitPriceCents: {
      type: Number,
      required: true,
      min: 0,
      validate: {
        validator: Number.isInteger,
        message: "unitPriceCents must be an integer",
      },
    },
    quantity: {
      type: Number,
      required: true,
      min: 1,
      validate: {
        validator: Number.isInteger,
        message: "quantity must be an integer",
      },
    },
  },
  { _id: false },
);

const transactionSchema = new Schema({
  clientId: {
    type: String,
    required: true,
    unique: true,
    trim: true,
  },
  createdAt: {
    type: Date,
    required: true,
  },
  saleDate: {
    type: String,
    required: true,
    match: /^\d{4}-\d{2}-\d{2}$/,
  },
  items: {
    type: [transactionItemSchema],
    required: true,
    validate: {
      validator: (items: unknown[]) => items.length > 0,
      message: "items must contain at least one product",
    },
  },
  totalCents: {
    type: Number,
    required: true,
    min: 0,
    validate: {
      validator: Number.isInteger,
      message: "totalCents must be an integer",
    },
  },
  paymentMethod: {
    type: String,
    enum: ["Cash", "GCash", "Maya", "Bank Transfer"],
    required: true,
  },
  amountTenderedCents: {
    type: Number,
    min: 0,
    validate: {
      validator: Number.isInteger,
      message: "amountTenderedCents must be an integer",
    },
  },
  changeCents: {
    type: Number,
    min: 0,
    validate: {
      validator: Number.isInteger,
      message: "changeCents must be an integer",
    },
  },
  referenceNumber: {
    type: String,
    trim: true,
  },
  isDeleted: {
    type: Boolean,
    default: false,
  },
  deletedAt: {
    type: Date,
    default: null,
  },
  source: {
    type: String,
    enum: ["app", "import"],
    default: "app",
    required: true,
  },
});

export type TransactionItem = InferSchemaType<typeof transactionItemSchema>;
export type Transaction = InferSchemaType<typeof transactionSchema>;

const TransactionModel =
  models.Transaction ?? model("Transaction", transactionSchema);

export default TransactionModel;
