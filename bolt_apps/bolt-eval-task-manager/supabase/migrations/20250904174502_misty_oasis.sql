/*
  # Task Management Application Schema

  1. New Tables
    - `boards`
      - `id` (uuid, primary key)
      - `title` (text, not null)
      - `description` (text)
      - `owner_id` (uuid, references auth.users)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)
    
    - `lists`
      - `id` (uuid, primary key)
      - `title` (text, not null)
      - `board_id` (uuid, references boards)
      - `position` (integer)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)
    
    - `tasks`
      - `id` (uuid, primary key)
      - `title` (text, not null)
      - `description` (text)
      - `list_id` (uuid, references lists)
      - `position` (integer)
      - `due_date` (timestamp)
      - `priority` (text, enum: low, medium, high)
      - `status` (text, enum: todo, in_progress, done)
      - `assignee_id` (uuid, references auth.users)
      - `created_by` (uuid, references auth.users)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)

  2. Security
    - Enable RLS on all tables
    - Users can only access boards they own
    - Users can only access lists and tasks from their boards
    - Cascading permissions for lists and tasks

  3. Indexes
    - Performance indexes on foreign keys and position columns
*/

-- Create boards table
CREATE TABLE IF NOT EXISTS boards (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text DEFAULT '',
  owner_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create lists table
CREATE TABLE IF NOT EXISTS lists (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  board_id uuid NOT NULL REFERENCES boards(id) ON DELETE CASCADE,
  position integer NOT NULL DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create tasks table
CREATE TABLE IF NOT EXISTS tasks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text DEFAULT '',
  list_id uuid NOT NULL REFERENCES lists(id) ON DELETE CASCADE,
  position integer NOT NULL DEFAULT 0,
  due_date timestamptz,
  priority text DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high')),
  status text DEFAULT 'todo' CHECK (status IN ('todo', 'in_progress', 'done')),
  assignee_id uuid REFERENCES auth.users(id),
  created_by uuid NOT NULL REFERENCES auth.users(id),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE boards ENABLE ROW LEVEL SECURITY;
ALTER TABLE lists ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;

-- Boards policies
CREATE POLICY "Users can view their own boards"
  ON boards FOR SELECT
  TO authenticated
  USING (owner_id = auth.uid());

CREATE POLICY "Users can create boards"
  ON boards FOR INSERT
  TO authenticated
  WITH CHECK (owner_id = auth.uid());

CREATE POLICY "Users can update their own boards"
  ON boards FOR UPDATE
  TO authenticated
  USING (owner_id = auth.uid())
  WITH CHECK (owner_id = auth.uid());

CREATE POLICY "Users can delete their own boards"
  ON boards FOR DELETE
  TO authenticated
  USING (owner_id = auth.uid());

-- Lists policies
CREATE POLICY "Users can view lists in their boards"
  ON lists FOR SELECT
  TO authenticated
  USING (board_id IN (SELECT id FROM boards WHERE owner_id = auth.uid()));

CREATE POLICY "Users can create lists in their boards"
  ON lists FOR INSERT
  TO authenticated
  WITH CHECK (board_id IN (SELECT id FROM boards WHERE owner_id = auth.uid()));

CREATE POLICY "Users can update lists in their boards"
  ON lists FOR UPDATE
  TO authenticated
  USING (board_id IN (SELECT id FROM boards WHERE owner_id = auth.uid()));

CREATE POLICY "Users can delete lists in their boards"
  ON lists FOR DELETE
  TO authenticated
  USING (board_id IN (SELECT id FROM boards WHERE owner_id = auth.uid()));

-- Tasks policies
CREATE POLICY "Users can view tasks in their boards"
  ON tasks FOR SELECT
  TO authenticated
  USING (list_id IN (
    SELECT l.id FROM lists l
    JOIN boards b ON l.board_id = b.id
    WHERE b.owner_id = auth.uid()
  ));

CREATE POLICY "Users can create tasks in their boards"
  ON tasks FOR INSERT
  TO authenticated
  WITH CHECK (list_id IN (
    SELECT l.id FROM lists l
    JOIN boards b ON l.board_id = b.id
    WHERE b.owner_id = auth.uid()
  ));

CREATE POLICY "Users can update tasks in their boards"
  ON tasks FOR UPDATE
  TO authenticated
  USING (list_id IN (
    SELECT l.id FROM lists l
    JOIN boards b ON l.board_id = b.id
    WHERE b.owner_id = auth.uid()
  ));

CREATE POLICY "Users can delete tasks in their boards"
  ON tasks FOR DELETE
  TO authenticated
  USING (list_id IN (
    SELECT l.id FROM lists l
    JOIN boards b ON l.board_id = b.id
    WHERE b.owner_id = auth.uid()
  ));

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_boards_owner_id ON boards(owner_id);
CREATE INDEX IF NOT EXISTS idx_lists_board_id ON lists(board_id);
CREATE INDEX IF NOT EXISTS idx_lists_position ON lists(position);
CREATE INDEX IF NOT EXISTS idx_tasks_list_id ON tasks(list_id);
CREATE INDEX IF NOT EXISTS idx_tasks_position ON tasks(position);
CREATE INDEX IF NOT EXISTS idx_tasks_assignee_id ON tasks(assignee_id);
CREATE INDEX IF NOT EXISTS idx_tasks_created_by ON tasks(created_by);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at
CREATE TRIGGER update_boards_updated_at BEFORE UPDATE ON boards
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_lists_updated_at BEFORE UPDATE ON lists
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_tasks_updated_at BEFORE UPDATE ON tasks
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();