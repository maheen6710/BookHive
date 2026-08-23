import { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import './SearchHistoryPage.css';

export default function SearchHistoryPage() {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    fetchHistory();
  }, []);

  const fetchHistory = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await axios.get('http://localhost:5000/api/search-history', {
        headers: { Authorization: `Bearer ${token}` },
      });
      setHistory(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const deleteSearch = async (id) => {
    try {
      const token = localStorage.getItem('token');
      await axios.delete(`http://localhost:5000/api/search-history/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setHistory(history.filter(item => item._id !== id));
      setMessage('Search deleted');
      setTimeout(() => setMessage(''), 3000);
    } catch (err) {
      console.error(err);
    }
  };

  const clearAll = async () => {
    try {
      const token = localStorage.getItem('token');
      await axios.delete('http://localhost:5000/api/search-history', {
        headers: { Authorization: `Bearer ${token}` },
      });
      setHistory([]);
      setMessage('Search history cleared');
      setTimeout(() => setMessage(''), 3000);
    } catch (err) {
      console.error(err);
      setMessage('Failed to clear history');
      setTimeout(() => setMessage(''), 3000);
    }
  };

  const handleSearchClick = (query) => {
    navigate(`/search?q=${encodeURIComponent(query)}`);
  };

  if (loading) return <p className="history-loading">Loading search history...</p>;

  return (
    <div className="search-history-page">
      <div className="history-header">
        {history.length > 0 && (
          <button className="clear-all-btn" onClick={clearAll}>
            Clear All
          </button>
        )}
      </div>

      {message && <div className="history-message">{message}</div>}

      {history.length === 0 ? (
        <p className="history-empty">No searches yet.</p>
      ) : (
        <ul className="history-list">
          {history.map((item) => (
            <li key={item._id} className="history-item">
              <span
                className="history-query"
                onClick={() => handleSearchClick(item.query)}
              >
                <i className="fas fa-search"></i> {item.query}
              </span>
              <span className="history-time">
                {new Date(item.updatedAt).toLocaleString()}
              </span>
              <button
                className="history-delete"
                onClick={() => deleteSearch(item._id)}
              >
                <i className="fas fa-times"></i>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}