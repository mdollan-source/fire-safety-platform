/**
 * Fire Safety Asset Types
 * Pre-defined categories aligned with UK Fire Safety Order requirements
 */

export type AssetType =
  | 'fire_door'
  | 'fire_alarm'
  | 'call_point'
  | 'smoke_detector'
  | 'heat_detector'
  | 'co_detector'
  | 'sounder'
  | 'strobe'
  | 'sounder_strobe'
  | 'emergency_lighting'
  | 'extinguisher'
  | 'sprinkler_system'
  | 'fire_blanket'
  | 'dry_riser'
  | 'hose_reel'
  | 'smoke_vent'
  | 'fire_curtain'
  | 'evacuation_chair'
  | 'assembly_point'
  | 'other';

export interface AssetTypeDefinition {
  id: AssetType;
  name: string;
  category: 'detection' | 'suppression' | 'evacuation' | 'passive' | 'other';
  icon: string; // Lucide icon name
  description: string;
  commonAttributes?: string[]; // Common fields for this type
}

export const ASSET_TYPES: AssetTypeDefinition[] = [
  // Detection & Alarm Systems
  {
    id: 'fire_alarm',
    name: 'Fire Alarm Panel',
    category: 'detection',
    icon: 'Bell',
    description: 'Main fire alarm control panel',
    commonAttributes: ['manufacturer', 'model', 'zoneCount', 'installDate', 'lastService'],
  },
  {
    id: 'call_point',
    name: 'Manual Call Point',
    category: 'detection',
    icon: 'AlertTriangle',
    description: 'Break glass call point',
    commonAttributes: ['location', 'type', 'address'],
  },
  {
    id: 'smoke_detector',
    name: 'Smoke Detector',
    category: 'detection',
    icon: 'CloudFog',
    description: 'Optical or ionisation smoke detector',
    commonAttributes: ['detectorType', 'location', 'zoneAddress', 'installDate', 'lastService'],
  },
  {
    id: 'heat_detector',
    name: 'Heat Detector',
    category: 'detection',
    icon: 'Thermometer',
    description: 'Fixed temperature or rate-of-rise heat detector',
    commonAttributes: ['detectorType', 'location', 'zoneAddress', 'installDate', 'lastService'],
  },
  {
    id: 'co_detector',
    name: 'CO Detector',
    category: 'detection',
    icon: 'Wind',
    description: 'Carbon monoxide detector',
    commonAttributes: ['location', 'zoneAddress', 'installDate', 'expiryDate'],
  },
  {
    id: 'sounder',
    name: 'Sounder',
    category: 'detection',
    icon: 'Volume2',
    description: 'Audible fire alarm sounder/bell',
    commonAttributes: ['location', 'zoneAddress', 'soundType', 'installDate'],
  },
  {
    id: 'strobe',
    name: 'Visual Alarm (Strobe)',
    category: 'detection',
    icon: 'Flashlight',
    description: 'Visual alarm device (strobe/beacon)',
    commonAttributes: ['location', 'zoneAddress', 'installDate'],
  },
  {
    id: 'sounder_strobe',
    name: 'Sounder/Strobe (Combined)',
    category: 'detection',
    icon: 'Speaker',
    description: 'Combined audible and visual alarm device',
    commonAttributes: ['location', 'zoneAddress', 'soundType', 'installDate'],
  },

  // Emergency Lighting
  {
    id: 'emergency_lighting',
    name: 'Emergency Light',
    category: 'evacuation',
    icon: 'Lightbulb',
    description: 'Emergency lighting unit',
    commonAttributes: ['type', 'duration', 'location', 'installDate'],
  },

  // Fire Suppression
  {
    id: 'extinguisher',
    name: 'Fire Extinguisher',
    category: 'suppression',
    icon: 'Flame',
    description: 'Portable fire extinguisher',
    commonAttributes: ['extinguisherType', 'capacity', 'location', 'installDate', 'expiryDate'],
  },
  {
    id: 'sprinkler_system',
    name: 'Sprinkler System',
    category: 'suppression',
    icon: 'Droplets',
    description: 'Automatic sprinkler system',
    commonAttributes: ['systemType', 'coverage', 'pumpDetails', 'installDate'],
  },
  {
    id: 'fire_blanket',
    name: 'Fire Blanket',
    category: 'suppression',
    icon: 'Square',
    description: 'Fire blanket (typically kitchen)',
    commonAttributes: ['size', 'location', 'installDate', 'expiryDate'],
  },
  {
    id: 'hose_reel',
    name: 'Fire Hose Reel',
    category: 'suppression',
    icon: 'Cable',
    description: 'Fire hose reel',
    commonAttributes: ['length', 'location', 'installDate', 'lastService'],
  },
  {
    id: 'dry_riser',
    name: 'Dry Riser',
    category: 'suppression',
    icon: 'PipelineIcon',
    description: 'Dry riser inlet/outlet',
    commonAttributes: ['type', 'location', 'floors', 'installDate', 'lastService'],
  },

  // Passive Fire Protection
  {
    id: 'fire_door',
    name: 'Fire Door',
    category: 'passive',
    icon: 'Door',
    description: 'Fire-rated door',
    commonAttributes: ['rating', 'location', 'closer', 'intumescentStrips', 'smokeSeals'],
  },
  {
    id: 'fire_curtain',
    name: 'Fire Curtain',
    category: 'passive',
    icon: 'SeparatorVertical',
    description: 'Automatic fire curtain',
    commonAttributes: ['rating', 'location', 'width', 'height', 'installDate'],
  },
  {
    id: 'smoke_vent',
    name: 'Smoke Vent',
    category: 'passive',
    icon: 'Wind',
    description: 'Automatic smoke vent (AOV)',
    commonAttributes: ['type', 'location', 'activationType', 'installDate'],
  },

  // Evacuation Equipment
  {
    id: 'evacuation_chair',
    name: 'Evacuation Chair',
    category: 'evacuation',
    icon: 'Armchair',
    description: 'Emergency evacuation chair',
    commonAttributes: ['model', 'location', 'weightLimit', 'installDate'],
  },
  {
    id: 'assembly_point',
    name: 'Assembly Point',
    category: 'evacuation',
    icon: 'MapPin',
    description: 'Fire assembly point',
    commonAttributes: ['location', 'capacity', 'signage'],
  },

  // Other
  {
    id: 'other',
    name: 'Other Equipment',
    category: 'other',
    icon: 'Package',
    description: 'Other fire safety equipment',
    commonAttributes: ['description', 'location'],
  },
];

