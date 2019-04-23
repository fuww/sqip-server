const express = require('express');
const multer = require('multer');
const sqip = require('sqip');
const fs = require('fs');
const cluster = require('cluster');
const numCPUs = require('os').cpus().length;
const execa = require('execa');

const port = process.env.PORT || 3000;

const generatePlaceHolder = async (path) => {
  try {
    const { finalSvg: { data: svg } } = await sqip({ input: path });

    return svg;
  } catch (error) {
    // try to convert it with imagemagick
    const newPath = `${path}.png`;

    await execa('convert', [path, newPath]);

    const svg = await generatePlaceHolder(newPath);

    await fs.unlink(newPath, () => {});

    return svg;
  }
};

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

      const { path } = file;

      const svg = await generatePlaceHolder(path);

      res.send(svg);

      await fs.unlink(path, () => {});
    } catch (error) {
      res.status(422).send(error.message);
    }
  });

  app.listen(port);
}
