/** @name CONFIG.EternalHunger */
export const EternalHunger = {};

EternalHunger.characterGenerator = {
  ability: "3d6",
  hitProtection: "1d6",
  gold: "3d6",
  name: {
    text: "{name} {surname}",
    items: {
      name: "eternalhunger.character-creation-tables-srd;Names",
      surname: "eternalhunger.character-traits;Surnames"
    }
  },
  background: "eternalhunger.character-traits;Background",
  startingItems: [
    "eternalhunger.expeditionary-gear;Rations;1",
    "eternalhunger.expeditionary-gear;Torch;1"
  ],
  startingGear: [
    "eternalhunger.character-creation-tables-srd;Starting Gear - Armor",
    "eternalhunger.character-creation-tables-srd;Starting Gear - Helmet & Shields",
    "eternalhunger.character-creation-tables-srd;Starting Gear - Weapons",
    "eternalhunger.character-creation-tables-srd;Starting Gear - Expeditionary Gear",
    "eternalhunger.character-creation-tables-srd;Starting Gear - Tools",
    "eternalhunger.character-creation-tables-srd;Starting Gear - Trinkets",
    "eternalhunger.character-creation-tables-srd;Starting Gear - Bonus Item"
  ],
  biography: {
    text: "I have a <strong>{physique}</strong> physique, <strong>{skin}</strong> skin, <strong>{hair}</strong> hair, and a <strong>{face}</strong> face. I speak in a <strong>{speech}</strong> manner and wear <strong>{clothing}</strong> clothing. I am <strong>{vice}</strong> yet <strong>{virtue}</strong>, and I am generally regarded as <strong>{reputation}</strong>. I have had the misfortune of being <strong>{misfortune}</strong>. I am <strong>{age}</strong> years old.",
    age: "2d20 + 10",
    items: {
      physique: "eternalhunger.character-traits;Physique",
      skin: "eternalhunger.character-traits;Skin",
      hair: "eternalhunger.character-traits;Hair",
      face: "eternalhunger.character-traits;Face",
      speech: "eternalhunger.character-traits;Speech",
      clothing: "eternalhunger.character-traits;Clothing",
      vice: "eternalhunger.character-traits;Vice",
      virtue: "eternalhunger.character-traits;Virtue",
      misfortune: "eternalhunger.character-traits;Misfortunes",
      reputation: "eternalhunger.character-traits;Reputation"
    }
  }
};

CONFIG.EternalHunger = EternalHunger;

