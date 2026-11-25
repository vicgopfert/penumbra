import { readFileSync } from 'node:fs';
import { join } from 'node:path';

// Cada campo com dado pessoal e a seção da política de privacidade (/privacidade) que o descreve.
// Campo novo no User ou em modelo ligado a ele faz este teste falhar: antes de gravá-lo, a
// política, o inventário do docs/privacidade.md e a data de vigência mudam juntos.
const INVENTORY: Record<string, string> = {
  'User.id': 'conta',
  'User.email': 'conta',
  'User.passwordHash': 'conta',
  'User.displayName': 'conta',
  'User.role': 'conta',
  'User.discoveryMode': 'conta',
  'User.onboardingCompletedAt': 'conta',
  'User.emailConfirmedAt': 'conta',
  'User.usageMetricsConsentAt': 'conta',
  'User.createdAt': 'conta',
  'Session.id': 'sessao',
  'Session.userId': 'sessao',
  'Session.tokenHash': 'sessao',
  'Session.expiresAt': 'sessao',
  'Session.createdAt': 'sessao',
  'AccountToken.id': 'links-por-email',
  'AccountToken.userId': 'links-por-email',
  'AccountToken.purpose': 'links-por-email',
  'AccountToken.tokenHash': 'links-por-email',
  'AccountToken.expiresAt': 'links-por-email',
  'AccountToken.createdAt': 'links-por-email',
  'Rating.userId': 'biblioteca',
  'Rating.gameId': 'biblioteca',
  'Rating.score': 'biblioteca',
  'Rating.updatedAt': 'biblioteca',
  'ListEntry.userId': 'biblioteca',
  'ListEntry.gameId': 'biblioteca',
  'ListEntry.listType': 'biblioteca',
  'ListEntry.createdAt': 'biblioteca',
  'UserPreference.userId': 'biblioteca',
  'UserPreference.featureId': 'biblioteca',
  'UserPreference.createdAt': 'biblioteca',
  ...Object.fromEntries(
    [
      'id',
      'kind',
      'occurredAt',
      'userId',
      'page',
      'visitStart',
      'origin',
      'gameId',
      'gameIds',
      'list',
      'mode',
      'position',
      'listPage',
      'exit',
      'store',
    ].map((field) => [`ProductEvent.${field}`, 'metricas-de-uso']),
  ),
};

type SchemaField = { name: string; type: string };

const readSchema = () => readFileSync(join(__dirname, '../../prisma/schema.prisma'), 'utf8');

function readModels() {
  const schema = readSchema();
  const models = new Map<string, SchemaField[]>();
  for (const model of schema.matchAll(/^model (?<name>\w+) \{\n(?<body>[\s\S]*?)^\}/gm)) {
    const { name = '', body = '' } = model.groups ?? {};
    const fields = [...body.matchAll(/^\s+(?<field>\w+)\s+(?<type>\w+)/gm)].map(({ groups }) => ({
      name: groups?.field ?? '',
      type: groups?.type ?? '',
    }));
    models.set(name, fields);
  }
  return models;
}

function personalDataFields() {
  const models = readModels();
  const isPersonal = (name: string, fields: SchemaField[]) =>
    name === 'User' || fields.some(({ type }) => type === 'User');
  return [...models]
    .filter(([name, fields]) => isPersonal(name, fields))
    .flatMap(([name, fields]) =>
      fields.filter(({ type }) => !models.has(type)).map((field) => `${name}.${field.name}`),
    );
}

// Cada relação com o User, como "Model.campo", com o onDelete dela, ou null sem onDelete.
function userRelations() {
  const models = readSchema().matchAll(/^model (?<model>\w+) \{\n(?<body>[\s\S]*?)^\}/gm);
  return [...models].flatMap(({ groups }) =>
    [
      ...(groups?.body ?? '').matchAll(/^\s+(?<field>\w+)\s+User\??\s+@relation\((?<args>.*)\)/gm),
    ].map((relation) => [
      `${groups?.model}.${relation.groups?.field}`,
      /onDelete:\s*(\w+)/.exec(relation.groups?.args ?? '')?.[1] ?? null,
    ]),
  );
}

describe('inventário de dados pessoais', () => {
  it('todo campo com dado pessoal do schema.prisma está no inventário da política, e só eles', () => {
    expect(personalDataFields().sort()).toEqual(Object.keys(INVENTORY).sort());
  });

  // A exclusão da conta (B-52) apaga só o User e confia na cascata para o resto: um modelo novo
  // ligado à conta sem cascata faria a exclusão falhar ou deixar dados para trás.
  it('toda relação com o User é apagada em cascata com a conta', () => {
    const relations = userRelations();

    expect(relations.length).toBeGreaterThan(0);
    for (const [relation, onDelete] of relations)
      expect([relation, onDelete]).toEqual([relation, 'Cascade']);
  });
});
