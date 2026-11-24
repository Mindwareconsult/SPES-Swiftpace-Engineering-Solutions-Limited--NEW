import React from 'react';
import {
  Briefcase,
  Building2,
  Compass,
  HardHat,
  Layers,
  Lightbulb,
  Ruler,
  ShieldCheck,
  Wrench
} from 'lucide-react';

export const AVAILABLE_SERVICE_ICONS = [
  'Compass',
  'HardHat',
  'Layers',
  'Briefcase',
  'Lightbulb',
  'Wrench',
  'Building2',
  'Ruler',
  'ShieldCheck'
] as const;

export function ServiceIcon({
  name,
  className = 'w-5 h-5'
}: {
  name?: string;
  className?: string;
}) {
  switch (name) {
    case 'Compass':
      return <Compass className={className} />;
    case 'HardHat':
      return <HardHat className={className} />;
    case 'Layers':
      return <Layers className={className} />;
    case 'Briefcase':
      return <Briefcase className={className} />;
    case 'Lightbulb':
      return <Lightbulb className={className} />;
    case 'Wrench':
      return <Wrench className={className} />;
    case 'Building2':
      return <Building2 className={className} />;
    case 'Ruler':
      return <Ruler className={className} />;
    case 'ShieldCheck':
      return <ShieldCheck className={className} />;
    default:
      return <Building2 className={className} />;
  }
}
