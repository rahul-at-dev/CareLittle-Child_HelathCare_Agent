import mongoose, { Schema, Document } from 'mongoose';

export type MealCategory = 'breastfeeding' | 'formula' | 'solids' | 'snacks' | 'fluids';

export interface INutritionRecord extends Document {
  childId: mongoose.Types.ObjectId | string;
  date: Date;
  mealCategory: MealCategory;
  description?: string;
  foodItems: string[];
  dietaryNotes?: string;
  allergiesTriggered: string[];
  fluidIntakeMl?: number;
  createdAt: Date;
  updatedAt: Date;
}

const NutritionRecordSchema: Schema = new Schema(
  {
    childId: { type: Schema.Types.ObjectId, ref: 'Child', required: true, index: true },
    date: { type: Date, required: true, default: Date.now, index: true },
    mealCategory: {
      type: String,
      enum: ['breastfeeding', 'formula', 'solids', 'snacks', 'fluids'],
      required: true,
      index: true
    },
    description: { type: String },
    foodItems: { type: [String], default: [] },
    dietaryNotes: { type: String },
    allergiesTriggered: { type: [String], default: [] },
    fluidIntakeMl: { type: Number, min: 0 }
  },
  { timestamps: true }
);

export const NutritionRecord = mongoose.model<INutritionRecord>('NutritionRecord', NutritionRecordSchema);
