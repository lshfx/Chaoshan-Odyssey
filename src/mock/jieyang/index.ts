import type { CityData } from '../types'
import { characters } from './characters'
import { npcs } from './npcs'
import { pois } from './pois'
import { seals, clues, items, gameFlow } from './items'

export const jieyang: CityData = {
  cityId: 'jieyang',
  cityName: '揭阳',
  cityStatus: 'unlocked', // unlocked, locked, completed
  description: '百年侨乡，文脉传承',
  characters,
  npcs,
  pois,
  seals,
  gameFlow,
  clues,
  items
}