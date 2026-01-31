const { logger } = require('@librechat/data-schemas');

const STEP_ID_BY_ACTION = {
  import_assets: 'import',
  create_project: 'project',
  create_timeline: 'timeline',
  add_clip: 'timeline',
  add_transition: 'transitions',
  audio_mix: 'audio',
  fusion: 'fusion',
  tail_mark: 'tail_mark',
  render: 'render',
  package_project: 'package',
};

async function executeTimelineDsl({ runner, dsl }) {
  if (!runner) {
    throw new Error('Runner is required');
  }
  if (!dsl || !Array.isArray(dsl.actions)) {
    throw new Error('Invalid DSL format');
  }

  for (const action of dsl.actions) {
    const actionType = action.action || action.type;
    const stepId = STEP_ID_BY_ACTION[actionType];
    if (!stepId) {
      throw new Error(`Unsupported DSL action: ${actionType}`);
    }

    runner.emitProgress(stepId, { status: 'running', action: actionType });

    try {
      switch (actionType) {
        case 'import_assets':
          await runner.importAssets(action.assets || []);
          break;
        case 'create_project':
          await runner.callTool({
            toolName: action.tool || 'create_project',
            toolArguments: action.params || {},
          });
          break;
        case 'create_timeline':
          await runner.callTool({
            toolName: action.tool || 'create_timeline',
            toolArguments: action.params || {},
          });
          break;
        case 'add_clip':
          await runner.callTool({
            toolName: action.tool || 'add_clip',
            toolArguments: action.params || {},
          });
          break;
        case 'add_transition':
          await runner.applyTransitions(action.transitions || action.params || []);
          break;
        case 'audio_mix':
          await runner.applyAudioMix(action.rule || action.params || {});
          break;
        case 'fusion':
          await runner.applyFusion(action.fusion || action.params || {});
          break;
        case 'tail_mark':
          await runner.applyTailMark(
            action.text || 'Powered by MetaData',
            action.duration_sec || 2,
          );
          break;
        case 'render':
          await runner.render(action.outputPath, action.preset || action.params);
          break;
        case 'package_project':
          await runner.packageProject(action.outputZip || action.outputPath);
          break;
        default:
          throw new Error(`Unhandled DSL action: ${actionType}`);
      }

      runner.emitProgress(stepId, { status: 'completed', action: actionType });
    } catch (error) {
      logger.error('[TimelineDslExecutor] Action failed', { actionType, error: error.message });
      runner.emitProgress(stepId, { status: 'failed', action: actionType, error: error.message });
      throw error;
    }
  }
}

module.exports = {
  executeTimelineDsl,
  STEP_ID_BY_ACTION,
};
