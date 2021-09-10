import mongoose, {Schema, Document} from 'mongoose';

export interface IGithubApplicant extends Document {
  githubId: string;
  githubName: string;
  address: string;
}

const GithubApplicantSchema: Schema = new Schema({
    githubId: {type: String, required: true, index: true},
    githubName: {type: String, index: true},
    address: {type: String, require: true, index: true},
});

export default mongoose.model<IGithubApplicant>(
  'GithubApplicant',
  GithubApplicantSchema
);
