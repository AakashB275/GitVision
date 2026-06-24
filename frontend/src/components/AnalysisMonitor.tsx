import { useEffect, useState } from 'react';
import { useParams } from 'react-router'

interface ProgressUpdate {
  type: 'progress' | 'completed' | 'error' | 'connected';
  stage?: string;
  progress?: number;
  message?: string;
  data?: any;
  error?: string;
}

export function AnalysisMonitor() {
  const { analysisId } = useParams<{ analysisId: string }>();
  const [progress, setProgress] = useState(0);
  const [stage, setStage] = useState('connecting...');
  const [error, setError] = useState<string | null>(null);
  const [isComplete, setIsComplete] = useState(false);

  useEffect(() => {
    const eventSource = new EventSource(
      `/api/analyses/${analysisId}/stream`
    );

    eventSource.onmessage = (event) => {
      try {
        const update: ProgressUpdate = JSON.parse(event.data);

        switch (update.type) {
          case 'progress':
            setProgress(update.progress || 0);
            setStage(update.stage || 'processing');
            setError(null);
            break;

          case 'completed':
            setProgress(100);
            setStage('Completed');
            setIsComplete(true);
            eventSource.close();
            break;

          case 'error':
            setError(update.error || 'Unknown error');
            eventSource.close();
            break;

          case 'connected':
            console.log('✓ Connected to analysis stream');
            break;
        }
      } catch (err) {
        console.error('Error parsing SSE message:', err);
      }
    };

    eventSource.onerror = () => {
      setError('Connection lost');
      eventSource.close();
    };

    return () => eventSource.close();
  }, [analysisId]);

  return (
    <div className="analysis-monitor">
      <h2>Analysis Progress</h2>
      
      <div className="progress-bar">
        <div 
          className="progress-fill" 
          style={{ width: `${progress}%` }}
        />
      </div>

      <div className="progress-info">
        <span className="progress-percentage">{progress}%</span>
        <span className="stage-label">{stage}</span>
      </div>

      {error && (
        <div className="error-message">
          <p>❌ {error}</p>
        </div>
      )}

      {isComplete && (
        <div className="success-message">
          <p>✓ Analysis completed successfully</p>
        </div>
      )}
    </div>
  );
}