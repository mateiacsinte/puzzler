import { useState, useEffect } from "react";
import Chess from "chess.js";
import { Chessboard } from "react-chessboard";

function ChessGame() {
  const [game, setGame] = useState(new Chess());
  const [currentTimeout, setCurrentTimeout] = useState(null);
  const [boardWidth, setBoardWidth] = useState(window.innerWidth * 0.4);



  // Update boardWidth when the window is resized
  useEffect(() => {
    const handleResize = () => setBoardWidth(window.innerWidth * 0.4);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  function safeGameMutate(modify) {
    setGame((g) => {
      const update = new Chess(g.fen());
      modify(update);
      return update;
    });
  }

  function makeRandomMove() {
    const possibleMoves = game.moves();
    console.log(possibleMoves)
    if (game.game_over() || game.in_draw() || possibleMoves.length === 0) return;
    const randomIndex = Math.floor(Math.random() * possibleMoves.length);
    safeGameMutate((game) => game.move(possibleMoves[randomIndex]));
  }

  function onDrop(sourceSquare, targetSquare, piece) {
    // Create a new game instance from current fen after making a move.
    const move = game.move({
      from: sourceSquare,
      to: targetSquare,
      promotion: piece[1]?.toLowerCase() ?? "q",
    });

    // If move is illegal, return false so the piece snaps back.
    if (move === null) return false;

    // Update game state by creating a new Chess instance from the new FEN.
    setGame(new Chess(game.fen()));

    // Execute a random move after a short delay.
    const newTimeout = setTimeout(makeRandomMove, 200);
    setCurrentTimeout(newTimeout);
    return true;
  }

  return (
    <div style={{ textAlign: "center", padding: "20px" }}>
      <Chessboard
        id="PlayVsRandom"
        boardWidth={boardWidth}
        position={game.fen()}
        onPieceDrop={onDrop}
        customBoardStyle={{
          borderRadius: "4px",
          boxShadow: "0 2px 10px rgba(0, 0, 0, 0.5)",
        }}
      />
      <div style={{ marginTop: "20px" }}>
        <button
          onClick={() => {
            safeGameMutate((game) => game.reset());
            clearTimeout(currentTimeout);
          }}
        >
          Reset
        </button>
        <button
          onClick={() => {
            safeGameMutate((game) => game.undo());
            clearTimeout(currentTimeout);
          }}
        >
          Undo
        </button>
      </div>
    </div>
  );
}

export default ChessGame;
