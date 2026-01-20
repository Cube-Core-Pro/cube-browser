"use client";

import React from 'react';
import { CollectionCard } from './CollectionCard';

interface Collection {
  id: string;
  title: string;
  description?: string;
  color: string;
  icon?: string;
  pages: CollectionPage[];
  created_at: number;
  updated_at: number;
  is_shared: boolean;
  share_code?: string;
}

interface CollectionPage {
  id: string;
  url: string;
  title: string;
  favicon?: string;
  preview_image?: string;
  notes?: string;
  date_added: number;
}

interface CollectionGridProps {
  collections: Collection[];
  viewMode: "grid" | "list";
  onDelete: (id: string) => void;
  onShare: (id: string) => void;
  onUpdate: () => void;
}

export const CollectionGrid: React.FC<CollectionGridProps> = ({
  collections,
  viewMode,
  onDelete,
  onShare,
  onUpdate
}) => {
  if (viewMode === "list") {
    return (
      <div className="space-y-3">
        {collections.map(collection => (
          <CollectionCard
            key={collection.id}
            collection={collection}
            viewMode="list"
            onDelete={onDelete}
            onShare={onShare}
            onUpdate={onUpdate}
          />
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
      {collections.map(collection => (
        <CollectionCard
          key={collection.id}
          collection={collection}
          viewMode="grid"
          onDelete={onDelete}
          onShare={onShare}
          onUpdate={onUpdate}
        />
      ))}
    </div>
  );
};
