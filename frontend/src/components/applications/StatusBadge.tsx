import React from 'react';
import { Badge } from '@/components/ui/badge';
import { ApplicationStatus } from '@/types';

interface StatusBadgeProps {
  status: ApplicationStatus | string;
}

export function StatusBadge({ status }: StatusBadgeProps) {
  switch (status) {
    case 'DRAFT':
      return <Badge variant="secondary">Draft</Badge>;
    case 'APPLIED':
      return <Badge variant="info">Applied</Badge>;
    case 'SCREENING':
      return <Badge variant="warning">Screening</Badge>;
    case 'INTERVIEW':
      return <Badge variant="default" className="bg-indigo-600">Interview</Badge>;
    case 'OFFER':
      return <Badge variant="success">Offer</Badge>;
    case 'REJECTED':
      return <Badge variant="destructive">Rejected</Badge>;
    case 'WITHDRAWN':
      return <Badge variant="outline">Withdrawn</Badge>;
    default:
      return <Badge variant="outline">{status}</Badge>;
  }
}
