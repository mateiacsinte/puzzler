import { useState, useEffect } from "react";
import Chess from "chess.js";
import { Chessboard } from "react-chessboard";

// The board orientation is opposite to the FEN active color.
// (If FEN says white to move—opponent moves first—show black at the bottom.)
const orientationMap = {
  w: "black",
  b: "white",
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

  // Compute board size: on mobile, take the smaller of the viewport's width or height (minus a margin).
  // On larger screens, we use 40% of the viewport's width.
  const getBoardSize = () => {
    if (window.innerWidth < 768) {
      return Math.min(window.innerWidth, window.innerHeight) - 20;
    }
    return window.innerWidth * 0.4;
  };

  // 'index' holds the index of the next expected move in the puzzle.solution array.
  const [index, setSolutionIndex] = useState(0);
  const [puzzleIndex, setPuzzleIndex] = useState(0);
  const [currentTimeout, setCurrentTimeout] = useState(null);
  const [boardSize, setBoardSize] = useState(getBoardSize());
  const [game, setGame] = useState(new Chess(puzzle[puzzleIndex].fen));
  const [boardOrientation, setBoardOrientation] = useState("white");
  const [selectedSquare, setSelectedSquare] = useState(null);

  // Update boardSize on window resize.
  useEffect(() => {
    const handleResize = () => {
      setBoardSize(getBoardSize());
    };
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
    if (!selectedSquare) {
      const piece = game.get(square);
      if (piece && piece.color === game.turn()) {
        setSelectedSquare(square);
      }
      return;
    }
    const move = game.move({
      from: selectedSquare,
      to: square,
      promotion: "q", // default promotion to queen if applicable
    });
    setSelectedSquare(null);
    if (move === null) return;
    let moveUci = move.from + move.to;
    if (move.promotion) moveUci += move.promotion;
    console.log("Player move UCI:", moveUci);
    console.log("Expected UCI:", puzzle[puzzleIndex].solution[index]);

    if (moveUci === puzzle[puzzleIndex].solution[index]) {
      setGame(new Chess(game.fen()));
      const newTimeout = setTimeout(makeRandomMove, 500);
      setCurrentTimeout(newTimeout);
    } else {
      console.log("Incorrect move, reverting.");
      game.undo();
      setGame(new Chess(game.fen()));
    }
  }

  // Build customSquareStyles to highlight available moves for the selected piece.
  const customSquareStyles = {};
  if (selectedSquare) {
    const movesFromSelected = game.moves({ square: selectedSquare, verbose: true });
    movesFromSelected.forEach((move) => {
      if (move.flags.includes("c")) {
        customSquareStyles[move.to] = {
          boxShadow:
            "inset 4px 4px 0 rgba(128,128,128,0.8), inset -4px -4px 0 rgba(128,128,128,0.8), inset 4px -4px 0 rgba(128,128,128,0.8), inset -4px 4px 0 rgba(128,128,128,0.8)",
        };
      } else {
        customSquareStyles[move.to] = {
          background:
            "radial-gradient(circle, rgba(128,128,128,0.8) 10%, transparent 12%)",
          backgroundPosition: "center",
          backgroundSize: "100% 100%",
        };
      }
    });
    customSquareStyles[selectedSquare] = { background: "rgba(255,0,0,0.2)" };
  }

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        minHeight: "100vh",
        padding: "10px",
      }}
    >
      {/* The Chessboard will always be square, with boardSize computed above */}
      <Chessboard
        id="PlayVsRandom"
        boardWidth={boardSize}
        position={game.fen()}
        onSquareClick={onSquareClick}
        boardOrientation={boardOrientation}
        customBoardStyle={{
          borderRadius: "4px",
          boxShadow: "0 2px 10px rgba(0,0,0,0.5)",
        }}
        customSquareStyles={customSquareStyles}
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
