const express = require('express');
const router = express.Router();
const { getMessages, likeMessage } = require('../../models/Message');
const { increaseConvoViewCount } = require('../../models/Conversation');
const requireJwtAuth = require('../../middleware/requireJwtAuth');

router.get('/:conversationId', requireJwtAuth, async (req, res) => {
  const { conversationId } = req.params;
  await increaseConvoViewCount(conversationId); //Added for https://github.com/aitok-ai/LibreChatInternal/issues/95
  res.status(200).send(await getMessages({ conversationId }));
});

router.post('/like', async (req, res) => {
  const { messageId, isLiked } = req.body;

  try {
    const dbResponse = await likeMessage(messageId, isLiked);
    res.status(201).send(dbResponse);
  } catch (error) {
    console.error(error);
    res.status(500).send(error);
  }
});
module.exports = router;
