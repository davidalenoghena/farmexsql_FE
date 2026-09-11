'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import { QueryResultsEditor } from '@/components/query-results-editor';
import { loadQueryResultsSession, type QueryResultsSession } from '@/lib/query-results-storage';

export default function QueryResultsPage() {
  const router = useRouter();
  const [session, setSession] = useState<QueryResultsSession | null>(null);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      router.replace('/');
      return;
    }

    const storedSession = loadQueryResultsSession();
    if (!storedSession) {
      router.replace('/');
      return;
    }

    setSession(storedSession);
    setIsReady(true);
  }, [router]);

  if (!isReady || !session) {
    return (
      <div className="flex h-screen items-center justify-center bg-slate-950 text-slate-100">
        <div className="flex items-center gap-2 text-sm text-slate-400">
          <Loader2 className="h-4 w-4 animate-spin text-primary-500" />
          <span>Loading editor...</span>
        </div>
      </div>
    );
  }

  return <QueryResultsEditor initialSession={session} />;
}
