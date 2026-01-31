const VideoJobService = require('../services/VideoJobService');

module.exports = {
  async createVideoJob(req, res) {
    try {
      const payload = req.body;
      const job = await VideoJobService.createVideoJob({
        userId: req.user?.id,
        asset_ids: payload.asset_ids,
        template_type: payload.template_type,
        platform_preset: payload.platform_preset,
        prompt: payload.prompt,
      });
      res.status(200).json({ job_id: job.job_id, stream_id: job.stream_id, status: job.status });
    } catch (e) {
      res.status(400).json({ error: e.message });
    }
  },

  async getVideoJob(req, res) {
    try {
      const id = req.params.id;
      const info = await VideoJobService.getVideoJob(id);
      if (!info) return res.status(404).json({ error: 'Not found' });
      res.json(info);
    } catch (e) {
      res.status(500).json({ error: e.message });
    }
  },

  async cancelVideoJob(req, res) {
    try {
      const id = req.params.id;
      const ok = await VideoJobService.cancelVideoJob(id);
      if (!ok) return res.status(404).json({ error: 'Not found or already finished' });
      res.json({ job_id: id, status: 'canceled' });
    } catch (e) {
      res.status(500).json({ error: e.message });
    }
  },

  async downloadZip(req, res) {
    try {
      const id = req.params.id;
      const zipPath = await VideoJobService.getOutputZipPath(id);
      if (!zipPath) return res.status(404).json({ error: 'Not found' });
      res.download(zipPath);
    } catch (e) {
      res.status(500).json({ error: e.message });
    }
  },
};
