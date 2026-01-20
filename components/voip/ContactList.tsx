import React, { useState, useMemo } from 'react';
import {
  Contact,
  filterContacts,
  sortContactsByStatus,
  getFavoriteContacts,
  getStatusColor,
  formatPhoneNumber
} from '../../types/voip';
import './ContactList.css';

interface ContactListProps {
  contacts: Contact[];
  onCall: (contact: Contact, withVideo: boolean) => void;
  onRefresh: () => void;
}

type FilterType = 'all' | 'favorites' | 'online';
type SortType = 'name' | 'status';

export const ContactList: React.FC<ContactListProps> = ({
  contacts,
  onCall,
  onRefresh
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filter, setFilter] = useState<FilterType>('all');
  const [sort, setSort] = useState<SortType>('name');
  const [refreshing, setRefreshing] = useState(false);

  // Filter and sort contacts
  const processedContacts = useMemo(() => {
    let result = filterContacts(contacts, searchTerm);

    // Apply filter
    switch (filter) {
      case 'favorites':
        result = getFavoriteContacts(result);
        break;
      case 'online':
        result = result.filter(c => c.status === 'online');
        break;
    }

    // Apply sort
    if (sort === 'status') {
      result = sortContactsByStatus(result);
    } else {
      result = [...result].sort((a, b) => a.name.localeCompare(b.name));
    }

    return result;
  }, [contacts, searchTerm, filter, sort]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await onRefresh();
    setTimeout(() => setRefreshing(false), 500);
  };

  const handleClearSearch = () => {
    setSearchTerm('');
  };

  return (
    <div className="contact-list" data-tour="voip-contacts">
      <div className="contact-controls">
        <div className="search-box" data-tour="contact-search">
          <span className="search-icon">🔍</span>
          <input
            type="text"
            placeholder="Search contacts..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          {searchTerm && (
            <button className="clear-search" onClick={handleClearSearch}>×</button>
          )}
        </div>

        <div className="filter-controls" data-tour="contact-filters">
          <div className="filter-group">
            <label>Filter:</label>
            <button
              className={`filter-btn ${filter === 'all' ? 'active' : ''}`}
              onClick={() => setFilter('all')}
            >
              All ({contacts.length})
            </button>
            <button
              className={`filter-btn ${filter === 'favorites' ? 'active' : ''}`}
              onClick={() => setFilter('favorites')}
            >
              ⭐ Favorites ({getFavoriteContacts(contacts).length})
            </button>
            <button
              className={`filter-btn ${filter === 'online' ? 'active' : ''}`}
              onClick={() => setFilter('online')}
            >
              🟢 Online ({contacts.filter(c => c.status === 'online').length})
            </button>
          </div>

          <div className="sort-group">
            <label>Sort:</label>
            <button
              className={`sort-btn ${sort === 'name' ? 'active' : ''}`}
              onClick={() => setSort('name')}
            >
              Name
            </button>
            <button
              className={`sort-btn ${sort === 'status' ? 'active' : ''}`}
              onClick={() => setSort('status')}
            >
              Status
            </button>
          </div>

          <button
            className={`btn-refresh ${refreshing ? 'refreshing' : ''}`}
            onClick={handleRefresh}
            disabled={refreshing}
          >
            🔄 Refresh
          </button>
        </div>
      </div>

      <div className="contacts-header">
        <h2>
          {filter === 'favorites' && '⭐ Favorite Contacts'}
          {filter === 'online' && '🟢 Online Contacts'}
          {filter === 'all' && '👥 All Contacts'}
        </h2>
        <span className="contact-count">{processedContacts.length} contacts</span>
      </div>

      {processedContacts.length === 0 ? (
        <div className="empty-state">
          <span className="empty-icon">📭</span>
          <h3>No contacts found</h3>
          <p>
            {searchTerm
              ? `No contacts match "${searchTerm}"`
              : filter === 'favorites'
              ? 'No favorite contacts yet'
              : filter === 'online'
              ? 'No contacts are currently online'
              : 'Add contacts to start calling'}
          </p>
        </div>
      ) : (
        <div className="contacts-grid">
          {processedContacts.map((contact, index) => (
            <div key={contact.id} className="contact-card" data-tour={index === 0 ? 'contact-card' : undefined}>
              <div className="contact-avatar-wrapper">
                {contact.avatar ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={contact.avatar} alt={contact.name} className="contact-avatar" />
                ) : (
                  <div className="contact-avatar-placeholder">
                    {contact.name.charAt(0).toUpperCase()}
                  </div>
                )}
                <span
                  className="contact-status-indicator"
                  ref={(el) => { if (el) el.style.backgroundColor = getStatusColor(contact.status); }}
                  title={contact.status}
                />
                {contact.favorite && (
                  <span className="contact-favorite-badge" title="Favorite">⭐</span>
                )}
              </div>

              <div className="contact-info">
                <h3 className="contact-name">{contact.name}</h3>
                <p className="contact-status">{contact.status}</p>
                
                {contact.email && (
                  <div className="contact-detail">
                    <span className="detail-icon">✉️</span>
                    <span className="detail-text">{contact.email}</span>
                  </div>
                )}
                
                {contact.phone && (
                  <div className="contact-detail">
                    <span className="detail-icon">📱</span>
                    <span className="detail-text">{formatPhoneNumber(contact.phone)}</span>
                  </div>
                )}

                {contact.tags.length > 0 && (
                  <div className="contact-tags">
                    {contact.tags.map(tag => (
                      <span key={tag} className="contact-tag">{tag}</span>
                    ))}
                  </div>
                )}
              </div>

              <div className="contact-actions" data-tour={index === 0 ? 'call-buttons' : undefined}>
                <button
                  className="btn-call btn-audio"
                  onClick={() => onCall(contact, false)}
                  title="Audio call"
                >
                  <span className="btn-icon">📞</span>
                  Audio
                </button>
                <button
                  className="btn-call btn-video"
                  onClick={() => onCall(contact, true)}
                  title="Video call"
                >
                  <span className="btn-icon">📹</span>
                  Video
                </button>
              </div>

              {contact.lastSeen && contact.status === 'offline' && (
                <div className="contact-last-seen">
                  Last seen: {new Date(contact.lastSeen).toLocaleString()}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
