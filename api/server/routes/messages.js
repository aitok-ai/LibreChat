const express = require('express');
const router = express.Router();
const {
  getMessages,
  updateMessage,
  saveConvo,
  saveMessage,
  deleteMessages,
  likeMessage,
} = require('../../models');
const { countTokens } = require('../utils');
const { requireJwtAuth, validateMessageReq } = require('../middleware/');

router.use(requireJwtAuth);

router.get('/:conversationId', validateMessageReq, async (req, res) => {
  const { conversationId } = req.params;
  res.status(200).send(await getMessages({ conversationId }, '-_id -__v -user'));
});

// CREATE
router.post('/:conversationId', validateMessageReq, async (req, res) => {
  const message = req.body;
  const savedMessage = await saveMessage({ ...message, user: req.user.id });
  await saveConvo(req.user.id, savedMessage);
  res.status(201).send(savedMessage);
});

// READ
router.get('/:conversationId/:messageId', validateMessageReq, async (req, res) => {
  const { conversationId, messageId } = req.params;
  res.status(200).send(await getMessages({ conversationId, messageId }, '-_id -__v -user'));
});

// UPDATE
router.put('/:conversationId/:messageId', validateMessageReq, async (req, res) => {
  const { messageId, model } = req.params;
  const { text } = req.body;
  const tokenCount = await countTokens(text, model);
  res.status(201).json(await updateMessage({ messageId, text, tokenCount }));
});

// DELETE
router.delete('/:conversationId/:messageId', validateMessageReq, async (req, res) => {
  const { messageId } = req.params;
  await deleteMessages({ messageId });
  res.status(204).send();
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