// Fire Extinguisher Types (BS 5306-3)
export const EXTINGUISHER_TYPES = [
  { value: 'water', label: 'Water', color: 'red' },
  { value: 'foam', label: 'Foam (AFFF)', color: 'cream' },
  { value: 'co2', label: 'CO2', color: 'black' },
  { value: 'powder', label: 'Dry Powder', color: 'blue' },
  { value: 'wet_chemical', label: 'Wet Chemical', color: 'yellow' },
] as const;

// Fire Door Ratings (BS 476-22 / EN 1634-1)
export const FIRE_DOOR_RATINGS = [
  { value: 'FD30', label: 'FD30 (30 minutes)' },
  { value: 'FD60', label: 'FD60 (60 minutes)' },
  { value: 'FD90', label: 'FD90 (90 minutes)' },
  { value: 'FD120', label: 'FD120 (120 minutes)' },
] as const;

// Emergency Lighting Types (BS 5266-1)
export const EMERGENCY_LIGHTING_TYPES = [
  { value: 'maintained', label: 'Maintained' },
  { value: 'non_maintained', label: 'Non-Maintained' },
  { value: 'sustained', label: 'Sustained' },
] as const;

// Helper function to get asset type definition
export function getAssetTypeDefinition(type: AssetType): AssetTypeDefinition | undefined {
  return ASSET_TYPES.find((t) => t.id === type);
}

// Helper function to get asset types by category
export function getAssetTypesByCategory(category: AssetTypeDefinition['category']): AssetTypeDefinition[] {
  return ASSET_TYPES.filter((t) => t.category === category);
}
