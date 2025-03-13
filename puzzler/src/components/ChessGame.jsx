import { useState, useEffect } from "react";
import Chess from "chess.js";
import { Chessboard } from "react-chessboard";

function ChessGame() {
    const puzzle = [{
    "fen": "r6k/pp2r2p/4Rp1Q/3p4/8/1N1P2R1/PqP2bPP/7K b - - 0 24",
    "solution": ["f2g3", "e6e7", "b2b1", "b3c1", "b1c1", "h6c1"]
  },
  {
    fen: "5rk1/1p3ppp/pq3b2/8/8/1P1Q1N2/P4PPP/3R2K1 w - - 2 27",
    solution: ["d3d6", "f8d8", "d6d8", "f6d8"]
  }]


  const [index, setSolutionIndex] = useState(0);
  const [puzzleIndex, setPuzzleIndex] = useState(0)


  const [currentTimeout, setCurrentTimeout] = useState(null);
  const [boardWidth, setBoardWidth] = useState(window.innerWidth * 0.4);

  const [game, setGame] = useState(new Chess(puzzle[puzzleIndex].fen));


  useEffect(() => {
    setGame(new Chess(puzzle[puzzleIndex].fen));
    setTimeout(() => {
      safeGameMutate((game) =>
        game.move(parseUciMove(puzzle[puzzleIndex].solution[0]))
      );
    }, 500);
    setSolutionIndex(1);
  }, [puzzleIndex]);

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

  /**
 * Parses a UCI string (e.g., "e2e4" or "e7e8q") into a move object.
 * @param {string} uciMove - The UCI move string.
 * @returns {object} A move object with keys: from, to, and optionally promotion.
 */
function parseUciMove(uciMove) {
  if (uciMove.length < 4 || uciMove.length > 5) {
    throw new Error("Invalid UCI move format ", + uciMove);
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
    // const possibleMoves = game.moves();
    // console.log(possibleMoves)
    // if (game.game_over() || game.in_draw() || possibleMoves.length === 0) return;
    // const randomIndex = Math.floor(Math.random() * possibleMoves.length);
    // safeGameMutate((game) => game.move(possibleMoves[randomIndex]));
    setSolutionIndex((prevIndex) => {
      console.log("prevIndex", prevIndex)
      console.log("sol length",  puzzle[puzzleIndex].solution.length)
      if(prevIndex < puzzle[puzzleIndex].solution.length - 1){
        console.log("random triggered");
        console.log("move", puzzle[puzzleIndex].solution[index+1]);
        safeGameMutate((game) => game.move(parseUciMove(puzzle[puzzleIndex].solution[index+1])));
        const newIndex = prevIndex + 2;
        return newIndex
      }else{
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
      // Optionally loop back or handle end-of-puzzles
      console.log("No more puzzles!");
    }
  }

  function onDrop(sourceSquare, targetSquare, piece) {
    console.log("index", index)
    console.log("from square", sourceSquare)
    console.log("to square", targetSquare)
    console.log("piece", piece)
    // Create a new game instance from current fen after making a move.
    const move = game.move({
      from: sourceSquare,
      to: targetSquare,
      promotion: piece[1]?.toLowerCase() ?? "q",
    });
    console.log("move made by player", move)

    if (move === null) return false;

    let moveUci = move.from + move.to;
    if (move.promotion) {
      moveUci += move.promotion;
    }

    console.log("move uci", moveUci)
    console.log("puzz sol move", puzzle[puzzleIndex].solution[index])
    // If move is illegal, return false so the piece snaps back.
    if (moveUci === puzzle[puzzleIndex].solution[index]){

      // Update game state by creating a new Chess instance from the new FEN.
      setGame(new Chess(game.fen()));


      //Execute a random move after a short delay.
      const newTimeout = setTimeout(makeRandomMove, 100);
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
        <button onClick={onNextPuzzle}>Next Puzzle</button>
      </div>
    </div>
  );
}

export default ChessGame;
