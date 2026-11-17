import { useEffect, useState } from 'react';
import { getJson } from '../api/client.js';

interface Suggestion {
  title: string;
  focus: string;
  minutes: number;
  difficulty: string;
  reason: string;
}

interface ApiResponse {
  suggestions: Suggestion[];
}

export default function Workouts() {
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const userEmail = 'mona@example.com';
    getJson<ApiResponse>(`/api/workouts/suggestions/${encodeURIComponent(userEmail)}`)
      .then((data) => {
        setSuggestions(data.suggestions);
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message);
        setLoading(false);
      });
  }, []);

  return (
    <section className="card h-100">
      <div className="card-body">
        <h2 className="h4">Workout suggestions</h2>
        <p>Recommend workouts from activity patterns.</p>
        {loading && <p role="status">Loading workout suggestions...</p>}
        {error && <div role="alert" className="alert alert-danger">Unable to load suggestions: {error}</div>}
        {!loading && !error && suggestions.length === 0 && <p>No workout suggestions available.</p>}
        {!loading && !error && suggestions.length > 0 && (
          <div className="list-group">
            {suggestions.map((suggestion, index) => (
              <div key={index} className="list-group-item">
                <h5 className="mb-1">{suggestion.title}</h5>
                <p className="mb-1"><small className="text-muted">Focus: {suggestion.focus}</small></p>
                <p className="mb-1"><small className="text-muted">Duration: {suggestion.minutes} min • Difficulty: {suggestion.difficulty}</small></p>
                <p className="mb-0"><small>{suggestion.reason}</small></p>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
