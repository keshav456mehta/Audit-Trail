import React, { useState } from "react";
import "./SearchBar.css";

function SearchBar({ onSearch }) {
  const [containerId, setContainerId] = useState("");
  const [isSearching, setIsSearching] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const trimmedId = containerId.trim();
    if (!trimmedId || isSearching) return;

    setIsSearching(true);
    try {
      await onSearch(trimmedId);
    } finally {
      setIsSearching(false);
    }
  };

  return (
    <form className="search-bar" onSubmit={handleSubmit}>
      <input
        type="text"
        className="search-bar-input"
        placeholder="Enter container ID..."
        value={containerId}
        onChange={(e) => setContainerId(e.target.value)}
        disabled={isSearching}
      />
      <button
        type="submit"
        className="search-bar-button"
        disabled={isSearching || !containerId.trim()}
      >
        {isSearching ? "Searching..." : "Search"}
      </button>
    </form>
  );
}

export default SearchBar;