'use client';

import { useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';

export default function ProjectHomeBoardPage() {
  const params = useParams();
  const router = useRouter();
  const projectId = typeof params.projectId === 'string' ? params.projectId : null;

  useEffect(() => {
    // Immediately redirect to play area without loading/fetching
    if (projectId) {
      console.log('🚀 [PROJECT PAGE] Redirecting immediately to play area:', projectId);
      router.replace(`/dashboard/projects/${projectId}/play`);
    }
  }, [projectId, router]);

  return null;
}
