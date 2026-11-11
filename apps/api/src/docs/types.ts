export interface ApiOperation {
  tags: string[];
  summary: string;
  description?: string;
  operationId: string;
  security?: Array<Record<string, string[]>>;
  parameters?: unknown[];
  requestBody?: unknown;
  responses: Record<string, unknown>;
}

export type ApiPathItem = Record<string, ApiOperation>;

export type ApiPaths = Record<string, ApiPathItem>;

/** `security` value for every non-public operation (CT-00 Bearer JWT). */
export const bearerAuth: Array<Record<string, string[]>> = [{ bearerAuth: [] }];

function jsonContent(schema: unknown, example?: unknown): unknown {
  const content: Record<string, unknown> = { schema };
  if (example !== undefined) content.example = example;
  return { 'application/json': content };
}

export function okResponse(description: string, schema?: unknown, example?: unknown): unknown {
  if (schema === undefined) return { description };
  return { description, content: jsonContent(schema, example) };
}

export function errorResponse(code: string, description: string, withFields = false): unknown {
  const example: Record<string, unknown> = { error: { code, message: description } };
  if (withFields) (example.error as Record<string, unknown>).fields = { field: 'What is wrong' };
  return {
    description: `${code}: ${description}`,
    content: jsonContent({ $ref: '#/components/schemas/Error' }, example),
  };
}

export function queryParam(
  name: string,
  description: string,
  schema: unknown,
  required = false,
): unknown {
  return { name, in: 'query', required, description, schema };
}

export function pathParam(name: string, description: string): unknown {
  return { name, in: 'path', required: true, description, schema: { type: 'string' } };
}

export const objectIdDescription = 'Mongo ObjectId as a string';
