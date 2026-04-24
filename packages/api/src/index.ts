import { createServer } from 'http';
import { env } from '@batsirai/config';
import { createApp } from './app';
import { startSubscriptionCron } from './jobs/subscriptionCron';
import { initSocket } from './socket';

const app = createApp();
const server = createServer(app);

initSocket(server);
startSubscriptionCron();

const port = env.PORT;
server.listen(port, () => {
  console.log(`Batsirai API listening on ${port}`);
});
