import { Request, Response } from 'express';

const path = require('path');
const fs = require('fs');
const router = require('express').Router();

const docsDir = path.join(__dirname, '../../docs');

/* API documentation */
router.get('/docs', (req: Request, res: Response) => {
  const filePath = path.join(docsDir, 'api.html');
  if (fs.existsSync(filePath)) {
    res.sendFile(filePath);
  } else {
    res.status(404).send('Swagger UI HTML not found');
  }
});

/* API specification files */
router.get('/docs/:file', (req: Request, res: Response) => {
  const fileName = req.params.file;
  if (!fileName.endsWith('.yaml')) {
    return res.status(400).send('Only .yaml files are allowed');
  }

  const filePath = path.join(docsDir, fileName);
  if (fs.existsSync(filePath)) {
    res.sendFile(filePath);
  } else {
    res.status(404).send('YAML file not found');
  }
});

module.exports = router;
