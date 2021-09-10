import mongoose, {Schema, Document} from 'mongoose';

export interface IPromotionCodes extends Document {
  code: string;
  providedCount: number;
}

const PromotionCodesSchema: Schema = new Schema({
  code: {type: String, required: true, unique: true, index: true},
  // Number of times available for application
  providedCount: {type: Number, require: true}
});

// Export the model and return PromotionCode interface
export default mongoose.model<IPromotionCodes>(
  'PromotionCodes',
  PromotionCodesSchema
);
