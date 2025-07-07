const multer = require('multer');
const express = require('express');
const { likeConvo } = require('../../models');
const {
  getRecentConvos,
  getHottestConvo,
  getSharedConvo,
  getLikedConvos,
  getPublicConvos,
  getFollowingConvos,
  increaseConvoViewCount,
} = require('../../models/Conversation');
const { duplicateMessages } = require('../../models/Message');
const crypto = require('crypto');
const Conversation = require('~/db/models');
const { sleep } = require('@librechat/agents');
const { isEnabled } = require('@librechat/api');
const { logger } = require('@librechat/data-schemas');
const { CacheKeys, EModelEndpoint } = require('librechat-data-provider');
const { getConvosByCursor, deleteConvos, getConvo, saveConvo } = require('~/models/Conversation');
const { forkConversation, duplicateConversation } = require('~/server/utils/import/fork');
const { createImportLimiters, createForkLimiters } = require('~/server/middleware');
const { storage, importFileFilter } = require('~/server/routes/files/multer');
const requireJwtAuth = require('~/server/middleware/requireJwtAuth');
const { importConversations } = require('~/server/utils/import');
const { deleteToolCalls } = require('~/models/ToolCall');
const getLogStores = require('~/cache/getLogStores');

const assistantClients = {
  [EModelEndpoint.azureAssistants]: require('~/server/services/Endpoints/azureAssistants'),
  [EModelEndpoint.assistants]: require('~/server/services/Endpoints/assistants'),
};

const router = express.Router();
router.use(requireJwtAuth);

router.get('/', async (req, res) => {
  const limit = parseInt(req.query.limit, 10) || 25;
  const cursor = req.query.cursor;
  const isArchived = isEnabled(req.query.isArchived);
  const search = req.query.search ? decodeURIComponent(req.query.search) : undefined;
  const order = req.query.order || 'desc';

  let tags;
  if (req.query.tags) {
    tags = Array.isArray(req.query.tags) ? req.query.tags : [req.query.tags];
  }

  try {
    const result = await getConvosByCursor(req.user.id, {
      cursor,
      limit,
      isArchived,
      tags,
      search,
      order,
    });
    res.status(200).json(result);
  } catch (error) {
    logger.error('Error fetching conversations', error);
    res.status(500).json({ error: 'Error fetching conversations' });
  }
});

router.get('/hottest', requireJwtAuth, async (req, res) => {
  try {
    const userId = req.user.id;
    const allConvos = await getHottestConvo(userId);
    res.status(200).send(allConvos);
  } catch (error) {
    console.error(error);
    res.status(500).send(error);
  }
});

router.get('/recent', requireJwtAuth, async (req, res) => {
  try {
    const userId = req.user.id;
    const recentConvos = await getRecentConvos(userId);
    res.status(200).send(recentConvos);
  } catch (error) {
    console.error(error);
    res.status(500).send(error);
  }
});

router.get('/following', requireJwtAuth, async (req, res) => {
  try {
    const following = req.user.following;
    const followingConvos = await getFollowingConvos(Object.keys(following));
    res.status(200).send(followingConvos);
  } catch (error) {
    console.error(error);
    res.status(500).send(error);
  }
});

router.get('/likedConvos/:userId', requireJwtAuth, async (req, res) => {
  try {
    const { userId } = req.params;
    const likedConvos = await getLikedConvos(userId);
    res.status(200).send(likedConvos);
  } catch (error) {
    console.error(error);
    res.status(500).send(error);
  }
});

router.get('/publicConvos/:userId', requireJwtAuth, async (req, res) => {
  try {
    const { userId } = req.params;
    const likedConvos = await getPublicConvos(userId);
    res.status(200).send(likedConvos);
  } catch (error) {
    console.error(error);
    res.status(500).send(error);
  }
});

router.get('/:conversationId', async (req, res) => {
  const { conversationId } = req.params;
  const convo = await getConvo(req.user.id, conversationId);

  if (convo) {
    res.status(200).json(convo);
  } else {
    res.status(404).end();
  }
});

router.get('/share/:conversationId', async (req, res) => {
  const { conversationId } = req.params;
  const convo = await getSharedConvo(conversationId);

  if (convo.isPrivate) {
    res.status(200).send({ isPrivate: true });
  } else if (!convo.isPrivate) {
    res.status(200).send(convo);
  } else {
    res.status(404).end();
  }
});

router.post('/gen_title', async (req, res) => {
  const { conversationId } = req.body;
  const titleCache = getLogStores(CacheKeys.GEN_TITLE);
  const key = `${req.user.id}-${conversationId}`;
  let title = await titleCache.get(key);

  if (!title) {
    // Retry every 1s for up to 20s
    for (let i = 0; i < 20; i++) {
      await sleep(1000);
      title = await titleCache.get(key);
      if (title) {
        break;
      }
    }
  }

  if (title) {
    await titleCache.delete(key);
    res.status(200).json({ title });
  } else {
    res.status(404).json({
      message: "Title not found or method not implemented for the conversation's endpoint",
    });
  }
});

