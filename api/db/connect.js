require('dotenv').config();
const { isEnabled, instrumentMongooseQueryMetrics } = require('@librechat/api');
const { logger, dropSupersededTenantIndexes } = require('@librechat/data-schemas');

const mongoose = require('mongoose');
const MONGO_URI = process.env.MONGO_URI;

instrumentMongooseQueryMetrics(mongoose);

if (!MONGO_URI) {
  throw new Error('Please define the MONGO_URI environment variable');
}
/** The maximum number of connections in the connection pool. */
const maxPoolSize = parseInt(process.env.MONGO_MAX_POOL_SIZE) || undefined;
/** The minimum number of connections in the connection pool. */
const minPoolSize = parseInt(process.env.MONGO_MIN_POOL_SIZE) || undefined;
/** The maximum number of connections that may be in the process of being established concurrently by the connection pool. */
const maxConnecting = parseInt(process.env.MONGO_MAX_CONNECTING) || undefined;
/** The maximum number of milliseconds that a connection can remain idle in the pool before being removed and closed. */
const maxIdleTimeMS = parseInt(process.env.MONGO_MAX_IDLE_TIME_MS) || undefined;
/** The maximum time in milliseconds that a thread can wait for a connection to become available. */
const waitQueueTimeoutMS = parseInt(process.env.MONGO_WAIT_QUEUE_TIMEOUT_MS) || undefined;
/** Set to false to disable automatic index creation for all models associated with this connection. */
const autoIndex =
  process.env.MONGO_AUTO_INDEX != undefined
    ? isEnabled(process.env.MONGO_AUTO_INDEX) || false
    : undefined;

/** Set to `false` to disable Mongoose automatically calling `createCollection()` on every model created on this connection. */
const autoCreate =
  process.env.MONGO_AUTO_CREATE != undefined
    ? isEnabled(process.env.MONGO_AUTO_CREATE) || false
    : undefined;

/**
 * Whether Mongoose index management is enabled. When the operator has not
 * explicitly opted out via `MONGO_AUTO_INDEX=false`, we defer Mongoose's
 * automatic index builds until after superseded legacy indexes are dropped —
 * otherwise the new non-unique `messageId_1`/`conversationId_1` index builds
 * collide with the old unique indexes of the same name and fail at startup.
 */
const shouldAutoIndex = autoIndex !== false;
/**
 * Global is used here to maintain a cached connection across hot reloads
 * in development. This prevents connections growing exponentially
 * during API Route usage.
 */
let cached = global.mongoose;

if (!cached) {
  cached = global.mongoose = { conn: null, promise: null };
}

mongoose.connection.on('error', (err) => {
  logger.error('[connectDb] MongoDB connection error:', err);
});

async function connectDb() {
  if (cached.conn && cached.conn?._readyState === 1) {
    return cached.conn;
  }

  const disconnected = cached.conn && cached.conn?._readyState !== 1;
  if (!cached.promise || disconnected) {
    const opts = {
      bufferCommands: false,
      ...(maxPoolSize ? { maxPoolSize } : {}),
      ...(minPoolSize ? { minPoolSize } : {}),
      ...(maxConnecting ? { maxConnecting } : {}),
      ...(maxIdleTimeMS ? { maxIdleTimeMS } : {}),
      ...(waitQueueTimeoutMS ? { waitQueueTimeoutMS } : {}),
      ...(autoIndex != undefined ? { autoIndex } : {}),
      ...(autoCreate != undefined ? { autoCreate } : {}),
      // useNewUrlParser: true,
      // useUnifiedTopology: true,
      // bufferMaxEntries: 0,
      // useFindAndModify: true,
      // useCreateIndex: true
    };
    // Defer autoIndex until after superseded legacy indexes are dropped so the
    // new non-unique `messageId_1`/`conversationId_1` builds don't collide with
    // the old unique indexes of the same name. Indexes are then built explicitly
    // below, preserving the default autoIndex behavior for every deployment.
    if (shouldAutoIndex) {
      opts.autoIndex = false;
    }
    logger.info('Mongo Connection options');
    logger.info(JSON.stringify(opts, null, 2));
    mongoose.set('strictQuery', true);
    cached.promise = mongoose.connect(MONGO_URI, opts).then(async (mongoose) => {
      if (shouldAutoIndex) {
        const { dropped } = await dropSupersededTenantIndexes(mongoose.connection);
        if (dropped.length > 0) {
          logger.info(
            `[TenantMigration] Dropped ${dropped.length} superseded indexes before building indexes`,
          );
        }
        // Build all indexes now that conflicting legacy indexes are gone.
        // `allSettled` keeps startup resilient to unrelated index build errors,
        // matching Mongoose's prior behavior of logging them without crashing.
        await Promise.allSettled(Object.values(mongoose.models).map((model) => model.init()));
      }
      return mongoose;
    });
  }
  cached.conn = await cached.promise;

  return cached.conn;
}

module.exports = {
  connectDb,
};
