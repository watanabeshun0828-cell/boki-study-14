import { writeFile } from 'node:fs/promises'
import { z } from 'zod'
import { lessonSchema, scenarioSchema, sourceSchema, accountSchema } from '../src/lib/schema.ts'
import { stateSchema } from '../src/lib/study.ts'
for (const [name, schema] of Object.entries({ course: lessonSchema, scenario: scenarioSchema, sources: z.array(sourceSchema), accounts: z.array(accountSchema), state: stateSchema })) {
  await writeFile(new URL('../docs/' + name + '.schema.json', import.meta.url), JSON.stringify(z.toJSONSchema(schema), null, 2) + '\n')
}
console.log('Exported 5 JSON schemas')
