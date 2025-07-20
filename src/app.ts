require('dotenv').config();
const express = require('express');
const cors = require('cors');
const cookie = require('cookie-parser');
const multer = require('multer');

const apiRoutes = require('@/routes');
const corsOptions = require('@/config/cors');
const logger = require('@/utilities/logger');
const responseMiddleware = require('@/middlewares/response-middleware');
const { authorize } = require('@/middlewares/authorization/authorize');
const { activityLogger } = require('@/middlewares/activity-logger');

const app = express();
const upload = multer();
const port = process.env.PORT || 3001;

app.use(cors(corsOptions));
app.use(cookie());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(upload.any());
app.use(activityLogger());
app.use(responseMiddleware);
// Authorization middleware applied to all /api routes
// Public health check endpoint
app.get('/health', (_req: any, res: any) => res.json({ status: 'ok' }));

// Mount versioned API routes – each sub-router applies its own authorization where required
app.use('/api', apiRoutes);

if (process.env.NODE_ENV !== 'test') {
  app.listen(port, logger.log(`Server is running on port ${port}`));
}

export default app;
