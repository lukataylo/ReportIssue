export type CategoryId = 
  | 'rough-sleeping' 
  | 'potholes' 
  | 'fly-tipping' 
  | 'graffiti' 
  | 'broken-paving' 
  | 'streetlights' 
  | 'noise' 
  | 'asb' 
  | 'abandoned-vehicle' 
  | 'flooding';

export interface Category {
  id: CategoryId;
  title: string;
  icon: string;
  color: string;
  description: string;
  routing: string;
}

export interface Report {
  id: string;
  reference: string;
  categoryId: CategoryId;
  status: 'submitted' | 'in-progress' | 'resolved';
  timestamp: number;
  location: {
    lat: number;
    lng: number;
    address?: string;
  };
  description: string;
  photo?: string;
  details: Record<string, any>;
  routingService: string;
  explainer: string;
}

export const CATEGORIES: Category[] = [
  {
    id: 'rough-sleeping',
    title: 'Rough Sleeping',
    icon: 'User',
    color: '#E8734A',
    description: 'Report someone sleeping rough to StreetLink',
    routing: 'StreetLink'
  },
  {
    id: 'potholes',
    title: 'Potholes',
    icon: 'CircleAlert',
    color: '#3A7BD5',
    description: 'Damaged road surfaces',
    routing: 'FixMyStreet (Southwark)'
  },
  {
    id: 'fly-tipping',
    title: 'Fly-tipping',
    icon: 'Trash2',
    color: '#2BAE66',
    description: 'Illegal dumping of waste',
    routing: 'FixMyStreet (Southwark)'
  },
  {
    id: 'graffiti',
    title: 'Graffiti',
    icon: 'Paintbrush',
    color: '#2BAE66',
    description: 'Vandalism and illegal painting',
    routing: 'FixMyStreet (Southwark)'
  },
  {
    id: 'broken-paving',
    title: 'Broken Paving',
    icon: 'SquareSlash',
    color: '#3A7BD5',
    description: 'Loose or damaged paving slabs',
    routing: 'FixMyStreet (Southwark)'
  },
  {
    id: 'streetlights',
    title: 'Streetlights',
    icon: 'Lightbulb',
    color: '#3A7BD5',
    description: 'Broken or flickering street lights',
    routing: 'Southwark Council'
  },
  {
    id: 'noise',
    title: 'Noise Nuisance',
    icon: 'Volume2',
    color: '#D4A017',
    description: 'Loud music, parties, or construction',
    routing: 'Southwark ASB Unit'
  },
  {
    id: 'asb',
    title: 'Anti-social Behaviour',
    icon: 'ShieldAlert',
    color: '#D4A017',
    description: 'Harassment, rowdy behaviour, or drugs',
    routing: 'Southwark ASB Unit'
  },
  {
    id: 'abandoned-vehicle',
    title: 'Abandoned Vehicle',
    icon: 'Car',
    color: '#7F77DD',
    description: 'Vehicles left for a long time',
    routing: 'Southwark Council'
  },
  {
    id: 'flooding',
    title: 'Flooding',
    icon: 'Waves',
    color: '#3A7BD5',
    description: 'Surface water or sewer leaks',
    routing: 'Smart Routing'
  }
];
