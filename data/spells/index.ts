export { fireSpells } from "./fire";
export { iceSpells } from "./ice";
export { lightningSpells } from "./lightning";
export { windSpells } from "./wind";
export { radiantSpells } from "./radiant";
export { necroticSpells } from "./necrotic";
export { utilitySpells } from "./utility";

import { fireSpells } from "./fire";
import { iceSpells } from "./ice";
import { lightningSpells } from "./lightning";
import { windSpells } from "./wind";
import { radiantSpells } from "./radiant";
import { necroticSpells } from "./necrotic";
import { utilitySpells } from "./utility";
import type { Spell } from "../types";

export const allSpells: Spell[] = [
  ...fireSpells,
  ...iceSpells,
  ...lightningSpells,
  ...windSpells,
  ...radiantSpells,
  ...necroticSpells,
  ...utilitySpells,
];
