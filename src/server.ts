import app from './app';
import { env } from './config/env';
import { logger } from './utils/logger';

const port = env.PORT;

app.listen(port, () => {
    logger.info(`Enterprise Smart Parking Lot Backend running on http://localhost:${port}`);
});
