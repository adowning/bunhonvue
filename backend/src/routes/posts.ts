import { Hono } from 'hono';
import { db } from '../../db/src';
import { posts }from '../../db/src/schema';

const postsRouter = new Hono();

postsRouter.get('/', async (c) => {
  const allPosts = await db.select().from(posts);
  return c.json(allPosts);
});

export default postsRouter;
