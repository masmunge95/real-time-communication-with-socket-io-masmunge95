import React from 'react';
import { useChat } from '../context/ChatContext';
import { useUser } from '@clerk/clerk-react';
import { Search } from 'lucide-react';
import API_URL from '../config';

const SearchInput = () => {
  const { 
    searchTerm, 
    setSearchTerm, 
    setSearchResults, 
    setIsSearchActive, 
    setIsSearching,
    isSearching,
  } = useChat();
  const { user } = useUser();

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!searchTerm.trim()) return;

    setIsSearching(true);
    setIsSearchActive(true);

    try {
      const response = await fetch(`${API_URL}/api/messages/search?term=${searchTerm}&clerkId=${user.id}`);
      const results = await response.json();
      setSearchResults(results);
    } catch (error) {
      console.error("Failed to search messages:", error);
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  };

  return (
    <form onSubmit={handleSearch} className="search-container">
      <input type="text" placeholder="Search messages..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="search-input" />
      <button type="submit" className="search-button" disabled={isSearching}><Search size={18} /></button>
    </form>
  );
};

export default SearchInput;