router.delete('/', async (req, res) => {
  let filter = {};
  const { conversationId, source, thread_id, endpoint } = req.body.arg;

  // Prevent deletion of all conversations
  if (!conversationId && !source && !thread_id && !endpoint) {
    return res.status(400).json({
      error: 'no parameters provided',
    });
  }

  if (conversationId) {
    filter = { conversationId };
  } else if (source === 'button') {
    return res.status(200).send('No conversationId provided');
  }

  if (
    typeof endpoint !== 'undefined' &&
    Object.prototype.propertyIsEnumerable.call(assistantClients, endpoint)
  ) {
    /** @type {{ openai: OpenAI }} */
    const { openai } = await assistantClients[endpoint].initializeClient({ req, res });
    try {
      const response = await openai.beta.threads.del(thread_id);
      logger.debug('Deleted OpenAI thread:', response);
    } catch (error) {
      logger.error('Error deleting OpenAI thread:', error);
    }
  }

  try {
    const dbResponse = await deleteConvos(req.user.id, filter);
    await deleteToolCalls(req.user.id, filter.conversationId);
    res.status(201).json(dbResponse);
  } catch (error) {
    logger.error('Error clearing conversations', error);
    res.status(500).send('Error clearing conversations');
  }
});

router.delete('/all', async (req, res) => {
  try {
    const dbResponse = await deleteConvos(req.user.id, {});
    await deleteToolCalls(req.user.id);
    res.status(201).json(dbResponse);
  } catch (error) {
    logger.error('Error clearing conversations', error);
    res.status(500).send('Error clearing conversations');
  }
});

router.post('/update', async (req, res) => {
  const update = req.body.arg;

  if (!update.conversationId) {
    return res.status(400).json({ error: 'conversationId is required' });
  }

  try {
    const dbResponse = await saveConvo(req, update, {
      context: `POST /api/convos/update ${update.conversationId}`,
    });
    res.status(201).json(dbResponse);
  } catch (error) {
    logger.error('Error updating conversation', error);
    res.status(500).send('Error updating conversation');
  }
});

router.post('/duplicate', requireJwtAuth, async (req, res) => {
  const { conversation, msgData } = req.body.arg;

  const newConversationId = crypto.randomUUID();

  try {
    let convoObj = structuredClone(conversation);

    delete convoObj._id;
    convoObj.user = req.user.id;
    convoObj.conversationId = newConversationId;
    convoObj.isPrivate = true;
    convoObj.messages = await duplicateMessages({ newConversationId, msgData });

    const newConvo = new Conversation(convoObj);
    const dbResponse = await newConvo.save();
    res.status(201).send(dbResponse);
  } catch (error) {
    console.error(error);
    res.status(500).send(error);
  }
});

router.post('/like', async (req, res) => {
  const { conversationId, userId, liked } = req.body.arg;
  // console.log('hit like router');
  try {
    const dbResponse = await likeConvo(conversationId, userId, liked);
    // console.log('saved in like router');

    res.status(201).send(dbResponse);
  } catch (error) {
    console.error(error);
    res.status(500).send(error);
  }
});

router.post('/:conversationId/viewcount/increment', async (req, res) => {
  const { conversationId } = req.params;
  // console.log(`routes: hit viewcount increment router for conversationId ${conversationId}`);
  try {
    const dbResponse = await increaseConvoViewCount(conversationId);
    // console.log(
    //   `routes: viewcount updated for conversationId ${conversationId}: viewCount=${dbResponse?.viewCount}`,
    // );

    res.status(200).send(dbResponse);
  } catch (error) {
    console.error(error);
    res.status(500).send(error);
  }
});

const { importIpLimiter, importUserLimiter } = createImportLimiters();
const { forkIpLimiter, forkUserLimiter } = createForkLimiters();
const upload = multer({ storage: storage, fileFilter: importFileFilter });

/**
 * Imports a conversation from a JSON file and saves it to the database.
 * @route POST /import
 * @param {Express.Multer.File} req.file - The JSON file to import.
 * @returns {object} 201 - success response - application/json
 */
router.post(
  '/import',
  importIpLimiter,
  importUserLimiter,
  upload.single('file'),
  async (req, res) => {
    try {
      /* TODO: optimize to return imported conversations and add manually */
      await importConversations({ filepath: req.file.path, requestUserId: req.user.id });
      res.status(201).json({ message: 'Conversation(s) imported successfully' });
    } catch (error) {
      logger.error('Error processing file', error);
      res.status(500).send('Error processing file');
    }
  },
);

/**
 * POST /fork
 * This route handles forking a conversation based on the TForkConvoRequest and responds with TForkConvoResponse.
 * @route POST /fork
 * @param {express.Request<{}, TForkConvoResponse, TForkConvoRequest>} req - Express request object.
 * @param {express.Response<TForkConvoResponse>} res - Express response object.
 * @returns {Promise<void>} - The response after forking the conversation.
 */
router.post('/fork', forkIpLimiter, forkUserLimiter, async (req, res) => {
  try {
    /** @type {TForkConvoRequest} */
    const { conversationId, messageId, option, splitAtTarget, latestMessageId } = req.body;
    const result = await forkConversation({
      requestUserId: req.user.id,
      originalConvoId: conversationId,
      targetMessageId: messageId,
      latestMessageId,
      records: true,
      splitAtTarget,
      option,
    });

    res.json(result);
  } catch (error) {
    logger.error('Error forking conversation:', error);
    res.status(500).send('Error forking conversation');
  }
});

router.post('/duplicate', async (req, res) => {
  const { conversationId, title } = req.body;

  try {
    const result = await duplicateConversation({
      userId: req.user.id,
      conversationId,
      title,
    });
    res.status(201).json(result);
  } catch (error) {
    logger.error('Error duplicating conversation:', error);
    res.status(500).send('Error duplicating conversation');
  }
});

module.exports = router;
