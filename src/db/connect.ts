import mongoose from 'mongoose';

export default (endpoint: string) => {
  const connect = () => {
    mongoose
      .connect(endpoint, {
        useNewUrlParser: true,
        useUnifiedTopology: true,
        useFindAndModify: false,
        useCreateIndex: true,
      })
      .then(() => {
        console.log(`🪢  Successfully connected to ${endpoint}`);
      })
      .catch(error => {
        console.error('🧨  Error connecting to database: ', error);
        // eslint-disable-next-line no-process-exit
        process.exit(1);
      });
  };

  connect();
  mongoose.connection.on('disconnected', connect);
};
