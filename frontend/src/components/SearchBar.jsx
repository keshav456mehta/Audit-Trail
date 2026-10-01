import React, { useState } from "react";
import "./SearchBar.css";

function SearchBar({ onSearch }) {
  const [containerId, setContainerId] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();
    if (containerId.trim()) {
      onSearch(containerId.trim());
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
      />
      <button type="submit" className="search-bar-button">
        Search
      </button>
    </form>
  );
}

export default SearchBar;