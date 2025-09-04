import React, { useState } from 'react';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Trash2, Edit3, Save } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import type { Board } from '../../lib/types';

interface BoardSettingsProps {
  isOpen: boolean;
  onClose: () => void;
  board: Board;
  onUpdate: (board: Board) => void;
  onDelete: () => void;
}

export function BoardSettings({ isOpen, onClose, board, onUpdate, onDelete }: BoardSettingsProps) {
  const [title, setTitle] = useState(board.title);
  const [description, setDescription] = useState(board.description || '');
  const [updating, setUpdating] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const handleUpdate = async () => {
    if (!title.trim()) return;

    setUpdating(true);
    try {
      const { data, error } = await supabase
        .from('boards')
        .update({
          title: title.trim(),
          description: description.trim(),
        })
        .eq('id', board.id)
        .select()
        .single();

      if (error) throw error;

      onUpdate(data);
      onClose();
    } catch (error) {
      console.error('Error updating board:', error);
    } finally {
      setUpdating(false);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm('Are you sure you want to delete this board? This action cannot be undone and will delete all lists and tasks.')) {
      return;
    }

    setDeleting(true);
    try {
      const { error } = await supabase
        .from('boards')
        .delete()
        .eq('id', board.id);

      if (error) throw error;

      onDelete();
      onClose();
    } catch (error) {
      console.error('Error deleting board:', error);
    } finally {
      setDeleting(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Board Settings" size="md">
      <div className="space-y-6">
        <div className="space-y-4">
          <Input
            label="Board Title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Enter board title"
            required
          />

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Description
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe what this board is for..."
              rows={4}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
            />
          </div>
        </div>

        <div className="border-t pt-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <Trash2 className="w-5 h-5 mr-2 text-red-500" />
            Danger Zone
          </h3>
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <p className="text-sm text-red-600 mb-3">
              Deleting this board will permanently remove all lists, tasks, and associated data. This action cannot be undone.
            </p>
            <Button
              variant="danger"
              onClick={handleDelete}
              loading={deleting}
              size="sm"
            >
              <Trash2 className="w-4 h-4 mr-2" />
              Delete Board
            </Button>
          </div>
        </div>

        <div className="flex justify-end space-x-3 pt-4 border-t">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button
            onClick={handleUpdate}
            loading={updating}
            disabled={!title.trim()}
          >
            <Save className="w-4 h-4 mr-2" />
            Save Changes
          </Button>
        </div>
      </div>
    </Modal>
  );
}