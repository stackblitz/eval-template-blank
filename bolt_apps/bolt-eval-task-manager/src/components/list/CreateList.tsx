import React, { useState } from 'react';
import { Button } from '../ui/Button';
import { Plus, X } from 'lucide-react';

interface CreateListProps {
  onSubmit: (title: string) => void;
  onCancel: () => void;
}

export function CreateList({ onSubmit, onCancel }: CreateListProps) {
  const [title, setTitle] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (title.trim()) {
      onSubmit(title.trim());
      setTitle('');
    }
  };

  return (
    <div className="bg-white rounded-xl p-3 w-80 flex-shrink-0 shadow-sm border">
      <form onSubmit={handleSubmit}>
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Enter list title..."
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 mb-3"
          autoFocus
        />
        <div className="flex space-x-2">
          <Button type="submit" size="sm" disabled={!title.trim()}>
            Add List
          </Button>
          <Button type="button" variant="ghost" size="sm" onClick={onCancel}>
            <X className="w-4 h-4" />
          </Button>
        </div>
      </form>
    </div>
  );
}