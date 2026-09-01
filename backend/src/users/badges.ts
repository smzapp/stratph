export interface ProfileBadge {
  id: string;
  label: string;
  icon: string;
  description: string;
}

export function computeBadges(input: {
  completedTrials: number;
  recommendationsCount: number;
  certificationsCount: number;
  profileCompleteness: number;
}): ProfileBadge[] {
  const badges: ProfileBadge[] = [];

  if (input.completedTrials >= 1) {
    badges.push({
      id: 'verified_performer',
      label: 'Verified Performer',
      icon: '✅',
      description: 'Completed at least one approved Trial Task.',
    });
  }
  if (input.completedTrials >= 3) {
    badges.push({
      id: 'top_performer',
      label: 'Top Performer',
      icon: '🏆',
      description: 'Completed 3 or more approved Trial Tasks.',
    });
  }
  if (input.recommendationsCount >= 1) {
    badges.push({
      id: 'recommended',
      label: 'Recommended by Employers',
      icon: '💬',
      description: 'Has at least one employer recommendation.',
    });
  }
  if (input.certificationsCount >= 1) {
    badges.push({
      id: 'certified',
      label: 'Certified',
      icon: '🎓',
      description: 'Lists at least one certification or credential.',
    });
  }
  if (input.profileCompleteness >= 90) {
    badges.push({
      id: 'complete_profile',
      label: 'Complete Profile',
      icon: '💯',
      description: 'Profile is 90% or more complete.',
    });
  }

  return badges;
}
