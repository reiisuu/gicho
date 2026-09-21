import { model, models, Schema, type InferSchemaType } from "mongoose";

const productSchema = new Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    category: {
      type: String,
      required: true,
      trim: true,
    },
    priceCents: {
      type: Number,
      required: true,
      min: 0,
      validate: {
        validator: Number.isInteger,
        message: "priceCents must be an integer",
      },
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: {
      createdAt: false,
      updatedAt: true,
    },
  },
);

export type Product = InferSchemaType<typeof productSchema>;

const ProductModel = models.Product ?? model("Product", productSchema);

export default ProductModel;
