import mongoose, {Schema, Document} from 'mongoose';

export interface IPromotionApplicant extends Document {
  code: string;
  address: string;
  twitterId: string;
}

const PromotionApplicantSchema: Schema = new Schema({
  code: {type: String, required: true, index: true},
  // Code corresponds to the number of free orders
  address: {type: String, require: true},
  twitterId: {type: String, require: true}
});

// Export the model and return PromotionCode interface
export default mongoose.model<IPromotionApplicant>(
  'PromotionApplicant',
  PromotionApplicantSchema
);
