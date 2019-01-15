const express = require('express');
const multer = require('multer');
const sqip = require('sqip');
const fs = require('fs');
const cluster = require('cluster');
const numCPUs = require('os').cpus().length;

const port = process.env.PORT || 3000;

if (cluster.isMaster) {
  for (let i = 0; i < numCPUs; i += 1) {
    cluster.fork();
  }
} else {
  const app = express();

  app.post('/', multer({ dest: 'uploads/' }).single('image'), async (req, res) => {
    try {
      const { file } = req;

      if (!file) {
        throw new Error('File upload is missing');
      }

      const { finalSvg: { data: svg } } = await sqip({ input: file.path });

      res.send(svg);

      await fs.unlink(file.path, () => {});
    } catch (error) {
      res.status(422).send(error.message);
    }
  });

  app.listen(port);
}
