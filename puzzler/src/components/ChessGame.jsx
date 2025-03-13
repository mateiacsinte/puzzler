import { useState, useEffect } from "react";
import Chess from "chess.js";
import { Chessboard } from "react-chessboard";

// Note: In your case, you want the board orientation to be opposite of the FEN active color.
const orientationMap = {
  "w": "black",  // If FEN says white to move (opponent moves first), show black at bottom.
  "b": "white",
};

function ChessGame() {
  const puzzle = [
    {
      fen: "8/4R3/1p2P3/p4r2/P6p/1P3Pk1/4K3/8 w - - 1 64",
      solution: ["e7f7","f5e5", "e2f1", "e5e6"]
    },
    {
      fen: "r6k/pp2r2p/4Rp1Q/3p4/8/1N1P2R1/PqP2bPP/7K b - - 0 24",
      solution: ["f2g3", "e6e7", "b2b1", "b3c1", "b1c1", "h6c1"]
    },
    {
      fen: "5rk1/1p3ppp/pq3b2/8/8/1P1Q1N2/P4PPP/3R2K1 w - - 2 27",
      solution: ["d3d6", "f8d8", "d6d8", "f6d8"]
    }
  ];

  // We'll use our own index for the solution moves.
  const [index, setSolutionIndex] = useState(0);
  const [puzzleIndex, setPuzzleIndex] = useState(0);
  const [currentTimeout, setCurrentTimeout] = useState(null);
  const [boardWidth, setBoardWidth] = useState(window.innerWidth * 0.4);
  const [game, setGame] = useState(new Chess(puzzle[puzzleIndex].fen));
  const [boardOrientation, setBoardOrientation] = useState("white");

  // On mount, we can set up listeners etc.
  useEffect(() => {
    const handleResize = () => setBoardWidth(window.innerWidth * 0.4);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // When the puzzleIndex changes, create a new game from the puzzle's fen
  useEffect(() => {
    const newGame = new Chess(puzzle[puzzleIndex].fen);
    setGame(newGame);
    // Set board orientation opposite of the active color in the FEN
    setBoardOrientation(orientationMap[newGame.turn()]);
    // Optionally, make the first move after a short delay
    setTimeout(() => {
      safeGameMutate((game) => game.move(parseUciMove(puzzle[puzzleIndex].solution[0])));
    }, 500);
    setSolutionIndex(1);
  }, [puzzleIndex]);

  function safeGameMutate(modify) {
    setGame((g) => {
      const updatedGame = new Chess(g.fen());
      modify(updatedGame);
      return updatedGame;
    });
  }

  /**
   * Parses a UCI move string (e.g., "e2e4" or "e7e8q") into a move object.
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
    setSolutionIndex((prevIndex) => {
      console.log("prevIndex", prevIndex);
      console.log("sol length", puzzle[puzzleIndex].solution.length);
      if (prevIndex < puzzle[puzzleIndex].solution.length - 1) {
        console.log("random triggered");
        console.log("move", puzzle[puzzleIndex].solution[index + 1]);
        safeGameMutate((game) =>
          game.move(parseUciMove(puzzle[puzzleIndex].solution[index + 1]))
        );
        const newIndex = prevIndex + 2;
        return newIndex;
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

  function onDrop(sourceSquare, targetSquare, piece) {
    console.log("index", index);
    console.log("from square", sourceSquare);
    console.log("to square", targetSquare);
    console.log("piece", piece);
    const move = game.move({
      from: sourceSquare,
      to: targetSquare,
      promotion: piece[1]?.toLowerCase() ?? "q",
    });
    console.log("move made by player", move);

    if (move === null) return false;

    let moveUci = move.from + move.to;
    if (move.promotion) {
      moveUci += move.promotion;
    }

    console.log("move uci", moveUci);
    console.log("puzz sol move", puzzle[puzzleIndex].solution[index]);
    if (moveUci === puzzle[puzzleIndex].solution[index]) {
      setGame(new Chess(game.fen()));
      const newTimeout = setTimeout(makeRandomMove, 100);
      setCurrentTimeout(newTimeout);
      return true;
    }

    console.log("Incorrect move, reverting.");
    game.undo();
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
        boardOrientation={boardOrientation}
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
        <button onClick={onNextPuzzle}>Next Puzzle</button>
      </div>
    </div>
  );
}

export default ChessGame;
