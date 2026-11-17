import { useEffect, useState } from 'react';
import { getJson } from '../api/client.js';

interface Team {
  _id?: string;
  name: string;
  mascot?: string;
  members: string[];
}

interface ApiResponse {
  teams: Team[];
}

export default function Teams() {
  const [teams, setTeams] = useState<Team[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    getJson<ApiResponse>('/api/teams')
      .then((data) => {
        setTeams(data.teams);
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
        <h2 className="h4">Teams</h2>
        <p>Manage teams and members.</p>
        {loading && <p role="status">Loading teams...</p>}
        {error && <div role="alert" className="alert alert-danger">Unable to load teams: {error}</div>}
        {!loading && !error && teams.length === 0 && <p>No teams yet.</p>}
        {!loading && !error && teams.length > 0 && (
          <div className="list-group">
            {teams.map((team, index) => (
              <div key={team._id || index} className="list-group-item">
                <h5 className="mb-1">{team.name}</h5>
                <p className="mb-1 text-muted">{team.mascot}</p>
                <small>{team.members.length} member(s)</small>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
