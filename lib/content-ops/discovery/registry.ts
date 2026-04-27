import type { DiscoveryFamily } from '@/lib/content-ops/discovery/families/types';
import { officialUpdateBriefingFamily } from '@/lib/content-ops/discovery/families/officialUpdateBriefing';
import { modSceneRadarFamily } from '@/lib/content-ops/discovery/families/modSceneRadar';

export const discoveryFamilies: DiscoveryFamily[] = [officialUpdateBriefingFamily, modSceneRadarFamily];

export function getDiscoveryFamilies(familyId?: string) {
  return familyId ? discoveryFamilies.filter((family) => family.id === familyId) : discoveryFamilies;
}
