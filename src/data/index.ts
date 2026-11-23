import rawAccounts from './accounts.json'
import rawSources from './sources.json'
import rawScenario from './scenario.json'
import config from './config.json'
import { z } from 'zod'
import { accountSchema, lessonSchema, scenarioSchema, sourceSchema } from '../lib/schema'

export const accounts = z.array(accountSchema).parse(rawAccounts)
export const accountMap = new Map(accounts.map(account => [account.id, account]))
export const sources = z.array(sourceSchema).parse(rawSources)
export const sourceMap = new Map(sources.map(source => [source.id, source]))
export const scenario = scenarioSchema.parse(rawScenario)
export const lessons = Object.values(import.meta.glob('./day*.json', { eager: true, import: 'default' }))
  .map(raw => lessonSchema.parse(raw)).sort((a, b) => a.day - b.day)
export const questions = lessons.flatMap(lesson => lesson.questions)
export const questionMap = new Map(questions.map(question => [question.id, question]))
export const sectionIds = new Set(lessons.flatMap(lesson => lesson.sections.map(section => section.id)))
export { config }
export const money = (value: number) => value.toLocaleString('ja-JP') + ' 円'
