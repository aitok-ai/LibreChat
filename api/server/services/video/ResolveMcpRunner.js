const { logger } = require('@librechat/data-schemas');
const { CacheKeys } = require('librechat-data-provider');
const { getLogStores } = require('~/cache');
const { getMCPManager, getFlowStateManager } = require('~/config');
const { GenerationJobManager } = require('@librechat/api');
const { findToken, createToken, updateToken, deleteTokens } = require('~/models');

const DEFAULT_SERVER_NAME = 'davinci_resolve_mcp';

class ResolveMcpRunner {
  constructor({ user, streamId, serverName = DEFAULT_SERVER_NAME, provider = 'openai' }) {
    this.user = user;
    this.streamId = streamId;
    this.serverName = serverName;
    this.provider = provider;
  }

  getFlowManager() {
    return getFlowStateManager(getLogStores(CacheKeys.FLOWS));
  }

  async initConnection({ signal } = {}) {
    const mcpManager = getMCPManager(this.user?.id);
    const flowManager = this.getFlowManager();
    return await mcpManager.getConnection({
      user: this.user,
      serverName: this.serverName,
      flowManager,
      signal,
    });
  }

  async callTool({ toolName, toolArguments, signal }) {
    const mcpManager = getMCPManager(this.user?.id);
    const flowManager = this.getFlowManager();
    return await mcpManager.callTool({
      user: this.user,
      serverName: this.serverName,
      toolName,
      provider: this.provider,
      toolArguments,
      options: { signal },
      flowManager,
      tokenMethods: {
        findToken,
        createToken,
        updateToken,
        deleteTokens,
      },
    });
  }

  emitProgress(stepId, data = {}) {
    if (!this.streamId) {
      return;
    }
    GenerationJobManager.emitChunk(this.streamId, {
      event: 'video_job_step',
      data: {
        step_id: stepId,
        ...data,
      },
    });
  }

  async importAssets(files) {
    logger.info('[ResolveMcpRunner] importAssets invoked', { count: files?.length ?? 0 });
    throw new Error('Not implemented: importAssets');
  }

  async buildTimeline(dsl) {
    logger.info('[ResolveMcpRunner] buildTimeline invoked');
    throw new Error('Not implemented: buildTimeline');
  }

  async applyAudioMix(rule) {
    logger.info('[ResolveMcpRunner] applyAudioMix invoked', { preset: rule?.preset });
    throw new Error('Not implemented: applyAudioMix');
  }

  async applyTransitions(transitions) {
    logger.info('[ResolveMcpRunner] applyTransitions invoked', { count: transitions?.length ?? 0 });
    throw new Error('Not implemented: applyTransitions');
  }

  async applyFusion(fusion) {
    logger.info('[ResolveMcpRunner] applyFusion invoked');
    throw new Error('Not implemented: applyFusion');
  }

  async applyTailMark(text, durationSec) {
    logger.info('[ResolveMcpRunner] applyTailMark invoked', { text, durationSec });
    throw new Error('Not implemented: applyTailMark');
  }

  async render(outputPath, preset) {
    logger.info('[ResolveMcpRunner] render invoked', { outputPath, preset });
    throw new Error('Not implemented: render');
  }

  async packageProject(outputZip) {
    logger.info('[ResolveMcpRunner] packageProject invoked', { outputZip });
    throw new Error('Not implemented: packageProject');
  }
}

module.exports = ResolveMcpRunner;
