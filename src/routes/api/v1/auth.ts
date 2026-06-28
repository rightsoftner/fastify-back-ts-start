import { FastifyInstance } from 'fastify';
import { TypeBoxTypeProvider } from '@fastify/type-provider-typebox';
import { Type, Static } from '@sinclair/typebox';

// --- TYPEBOX SCHEMAS ---

// Define the core entity schema
const ItemSchema = Type.Object({
  id: Type.String({ format: 'uuid' }),
  name: Type.String({ minLength: 1 }),
  price: Type.Number({ minimum: 0 }),
});

//const { Schema, model } = require("mongoose");

const UserSchema = Type.Object({
  id: Type.String({ format: 'uuid' }),
  username: Type.String({ unique: true, required: true, minLength: 8 }),
  password: Type.String({required: true }),
  userData: {
    ip: Type.String(),
    browser: Type.String(),
  },
  lastToken: Type.String(),
  renewPasswordLink: Type.String(),
  renewPasswordDate: Type.Date(),
});









// Create types from schemas if you need to use them elsewhere
type Item = Static<typeof ItemSchema>;

// Input validation schemas
const CreateItemBodySchema = Type.Omit(ItemSchema, ['id']);
const ItemParamsSchema = Type.Object({
  id: Type.String(),
});

// --- IN-MEMORY DATA ---
let items: Item[] = [
  { id: '1a2b3c4d-5e6f-7g8h-9i0j-1k2l3m4n5o6p', name: 'Mechanical Keyboard', price: 99.99 },
];

// --- PLUGIN / ROUTES ---
export async function itemRoutes(fastify: FastifyInstance) {
  // Enforce the TypeBox provider on this instance
  const server = fastify.withTypeProvider<TypeBoxTypeProvider>();

  // GET All Items
  server.get('/items', {
    schema: {
      response: {
        200: Type.Array(ItemSchema),
      },
    },
  }, async (request, reply) => {
    return items;
  });

  // GET Single Item
  server.get('/items/:id', {
    schema: {
      params: ItemParamsSchema,
      response: {
        200: ItemSchema,
        404: Type.Object({ message: Type.String() }),
      },
    },
  }, async (request, reply) => {
    const { id } = request.params;
    const item = items.find((i) => i.id === id);

    if (!item) {
      return reply.status(404).send({ message: 'Item not found' });
    }
    return item;
  });

  // POST Create Item
  server.post('/items', {
    schema: {
      body: CreateItemBodySchema,
      response: {
        201: ItemSchema,
      },
    },
  }, async (request, reply) => {
    // request.body is automatically typed as { name: string; price: number }
    const { name, price } = request.body;

    const newItem: Item = {
      id: crypto.randomUUID(),
      name,
      price,
    };

    items.push(newItem);
    return reply.status(201).send(newItem);
  });
}