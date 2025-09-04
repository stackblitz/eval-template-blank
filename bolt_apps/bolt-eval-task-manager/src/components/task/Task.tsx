import React, { useState } from 'react';
import { Draggable } from '@hello-pangea/dnd';
import { Calendar, Flag, User, MoreHorizontal } from 'lucide-react';
import { format } from 'date-fns';
import { TaskModal } from './TaskModal';
import type { Task as TaskType } from '../../lib/types';

interface TaskProps {
  task: TaskType;
  index: number;
  onUpdate: (task: TaskType) => void;
  onDelete: (taskId: string) => void;
}

export function Task({ task, index, onUpdate, onDelete }: TaskProps) {
  const [showModal, setShowModal] = useState(false);

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'bg-red-100 text-red-700 border-red-200';
      case 'medium': return 'bg-yellow-100 text-yellow-700 border-yellow-200';
      case 'low': return 'bg-green-100 text-green-700 border-green-200';
      default: return 'bg-gray-100 text-gray-700 border-gray-200';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'done': return 'bg-emerald-500';
      case 'in_progress': return 'bg-blue-500';
      default: return 'bg-gray-300';
    }
  };

  return (
    <>
      <Draggable draggableId={task.id} index={index}>
        {(provided, snapshot) => (
          <div
            ref={provided.innerRef}
            {...provided.draggableProps}
            {...provided.dragHandleProps}
            onClick={() => setShowModal(true)}
            className={`bg-white rounded-lg p-3 shadow-sm border border-gray-200 cursor-pointer hover:shadow-md transition-all duration-200 group ${
              snapshot.isDragging ? 'shadow-lg rotate-1' : ''
            }`}
          >
            <div className="flex items-start justify-between mb-2">
              <h4 className="font-medium text-gray-900 flex-1 group-hover:text-blue-600 transition-colors">
                {task.title}
              </h4>
              <button className="p-1 opacity-0 group-hover:opacity-100 hover:bg-gray-100 rounded transition-all">
                <MoreHorizontal className="w-3 h-3 text-gray-400" />
              </button>
            </div>

            {task.description && (
              <p className="text-sm text-gray-600 mb-3 line-clamp-2">
                {task.description}
              </p>
            )}

            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <div className={`w-2 h-2 rounded-full ${getStatusColor(task.status)}`}></div>
                <span className={`text-xs px-2 py-1 rounded-full border ${getPriorityColor(task.priority)}`}>
                  <Flag className="w-3 h-3 inline mr-1" />
                  {task.priority}
                </span>
              </div>

              <div className="flex items-center space-x-2 text-xs text-gray-500">
                {task.due_date && (
                  <div className="flex items-center">
                    <Calendar className="w-3 h-3 mr-1" />
                    {format(new Date(task.due_date), 'MMM dd')}
                  </div>
                )}
                {task.assignee_id && (
                  <div className="w-5 h-5 bg-blue-500 rounded-full flex items-center justify-center">
                    <User className="w-3 h-3 text-white" />
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </Draggable>

      <TaskModal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        task={task}
        onUpdate={onUpdate}
        onDelete={onDelete}
      />
    </>
  );
}