import React, { useState, useEffect } from 'react';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import { ArrowLeft, Plus, Settings } from 'lucide-react';
import { Button } from '../ui/Button';
import { List } from '../list/List';
import { CreateList } from '../list/CreateList';
import { BoardSettings } from './BoardSettings';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../hooks/useAuth';
import type { Board as BoardType, List as ListType, Task, DragResult } from '../../lib/types';

interface BoardProps {
  board: BoardType;
  onBack: () => void;
  onBoardUpdate: (board: BoardType) => void;
}

export function Board({ board, onBack, onBoardUpdate }: BoardProps) {
  const [lists, setLists] = useState<ListType[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateList, setShowCreateList] = useState(false);
  const [showBoardSettings, setShowBoardSettings] = useState(false);
  const [currentBoard, setCurrentBoard] = useState(board);

  const { user } = useAuth();

  useEffect(() => {
    fetchBoardData();
    setupRealtime();
  }, [board.id]);

  const fetchBoardData = async () => {
    try {
      // Fetch lists
      const { data: listsData, error: listsError } = await supabase
        .from('lists')
        .select('*')
        .eq('board_id', board.id)
        .order('position');

      if (listsError) throw listsError;

      // Fetch tasks
      const { data: tasksData, error: tasksError } = await supabase
        .from('tasks')
        .select('*')
        .in('list_id', listsData?.map(l => l.id) || [])
        .order('position');

      if (tasksError) throw tasksError;

      setLists(listsData || []);
      setTasks(tasksData || []);
    } catch (error) {
      console.error('Error fetching board data:', error);
    } finally {
      setLoading(false);
    }
  };

  const setupRealtime = () => {
    const channel = supabase
      .channel('board-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'lists' }, () => {
        fetchBoardData();
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'tasks' }, () => {
        fetchBoardData();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  };

  const createList = async (title: string) => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('lists')
        .insert([
          {
            title,
            board_id: board.id,
            position: lists.length,
          },
        ])
        .select()
        .single();

      if (error) throw error;
      setLists([...lists, data]);
    } catch (error) {
      console.error('Error creating list:', error);
    }
  };

  const updateList = async (list: ListType) => {
    try {
      const { error } = await supabase
        .from('lists')
        .update({ title: list.title })
        .eq('id', list.id);

      if (error) throw error;
      setLists(lists.map(l => l.id === list.id ? list : l));
    } catch (error) {
      console.error('Error updating list:', error);
    }
  };

  const createTask = async (listId: string, title: string) => {
    if (!user) return;

    try {
      const listTasks = tasks.filter(t => t.list_id === listId);
      const { data, error } = await supabase
        .from('tasks')
        .insert([
          {
            title,
            list_id: listId,
            position: listTasks.length,
            created_by: user.id,
          },
        ])
        .select()
        .single();

      if (error) throw error;
      setTasks([...tasks, data]);
    } catch (error) {
      console.error('Error creating task:', error);
    }
  };

  const updateTask = async (task: Task) => {
    try {
      const { error } = await supabase
        .from('tasks')
        .update({
          title: task.title,
          description: task.description,
          priority: task.priority,
          status: task.status,
          due_date: task.due_date,
        })
        .eq('id', task.id);

      if (error) throw error;
      setTasks(tasks.map(t => t.id === task.id ? task : t));
    } catch (error) {
      console.error('Error updating task:', error);
    }
  };

  const deleteTask = async (taskId: string) => {
    try {
      const { error } = await supabase
        .from('tasks')
        .delete()
        .eq('id', taskId);

      if (error) throw error;
      setTasks(tasks.filter(t => t.id !== taskId));
    } catch (error) {
      console.error('Error deleting task:', error);
    }
  };

  const onDragEnd = async (result: DragResult) => {
    const { destination, source, draggableId, type } = result;

    if (!destination) return;

    if (type === 'TASK') {
      const task = tasks.find(t => t.id === draggableId);
      if (!task) return;

      // Update local state immediately
      const newTasks = Array.from(tasks);
      const taskIndex = newTasks.findIndex(t => t.id === draggableId);
      const [movedTask] = newTasks.splice(taskIndex, 1);
      
      // Update task's list_id and position
      const updatedTask = {
        ...movedTask,
        list_id: destination.droppableId,
        position: destination.index,
      };

      // Insert at new position
      newTasks.splice(destination.index, 0, updatedTask);
      
      // Update positions for all affected tasks
      const affectedTasks = newTasks.filter(t => 
        t.list_id === destination.droppableId || t.list_id === source.droppableId
      );

      affectedTasks.forEach((task, index) => {
        const sameListTasks = affectedTasks.filter(t => t.list_id === task.list_id);
        const positionInList = sameListTasks.indexOf(task);
        task.position = positionInList;
      });

      setTasks(newTasks);

      // Update database
      try {
        const { error } = await supabase
          .from('tasks')
          .update({
            list_id: destination.droppableId,
            position: destination.index,
          })
          .eq('id', draggableId);

        if (error) throw error;
      } catch (error) {
        console.error('Error updating task position:', error);
        fetchBoardData(); // Refresh on error
      }
    }
  };

  const handleBoardUpdate = (updatedBoard: BoardType) => {
    setCurrentBoard(updatedBoard);
    onBoardUpdate(updatedBoard);
  };

  const handleBoardDelete = () => {
    onBack();
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 bg-blue-600 rounded-lg animate-pulse mx-auto mb-4"></div>
          <p className="text-gray-600">Loading board...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-sm shadow-sm border-b border-gray-200 sticky top-0 z-40">
        <div className="max-w-full px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Button variant="ghost" onClick={onBack} size="sm">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back
              </Button>
              <div>
                <h1 className="text-xl font-bold text-gray-900">{currentBoard.title}</h1>
                {currentBoard.description && (
                  <p className="text-sm text-gray-600">{currentBoard.description}</p>
                )}
              </div>
            </div>
            <Button variant="outline" size="sm" onClick={() => setShowBoardSettings(true)}>
              <Settings className="w-4 h-4 mr-2" />
              Board Settings
            </Button>
          </div>
        </div>
      </header>

      {/* Board Content */}
      <main className="p-6">
        <DragDropContext onDragEnd={onDragEnd}>
          <Droppable droppableId="board" direction="horizontal" type="LIST">
            {(provided) => (
              <div
                ref={provided.innerRef}
                {...provided.droppableProps}
                className="flex space-x-4 overflow-x-auto pb-4"
              >
                {lists.map((list, index) => {
                  const listTasks = tasks.filter(t => t.list_id === list.id)
                    .sort((a, b) => a.position - b.position);

                  return (
                    <List
                      key={list.id}
                      list={list}
                      tasks={listTasks}
                      index={index}
                      onUpdateList={updateList}
                      onDeleteList={() => {}}
                      onCreateTask={createTask}
                      onUpdateTask={updateTask}
                      onDeleteTask={deleteTask}
                    />
                  );
                })}
                {provided.placeholder}

                {showCreateList ? (
                  <CreateList
                    onSubmit={(title) => {
                      createList(title);
                      setShowCreateList(false);
                    }}
                    onCancel={() => setShowCreateList(false)}
                  />
                ) : (
                  <Button
                    variant="outline"
                    onClick={() => setShowCreateList(true)}
                    className="w-80 h-fit flex-shrink-0 border-dashed border-2 hover:bg-white hover:border-blue-300"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Add another list
                  </Button>
                )}
              </div>
            )}
          </Droppable>
        </DragDropContext>
      </main>

      <BoardSettings
        isOpen={showBoardSettings}
        onClose={() => setShowBoardSettings(false)}
        board={currentBoard}
        onUpdate={handleBoardUpdate}
        onDelete={handleBoardDelete}
      />
    </div>
  );
}