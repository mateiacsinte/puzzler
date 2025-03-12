import { useState, useEffect } from "react";
import Chess from "chess.js";
import { Chessboard } from "react-chessboard";

function ChessGame() {
    const puzzle = {
    "fen": "r1bqk2r/2p1bppp/p1np1n2/1p2p3/4P3/1B3N2/PPPP1PPP/RNBQR1K1 w kq - 0 8",
    "solution": ["c3", "O-O", "h3", "Nb8", "d4", "Nbd7"]
  }

  const [game, setGame] = useState(new Chess(puzzle.fen));
  const [index, setSolutionIndex] = useState(0);
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
    // const possibleMoves = game.moves();
    // console.log(possibleMoves)
    // if (game.game_over() || game.in_draw() || possibleMoves.length === 0) return;
    // const randomIndex = Math.floor(Math.random() * possibleMoves.length);
    // safeGameMutate((game) => game.move(possibleMoves[randomIndex]));
    setSolutionIndex((prevIndex) => {
      console.log("random triggered");
      console.log("move", puzzle.solution[index+1]);
      safeGameMutate((game) => game.move(puzzle.solution[index+1]));
      const newIndex = prevIndex + 2;
      return newIndex;
    });
  }

  function onDrop(sourceSquare, targetSquare, piece) {
    console.log("index", index)
    // Create a new game instance from current fen after making a move.
    const move = game.move({
      from: sourceSquare,
      to: targetSquare,
      promotion: piece[1]?.toLowerCase() ?? "q",
    });
    console.log("move", move)

    // If move is illegal, return false so the piece snaps back.
    if (move.san === puzzle.solution[index]){
      console.log("move san", move.san)
      console.log("puzz sol move", puzzle.solution[index])

      // Update game state by creating a new Chess instance from the new FEN.
      setGame(new Chess(game.fen()));


      //Execute a random move after a short delay.
      const newTimeout = setTimeout(makeRandomMove, 0);
      setCurrentTimeout(newTimeout);
      return true;
    }

    console.log("Incorrect move, reverting.");
    // Revert the incorrect move.
    game.undo();
    // Ensure the board state is updated after the undo.
    setGame(new Chess(game.fen()));
    return false;
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
