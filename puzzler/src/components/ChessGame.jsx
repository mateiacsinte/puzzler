import { useState, useEffect } from "react";
import Chess from "chess.js";
import { Chessboard } from "react-chessboard";

// The board orientation is opposite to the FEN active color.
// (If FEN says white to move—opponent moves first—show black at the bottom.)
const orientationMap = {
  "w": "black",
  "b": "white",
};

function ChessGame() {
  const puzzle = [
    {
      fen: "8/4R3/1p2P3/p4r2/P6p/1P3Pk1/4K3/8 w - - 1 64",
      solution: ["e7f7", "f5e5", "e2f1", "e5e6"],
    },
    {
      fen: "r6k/pp2r2p/4Rp1Q/3p4/8/1N1P2R1/PqP2bPP/7K b - - 0 24",
      solution: ["f2g3", "e6e7", "b2b1", "b3c1", "b1c1", "h6c1"],
    },
    {
      fen: "5rk1/1p3ppp/pq3b2/8/8/1P1Q1N2/P4PPP/3R2K1 w - - 2 27",
      solution: ["d3d6", "f8d8", "d6d8", "f6d8"],
    },
  ];

  // 'index' holds the index of the next expected move in the puzzle.solution array.
  const [index, setSolutionIndex] = useState(0);
  const [puzzleIndex, setPuzzleIndex] = useState(0);
  const [currentTimeout, setCurrentTimeout] = useState(null);
  const [boardWidth, setBoardWidth] = useState(window.innerWidth * 0.4);
  const [game, setGame] = useState(new Chess(puzzle[puzzleIndex].fen));
  const [boardOrientation, setBoardOrientation] = useState("white");
  const [selectedSquare, setSelectedSquare] = useState(null);

  // Update boardWidth on window resize.
  useEffect(() => {
    const handleResize = () => setBoardWidth(window.innerWidth * 0.4);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // When the puzzleIndex changes, load the new puzzle.
  useEffect(() => {
    const newGame = new Chess(puzzle[puzzleIndex].fen);
    setGame(newGame);
    // Set board orientation opposite of the active color.
    setBoardOrientation(orientationMap[newGame.turn()]);
    // Optionally, make the first move of the solution after a delay.
    setTimeout(() => {
      safeGameMutate((g) =>
        g.move(parseUciMove(puzzle[puzzleIndex].solution[0]))
      );
    }, 500);
    // Start expecting the next move from the player's side.
    setSolutionIndex(1);
    setSelectedSquare(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [puzzleIndex]);


  // Helper: update the game state immutably.
  function safeGameMutate(modify) {
    setGame((g) => {
      const updatedGame = new Chess(g.fen());
      modify(updatedGame);
      return updatedGame;
    });
  }

  /**
   * Parses a UCI move string (e.g. "e2e4" or "e7e8q") into a move object.
   */
  function parseUciMove(uciMove) {
    if (uciMove.length < 4 || uciMove.length > 5) {
      throw new Error("Invalid UCI move format: " + uciMove);
    }
    const moveObj = {
      from: uciMove.slice(0, 2),
      to: uciMove.slice(2, 4),
    };
    if (uciMove.length === 5) {
      moveObj.promotion = uciMove[4];
    }
    return moveObj;
  }

  function makeRandomMove() {
    // In this context, "random move" means following the puzzle solution.
    setSolutionIndex((prevIndex) => {
      if (prevIndex < puzzle[puzzleIndex].solution.length - 1) {
        const nextUci = puzzle[puzzleIndex].solution[prevIndex + 1];
        console.log("Opponent move:", nextUci);
        safeGameMutate((g) => g.move(parseUciMove(nextUci)));
        return prevIndex + 2;
      } else {
        onNextPuzzle();
        return 0;
      }
    });
  }

  function onNextPuzzle() {
    const nextIndex = puzzleIndex + 1;
    if (nextIndex < puzzle.length) {
      setPuzzleIndex(nextIndex);
    } else {
      console.log("No more puzzles!");
    }
  }

  // onSquareClick: handles click-to-move.
  function onSquareClick(square) {
    console.log('triggggggggg', selectedSquare)
    // If no square is selected, and the square has a piece for the side to move, select it.
    if (!selectedSquare) {
      console.log('this is piece selection')
      const piece = game.get(square);
      if (piece && piece.color === game.turn()) {
        setSelectedSquare(square);
      }
      return;
    }

    // If a square is already selected, attempt a move from selectedSquare to the clicked square.
    const move = game.move({
      from: selectedSquare,
      to: square,
      promotion: "q", // default promotion to queen if applicable
    });

    // Clear selection regardless.
    setSelectedSquare(null);

    if (move === null) return; // Illegal move.

    // Construct UCI string for the move.
    let moveUci = move.from + move.to;
    if (move.promotion) moveUci += move.promotion;
    console.log("Player move UCI:", moveUci);
    console.log("Expected UCI:", puzzle[puzzleIndex].solution[index]);

    if (moveUci === puzzle[puzzleIndex].solution[index]) {
      // Correct move: update the game state (the game instance is already mutated).
      // For consistency, we clone it.
      setGame(new Chess(game.fen()));
      // Advance the expected move index.
      // Schedule the opponent move after a short delay.
      const newTimeout = setTimeout(makeRandomMove, 500);
      setCurrentTimeout(newTimeout);
    } else {
      console.log("Incorrect move, reverting.");
      game.undo();
      setGame(new Chess(game.fen()));
    }
  }

  return (
    <div style={{ textAlign: "center", padding: "20px" }}>
      <Chessboard
        id="PlayVsRandom"
        boardWidth={boardWidth}
        position={game.fen()}
        onSquareClick={onSquareClick}
        boardOrientation={boardOrientation}
        customBoardStyle={{
          borderRadius: "4px",
          boxShadow: "0 2px 10px rgba(0, 0, 0, 0.5)",
        }}
      />
      <div style={{ marginTop: "20px" }}>
        <button
          onClick={() => {
            safeGameMutate((g) => g.reset());
            clearTimeout(currentTimeout);
            setSelectedSquare(null);
          }}
        >
          Reset
        </button>
        <button
          onClick={() => {
            safeGameMutate((g) => g.undo());
            clearTimeout(currentTimeout);
            setSelectedSquare(null);
          }}
        >
          Undo
        </button>
        <button onClick={onNextPuzzle}>Next Puzzle</button>
      </div>
    </div>
  );
}

export default ChessGame;
