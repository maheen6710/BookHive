import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { FaCamera } from "react-icons/fa";
import ImageSearchModal from "./ImageSearchModal";
import "./NavbarSearch.css";

export default function NavbarSearch({ user }) { 
  const [query, setQuery]         = useState("");
  const [suggestions, setSuggestions] = useState([]);
  const [loading, setLoading]     = useState(false);
  const [showDrop, setShowDrop]   = useState(false);
  const [showImageSearch, setShowImageSearch] = useState(false);

  const wrapperRef  = useRef(null);
  const debounceRef = useRef(null);
  const navigate    = useNavigate();

  useEffect(() => {
    function onOutside(e) {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target))
        setShowDrop(false);
    }
    document.addEventListener("mousedown", onOutside);
    return () => document.removeEventListener("mousedown", onOutside);
  }, []);

  async function saveSearchQuery(queryStr) {
    if (!user || user.role !== "finder") return;
    const token = localStorage.getItem("token");
    if (!token) return;

    try {
      await axios.post(
        "http://localhost:5000/api/search-history",
        { query: queryStr.trim() },
        { headers: { Authorization: `Bearer ${token}` } }
      );
    } catch (err) {
      console.error("Failed to save search history:", err);
    }
  }

  function handleChange(e) {
    const val = e.target.value;
    setQuery(val);
    clearTimeout(debounceRef.current);

    if (!val.trim()) {
      setSuggestions([]);
      setShowDrop(false);
      return;
    }

    debounceRef.current = setTimeout(() => fetchSuggestions(val.trim()), 300);
  }

  async function fetchSuggestions(term) {
    try {
      setLoading(true);
      const res = await axios.get(
        `http://localhost:5000/api/books/suggestions?search=${encodeURIComponent(term)}`
      );
      setSuggestions(res.data);
      setShowDrop(true);
    } catch (err) {
      console.error("Suggestions error:", err);
      setSuggestions([]);
    } finally {
      setLoading(false);
    }
  }

  function handleSelect(title) {
    setQuery(title);
    setShowDrop(false);
    saveSearchQuery(title); 
    navigate(`/search?q=${encodeURIComponent(title)}`);
  }

  function handleKeyDown(e) {
    if (e.key === "Enter" && query.trim()) {
      setShowDrop(false);
      const q = query.trim();
      saveSearchQuery(q);
      navigate(`/search?q=${encodeURIComponent(q)}`);
    }
    if (e.key === "Escape") setShowDrop(false);
  }

  function highlightMatch(title) {
    const lc  = title.toLowerCase();
    const qt  = query.toLowerCase().trim();
    const idx = lc.indexOf(qt);
    if (idx === -1) return <span>{title}</span>;
    return (
      <>
        {title.slice(0, idx)}
        <strong>{title.slice(idx, idx + qt.length)}</strong>
        {title.slice(idx + qt.length)}
      </>
    );
  }

  return (
    <div className="ns-wrapper" ref={wrapperRef}>
      <div className="ns-input-row">
        <input
          className="ns-input"
          type="text"
          placeholder="Search for books, authors, or categories..."
          value={query}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          onFocus={() => { if (suggestions.length > 0) setShowDrop(true); }}
          autoComplete="off"
        />
        <button
          className="ns-btn"
          onClick={() => {
            if (query.trim()) {
              setShowDrop(false);
              const q = query.trim();
              saveSearchQuery(q);
              navigate(`/search?q=${encodeURIComponent(q)}`);
            }
          }}
        >
          <i className="fas fa-search"></i>
        </button>
        <button
          className="ns-camera-btn"
          type="button"
          title="Search by cover photo"
          aria-label="Search by cover photo"
          onClick={() => setShowImageSearch(true)}
        >
          <FaCamera />
        </button>
      </div>

      {showDrop && (
        <div className="ns-dropdown">

          {loading && (
            <div className="ns-spinner-row">
              <span className="ns-spinner"></span>
            </div>
          )}

          {!loading && suggestions.length === 0 && (
            <div className="ns-empty">No results for "{query}"</div>
          )}

          {!loading && suggestions.map((title, i) => (
            <div
              key={i}
              className="ns-suggestion"
              onMouseDown={() => handleSelect(title)}
            >
              <i className="fas fa-search ns-s-icon"></i>
              <span className="ns-s-text">{highlightMatch(title)}</span>
            </div>
          ))}

        </div>
      )}

      {showImageSearch && (
        <ImageSearchModal onClose={() => setShowImageSearch(false)} />
      )}
    </div>
  );
}