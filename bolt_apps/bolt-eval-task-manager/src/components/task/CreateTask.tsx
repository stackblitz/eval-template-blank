import React, { useState } from 'react';
import { Button } from '../ui/Button';
import { X } from 'lucide-react';

interface CreateTaskProps {
  onSubmit: (title: string) => void;
  onCancel: () => void;
}

export function CreateTask({ onSubmit, onCancel }: CreateTaskProps) {
  const [title, setTitle] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (title.trim()) {
      onSubmit(title.trim());
      setTitle('');
    }
  };

  return (
    <div className="bg-white rounded-lg p-3 shadow-sm border">
      <form onSubmit={handleSubmit}>
        <textarea
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Enter a title for this card..."
          className="w-full px-2 py-1 border-0 resize-none focus:outline-none text-sm"
          rows={3}
          autoFocus
        />
        <div className="flex items-center space-x-2 mt-2">
          <Button type="submit" size="sm" disabled={!title.trim()}>
            Add Card
          </Button>
          <Button type="button" variant="ghost" size="sm" onClick={onCancel}>
            <X className="w-4 h-4" />
          </Button>
        </div>
      </form>
    </div>
  );
}