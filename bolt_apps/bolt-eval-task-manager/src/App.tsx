import React, { useState } from 'react';
import { AuthGuard } from './components/auth/AuthGuard';
import { BoardList } from './components/board/BoardList';
import { Board } from './components/board/Board';
import type { Board as BoardType } from './lib/types';

function App() {
  const [selectedBoard, setSelectedBoard] = useState<BoardType | null>(null);

  return (
    <AuthGuard>
      {selectedBoard ? (
        <Board
          board={selectedBoard}
          onBack={() => setSelectedBoard(null)}
          onBoardUpdate={setSelectedBoard}
        />
      ) : (
        <BoardList onSelectBoard={setSelectedBoard} />
      )}
    </AuthGuard>
  );
}

export default App;